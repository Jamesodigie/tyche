import { ArrowLeft, ArrowRight, CreditCard, HeartHandshake, Lock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Blobs, Button, Card, Field, Input, Select, Stepper } from "../components/ui";
import { COMMUNITY_CAP, COMMUNITY_MEMBERS, COMMUNITY_PRICE, STATES, naira, uid } from "../lib/data";
import { useStore } from "../lib/store";

const STEPS = ["About you", "House rules", "Pay & join"];
const RULES = [
  "I'll keep everything shared in the circle private — no screenshots or forwarding.",
  "I'll be kind and never blame or shame anyone for what happened to them.",
  "I won't sell, spam or promote anything in the group.",
  "I understand Tyche can remove anyone who breaks these rules.",
];

export default function CommunityJoin() {
  const { user, signIn, community, joinCommunity } = useStore();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: user?.name || "", phone: "", email: user?.email || "", state: "Lagos", heard: "", adult: false });
  const [agreed, setAgreed] = useState<boolean[]>(RULES.map(() => false));
  const [paying, setPaying] = useState(false);

  if (community)
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-xl px-5 py-16 text-center">
          <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><HeartHandshake size={38} /></div>
          <p className="mt-6 font-script text-3xl text-tangerine-500">welcome to the circle, {community.name.split(" ")[0].toLowerCase()}</p>
          <h1 className="font-display text-4xl font-semibold text-ink">You're in! 💜</h1>
          <p className="mt-3 text-lg text-plum-700/80">
            We've sent your private invite to <b>{community.phone}</b> on WhatsApp. It's a one-time link just for you — please don't share it.
          </p>
          <Card className="mt-8 p-6 text-left">
            <p className="text-sm text-plum-400">Membership</p>
            <p className="font-semibold text-ink">Member #{(COMMUNITY_MEMBERS + 1).toLocaleString()} · ref {community.ref}</p>
            <p className="mt-3 text-sm text-plum-400">Renews</p>
            <p className="font-semibold text-ink">{new Date(new Date(community.joinedAt).setFullYear(new Date(community.joinedAt).getFullYear() + 1)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </Card>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="teal" onClick={() => window.open("https://wa.me/", "_blank")}><MessageCircle size={18} /> Open WhatsApp</Button>
            <Button size="lg" variant="outline" to="/me">Go to my space</Button>
          </div>
        </div>
      </section>
    );

  const valid = [f.name.trim().length > 1 && f.phone.replace(/\D/g, "").length >= 10 && f.adult, agreed.every(Boolean), true][step];

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      if (!user) signIn({ name: f.name.trim(), email: f.email || f.phone, phone: f.phone, role: "client" });
      joinCommunity({ name: f.name.trim(), phone: f.phone, city: f.state, joinedAt: new Date().toISOString(), ref: uid("CM-") });
    }, 1600);
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-2xl px-5 py-12">
        <p className="font-script text-3xl text-tangerine-500">come on in, love</p>
        <h1 className="font-display text-4xl font-semibold text-ink">Join the Tyche circle</h1>
        <p className="mt-2 text-plum-700/80">{(COMMUNITY_CAP - COMMUNITY_MEMBERS).toLocaleString()} of {COMMUNITY_CAP.toLocaleString()} spots left.</p>
        <Card className="mt-8 p-6 sm:p-8">
          <Stepper steps={STEPS} current={step} />
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Your name" hint="Shown in the group. A first name or nickname is perfect."><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
              <Field label="WhatsApp number" hint="Your invite is sent here."><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0803 000 0000" /></Field>
              <Field label="Email" optional><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              <Field label="Where are you based?"><Select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{[...STATES, "Outside Nigeria"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="How did you hear about us?" optional><Select value={f.heard} onChange={(e) => setF({ ...f, heard: e.target.value })}><option value="">Choose one</option>{["Instagram", "TikTok", "X (Twitter)", "A friend", "A lawyer", "Somewhere else"].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-cream p-4 text-sm sm:col-span-2">
                <input type="checkbox" className="h-5 w-5 accent-plum-600" checked={f.adult} onChange={(e) => setF({ ...f, adult: e.target.checked })} />
                <span className="text-ink">I'm 18 or older</span>
              </label>
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
                <div className="flex justify-between border-b border-plum-100 pb-3 text-sm"><span className="text-plum-500">Tyche circle · 12 months</span><span className="font-semibold text-ink">{naira(COMMUNITY_PRICE)}</span></div>
                <div className="flex justify-between pt-3"><span className="font-semibold text-ink">Total</span><span className="font-display text-2xl font-semibold text-ink">{naira(COMMUNITY_PRICE)}</span></div>
              </div>
              <p className="text-sm text-plum-600">Your WhatsApp invite is sent to <b>{f.phone}</b> as soon as payment goes through.</p>
            </div>
          )}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Back</Button> : <span />}
            {step < 2 ? (
              <Button variant="teal" disabled={!valid} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={18} /></Button>
            ) : (
              <Button variant="warm" size="lg" disabled={paying} onClick={pay}>{paying ? "Processing…" : <><CreditCard size={18} /> Pay {naira(COMMUNITY_PRICE)}</>}</Button>
            )}
          </div>
          {step === 2 && <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-plum-400"><Lock size={12} /> Card, transfer or USSD · secured by Paystack</p>}
        </Card>
      </div>
    </section>
  );
}
