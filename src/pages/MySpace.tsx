import { CalendarHeart, FileLock2, FileText, Gavel, HeartHandshake, MessageCircleHeart, Plus, Video } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { channelIcon } from "../components/LawyerCard";
import { Avatar, Badge, Blobs, Button, Card, Empty, cx } from "../components/ui";
import { CHANNEL_LABEL, KIND_COPY, naira, prettySize, timeAgo, type Bid } from "../lib/data";
import { EvidenceChip } from "../components/EvidenceChip";
import { useStore } from "../lib/store";

export function BidCard({ b }: { b: Bid }) {
  const { lawyers, setBidStatus } = useStore();
  const l = lawyers.find((x) => x.id === b.lawyerId);
  if (!l) return null;
  return (
    <div className={cx("rounded-4xl border-2 p-5 transition", b.status === "pending" ? "border-plum-100 bg-white" : b.status === "accepted" ? "border-lagoon-200 bg-lagoon-50" : "border-transparent bg-plum-50 opacity-60")}>
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={l.name} hue={l.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/lawyers/${l.id}`} className="font-display text-lg font-semibold text-ink hover:text-plum-600">{l.name}</Link>
            <Badge tone="blush">{KIND_COPY[b.kind].title}</Badge>
            <span className="text-xs text-plum-400">{timeAgo(b.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-sm text-plum-500">{l.areas.slice(0, 2).join(" · ")} · ★ {l.rating.toFixed(1)}</p>
        </div>
        <p className={cx("font-display text-2xl font-semibold", b.free ? "text-lagoon-600" : "text-ink")}>{b.free ? "Free" : naira(b.fee)}</p>
      </div>
      <p className="mt-4 rounded-3xl bg-cream p-4 text-[15px] italic text-plum-700">“{b.message}”</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {b.status === "pending" && (
          <>
            <Button size="sm" variant="warm" to={`/book/${l.id}?bid=${b.id}`}>Accept & book</Button>
            <Button size="sm" variant="outline" to={`/lawyers/${l.id}`}>View profile</Button>
            <button onClick={() => setBidStatus(b.id, "declined")} className="ml-auto text-sm font-medium text-plum-400 hover:text-plum-600">No thanks</button>
          </>
        )}
        {b.status === "accepted" && <Badge tone="teal">Accepted — you're booked</Badge>}
        {b.status === "declined" && <span className="text-sm text-plum-400">You passed on this one</span>}
      </div>
    </div>
  );
}

const TABS = ["Offers", "Bookings", "My reports", "Community"] as const;

export default function MySpace() {
  const { user, reports, bids, bookings, lawyers, community } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Offers");

  if (!user)
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-20">
        <Empty icon={<FileLock2 />} title="Your private space" sub="Sign in to see your reports, offers from lawyers and bookings." action={<div className="flex justify-center gap-2"><Button to="/signin?next=/me">Sign in</Button><Button variant="outline" to="/report">Start a report</Button></div>} />
      </div>
    );

  // As a client: offers on my reports, and sessions I booked (a lawyer can also be a client).
  const myReportIds = new Set(reports.map((r) => r.id));
  const offers = bids.filter((b) => myReportIds.has(b.reportId));
  const myBookings = bookings.filter((b) => !b.clientId || b.clientId === user.id).filter((b) => b.status !== "cancelled");
  const inCircle = !!community && community.status !== "pending" && community.status !== "expired";
  const counts = { Offers: offers.filter((b) => b.status === "pending").length, Bookings: myBookings.length, "My reports": reports.length, Community: inCircle ? 1 : 0 };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-script text-3xl text-tangerine-500">hi {user.name.split(" ")[0].toLowerCase()}, welcome home</p>
            <h1 className="h-page font-display font-semibold text-ink">My space</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" to="/lawyers"><Gavel size={18} /> Find a lawyer</Button>
            <Button variant="warm" to="/report"><Plus size={18} /> New report</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {[
            { t: "Offers waiting", v: counts.Offers, i: Gavel, c: "bg-tangerine-100 text-tangerine-600" },
            { t: "Bookings", v: counts.Bookings, i: CalendarHeart, c: "bg-plum-100 text-plum-600" },
            { t: "Reports saved", v: counts["My reports"], i: FileLock2, c: "bg-lagoon-100 text-lagoon-600" },
            { t: "Evidence files", v: reports.reduce((n, r) => n + r.evidence.length, 0), i: FileText, c: "bg-blush-200 text-plum-700" },
          ].map((s) => (
            <div key={s.t} className="flex flex-col items-start gap-2 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-plum-100 sm:flex-row sm:items-center sm:gap-4 sm:rounded-4xl sm:p-5">
              <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12", s.c)}><s.i size={22} /></span>
              <span><span className="block font-display text-3xl font-semibold text-ink">{s.v}</span><span className="text-sm text-plum-500">{s.t}</span></span>
            </div>
          ))}
        </div>

        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition", tab === t ? "bg-plum-600 text-white" : "bg-white text-plum-600 ring-1 ring-plum-100")}>
              {t} {counts[t] > 0 && t !== "Community" && <span className={cx("ml-1 rounded-full px-2 py-0.5 text-xs", tab === t ? "bg-white/20" : "bg-plum-50")}>{counts[t]}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Offers" &&
            (offers.length ? (
              <div className="grid gap-4 lg:grid-cols-2">{offers.map((b) => <BidCard key={b.id} b={b} />)}</div>
            ) : (
              <Empty icon={<Gavel />} title="No offers yet" sub="Share a report with verified lawyers and their offers will show up here." action={<Button to="/report">Share a report</Button>} />
            ))}

          {tab === "Bookings" &&
            (myBookings.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {myBookings.map((b) => {
                  const l = lawyers.find((x) => x.id === b.lawyerId) || { name: "Your lawyer", hue: 285, id: b.lawyerId };
                  const I = channelIcon[b.channel];
                  const unpaid = b.status === "pending_payment";
                  return (
                    <Card key={b.id} className="p-5">
                      <div className="flex items-center gap-4">
                        <Avatar name={l.name} hue={l.hue} size={52} />
                        <div className="flex-1"><p className="font-semibold text-ink">{l.name}</p><p className="text-sm text-plum-500">{KIND_COPY[b.kind].title} · {b.fee ? naira(b.fee) : "Free"}</p></div>
                        {unpaid ? <Badge tone="warm">Payment pending</Badge> : b.status === "done" ? <Badge tone="plum">Completed</Badge> : <Badge tone="teal">Upcoming</Badge>}
                      </div>
                      <div className="mt-4 flex items-center gap-3 rounded-3xl bg-cream p-3 text-sm">
                        <I size={18} className="text-plum-500" />
                        <span className="text-ink">{new Date(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {b.time} · {CHANNEL_LABEL[b.channel]}</span>
                      </div>
                      {unpaid ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <p className="text-sm text-plum-600">This slot isn't confirmed until payment goes through.</p>
                          <Button size="sm" variant="warm" to={`/book/${b.lawyerId}`}>Book again</Button>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" to={`/session/${b.id}`}><Video size={16} /> Join session</Button>
                          <Button size="sm" variant="outline" to={`/messages/${b.id}`}><MessageCircleHeart size={16} /> Message</Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty icon={<CalendarHeart />} title="No bookings yet" sub="When you book a consultation or engage a lawyer, it'll live here." action={<Button to="/hire">Hire a lawyer</Button>} />
            ))}

          {tab === "My reports" &&
            (reports.length ? (
              <div className="space-y-4">
                {reports.map((r) => (
                  <Card key={r.id} className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl font-semibold text-ink">{r.id}</p>
                      <Badge tone={r.shareWithLawyers ? "teal" : "plum"}>{r.shareWithLawyers ? "Open to lawyer offers" : "Private"}</Badge>
                      <span className="text-sm text-plum-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-plum-600">{r.category} · {r.setting} · {r.state}</p>
                    <p className="mt-3 line-clamp-3 text-plum-700/90">{r.description}</p>
                    {r.evidence.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {r.evidence.map((e) => <EvidenceChip key={e.id} e={e} />)}
                      </div>
                    )}
                    <p className="mt-4 text-sm text-plum-500">{r.hidden ? "Paused by our team · " : ""}{offers.filter((b) => b.reportId === r.id).length} lawyer offer(s)</p>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty icon={<FileLock2 />} title="Nothing saved yet" sub="Your reports and evidence will be kept safe here." action={<Button to="/report">Start a report</Button>} />
            ))}

          {tab === "Community" &&
            (inCircle && community ? (
              <Card className="flex flex-wrap items-center gap-5 p-6">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><HeartHandshake /></span>
                <div className="flex-1"><p className="font-display text-xl font-semibold text-ink">You're in the circle 💜</p><p className="text-sm text-plum-500">Joined {new Date(community.joinedAt).toLocaleDateString("en-GB")} · {community.phone}</p></div>
                <Button variant="teal" to="/community/join">See my invite</Button>
              </Card>
            ) : (
              <Empty icon={<HeartHandshake />} title="You're not in the circle yet" sub="A private WhatsApp community of up to 10,000 women." action={<Button variant="teal" to="/community">Join the community</Button>} />
            ))}
        </div>
      </div>
    </section>
  );
}
