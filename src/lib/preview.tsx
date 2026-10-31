// Preview mode: everything lives in this browser's localStorage, with sample lawyers and cases.
// Used only while VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  COMMUNITY_CAP, COMMUNITY_MEMBERS, COMMUNITY_PRICE, LAWYERS, SEED_ACCOUNTS, SEED_APPLICANTS, SEED_BOOKINGS, SEED_REPORTS, uid,
  type Account, type Bid, type Booking, type CommunityMember, type Lawyer, type Message, type Report, type SupportMessage,
} from "./data";
import { COMMUNITY_REF_KEY, StoreCtx, findIn, slugify, type Ctx, type SignUpInput, type User } from "./store";

/** Preview mode has no email server: every sign-up code is this. */
export const PREVIEW_CODE = "123456";
import { usePush } from "./usePush";

export const ADMIN_PASSCODE = "tyche-admin";

type State = {
  user: User | null;
  myLawyers: Lawyer[];
  reports: Report[];
  bids: Bid[];
  bookings: Booking[];
  messages: Message[];
  community: CommunityMember | null;
  admin: boolean;
  accounts: Account[];
  lawyerReview: Record<string, "approved" | "rejected">;
  suspended: string[];
  hiddenReports: string[];
  adminLog: { at: string; text: string }[];
  support: SupportMessage[];
};

const KEY = "tyche:v1";
const initial: State = {
  user: null, myLawyers: [], reports: [], bids: [], bookings: [], messages: [], community: null,
  admin: false, accounts: [], lawyerReview: {}, suspended: [], hiddenReports: [], adminLog: [], support: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? { ...initial, ...JSON.parse(raw) } : initial;
    if (s.user && !s.user.id) s.user = { ...s.user, id: "U-" + s.user.email }; // older saved shape
    return s;
  } catch {
    return initial;
  }
}

