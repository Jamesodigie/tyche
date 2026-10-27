// POST /api/bachs-webhook — Bachs calls this when a payment succeeds (even if the customer closed
// their browser) and when a lawyer payout finishes. Add this URL in the Bachs developer portal:
//   https://YOUR-DOMAIN/api/bachs-webhook   and put its signing secret (whsec_…) in BACHS_WEBHOOK_SECRET.
import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, fulfil } from "./_lib.js";

export const config = { api: { bodyParser: false } };

async function rawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of req as unknown as AsyncIterable<Buffer | string>) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

const h = (req: VercelRequest, name: string) => {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
};

/** HMAC-SHA256 over "<timestamp>.<raw body>", as Bachs signs it (X-Bachs-Signature-V2: t=…,v1=…). */
export function verifyBachs(raw: Buffer, headers: { v2?: string; ts?: string; sig?: string }, secret: string, now = Date.now()) {
  let t: string | undefined;
  let sigs: string[] = [];
  if (headers.v2) {
    const parts = headers.v2.split(",").map((p) => p.trim());
    const ts = parts.filter((p) => p.startsWith("t="));
    if (ts.length !== 1) return false;
    t = ts[0].slice(2);
    sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  } else {
    t = headers.ts;
    sigs = headers.sig ? [headers.sig] : [];
  }
  if (!t || !/^\d+$/.test(t) || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(t + ".").update(raw).digest();
  return sigs.some((s) => /^[a-f0-9]{64}$/i.test(s) && crypto.timingSafeEqual(expected, Buffer.from(s, "hex")));
}

export default async function webhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.BACHS_WEBHOOK_SECRET || "";
  const raw = await rawBody(req);
  if (!secret || !verifyBachs(raw, { v2: h(req, "x-bachs-signature-v2"), ts: h(req, "x-bachs-timestamp"), sig: h(req, "x-bachs-signature") }, secret))
    return res.status(401).json({ error: "bad signature" });

  let event: { id?: string; type?: string; data?: Record<string, any> } = {};
  try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "bad json" }); }
  const d = event.data || {};

  try {
    if (["collection.succeeded", "checkout.completed", "payment.succeeded", "charge.succeeded"].includes(event.type || "")) {
      // Find our payment: by reference, metadata.reference, or the checkout id.
      let ref: string | undefined = d.reference || d.metadata?.reference || d.checkout?.reference;
      const checkoutId: string | undefined = d.checkout_id || d.checkout?.checkout_id || d.checkout?.id;
      if (!ref && checkoutId) {
        const { data: p } = await db().from("payments").select("reference").eq("checkout_id", checkoutId).maybeSingle();
        ref = p?.reference;
      }
      if (ref) {
        const { data: known } = await db().from("payments").select("id").eq("reference", ref).maybeSingle();
        if (known) await fulfil(ref); // re-checks with Bachs before applying anything
      }
    } else if (/^payout\./.test(event.type || "")) {
      const id: string | undefined = d.payout_id || d.id;
      const ref: string | undefined = d.reference;
      const ok = /paid|completed|succeeded/.test(event.type!);
      const bad = /failed|rejected|reversed|cancel/.test(event.type!);
      if ((id || ref) && (ok || bad)) {
        const q = db().from("lawyer_payouts").update({ status: ok ? "completed" : "failed", last_error: bad ? d.failure_reason || event.type : null, updated_at: new Date().toISOString() });
        await (ref ? q.eq("reference", ref) : q.eq("bachs_payout_id", id!));
      }
    }
  } catch (e) {
    console.error("bachs webhook failed", e);
    return res.status(500).json({ error: "retry" }); // Bachs retries on non-2xx
  }
  return res.status(200).json({ received: true });
}
