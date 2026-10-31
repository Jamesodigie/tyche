// Shared server helpers for the Vercel functions in /api.
// Files starting with "_" are not deployed as endpoints.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Tyche keeps this share of every paid consultation/booking; the lawyer is paid the rest automatically. */
export const TYCHE_PERCENT = 20;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function env(name: string, fallback = ""): string {
  return process.env[name] || fallback;
}

/** Private WhatsApp group link. Only ever sent to members who have paid. Override with COMMUNITY_INVITE_URL. */
export const communityInvite = () => env("COMMUNITY_INVITE_URL", "https://chat.whatsapp.com/H8Ma7LGUNGLF3gBDGH4cw9");

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
// Bachs (payments + payouts) — https://docs.bachs.io
// Keys: sk_sandbox_… → sandbox, sk_live_… → live. BACHS_API_URL overrides (tests).
// ---------------------------------------------------------------------------

function bachsBase(key: string) {
  const fixed = env("BACHS_API_URL");
  if (fixed) return fixed.replace(/\/$/, "");
  return key.startsWith("sk_sandbox_") ? "https://sandbox-api.bachs.io" : "https://api.bachs.io";
}

export async function bachs<T = any>(path: string, init?: { method?: string; body?: unknown; idempotencyKey?: string }): Promise<T> {
  const key = need("BACHS_SECRET_KEY");
  const r = await fetch(`${bachsBase(key)}${path}`, {
    method: init?.method || "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await r.json().catch(() => ({}))) as any;
  if (!r.ok) {
    const raw = json?.detail || json?.message || json?.error || `Payment provider error (${r.status})`;
    const msg = typeof raw === "string" ? raw : "Payment provider error";
    console.error("Bachs error", r.status, path, msg);
    // Account/key problems are ours to fix — never show provider jargon (sandbox keys, onboarding) to the person paying.
    if (r.status === 401 || r.status === 403 || /not yet approved|onboarding|activat|sandbox|live payments|api key|unauthori[sz]ed|forbidden/i.test(msg))
      throw new HttpError(503, "Payments are being set up and aren't open yet. Please try again a little later, or message Tyche support and we'll help you book.");
    throw new HttpError(r.status >= 500 ? 502 : 400, r.status >= 500 ? "The payment service is busy. Please try again in a minute." : msg);
  }
  return json as T;
}

export const reference = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

const money = (naira: number) => naira.toFixed(2);

/** Opens a Bachs hosted checkout for a fixed naira amount and returns its URL. */
export async function startPayment(opts: {
  req: VercelRequest;
  reference: string;
  email: string;
  name?: string;
  amountNaira: number;
  description?: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const site = siteUrl(opts.req);
  const out = await bachs<{ checkout_id: string; checkout_url: string }>("/v1/checkout-sessions", {
    method: "POST",
    idempotencyKey: opts.reference,
    body: {
      pricing: { currency: "NGN", price_type: "fixed", amount: money(opts.amountNaira) },
      customer: { email: opts.email, ...(opts.name ? { name: opts.name } : {}) },
      reference: opts.reference,
      metadata: { ...opts.metadata, reference: opts.reference, ...(opts.description ? { description: opts.description } : {}) },
      success_url: `${site}/pay/callback?reference=${encodeURIComponent(opts.reference)}`,
      cancel_url: `${site}/pay/callback?reference=${encodeURIComponent(opts.reference)}&cancelled=1`,
      expires_in_minutes: 30,
    },
  });
  if (!out.checkout_url) throw new HttpError(502, "The payment page didn't open. Please try again.");
  const { error } = await db().from("payments").update({ checkout_id: out.checkout_id }).eq("reference", opts.reference);
  if (error) throw new HttpError(500, `Couldn't start the payment: ${error.message}`);
  return out.checkout_url;
}

const PAID = new Set(["succeeded", "paid", "accepted", "overpaid", "success", "successful"]);
const DEAD = new Set(["failed", "expired", "cancelled", "canceled", "refunded", "auto_refunded", "abandoned"]);

/** Reads a checkout session from Bachs and says whether it's paid, still open, or dead. */
async function checkoutState(checkoutId: string) {
  const s = await bachs<any>(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`);
  const ps = String(s.payment_status || s.charge?.status || "").toLowerCase();
  const st = String(s.status || "").toLowerCase();
  const amount = Number(s.charge?.amount_paid ?? s.charge?.amount ?? s.amount);
  const currency = String(s.charge?.currency || s.currency || "NGN").toUpperCase();
  const state = PAID.has(ps) || (!ps && (st === "completed" || PAID.has(st)))
    ? "paid"
    : ps === "underpaid"
      ? "underpaid"
      : DEAD.has(ps) || DEAD.has(st)
        ? "failed"
        : "pending";
  return { state, amount, currency, raw: s };
}

export type FulfilResult =
  | { purpose: "booking"; status: "success"; bookingId: string }
  | { purpose: "community"; status: "success"; inviteUrl: string | null }
  | { purpose: "booking" | "community"; status: "pending" | "failed"; message: string };

/**
 * Confirms a payment with Bachs and applies its effect exactly once.
 * Called by the browser after checkout AND by the webhook — whichever comes first wins.
 */
export async function fulfil(ref: string): Promise<FulfilResult> {
  const { data: pay } = await db().from("payments").select("*").eq("reference", ref).single();
  if (!pay) throw new HttpError(404, "We couldn't find that payment.");

  if (pay.status !== "success") {
    if (!pay.checkout_id) return { purpose: pay.purpose, status: "pending", message: "Payment is still processing." };
    const cs = await checkoutState(pay.checkout_id);
    if (cs.state === "failed") {
      await db().from("payments").update({ status: "failed", raw: cs.raw }).eq("reference", ref);
      return { purpose: pay.purpose, status: "failed", message: "Payment was not completed." };
    }
    if (cs.state === "underpaid") {
      await db().from("payments").update({ raw: cs.raw }).eq("reference", ref);
      return { purpose: pay.purpose, status: "failed", message: "The amount paid was less than the price. Please message Tyche support and we'll sort it out." };
    }
    if (cs.state !== "paid") return { purpose: pay.purpose, status: "pending", message: "Payment is still processing." };
    if (cs.currency !== "NGN" || !(Math.round(cs.amount) >= pay.amount)) {
      await db().from("payments").update({ status: "failed", raw: cs.raw }).eq("reference", ref);
      throw new HttpError(400, "Payment amount didn't match. Please contact support.");
    }
    // Claim the payment atomically so concurrent callers don't apply it twice.
    const { data: claimed } = await db()
      .from("payments")
      .update({ status: "success", raw: cs.raw })
      .eq("reference", ref)
      .neq("status", "success")
      .select("id");
    if (claimed && claimed.length) await applyEffects(pay);
  }

  if (pay.purpose === "booking") return { purpose: "booking", status: "success", bookingId: pay.booking_id };
  return { purpose: "community", status: "success", inviteUrl: communityInvite() };
}

async function applyEffects(pay: { purpose: string; reference: string; booking_id: string | null; user_id: string | null; lawyer_share?: number; raw?: unknown }) {
  if (pay.purpose === "booking" && pay.booking_id) {
    const { data: bk } = await db()
      .from("bookings")
      .update({ status: "confirmed", paid_at: new Date().toISOString() })
      .eq("id", pay.booking_id)
      .select("*, lawyers(user_id)")
      .single();
    if (bk) {
      await afterBookingConfirmed(bk);
      if ((pay.lawyer_share || 0) > 0) await queuePayout(bk.id, bk.lawyer_id, pay.lawyer_share!).catch((e) => console.error("payout queue failed", e));
    }
  }
  if (pay.purpose === "community") {
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(now.getFullYear() + 1);
    // Members are found by the payment reference, so guests (no Tyche account) work too.
    const { data: m } = await db()
      .from("community_members")
      .update({ status: "active", joined_at: now.toISOString(), expires_at: expires.toISOString() })
      .eq("reference", pay.reference)
      .select("*")
      .maybeSingle();
    if (m) await toGoogle("community", { date: now.toISOString(), name: m.name, phone: m.phone, email: m.email, state: m.state, heard: m.heard, reference: m.reference, expires: m.expires_at }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Lawyer payouts — 80% of every paid session goes to the lawyer's bank automatically.
// ---------------------------------------------------------------------------

/** Records the payout (once per booking) and tries to send it straight away. */
export async function queuePayout(bookingId: string, lawyerId: string, amount: number) {
  const ref = `TYP_${bookingId}`.toUpperCase();
  await db().from("lawyer_payouts").upsert({ booking_id: bookingId, lawyer_id: lawyerId, amount, reference: ref, status: "queued" }, { onConflict: "booking_id", ignoreDuplicates: true });
  await sendPayout(bookingId);
}

/** Sends one queued payout if the lawyer's bank is ready. Safe to call repeatedly. */
export async function sendPayout(bookingId: string): Promise<string> {
  const { data: p } = await db().from("lawyer_payouts").select("*, lawyers(payout_destination, name)").eq("booking_id", bookingId).single();
  if (!p) return "missing";
  if (["sent", "completed"].includes(p.status)) return p.status;
  const dest = (p as any).lawyers?.payout_destination;
  const note = async (status: string, last_error: string | null, extra: Record<string, unknown> = {}) =>
    db().from("lawyer_payouts").update({ status, last_error, attempts: (p.attempts || 0) + 1, updated_at: new Date().toISOString(), ...extra }).eq("booking_id", bookingId);
  if (!dest) {
    await note("waiting", "Lawyer hasn't added a bank account yet.");
    return "waiting";
  }
  try {
    const d = await bachs<{ is_usable?: boolean; status?: string; status_reason?: string }>(`/v1/payouts/destinations/${encodeURIComponent(dest)}`);
    if (d.is_usable === false) {
      await note("waiting", `Bank account is ${d.status || "under review"} at Bachs${d.status_reason ? `: ${d.status_reason}` : ""}.`);
      return "waiting";
    }
    const out = await bachs<{ id: string; status: string }>("/v1/payouts", {
      method: "POST",
      idempotencyKey: p.reference,
      body: { destination: dest, amount: money(p.amount), reference: p.reference, metadata: { booking_id: bookingId, lawyer_id: p.lawyer_id } },
    });
    const done = ["completed", "paid", "succeeded"].includes(String(out.status).toLowerCase());
    await note(done ? "completed" : "sent", null, { bachs_payout_id: out.id });
    return done ? "completed" : "sent";
  } catch (e) {
    await note("failed", e instanceof Error ? e.message : "Payout failed");
    return "failed";
  }
}

/** Retries every payout that hasn't gone out yet (daily job + admin button). */
export async function runPayouts() {
  const { data } = await db().from("lawyer_payouts").select("booking_id").in("status", ["queued", "waiting", "failed"]).order("created_at").limit(50);
  const out: Record<string, number> = {};
  for (const r of data || []) {
    const s = await sendPayout(r.booking_id);
    out[s] = (out[s] || 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Google Sheets / Photos — via the Tyche Apps Script web app (GOOGLE_SCRIPT_URL).
// Best effort: never blocks a payment or sign-up.
// ---------------------------------------------------------------------------

export async function toGoogle(kind: "signup" | "community" | "file" | "ping", data: Record<string, unknown>) {
  const url = env("GOOGLE_SCRIPT_URL");
  if (!url) return false;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script reads e.postData.contents
    body: JSON.stringify({ secret: env("GOOGLE_SCRIPT_SECRET"), kind, data }),
    redirect: "follow",
  });
  const text = await r.text().catch(() => "");
  return r.ok && /"ok"\s*:\s*true/.test(text);
}

/** Accepts the related offer, opens the chat thread and pings the lawyer. */
export async function afterBookingConfirmed(bk: any, note?: string) {
  if (bk.lawyers?.user_id)
    await sendPush({ userIds: [bk.lawyers.user_id] }, {
      title: "You've been booked 🎉",
      body: `${bk.client_name} booked a ${bk.kind} on ${bk.date} at ${bk.time}.`,
      url: "/lawyer/dashboard",
      tag: `booking-${bk.id}`,
    }).catch(() => {});
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

// ---------------------------------------------------------------------------
// Push notifications (Web Push / VAPID)
// ---------------------------------------------------------------------------

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

let pushReady: boolean | null = null;
async function webpush() {
  const mod = (await import("web-push")).default;
  if (pushReady === null) {
    const pub = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    pushReady = !!(pub && priv);
    if (pushReady) mod.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@tyche.io", pub!, priv!);
  }
  return pushReady ? mod : null;
}

/** Sends to every matching subscription; removes ones the browser has dropped. */
export async function sendPush(filter: { userIds?: string[]; roles?: string[]; all?: boolean }, payload: PushPayload) {
  const wp = await webpush();
  if (!wp) return { sent: 0, failed: 0, removed: 0, configured: false };
  let q = db().from("push_subscriptions").select("*");
  if (filter.userIds) q = q.in("user_id", filter.userIds.length ? filter.userIds : ["00000000-0000-0000-0000-000000000000"]);
  else if (filter.roles) q = q.in("role", filter.roles);
  const { data: subs } = await q;
  let sent = 0, failed = 0;
  const dead: string[] = [];
  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await wp.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length) await db().from("push_subscriptions").delete().in("endpoint", dead);
  return { sent, failed, removed: dead.length, configured: true };
}
