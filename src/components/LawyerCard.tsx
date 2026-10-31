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
    <div className="group flex flex-col rounded-3xl border border-plum-100 bg-white p-4 shadow-soft transition hover:-translate-y-1 sm:rounded-4xl sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar src={l.photoUrl} name={l.name} hue={l.hue} size={48} />
        <div className="min-w-0 flex-1">
          <Link to={`/lawyers/${l.id}`} className="-my-1 flex items-center gap-1.5 py-1 font-display text-lg font-semibold leading-tight sm:text-xl text-ink hover:text-plum-600">
            {l.name}
            {l.verified && <BadgeCheck size={18} className="shrink-0 text-lagoon-500" aria-label="Verified" />}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-plum-500">
            <MapPin size={14} /> {l.city}, {l.state} · Called {l.yearCalled}
          </p>
          {l.reviews > 0 ? (
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink">
              <Star size={14} className="fill-tangerine-400 text-tangerine-400" /> {l.rating.toFixed(1)}
              <span className="font-normal text-plum-400">({l.reviews})</span>
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-plum-500"><Star size={14} className="text-tangerine-400" /> New on Tyche</p>
          )}
        </div>
      </div>
      <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
        {l.areas.slice(0, 3).map((a) => <Badge key={a} tone="blush">{a}</Badge>)}
      </div>
      <p className="mt-3 hidden line-clamp-2 text-sm leading-relaxed text-plum-700/80 sm:block">{l.bio}</p>
      <div className="mt-3 flex items-center gap-2 sm:mt-5 sm:block">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 rounded-2xl bg-cream p-1.5 text-center sm:gap-2 sm:rounded-3xl sm:p-3">
        {(["consultation", "booking"] as const).map((k) => (
          <div key={k} className={kind === k ? "rounded-xl bg-white py-1.5 shadow-sm ring-2 ring-plum-200 sm:py-2" : "py-1.5 sm:py-2"}>
            <p className="text-[11px] font-medium uppercase tracking-normal text-plum-400 sm:text-xs sm:tracking-wide">{k}</p>
            <p className={feeLabel(l, k) === "Free" ? "font-display text-base font-semibold text-lagoon-600 sm:text-lg" : "font-display text-base font-semibold text-ink sm:text-lg"}>
              {feeLabel(l, k)}
            </p>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:mt-4">
        <div className="hidden gap-1.5 text-plum-400 sm:flex">
          {l.channels.map((c) => {
            const I = channelIcon[c];
            return <span key={c} className="grid h-8 w-8 place-items-center rounded-full bg-plum-50"><I size={15} /></span>;
          })}
        </div>
        <Button size="sm" to={`/book/${l.id}${kind ? `?kind=${kind}` : ""}`}>Book</Button>
      </div>
      </div>
    </div>
  );
}
