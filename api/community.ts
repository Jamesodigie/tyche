// /api/community — joining the paid WhatsApp community. No Tyche account needed.
//   GET              — public price + member count
//   GET ?ref=…       — status of the membership paid with that payment reference (+ invite link once paid)
//   GET (signed in)  — your membership status (+ invite link once paid)
//   POST             — start joining: saves your details and returns a Bachs checkout URL.
//                      Works signed in or as a guest (name, WhatsApp number and email).
import type { VercelRequest } from "@vercel/node";
import { HttpError, body, communityInvite, db, env, handler, reference, requireUser, startPayment, type Profile } from "./_lib.js";

const price = () => Number(env("COMMUNITY_PRICE", "5000"));
const cap = () => Number(env("COMMUNITY_CAP", "0")); // 0 = no limit
const isActive = (m: { status: string; expires_at: string | null } | null) =>
  !!m && m.status === "active" && (!m.expires_at || m.expires_at > new Date().toISOString());

async function maybeUser(req: VercelRequest): Promise<Profile | null> {
  if (!req.headers.authorization) return null;
  return requireUser(req).catch(() => null);
}

export default handler(["GET", "POST"], async (req) => {
  const me = await maybeUser(req);

  if (req.method === "GET") {
    const ref = typeof req.query?.ref === "string" ? req.query.ref : "";
    if (ref) {
      // The payment reference is only known to the person who paid, so it unlocks their own invite.
      const { data: m } = await db().from("community_members").select("*").eq("reference", ref).maybeSingle();
      if (!m) throw new HttpError(404, "We couldn't find that membership.");
      const active = isActive(m);
      return { active, member: { name: m.name, phone: m.phone, status: m.status, joined_at: m.joined_at, expires_at: m.expires_at, reference: m.reference }, inviteUrl: active ? communityInvite() : null };
    }
    if (!me) {
      const { data: count } = await db().rpc("community_count");
      return { price: price(), cap: cap(), count: (count as number) || 0 };
    }
    const { data: member } = await db().from("community_members").select("*").eq("user_id", me.id).maybeSingle();
    const active = isActive(member);
    return { active, member, inviteUrl: active ? communityInvite() : null, price: price(), cap: cap() };
  }

  // ---- POST: start joining ----
  const b = body<{ name?: string; phone?: string; email?: string; state?: string; heard?: string; consent?: { adult_confirmed?: boolean; terms_version?: string } }>(req);
  const name = (b.name || "").trim().slice(0, 80);
  const phone = (b.phone || "").replace(/[^\d+]/g, "");
  const email = (me?.email || b.email || "").trim().toLowerCase();
  if (name.length < 2) throw new HttpError(400, "Please tell us what to call you.");
  if (phone.replace(/\D/g, "").length < 10) throw new HttpError(400, "Please enter your WhatsApp number.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Please enter your email — your receipt is sent there.");
  if (!b.consent?.adult_confirmed || !b.consent?.terms_version) throw new HttpError(400, "Please confirm you're 18 or older and agree to the Terms and Privacy Policy.");

  if (me) {
    const { data: member } = await db().from("community_members").select("*").eq("user_id", me.id).maybeSingle();
    if (isActive(member)) return { active: true, inviteUrl: communityInvite(), reference: member!.reference };
  } else {
    // A guest whose email already has an active membership: don't charge twice, and don't reveal the link by email alone.
    const { data: existing } = await db().from("community_members").select("status, expires_at").eq("email", email).eq("status", "active");
    if ((existing || []).some(isActive))
      throw new HttpError(409, "This email is already a member. Open the link from your payment page, or message Tyche support and we'll resend your invite.");
  }

  const { data: count } = await db().rpc("community_count");
  if (cap() > 0 && (count as number) >= cap()) throw new HttpError(409, "The circle is full right now. We'll let you know when a spot opens.");

  const ref = reference("TYC");
  const row = { name, phone, email, state: b.state || null, heard: b.heard || null, status: "pending", reference: ref, terms_version: String(b.consent.terms_version).slice(0, 20), consented_at: new Date().toISOString() };
  const save = (r: Record<string, unknown>) =>
    me ? db().from("community_members").upsert({ ...r, user_id: me.id }, { onConflict: "user_id" }) : db().from("community_members").insert(r);
  let { error } = await save(row);
  if (error && /terms_version|consented_at/.test(error.message)) {
    // Database not updated yet (schema.sql not re-run): still let them join.
    const { terms_version: _t, consented_at: _c, ...rest } = row;
    ({ error } = await save(rest));
  }
  if (error) throw new HttpError(500, error.message);
  await db().from("payments").insert({ reference: ref, purpose: "community", user_id: me?.id ?? null, amount: price(), tyche_share: price() });

  const payUrl = await startPayment({
    req,
    reference: ref,
    email,
    name,
    amountNaira: price(),
    description: "Tyche community — 12 months",
    metadata: { purpose: "community", user_id: me?.id ?? null, name, phone },
  });
  return { payUrl, reference: ref };
});
