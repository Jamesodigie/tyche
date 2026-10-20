import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LAWYERS, SEED_REPORTS, uid,
  type Bid, type Booking, type Lawyer, type Message, type Report,
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
};

const KEY = "tyche:v1";
const initial: State = { user: null, myLawyers: [], reports: [], bids: [], bookings: [], messages: [], community: null };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

type Ctx = State & {
  lawyers: Lawyer[];
  allReports: Report[];
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
    const lawyers = [...s.myLawyers, ...LAWYERS.filter((l) => !mine.has(l.id))];
    return {
      ...s,
      lawyers,
      allReports: [...s.reports, ...SEED_REPORTS],
      signIn: (user) => setS((p) => ({ ...p, user })),
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
      reset: () => setS(initial),
    };
  }, [s]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
