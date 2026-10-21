import {
  BadgeCheck, Briefcase, CalendarHeart, CheckCircle2, Clock, Eye, FileAudio, FileText, FileVideo, Gavel, ImageIcon, MessageCircleHeart, Save, Send, Settings2, Video, Wallet,
} from "lucide-react";
import { useState } from "react";
import { channelIcon } from "../components/LawyerCard";
import { Avatar, Badge, Blobs, Button, Card, Chip, Empty, Field, Input, Select, Textarea, Toggle, cx } from "../components/ui";
import {
  CHANNEL_LABEL, DAYS, KIND_COPY, PRACTICE_AREAS, TYCHE_FEE, lawyerTake, naira, prettySize, timeAgo, tycheTake, uid,
  type Channel, type Lawyer, type Report, type SessionKind,
} from "../lib/data";
import { useStore } from "../lib/store";

const kindIcon = { image: ImageIcon, audio: FileAudio, video: FileVideo, doc: FileText };
const TABS = [
  { id: "cases", label: "Case board", icon: Gavel },
  { id: "offers", label: "My offers", icon: Send },
  { id: "bookings", label: "Bookings", icon: CalendarHeart },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "profile", label: "Fees & hours", icon: Settings2 },
] as const;

function CaseCard({ r, me }: { r: Report; me: Lawyer }) {
  const { bids, addBid } = useStore();
  const sent = bids.find((b) => b.reportId === r.id && b.lawyerId === me.id);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SessionKind>("consultation");
  const [free, setFree] = useState(me.consultFree);
  const [fee, setFee] = useState(me.consultFee || 10000);
  const [msg, setMsg] = useState("");

  const pickKind = (k: SessionKind) => {
    setKind(k);
    setFree(k === "consultation" ? me.consultFree : me.bookingFree);
    setFee((k === "consultation" ? me.consultFee : me.bookingFee) || (k === "consultation" ? 10000 : 150000));
  };

  const send = () => {
    addBid({ id: uid("B-"), reportId: r.id, lawyerId: me.id, kind, free, fee: free ? 0 : fee, message: msg.trim(), createdAt: new Date().toISOString(), status: "pending" });
    setOpen(false);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-xl font-semibold text-ink">“{r.alias}”</span>
        <Badge tone="blush">{r.setting}</Badge>
        <Badge tone="plum">{r.state}</Badge>
        <span className="ml-auto text-sm text-plum-400">{r.id} · {timeAgo(r.createdAt)}</span>
      </div>
      <p className="mt-2 font-semibold text-plum-700">{r.category}</p>
      <p className="mt-1 text-sm text-plum-500">{[r.when, r.relation && `Involves: ${r.relation}`].filter(Boolean).join(" · ")}</p>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{r.description}</p>
      {r.wants.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{r.wants.map((w) => <Badge key={w} tone="teal">{w}</Badge>)}</div>}
      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-plum-400"><Eye size={13} /> Evidence ({r.evidence.length})</p>
        <div className="flex flex-wrap gap-2">
          {r.evidence.length ? r.evidence.map((e) => {
            const I = kindIcon[e.kind];
            return (
              <span key={e.id} className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2 text-xs">
                {e.preview ? <img src={e.preview} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <I size={16} className="text-plum-500" />}
                <span className="max-w-[160px] truncate font-medium text-ink">{e.name}</span>
                <span className="text-plum-400">{prettySize(e.size)}</span>
              </span>
            );
          }) : <span className="text-sm text-plum-400">No files yet</span>}
        </div>
      </div>

      {sent ? (
        <div className="mt-5 flex items-center gap-2 rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600">
          <CheckCircle2 size={18} /> You offered a {sent.kind} for {sent.free ? "free" : naira(sent.fee)} · <span className="capitalize">{sent.status}</span>
        </div>
      ) : open ? (
        <div className="mt-5 space-y-4 rounded-4xl bg-plum-50 p-5">
          <div className="flex flex-wrap gap-2">
            {(["consultation", "booking"] as const).map((k) => <Chip key={k} active={kind === k} onClick={() => pickKind(k)}>{KIND_COPY[k].title}</Chip>)}
          </div>
          <Toggle on={free} onChange={setFree} label={`Offer this ${kind} for free`} sub="Free offers show first to the client." />
          {!free && (
            <Field label={`Your ${kind} fee (₦)`} hint={`You'll receive ${naira(lawyerTake(fee))} after Tyche's ${TYCHE_FEE * 100}% fee.`}>
              <Input type="number" min={0} step={1000} value={fee} onChange={(e) => setFee(+e.target.value)} />
            </Field>
          )}
          <Field label="A kind note" hint="This is the first thing they read. Be warm, be clear.">
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="I've read what you shared and I'm so sorry this happened…" />
          </Field>
          <div className="flex gap-2">
            <Button variant="warm" disabled={msg.trim().length < 10} onClick={send}><Send size={16} /> Send offer</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button className="mt-5" disabled={!me.verified} onClick={() => setOpen(true)}><Gavel size={16} /> {me.verified ? "Bid for this case" : "Bidding opens once you're approved"}</Button>
      )}
    </Card>
  );
}

