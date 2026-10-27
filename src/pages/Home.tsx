import { ArrowRight, BadgeCheck, CalendarHeart, ChevronDown, EyeOff, FileLock2, Gavel, Lock, MessageCircleHeart, Sparkles, Upload, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { LawyerCard } from "../components/LawyerCard";
import { PathBubbles } from "../components/PathBubbles";
import { openSupport } from "../components/Support";
import { Avatar, Blobs, Button, Sparkle, cx } from "../components/ui";
import { useStore } from "../lib/store";

function HeroArt() {
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[230px] sm:block sm:max-w-[320px] lg:max-w-[400px]">
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
          <span className="block text-[11px] text-plum-500 sm:text-xs">Private &amp; backed up</span>
        </span>
      </div>
      <div className="absolute -right-3 bottom-[24%] flex max-w-[220px] animate-float items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-soft [animation-delay:1.5s] sm:-right-10 sm:max-w-[240px] sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-3">
        <Avatar name="Verified Lawyer" hue={285} size={34} className="ring-2" />
        <span className="text-left">
          <span className="block text-[13px] font-semibold text-ink sm:text-sm">A lawyer offered help</span>
          <span className="block text-[11px] text-plum-500 sm:text-xs">Free first consultation 💜</span>
        </span>
      </div>
      <div className="absolute bottom-[2%] left-1/2 flex -translate-x-1/2 animate-float items-center gap-2 whitespace-nowrap rounded-full bg-plum-600 px-3.5 py-2 text-white shadow-soft [animation-delay:.7s] sm:left-[14%] sm:translate-x-0 sm:px-4 sm:py-2.5">
        <Users size={16} />
        <span className="text-[13px] font-semibold sm:text-sm">Join the community</span>
      </div>
    </div>
  );
}

const features = [
  { icon: Lock, title: "Your evidence, kept safe", text: "Screenshots, voice notes, videos, documents — upload them once and they stay private, with a secure backup kept by the Tyche team. Ask us to delete anything, anytime.", tone: "bg-lagoon-100 text-lagoon-600" },
  { icon: BadgeCheck, title: "Lawyers we've actually checked", text: "Every lawyer is verified with the Nigerian Bar before they can see a single case. No randoms, no time-wasters.", tone: "bg-plum-100 text-plum-700" },
  { icon: CalendarHeart, title: "Talk the way you're comfortable", text: "Voice call, private chat, or Google Meet — all inside Tyche. You never have to share your number.", tone: "bg-tangerine-100 text-tangerine-600" },
  { icon: Wallet, title: "Pay safely, through Tyche", text: "You pay through Tyche with Bachs — card or bank transfer — never into a stranger's personal account.", tone: "bg-blush-200 text-plum-700" },
];

const faqs = [
  ["Is Tyche free to use?", "Creating an account, saving evidence and sharing your report with lawyers is free. Lawyers set their own fees — and many offer free consultations. The community circle has a small yearly fee."],
  ["Will anyone know it's me?", "Only if you want them to. When you share a report, lawyers see an anonymised summary and a nickname. Your real name and contact are only shared with a lawyer you choose."],
  ["Do I have to report to the police?", "No. You decide. You can just save your evidence for now, talk to a lawyer, or report formally — whenever you're ready, if ever."],
  ["Is this an NGO?", "Nope! Tyche is a company building a safer way to get legal help. That's how we keep the lights on and keep improving — without asking you for donations."],
];

