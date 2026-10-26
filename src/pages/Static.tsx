import { EyeOff, HeartHandshake, KeyRound, Lock, LogOut, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { Button, PageHero } from "../components/ui";

export function About() {
  return (
    <>
      <PageHero eyebrow="who we are" title={<>Named after the goddess of <em className="font-normal text-plum-600">fortune</em> — because you deserve better luck than this.</>} sub="Tyche is a Nigerian company building the safest, kindest way for women to get legal help after harassment." />
      <section className="mx-auto max-w-3xl space-y-3 px-4 text-sm leading-relaxed text-plum-700/90 sm:space-y-6 sm:px-6 sm:text-lg">
        <p>Too many women in Nigeria go through harassment and have nowhere to start. Police stations feel intimidating, lawyers feel expensive and far away, and evidence ends up lost in a phone gallery.</p>
        <p>So we built Tyche: one soft, private place to keep your evidence safe, talk to a verified lawyer who actually gets it, report when you're ready, and find a circle of women who'll hold you up.</p>
        <p>We're not an NGO and we don't ask for donations. Lawyers set their own prices (many offer free consultations), and Tyche earns a small service fee when you book. That keeps us independent, fast, and focused on you.</p>
        <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-4 sm:pt-4">
          {[["Your safety", "matters."], ["Your voice", "matters."], ["Justice", "matters."]].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-white p-3 text-center shadow-soft ring-1 ring-plum-100 sm:rounded-4xl sm:p-6"><p className="font-display text-sm font-semibold leading-tight text-ink sm:text-2xl">{a}</p><p className="font-script text-base text-tangerine-500 sm:text-2xl">{b}</p></div>
          ))}
        </div>
        <div className="flex justify-center pt-3 sm:pt-6"><Button size="lg" to="/report"><HeartHandshake size={18} /> Get support</Button></div>
      </section>
    </>
  );
}

export function Safety() {
  const items = [
    { i: EyeOff, t: "Anonymous by default", d: "Lawyers see a nickname and your story — never your name or contact — until you book them." },
    { i: Lock, t: "Private evidence vault", d: "Your uploads are only visible to you and the lawyers you choose to share with." },
    { i: UserCheck, t: "Verified lawyers only", d: "We confirm every lawyer's enrolment with the Bar before they can see a single case." },
    { i: KeyRound, t: "You hold the keys", d: "Nothing is reported to police, employers or schools unless you ask us to help you do it." },
    { i: Trash2, t: "Delete anytime", d: "Remove a file, a report or your whole account whenever you want." },
    { i: LogOut, t: "Quick exit", d: "Tap Quick exit or press Esc three times to leave instantly — it also clears the back button." },
  ];
  return (
    <>
      <PageHero eyebrow="your safety comes first" title="Safety & privacy" sub="Here's exactly how we protect you — no fine print." />
      <section className="mx-auto grid max-w-5xl gap-2 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3">
        {items.map((x) => (
          <div key={x.t} className="flex items-start gap-3 rounded-3xl bg-white p-3.5 shadow-soft ring-1 ring-plum-100 sm:block sm:rounded-4xl sm:p-6">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lagoon-50 text-lagoon-600 sm:h-12 sm:w-12 sm:rounded-2xl"><x.i size={18} /></span>
            <span className="block min-w-0">
              <span className="block font-display text-base font-semibold text-ink sm:mt-4 sm:text-xl">{x.t}</span>
              <span className="mt-0.5 block text-sm text-plum-700/80 sm:mt-1 sm:text-base">{x.d}</span>
            </span>
          </div>
        ))}
      </section>
      <section className="mx-auto mt-3 max-w-3xl px-4 sm:mt-12 sm:px-6">
        <div className="flex items-start gap-3 rounded-3xl bg-ink p-4 text-white sm:gap-4 sm:rounded-4xl sm:p-6">
          <ShieldCheck className="mt-0.5 shrink-0 text-tangerine-400" />
          <p className="text-sm sm:text-base">If you're in immediate danger, please call <b>112</b> — Nigeria's free emergency number. Tyche is here for everything that comes after.</p>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  return (
    <PageHero eyebrow="oops, love" title="This page wandered off" sub="Let's get you back somewhere safe.">
      <div className="mt-8 flex justify-center gap-3"><Button to="/">Go home</Button><Button variant="outline" to="/report">Get support</Button></div>
    </PageHero>
  );
}