function ProfileEditor({ me }: { me: Lawyer }) {
  const { updateLawyer } = useStore();
  const [l, setL] = useState(me);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Lawyer>(k: K, v: Lawyer[K]) => { setSaved(false); setL((p) => ({ ...p, [k]: v })); };
  const tog = <T,>(a: T[], v: T) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-4 p-6">
        <h3 className="font-display text-2xl font-semibold text-ink">Fees</h3>
        <Toggle on={l.consultFree} onChange={(v) => set("consultFree", v)} label="Free consultations" />
        {!l.consultFree && <Field label="Consultation fee (₦)" hint={`You receive ${naira(lawyerTake(l.consultFee))}`}><Input type="number" value={l.consultFee} onChange={(e) => set("consultFee", +e.target.value)} /></Field>}
        <Toggle on={l.bookingFree} onChange={(v) => set("bookingFree", v)} label="Free bookings (pro bono)" />
        {!l.bookingFree && <Field label="Booking fee (₦)" hint={`You receive ${naira(lawyerTake(l.bookingFee))}`}><Input type="number" value={l.bookingFee} onChange={(e) => set("bookingFee", +e.target.value)} /></Field>}
        <Field label="Consultation length"><Select value={l.sessionMins} onChange={(e) => set("sessionMins", +e.target.value)}>{[20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}</Select></Field>
      </Card>
      <Card className="space-y-4 p-6">
        <h3 className="font-display text-2xl font-semibold text-ink">Availability</h3>
        <div className="flex flex-wrap gap-2">{DAYS.map((d) => <Chip key={d} active={l.days.includes(d)} onClick={() => set("days", tog(l.days, d))}>{d}</Chip>)}</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><Input type="time" value={l.from} onChange={(e) => set("from", e.target.value)} /></Field>
          <Field label="To"><Input type="time" value={l.to} onChange={(e) => set("to", e.target.value)} /></Field>
        </div>
        <p className="text-sm font-semibold text-ink">Channels</p>
        <div className="flex flex-wrap gap-2">{(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => <Chip tone="teal" key={c} active={l.channels.includes(c)} onClick={() => set("channels", tog(l.channels, c))}>{CHANNEL_LABEL[c]}</Chip>)}</div>
        <p className="text-sm font-semibold text-ink">Practice areas</p>
        <div className="flex flex-wrap gap-2">{PRACTICE_AREAS.map((a) => <Chip key={a} active={l.areas.includes(a)} onClick={() => set("areas", tog(l.areas, a))}>{a}</Chip>)}</div>
      </Card>
      <div className="flex items-center gap-3 lg:col-span-2">
        <Button onClick={() => { updateLawyer(l); setSaved(true); }}><Save size={18} /> Save changes</Button>
        {saved && <span className="flex items-center gap-1 text-sm font-semibold text-lagoon-600"><CheckCircle2 size={16} /> Saved — your profile is updated</span>}
      </div>
    </div>
  );
}

