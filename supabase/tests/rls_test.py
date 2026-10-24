"""
Security-rule tests for supabase/schema.sql, run against plain Postgres with the
Supabase stubs in supabase/tests/supabase_stub.sql.

    python3 supabase/tests/rls_test.py "host=/path/to/socket port=5544 user=postgres dbname=t"
"""
import sys, uuid
import psycopg2

DSN = sys.argv[1]
conn = psycopg2.connect(DSN)
conn.autocommit = True
cur = conn.cursor()
passed = failed = 0


def check(name, cond):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print("FAIL:", name)


def as_user(uid):
    cur.execute("reset role")
    if uid is None:
        cur.execute("set role anon; select set_config('request.jwt.claim.sub', '', false)")
    else:
        cur.execute("set role authenticated; select set_config('request.jwt.claim.sub', %s, false)", (str(uid),))


def as_service():
    cur.execute("reset role; set role service_role; select set_config('request.jwt.claim.sub', '', false)")


def as_postgres():
    cur.execute("reset role; select set_config('request.jwt.claim.sub', '', false)")


def q(sql, args=None):
    cur.execute(sql, args)
    try:
        return cur.fetchall()
    except psycopg2.ProgrammingError:
        return None


def fails(sql, args=None):
    try:
        cur.execute("savepoint s") if not conn.autocommit else None
        cur.execute(sql, args)
        return False
    except psycopg2.Error:
        return True


# --- users -------------------------------------------------------------------
as_postgres()
ids = {}
for name, meta in [
    ("alice", '{"name":"Alice","role":"client"}'),
    ("eve", '{"name":"Eve","role":"admin"}'),  # tries to sign up as admin
    ("bob", '{"name":"Bob","role":"lawyer"}'),
    ("carol", '{"name":"Carol","role":"lawyer"}'),
    ("admin", '{"name":"Admin"}'),
]:
    uid = uuid.uuid4()
    ids[name] = uid
    q("insert into auth.users (id, email, raw_user_meta_data) values (%s, %s, %s)", (str(uid), f"{name}@x.com", meta))
q("update public.profiles set role = 'admin' where email = 'admin@x.com'")

check("profile created by trigger", q("select count(*) from public.profiles")[0][0] == 5)
check("cannot sign up as admin", q("select role from public.profiles where email='eve@x.com'")[0][0] == "client")
check("lawyer role from metadata", q("select role from public.profiles where email='bob@x.com'")[0][0] == "lawyer")

# --- profile guard -----------------------------------------------------------
as_user(ids["alice"])
q("update public.profiles set role = 'admin', suspended = true, name = 'Alice A' where id = %s", (str(ids["alice"]),))
r = q("select role, suspended, name from public.profiles where id = %s", (str(ids["alice"]),))[0]
check("user can't make self admin", r[0] == "client" and r[1] is False)
check("user can edit own name", r[2] == "Alice A")
check("user can't see other profiles", q("select count(*) from public.profiles")[0][0] == 1)

# --- lawyers -----------------------------------------------------------------
for who in ("bob", "carol"):
    as_user(ids[who])
    q("""insert into public.lawyers (user_id, slug, name, status, rating, subaccount_code, consult_fee, booking_fee, scn)
         values (%s, %s, %s, 'approved', 1.0, 'ACCT_hack', 10000, 150000, 'SCN123')""",
      (str(ids[who]), who, who.title()))
    r = q("select status, rating, subaccount_code from public.lawyers where user_id = %s", (str(ids[who]),))[0]
    check(f"{who}: new lawyer forced to pending", r[0] == "pending")
    check(f"{who}: can't set own rating/payout", float(r[1]) == 5.0 and r[2] is None)
    q("update public.lawyers set status='approved' where user_id = %s", (str(ids[who]),))
    check(f"{who}: can't self-approve", q("select status from public.lawyers where user_id=%s", (str(ids[who]),))[0][0] == "pending")

as_user(None)
check("anon directory empty before approval", q("select count(*) from public.lawyer_directory")[0][0] == 0)
check("anon can't read lawyers table", q("select count(*) from public.lawyers")[0][0] == 0)

