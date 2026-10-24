// POST /api/paystack-webhook — Paystack calls this when a charge succeeds, even if the
// user closed their browser before returning. Set this URL in Paystack → Settings →
// API Keys & Webhooks → Live Webhook URL:  https://YOUR-DOMAIN/api/paystack-webhook
import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fulfil } from "./_lib.js";

async function rawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req as unknown as AsyncIterable<Buffer | string>) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks).toString("utf8");
}

export default async function webhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  const raw = await rawBody(req);
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  const given = String(req.headers["x-paystack-signature"] || "");
  if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return res.status(401).json({ error: "bad signature" });
  }
  let event: { event?: string; data?: { reference?: string } } = {};
  try { event = JSON.parse(raw); } catch { /* ignore */ }
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await fulfil(event.data.reference);
    } catch (e) {
      console.error("webhook fulfil failed", e);
      return res.status(500).json({ error: "retry" }); // Paystack retries on non-2xx
    }
  }
  return res.status(200).json({ received: true });
}
