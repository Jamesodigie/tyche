import { ArrowLeft, ArrowRight, Briefcase, Coffee, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountForm } from "../components/AccountForm";
import { Blobs, Card, cx } from "../components/ui";
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
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="font-script text-2xl text-tangerine-500">let's find your person</p>
              <h1 className="h-page font-display font-semibold text-ink">How would you like to start?</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-plum-700/80 sm:text-base">Verified lawyers. Talk by call, chat or Google Meet — pay safely through Tyche.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-2">
              {([
                ["consultation", Coffee, "from-lagoon-50 to-plum-50", "text-lagoon-600", "Many are free"],
                ["booking", Briefcase, "from-tangerine-50 to-blush-100", "text-tangerine-600", "For your case"],
              ] as const).map(([k, Icon, bg, tone, tag]) => (
                <button key={k} onClick={() => go(k)} className={cx("group flex items-center gap-3 rounded-3xl bg-gradient-to-br p-4 text-left ring-2 ring-transparent transition hover:shadow-soft hover:ring-plum-200 sm:p-5", bg)}>
                  <span className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-sm", tone)}><Icon size={22} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xl font-semibold text-ink">{KIND_COPY[k].title}</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-plum-600">{tag}</span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-plum-700/85">{KIND_COPY[k].short}</span>
                  </span>
                  <ArrowRight size={20} className="shrink-0 text-plum-600 transition group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Link to="/report" className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-plum-100 hover:ring-plum-300">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tangerine-100 text-tangerine-600"><ShieldCheck size={18} /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-ink">Not sure who to pick?</span><span className="block text-xs text-plum-500">Share your report — lawyers send you offers.</span></span>
              </Link>
              {!user && (
                <Link to="/signin?next=/lawyers" className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-plum-100 hover:ring-plum-300">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-plum-100 text-plum-600"><Lock size={18} /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold text-ink">Already on Tyche?</span><span className="block text-xs text-plum-500">Sign in to see bookings and messages.</span></span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-lg">
            <button onClick={() => setStep(0)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-plum-600"><ArrowLeft size={16} /> Back</button>
            <p className="font-script text-2xl text-tangerine-500">almost there, love</p>
            <h1 className="h-page font-display font-semibold text-ink">Create your private space</h1>
            <p className="mt-1 text-sm text-plum-700/80 sm:text-base">So your bookings, chats and payments stay in one safe place. A nickname is totally fine.</p>
            <Card className="mt-4 p-4 sm:p-6">
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
