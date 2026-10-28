import { ArrowLeft, ArrowRight, CreditCard, HeartHandshake, Lock, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Blobs, Button, Card, Field, Input, Notice, Select, Stepper } from "../components/ui";
import { STATES, naira } from "../lib/data";
import { ConsentChecks, consentRecord } from "../components/Consent";
import { COMMUNITY_REF_KEY, useStore, type CommunityStatus } from "../lib/store";

const STEPS = ["About you", "House rules", "Pay & join"];
const RULES = [
  "I'll keep everything shared in the circle private — no screenshots or forwarding.",
  "I'll be kind and never blame or shame anyone for what happened to them.",
  "I won't sell, spam or promote anything in the group.",
  "I understand Tyche can remove anyone who breaks these rules.",
];

export default function CommunityJoin() {
  const { user, community, joinCommunity, communityInvite, communityByRef, communityPrice } = useStore();
  // A guest who paid on this device: look their membership up by the payment reference.
  const [guest, setGuest] = useState<CommunityStatus | null>(null);
  useEffect(() => {
    let ref = "";
    try { ref = localStorage.getItem(COMMUNITY_REF_KEY) || ""; } catch { /* ignore */ }
    if (ref) communityByRef(ref).then((g) => g?.active && setGuest(g)).catch(() => {});
  }, [communityByRef]);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: user?.name || "", phone: "", email: user?.email || "", state: "Lagos", heard: "", adult: false, terms: false });
  const [agreed, setAgreed] = useState<boolean[]>(RULES.map(() => false));
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const active = !!community && community.status !== "pending" && community.status !== "expired";
  useEffect(() => {
    if (active) communityInvite().then(setInvite).catch(() => {});
  }, [active, communityInvite]);
  useEffect(() => {
    if (guest?.inviteUrl) setInvite(guest.inviteUrl);
  }, [guest]);
  // The account can finish loading after the first render — fill in what we know.
  useEffect(() => {
    if (user) setF((p) => ({ ...p, name: p.name || user.name, email: p.email || user.email }));
  }, [user]);

  const member = active && community
    ? { name: community.name, phone: community.phone, ref: community.ref, expiresAt: community.expiresAt || new Date(new Date(community.joinedAt).setFullYear(new Date(community.joinedAt).getFullYear() + 1)).toISOString() }
    : guest
      ? { name: guest.name || "", phone: guest.phone || "", ref: guest.reference, expiresAt: guest.expiresAt || null }
      : null;

  if (member)
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-16 text-center">
          <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><HeartHandshake size={38} /></div>
          <p className="mt-6 font-script text-3xl text-tangerine-500">welcome to the circle{member.name ? `, ${member.name.split(" ")[0].toLowerCase()}` : ""}</p>
          <h1 className="h-page font-display font-semibold text-ink">You're in! 💜</h1>
          <p className="mt-3 text-lg text-plum-700/80">
            Your private WhatsApp invite is below. It's just for you — please don't share it.
          </p>
          <Card className="mt-8 p-6 text-left">
            <p className="text-sm text-plum-400">Membership</p>
            <p className="font-semibold text-ink">Active{member.ref ? ` · ref ${member.ref}` : ""}</p>
            {member.expiresAt && <>
              <p className="mt-3 text-sm text-plum-400">Renews</p>
              <p className="font-semibold text-ink">{new Date(member.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            </>}
          </Card>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {invite ? (
              <Button size="lg" variant="teal" onClick={() => window.open(invite, "_blank", "noopener")}><MessageCircle size={18} /> Join the WhatsApp group</Button>
            ) : (
              <p className="rounded-3xl bg-cream p-4 text-sm text-plum-700">Our team will send your WhatsApp invite to {member.phone} shortly.</p>
            )}
            {user && <Button size="lg" variant="outline" to="/me">Go to my space</Button>}
          </div>
        </div>
      </section>
    );

  const valid = [f.name.trim().length > 1 && f.phone.replace(/\D/g, "").length >= 10 && /^\S+@\S+\.\S+$/.test(f.email.trim()) && f.adult && f.terms, agreed.every(Boolean), true][step];

  const pay = async () => {
    setPaying(true);
    setErr("");
    const out = await joinCommunity({ name: f.name.trim(), phone: f.phone, email: f.email.trim(), state: f.state, heard: f.heard || undefined, consent: consentRecord({ adult: f.adult, terms: f.terms }) });
    if (out.payUrl) {
      window.location.assign(out.payUrl);
      return;
    }
    setPaying(false);
    if (out.error) setErr(out.error);
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10">
        <p className="font-script text-3xl text-tangerine-500">come on in, love</p>
        <h1 className="h-page font-display font-semibold text-ink">Join the Tyche circle</h1>
        <p className="mt-2 text-plum-700/80">A private WhatsApp circle of women who get it. No account needed.</p>
        <Card className="mt-8 p-6 sm:p-8">
          <Stepper steps={STEPS} current={step} />
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Your name" hint="Shown in the group. A first name or nickname is perfect."><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
              <Field label="WhatsApp number" hint="So our team can reach you about the group."><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0803 000 0000" /></Field>
              <Field label="Email" hint="Your receipt is sent here."><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" disabled={!!user} /></Field>
              <Field label="Where are you based?"><Select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{[...STATES, "Outside Nigeria"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="How did you hear about us?" optional><Select value={f.heard} onChange={(e) => setF({ ...f, heard: e.target.value })}><option value="">Choose one</option>{["Instagram", "TikTok", "X (Twitter)", "A friend", "A lawyer", "Somewhere else"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <ConsentChecks className="sm:col-span-2" value={{ adult: f.adult, terms: f.terms }} onChange={(c) => setF({ ...f, adult: c.adult, terms: c.terms })} />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-plum-700/85">The circle only works because everyone protects it. Please read and tick each one:</p>
              {RULES.map((r, i) => (
                <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-3xl border-2 p-4 text-[15px] transition ${agreed[i] ? "border-lagoon-300 bg-lagoon-50" : "border-plum-100"}`}>
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-lagoon-500" checked={agreed[i]} onChange={() => setAgreed(agreed.map((a, j) => (j === i ? !a : a)))} />
                  <span className="text-ink">{r}</span>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-4xl bg-cream p-5">
                <div className="flex justify-between border-b border-plum-100 pb-3 text-sm"><span className="text-plum-500">Tyche circle · 12 months</span><span className="font-semibold text-ink">{naira(communityPrice)}</span></div>
                <div className="flex justify-between pt-3"><span className="font-semibold text-ink">Total</span><span className="font-display text-2xl font-semibold text-ink">{naira(communityPrice)}</span></div>
              </div>
              <p className="text-sm text-plum-600">As soon as payment goes through, you'll get a button to join the WhatsApp group. Your receipt goes to <b>{f.email}</b>.</p>
            </div>
          )}
          {err && <div className="mt-6"><Notice>{err}</Notice></div>}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Back</Button> : <span />}
            {step < 2 ? (
              <Button variant="teal" disabled={!valid} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={18} /></Button>
            ) : (
              <Button variant="warm" size="lg" disabled={paying} onClick={pay}>{paying ? "Opening secure checkout…" : <><CreditCard size={18} /> Pay {naira(communityPrice)}</>}</Button>
            )}
          </div>
          {step === 2 && <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-plum-400"><Lock size={12} /> Card or bank transfer · secured by Bachs</p>}
        </Card>
      </div>
    </section>
  );
}
