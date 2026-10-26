import { ArrowLeft, BadgeCheck, Clock, Globe2, MapPin, MessageCircleHeart, Quote, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { channelIcon, feeLabel } from "../components/LawyerCard";
import { Avatar, Badge, Blobs, Button, Card, Empty } from "../components/ui";
import { CHANNEL_LABEL, DAYS, KIND_COPY } from "../lib/data";
import { useStore } from "../lib/store";

const REVIEWS = [
  { n: "Chioma", t: "She listened without rushing me and explained everything in simple words. I finally felt like I had options.", s: 5 },
  { n: "Anonymous", t: "I was scared to even talk about it. By the end of the call I had a plan. Thank you so much.", s: 5 },
  { n: "Bukky", t: "Professional, kind and very clear about fees from the start. Highly recommend.", s: 5 },
];

export default function LawyerProfile() {
  const { id } = useParams();
  const { findLawyer, mode, ready } = useStore();
  const l = findLawyer(id);
  if (!l && !ready) return <div className="grid min-h-[50vh] place-items-center text-plum-400">Loading…</div>;
  if (!l)
    return <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-20"><Empty icon={<MessageCircleHeart />} title="We couldn't find that lawyer" action={<Button to="/lawyers">See all lawyers</Button>} /></div>;

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-4 sm:py-10">
        <Link to="/lawyers" className="-my-2 inline-flex items-center gap-1 py-2 text-sm font-semibold text-plum-600"><ArrowLeft size={16} /> All lawyers</Link>
        <div className="mt-2 grid gap-3 sm:mt-6 sm:gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
          <div className="space-y-3 sm:space-y-6">
            <Card className="p-4 sm:p-8">
              <div className="flex items-center gap-4 sm:gap-6">
                <Avatar name={l.name} hue={l.hue} size={64} className="sm:h-24 sm:w-24" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="h-page font-display font-semibold text-ink">{l.name}</h1>
                    {l.verified ? <Badge tone="teal"><BadgeCheck size={14} /> Verified by Tyche</Badge> : <Badge tone="warm">Verification pending</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-plum-600 sm:mt-1 sm:text-base">{l.title} · Called {l.yearCalled}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-plum-600 sm:mt-3 sm:gap-x-4 sm:text-sm">
                    <span className="flex items-center gap-1"><MapPin size={15} /> {l.city}, {l.state}</span>
                    {l.reviews > 0 ? (
                      <span className="flex items-center gap-1"><Star size={15} className="fill-tangerine-400 text-tangerine-400" /> <b className="text-ink">{l.rating.toFixed(1)}</b> ({l.reviews} reviews)</span>
                    ) : (
                      <span className="flex items-center gap-1"><Star size={15} className="text-tangerine-400" /> New on Tyche</span>
                    )}
                    <span className="flex items-center gap-1"><Clock size={15} /> Replies {l.responds}</span>
                    <span className="hidden items-center gap-1 sm:flex"><Globe2 size={15} /> {l.languages.join(", ")}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* phones: fees + book right away */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {(["consultation", "booking"] as const).map((k) => {
                const label = feeLabel(l, k);
                return (
                  <Link key={k} to={`/book/${l.id}?kind=${k}`} className={k === "consultation" ? "rounded-3xl bg-lagoon-500 p-3 text-white" : "rounded-3xl bg-tangerine-500 p-3 text-white"}>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/80">{KIND_COPY[k].title}</span>
                    <span className="block font-display text-xl font-semibold">{label}</span>
                    <span className="mt-1 block text-xs font-semibold">Book a {k} →</span>
                  </Link>
                );
              })}
            </div>

            <Card className="p-4 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">About {l.name.split(" ")[0]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-plum-700/90 sm:mt-3 sm:text-lg">{l.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">{l.areas.map((a) => <Badge key={a} tone="blush" className="sm:px-4 sm:py-1.5 sm:text-sm">{a}</Badge>)}</div>
            </Card>

            <Card className="p-4 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">When & how you can talk</h2>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                {DAYS.map((d) => (
                  <span key={d} className={l.days.includes(d) ? "rounded-xl bg-plum-600 px-2.5 py-1 text-xs font-semibold text-white sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm" : "rounded-xl bg-plum-50 px-2.5 py-1 text-xs text-plum-300 line-through sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm"}>{d}</span>
                ))}
              </div>
              <p className="mt-2 text-sm text-plum-600 sm:mt-3 sm:text-base">{l.from} – {l.to} · {l.sessionMins}-minute consultations</p>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-3">
                {l.channels.map((c) => {
                  const I = channelIcon[c];
                  return (
                    <div key={c} className="flex items-center gap-2 rounded-full bg-cream py-1.5 pl-1.5 pr-3 sm:gap-3 sm:rounded-3xl sm:p-4">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-plum-600 sm:h-10 sm:w-10"><I size={15} /></span>
                      <span className="text-xs font-semibold text-ink sm:text-sm">{CHANNEL_LABEL[c]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {mode === "preview" && <Card className="p-4 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">What women say</h2>
              <div className="rail mt-3 sm:mt-5 md:grid-cols-3 md:gap-4">
                {REVIEWS.map((r) => (
                  <div key={r.t} className="rounded-3xl bg-blush-50 p-4 sm:p-5">
                    <Quote className="text-tangerine-300" size={20} />
                    <p className="mt-1 text-sm text-ink sm:text-[15px]">{r.t}</p>
                    <p className="mt-3 text-sm font-semibold text-plum-600">— {r.n}</p>
                  </div>
                ))}
              </div>
            </Card>}
          </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
            {(["consultation", "booking"] as const).map((k) => {
              const label = feeLabel(l, k);
              return (
                <Card key={k} className={k === "consultation" ? "p-6 ring-2 ring-lagoon-200" : "p-6"}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-plum-400">{KIND_COPY[k].title}</p>
                  <p className={label === "Free" ? "mt-1 font-display text-4xl font-semibold text-lagoon-600" : "mt-1 font-display text-4xl font-semibold text-ink"}>{label}</p>
                  <p className="mt-2 text-sm text-plum-600">{KIND_COPY[k].blurb}</p>
                  <Button className="mt-5 w-full" variant={k === "consultation" ? "teal" : "warm"} to={`/book/${l.id}?kind=${k}`}>Book a {k}</Button>
                </Card>
              );
            })}
            <div className="rounded-4xl bg-plum-50 p-5 text-sm text-plum-700">
              <p className="font-semibold text-ink">Want {l.name.split(" ")[0]} to see your evidence first?</p>
              <p className="mt-1">Share your report with verified lawyers — {l.name.split(" ")[0]} can review it and send you an offer.</p>
              <Link to="/report" className="mt-2 inline-block py-2 font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Share my report</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
