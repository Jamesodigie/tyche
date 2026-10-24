// Shared server helpers for the Vercel functions in /api.
// Files starting with "_" are not deployed as endpoints.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Tyche keeps this share of every paid consultation/booking. Must match the Paystack subaccount setting. */
export const TYCHE_PERCENT = 20;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function env(name: string, fallback = ""): string {
  return process.env[name] || fallback;
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new HttpError(500, `Server is missing the ${name} setting. Add it in Vercel → Settings → Environment Variables.`);
  return v;
}

let _admin: SupabaseClient | null = null;
/** Service-role client: bypasses RLS. Only ever used on the server. */
export function db(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export type Profile = { id: string; name: string; email: string | null; phone: string | null; role: string; suspended: boolean };

/** Reads the Supabase access token from the Authorization header and returns the signed-in user's profile. */
export async function requireUser(req: VercelRequest): Promise<Profile> {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please sign in first.");
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Please sign in again.");
  const { data: profile } = await db().from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) throw new HttpError(401, "We couldn't find your account.");
  if (profile.suspended) throw new HttpError(403, "Your account is paused while our team reviews it.");
  return profile as Profile;
}

/** Wraps a handler with method checks, JSON errors and no-cache headers. */
export function handler(methods: string[], fn: (req: VercelRequest, res: VercelResponse) => Promise<unknown>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Cache-Control", "no-store");
    if (!methods.includes(req.method || "")) {
      res.setHeader("Allow", methods.join(", "));
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const out = await fn(req, res);
      if (!res.headersSent) res.status(200).json(out ?? { ok: true });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      if (!res.headersSent) res.status(status).json({ error: e instanceof Error ? e.message : "Something went wrong" });
    }
  };
}

export function body<T = Record<string, unknown>>(req: VercelRequest): T {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body) as T; } catch { return {} as T; }
  }
  return (req.body || {}) as T;
}

export function siteUrl(req: VercelRequest): string {
  const fixed = env("SITE_URL");
  if (fixed) return fixed.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// Paystack
// ---------------------------------------------------------------------------

type PaystackResponse<T> = { status: boolean; message: string; data: T };

export async function paystack<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(`https://api.paystack.co${path}`, {
    method: init?.method || "GET",
    headers: { Authorization: `Bearer ${need("PAYSTACK_SECRET_KEY")}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await r.json().catch(() => ({}))) as PaystackResponse<T>;
  if (!r.ok || !json.status) throw new HttpError(r.status >= 500 ? 502 : 400, json.message || "Payment provider error");
  return json.data;
}

export const reference = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

export async function startPayment(opts: {
  req: VercelRequest;
  reference: string;
  email: string;
  amountNaira: number;
  metadata: Record<string, unknown>;
  subaccount?: string | null;
}): Promise<string> {
  const data = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: opts.email,
      amount: Math.round(opts.amountNaira * 100), // kobo
      currency: "NGN",
      reference: opts.reference,
      callback_url: `${siteUrl(opts.req)}/pay/callback`,
      metadata: opts.metadata,
      ...(opts.subaccount ? { subaccount: opts.subaccount, bearer: "account" } : {}),
    },
  });
  return data.authorization_url;
}

export type FulfilResult =
  | { purpose: "booking"; status: "success"; bookingId: string }
  | { purpose: "community"; status: "success"; inviteUrl: string | null }
  | { purpose: "booking" | "community"; status: "pending" | "failed"; message: string };

/**
 * Confirms a payment with Paystack and applies its effect exactly once.
 * Called by the browser after checkout AND by the webhook — whichever comes first wins.
 */
export async function fulfil(ref: string): Promise<FulfilResult> {
  const { data: pay } = await db().from("payments").select("*").eq("reference", ref).single();
  if (!pay) throw new HttpError(404, "We couldn't find that payment.");

  if (pay.status !== "success") {
    const tx = await paystack<{ status: string; amount: number; currency: string; gateway_response?: string }>(
      `/transaction/verify/${encodeURIComponent(ref)}`,
    );
    if (tx.status !== "success") {
      if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
        await db().from("payments").update({ status: "failed", raw: tx }).eq("reference", ref);
        return { purpose: pay.purpose, status: "failed", message: tx.gateway_response || "Payment was not completed." };
      }
      return { purpose: pay.purpose, status: "pending", message: "Payment is still processing." };
    }
    if (tx.currency !== "NGN" || tx.amount !== pay.amount * 100) {
      await db().from("payments").update({ status: "failed", raw: tx }).eq("reference", ref);
      throw new HttpError(400, "Payment amount didn't match. Please contact support.");
    }
    // Claim the payment atomically so concurrent callers don't apply it twice.
    const { data: claimed } = await db()
      .from("payments")
      .update({ status: "success", raw: tx })
      .eq("reference", ref)
      .neq("status", "success")
      .select("id");
    if (claimed && claimed.length) await applyEffects(pay);
  }

  if (pay.purpose === "booking") return { purpose: "booking", status: "success", bookingId: pay.booking_id };
  return { purpose: "community", status: "success", inviteUrl: env("COMMUNITY_INVITE_URL") || null };
}

async function applyEffects(pay: { purpose: string; booking_id: string | null; user_id: string | null; raw?: unknown }) {
  if (pay.purpose === "booking" && pay.booking_id) {
    const { data: bk } = await db()
      .from("bookings")
      .update({ status: "confirmed", paid_at: new Date().toISOString() })
      .eq("id", pay.booking_id)
      .select("*, lawyers(user_id)")
      .single();
    if (bk) await afterBookingConfirmed(bk);
  }
  if (pay.purpose === "community" && pay.user_id) {
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(now.getFullYear() + 1);
    await db()
      .from("community_members")
      .update({ status: "active", joined_at: now.toISOString(), expires_at: expires.toISOString() })
      .eq("user_id", pay.user_id);
  }
}

/** Accepts the related offer and opens the chat thread. */
export async function afterBookingConfirmed(bk: any, note?: string) {
  if (bk.bid_id) await db().from("bids").update({ status: "accepted" }).eq("id", bk.bid_id);
  const lawyerUser = bk.lawyers?.user_id;
  const rows: { booking_id: string; sender_id: string; body: string }[] = [];
  const clientNote = note ?? bk.note;
  if (clientNote) rows.push({ booking_id: bk.id, sender_id: bk.client_id, body: String(clientNote).slice(0, 4000) });
  if (lawyerUser)
    rows.push({
      booking_id: bk.id,
      sender_id: lawyerUser,
      body: "Hi, thank you for booking with me. You can share anything here before our session — it stays between us. 💜",
    });
  if (rows.length) await db().from("messages").insert(rows);
}
