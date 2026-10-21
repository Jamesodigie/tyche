import { ArrowRight, BadgeCheck, CalendarHeart, ChevronDown, EyeOff, FileLock2, Gavel, Lock, MessageCircleHeart, Sparkles, Upload, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LawyerCard } from "../components/LawyerCard";
import { PathBubbles } from "../components/PathBubbles";
import { Avatar, Blobs, Button, Sparkle, cx } from "../components/ui";
import { COMMUNITY_MEMBERS, KIND_COPY, LAWYERS } from "../lib/data";

function HeroArt() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[460px]">
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-tangerine-100 via-blush-100 to-plum-100" />
      <div className="absolute inset-16 rounded-full bg-white/70 grain" />
      <img src="/tyche-mark.png" alt="" className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 drop-shadow-xl" />
      <Sparkle className="absolute left-[18%] top-[14%] text-tangerine-400 animate-float" size={26} />
      <Sparkle className="absolute right-[16%] top-[22%] text-plum-300 animate-float [animation-delay:1s]" size={16} />
      <Sparkle className="absolute bottom-[18%] left-[12%] text-lagoon-400 animate-float [animation-delay:2s]" size={18} />

      <div className="absolute -left-3 top-[20%] flex animate-float items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-soft sm:-left-8 sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-lagoon-100 text-lagoon-600 sm:h-10 sm:w-10"><FileLock2 size={18} /></span>
        <span className="text-left">
          <span className="block text-[13px] font-semibold text-ink sm:text-sm">3 files saved</span>
          <span className="block text-[11px] text-plum-500 sm:text-xs">Only you can see them</span>
        </span>
      </div>
      <div className="absolute -right-3 bottom-[24%] flex max-w-[220px] animate-float items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-soft [animation-delay:1.5s] sm:-right-10 sm:max-w-[240px] sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-3">
        <Avatar name="Adaeze Okafor" hue={285} size={34} className="ring-2" />
        <span className="text-left">
          <span className="block text-[13px] font-semibold text-ink sm:text-sm">Adaeze offered help</span>
          <span className="block text-[11px] text-plum-500 sm:text-xs">Free first consultation 💜</span>
        </span>
      </div>
      <div className="absolute bottom-[2%] left-1/2 flex -translate-x-1/2 animate-float items-center gap-2 whitespace-nowrap rounded-full bg-plum-600 px-3.5 py-2 text-white shadow-soft [animation-delay:.7s] sm:left-[14%] sm:translate-x-0 sm:px-4 sm:py-2.5">
        <Users size={16} />
        <span className="text-[13px] font-semibold sm:text-sm">{COMMUNITY_MEMBERS.toLocaleString()} women in the circle</span>
      </div>
    </div>
  );
}

const features = [
  { icon: Lock, title: "Your evidence, kept safe", text: "Screenshots, voice notes, videos, documents — upload them once and they stay in your private vault. Delete anything, anytime.", tone: "bg-lagoon-100 text-lagoon-600" },
  { icon: BadgeCheck, title: "Lawyers we've actually checked", text: "Every lawyer is verified with the Nigerian Bar before they can see a single case. No randoms, no time-wasters.", tone: "bg-plum-100 text-plum-700" },
  { icon: CalendarHeart, title: "Talk the way you're comfortable", text: "Voice call, private chat, or Google Meet — all inside Tyche. You never have to share your number.", tone: "bg-tangerine-100 text-tangerine-600" },
  { icon: Wallet, title: "Pay safely, through Tyche", text: "You pay Tyche, not a stranger. Your money is only released to the lawyer once your session actually happens.", tone: "bg-blush-200 text-plum-700" },
];

const faqs = [
  ["Is Tyche free to use?", "Creating an account, saving evidence and sharing your report with lawyers is free. Lawyers set their own fees — and many offer free consultations. The community circle has a small yearly fee."],
  ["Will anyone know it's me?", "Only if you want them to. When you share a report, lawyers see an anonymised summary and a nickname. Your real name and contact are only shared with a lawyer you choose."],
  ["What's the difference between a consultation and a booking?", "A consultation is a first conversation to understand your options. A booking is when you engage the lawyer to actually work on your case. They're priced separately."],
  ["Do I have to report to the police?", "No. You decide. You can just save your evidence for now, talk to a lawyer, or report formally — whenever you're ready, if ever."],
  ["Is this an NGO?", "Nope! Tyche is a company building a safer way to get legal help. That's how we keep the lights on and keep improving — without asking you for donations."],
];

