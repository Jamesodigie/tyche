import { createContext, useContext, type ReactNode } from "react";
import type { Account, Bid, Booking, Channel, CommunityMember, Evidence, Lawyer, Message, Payment, Report, SessionKind, SupportMessage } from "./data";
import { isLive } from "./supabase";
import { LiveProvider } from "./live";
import { PreviewProvider } from "./preview";

// One contract, two implementations:
//   • LiveProvider    — Supabase + /api (real accounts, data, payments)
//   • PreviewProvider — in-browser demo, used only while the Supabase keys aren't set

export type Role = "client" | "lawyer" | "admin";
export type User = { id: string; name: string; email: string; phone?: string; role: Role; lawyerId?: string; suspended?: boolean; avatarUrl?: string };

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

export type SignUpInput = { name: string; email: string; password: string; phone?: string; role: "client" | "lawyer"; lawyer?: LawyerInput; consent?: Record<string, unknown> };
export type ReportInput = Omit<Report, "id" | "createdAt" | "evidence" | "mine" | "hidden">;
export type EvidenceUpload = { ev: Evidence; file?: File | Blob };
export type BookInput = { lawyerId: string; kind: SessionKind; date: string; time: string; channel: Channel; note?: string; reportId?: string; bidId?: string };
export type BookResult = { bookingId?: string; payUrl?: string; error?: string };
export type CommunityInput = { name: string; phone: string; email: string; state: string; heard?: string; consent?: Record<string, unknown> };
/** Membership looked up by payment reference — works without an account. */
export type CommunityStatus = { active: boolean; name?: string; phone?: string; expiresAt?: string | null; reference?: string; inviteUrl: string | null };
/** Where a guest's last community payment reference is remembered on this device. */
/** Bump when the Terms/Privacy text changes in a way people should agree to again (everyone is asked once more). */
export const CONSENT_VERSION = "2026-10-28";
/** Where an invite (?ref=) is remembered on this device until sign-up. */
export const REF_KEY = "tyche:ref";
/** Email change half-done: the other inbox's code is still needed. */
export const EMAIL_NEEDS_OTHER = "EMAIL_NEEDS_OTHER";
export const COMMUNITY_REF_KEY = "tyche:community-ref";
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
  support: SupportMessage[];
  payouts: LawyerPayout[];
};
/** 80% of a paid session, sent to the lawyer's bank by Bachs. */
export type LawyerPayout = { bookingId: string; lawyerId: string; amount: number; status: "queued" | "waiting" | "sent" | "completed" | "failed"; error?: string; updatedAt: string };

export type PushState = "unsupported" | "unconfigured" | "off" | "on" | "denied";
/** signIn() result meaning "this email still needs its verification code". */
export const NEEDS_CODE = "__needs_code__";

export type Broadcast = { title: string; body: string; url?: string; audience: "all" | "clients" | "lawyers" };

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

  /** needsConfirm: a 6-digit code was emailed; finish with verifyEmailCode(). */
  signUp: (i: SignUpInput) => Promise<{ error?: string; needsConfirm?: boolean }>;
  /** Returns NEEDS_CODE when the account exists but the email hasn't been verified yet. */
  signIn: (email: string, password: string) => Promise<string | null>;
  verifyEmailCode: (email: string, code: string) => Promise<string | null>;
  /** Saves 18+ / Terms consent for an account created before consent was asked. */
  saveConsent: (record: Record<string, unknown>) => Promise<string | null>;
  resendEmailCode: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;

  // settings — a string result is an error message, null means it worked
  /** Profile picture (resized on the device). Lawyers must have one to be listed. */
  uploadPhoto: (file: File) => Promise<string | null>;
  updateProfile: (p: { name: string; phone?: string }) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  /** Sends a code to the new address; finish with confirmEmailChange(). */
  changeEmail: (newEmail: string, password: string) => Promise<string | null>;
  confirmEmailChange: (newEmail: string, code: string) => Promise<string | null>;
  /** Permanently deletes the account and its files (after checking the password). */
  deleteAccount: (password: string) => Promise<string | null>;
  referralCount: () => Promise<number>;

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
  communityByRef: (reference: string) => Promise<CommunityStatus | null>;
  verifyPayment: (reference: string) => Promise<VerifyResult>;
  sendMessage: (bookingId: string, text: string) => Promise<void>;
  setMeetLink: (bookingId: string, link: string) => Promise<string | null>;
  completeBooking: (bookingId: string) => Promise<void>;
  takenSlots: (lawyerId: string) => Promise<Set<string>>; // "YYYY-MM-DD|10:00am"
  evidenceUrl: (e: Evidence) => Promise<string | null>;
  banks: () => Promise<{ name: string; code: string }[]>;
  setupPayout: (bankCode: string, bankName: string, accountNumber: string) => Promise<string | null>;
  refresh: () => Promise<void>;

  // support chat with the Tyche team
  support: SupportMessage[];
  sendSupport: (text: string) => Promise<string | null>;
  markSupportRead: () => Promise<void>;
  replySupport: (userId: string, text: string) => Promise<string | null>; // admins

  // push notifications
  pushState: PushState;
  enablePush: () => Promise<string | null>;
  disablePush: () => Promise<void>;
  sendBroadcast: (b: Broadcast) => Promise<{ sent?: number; error?: string }>; // admins
  retryPayouts: () => Promise<string | null>; // admins
  googleAdmin: (action: "ping" | "backfill") => Promise<{ error?: string; more?: boolean; configured?: boolean }>; // admins
  myPayouts: LawyerPayout[]; // lawyers: their own payouts

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

/** The real website must never run the demo. */
const isRealSite = () => typeof window !== "undefined" && /(^|\.)gettyche\.com\.ng$/i.test(window.location.hostname);

export function StoreProvider({ children }: { children: ReactNode }) {
  if (!isLive && isRealSite())
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#FFFBF7", fontFamily: "system-ui, sans-serif", textAlign: "center", color: "#2a1838" }}>
        <div style={{ maxWidth: 420 }}>
          <img src="/tyche-logo.png" alt="Tyche" style={{ height: 40, margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>We'll be right back</h1>
          <p style={{ color: "#6b4f80", lineHeight: 1.6 }}>Tyche is being updated. Please try again in a few minutes. In danger right now? Call <b>112</b>.</p>
          <p style={{ color: "#6b4f80", lineHeight: 1.6 }}>Need us? WhatsApp <a href="https://wa.me/2348057564242">0805 756 4242</a></p>
        </div>
      </div>
    );
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
