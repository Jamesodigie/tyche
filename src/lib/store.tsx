import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LAWYERS, SEED_ACCOUNTS, SEED_APPLICANTS, SEED_BOOKINGS, SEED_REPORTS, uid,
  type Account, type Bid, type Booking, type Lawyer, type Message, type Report,
} from "./data";

// Demo persistence in localStorage. Replace with Supabase / your API later.

export type Role = "client" | "lawyer";
export type User = { name: string; email: string; phone?: string; role: Role; lawyerId?: string };
export type CommunityMember = { name: string; phone: string; city: string; joinedAt: string; ref: string };

type State = {
  user: User | null;
  myLawyers: Lawyer[]; // lawyers who signed up on this device
  reports: Report[];
  bids: Bid[];
  bookings: Booking[];
  messages: Message[];
  community: CommunityMember | null;
  // --- admin ---
  admin: boolean;
  accounts: Account[]; // people who signed up on this device
  lawyerReview: Record<string, "approved" | "rejected">;
  suspended: string[]; // account emails
  hiddenReports: string[];
  adminLog: { at: string; text: string }[];
};

const KEY = "tyche:v1";
const initial: State = {
  user: null, myLawyers: [], reports: [], bids: [], bookings: [], messages: [], community: null,
  admin: false, accounts: [], lawyerReview: {}, suspended: [], hiddenReports: [], adminLog: [],
};

/** Front-end gate only. Replace with real admin auth (roles in your database) before launch. */
export const ADMIN_PASSCODE = "tyche-admin";

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