export default function Home() {
  const [open, setOpen] = useState(0);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-7 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16 2xl:max-w-7xl">
          <div className="animate-rise text-center lg:text-left">
            <p className="font-script text-2xl text-tangerine-500 sm:text-3xl">hey love, you're safe here</p>
            <h1 className="h-hero mt-2 font-display font-semibold leading-[1.02] text-ink">
              You don't have to <em className="font-normal text-plum-600">carry this</em> alone.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-plum-700/85 sm:mt-5 sm:text-lg lg:mx-0">
              Tyche helps you keep your evidence safe, talk to a verified lawyer, report when you're ready, and find
              women who truly get it — privately, gently, on your terms.
            </p>
            <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start [&>*]:w-full sm:[&>*]:w-auto">
              <Button size="lg" variant="warm" to="/report">Report harassment <ArrowRight size={18} /></Button>
              <Button size="lg" variant="outline" to="/hire">Hire a lawyer</Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-plum-500 sm:mt-6 lg:justify-start">
              <EyeOff size={16} /> Nobody sees your report unless you say so.
            </p>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* PATHS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-plum-100 sm:rounded-5xl sm:p-10">
          <div className="mb-5 mt-2 text-center sm:mb-8 sm:mt-0">
            <p className="font-script text-2xl text-tangerine-500">start wherever feels right</p>
            <h2 className="h-section font-display font-semibold text-ink">What do you need today?</h2>
          </div>
          <PathBubbles />
        </div>
      </section>

      {/* FEATURES */}
      <section className="section mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <h2 className="h-section font-display font-semibold leading-tight text-ink">
            Everything you need, <em className="font-normal text-lagoon-600">in one soft place.</em>
          </h2>
          <p className="text-base text-plum-700/80 sm:text-lg">
            No long forms, no judging, no running from office to office. Just the tools to protect yourself and move
            forward — at your own pace.
          </p>
        </div>
        <div className="rail mt-8 sm:mt-10 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-4xl bg-white p-5 shadow-soft ring-1 ring-plum-100 sm:p-6">
              <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", f.tone)}><f.icon size={22} /></span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-plum-700/80">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW BIDS WORK */}
      <section className="section relative overflow-hidden bg-plum-700 py-14 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-plum-500/40 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-tangerine-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
          <p className="font-script text-2xl text-tangerine-200">the lawyers come to you</p>
          <h2 className="h-section max-w-2xl font-display font-semibold leading-tight">Share once. Let the right lawyer find you.</h2>
          <div className="rail mt-8 sm:mt-12 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
            {[
              { icon: Upload, t: "You upload", d: "Tell us what happened in your own words and add any evidence you have." },
              { icon: EyeOff, t: "We hide your name", d: "Verified lawyers see an anonymised summary — never your details." },
              { icon: Gavel, t: "Lawyers offer", d: "They send you an offer: free consultation, a fee, and a kind note." },
              { icon: Sparkles, t: "You choose", d: "Compare, chat, and pick the one who feels right. Or none at all." },
            ].map((s, i) => (
              <div key={s.t} className="rounded-4xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-plum-700"><s.icon size={22} /></span>
                  <span className="font-display text-5xl font-semibold text-white/15">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-plum-100">{s.d}</p>
              </div>
            ))}
          </div>
          <Button variant="warm" size="lg" className="mt-8 w-full sm:mt-10 sm:w-auto" to="/report">Start my report <ArrowRight size={18} /></Button>
        </div>
      </section>

      {/* CONSULTATION VS BOOKING */}
      <section className="section mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="font-script text-2xl text-tangerine-500">two ways to work with a lawyer</p>
          <h2 className="h-section font-display font-semibold text-ink">Consultation or booking?</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2">
          {(["consultation", "booking"] as const).map((k, i) => (
            <div key={k} className={cx("relative overflow-hidden rounded-[2rem] p-6 sm:rounded-5xl sm:p-10", i ? "bg-gradient-to-br from-tangerine-50 to-blush-100" : "bg-gradient-to-br from-lagoon-50 to-plum-50")}>
              <Sparkle className={cx("absolute right-6 top-6 hidden sm:right-8 sm:top-8 sm:block", i ? "text-tangerine-400" : "text-lagoon-400")} size={28} />
              <p className="text-sm font-semibold uppercase tracking-wider text-plum-500">{KIND_COPY[k].short}</p>
              <h3 className="mt-1 font-display text-3xl font-semibold text-ink">{KIND_COPY[k].title}</h3>
              <p className="mt-3 max-w-md text-plum-700/85">{KIND_COPY[k].blurb}</p>
              <ul className="mt-5 space-y-2 text-[15px] text-ink">
                {(i
                  ? ["Priced by the lawyer for your case", "Ongoing chat, calls & Meet in Tyche", "Payment held safely by Tyche"]
                  : ["Usually 30–45 minutes", "Many lawyers offer it free", "Zero obligation to continue"]
                ).map((x) => (
                  <li key={x} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-tangerine-400" />{x}</li>
                ))}
              </ul>
              <Button className="mt-7 w-full sm:w-auto" variant={i ? "warm" : "teal"} to={`/lawyers?kind=${k}`}>
                Find a lawyer for a {k} <ArrowRight size={16} />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* LAWYERS */}
      <section className="section mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-script text-2xl text-tangerine-500">women-first, verified</p>
            <h2 className="h-section font-display font-semibold text-ink">Meet a few of our lawyers</h2>
          </div>
          <Link to="/lawyers" className="inline-flex items-center gap-1 py-2 font-semibold text-plum-600 transition-all hover:gap-2">See everyone <ArrowRight size={18} /></Link>
        </div>
        <div className="rail mt-6 sm:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {LAWYERS.slice(0, 3).map((l) => <LawyerCard key={l.id} l={l} />)}
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="section mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-6 text-white sm:gap-8 sm:rounded-5xl sm:p-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-script text-2xl text-lagoon-100">your girls, your people</p>
            <h2 className="h-section font-display font-semibold leading-tight">A private circle of 10,000 women who get it.</h2>
            <p className="mt-4 max-w-lg text-lagoon-50">Real talk, gentle check-ins, live sessions with lawyers and therapists, and a space where nobody asks “why didn't you speak up?”</p>
            <Button className="mt-6 w-full sm:mt-7 sm:w-auto" variant="warm" to="/community">Join the community <ArrowRight size={18} /></Button>
          </div>
          <div className="rounded-3xl bg-white/15 p-5 ring-1 ring-white/20 sm:rounded-4xl sm:p-6">
            <div className="flex -space-x-3">
              {["Ada", "Bisi", "Chi", "Dami", "Efe", "Funmi"].map((n, i) => <Avatar key={n} name={n} hue={[20, 285, 330, 185, 40, 260][i]} size={44} className="ring-lagoon-500" />)}
            </div>
            <p className="mt-4 font-display text-4xl font-semibold">{COMMUNITY_MEMBERS.toLocaleString()}</p>
            <p className="text-lagoon-50">women already inside</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-tangerine-400" style={{ width: `${(COMMUNITY_MEMBERS / 10000) * 100}%` }} /></div>
            <p className="mt-2 text-sm text-lagoon-50">{(10000 - COMMUNITY_MEMBERS).toLocaleString()} spots left</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="h-section text-center font-display font-semibold text-ink">Questions you might have</h2>
        <div className="mt-6 space-y-3 sm:mt-8">
          {faqs.map(([q, a], i) => (
            <div key={q} className="rounded-3xl bg-white ring-1 ring-plum-100">
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-ink sm:px-6 sm:py-5 sm:text-base">
                {q}
                <ChevronDown className={cx("shrink-0 text-plum-400 transition", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="px-5 pb-5 text-[15px] text-plum-700/85 sm:px-6 sm:pb-6 sm:text-base">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <MessageCircleHeart className="mx-auto text-tangerine-400" size={40} />
        <h2 className="h-section mt-4 font-display font-semibold text-ink">Whenever you're ready, <em className="font-normal text-plum-600">we're here.</em></h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-plum-700/80 sm:text-lg">It takes about five minutes to save your story. You can stop and come back anytime.</p>
        <div className="mx-auto mt-8 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <Button size="lg" variant="warm" to="/report">Start privately</Button>
          <Button size="lg" variant="outline" to="/how-it-works">See how it works</Button>
        </div>
      </section>
    </>
  );
}
