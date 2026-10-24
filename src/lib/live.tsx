// Live mode: real accounts (Supabase Auth), data (Postgres + row-level security),
// evidence files (Storage), realtime chat/offers, and payments through /api (Paystack).
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Account, Bid, Booking, CommunityMember, Evidence, Lawyer, Message, Payment, Report } from "./data";
import { StoreCtx, findIn, slugify, type AdminData, type Ctx, type LawyerInput, type User } from "./store";
import { supabase } from "./supabase";

const sb = supabase!;

// ---------------------------------------------------------------------------
// row → UI mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
const toLawyer = (r: any): Lawyer => ({
  id: r.id,
  slug: r.slug,
  userId: r.user_id,
  name: r.name,
  title: r.title || "Barrister & Solicitor",
  state: r.state,
  city: r.city || "",
  yearCalled: r.year_called || 0,
  areas: r.areas || [],
  languages: r.languages || [],
  bio: r.bio || "",
  rating: Number(r.rating ?? 5),
  reviews: r.reviews ?? 0,
  consultFee: r.consult_fee ?? 0,
  consultFree: !!r.consult_free,
  bookingFee: r.booking_fee ?? 0,
  bookingFree: !!r.booking_free,
  sessionMins: r.session_mins ?? 30,
  days: r.days || [],
  from: r.time_from || "09:00",
  to: r.time_to || "17:00",
  channels: r.channels || [],
  verified: r.status ? r.status === "approved" : true, // directory rows are approved
  status: r.status || "approved",
  responds: r.responds || "within a day",
  hue: r.hue ?? 280,
  meetLink: r.meet_link || undefined,
  payoutReady: r.payout_ready ?? !!r.subaccount_code,
  payoutBank: r.payout_bank || undefined,
  payoutAccountName: r.payout_account_name || undefined,
  payoutLast4: r.payout_last4 || undefined,
  hasLicence: !!r.licence_path,
});

const lawyerRow = (l: LawyerInput | Lawyer) => ({
  name: l.name,
  state: l.state,
  city: l.city,
  year_called: l.yearCalled || null,
  areas: l.areas,
  languages: l.languages,
  bio: l.bio,
  consult_fee: l.consultFree ? 0 : l.consultFee,
  consult_free: l.consultFree,
  booking_fee: l.bookingFree ? 0 : l.bookingFee,
  booking_free: l.bookingFree,
  session_mins: l.sessionMins,
  days: l.days,
  time_from: l.from,
  time_to: l.to,
  channels: l.channels,
  meet_link: l.meetLink || null,
});

const toEvidence = (e: any): Evidence => ({ id: e.id, name: e.name, kind: e.kind, size: Number(e.size || 0), path: e.path });

const toReport = (r: any, mine = false): Report => ({
  id: r.id,
  createdAt: r.created_at,
  alias: r.alias,
  category: r.category,
  setting: r.setting,
  when: r.when_text || "",
  state: r.state || "",
  relation: r.relation || "",
  description: r.description,
  wants: r.wants || [],
  evidence: (r.evidence || []).map(toEvidence),
  shareWithLawyers: r.share_with_lawyers ?? true,
  hideName: r.hide_name ?? true,
  authorities: r.authorities || [],
  hidden: !!r.hidden,
  mine,
});

const toBid = (b: any): Bid => ({
  id: b.id, reportId: b.report_id, lawyerId: b.lawyer_id, fee: b.fee, free: b.free, kind: b.kind, message: b.message, createdAt: b.created_at, status: b.status,
});

const BOOKING_STATUS: Record<string, Booking["status"]> = { pending_payment: "pending_payment", confirmed: "upcoming", completed: "done", cancelled: "cancelled" };
const toBooking = (b: any): Booking => ({
  id: b.id, lawyerId: b.lawyer_id, clientId: b.client_id, clientName: b.client_name, kind: b.kind, date: b.date, time: b.time,
  channel: b.channel, fee: b.fee, status: BOOKING_STATUS[b.status] || "upcoming", reportId: b.report_id || undefined,
  createdAt: b.created_at, meetLink: b.meet_link || undefined,
});

