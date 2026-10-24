// /api/community
//   GET  — your membership status (+ the private WhatsApp invite link once paid)
//   POST — start joining: saves your details and returns a Paystack checkout URL
import { HttpError, body, db, env, handler, reference, requireUser, startPayment } from "./_lib.js";

const price = () => Number(env("COMMUNITY_PRICE", "5000"));
const cap = () => Number(env("COMMUNITY_CAP", "10000"));

export default handler(["GET", "POST"], async (req) => {
  // Logged-out visitors just need the price and how many spots are left.
  if (req.method === "GET" && !req.headers.authorization) {
    const { data: count } = await db().rpc("community_count");
    return { price: price(), cap: cap(), count: (count as number) || 0 };
  }
  const me = await requireUser(req);
  const { data: member } = await db().from("community_members").select("*").eq("user_id", me.id).maybeSingle();
  const active = !!member && member.status === "active" && (!member.expires_at || member.expires_at > new Date().toISOString());

  if (req.method === "GET") {
    return { active, member, inviteUrl: active ? env("COMMUNITY_INVITE_URL") || null : null, price: price(), cap: cap() };
  }

  if (active) return { active: true, inviteUrl: env("COMMUNITY_INVITE_URL") || null };

  const b = body<{ name?: string; phone?: string; state?: string; heard?: string }>(req);
  const name = (b.name || "").trim().slice(0, 80);
  const phone = (b.phone || "").replace(/[^\d+]/g, "");
  if (name.length < 2) throw new HttpError(400, "Please tell us what to call you.");
  if (phone.replace(/\D/g, "").length < 10) throw new HttpError(400, "Please enter your WhatsApp number.");

  const { data: count } = await db().rpc("community_count");
  if ((count as number) >= cap()) throw new HttpError(409, "The circle is full right now. We'll let you know when a spot opens.");
  if (!me.email) throw new HttpError(400, "Please add an email address to your account to pay.");

  const ref = reference("TYC");
  await db()
    .from("community_members")
    .upsert({ user_id: me.id, name, phone, state: b.state || null, heard: b.heard || null, status: "pending", reference: ref });
  await db().from("payments").insert({ reference: ref, purpose: "community", user_id: me.id, amount: price(), tyche_share: price() });

  const payUrl = await startPayment({
    req,
    reference: ref,
    email: me.email,
    amountNaira: price(),
    metadata: { purpose: "community", user_id: me.id },
  });
  return { payUrl, reference: ref };
});
