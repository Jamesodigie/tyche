import { ArrowLeft, ArrowRight, Briefcase, Coffee, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountForm } from "../components/AccountForm";
import { Blobs, Card, Sparkle, cx } from "../components/ui";
import { KIND_COPY, type SessionKind } from "../lib/data";
import { useStore } from "../lib/store";

export default function Hire() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [kind, setKind] = useState<SessionKind | null>(null);
  const [step, setStep] = useState(0);

  const go = (k: SessionKind) => {
    setKind(k);
    if (user) navigate(`/lawyers?kind=${k}`);
    else setStep(1);
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        {step === 0 ? (
          <>
            <div className="text-center">
              <p className="font-script text-3xl text-tangerine-500">let's find your person</p>
              <h1 className="h-page font-display font-semibold text-ink">How would you like to start?</h1>
              <p className="mx-auto mt-3 max-w-xl text-lg text-plum-700/80">Every lawyer on Tyche is verified. You'll talk inside Tyche — by call, chat or Google Meet — and pay safely through us.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2">
              {([
                ["consultation", Coffee, "from-lagoon-50 to-plum-50", "text-lagoon-600", "Many are free"],
                ["booking", Briefcase, "from-tangerine-50 to-blush-100", "text-tangerine-600", "For your case"],
              ] as const).map(([k, Icon, bg, tone, tag]) => (
                <button key={k} onClick={() => go(k)} className={cx("group relative overflow-hidden rounded-5xl bg-gradient-to-br p-8 text-left ring-2 ring-transparent transition hover:-translate-y-1 hover:shadow-soft hover:ring-plum-200 sm:p-10", bg)}>
                  <Sparkle className="absolute right-6 top-6 text-white sm:right-8 sm:top-8" size={36} />
                  <span className={cx("grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm", tone)}><Icon size={30} /></span>
                  <span className="mt-6 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-plum-600">{tag}</span>
                  <span className="mt-3 block font-display text-3xl font-semibold text-ink">{KIND_COPY[k].title}</span>
                  <span className="mt-1 block font-medium text-plum-600">{KIND_COPY[k].short}</span>
                  <span className="mt-3 block max-w-sm text-plum-700/85">{KIND_COPY[k].blurb}</span>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-plum-700 transition-all group-hover:gap-3">Choose {k} <ArrowRight size={18} /></span>
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link to="/report" className="flex items-center gap-4 rounded-4xl bg-white p-5 ring-1 ring-plum-100 hover:ring-plum-300">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tangerine-100 text-tangerine-600"><ShieldCheck /></span>
                <span><span className="block font-semibold text-ink">Not sure who to pick?</span><span className="text-sm text-plum-500">Share your report and let lawyers send you offers.</span></span>
              </Link>
              {!user && (
                <Link to="/signin?next=/lawyers" className="flex items-center gap-4 rounded-4xl bg-white p-5 ring-1 ring-plum-100 hover:ring-plum-300">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-plum-100 text-plum-600"><Lock /></span>
                  <span><span className="block font-semibold text-ink">Already on Tyche?</span><span className="text-sm text-plum-500">Sign in to see your bookings and messages.</span></span>
                </Link>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-lg">
            <button onClick={() => setStep(0)} className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-plum-600"><ArrowLeft size={16} /> Back</button>
            <p className="font-script text-3xl text-tangerine-500">almost there, love</p>
            <h1 className="h-page font-display font-semibold text-ink">Create your private space</h1>
            <p className="mt-2 text-plum-700/80">So your bookings, chats and payments stay in one safe place. A nickname is totally fine.</p>
            <Card className="mt-6 p-6 sm:p-8">
              <AccountForm cta={`See lawyers for a ${kind}`} onDone={() => navigate(`/lawyers?kind=${kind}`)} />
              <div className="mt-4 text-center text-sm">
                <Link to={`/lawyers?kind=${kind}`} className="inline-block py-2 text-plum-500 hover:underline">Just browse for now</Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
