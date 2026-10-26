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
  const { community, communityPrice } = useStore();
  const inCircle = !!community && community.status !== "pending" && community.status !== "expired";
  return (
    <>
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-4 sm:gap-10 sm:px-6 py-5 sm:py-10 lg:grid-cols-2">
          <div>
            <p className="font-script text-2xl text-tangerine-500 sm:text-3xl">your girls, your people</p>
            <h1 className="h-hero font-display font-semibold text-ink">The circle you <em className="font-normal text-lagoon-600">deserve.</em></h1>
            <p className="mt-4 max-w-lg text-base sm:text-lg text-plum-700/85">
              A private, paid WhatsApp community for women — close, safe and actually supportive.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" variant="teal" to="/community/join">{inCircle ? "See my invite" : "Join the community"} <ArrowRight size={18} /></Button>
              <span className="text-plum-600"><b className="font-display text-2xl text-ink">{naira(communityPrice)}</b> / year</span>
            </div>
          </div>
          <div className="relative hidden rounded-[2rem] bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-6 text-white shadow-soft sm:block sm:rounded-5xl sm:p-8">
            <Sparkle className="absolute right-8 top-8 text-white/40" size={34} />
            <Users size={32} />
            <p className="mt-4 font-display text-4xl font-semibold">Join the community</p>
            <p className="mt-1 text-lagoon-50">Real talk, gentle check-ins and women who've got your back.</p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-lagoon-100">The vibe inside (example)</p>
            <div className="mt-2 space-y-2">
              {["Just had my first consultation and I feel so much lighter 🥹", "Sending love to whoever needs it today 💜"].map((m, i) => (
                <p key={m} className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${i ? "ml-auto rounded-br-md bg-[#DCF8C6] text-ink" : "rounded-bl-md bg-white text-ink"}`}>{m}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="h-section text-center font-display font-semibold text-ink">What's inside</h2>
        <div className="mt-3 grid gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {perks.map((p) => (
            <div key={p.t} className="flex items-start gap-3 rounded-3xl bg-white p-3.5 shadow-soft ring-1 ring-plum-100 sm:block sm:rounded-4xl sm:p-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lagoon-50 text-lagoon-600 sm:h-12 sm:w-12 sm:rounded-2xl"><p.i size={18} /></span>
              <span className="block min-w-0">
                <span className="block font-display text-base font-semibold text-ink sm:mt-4 sm:text-xl">{p.t}</span>
                <span className="mt-0.5 block text-sm text-plum-700/80 sm:mt-1 sm:text-base">{p.d}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-4 grid max-w-5xl gap-3 px-4 sm:mt-14 sm:gap-6 sm:px-6 md:grid-cols-2">
        <div className="rounded-3xl bg-blush-100 p-4 sm:rounded-5xl sm:p-8">
          <HeartHandshake className="hidden text-tangerine-500 sm:block" size={30} />
          <h3 className="font-display text-xl font-semibold text-ink sm:mt-3 sm:text-3xl">Our house rules</h3>
          <ul className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
            {rules.map((r, i) => (
              <li key={r} className="flex gap-2.5 text-sm text-ink sm:gap-3 sm:text-base"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-plum-600 sm:h-7 sm:w-7 sm:text-sm">{i + 1}</span>{r}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between rounded-3xl bg-plum-700 p-4 text-white sm:rounded-5xl sm:p-8">
          <div>
            <p className="font-script text-2xl text-tangerine-200">one simple price</p>
            <p className="mt-1 font-display text-4xl font-semibold sm:mt-2 sm:text-6xl">{naira(communityPrice)}</p>
            <p className="text-plum-100">per year · cancel anytime</p>
            <ul className="mt-3 space-y-1.5 text-sm text-plum-50 sm:mt-6 sm:space-y-2 sm:text-base">
              {["12 months in the private WhatsApp circle", "Monthly live Q&As with lawyers & therapists", "Priority booking on Tyche"].map((x) => (
                <li key={x} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-tangerine-400" />{x}</li>
              ))}
            </ul>
          </div>
          <Button size="lg" variant="warm" className="mt-4 sm:mt-8" to="/community/join">{inCircle ? "See my invite" : "Claim my spot"} <ArrowRight size={18} /></Button>
        </div>
      </section>
    </>
  );
}
