import { BadgeCheck, MapPin, MessageCircle, Phone, Star, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { naira, type Lawyer, type SessionKind } from "../lib/data";
import { Avatar, Badge, Button } from "./ui";

export function feeLabel(l: Lawyer, kind: SessionKind) {
  const free = kind === "consultation" ? l.consultFree : l.bookingFree;
  const fee = kind === "consultation" ? l.consultFee : l.bookingFee;
  return free || fee === 0 ? "Free" : naira(fee);
}

export const channelIcon = { call: Phone, chat: MessageCircle, meet: Video };

export function LawyerCard({ l, kind }: { l: Lawyer; kind?: SessionKind }) {
  return (
    <div className="group flex flex-col rounded-4xl border border-plum-100 bg-white p-6 shadow-soft transition hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <Avatar name={l.name} hue={l.hue} size={64} />
        <div className="min-w-0 flex-1">
          <Link to={`/lawyers/${l.id}`} className="flex items-center gap-1.5 font-display text-xl font-semibold text-ink hover:text-plum-600">
            {l.name}
            {l.verified && <BadgeCheck size={18} className="shrink-0 text-lagoon-500" aria-label="Verified" />}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-plum-500">
            <MapPin size={14} /> {l.city}, {l.state} · Called {l.yearCalled}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink">
            <Star size={14} className="fill-tangerine-400 text-tangerine-400" /> {l.rating.toFixed(1)}
            <span className="font-normal text-plum-400">({l.reviews})</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {l.areas.slice(0, 3).map((a) => <Badge key={a} tone="blush">{a}</Badge>)}
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-plum-700/80">{l.bio}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-3xl bg-cream p-3 text-center">
        {(["consultation", "booking"] as const).map((k) => (
          <div key={k} className={kind === k ? "rounded-2xl bg-white py-2 shadow-sm ring-2 ring-plum-200" : "py-2"}>
            <p className="text-xs font-medium uppercase tracking-wide text-plum-400">{k}</p>
            <p className={feeLabel(l, k) === "Free" ? "font-display text-lg font-semibold text-lagoon-600" : "font-display text-lg font-semibold text-ink"}>
              {feeLabel(l, k)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5 text-plum-400">
          {l.channels.map((c) => {
            const I = channelIcon[c];
            return <span key={c} className="grid h-8 w-8 place-items-center rounded-full bg-plum-50"><I size={15} /></span>;
          })}
        </div>
        <Button size="sm" to={`/book/${l.id}${kind ? `?kind=${kind}` : ""}`}>Book</Button>
      </div>
    </div>
  );
}