const toCommunity = (c: any): CommunityMember => ({
  name: c.name, phone: c.phone, city: c.state || "", joinedAt: c.joined_at || c.created_at, ref: c.reference || "", status: c.status, expiresAt: c.expires_at || undefined,
});

const toPayment = (p: any): Payment => ({
  reference: p.reference, purpose: p.purpose, amount: p.amount, tycheShare: p.tyche_share, lawyerShare: p.lawyer_share, status: p.status,
  bookingId: p.booking_id || undefined, createdAt: p.created_at,
});

const friendly = (msg?: string) => {
  if (!msg) return "Something went wrong. Please try again.";
  if (/invalid login/i.test(msg)) return "That email and password don't match. Please try again.";
  if (/already registered|already exists/i.test(msg)) return "There's already an account with this email. Try signing in instead.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox for the link from Tyche.";
  if (/password/i.test(msg) && /6/.test(msg)) return "Your password needs at least 6 characters.";
  if (/rate limit/i.test(msg)) return "Too many tries — please wait a minute and try again.";
  return msg;
};

const safeName = (n: string) => n.replace(/[^\w.\-]+/g, "_").slice(-80);

// ---------------------------------------------------------------------------

export function LiveProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [directory, setDirectory] = useState<Lawyer[]>([]);
  const [myLawyer, setMyLawyer] = useState<Lawyer | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [caseBoard, setCaseBoard] = useState<Report[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [community, setCommunity] = useState<CommunityMember | null>(null);
  const [communityInfo, setCommunityInfo] = useState({ count: 0, price: 5000, cap: 10000 });
  const [extraLawyers, setExtraLawyers] = useState<Lawyer[]>([]);
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const bookingsRef = useRef<Booking[]>([]);
  bookingsRef.current = bookings;
  const uidRef = useRef<string | null>(null);

  const token = () => session?.access_token || "";
  const api = useCallback(
    async <T,>(path: string, init?: { method?: string; body?: unknown }): Promise<T> => {
      const { data } = await sb.auth.getSession();
      const t = data.session?.access_token;
      const r = await fetch(`/api/${path}`, {
        method: init?.method || "GET",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Request failed (${r.status})`);
      return json as T;
    },
    [],
  );

  // ---------- public data ----------
  const loadPublic = useCallback(async () => {
    const [{ data: dir }, info] = await Promise.all([
      sb.from("lawyer_directory").select("*").order("rating", { ascending: false }),
      fetch("/api/community").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    setDirectory((dir || []).map(toLawyer));
    if (info) setCommunityInfo({ count: info.count ?? 0, price: info.price ?? 5000, cap: info.cap ?? 10000 });
    else {
      const { data: count } = await sb.rpc("community_count");
      setCommunityInfo((c) => ({ ...c, count: (count as number) || 0 }));
    }
  }, []);

  // ---------- signed-in data ----------
  const loadActivity = useCallback(async (uid: string, lawyer: Lawyer | null) => {
    const [{ data: bidRows }, { data: bookingRows }, { data: comm }] = await Promise.all([
      sb.from("bids").select("*").order("created_at", { ascending: false }),
      sb.from("bookings").select("*").order("date", { ascending: true }),
      sb.from("community_members").select("*").eq("user_id", uid).maybeSingle(),
    ]);
    const bk = (bookingRows || []).map(toBooking);
    setBids((bidRows || []).map(toBid));
    setBookings(bk);
    setCommunity(comm ? toCommunity(comm) : null);

    const ids = bk.filter((b) => b.status === "upcoming" || b.status === "done").map((b) => b.id);
    if (ids.length) {
      const { data: msgRows } = await sb.from("messages").select("*").in("booking_id", ids).order("created_at");
      const byId = new Map(bk.map((b) => [b.id, b]));
      setMessages(
        (msgRows || []).map((m) => ({
          id: m.id, threadId: m.booking_id, text: m.body, at: m.created_at,
          from: byId.get(m.booking_id)?.clientId === m.sender_id ? "client" : "lawyer",
        })),
      );
    } else setMessages([]);

    // Lawyers referenced by offers/bookings who might not be in the public directory.
    const known = new Set(directory.map((l) => l.id));
    const missing = [...new Set([...(bidRows || []).map((b) => b.lawyer_id), ...bk.map((b) => b.lawyerId)])].filter((id) => !known.has(id) && id !== lawyer?.id);
    if (missing.length) {
      const { data: extra } = await sb.from("lawyer_directory").select("*").in("id", missing);
      setExtraLawyers((extra || []).map(toLawyer));
    }

    if (lawyer?.verified) {
      const [{ data: board }, { data: ev }] = await Promise.all([
        sb.from("case_board").select("*").order("created_at", { ascending: false }),
        sb.from("case_evidence").select("*"),
      ]);
      const evBy = new Map<string, Evidence[]>();
      (ev || []).forEach((e) => evBy.set(e.report_id, [...(evBy.get(e.report_id) || []), toEvidence(e)]));
      setCaseBoard((board || []).map((r) => ({ ...toReport(r), evidence: evBy.get(r.id) || [] })));
    } else setCaseBoard([]);
  }, [directory]);

  const ensureLawyerFromDraft = useCallback(async (s: Session): Promise<any | null> => {
    const draft = s.user.user_metadata?.lawyer_draft as LawyerInput | undefined;
    if (!draft) return null;
    const { data, error } = await sb
      .from("lawyers")
      .insert({ ...lawyerRow(draft), user_id: s.user.id, slug: slugify(draft.name), scn: draft.scn, nba_branch: draft.branch || null, hue: 200 + Math.floor(Math.random() * 120) })
      .select("*")
      .single();
    if (!error) await sb.auth.updateUser({ data: { lawyer_draft: null } });
    return data;
  }, []);

  const loadUser = useCallback(async (s: Session) => {
    const uid = s.user.id;
    uidRef.current = uid;
    const [{ data: prof }, { data: lw }, { data: reps }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("lawyers").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("reports").select("*, evidence(*)").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    let lawyerRowData = lw;
    if (!lawyerRowData) lawyerRowData = await ensureLawyerFromDraft(s);
    const lawyer = lawyerRowData ? toLawyer(lawyerRowData) : null;
    setProfile(prof ? { ...prof, role: lawyer && prof.role === "client" ? "lawyer" : prof.role } : null);
    setMyLawyer(lawyer);
    setReports((reps || []).map((r) => toReport(r, true)));
    await loadActivity(uid, lawyer);
  }, [ensureLawyerFromDraft, loadActivity]);

  const clearUser = () => {
    uidRef.current = null;
    setProfile(null); setMyLawyer(null); setReports([]); setCaseBoard([]); setBids([]); setBookings([]);
    setMessages([]); setCommunity(null); setAdmin(null); setExtraLawyers([]);
  };

  // auth lifecycle
  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadPublic();
      if (data.session) await loadUser(data.session).catch(console.error);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") clearUser();
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && s && s.user.id !== uidRef.current) loadUser(s).catch(console.error);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime: new messages, offers and booking changes
  useEffect(() => {
    if (!session) return;
    let t: number | undefined;
    const bump = () => {
      clearTimeout(t);
      t = window.setTimeout(() => uidRef.current && loadActivity(uidRef.current, myLawyer).catch(console.error), 300);
    };
    const ch = sb
      .channel("tyche-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, bump)
      .subscribe();
    return () => {
      clearTimeout(t);
      sb.removeChannel(ch);
    };
  }, [session, myLawyer, loadActivity]);

  const user: User | null = useMemo(() => {
    if (!session) return null;
    const role = (profile?.role as User["role"]) || (myLawyer ? "lawyer" : "client");
    return {
      id: session.user.id,
      name: profile?.name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Friend",
      email: session.user.email || "",
      phone: profile?.phone || undefined,
      role,
      lawyerId: myLawyer?.id,
      suspended: !!profile?.suspended,
    };
  }, [session, profile, myLawyer]);

  const isAdmin = user?.role === "admin" && !user.suspended;

  const loadAdmin = useCallback(async () => {
    if (!isAdmin) return;
    const [{ data: profs }, { data: lws }, { data: reps }, { data: bks }, { data: pays }, { data: mems }, { data: log }] = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("lawyers").select("*").order("created_at", { ascending: false }),
      sb.from("reports").select("*, evidence(*)").order("created_at", { ascending: false }),
      sb.from("bookings").select("*").order("created_at", { ascending: false }),
      sb.from("payments").select("*").order("created_at", { ascending: false }),
      sb.from("community_members").select("*").order("created_at", { ascending: false }),
      sb.from("admin_log").select("*").order("at", { ascending: false }).limit(50),
    ]);
    const lawyerByUser = new Map((lws || []).map((l) => [l.user_id, l.id]));
    setAdmin({
      accounts: (profs || []).map(
        (p): Account => ({
          id: p.id, name: p.name || "—", email: p.email || "", phone: p.phone || undefined, role: p.role,
          lawyerId: lawyerByUser.get(p.id), state: p.state || "—", joinedAt: p.created_at, suspended: p.suspended,
        }),
      ),
      lawyers: (lws || []).map(toLawyer),
      reports: (reps || []).map((r) => toReport(r)),
      bookings: (bks || []).map(toBooking),
      payments: (pays || []).map(toPayment),
      members: (mems || []).map((m) => ({ ...toCommunity(m), userId: m.user_id })),
      log: (log || []).map((l) => ({ at: l.at, text: l.text })),
    });
  }, [isAdmin]);

  const adminLog = async (text: string) => {
    await sb.from("admin_log").insert({ text });
  };

  const value = useMemo<Ctx>(() => {
    const own = myLawyer ? [myLawyer] : [];
    const seen = new Set<string>();
    const lawyers = [...own, ...directory, ...extraLawyers, ...(admin?.lawyers || [])].filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));

    return {
      mode: "live",
      ready,
      user,
      lawyers,
      publicLawyers: directory,
      myLawyer,
      findLawyer: (k) => findIn(lawyers, k),
      reports,
      caseBoard,
      bids,
      bookings,
      messages,
      community,
      communityCount: communityInfo.count,
      communityPrice: communityInfo.price,
      communityCap: communityInfo.cap,

      // ---------- auth ----------
      signUp: async (i) => {
        const { data, error } = await sb.auth.signUp({
          email: i.email.trim(),
          password: i.password,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
            data: { name: i.name.trim(), phone: i.phone || null, role: i.role, lawyer_draft: i.lawyer || null },
          },
        });
        if (error) return { error: friendly(error.message) };
        if (!data.session) return { needsConfirm: true };
        await loadUser(data.session);
        return {};
      },
      signIn: async (email, password) => {
        const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return friendly(error.message);
        if (data.session) await loadUser(data.session);
        return null;
      },
      signOut: async () => {
        await sb.auth.signOut();
        clearUser();
      },
      resetPassword: async (email) => {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        return error ? friendly(error.message) : null;
      },

      // ---------- lawyers ----------
      createLawyer: async (i, licence) => {
        if (!session) return "Please sign in first.";
        const { data, error } = await sb
          .from("lawyers")
          .insert({ ...lawyerRow(i), user_id: session.user.id, slug: slugify(i.name), scn: i.scn, nba_branch: i.branch || null, hue: 200 + Math.floor(Math.random() * 120) })
          .select("*")
          .single();
        if (error) return friendly(error.message);
        setMyLawyer(toLawyer(data));
        setProfile((p: any) => (p ? { ...p, role: p.role === "admin" ? "admin" : "lawyer" } : p));
        if (licence) {
          const path = `${session.user.id}/${Date.now()}-${safeName(licence.name)}`;
          const up = await sb.storage.from("licences").upload(path, licence);
          if (!up.error) await sb.from("lawyers").update({ licence_path: path }).eq("id", data.id);
        }
        return null;
      },
      updateLawyer: async (l) => {
        const { data, error } = await sb.from("lawyers").update(lawyerRow(l)).eq("id", l.id).select("*").single();
        if (error) return friendly(error.message);
        setMyLawyer(toLawyer(data));
        return null;
      },
      uploadLicence: async (file) => {
        const { data: sess } = await sb.auth.getSession();
        const uid = sess.session?.user.id;
        if (!uid) return "Please sign in first.";
        const { data: row } = await sb.from("lawyers").select("id").eq("user_id", uid).maybeSingle();
        if (!row) return "Please finish your lawyer profile first.";
        const path = `${uid}/${Date.now()}-${safeName(file.name)}`;
        const up = await sb.storage.from("licences").upload(path, file);
        if (up.error) return friendly(up.error.message);
        const { error } = await sb.from("lawyers").update({ licence_path: path }).eq("id", row.id);
        if (error) return friendly(error.message);
        setMyLawyer((m) => (m ? { ...m, hasLicence: true } : m));
        return null;
      },

      // ---------- reports ----------
      addReport: async (r, files) => {
        if (!session) return { error: "Please sign in first." };
        const { data, error } = await sb
          .from("reports")
          .insert({
            alias: r.alias.trim(), category: r.category, setting: r.setting, when_text: r.when || null, state: r.state,
            relation: r.relation || null, description: r.description, wants: r.wants, share_with_lawyers: r.shareWithLawyers,
            hide_name: r.hideName, authorities: r.authorities,
          })
          .select("*")
          .single();
        if (error || !data) return { error: friendly(error?.message) };
        const uploaded: Evidence[] = [];
        const failed: string[] = [];
        for (const f of files) {
          if (!f.file) continue;
          const path = `${session.user.id}/${data.id}/${Date.now()}-${safeName(f.ev.name)}`;
          const up = await sb.storage.from("evidence").upload(path, f.file, { contentType: (f.file as File).type || undefined });
          if (up.error) { failed.push(f.ev.name); continue; }
          const { data: row } = await sb.from("evidence").insert({ report_id: data.id, name: f.ev.name, kind: f.ev.kind, size: f.ev.size, path }).select("*").single();
          if (row) uploaded.push({ ...toEvidence(row), preview: f.ev.preview });
        }
        setReports((p) => [{ ...toReport(data, true), evidence: uploaded }, ...p]);
        return { id: data.id, error: failed.length ? `Saved, but ${failed.length} file(s) didn't upload: ${failed.join(", ")}` : undefined };
      },

      // ---------- offers ----------
      addBid: async (b) => {
        const { data, error } = await sb.from("bids").insert({ report_id: b.reportId, lawyer_id: b.lawyerId, kind: b.kind, fee: b.free ? 0 : b.fee, free: b.free, message: b.message }).select("*").single();
        if (error) return /duplicate/i.test(error.message) ? "You've already sent an offer on this case." : friendly(error.message);
        setBids((p) => [toBid(data), ...p]);
        return null;
      },
      setBidStatus: async (id, status) => {
        setBids((p) => p.map((b) => (b.id === id ? { ...b, status } : b)));
        await sb.from("bids").update({ status }).eq("id", id);
      },

      // ---------- bookings + payments ----------
      book: async (i) => {
        try {
          const out = await api<{ bookingId: string; payUrl?: string }>("book", { method: "POST", body: i });
          if (!out.payUrl && uidRef.current) await loadActivity(uidRef.current, myLawyer);
          return out;
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      joinCommunity: async (i) => {
        try {
          const out = await api<{ payUrl?: string; active?: boolean }>("community", { method: "POST", body: i });
          return out.payUrl ? { payUrl: out.payUrl } : { done: !!out.active };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      communityInvite: async () => {
        try {
          const out = await api<{ inviteUrl: string | null }>("community");
          return out.inviteUrl;
        } catch {
          return null;
        }
      },
      verifyPayment: async (reference) => {
        try {
          const out = await api<any>("verify", { method: "POST", body: { reference } });
          if (uidRef.current) await loadActivity(uidRef.current, myLawyer);
          return out;
        } catch (e) {
          return { error: (e as Error).message };
        }
      },

      // ---------- chat + sessions ----------
      sendMessage: async (bookingId, text) => {
        const b = bookingsRef.current.find((x) => x.id === bookingId);
        const from = b && b.clientId === session?.user.id ? "client" : "lawyer";
        const temp: Message = { id: "tmp-" + Date.now(), threadId: bookingId, from, text, at: new Date().toISOString() };
        setMessages((p) => [...p, temp]);
        const { data, error } = await sb.from("messages").insert({ booking_id: bookingId, body: text }).select("*").single();
        setMessages((p) => p.map((m) => (m.id === temp.id ? (error ? { ...m, text: m.text + "  ⚠️ not sent" } : { ...m, id: data.id, at: data.created_at }) : m)));
      },
      setMeetLink: async (bookingId, link) => {
        const { error } = await sb.from("bookings").update({ meet_link: link || null }).eq("id", bookingId);
        if (error) return friendly(error.message);
        setBookings((p) => p.map((b) => (b.id === bookingId ? { ...b, meetLink: link || undefined } : b)));
        return null;
      },
      completeBooking: async (bookingId) => {
        await sb.from("bookings").update({ status: "completed" }).eq("id", bookingId);
        setBookings((p) => p.map((b) => (b.id === bookingId ? { ...b, status: "done" } : b)));
      },
      takenSlots: async (lawyerId) => {
        const { data } = await sb.rpc("taken_slots", { lid: lawyerId });
        return new Set(((data as { date: string; time: string }[]) || []).map((r) => `${r.date}|${r.time}`));
      },
      evidenceUrl: async (e) => {
        if (!e.path) return e.preview || null;
        const { data } = await sb.storage.from("evidence").createSignedUrl(e.path, 600);
        return data?.signedUrl || null;
      },
      banks: async () => {
        try {
          return (await api<{ banks: { name: string; code: string }[] }>("payout")).banks;
        } catch {
          return [];
        }
      },
      setupPayout: async (bankCode, bankName, accountNumber) => {
        try {
          const out = await api<{ payoutBank: string; payoutAccountName: string; payoutLast4: string }>("payout", { method: "POST", body: { bankCode, bankName, accountNumber } });
          if (myLawyer) setMyLawyer({ ...myLawyer, payoutReady: true, payoutBank: out.payoutBank, payoutAccountName: out.payoutAccountName, payoutLast4: out.payoutLast4 });
          return null;
        } catch (e) {
          return (e as Error).message;
        }
      },
      refresh: async () => {
        await loadPublic();
        if (session) await loadUser(session);
      },

      // ---------- admin ----------
      isAdmin,
      admin,
      loadAdmin,
      lawyerState: (l) => l.status || (l.verified ? "approved" : "pending"),
      reviewLawyer: async (id, decision) => {
        await sb.from("lawyers").update({ status: decision }).eq("id", id);
        const l = admin?.lawyers.find((x) => x.id === id);
        await adminLog(`${decision === "approved" ? "Approved" : "Rejected"} lawyer ${l?.name || id}`);
        await Promise.all([loadAdmin(), loadPublic()]);
      },
      setSuspended: async (a, on) => {
        await sb.from("profiles").update({ suspended: on }).eq("id", a.id);
        await adminLog(`${on ? "Suspended" : "Restored"} ${a.email}`);
        await loadAdmin();
      },
      setReportHidden: async (id, on) => {
        await sb.from("reports").update({ hidden: on }).eq("id", id);
        await adminLog(`${on ? "Hid" : "Restored"} report ${id}`);
        await loadAdmin();
      },
      licenceUrl: async (lawyerId) => {
        const { data: l } = await sb.from("lawyers").select("licence_path").eq("id", lawyerId).single();
        if (!l?.licence_path) return null;
        const { data } = await sb.storage.from("licences").createSignedUrl(l.licence_path, 600);
        return data?.signedUrl || null;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, directory, extraLawyers, myLawyer, reports, caseBoard, bids, bookings, messages, community, communityInfo, admin, isAdmin, session]);

  void token;
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
