// POST /api/push
//   { action: "subscribe", subscription }  — save this device (signed-in users are linked to their account)
//   { action: "unsubscribe", endpoint }
//   { action: "send", title, body, url, audience: "all" | "clients" | "lawyers" }  — admins only
import { HttpError, body, db, handler, requireUser, sendPush } from "./_lib.js";

type Input = {
  action?: "subscribe" | "unsubscribe" | "send";
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  endpoint?: string;
  title?: string;
  body?: string;
  url?: string;
  audience?: "all" | "clients" | "lawyers";
};

export default handler(["POST"], async (req) => {
  const b = body<Input>(req);

  if (b.action === "subscribe") {
    const s = b.subscription;
    if (!s?.endpoint || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth) throw new HttpError(400, "Invalid subscription");
    let user: { id: string; role: string } | null = null;
    if (req.headers.authorization) user = await requireUser(req).catch(() => null);
    await db().from("push_subscriptions").upsert({
      endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, user_id: user?.id ?? null, role: user?.role ?? "visitor",
    });
    return { ok: true };
  }

  if (b.action === "unsubscribe") {
    if (b.endpoint) await db().from("push_subscriptions").delete().eq("endpoint", b.endpoint);
    return { ok: true };
  }

  if (b.action === "send") {
    const me = await requireUser(req);
    if (me.role !== "admin") throw new HttpError(403, "Only admins can send notifications.");
    const title = (b.title || "").trim().slice(0, 80);
    const text = (b.body || "").trim().slice(0, 240);
    if (!title || !text) throw new HttpError(400, "Add a title and a message.");
    const url = b.url && b.url.startsWith("/") ? b.url : "/";
    const filter = b.audience === "clients" ? { roles: ["client", "visitor"] } : b.audience === "lawyers" ? { roles: ["lawyer"] } : { all: true };
    const out = await sendPush(filter, { title, body: text, url, tag: `broadcast-${Date.now()}` });
    if (!out.configured) throw new HttpError(500, "Push isn't set up yet — add VAPID_PUBLIC_KEY, VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel.");
    await db().from("admin_log").insert({ actor: me.id, text: `Sent notification "${title}" to ${b.audience || "all"} (${out.sent} devices)` });
    return out;
  }

  throw new HttpError(400, "Unknown action");
});
