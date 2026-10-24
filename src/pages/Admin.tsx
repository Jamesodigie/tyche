import {
  Activity, BadgeCheck, Ban, CalendarHeart, Check, ChevronDown, Download, Eye, EyeOff, FileWarning, Gavel, HeartHandshake,
  LayoutDashboard, LogOut, RotateCcw, Search, Settings, ShieldCheck, Undo2, Users, Wallet, X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { EvidenceChip } from "../components/EvidenceChip";
import { Avatar, Badge, Button, Card, Field, Input, Notice, PasswordInput, Select, cx } from "../components/ui";
import {
  KIND_COPY, TYCHE_FEE, naira, timeAgo,
  type Lawyer,
} from "../lib/data";
import { useStore } from "../lib/store";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Admin data from the store, in the shape the screens below use. */
function useAdmin() {
  const st = useStore();
  const a = st.admin;
  const accounts = a?.accounts || [];
  const reports = a?.reports || [];
  return {
    ...st,
    allAccounts: accounts,
    lawyers: a?.lawyers || [],
    allReports: reports,
    allBookings: a?.bookings || [],
    payments: a?.payments || [],
    members: a?.members || [],
    adminLog: a?.log || [],
    hiddenReports: reports.filter((r) => r.hidden).map((r) => r.id),
    suspended: accounts.filter((x) => x.suspended).map((x) => x.email),
    isSuspended: (email: string) => !!accounts.find((x) => x.email === email)?.suspended,
  };
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Stat({ label, value, sub, icon: I, tone }: { label: string; value: ReactNode; sub?: ReactNode; icon: typeof Users; tone: string }) {
  return (
    <div className="min-w-0 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-plum-100 sm:rounded-4xl sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug text-plum-500 sm:text-sm">{label}</p>
        <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl", tone)}><I size={17} /></span>
      </div>
      <p className="mt-2 truncate font-display text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs leading-snug text-plum-400">{sub}</p>}
    </div>
  );
}

function SectionTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-plum-500 sm:text-base">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

function Table({ head, children, empty, mobile }: { head: string[]; children: ReactNode; empty?: boolean; mobile?: ReactNode }) {
  return (
    <>
    {mobile && <div className="grid gap-3 sm:grid-cols-2 xl:hidden [&>*]:min-w-0">{mobile}{empty && <Card className="p-8 text-center text-plum-400">Nothing here yet</Card>}</div>}
    <Card className={cx("overflow-hidden", !!mobile && "hidden xl:block")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm [&_td]:align-middle">
          <thead className="bg-plum-50 text-xs uppercase tracking-wide text-plum-500">
            <tr>{head.map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-plum-50">{children}</tbody>
        </table>
      </div>
      {empty && <p className="px-5 py-10 text-center text-plum-400">Nothing here yet</p>}
    </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// sign in
// ---------------------------------------------------------------------------

function AdminLogin() {
  const { adminSignIn, mode, user, signIn, signOut } = useStore();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (mode === "live")
    return (
      <div className="grid min-h-screen place-items-center bg-plum-900 px-4">
        <div className="w-full max-w-sm rounded-[2rem] bg-cream p-6 shadow-2xl sm:rounded-5xl sm:p-8">
          <img src="/tyche-logo.png" alt="Tyche" className="h-10" />
          <p className="mt-6 font-script text-2xl text-tangerine-500">team only</p>
          <h1 className="font-display text-3xl font-semibold text-ink">Tyche Admin</h1>
          {user ? (
            <div className="mt-6 space-y-4">
              <Notice>You're signed in as <b>{user.email}</b>, which isn't an admin account.</Notice>
              <Button className="w-full" variant="outline" onClick={() => signOut()}>Sign in with a different account</Button>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const error = await signIn(email, pw);
                setBusy(false);
                setMsg(error || "");
              }}
            >
              <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
              <Field label="Password"><PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>
              {msg && <Notice>{msg}</Notice>}
              <Button className="w-full" size="lg" disabled={busy}><ShieldCheck size={18} /> {busy ? "Signing in…" : "Sign in"}</Button>
            </form>
          )}
          <Link to="/" className="mt-6 block text-center text-sm text-plum-500 hover:underline">Back to Tyche</Link>
        </div>
      </div>
    );

  return (
    <div className="grid min-h-screen place-items-center bg-plum-900 px-5">
      <div className="w-full max-w-sm rounded-5xl bg-cream p-8 shadow-2xl">
        <img src="/tyche-logo.png" alt="Tyche" className="h-10" />
        <p className="mt-6 font-script text-2xl text-tangerine-500">team only</p>
        <h1 className="font-display text-3xl font-semibold text-ink">Tyche Admin</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); setErr(!adminSignIn?.(code)); }}
        >
          <Field label="Admin passcode">
            <Input type="password" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} autoFocus />
          </Field>
          {err && <p className="text-sm font-medium text-tangerine-600">That passcode isn't right.</p>}
          <Button className="w-full" size="lg"><ShieldCheck size={18} /> Enter dashboard</Button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm text-plum-500 hover:underline">Back to Tyche</Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// overview
// ---------------------------------------------------------------------------

function Overview() {
  const { allAccounts, lawyers, lawyerState, allReports, allBookings, adminLog, hiddenReports, suspended, payments, communityCount, communityCap } = useAdmin();
  const clients = allAccounts.filter((a) => a.role === "client");
  const pending = lawyers.filter((l) => lawyerState(l) === "pending");
  const approved = lawyers.filter((l) => lawyerState(l) === "approved");
  const paid = payments.filter((p) => p.status === "success");
  const gmv = paid.filter((p) => p.purpose === "booking").reduce((n, p) => n + p.amount, 0);
  const tycheRev = paid.reduce((n, p) => n + p.tycheShare, 0);

  const days = useMemo(() => {
    const out: { label: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const key = d.toDateString();
      out.push({ label: d.toLocaleDateString("en-GB", { day: "numeric" }), n: allAccounts.filter((a) => new Date(a.joinedAt).toDateString() === key).length });
    }
    return out;
  }, [allAccounts]);
  const max = Math.max(1, ...days.map((d) => d.n));

  return (
    <>
      <SectionTitle title="Overview" sub={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, team. Here's Tyche today.`} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Total users" value={allAccounts.length.toLocaleString()} sub={`${clients.length} clients · ${allAccounts.length - clients.length} lawyers`} icon={Users} tone="bg-plum-100 text-plum-600" />
        <Stat label="Lawyers awaiting approval" value={pending.length} sub={`${approved.length} approved and live`} icon={Gavel} tone="bg-tangerine-100 text-tangerine-600" />
        <Stat label="Reports" value={allReports.length} sub={`${hiddenReports.length} hidden by moderators`} icon={FileWarning} tone="bg-blush-200 text-plum-700" />
        <Stat label="Bookings" value={allBookings.length} sub={`${allBookings.filter((b) => b.status === "upcoming").length} upcoming`} icon={CalendarHeart} tone="bg-lagoon-100 text-lagoon-600" />
        <Stat label="Booking volume" value={naira(gmv)} sub="Paid by clients for sessions" icon={Wallet} tone="bg-plum-100 text-plum-600" />
        <Stat label="Tyche revenue" value={naira(tycheRev)} sub={`${TYCHE_FEE * 100}% of bookings + community fees`} icon={Wallet} tone="bg-tangerine-100 text-tangerine-600" />
        <Stat label="Community members" value={communityCount.toLocaleString()} sub={`${Math.max(0, communityCap - communityCount).toLocaleString()} of ${communityCap.toLocaleString()} spots left`} icon={HeartHandshake} tone="bg-lagoon-100 text-lagoon-600" />
        <Stat label="Suspended accounts" value={suspended.length} icon={Ban} tone="bg-blush-200 text-plum-700" />
      </div>

      <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-semibold text-ink">New sign-ups</p>
            <span className="text-sm text-plum-400">last 14 days</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1 sm:gap-2">
            {days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-plum-500">{d.n || ""}</span>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-plum-500 to-plum-300 transition-all" style={{ height: `${(d.n / max) * 140 + 4}px` }} />
                <span className="text-[11px] text-plum-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-semibold text-ink">Needs your attention</p>
            <Badge tone="warm">{pending.length}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {pending.slice(0, 4).map((l) => (
              <Link to="/admin/approvals" key={l.id} className="flex items-center gap-3 rounded-3xl bg-cream p-3 hover:bg-plum-50">
                <Avatar name={l.name} hue={l.hue} size={40} className="ring-2" />
                <span className="flex-1"><span className="block text-sm font-semibold text-ink">{l.name}</span><span className="text-xs text-plum-500">Lawyer application · {l.state}</span></span>
                <ChevronDown className="-rotate-90 text-plum-300" size={18} />
              </Link>
            ))}
            {!pending.length && <p className="rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600">All caught up — no lawyers waiting. 🎉</p>}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card className="p-6">
          <p className="font-display text-xl font-semibold text-ink">Latest reports</p>
          <div className="mt-4 space-y-2">
            {allReports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-3xl p-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blush-100 text-plum-600"><FileWarning size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{r.id} · {r.category}</span><span className="text-xs text-plum-500">{r.setting} · {r.state} · {timeAgo(r.createdAt)}</span></span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-ink"><Activity size={18} /> Admin activity</p>
          <div className="mt-4 space-y-2">
            {adminLog.length ? adminLog.slice(0, 6).map((a, i) => (
              <p key={i} className="flex justify-between gap-4 rounded-2xl bg-cream px-4 py-2.5 text-sm"><span className="text-ink">{a.text}</span><span className="shrink-0 text-plum-400">{timeAgo(a.at)}</span></p>
            )) : <p className="text-sm text-plum-400">Approvals, suspensions and moderation actions will show here.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// lawyer approvals
// ---------------------------------------------------------------------------

function LawyerRow({ l }: { l: Lawyer }) {
  const { lawyerState, reviewLawyer, allAccounts, licenceUrl, mode } = useAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const decide = async (d: "approved" | "rejected") => {
    setBusy(true);
    await reviewLawyer(l.id, d);
    setBusy(false);
  };
  const viewLicence = async () => {
    const w = window.open("", "_blank", "noopener");
    const url = await licenceUrl(l.id);
    if (url && w) w.location.href = url;
    else { w?.close(); alert("No licence uploaded yet."); }
  };
  const st = lawyerState(l);
  const acct = allAccounts.find((a) => a.lawyerId === l.id);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={l.name} hue={l.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-semibold text-ink">{l.name}</p>
            <Badge tone={st === "approved" ? "teal" : st === "pending" ? "warm" : "plum"}>{st}</Badge>
          </div>
          <p className="text-sm text-plum-500">{l.city}, {l.state} · Called {l.yearCalled} · {l.areas.slice(0, 2).join(", ")}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button onClick={() => setOpen(!open)} className="min-h-[40px] rounded-full px-3 py-2 text-sm font-semibold text-plum-600 hover:bg-plum-50">{open ? "Hide" : "Details"}</button>
          {st !== "approved" && <Button size="sm" variant="teal" disabled={busy} onClick={() => decide("approved")}><Check size={16} /> Approve</Button>}
          {st !== "rejected" && <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("rejected")}><X size={16} /> {st === "approved" ? "Revoke" : "Reject"}</Button>}
        </div>
      </div>
      {open && (
        <div className="mt-4 grid gap-3 rounded-3xl bg-cream p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-plum-400">Email</p><p className="break-all font-medium text-ink">{acct?.email || "—"}</p></div>
          <div><p className="text-plum-400">Consultation</p><p className="font-medium text-ink">{l.consultFree ? "Free" : naira(l.consultFee)}</p></div>
          <div><p className="text-plum-400">Booking</p><p className="font-medium text-ink">{l.bookingFree ? "Free" : naira(l.bookingFee)}</p></div>
          <div><p className="text-plum-400">Availability</p><p className="font-medium text-ink">{l.days.join(", ")} · {l.from}–{l.to}</p></div>
          <div className="sm:col-span-2 lg:col-span-4"><p className="text-plum-400">Bio</p><p className="text-ink">{l.bio}</p></div>
          <div className="sm:col-span-2 lg:col-span-4 rounded-2xl bg-white p-3 text-plum-600">
            Before approving: confirm the enrolment number with the NBA / Supreme Court roll and check the uploaded call-to-bar certificate.
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-4">
            {mode === "live" && <button onClick={viewLicence} className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">{l.hasLicence ? "View uploaded licence" : "No licence uploaded yet"}</button>}
            {st === "approved" && <Link to={`/lawyers/${l.id}`} className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Open public profile</Link>}
            <span className="text-plum-500">Payouts: {l.payoutReady ? `${l.payoutBank || "bank"} ····${l.payoutLast4 || ""}` : "not set up"}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Approvals() {
  const { lawyers, lawyerState } = useAdmin();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const counts = { pending: 0, approved: 0, rejected: 0 };
  lawyers.forEach((l) => counts[lawyerState(l)]++);
  const list = lawyers.filter((l) => lawyerState(l) === tab);
  return (
    <>
      <SectionTitle title="Lawyer approvals" sub="Only approved lawyers appear to clients and can see the case board." />
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold capitalize", tab === t ? "bg-plum-600 text-white" : "bg-white text-plum-600 ring-1 ring-plum-100")}>
            {t} <span className="ml-1 opacity-70">{counts[t]}</span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((l) => <LawyerRow key={l.id} l={l} />)}
        {!list.length && <Card className="p-10 text-center text-plum-400">No {tab} lawyers.</Card>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

function UsersView() {
  const { allAccounts, isSuspended, setSuspended, lawyers, lawyerState, user } = useAdmin();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const list = allAccounts.filter(
    (a) =>
      (!q || (a.name + a.email).toLowerCase().includes(q.toLowerCase())) &&
      (!role || a.role === role) &&
      (!status || (status === "suspended" ? isSuspended(a.email) : !isSuspended(a.email))),
  );
  return (
    <>
      <SectionTitle title="Users" sub={`${allAccounts.length} accounts`}>
        <Button variant="outline" size="sm" onClick={() => downloadCsv("tyche-users.csv", [["Name", "Email", "Role", "State", "Joined", "Status"], ...list.map((a) => [a.name, a.email, a.role, a.state, fmtDate(a.joinedAt), isSuspended(a.email) ? "suspended" : "active"])])}>
          <Download size={16} /> Export CSV
        </Button>
      </SectionTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative col-span-2 md:col-span-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-plum-300" size={18} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-11" /></div>
        <Select value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="client">Clients</option><option value="lawyer">Lawyers</option></Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></Select>
      </div>
      <Table
        head={["User", "Role", "State", "Joined", "Status", ""]}
        empty={!list.length}
        mobile={list.map((a) => {
          const susp = isSuspended(a.email);
          const l = a.lawyerId ? lawyers.find((x) => x.id === a.lawyerId) : undefined;
          return (
            <Card key={a.id} className={cx("p-4", susp && "bg-blush-50")}>
              <div className="flex items-center gap-3">
                <Avatar name={a.name} hue={a.role === "lawyer" ? l?.hue ?? 185 : 330} size={44} className="ring-2" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.name}</p>
                  <p className="truncate text-xs text-plum-400">{a.email}</p>
                </div>
                {susp ? <Badge tone="warm">Suspended</Badge> : <Badge tone="teal">Active</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-plum-500">
                <Badge tone={a.role === "lawyer" ? "teal" : "blush"}>{a.role}{l && lawyerState(l) !== "approved" ? ` · ${lawyerState(l)}` : ""}</Badge>
                <span>{a.state}</span>
                <span>Joined {fmtDate(a.joinedAt)}</span>
              </div>
              <button disabled={a.id === user?.id || a.role === "admin"} onClick={() => setSuspended(a, !susp)} className={cx("mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold", susp ? "bg-lagoon-50 text-lagoon-600" : "bg-blush-100 text-plum-700")}>
                {susp ? <><Undo2 size={15} /> Restore account</> : <><Ban size={15} /> Suspend account</>}
              </button>
            </Card>
          );
        })}
      >
        {list.map((a) => {
          const susp = isSuspended(a.email);
          const l = a.lawyerId ? lawyers.find((x) => x.id === a.lawyerId) : undefined;
          return (
            <tr key={a.id} className={susp ? "bg-blush-50/60" : ""}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} hue={a.role === "lawyer" ? l?.hue ?? 185 : 330} size={36} className="ring-2" />
                  <span><span className="block font-semibold text-ink">{a.name}</span><span className="text-xs text-plum-400">{a.email}</span></span>
                </div>
              </td>
              <td className="px-5 py-3">
                <Badge tone={a.role === "lawyer" ? "teal" : "blush"}>{a.role}</Badge>
                {l && lawyerState(l) !== "approved" && <span className="ml-1 text-xs text-tangerine-600">({lawyerState(l)})</span>}
              </td>
              <td className="px-5 py-3 text-plum-600">{a.state}</td>
              <td className="px-5 py-3 text-plum-600">{fmtDate(a.joinedAt)}</td>
              <td className="px-5 py-3">{susp ? <Badge tone="warm">Suspended</Badge> : <Badge tone="teal">Active</Badge>}</td>
              <td className="px-5 py-3 text-right">
                <button disabled={a.id === user?.id || a.role === "admin"} onClick={() => setSuspended(a, !susp)} className={cx("inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold", susp ? "bg-lagoon-50 text-lagoon-600" : "bg-blush-100 text-plum-700 hover:bg-blush-200")}>
                  {susp ? <><Undo2 size={13} /> Restore</> : <><Ban size={13} /> Suspend</>}
                </button>
              </td>
            </tr>
          );
        })}
      </Table>
      <p className="mt-3 text-xs text-plum-400">Sample accounts are included so the dashboard has data before the backend is connected.</p>
    </>
  );
}

// ---------------------------------------------------------------------------
// reports moderation
// ---------------------------------------------------------------------------

function ReportsView() {
  const { allReports, hiddenReports, setReportHidden } = useAdmin();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <SectionTitle title="Reports" sub="Hide a report to remove it from the lawyer case board (e.g. spam or unsafe content). The person who filed it can still see it." />
      <Table
        head={["Report", "Type", "Where", "Evidence", "Visibility", ""]}
        empty={!allReports.length}
        mobile={allReports.map((r) => {
          const hidden = hiddenReports.includes(r.id);
          return (
            <Card key={r.id} className={cx("p-4", hidden && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.id} <span className="font-normal text-plum-400">· “{r.alias}”</span></p>
                  <p className="text-xs text-plum-400">{r.setting} · {r.state} · {timeAgo(r.createdAt)}</p>
                </div>
                {!r.shareWithLawyers ? <Badge tone="plum">Private</Badge> : hidden ? <Badge tone="warm">Hidden</Badge> : <Badge tone="teal">Live</Badge>}
              </div>
              <p className="mt-2 text-sm font-medium text-plum-700">{r.category}</p>
              {open === r.id && (
                <div className="mt-2 rounded-2xl bg-cream p-3 text-sm text-ink">
                  <p>{r.description}</p>
                  {r.evidence.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{r.evidence.map((e) => <EvidenceChip key={e.id} e={e} />)}</div>}
                </div>
              )}
              <p className="mt-2 text-xs text-plum-500">{r.evidence.length} evidence file(s)</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="min-h-[40px] rounded-full bg-plum-50 text-sm font-semibold text-plum-700">{open === r.id ? "Close" : "Read"}</button>
                {r.shareWithLawyers ? (
                  <button onClick={() => setReportHidden(r.id, !hidden)} className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-blush-100 text-sm font-semibold text-plum-700">
                    {hidden ? <><Eye size={15} /> Restore</> : <><EyeOff size={15} /> Hide</>}
                  </button>
                ) : <span />}
              </div>
            </Card>
          );
        })}
      >
        {allReports.map((r) => {
          const hidden = hiddenReports.includes(r.id);
          return (
            <Fragment key={r.id}>
              <tr className={hidden ? "opacity-60" : ""}>
                <td className="px-5 py-3"><span className="block font-semibold text-ink">{r.id}</span><span className="text-xs text-plum-400">“{r.alias}” · {timeAgo(r.createdAt)}</span></td>
                <td className="max-w-[220px] px-5 py-3 text-plum-700"><span className="line-clamp-2">{r.category}</span></td>
                <td className="px-5 py-3 text-plum-600">{r.setting}<br /><span className="text-xs">{r.state}</span></td>
                <td className="px-5 py-3 text-plum-600">{r.evidence.length}</td>
                <td className="px-5 py-3">{!r.shareWithLawyers ? <Badge tone="plum">Private</Badge> : hidden ? <Badge tone="warm">Hidden</Badge> : <Badge tone="teal">On case board</Badge>}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button onClick={() => setOpen(open === r.id ? null : r.id)} className="rounded-full px-3.5 py-2 text-xs font-semibold text-plum-600 hover:bg-plum-50">{open === r.id ? "Close" : "Read"}</button>
                  {r.shareWithLawyers && (
                    <button onClick={() => setReportHidden(r.id, !hidden)} className="ml-1 inline-flex items-center gap-1 rounded-full bg-plum-50 px-3 py-1.5 text-xs font-semibold text-plum-700 hover:bg-plum-100">
                      {hidden ? <><Eye size={13} /> Restore</> : <><EyeOff size={13} /> Hide</>}
                    </button>
                  )}
                </td>
              </tr>
              {open === r.id && (
                <tr>
                  <td colSpan={6} className="bg-cream px-5 py-4 text-sm">
                    <p className="text-ink">{r.description}</p>
                    <p className="mt-2 text-plum-500">Wants: {r.wants.join(", ") || "—"} · Formal report: {r.authorities.join(", ") || "not requested"}</p>
                    {r.evidence.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.evidence.map((e) => <EvidenceChip key={e.id} e={e} />)}</div>}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </Table>
    </>
  );
}

// ---------------------------------------------------------------------------
// bookings & payments
// ---------------------------------------------------------------------------

function Payments() {
  const { allBookings, lawyers, payments } = useAdmin();
  const [kind, setKind] = useState("");
  const payByBooking = new Map(payments.filter((p) => p.bookingId).map((p) => [p.bookingId!, p]));
  const list = allBookings.filter((b) => !kind || b.kind === kind);
  const ok = payments.filter((p) => p.status === "success");
  const sessions = ok.filter((p) => p.purpose === "booking");
  const gross = sessions.reduce((n, p) => n + p.amount, 0);
  const tyche = sessions.reduce((n, p) => n + p.tycheShare, 0);
  const lawyersShare = sessions.reduce((n, p) => n + p.lawyerShare, 0);
  const community = ok.filter((p) => p.purpose === "community").reduce((n, p) => n + p.amount, 0);
  const name = (id: string) => lawyers.find((l) => l.id === id)?.name || "—";
  const statusOf = (b: (typeof list)[number]) =>
    b.status === "pending_payment" ? "Awaiting payment" : b.status === "cancelled" ? "Cancelled" : b.status === "done" ? "Completed" : b.fee ? "Paid · upcoming" : "Free · upcoming";
  return (
    <>
      <SectionTitle title="Bookings & payments" sub="Every session booked through Tyche, with the Paystack split.">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="!w-44 py-2"><option value="">All types</option><option value="consultation">Consultations</option><option value="booking">Bookings</option></Select>
        <Button variant="outline" size="sm" onClick={() => downloadCsv("tyche-payments.csv", [["Booking", "Date", "Client", "Lawyer", "Type", "Fee", "Tyche", "Lawyer share", "Status", "Paystack ref"], ...list.map((b) => { const p = payByBooking.get(b.id); return [b.id, b.date, b.clientName, name(b.lawyerId), b.kind, b.fee, p?.tycheShare ?? 0, p?.lawyerShare ?? 0, statusOf(b), p?.reference || ""]; })])}>
          <Download size={16} /> Export CSV
        </Button>
      </SectionTitle>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Clients paid (sessions)" value={naira(gross)} icon={Wallet} tone="bg-plum-100 text-plum-600" />
        <Stat label={`Tyche share (${TYCHE_FEE * 100}%)`} value={naira(tyche)} icon={Wallet} tone="bg-tangerine-100 text-tangerine-600" />
        <Stat label="Lawyers' share" value={naira(lawyersShare)} sub="Sent by Paystack to lawyers with payout accounts" icon={Wallet} tone="bg-lagoon-100 text-lagoon-600" />
        <Stat label="Community fees" value={naira(community)} icon={HeartHandshake} tone="bg-blush-200 text-plum-700" />
      </div>
      <Table
        head={["Booking", "Date", "Client", "Lawyer", "Type", "Fee", "Tyche", "Lawyer", "Status"]}
        empty={!list.length}
        mobile={list.map((b) => {
          const p = payByBooking.get(b.id);
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{b.clientName} → {name(b.lawyerId)}</p>
                  <p className="text-xs text-plum-400">{KIND_COPY[b.kind].title} · {new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · <span className="font-mono">{b.id}</span></p>
                </div>
                <Badge tone={b.status === "pending_payment" ? "warm" : b.status === "done" ? "plum" : "teal"}>{statusOf(b)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs [&>*]:min-w-0">
                <div className="rounded-2xl bg-cream p-2"><p className="text-plum-400">Fee</p><p className="truncate text-[13px] font-semibold text-ink">{b.fee ? naira(b.fee) : "Free"}</p></div>
                <div className="rounded-2xl bg-tangerine-50 p-2"><p className="text-plum-400">Tyche</p><p className="truncate text-[13px] font-semibold text-tangerine-600">{naira(p?.tycheShare ?? 0)}</p></div>
                <div className="rounded-2xl bg-lagoon-50 p-2"><p className="text-plum-400">Lawyer</p><p className="truncate text-[13px] font-semibold text-lagoon-600">{naira(p?.lawyerShare ?? 0)}</p></div>
              </div>
            </Card>
          );
        })}
      >
        {list.map((b) => {
          const p = payByBooking.get(b.id);
          return (
            <tr key={b.id}>
              <td className="px-5 py-3 font-mono text-xs text-plum-500">{b.id}</td>
              <td className="px-5 py-3 text-plum-600">{new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
              <td className="px-5 py-3 font-medium text-ink">{b.clientName}</td>
              <td className="px-5 py-3 text-plum-700">{name(b.lawyerId)}</td>
              <td className="px-5 py-3"><Badge tone="blush">{KIND_COPY[b.kind].title}</Badge></td>
              <td className="px-5 py-3 font-semibold text-ink">{b.fee ? naira(b.fee) : "Free"}</td>
              <td className="px-5 py-3 text-tangerine-600">{naira(p?.tycheShare ?? 0)}</td>
              <td className="px-5 py-3 text-lagoon-600">{naira(p?.lawyerShare ?? 0)}</td>
              <td className="px-5 py-3"><Badge tone={b.status === "pending_payment" ? "warm" : b.status === "done" ? "plum" : "teal"}>{statusOf(b)}</Badge></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

// ---------------------------------------------------------------------------
// community
// ---------------------------------------------------------------------------

function CommunityView() {
  const { members, communityCount, communityCap, communityPrice } = useAdmin();
  const pct = Math.min(100, (communityCount / Math.max(1, communityCap)) * 100);
  const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "234")}`;
  return (
    <>
      <SectionTitle title="Community" sub="The paid WhatsApp circle. Add new members to the group from here.">
        <Button variant="outline" size="sm" onClick={() => downloadCsv("tyche-community.csv", [["Name", "WhatsApp", "State", "Status", "Joined", "Expires"], ...members.map((m) => [m.name, m.phone, m.city, m.status || "", m.joinedAt ? fmtDate(m.joinedAt) : "", m.expiresAt ? fmtDate(m.expiresAt) : ""])])}>
          <Download size={16} /> Export CSV
        </Button>
      </SectionTitle>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
        <Stat label="Active members" value={communityCount.toLocaleString()} sub={`${pct.toFixed(1)}% of capacity`} icon={HeartHandshake} tone="bg-lagoon-100 text-lagoon-600" />
        <Stat label="Spots left" value={Math.max(0, communityCap - communityCount).toLocaleString()} sub={`Cap ${communityCap.toLocaleString()}`} icon={Users} tone="bg-plum-100 text-plum-600" />
        <Stat label="Yearly revenue (est.)" value={naira(communityCount * communityPrice)} sub={`${naira(communityPrice)} × members`} icon={Wallet} tone="bg-tangerine-100 text-tangerine-600" />
      </div>
      <Card className="mt-5 p-5 sm:p-6">
        <p className="font-semibold text-ink">Capacity</p>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-plum-50"><div className="h-full rounded-full bg-gradient-to-r from-lagoon-500 to-tangerine-400" style={{ width: `${pct}%` }} /></div>
        {pct > 90 && <p className="mt-3 text-sm text-tangerine-600">Almost full — consider opening a waitlist or a second circle.</p>}
      </Card>
      <Card className="mt-5 p-5 sm:p-6">
        <p className="font-semibold text-ink">Members</p>
        {members.length ? (
          <div className="mt-3 space-y-2">
            {members.map((m) => (
              <div key={m.userId} className="flex flex-wrap items-center gap-3 rounded-3xl bg-cream p-3 text-sm">
                <Avatar name={m.name} hue={185} size={40} className="ring-2" />
                <span className="min-w-0 flex-1"><b className="text-ink">{m.name}</b> · {m.phone}{m.city ? ` · ${m.city}` : ""}</span>
                <Badge tone={m.status === "active" ? "teal" : "warm"}>{m.status === "active" ? `Active${m.expiresAt ? ` · until ${fmtDate(m.expiresAt)}` : ""}` : "Unpaid"}</Badge>
                {m.status === "active" && <a href={wa(m.phone)} target="_blank" rel="noreferrer" className="rounded-full bg-lagoon-500 px-3.5 py-2 text-xs font-semibold text-white">WhatsApp</a>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-plum-400">New members will appear here with their WhatsApp number.</p>
        )}
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------

function SettingsView() {
  const { reset, adminSignOut, signOut, mode, communityPrice, communityCap, refresh, loadAdmin } = useAdmin();
  const navigate = useNavigate();
  const leave = async () => { if (adminSignOut) adminSignOut(); else await signOut(); navigate("/"); };
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <SectionTitle title="Settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <p className="font-display text-xl font-semibold text-ink">Business rules</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Tyche service fee", `${TYCHE_FEE * 100}% of every consultation and booking`],
              ["Lawyer payout", `${100 - TYCHE_FEE * 100}%, split automatically by Paystack`],
              ["Community price", `${naira(communityPrice)} per year`],
              ["Community cap", `${communityCap.toLocaleString()} members`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 rounded-2xl bg-cream px-4 py-3"><dt className="text-plum-500">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-plum-400">
            The {TYCHE_FEE * 100}% fee is set in code (<code>TYCHE_FEE</code> and <code>TYCHE_PERCENT</code>). Community price and cap come from the
            <code> COMMUNITY_PRICE</code> / <code>COMMUNITY_CAP</code> settings in Vercel.
          </p>
        </Card>
        <Card className="p-6">
          {mode === "live" ? (
            <>
              <p className="font-display text-xl font-semibold text-ink">Make someone an admin</p>
              <p className="mt-2 text-sm text-plum-600">
                For safety this is done in Supabase → SQL Editor. Ask them to sign up first, then run:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-ink p-3 text-xs text-plum-100">update public.profiles set role = 'admin' where email = 'them@example.com';</pre>
              <Button className="mt-4" variant="outline" size="sm" onClick={() => { refresh(); loadAdmin(); }}><RotateCcw size={16} /> Refresh data</Button>
              <hr className="my-6 border-plum-100" />
              <Button variant="soft" size="sm" onClick={leave}><LogOut size={16} /> Sign out</Button>
            </>
          ) : (
          <>
          <p className="font-display text-xl font-semibold text-ink">Demo data</p>
          <p className="mt-2 text-sm text-plum-600">Clears everything created on this browser — sign-ups, reports, bookings, approvals and suspensions.</p>
          {confirm ? (
            <div className="mt-4 flex gap-2">
              <Button variant="warm" size="sm" onClick={() => { reset?.(); setConfirm(false); }}><RotateCcw size={16} /> Yes, reset</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          ) : (
            <Button className="mt-4" variant="outline" size="sm" onClick={() => setConfirm(true)}><RotateCcw size={16} /> Reset demo data</Button>
          )}
          <hr className="my-6 border-plum-100" />
          <Button variant="soft" size="sm" onClick={leave}><LogOut size={16} /> Sign out of admin</Button>
          </>
          )}
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// shell
// ---------------------------------------------------------------------------

export default function Admin() {
  const { admin, lawyers, lawyerState, adminSignOut, signOut, isAdmin, loadAdmin, ready } = useAdmin();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAdmin) loadAdmin();
  }, [isAdmin, loadAdmin]);
  if (!ready) return <div className="grid min-h-screen place-items-center bg-plum-900 text-plum-200">Loading…</div>;
  if (!isAdmin) return <AdminLogin />;
  if (!admin) return <div className="grid min-h-screen place-items-center bg-cream text-plum-400">Loading admin data…</div>;
  const leave = async () => { if (adminSignOut) adminSignOut(); else await signOut(); navigate("/"); };
  const pending = lawyers.filter((l) => lawyerState(l) === "pending").length;
  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/approvals", label: "Lawyer approvals", icon: BadgeCheck, count: pending },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/reports", label: "Reports", icon: FileWarning },
    { to: "/admin/payments", label: "Bookings & payments", icon: Wallet },
    { to: "/admin/community", label: "Community", icon: HeartHandshake },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-cream font-sans text-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-plum-100 bg-white lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 lg:block lg:px-6 lg:py-6">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/tyche-logo.png" alt="Tyche" className="h-8" />
            <span className="rounded-full bg-plum-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Admin</span>
          </Link>
          <button onClick={leave} className="grid h-10 w-10 place-items-center rounded-full text-plum-500 hover:bg-plum-50 lg:hidden" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => cx("flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition lg:gap-3 lg:px-4", isActive ? "bg-plum-600 text-white" : "text-plum-700 hover:bg-plum-50")}
            >
              <n.icon size={18} /> <span className="flex-1">{n.label}</span>
              {!!n.count && <span className="rounded-full bg-tangerine-500 px-2 py-0.5 text-xs text-white">{n.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-4 lg:absolute lg:bottom-6 lg:block lg:w-full">
          <Link to="/" className="block rounded-2xl px-4 py-2.5 text-sm text-plum-500 hover:bg-plum-50">← Back to site</Link>
          <button onClick={leave} className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-plum-500 hover:bg-plum-50"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8 lg:px-10">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="users" element={<UsersView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="payments" element={<Payments />} />
          <Route path="community" element={<CommunityView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
