// GET /api/email-worker — drains Tyche's transactional email queue.
// Configure a scheduled call in Vercel. Never expose RESEND_API_KEY to the browser.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_lib.js";

type Job = {
  id: string;
  event_type: string;
  recipient_user_id: string | null;
  entity_id: string;
  attempts: number;
};

const SITE = () => (process.env.SITE_URL || "https://gettyche.com.ng").replace(/\/$/, "");
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);

function emailHtml(title: string, intro: string, detail: string, cta: string, href: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f4fb;font-family:Arial,sans-serif;color:#20152e">
  <div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #eee6f5;border-radius:18px;overflow:hidden">
  <div style="padding:24px 28px;background:#6f35a5;color:#fff;font-size:22px;font-weight:700">Tyche</div>
  <div style="padding:30px 28px"><h1 style="font-size:24px;margin:0 0 16px">${esc(title)}</h1>
  <p style="font-size:16px;line-height:1.6">${esc(intro)}</p>
  ${detail ? `<div style="margin:22px 0;padding:16px;background:#f7f4fb;border-radius:12px;line-height:1.7">${esc(detail)}</div>` : ""}
  <p style="margin:28px 0"><a href="${esc(href)}" style="background:#6f35a5;color:#fff;text-decoration:none;padding:13px 18px;border-radius:9px;display:inline-block;font-weight:700">${esc(cta)}</a></p>
  <p style="font-size:13px;color:#766b80;line-height:1.6">Tyche helps people find support and connect with lawyers. For your privacy, this email does not include report details or evidence.</p>
  </div></div></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  const from = process.env.TYCHE_EMAIL_FROM || "Tyche <notifications@gettyche.com.ng>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, ...(process.env.TYCHE_EMAIL_REPLY_TO ? { reply_to: process.env.TYCHE_EMAIL_REPLY_TO } : {}) }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
}

async function render(job: Job, email: string, name: string) {
  const base = SITE();
  const greeting = name ? `Hi ${name},` : "Hello,";
  switch (job.event_type) {
    case "report_saved": {
      const { data } = await db().from("reports").select("id").eq("id", job.entity_id).maybeSingle();
      if (!data) return null;
      return { subject: "Your report has been saved — Tyche", html: emailHtml("Your report is saved", `${greeting} your report has been securely saved to your Tyche account.`, "You can return to your account to review its status and manage your report.", "View my reports", `${base}/me`) };
    }
    case "lawyer_offer_received": {
      const { data } = await db().from("bids").select("id, status").eq("id", job.entity_id).maybeSingle();
      if (!data || data.status !== "pending") return null;
      return { subject: "A lawyer has responded to your report — Tyche", html: emailHtml("You have a new lawyer offer", `${greeting} a lawyer has responded to your report on Tyche.`, "Sign in to review the offer and decide whether you want to proceed.", "Review offer", `${base}/me`) };
    }
    case "booking_confirmed":
    case "booking_reminder_24h":
    case "booking_reminder_1h":
    case "booking_cancelled": {
      const { data: bk } = await db().from("bookings").select("id, kind, date, time, channel, status, lawyers(name)").eq("id", job.entity_id).maybeSingle();
      if (!bk) return null;
      if (job.event_type !== "booking_cancelled" && !["confirmed", "completed"].includes(bk.status)) return null;
      const lawyerName = (bk as any).lawyers?.name || "your lawyer";
      const when = `${bk.date} at ${bk.time} (Nigeria time)`;
      if (job.event_type === "booking_cancelled") return { subject: "Booking cancelled — Tyche", html: emailHtml("Your booking was cancelled", `${greeting} the booking scheduled for ${when} has been cancelled.`, `Booking reference: ${bk.id}`, "Open Tyche", `${base}/me`) };
      if (job.event_type === "booking_reminder_24h") return { subject: "Reminder: your Tyche session is tomorrow", html: emailHtml("Your session is tomorrow", `${greeting} this is a reminder that your Tyche session is scheduled for ${when}.`, `Lawyer: ${lawyerName} · Format: ${bk.channel}`, "View booking", `${base}/me`) };
      if (job.event_type === "booking_reminder_1h") return { subject: "Your Tyche session starts in 1 hour", html: emailHtml("Your session starts in 1 hour", `${greeting} your Tyche session is coming up at ${when}.`, `Lawyer: ${lawyerName} · Format: ${bk.channel}`, "View booking", `${base}/me`) };
      return { subject: "Your Tyche booking is confirmed", html: emailHtml("Your booking is confirmed", `${greeting} your ${bk.kind} with ${lawyerName} has been confirmed.`, `Date and time: ${when}\nFormat: ${bk.channel}\nBooking reference: ${bk.id}`, "View booking", `${base}/me`) };
    }
    case "payment_failed": {
      const { data: pay } = await db().from("payments").select("reference, status").eq("reference", job.entity_id).maybeSingle();
      if (!pay || pay.status !== "failed") return null;
      return { subject: "Payment not completed — Tyche", html: emailHtml("Your payment wasn't completed", `${greeting} we couldn't confirm your payment for this Tyche transaction.`, `Reference: ${pay.reference}\\nIf your bank or payment provider debited you, please contact Tyche support with this reference before trying again.`, "Open Tyche", `${base}/me`) };
    }
    case "payment_received": {
      const { data: pay } = await db().from("payments").select("reference, amount, status, purpose").eq("reference", job.entity_id).maybeSingle();
      if (!pay || pay.status !== "success") return null;
      return { subject: "Payment received — Tyche", html: emailHtml("Payment received", `${greeting} Tyche has confirmed your payment.`, `Amount: ${money(Number(pay.amount))}\nReference: ${pay.reference}`, "View my account", `${base}/me`) };
    }
    default: return null;
  }
}