const NOTES = [
  "I've read through what you shared and I'm so sorry this happened. I'd love to walk you through your options — first call is on me.",
  "Your evidence is stronger than you think. I've handled very similar matters and can take this on for you.",
  "Happy to help. We can start with a calm conversation and decide together what next steps feel right.",
];

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load);
  const noop = useCallback(async () => {}, []);
  const push = usePush(noop, noop);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      try {
        const slim = { ...s, reports: s.reports.map((r) => ({ ...r, evidence: r.evidence.map(({ preview, ...e }) => e) })) };
        localStorage.setItem(KEY, JSON.stringify(slim));
      } catch { /* ignore */ }
    }
  }, [s, push.state, push.enable, push.disable]);

  const pendingSignUp = useRef<SignUpInput | null>(null);

  const value = useMemo<Ctx>(() => {
    const mine = new Set(s.myLawyers.map((l) => l.id));
    const raw = [...s.myLawyers, ...[...LAWYERS, ...SEED_APPLICANTS].filter((l) => !mine.has(l.id))];
    const lawyerState = (l: Lawyer) => s.lawyerReview[l.id] || (l.verified ? "approved" : "pending");
    const lawyers = raw.map((l) => ({ ...l, verified: lawyerState(l) === "approved", status: lawyerState(l) }));
    const publicLawyers = lawyers.filter((l) => l.verified);
    const myLawyer = s.user?.lawyerId ? lawyers.find((l) => l.id === s.user!.lawyerId) || null : null;
    const log = (p: State, text: string) => [{ at: new Date().toISOString(), text }, ...p.adminLog].slice(0, 50);
    const seen = new Set(s.accounts.map((a) => a.email));
    const allAccounts = [...s.accounts, ...SEED_ACCOUNTS.filter((a) => !seen.has(a.email))].map((a) => ({ ...a, suspended: s.suspended.includes(a.email) }));
    const allReports = [...s.reports, ...SEED_REPORTS].map((r) => ({ ...r, hidden: s.hiddenReports.includes(r.id) }));
    const user = s.user ? { ...s.user, suspended: s.suspended.includes(s.user.email), role: s.admin ? ("admin" as const) : s.user.role } : null;

    const signInAs = (u: Omit<User, "id"> & { id?: string }) =>
      setS((p) => {
        const id = u.id || "U-" + u.email;
        return {
          ...p,
          user: { ...u, id },
          accounts: p.accounts.some((a) => a.email === u.email)
            ? p.accounts
            : [{ id, name: u.name, email: u.email, phone: u.phone, role: u.role, lawyerId: u.lawyerId, state: "—", joinedAt: new Date().toISOString() }, ...p.accounts],
        };
      });

    return {
      mode: "preview",
      ready: true,
      user,
      lawyers,
      publicLawyers,
      myLawyer,
      findLawyer: (k) => findIn(lawyers, k),
      reports: s.reports,
      caseBoard: myLawyer?.verified ? allReports.filter((r) => r.shareWithLawyers && !r.hidden) : [],
      bids: s.bids,
      bookings: s.bookings,
      messages: s.messages,
      community: s.community,
      communityCount: COMMUNITY_MEMBERS + (s.community ? 1 : 0),
      communityPrice: COMMUNITY_PRICE,
      communityCap: COMMUNITY_CAP,

      signUp: async (i) => {
        pendingSignUp.current = i;
        return { needsConfirm: true };
      },
      saveConsent: async () => null,
      verifyEmailCode: async (email, code) => {
        if (code.replace(/\D/g, "") !== PREVIEW_CODE) return "That code is wrong. (Preview mode: the code is always " + PREVIEW_CODE + ".)";
        const i = pendingSignUp.current;
        if (i && i.email.toLowerCase() === email.toLowerCase()) {
          pendingSignUp.current = null;
          if (i.role === "lawyer" && i.lawyer) {
            const l = i.lawyer;
            const id = slugify(l.name);
            const lawyer: Lawyer = {
              id, slug: id, name: l.name, title: "Barrister & Solicitor", state: l.state, city: l.city, yearCalled: l.yearCalled,
              areas: l.areas, languages: l.languages, bio: l.bio || "Verified Tyche lawyer.", rating: 5, reviews: 0,
              consultFee: l.consultFree ? 0 : l.consultFee, consultFree: l.consultFree, bookingFee: l.bookingFree ? 0 : l.bookingFee,
              bookingFree: l.bookingFree, sessionMins: l.sessionMins, days: l.days, from: l.from, to: l.to, channels: l.channels,
              verified: false, status: "pending", responds: "within a day", hue: 200 + Math.floor(Math.random() * 120), meetLink: l.meetLink,
            };
            setS((p) => ({ ...p, myLawyers: [lawyer, ...p.myLawyers] }));
            signInAs({ name: l.name, email: i.email, phone: i.phone, role: "lawyer", lawyerId: id });
          } else {
            signInAs({ name: i.name, email: i.email, phone: i.phone, role: i.role });
          }
        } else signInAs({ name: email.split("@")[0], email, role: "client" });
        return null;
      },
      resendEmailCode: async () => null,
      signIn: async (email) => {
        const acct = s.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (acct) {
          signInAs({ id: acct.id, name: acct.name, email: acct.email, phone: acct.phone, role: acct.role === "admin" ? "client" : acct.role, lawyerId: acct.lawyerId });
        } else {
          const name = email.split("@")[0].replace(/[._\d]+/g, " ").trim() || "Friend";
          signInAs({ name: name.charAt(0).toUpperCase() + name.slice(1), email, role: "client" });
        }
        return null;
      },
      signOut: async () => setS((p) => ({ ...p, user: null })),
      resetPassword: async () => null,
      uploadPhoto: async (file) => {
        const url = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(file); });
        setS((p) => (p.user ? { ...p, user: { ...p.user, avatarUrl: url } } : p));
        return null;
      },
      updateProfile: async ({ name, phone }) => {
        setS((p) => (p.user ? { ...p, user: { ...p.user, name, phone } } : p));
        return null;
      },
      changePassword: async () => null,
      changeEmail: async () => null,
      confirmEmailChange: async (newEmail, code) => {
        if (code.replace(/\D/g, "") !== "123456") return "Preview mode: the code is 123456.";
        setS((p) => (p.user ? { ...p, user: { ...p.user, email: newEmail } } : p));
        return null;
      },
      deleteAccount: async () => {
        setS((p) => ({ ...p, user: null }));
        return null;
      },
      referralCount: async () => 0,

      createLawyer: async () => null,
      updateLawyer: async (l) => {
        setS((p) => ({ ...p, myLawyers: [l, ...p.myLawyers.filter((x) => x.id !== l.id)] }));
        return null;
      },
      uploadLicence: async () => null,
      addReport: async (r, files) => {
        const id = "TY-" + Math.floor(10000 + Math.random() * 89999);
        const report: Report = { ...r, id, createdAt: new Date().toISOString(), evidence: files.map((f) => f.ev), mine: true };
        setS((p) => ({ ...p, reports: [report, ...p.reports] }));
        if (r.shareWithLawyers) {
          LAWYERS.filter((l) => l.areas.some((a) => /harass|violence|rights/i.test(a))).slice(0, 3).forEach((l, i) =>
            setTimeout(
              () =>
                setS((p) => ({
                  ...p,
                  bids: [
                    {
                      id: uid("B-"), reportId: id, lawyerId: l.id,
                      kind: i === 1 ? "booking" : "consultation",
                      fee: i === 1 ? l.bookingFee : l.consultFee,
                      free: i === 1 ? l.bookingFree : l.consultFree || i === 0,
                      message: NOTES[i], createdAt: new Date().toISOString(), status: "pending",
                    },
                    ...p.bids,
                  ],
                })),
              2500 + i * 3500,
            ),
          );
        }
        return { id };
      },
      addBid: async (b) => {
        setS((p) => ({ ...p, bids: [{ ...b, id: uid("B-"), createdAt: new Date().toISOString(), status: "pending" }, ...p.bids] }));
        return null;
      },
      setBidStatus: async (id, status) => setS((p) => ({ ...p, bids: p.bids.map((b) => (b.id === id ? { ...b, status } : b)) })),
      book: async (i) => {
        const l = findIn(lawyers, i.lawyerId);
        if (!l) return { error: "Lawyer not found" };
        const bid = i.bidId ? s.bids.find((b) => b.id === i.bidId) : undefined;
        const kind = bid?.kind || i.kind;
        const fee = bid ? (bid.free ? 0 : bid.fee) : kind === "consultation" ? (l.consultFree ? 0 : l.consultFee) : l.bookingFree ? 0 : l.bookingFee;
        const id = uid("BK-");
        const booking: Booking = {
          id, lawyerId: l.id, clientName: s.user?.name || "You", clientId: s.user?.id, kind, date: i.date, time: i.time,
          channel: i.channel, fee, status: "upcoming", reportId: i.reportId || bid?.reportId, createdAt: new Date().toISOString(), meetLink: l.meetLink,
        };
        const msgs: Message[] = [];
        if (i.note?.trim()) msgs.push({ id: uid("M-"), threadId: id, from: "client", text: i.note.trim(), at: new Date().toISOString() });
        msgs.push({ id: uid("M-"), threadId: id, from: "lawyer", text: "Hi, thank you for booking with me. You can share anything here before our session — it stays between us. 💜", at: new Date().toISOString() });
        await new Promise((r) => setTimeout(r, fee ? 1200 : 400)); // feel of a real checkout
        setS((p) => ({
          ...p,
          bookings: [booking, ...p.bookings],
          messages: [...p.messages, ...msgs],
          bids: bid ? p.bids.map((b) => (b.id === bid.id ? { ...b, status: "accepted" } : b)) : p.bids,
        }));
        return { bookingId: id };
      },
      joinCommunity: async (i) => {
        await new Promise((r) => setTimeout(r, 1200));
        const ref = uid("CM-");
        setS((p) => ({ ...p, community: { name: i.name, phone: i.phone, city: i.state, joinedAt: new Date().toISOString(), ref, status: "active" } }));
        try { localStorage.setItem(COMMUNITY_REF_KEY, ref); } catch { /* ignore */ }
        return { done: true };
      },
      communityInvite: async () => null,
      communityByRef: async (reference) =>
        s.community && s.community.ref === reference ? { active: true, inviteUrl: null, name: s.community.name, phone: s.community.phone, reference } : null,
      verifyPayment: async () => ({ status: "success" }),
      sendMessage: async (bookingId, text) => {
        const b = s.bookings.find((x) => x.id === bookingId);
        const from = s.user?.role === "lawyer" && b?.lawyerId === s.user.lawyerId ? "lawyer" : "client";
        const first = !s.messages.some((m) => m.threadId === bookingId && m.from === from);
        setS((p) => ({ ...p, messages: [...p.messages, { id: uid("M-"), threadId: bookingId, from, text, at: new Date().toISOString() }] }));
        if (from === "client" && first)
          setTimeout(
            () =>
              setS((p) => ({
                ...p,
                messages: [...p.messages, { id: uid("M-"), threadId: bookingId, from: "lawyer", text: "Thank you for trusting me with this. I've noted everything — we'll go through it together during our session. 💜", at: new Date().toISOString() }],
              })),
            2200,
          );
      },
      setMeetLink: async (bookingId, link) => {
        setS((p) => ({ ...p, bookings: p.bookings.map((b) => (b.id === bookingId ? { ...b, meetLink: link } : b)) }));
        return null;
      },
      completeBooking: async (bookingId) => setS((p) => ({ ...p, bookings: p.bookings.map((b) => (b.id === bookingId ? { ...b, status: "done" } : b)) })),
      takenSlots: async (lawyerId) => new Set(s.bookings.filter((b) => b.lawyerId === lawyerId).map((b) => `${b.date}|${b.time}`)),
      evidenceUrl: async (e) => e.preview || null,
      banks: async () => [{ name: "Access Bank", code: "044" }, { name: "GTBank", code: "058" }, { name: "Opay", code: "999992" }],
      setupPayout: async (_code, bankName, acct) => {
        if (myLawyer) setS((p) => ({ ...p, myLawyers: [{ ...myLawyer, payoutReady: true, payoutBank: bankName, payoutLast4: acct.slice(-4), payoutAccountName: myLawyer.name }, ...p.myLawyers.filter((x) => x.id !== myLawyer.id)] }));
        return null;
      },
      refresh: async () => {},

      support: s.user ? s.support.filter((m) => m.userId === s.user!.id) : [],
      sendSupport: async (text) => {
        if (!s.user) return "Please sign in first.";
        const uidv = s.user.id;
        const first = !s.support.some((m) => m.userId === uidv);
        setS((p) => ({ ...p, support: [...p.support, { id: uid("S-"), userId: uidv, fromAdmin: false, text, at: new Date().toISOString() }] }));
        if (first)
          setTimeout(
            () =>
              setS((p) => ({
                ...p,
                support: [...p.support, { id: uid("S-"), userId: uidv, fromAdmin: true, text: "Hi love 💜 thanks for reaching out. A member of the Tyche team will reply here shortly. If it's urgent, tap WhatsApp above.", at: new Date().toISOString() }],
              })),
            1800,
          );
        return null;
      },
      markSupportRead: async () =>
        setS((p) => ({ ...p, support: p.support.map((m) => (s.user && m.userId === s.user.id && m.fromAdmin && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)) })),
      replySupport: async (userId, text) => {
        setS((p) => ({ ...p, support: [...p.support, { id: uid("S-"), userId, fromAdmin: true, text, at: new Date().toISOString() }] }));
        return null;
      },

      pushState: push.state,
      enablePush: push.enable,
      disablePush: push.disable,
      retryPayouts: async () => "Preview mode — payouts run once Bachs is connected.",
      myPayouts: [],
      googleAdmin: async () => ({ error: "Preview mode — Google connects once Tyche is live." }),
      sendBroadcast: async () => ({ error: "Preview mode — connect Supabase and add the push keys to send real notifications." }),

      isAdmin: s.admin,
      admin: s.admin
        ? {
            accounts: allAccounts,
            lawyers,
            reports: allReports,
            bookings: [...s.bookings, ...SEED_BOOKINGS],
            payments: [...s.bookings, ...SEED_BOOKINGS].filter((b) => b.fee > 0).map((b) => ({
              reference: "PV-" + b.id, purpose: "booking" as const, amount: b.fee, tycheShare: b.fee * 0.2, lawyerShare: b.fee * 0.8,
              status: "success" as const, bookingId: b.id, createdAt: b.createdAt,
            })),
            members: s.community && s.user ? [{ ...s.community, userId: s.user.id }] : [],
            log: s.adminLog,
            support: s.support,
            payouts: [],
          }
        : null,
      loadAdmin: async () => {},
      lawyerState,
      reviewLawyer: async (id, decision) =>
        setS((p) => ({ ...p, lawyerReview: { ...p.lawyerReview, [id]: decision }, adminLog: log(p, `${decision === "approved" ? "Approved" : "Rejected"} lawyer ${id}`) })),
      setSuspended: async (a, on) =>
        setS((p) => ({
          ...p,
          suspended: on ? [...new Set([...p.suspended, a.email])] : p.suspended.filter((e) => e !== a.email),
          adminLog: log(p, `${on ? "Suspended" : "Restored"} ${a.email}`),
        })),
      setReportHidden: async (id, on) =>
        setS((p) => ({
          ...p,
          hiddenReports: on ? [...new Set([...p.hiddenReports, id])] : p.hiddenReports.filter((r) => r !== id),
          adminLog: log(p, `${on ? "Hid" : "Restored"} report ${id}`),
        })),
      licenceUrl: async () => null,
      adminSignIn: (code) => {
        const ok = code.trim() === ADMIN_PASSCODE;
        if (ok) setS((p) => ({ ...p, admin: true }));
        return ok;
      },
      adminSignOut: () => setS((p) => ({ ...p, admin: false })),
      reset: () => setS({ ...initial, admin: s.admin }),
    };
  }, [s, push.state, push.enable, push.disable]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