export default function Home() {
  const [open, setOpen] = useState(0);
  const { publicLawyers } = useStore();
  const featured = publicLawyers.slice(0, 3);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto grid max-w-5xl items-center gap-6 px-4 pb-8 pt-6 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
          <div className="animate-rise text-center lg:text-left">
            <p className="font-script text-2xl text-tangerine-500 sm:text-3xl">hey love, you're safe here</p>
            <h1 className="h-hero mt-2 font-display font-semibold leading-[1.02] text-ink">
              You don't have to <em className="font-normal text-plum-600">carry this</em> alone.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-plum-700/85 sm:mt-5 sm:text-lg lg:mx-0">
              Tyche helps you keep your evidence safe, talk to a verified lawyer, report when you're ready, and find
              women who truly get it — privately, gently, on your terms.
            </p>
            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:mt-7 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start [&>*]:w-full sm:[&>*]:w-auto">
              <Button size="lg" variant="warm" to="/report">Report harassment <ArrowRight size={18} /></Button>
              <Button size="lg" variant="outline" to="/hire">Hire a lawyer</Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-plum-500 sm:mt-6 lg:justify-start">
              <EyeOff size={16} /> Lawyers only see your report if you say so.
            </p>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* PATHS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl bg-white p-3 shadow-soft ring-1 ring-plum-100 sm:rounded-5xl sm:p-8">
          <div className="mb-3 mt-1 text-center sm:mb-8 sm:mt-0">
            <p className="font-script text-2xl text-tangerine-500">start wherever feels right</p>
            <h2 className="h-section font-display font-semibold text-ink">What do you need today?</h2>
          </div>
          <PathBubbles />
        </div>
      </section>

      {/* FEATURES */}
      <section className="section mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <h2 className="h-section font-display font-semibold leading-tight text-ink">
            Everything you need, <em className="font-normal text-lagoon-600">in one soft place.</em>
          </h2>
          <p className="hidden text-base text-plum-700/80 sm:block sm:text-lg">
            No long forms, no judging, no running from office to office. Just the tools to protect yourself and move
            forward — at your own pace.
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-3xl bg-white p-3.5 shadow-soft ring-1 ring-plum-100 sm:block sm:rounded-4xl sm:p-6">
              <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl", f.tone)}><f.icon size={18} /></span>
              <span className="block min-w-0">
                <h3 className="font-display text-base font-semibold text-ink sm:mt-4 sm:text-xl">{f.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-plum-700/80 sm:mt-2 sm:line-clamp-none sm:text-[15px] sm:leading-relaxed">{f.text}</p>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW BIDS WORK */}
      <section className="section relative overflow-hidden bg-plum-700 py-7 text-white sm:py-14">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-plum-500/40 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-tangerine-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <p className="font-script text-2xl text-tangerine-200">the lawyers come to you</p>
          <h2 className="h-section max-w-2xl font-display font-semibold leading-tight">Share once. Let the right lawyer find you.</h2>
          <div className="mt-4 grid gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[
              { icon: Upload, t: "You upload", d: "Tell us what happened in your own words and add any evidence you have." },
              { icon: EyeOff, t: "We hide your name", d: "Verified lawyers see an anonymised summary — never your details." },
              { icon: Gavel, t: "Lawyers offer", d: "They send you an offer: free consultation, a fee, and a kind note." },
              { icon: Sparkles, t: "You choose", d: "Compare, chat, and pick the one who feels right. Or none at all." },
            ].map((s, i) => (
              <div key={s.t} className="flex items-start gap-3 rounded-3xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur sm:block sm:rounded-4xl sm:p-6">
                <div className="flex shrink-0 items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-plum-700 sm:h-12 sm:w-12"><s.icon size={18} /></span>
                  <span className="hidden font-display text-5xl font-semibold text-white/15 sm:inline">0{i + 1}</span>
                </div>
                <span className="block min-w-0">
                  <h3 className="font-display text-base font-semibold sm:mt-4 sm:text-xl">{i + 1}. {s.t}</h3>
                  <p className="mt-0.5 text-sm leading-snug text-plum-100 sm:mt-2 sm:text-[15px] sm:leading-relaxed">{s.d}</p>
                </span>
              </div>
            ))}
          </div>
          <Button variant="warm" size="lg" className="mt-6 w-full sm:mt-8 sm:w-auto" to="/report">Start my report <ArrowRight size={18} /></Button>
        </div>
      </section>

      {/* LAWYERS */}
      {featured.length > 0 && <section className="section mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-script text-2xl text-tangerine-500">women-first, verified</p>
            <h2 className="h-section font-display font-semibold text-ink">Meet a few of our lawyers</h2>
          </div>
          <Link to="/lawyers" className="inline-flex items-center gap-1 py-2 font-semibold text-plum-600 transition-all hover:gap-2">See everyone <ArrowRight size={18} /></Link>
        </div>
        <div className="rail mt-6 sm:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {featured.map((l) => <LawyerCard key={l.id} l={l} />)}
        </div>
      </section>}

      {/* COMMUNITY */}
      <section className="section mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-lagoon-500 to-lagoon-600 p-6 text-white sm:gap-8 sm:rounded-5xl sm:p-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-script text-2xl text-lagoon-100">your girls, your people</p>
            <h2 className="h-section font-display font-semibold leading-tight">A private circle of women who get it.</h2>
            <p className="mt-4 max-w-lg text-lagoon-50">Real talk, gentle check-ins, live sessions with lawyers and therapists, and a space where nobody asks “why didn't you speak up?”</p>
            <Button className="mt-6 w-full sm:mt-7 sm:w-auto" variant="warm" to="/community">Join the community <ArrowRight size={18} /></Button>
          </div>
          <div className="hidden rounded-3xl bg-white/15 p-5 ring-1 ring-white/20 sm:block sm:rounded-4xl sm:p-6">
            <div className="flex -space-x-3">
              {["Ada", "Bisi", "Chi", "Dami", "Efe", "Funmi"].map((n, i) => <Avatar key={n} name={n} hue={[20, 285, 330, 185, 40, 260][i]} size={44} className="ring-lagoon-500" />)}
            </div>
            <p className="mt-4 font-display text-3xl font-semibold">Doors are open</p>
            <p className="mt-1 text-lagoon-50">Safe, private and kind — come as you are.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="h-section text-center font-display font-semibold text-ink">Questions you might have</h2>
        <div className="mt-5 hidden space-y-2.5 sm:mt-6 sm:block">
          {faqs.map(([q, a], i) => (
            <div key={q} className="rounded-3xl bg-white ring-1 ring-plum-100">
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-[15px] font-semibold text-ink sm:px-6 sm:py-4 sm:text-base">
                {q}
                <ChevronDown className={cx("shrink-0 text-plum-400 transition", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="px-5 pb-5 text-[15px] text-plum-700/85 sm:px-6 sm:pb-6 sm:text-base">{a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm sm:mt-4">
          <button onClick={() => openSupport("faq")} className="rounded-full bg-white px-4 py-2 font-semibold text-plum-700 ring-1 ring-plum-100 hover:bg-plum-50"><span className="sm:hidden">Read the FAQ</span><span className="hidden sm:inline">More answers</span></button>
          <button onClick={() => openSupport()} className="rounded-full bg-plum-600 px-4 py-2 font-semibold text-white">Message support</button>
        </div>
      </section>

      {/* CTA */}
      <section className="section mx-auto hidden max-w-4xl px-4 text-center sm:block sm:px-6">
        <MessageCircleHeart className="mx-auto text-tangerine-400" size={32} />
        <h2 className="h-section mt-3 font-display font-semibold text-ink">Whenever you're ready, <em className="font-normal text-plum-600">we're here.</em></h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-plum-700/80 sm:text-lg">It takes about five minutes to save your story. You can stop and come back anytime.</p>
        <div className="mx-auto mt-6 flex max-w-sm flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <Button size="lg" variant="warm" to="/report">Start privately</Button>
          <Button size="lg" variant="outline" to="/how-it-works">See how it works</Button>
        </div>
      </section>
    </>
  );
}