export default async function emailWorker(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });

  let sent = 0, skipped = 0, failed = 0;
  const { data: jobs, error } = await db().from("tyche_email_jobs").select("*").eq("status", "pending").lte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(50);
  if (error) return res.status(500).json({ error: "Could not load email queue" });

  for (const job of (jobs || []) as Job[]) {
    const { data: claimed } = await db().from("tyche_email_jobs").update({ status: "processing", attempts: job.attempts + 1 }).eq("id", job.id).eq("status", "pending").select("id");
    if (!claimed?.length) continue; // another worker already claimed it
    try {
      if (!job.recipient_user_id) {
        await db().from("tyche_email_jobs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", job.id);
        skipped++;
        continue;
      }
      const { data: profile } = await db().from("profiles").select("email, name").eq("id", job.recipient_user_id).maybeSingle();
      if (!profile?.email) {
        await db().from("tyche_email_jobs").update({ status: "sent", sent_at: new Date().toISOString(), last_error: "Recipient has no email address; skipped." }).eq("id", job.id);
        skipped++;
        continue;
      }
      const rendered = await render(job, profile.email, profile.name || "");
      if (!rendered) {
        await db().from("tyche_email_jobs").update({ status: "sent", sent_at: new Date().toISOString(), last_error: "Event no longer needs an email." }).eq("id", job.id);
        skipped++;
        continue;
      }
      await send(profile.email, rendered.subject, rendered.html);
      await db().from("tyche_email_jobs").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message.slice(0, 1000) : "Email failed";
      const attempts = job.attempts + 1;
      await db().from("tyche_email_jobs").update({
        status: attempts >= 5 ? "failed" : "pending",
        scheduled_at: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000).toISOString(),
        last_error: message,
      }).eq("id", job.id);
      failed++;
      console.error("Tyche email job failed", job.id, message);
    }
  }
  return res.status(200).json({ ok: true, sent, skipped, failed, checked: jobs?.length || 0 });
}
