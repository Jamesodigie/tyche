import { ArrowRight, Calendar, Coffee, HeartHandshake, Lock, MessageCircleHeart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Blobs, Button, Sparkle } from "../components/ui";
import { naira } from "../lib/data";
import { useStore } from "../lib/store";

const perks = [
  { i: MessageCircleHeart, t: "Real talk, zero judgement", d: "Vent, ask, laugh, cry. Nobody here asks “what were you wearing?”" },
  { i: Calendar, t: "Monthly live sessions", d: "Lawyers and therapists answer your questions in the group — free for members." },
  { i: ShieldCheck, t: "Every member verified", d: "We check every number before it joins. No random men, no trolls." },
  { i: Coffee, t: "Soft check-ins", d: "Gentle prompts, wins of the week, and reminders to drink water, babe." },
  { i: Sparkles, t: "Member perks", d: "Priority booking with Tyche lawyers and member-only discounts." },
  { i: Lock, t: "Strict privacy rules", d: "No screenshots, no forwarding. Break the rules and you're out." },
];

const rules = [
  "What's shared here, stays here — no screenshots or forwarding.",
  "Be kind. Believe women. No victim-blaming, ever.",
  "No selling, no spam, no MLMs.",
  "Respect privacy — never name or tag anyone without consent.",
];

export default function Community() {
  const { community, communityCount, communityCap, communityPrice } = useStore();
  const left = Math.max(0, communityCap - communityCount);
  const inCircle = !!community && community.status !== "pending" && community.status !== "expired";
  return (
    <>
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto grid max-w-6xl 2xl:max-w-7xl items-center gap-8 px-4 sm:gap-10 sm:px-6 py-8 sm:py-14 lg:grid-cols-2">
          <div>
            <p className="font-script text-3xl text-tangerine-500">your girls, your people</p>
            <h1 className="h-hero font-display font-semibold text-ink">The circle you <em className="font-normal text-lagoon-600">deserve.</em></h1>
            <p className="mt-5 max-w-lg text-lg text-plum-700/85">
              A private, paid WhatsApp community for women — capped at {communityCap.toLocaleString()} so it stays close, safe and
              actually supportive.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" variant="teal" to="/community/join">{inCircle ? "See my invite" : "Join the circle"} <ArrowRight size={18} /></Button>
              <span className="text-plum-600"><b className="font-display text-2xl text-ink">{naira(communityPrice)}</b> / year</span>
            </div>
          </div>
          <div className="relative rounded-[2rem] bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-6 text-white shadow-soft sm:rounded-5xl sm:p-8">
            <Sparkle className="absolute right-8 top-8 text-white/40" size={34} />
            <Users size={32} />
            {communityCount >= 100 ? (
              <>
                <p className="mt-4 font-display text-6xl font-semibold">{communityCount.toLocaleString()}</p>
                <p className="text-lagoon-50">women inside · {left.toLocaleString()} spots left</p>
                <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-gradient-to-r from-tangerine-400 to-tangerine-200" style={{ width: `${Math.min(100, (communityCount / communityCap) * 100)}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 font-display text-4xl font-semibold">Founding members wanted</p>
                <p className="mt-1 text-lagoon-50">Only {communityCap.toLocaleString()} spots, ever. Get in early.</p>
              </>
            )}
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-lagoon-100">The vibe inside (example)</p>
            <div className="mt-2 space-y-2">
              {["Just had my first consultation and I feel so much lighter 🥹", "Sending love to whoever needs it today 💜"].map((m, i) => (
                <p key={m} className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${i ? "ml-auto rounded-br-md bg-[#DCF8C6] text-ink" : "rounded-bl-md bg-white text-ink"}`}>{m}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
        <h2 className="h-section text-center font-display font-semibold text-ink">What's inside</h2>
        <div className="rail mt-6 sm:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {perks.map((p) => (
            <div key={p.t} className="rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lagoon-50 text-lagoon-600"><p.i size={22} /></span>
              <p className="mt-4 font-display text-xl font-semibold text-ink">{p.t}</p>
              <p className="mt-1 text-plum-700/80">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section mx-auto grid max-w-6xl 2xl:max-w-7xl gap-4 px-4 sm:gap-6 sm:px-6 md:grid-cols-2">
        <div className="rounded-[2rem] bg-blush-100 p-6 sm:rounded-5xl sm:p-8">
          <HeartHandshake className="text-tangerine-500" size={30} />
          <h3 className="mt-3 font-display text-3xl font-semibold text-ink">Our house rules</h3>
          <ul className="mt-5 space-y-3">
            {rules.map((r, i) => (
              <li key={r} className="flex gap-3 text-ink"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-plum-600">{i + 1}</span>{r}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between rounded-[2rem] bg-plum-700 p-6 text-white sm:rounded-5xl sm:p-8">
          <div>
            <p className="font-script text-2xl text-tangerine-200">one simple price</p>
            <p className="mt-2 font-display text-6xl font-semibold">{naira(communityPrice)}</p>
            <p className="text-plum-100">per year · cancel anytime</p>
            <ul className="mt-6 space-y-2 text-plum-50">
              {["12 months in the private WhatsApp circle", "Monthly live Q&As with lawyers & therapists", "Priority booking on Tyche"].map((x) => (
                <li key={x} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-tangerine-400" />{x}</li>
              ))}
            </ul>
          </div>
          <Button size="lg" variant="warm" className="mt-8" to="/community/join">{inCircle ? "See my invite" : "Claim my spot"} <ArrowRight size={18} /></Button>
        </div>
      </section>
    </>
  );
}