export default function LawyerDashboard() {
  const { user, lawyers, allReports, bids, bookings, hiddenReports, lawyerState } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("cases");
  const [area, setArea] = useState("");
  const me = lawyers.find((l) => l.id === user?.lawyerId);

  if (!user || user.role !== "lawyer" || !me)
    return (
      <div className="mx-auto max-w-xl px-5 py-20">
        <Empty icon={<Gavel />} title="This space is for Tyche lawyers" sub="Sign in with your lawyer account, or create one in a few minutes." action={<div className="flex justify-center gap-2"><Button to="/signin?as=lawyer&next=/lawyer/dashboard">Sign in as a lawyer</Button><Button variant="outline" to="/join/lawyer">Join Tyche</Button></div>} />
      </div>
    );

  const open = allReports.filter((r) => r.shareWithLawyers && !hiddenReports.includes(r.id) && (!area || r.category === area || r.setting === area));
  const myBids = bids.filter((b) => b.lawyerId === me.id);
  const myBookings = bookings.filter((b) => b.lawyerId === me.id);
  const gross = myBookings.reduce((n, b) => n + b.fee, 0);

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={me.name} hue={me.hue} size={72} />
          <div className="flex-1">
            <p className="font-script text-2xl text-tangerine-500">good to see you, Counsel</p>
            <h1 className="flex flex-wrap items-center gap-2 font-display text-4xl font-semibold text-ink">
              {me.name}
              {me.verified ? <Badge tone="teal"><BadgeCheck size={14} /> Verified</Badge> : <Badge tone="warm"><Clock size={14} /> Verification pending</Badge>}
            </h1>
          </div>
          <Button variant="outline" to={`/lawyers/${me.id}`}>View public profile</Button>
        </div>

        {!me.verified && (
          <p className="mt-6 rounded-3xl bg-tangerine-50 p-4 text-sm text-ink">
            {lawyerState(me) === "rejected"
              ? "We couldn't verify your enrolment yet, so your profile isn't visible to clients. Please email the Tyche team with your call-to-bar certificate to try again."
              : "We're confirming your enrolment with the Bar (24–48 hrs). You can look around now — you'll be able to bid on cases and appear to clients as soon as you're approved."}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { t: "Open cases", v: open.length, c: "bg-tangerine-100 text-tangerine-600", i: Briefcase },
            { t: "Offers sent", v: myBids.length, c: "bg-plum-100 text-plum-600", i: Send },
            { t: "Bookings", v: myBookings.length, c: "bg-lagoon-100 text-lagoon-600", i: CalendarHeart },
            { t: "You've earned", v: naira(lawyerTake(gross)), c: "bg-blush-200 text-plum-700", i: Wallet },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-4 rounded-4xl bg-white p-5 shadow-soft ring-1 ring-plum-100">
              <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", s.c)}><s.i size={22} /></span>
              <span><span className="block font-display text-2xl font-semibold text-ink">{s.v}</span><span className="text-sm text-plum-500">{s.t}</span></span>
            </div>
          ))}
        </div>

        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx("flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition", tab === t.id ? "bg-plum-600 text-white" : "bg-white text-plum-600 ring-1 ring-plum-100")}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "cases" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <p className="text-plum-600">Women who chose to share their story with verified lawyers. Names stay hidden until they book you.</p>
                <Select value={area} onChange={(e) => setArea(e.target.value)} className="ml-auto w-auto">
                  <option value="">All cases</option>
                  {["Work", "School / campus", "Online", "Public place / transport", "Home"].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">{open.map((r) => <CaseCard key={r.id} r={r} me={me} />)}</div>
              {!open.length && <Empty icon={<Briefcase />} title="No open cases right now" sub="New reports show up here as soon as they're shared." />}
            </>
          )}

          {tab === "offers" &&
            (myBids.length ? (
              <div className="space-y-3">
                {myBids.map((b) => {
                  const r = allReports.find((x) => x.id === b.reportId);
                  return (
                    <Card key={b.id} className="flex flex-wrap items-center gap-4 p-5">
                      <div className="flex-1">
                        <p className="font-semibold text-ink">“{r?.alias}” · {r?.category}</p>
                        <p className="text-sm text-plum-500">{KIND_COPY[b.kind].title} · {b.free ? "Free" : naira(b.fee)} · sent {timeAgo(b.createdAt)}</p>
                      </div>
                      <Badge tone={b.status === "accepted" ? "teal" : b.status === "declined" ? "plum" : "warm"}>{b.status === "pending" ? "Waiting for reply" : b.status}</Badge>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty icon={<Send />} title="You haven't sent any offers yet" sub="Browse the case board and bid on cases you can help with." action={<Button onClick={() => setTab("cases")}>Open case board</Button>} />
            ))}

          {tab === "bookings" &&
            (myBookings.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {myBookings.map((b) => {
                  const I = channelIcon[b.channel];
                  return (
                    <Card key={b.id} className="p-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={b.clientName} hue={330} size={48} />
                        <div className="flex-1"><p className="font-semibold text-ink">{b.clientName}</p><p className="text-sm text-plum-500">{KIND_COPY[b.kind].title} · {b.fee ? naira(b.fee) : "Free"}</p></div>
                      </div>
                      <p className="mt-4 flex items-center gap-2 rounded-3xl bg-cream p-3 text-sm text-ink"><I size={16} className="text-plum-500" /> {new Date(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {b.time} · {CHANNEL_LABEL[b.channel]}</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" to={`/session/${b.id}`}><Video size={16} /> Start session</Button>
                        <Button size="sm" variant="outline" to={`/messages/${b.id}`}><MessageCircleHeart size={16} /> Message</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty icon={<CalendarHeart />} title="No bookings yet" sub="When a client books you or accepts your offer, it'll show here." />
            ))}

          {tab === "earnings" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-6"><p className="text-sm text-plum-500">Clients paid</p><p className="font-display text-3xl font-semibold text-ink">{naira(gross)}</p></Card>
                <Card className="p-6"><p className="text-sm text-plum-500">Tyche service fee ({TYCHE_FEE * 100}%)</p><p className="font-display text-3xl font-semibold text-ink">{naira(tycheTake(gross))}</p></Card>
                <Card className="bg-lagoon-50 p-6 ring-lagoon-200"><p className="text-sm text-lagoon-600">Your earnings</p><p className="font-display text-3xl font-semibold text-lagoon-600">{naira(lawyerTake(gross))}</p></Card>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-plum-50 text-plum-500"><tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Tyche</th><th className="px-5 py-3">You</th></tr></thead>
                  <tbody>
                    {myBookings.length ? myBookings.map((b) => (
                      <tr key={b.id} className="border-t border-plum-50">
                        <td className="px-5 py-3 font-medium text-ink">{b.clientName}</td>
                        <td className="px-5 py-3 capitalize text-plum-600">{b.kind}</td>
                        <td className="px-5 py-3">{b.fee ? naira(b.fee) : "Free"}</td>
                        <td className="px-5 py-3 text-plum-500">{naira(tycheTake(b.fee))}</td>
                        <td className="px-5 py-3 font-semibold text-lagoon-600">{naira(lawyerTake(b.fee))}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className="px-5 py-8 text-center text-plum-400">No payments yet</td></tr>}
                  </tbody>
                </table>
              </Card>
              <p className="text-sm text-plum-500">Payouts go to your bank account within 48 hours of each completed session.</p>
            </div>
          )}

          {tab === "profile" && <ProfileEditor me={me} />}
        </div>
      </div>
    </section>
  );
}
