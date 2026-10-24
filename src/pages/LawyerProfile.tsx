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
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        <Link to="/lawyers" className="-my-2 inline-flex items-center gap-1 py-2 text-sm font-semibold text-plum-600"><ArrowLeft size={16} /> All lawyers</Link>
        <div className="mt-4 grid gap-5 sm:mt-6 sm:gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                <Avatar name={l.name} hue={l.hue} size={96} />
                <div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="h-page font-display font-semibold text-ink">{l.name}</h1>
                    {l.verified ? <Badge tone="teal"><BadgeCheck size={14} /> Verified by Tyche</Badge> : <Badge tone="warm">Verification pending</Badge>}
                  </div>
                  <p className="mt-1 text-plum-600">{l.title} · Called to bar {l.yearCalled}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm text-plum-600 sm:justify-start">
                    <span className="flex items-center gap-1"><MapPin size={15} /> {l.city}, {l.state}</span>
                    {l.reviews > 0 ? (
                      <span className="flex items-center gap-1"><Star size={15} className="fill-tangerine-400 text-tangerine-400" /> <b className="text-ink">{l.rating.toFixed(1)}</b> ({l.reviews} reviews)</span>
                    ) : (
                      <span className="flex items-center gap-1"><Star size={15} className="text-tangerine-400" /> New on Tyche</span>
                    )}
                    <span className="flex items-center gap-1"><Clock size={15} /> Replies {l.responds}</span>
                    <span className="flex items-center gap-1"><Globe2 size={15} /> {l.languages.join(", ")}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">About {l.name.split(" ")[0]}</h2>
              <p className="mt-3 text-base leading-relaxed text-plum-700/90 sm:text-lg">{l.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">{l.areas.map((a) => <Badge key={a} tone="blush" className="px-4 py-1.5 text-sm">{a}</Badge>)}</div>
            </Card>

            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">When & how you can talk</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <span key={d} className={l.days.includes(d) ? "rounded-2xl bg-plum-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-2xl bg-plum-50 px-4 py-2 text-sm text-plum-300 line-through"}>{d}</span>
                ))}
              </div>
              <p className="mt-3 text-plum-600">{l.from} – {l.to} · {l.sessionMins}-minute consultations</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {l.channels.map((c) => {
                  const I = channelIcon[c];
                  return (
                    <div key={c} className="flex items-center gap-3 rounded-3xl bg-cream p-4">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-plum-600"><I size={18} /></span>
                      <span className="text-sm font-semibold text-ink">{CHANNEL_LABEL[c]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {mode === "preview" && <Card className="p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink">What women say</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {REVIEWS.map((r) => (
                  <div key={r.t} className="rounded-3xl bg-blush-50 p-5">
                    <Quote className="text-tangerine-300" size={20} />
                    <p className="mt-2 text-[15px] text-ink">{r.t}</p>
                    <p className="mt-3 text-sm font-semibold text-plum-600">— {r.n}</p>
                  </div>
                ))}
              </div>
            </Card>}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
