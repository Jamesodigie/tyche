import { ArrowRight, Gavel, HeartHandshake, Scale, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button, PageHero, cx } from "../components/ui";
import { COMMUNITY_PRICE, naira } from "../lib/data";

const journeys = [
  {
    icon: ShieldCheck, title: "Report harassment", tone: "from-tangerine-50 to-blush-100", cta: ["/report", "Start a report"],
    steps: [
      "Create a private space — a nickname is enough.",
      "Tell us what happened in your own words.",
      "Upload screenshots, voice notes, videos or documents.",
      "Choose whether verified lawyers can see it (anonymously) and send offers.",
      "Compare offers, chat, and book the lawyer who feels right — or simply keep it saved.",
    ],
  },
  {
    icon: Scale, title: "Hire a lawyer", tone: "from-plum-50 to-plum-100", cta: ["/hire", "Find a lawyer"],
    steps: [
      "Choose a consultation (a first chat) or a booking (engage them for your case).",
      "Browse verified lawyers by case type, location, language and fee.",
      "Pick a time and how you want to talk: call, chat or Google Meet — all inside Tyche.",
      "Pay securely through Tyche with Bachs (card or bank transfer).",
    ],
  },
  {
    icon: HeartHandshake, title: "Join the community", tone: "from-lagoon-50 to-lagoon-100", cta: ["/community", "Join the circle"],
    steps: [
      "Tell us a little about you and agree to the house rules.",
      `Pay ${naira(COMMUNITY_PRICE)} for a year.`,
      "Get your private WhatsApp invite and join the circle.",
    ],
  },
  {
    icon: Gavel, title: "For lawyers", tone: "from-blush-50 to-blush-200", cta: ["/join/lawyer", "Create a lawyer account"],
    steps: [
      "Sign up and we verify your enrolment with the Bar.",
      "Set your consultation fee and booking fee — or make either free.",
      "Set your days, hours and how you like to talk to clients.",
      "See anonymised cases with evidence and bid on the ones you can help with.",
      "Get paid through Tyche. We keep a 20% service fee; you keep 80%.",
    ],
  },
];

export default function HowItWorks() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <PageHero eyebrow="simple, gentle, clear" title="How Tyche works" sub="Four ways in. Pick the one you need today — they all connect." />
      {/* phones: one journey at a time */}
      <div className="no-scrollbar mx-auto mb-3 flex max-w-5xl gap-2 overflow-x-auto px-4 md:hidden">
        {journeys.map((j, i) => (
          <button key={j.title} onClick={() => setTab(i)} className={cx("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold", tab === i ? "bg-plum-600 text-white" : "bg-white text-plum-600 ring-1 ring-plum-100")}>
            <j.icon size={15} /> {j.title}
          </button>
        ))}
      </div>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 sm:gap-6 sm:px-6 md:grid-cols-2">
        {journeys.map((j, idx) => (
          <div key={j.title} className={cx("rounded-3xl bg-gradient-to-br p-5 sm:rounded-5xl sm:p-8", j.tone, tab !== idx && "hidden md:block")}>
            <span className="hidden h-14 w-14 place-items-center rounded-full bg-white text-plum-700 shadow-sm md:grid"><j.icon size={26} /></span>
            <h2 className="font-display text-2xl font-semibold text-ink md:mt-5 md:text-3xl">{j.title}</h2>
            <ol className="mt-3 space-y-2.5 md:mt-5 md:space-y-3">
              {j.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-ink sm:text-base"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-plum-600 sm:h-7 sm:w-7 sm:text-sm">{i + 1}</span><span className="pt-0.5">{s}</span></li>
              ))}
            </ol>
            <Button className="mt-5 w-full sm:w-auto md:mt-7" to={j.cta[0]}>{j.cta[1]} <ArrowRight size={16} /></Button>
          </div>
        ))}
      </section>
      <section className="mx-auto mt-4 max-w-4xl px-4 sm:mt-16 sm:px-6">
        <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-plum-100 sm:rounded-5xl sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink sm:text-3xl">About fees, in plain words</h2>
          <div className="mt-3 grid gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-4">
            {[
              ["Consultation fee", "Set by each lawyer for a first conversation. Many offer it free."],
              ["Booking fee", "Set by each lawyer for working on your case. Separate from the consultation."],
              ["Where your money goes", "You pay through Tyche with Bachs. The lawyer is automatically paid 80% into their bank account and Tyche keeps 20% to run the platform."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-cream p-3 sm:rounded-3xl sm:p-5"><p className="text-sm font-semibold text-ink sm:text-base">{t}</p><p className="mt-0.5 text-xs text-plum-600 sm:mt-1 sm:text-sm">{d}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
