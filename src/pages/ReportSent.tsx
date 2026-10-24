import { ArrowRight, Hourglass, ShieldCheck } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { BidCard } from "./MySpace";
import { Blobs, Button, Card, Notice } from "../components/ui";
import { useStore } from "../lib/store";

export default function ReportSent() {
  const { id } = useParams();
  const { reports, bids } = useStore();
  const [params] = useSearchParams();
  const warn = params.get("warn");
  const r = reports.find((x) => x.id === id);
  const mine = bids.filter((b) => b.reportId === id);

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><ShieldCheck size={38} /></div>
          <p className="mt-6 font-script text-3xl text-tangerine-500">we've got you</p>
          <h1 className="h-page font-display font-semibold text-ink">Your report is safely saved.</h1>
          <p className="mx-auto mt-3 max-w-lg text-lg text-plum-700/80">
            Reference <b className="text-ink">{id}</b>. {r?.shareWithLawyers ? "Verified lawyers can now see it anonymously and send you offers." : "It's private — only you can see it."}
          </p>
        </div>

        {warn && <div className="mt-6"><Notice>{warn}</Notice></div>}
        {r?.shareWithLawyers && (
          <Card className="mt-10 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-ink">Offers from lawyers</h2>
              <span className="rounded-full bg-tangerine-100 px-3 py-1 text-sm font-semibold text-tangerine-600">{mine.length} so far</span>
            </div>
            {mine.length === 0 ? (
              <div className="mt-6 flex items-center gap-4 rounded-3xl bg-cream p-5 text-plum-600">
                <Hourglass className="shrink-0 animate-pulse text-plum-400" />
                <p>Verified lawyers can now read your report. Offers will appear here and in your space as soon as they arrive.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">{mine.map((b) => <BidCard key={b.id} b={b} />)}</div>
            )}
          </Card>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Breathe", "You don't have to do anything else today. Your report isn't going anywhere."],
            ["Compare offers", "Read each lawyer's note, check their profile, chat before you decide."],
            ["Book when ready", "Accept an offer to book a call, chat or Google Meet — all in Tyche."],
          ].map(([t, d], i) => (
            <div key={t} className="rounded-4xl bg-white p-5 ring-1 ring-plum-100">
              <span className="font-display text-3xl font-semibold text-plum-200">0{i + 1}</span>
              <p className="mt-1 font-semibold text-ink">{t}</p>
              <p className="mt-1 text-sm text-plum-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" to="/me">Go to my space <ArrowRight size={18} /></Button>
          <Button size="lg" variant="outline" to="/community">Find your people</Button>
        </div>
      </div>
    </section>
  );
}