as_user(ids["admin"])
q("update public.lawyers set status = 'approved' where slug = 'bob'")
check("admin approves lawyer", q("select status from public.lawyers where slug='bob'")[0][0] == "approved")
bob_lawyer = q("select id from public.lawyers where slug='bob'")[0][0]

as_user(None)
dir_rows = q("select * from public.lawyer_directory")
cols = [d[0] for d in cur.description]
check("directory shows only approved", len(dir_rows) == 1)
check("directory hides private fields", "scn" not in cols and "subaccount_code" not in cols and "user_id" not in cols)

# --- reports + case board ----------------------------------------------------
as_user(ids["alice"])
shared = q("insert into public.reports (alias, category, setting, description) values ('Rose', 'Stalking', 'Work', 'He follows me') returning id")[0][0]
private = q("insert into public.reports (alias, category, setting, description, share_with_lawyers) values ('Rose', 'Online', 'Online', 'Private story', false) returning id")[0][0]
q("insert into public.evidence (report_id, name, kind, size, path) values (%s, 'a.png', 'image', 10, %s)", (shared, f"{ids['alice']}/{shared}/a.png"))
q("insert into public.evidence (report_id, name, kind, size, path) values (%s, 'b.png', 'image', 10, %s)", (private, f"{ids['alice']}/{private}/b.png"))
check("owner sees own reports", q("select count(*) from public.reports")[0][0] == 2)

as_user(ids["eve"])
check("other client can't read reports", q("select count(*) from public.reports")[0][0] == 0)
check("client sees no case board", q("select count(*) from public.case_board")[0][0] == 0)
check("client can't add evidence to others' report",
      fails("insert into public.evidence (report_id, name, kind, size, path) values (%s, 'x', 'doc', 1, 'x')", (shared,)))

as_user(ids["carol"])
check("pending lawyer sees no case board", q("select count(*) from public.case_board")[0][0] == 0)

as_user(ids["bob"])
board = q("select * from public.case_board")
cols = [d[0] for d in cur.description]
check("approved lawyer sees shared report only", [r[0] for r in board] == [shared])
check("case board hides reporter identity", "user_id" not in cols)
check("lawyer can't read reports table directly", q("select count(*) from public.reports")[0][0] == 0)
check("case evidence only for shared", [r[1] for r in q("select * from public.case_evidence")] == [shared])

# --- bids --------------------------------------------------------------------
as_user(ids["bob"])
q("insert into public.bids (report_id, lawyer_id, kind, fee, message) values (%s, %s, 'consultation', 10000, 'I can help')", (shared, str(bob_lawyer)))
check("approved lawyer can bid", q("select count(*) from public.bids")[0][0] == 1)
check("can't bid on private report",
      fails("insert into public.bids (report_id, lawyer_id, kind, fee, message) values (%s, %s, 'consultation', 1, 'x')", (private, str(bob_lawyer))))

as_user(ids["carol"])
carol_lawyer = q("select id from public.lawyers where slug='carol'")[0][0]
check("pending lawyer can't bid",
      fails("insert into public.bids (report_id, lawyer_id, kind, fee, message) values (%s, %s, 'consultation', 1, 'x')", (shared, str(carol_lawyer))))

as_user(ids["eve"])
check("other client can't see bids", q("select count(*) from public.bids")[0][0] == 0)

as_user(ids["alice"])
check("report owner sees bid", q("select count(*) from public.bids")[0][0] == 1)
q("update public.bids set status = 'accepted', fee = 1 where report_id = %s", (shared,))
r = q("select status, fee from public.bids where report_id = %s", (shared,))[0]
check("owner can accept bid", r[0] == "accepted")
check("owner can't change bid fee", r[1] == 10000)

# --- bookings + messages -----------------------------------------------------
as_user(ids["alice"])
check("clients can't create bookings directly",
      fails("insert into public.bookings (client_id, lawyer_id, client_name, kind, date, time, channel, fee, status) values (%s, %s, 'A', 'consultation', '2026-11-01', '10:00am', 'meet', 0, 'confirmed')",
            (str(ids["alice"]), str(bob_lawyer))))