type Ctx = State & {
  lawyers: Lawyer[]; // every lawyer incl. pending/rejected, with review applied
  publicLawyers: Lawyer[]; // approved only — what clients see
  allReports: Report[];
  allAccounts: Account[];
  allBookings: Booking[];
  isSuspended: (email?: string) => boolean;
  lawyerState: (l: Lawyer) => "approved" | "pending" | "rejected";
  adminSignIn: (code: string) => boolean;
  adminSignOut: () => void;
  reviewLawyer: (id: string, decision: "approved" | "rejected") => void;
  setSuspended: (email: string, on: boolean) => void;
  setReportHidden: (id: string, on: boolean) => void;
  signIn: (u: User) => void;
  signOut: () => void;
  addLawyer: (l: Lawyer) => void;
  updateLawyer: (l: Lawyer) => void;
  addReport: (r: Report) => void;
  addBid: (b: Bid) => void;
  setBidStatus: (id: string, status: Bid["status"]) => void;
  addBooking: (b: Booking) => void;
  sendMessage: (m: Omit<Message, "id" | "at">) => void;
  joinCommunity: (c: CommunityMember) => void;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // Storage full (large evidence previews) — strip previews and retry.
      try {
        const slim = { ...s, reports: s.reports.map((r) => ({ ...r, evidence: r.evidence.map(({ preview, ...e }) => e) })) };
        localStorage.setItem(KEY, JSON.stringify(slim));
      } catch { /* give up quietly */ }
    }
  }, [s]);

  const value = useMemo<Ctx>(() => {
    const mine = new Set(s.myLawyers.map((l) => l.id));
    const raw = [...s.myLawyers, ...[...LAWYERS, ...SEED_APPLICANTS].filter((l) => !mine.has(l.id))];
    const lawyerState = (l: Lawyer) => s.lawyerReview[l.id] || (l.verified ? "approved" : "pending");
    const lawyers = raw.map((l) => ({ ...l, verified: lawyerState(l) === "approved" }));
    const log = (p: State, text: string) => [{ at: new Date().toISOString(), text }, ...p.adminLog].slice(0, 50);
    const seen = new Set(s.accounts.map((a) => a.email));
    return {
      ...s,
      lawyers,
      publicLawyers: lawyers.filter((l) => l.verified),
      allReports: [...s.reports, ...SEED_REPORTS],
      allAccounts: [...s.accounts, ...SEED_ACCOUNTS.filter((a) => !seen.has(a.email))],
      allBookings: [...s.bookings, ...SEED_BOOKINGS],
      isSuspended: (email) => !!email && s.suspended.includes(email),
      lawyerState,
      adminSignIn: (code) => {
        const ok = code.trim() === ADMIN_PASSCODE;
        if (ok) setS((p) => ({ ...p, admin: true }));
        return ok;
      },
      adminSignOut: () => setS((p) => ({ ...p, admin: false })),
      reviewLawyer: (id, decision) =>
        setS((p) => ({ ...p, lawyerReview: { ...p.lawyerReview, [id]: decision }, adminLog: log(p, `${decision === "approved" ? "Approved" : "Rejected"} lawyer ${id}`) })),
      setSuspended: (email, on) =>
        setS((p) => ({
          ...p,
          suspended: on ? [...new Set([...p.suspended, email])] : p.suspended.filter((e) => e !== email),
          adminLog: log(p, `${on ? "Suspended" : "Restored"} ${email}`),
        })),
      setReportHidden: (id, on) =>
        setS((p) => ({
          ...p,
          hiddenReports: on ? [...new Set([...p.hiddenReports, id])] : p.hiddenReports.filter((r) => r !== id),
          adminLog: log(p, `${on ? "Hid" : "Restored"} report ${id}`),
        })),
      signIn: (user) =>
        setS((p) => ({
          ...p,
          user,
          accounts: p.accounts.some((a) => a.email === user.email)
            ? p.accounts
            : [{ id: uid("U-"), name: user.name, email: user.email, phone: user.phone, role: user.role, lawyerId: user.lawyerId, state: "—", joinedAt: new Date().toISOString() }, ...p.accounts],
        })),
      signOut: () => setS((p) => ({ ...p, user: null })),
      addLawyer: (l) => setS((p) => ({ ...p, myLawyers: [l, ...p.myLawyers.filter((x) => x.id !== l.id)] })),
      updateLawyer: (l) => setS((p) => ({ ...p, myLawyers: [l, ...p.myLawyers.filter((x) => x.id !== l.id)] })),
      addReport: (r) => {
        setS((p) => ({ ...p, reports: [r, ...p.reports] }));
        // Demo: two verified lawyers respond to a shared report shortly after.
        if (r.shareWithLawyers) {
          const picks = LAWYERS.filter((l) => l.areas.some((a) => /harass|violence|rights/i.test(a))).slice(0, 3);
          const notes = [
            "I've read through what you shared and I'm so sorry this happened. I'd love to walk you through your options — first call is on me.",
            "Your evidence is stronger than you think. I've handled very similar matters and can take this on for you.",
            "Happy to help. We can start with a calm conversation and decide together what next steps feel right.",
          ];
          picks.forEach((l, i) =>
            setTimeout(
              () =>
                setS((p) => ({
                  ...p,
                  bids: [
                    {
                      id: uid("B-"),
                      reportId: r.id,
                      lawyerId: l.id,
                      kind: i === 1 ? "booking" : "consultation",
                      fee: i === 1 ? l.bookingFee : l.consultFee,
                      free: i === 1 ? l.bookingFree : l.consultFree || i === 0,
                      message: notes[i],
                      createdAt: new Date().toISOString(),
                      status: "pending",
                    },
                    ...p.bids,
                  ],
                })),
              2500 + i * 3500,
            ),
          );
        }
      },
      addBid: (b) => setS((p) => ({ ...p, bids: [b, ...p.bids] })),
      setBidStatus: (id, status) => setS((p) => ({ ...p, bids: p.bids.map((b) => (b.id === id ? { ...b, status } : b)) })),
      addBooking: (b) =>
        setS((p) => ({
          ...p,
          bookings: [b, ...p.bookings],
          messages: [
            ...p.messages,
            {
              id: uid("M-"),
              threadId: b.id,
              from: "lawyer",
              text: "Hi, thank you for booking with me. You can share anything here before our session — it stays between us. 💜",
              at: new Date().toISOString(),
            },
          ],
        })),
      sendMessage: (m) =>
        setS((p) => ({ ...p, messages: [...p.messages, { ...m, id: uid("M-"), at: new Date().toISOString() }] })),
      joinCommunity: (c) => setS((p) => ({ ...p, community: c })),
      reset: () => setS({ ...initial, admin: s.admin }),
    };
  }, [s]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
