import { ArrowRight, Gavel, HeartHandshake, Scale, ShieldCheck } from "lucide-react";
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
      "Pay Tyche securely. We release payment to the lawyer only after your session.",
    ],
  },
  {
    icon: HeartHandshake, title: "Join the community", tone: "from-lagoon-50 to-lagoon-100", cta: ["/community", "Join the circle"],
    steps: [
      "Tell us a little about you and agree to the house rules.",
      `Pay ${naira(COMMUNITY_PRICE)} for a year.`,
      "Get your private WhatsApp invite — the circle is capped at 10,000 women.",
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
  return (
    <>
      <PageHero eyebrow="simple, gentle, clear" title="How Tyche works" sub="Four ways in. Pick the one you need today — they all connect." />
      <section className="mx-auto grid max-w-6xl 2xl:max-w-7xl gap-4 px-4 sm:gap-6 sm:px-6 md:grid-cols-2">
        {journeys.map((j) => (
          <div key={j.title} className={cx("rounded-5xl bg-gradient-to-br p-8", j.tone)}>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-plum-700 shadow-sm"><j.icon size={26} /></span>
            <h2 className="mt-5 font-display text-3xl font-semibold text-ink">{j.title}</h2>
            <ol className="mt-5 space-y-3">
              {j.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-ink"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-plum-600">{i + 1}</span><span className="pt-0.5">{s}</span></li>
              ))}
            </ol>
            <Button className="mt-7 w-full sm:w-auto" to={j.cta[0]}>{j.cta[1]} <ArrowRight size={16} /></Button>
          </div>
        ))}
      </section>
      <section className="mx-auto mt-12 sm:mt-16 max-w-4xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-plum-100 sm:rounded-5xl sm:p-8">
          <h2 className="font-display text-3xl font-semibold text-ink">About fees, in plain words</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Consultation fee", "Set by each lawyer for a first conversation. Many offer it free."],
              ["Booking fee", "Set by each lawyer for working on your case. Separate from the consultation."],
              ["Where your money goes", "You pay Tyche. After the session, the lawyer receives their share and Tyche keeps 20% to run the platform."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-3xl bg-cream p-5"><p className="font-semibold text-ink">{t}</p><p className="mt-1 text-sm text-plum-600">{d}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