as_service()
bk = q("""insert into public.bookings (client_id, lawyer_id, client_name, kind, date, time, channel, fee, status, report_id)
          values (%s, %s, 'Alice', 'consultation', '2026-11-01', '10:00am', 'meet', 10000, 'confirmed', %s) returning id""",
       (str(ids["alice"]), str(bob_lawyer), private))[0][0]

as_user(ids["bob"])
check("booked lawyer can see attached private report", private in [r[0] for r in q("select id from public.case_board")])
q("update public.bookings set meet_link = 'https://meet.google.com/abc-defg-hij', fee = 1, status = 'completed' where id = %s", (bk,))
r = q("select meet_link, fee, status from public.bookings where id = %s", (bk,))[0]
check("lawyer can set meet link", r[0] == "https://meet.google.com/abc-defg-hij")
check("lawyer can't change fee", r[1] == 10000)
check("lawyer can mark completed", r[2] == "completed")
q("insert into public.messages (booking_id, body) values (%s, 'Hello from Bob')", (bk,))

as_user(ids["alice"])
q("update public.bookings set fee = 1, status = 'cancelled' where id = %s", (bk,))
check("client can't edit booking", q("select fee, status from public.bookings where id=%s", (bk,))[0] == (10000, "completed"))
q("insert into public.messages (booking_id, body) values (%s, 'Hi Bob')", (bk,))
check("participants share the thread", q("select count(*) from public.messages")[0][0] == 2)

as_user(ids["eve"])
check("outsider can't read messages", q("select count(*) from public.messages")[0][0] == 0)
check("outsider can't post messages", fails("insert into public.messages (booking_id, body) values (%s, 'spam')", (bk,)))
check("outsider can't see booking", q("select count(*) from public.bookings")[0][0] == 0)

# --- moderation --------------------------------------------------------------
as_user(ids["admin"])
check("admin sees all reports", q("select count(*) from public.reports")[0][0] == 2)
q("update public.reports set hidden = true where id = %s", (shared,))
q("update public.profiles set suspended = true where email = 'eve@x.com'")

as_user(ids["bob"])
check("hidden report leaves case board", shared not in [r[0] for r in q("select id from public.case_board")])

as_user(ids["eve"])
check("suspended user can't file reports",
      fails("insert into public.reports (alias, category, setting, description) values ('x','x','x','x')"))

# --- storage -----------------------------------------------------------------
as_postgres()
q("update public.reports set hidden = false where id = %s", (shared,))
as_user(ids["alice"])
q("insert into storage.objects (bucket_id, name) values ('evidence', %s)", (f"{ids['alice']}/{shared}/a.png",))
q("insert into storage.objects (bucket_id, name) values ('evidence', %s)", (f"{ids['alice']}/{private}/b.png",))
check("can't upload into someone else's folder",
      fails("insert into storage.objects (bucket_id, name) values ('evidence', %s)", (f"{ids['bob']}/{shared}/c.png",)))
check("owner reads own files", q("select count(*) from storage.objects")[0][0] == 2)

as_user(ids["eve"])
check("outsider can't read evidence files", q("select count(*) from storage.objects")[0][0] == 0)

as_user(ids["bob"])
check("booked/approved lawyer reads permitted files", q("select count(*) from storage.objects")[0][0] == 2)

as_user(ids["carol"])
check("pending lawyer reads no files", q("select count(*) from storage.objects")[0][0] == 0)

# --- community ---------------------------------------------------------------
as_service()
q("insert into public.community_members (user_id, name, phone, status, joined_at, expires_at) values (%s, 'Alice', '0803', 'active', now(), now() + interval '1 year')", (str(ids["alice"]),))
as_user(None)
check("public community count", q("select public.community_count()")[0][0] == 1)
check("anon can't read members", fails("select * from public.community_members") or q("select count(*) from public.community_members")[0][0] == 0)
as_user(ids["eve"])
check("others can't read members", q("select count(*) from public.community_members")[0][0] == 0)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
