import { createContext, useContext, type ReactNode } from "react";
import type { Account, Bid, Booking, Channel, CommunityMember, Evidence, Lawyer, Message, Payment, Report, SessionKind } from "./data";
import { isLive } from "./supabase";
import { LiveProvider } from "./live";
import { PreviewProvider } from "./preview";

// One contract, two implementations:
//   • LiveProvider    — Supabase + /api (real accounts, data, payments)
//   • PreviewProvider — in-browser demo, used only while the Supabase keys aren't set

export type Role = "client" | "lawyer" | "admin";
export type User = { id: string; name: string; email: string; phone?: string; role: Role; lawyerId?: string; suspended?: boolean };

export type LawyerInput = {
  name: string;
  state: string;
  city: string;
  yearCalled: number;
  scn: string;
  branch?: string;
  areas: string[];
  languages: string[];
  bio: string;
  consultFee: number;
  consultFree: boolean;
  bookingFee: number;
  bookingFree: boolean;
  sessionMins: number;
  days: string[];
  from: string;
  to: string;
  channels: Channel[];
  meetLink?: string;
};

export type SignUpInput = { name: string; email: string; password: string; phone?: string; role: "client" | "lawyer"; lawyer?: LawyerInput };
export type ReportInput = Omit<Report, "id" | "createdAt" | "evidence" | "mine" | "hidden">;
export type EvidenceUpload = { ev: Evidence; file?: File | Blob };
export type BookInput = { lawyerId: string; kind: SessionKind; date: string; time: string; channel: Channel; note?: string; reportId?: string; bidId?: string };
export type BookResult = { bookingId?: string; payUrl?: string; error?: string };
export type CommunityInput = { name: string; phone: string; state: string; heard?: string };
export type VerifyResult = {
  purpose?: "booking" | "community";
  status?: "success" | "pending" | "failed";
  bookingId?: string;
  inviteUrl?: string | null;
  message?: string;
  error?: string;
};
export type CommunityRow = CommunityMember & { userId: string };

export type AdminData = {
  accounts: Account[];
  lawyers: Lawyer[];
  reports: Report[];
  bookings: Booking[];
  payments: Payment[];
  members: CommunityRow[];
  log: { at: string; text: string }[];
};

export type Ctx = {
  mode: "live" | "preview";
  ready: boolean;
  user: User | null;

  lawyers: Lawyer[]; // directory + own profile (+ everyone, for admins)
  publicLawyers: Lawyer[]; // approved only
  myLawyer: Lawyer | null;
  findLawyer: (idOrSlug?: string) => Lawyer | undefined;
  reports: Report[]; // my reports
  caseBoard: Report[]; // anonymised shared reports (approved lawyers)
  bids: Bid[];
  bookings: Booking[];
  messages: Message[];
  community: CommunityMember | null;
  communityCount: number;
  communityPrice: number;
  communityCap: number;

  signUp: (i: SignUpInput) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;

  // actions — a string result is an error message, null means it worked
  createLawyer: (i: LawyerInput, licence?: File | null) => Promise<string | null>;
  updateLawyer: (l: Lawyer) => Promise<string | null>;
  uploadLicence: (f: File) => Promise<string | null>;
  addReport: (r: ReportInput, files: EvidenceUpload[]) => Promise<{ id?: string; error?: string }>;
  addBid: (b: Omit<Bid, "id" | "createdAt" | "status">) => Promise<string | null>;
  setBidStatus: (id: string, status: Bid["status"]) => Promise<void>;
  book: (i: BookInput) => Promise<BookResult>;
  joinCommunity: (i: CommunityInput) => Promise<{ payUrl?: string; done?: boolean; error?: string }>;
  communityInvite: () => Promise<string | null>;
  verifyPayment: (reference: string) => Promise<VerifyResult>;
  sendMessage: (bookingId: string, text: string) => Promise<void>;
  setMeetLink: (bookingId: string, link: string) => Promise<string | null>;
  completeBooking: (bookingId: string) => Promise<void>;
  takenSlots: (lawyerId: string) => Promise<Set<string>>; // "YYYY-MM-DD|10:00am"
  evidenceUrl: (e: Evidence) => Promise<string | null>;
  banks: () => Promise<{ name: string; code: string }[]>;
  setupPayout: (bankCode: string, bankName: string, accountNumber: string) => Promise<string | null>;
  refresh: () => Promise<void>;

  isAdmin: boolean;
  admin: AdminData | null;
  loadAdmin: () => Promise<void>;
  lawyerState: (l: Lawyer) => "approved" | "pending" | "rejected";
  reviewLawyer: (id: string, decision: "approved" | "rejected") => Promise<void>;
  setSuspended: (a: Account, on: boolean) => Promise<void>;
  setReportHidden: (id: string, on: boolean) => Promise<void>;
  licenceUrl: (lawyerId: string) => Promise<string | null>;
  adminSignIn?: (code: string) => boolean; // preview only
  adminSignOut?: () => void; // preview only
  reset?: () => void; // preview only
};

export const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  return isLive ? <LiveProvider>{children}</LiveProvider> : <PreviewProvider>{children}</PreviewProvider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/** "Barr. Adaeze Okafor" → "adaeze-okafor-x7k" */
export const slugify = (name: string) =>
  name.toLowerCase().replace(/^barr\.?\s+/, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) +
  "-" +
  Math.random().toString(36).slice(2, 5);

export const findIn = (list: Lawyer[], idOrSlug?: string) => (idOrSlug ? list.find((l) => l.id === idOrSlug || l.slug === idOrSlug) : undefined);
