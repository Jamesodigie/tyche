import { ArrowLeft, ArrowRight, CalendarCheck2, CheckCircle2, CreditCard, Lock, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { channelIcon } from "../components/LawyerCard";
import { Avatar, Blobs, Button, Card, Empty, Field, Input, Stepper, Textarea, cx } from "../components/ui";
import {
  CHANNEL_LABEL, KIND_COPY, naira, nextDates, timeSlots, uid,
  type Booking, type Channel, type SessionKind,
} from "../lib/data";
import { useStore } from "../lib/store";

export default function Book() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { lawyers, user, signIn, addBooking, sendMessage, bids, setBidStatus, reports } = useStore();
  const navigate = useNavigate();
  const l = lawyers.find((x) => x.id === id);
  const bid = bids.find((b) => b.id === params.get("bid"));

  const [kind, setKind] = useState<SessionKind>(bid?.kind || (params.get("kind") as SessionKind) || "consultation");
  const [step, setStep] = useState(bid ? 1 : 0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [channel, setChannel] = useState<Channel>(l?.channels[0] || "call");
  const [note, setNote] = useState("");
  const [acct, setAcct] = useState({ name: "", contact: "", password: "" });
  const [reportId, setReportId] = useState(bid?.reportId || "");
  const [paying, setPaying] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const dates = useMemo(() => (l ? nextDates(l.days, 10) : []), [l]);
  const slots = useMemo(() => (l ? timeSlots(l.from, l.to, l.sessionMins) : []), [l]);
  const myReports = reports;

  if (!l) return <div className="mx-auto max-w-xl px-5 py-20"><Empty icon={<MessageCircleHeart />} title="Lawyer not found" action={<Button to="/lawyers">Browse lawyers</Button>} /></div>;

  const fee = bid ? (bid.free ? 0 : bid.fee) : kind === "consultation" ? (l.consultFree ? 0 : l.consultFee) : l.bookingFree ? 0 : l.bookingFee;
  const STEPS = ["What you need", "Pick a time", "About you", fee ? "Pay" : "Confirm"];
  const dateLabel = dates.find((d) => d.iso === date);

  const valid = [true, !!date && !!time, user ? true : acct.name.trim() && acct.contact.trim() && acct.password.length >= 6, true][step];

  const next = () => {
    if (step === 2 && !user) signIn({ name: acct.name.trim(), email: acct.contact, role: "client" });
    setStep(step + 1);
  };

  const confirm = () => {
    setPaying(true);
    setTimeout(() => {
      const b: Booking = {
        id: uid("BK-"),
        lawyerId: l.id,
        clientName: user?.name || acct.name,
        kind, date, time, channel, fee,
        status: "upcoming",
        reportId: reportId || undefined,
        createdAt: new Date().toISOString(),
      };
      addBooking(b);
      if (note.trim()) sendMessage({ threadId: b.id, from: "client", text: note.trim() });
      if (bid) setBidStatus(bid.id, "accepted");
      setBooking(b);
      setPaying(false);
    }, fee ? 1600 : 600);
  };

  if (booking)
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-xl px-5 py-16 text-center">
          <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><CalendarCheck2 size={38} /></div>
          <p className="mt-6 font-script text-3xl text-tangerine-500">you did a brave thing today</p>
          <h1 className="font-display text-4xl font-semibold text-ink">You're booked with {l.name.split(" ")[0]} 💜</h1>
          <Card className="mt-8 p-6 text-left">
            <div className="flex items-center gap-4">
              <Avatar name={l.name} hue={l.hue} size={56} />
              <div>
                <p className="font-semibold text-ink">{l.name}</p>
                <p className="text-sm text-plum-500">{KIND_COPY[kind].title} · {CHANNEL_LABEL[channel]}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-2xl bg-cream p-3"><p className="text-plum-400">Date</p><p className="font-semibold text-ink">{dateLabel?.day} {dateLabel?.label}</p></div>
              <div className="rounded-2xl bg-cream p-3"><p className="text-plum-400">Time</p><p className="font-semibold text-ink">{time}</p></div>
              <div className="rounded-2xl bg-cream p-3"><p className="text-plum-400">Paid</p><p className="font-semibold text-ink">{fee ? naira(fee) : "Free"}</p></div>
            </div>
            <p className="mt-4 text-sm text-plum-600">Ref: {booking.id}. We'll remind you an hour before. You can message {l.name.split(" ")[0]} anytime before then.</p>
          </Card>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate(`/messages/${booking.id}`)}><MessageCircleHeart size={18} /> Message {l.name.split(" ")[0]}</Button>
            <Button variant="outline" to="/me">Go to my space</Button>
          </div>
        </div>
      </section>
    );

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1fr_340px]">
        <div>
          <Link to={`/lawyers/${l.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-plum-600"><ArrowLeft size={16} /> Back to profile</Link>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink">Book {l.name}</h1>
          {bid && <p className="mt-2 inline-block rounded-full bg-lagoon-50 px-4 py-1.5 text-sm font-semibold text-lagoon-600">Accepting {l.name.split(" ")[0]}'s offer on your report</p>}
          <Card className="mt-6 p-6 sm:p-8">
            <Stepper steps={STEPS} current={step} />

            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {(["consultation", "booking"] as const).map((k) => {
                  const f = k === "consultation" ? (l.consultFree ? 0 : l.consultFee) : l.bookingFree ? 0 : l.bookingFee;
                  return (
                    <button key={k} onClick={() => setKind(k)} className={cx("rounded-4xl border-2 p-6 text-left transition", kind === k ? "border-plum-500 bg-plum-50" : "border-plum-100 hover:border-plum-300")}>
                      <p className="font-display text-2xl font-semibold text-ink">{KIND_COPY[k].title}</p>
                      <p className={cx("mt-1 font-display text-xl", f ? "text-ink" : "text-lagoon-600")}>{f ? naira(f) : "Free"}</p>
                      <p className="mt-2 text-sm text-plum-600">{KIND_COPY[k].blurb}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-ink">Pick a day</p>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {dates.map((d) => (
                      <button key={d.iso} onClick={() => setDate(d.iso)} className={cx("min-w-[78px] rounded-3xl border-2 px-3 py-3 text-center transition", date === d.iso ? "border-plum-600 bg-plum-600 text-white" : "border-plum-100 bg-white text-ink hover:border-plum-300")}>
                        <span className={cx("block text-xs font-semibold uppercase", date === d.iso ? "text-plum-100" : "text-plum-400")}>{d.day}</span>
                        <span className="block font-display text-lg font-semibold">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-ink">Pick a time</p>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s, i) => {
                      const taken = (i * 7 + (date.charCodeAt(9) || 0)) % 5 === 0;
                      return (
                        <button key={s} disabled={taken || !date} onClick={() => setTime(s)} className={cx("rounded-full border-2 px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40", time === s ? "border-tangerine-500 bg-tangerine-500 text-white" : "border-plum-100 bg-white text-ink hover:border-plum-300", taken && "line-through")}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {!date && <p className="mt-2 text-sm text-plum-400">Choose a day first.</p>}
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-ink">How would you like to talk?</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {l.channels.map((c) => {
                      const I = channelIcon[c];
                      return (
                        <button key={c} onClick={() => setChannel(c)} className={cx("rounded-3xl border-2 p-4 text-left transition", channel === c ? "border-lagoon-400 bg-lagoon-50" : "border-plum-100 bg-white")}>
                          <I className={channel === c ? "text-lagoon-600" : "text-plum-300"} />
                          <p className="mt-2 text-sm font-semibold text-ink">{CHANNEL_LABEL[c]}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-plum-500">Everything happens inside Tyche — you never have to share your phone number.</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {!user ? (
                  <>
                    <p className="rounded-3xl bg-plum-50 p-4 text-sm text-plum-700">Create your private Tyche account so your booking, chats and receipts stay safe in one place. <Link to={`/signin?next=/book/${l.id}?kind=${kind}`} className="font-semibold underline">Already have one?</Link></p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Your name or nickname"><Input value={acct.name} onChange={(e) => setAcct({ ...acct, name: e.target.value })} placeholder="e.g. Tomi" /></Field>
                      <Field label="Email or phone"><Input value={acct.contact} onChange={(e) => setAcct({ ...acct, contact: e.target.value })} /></Field>
                      <div className="sm:col-span-2"><Field label="Password" hint="At least 6 characters"><Input type="password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} /></Field></div>
                    </div>
                  </>
                ) : (
                  <p className="rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600">Booking as <b>{user.name}</b>.</p>
                )}
                {myReports.length > 0 && (
                  <Field label={`Share a saved report with ${l.name.split(" ")[0]}?`} optional>
                    <div className="space-y-2">
                      {[{ id: "", category: "Don't share a report" }, ...myReports].map((r) => (
                        <label key={r.id} className={cx("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 text-sm", reportId === r.id ? "border-plum-400 bg-plum-50" : "border-plum-100")}>
                          <input type="radio" checked={reportId === r.id} onChange={() => setReportId(r.id)} className="accent-plum-600" />
                          {r.id ? <span><b>{r.id}</b> · {r.category}</span> : r.category}
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
                <Field label="Anything you'd like them to know first?" optional hint="Share as much or as little as you want."><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="I'd like to understand if I can…" /></Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="rounded-4xl bg-cream p-5">
                  {[
                    [KIND_COPY[kind].title + " with " + l.name, fee ? naira(fee) : "Free"],
                    ["When", `${dateLabel?.day} ${dateLabel?.label}, ${time}`],
                    ["Where", CHANNEL_LABEL[channel]],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-plum-100 py-3 text-sm last:border-0"><span className="text-plum-500">{k}</span><span className="text-right font-semibold text-ink">{v}</span></div>
                  ))}
                  <div className="mt-2 flex justify-between pt-2"><span className="font-semibold text-ink">Total</span><span className="font-display text-2xl font-semibold text-ink">{fee ? naira(fee) : "₦0"}</span></div>
                </div>
                {fee > 0 && (
                  <div className="flex items-start gap-3 rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600">
                    <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                    <span>You pay Tyche, not the lawyer directly. We hold your payment and only release it after your session happens. If they don't show, you get a full refund.</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              {step > (bid ? 1 : 0) ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Back</Button> : <span />}
              {step < 3 ? (
                <Button disabled={!valid} onClick={next}>Continue <ArrowRight size={18} /></Button>
              ) : (
                <Button variant="warm" size="lg" disabled={paying} onClick={confirm}>
                  {paying ? "Processing…" : fee ? <><CreditCard size={18} /> Pay {naira(fee)} securely</> : <><CheckCircle2 size={18} /> Confirm booking</>}
                </Button>
              )}
            </div>
            {step === 3 && fee > 0 && <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-plum-400"><Lock size={12} /> Card, transfer or USSD · secured by Paystack</p>}
          </Card>
        </div>

        <aside className="lg:pt-16">
          <Card className="p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-4">
              <Avatar name={l.name} hue={l.hue} size={60} />
              <div><p className="font-display text-xl font-semibold text-ink">{l.name}</p><p className="text-sm text-plum-500">{l.city}, {l.state}</p></div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-plum-500">Session</span><span className="font-semibold capitalize text-ink">{kind}</span></div>
              <div className="flex justify-between"><span className="text-plum-500">Fee</span><span className="font-semibold text-ink">{fee ? naira(fee) : "Free"}</span></div>
              {date && <div className="flex justify-between"><span className="text-plum-500">Day</span><span className="font-semibold text-ink">{dateLabel?.day} {dateLabel?.label}</span></div>}
              {time && <div className="flex justify-between"><span className="text-plum-500">Time</span><span className="font-semibold text-ink">{time}</span></div>}
              <div className="flex justify-between"><span className="text-plum-500">Via</span><span className="font-semibold text-ink">{CHANNEL_LABEL[channel]}</span></div>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  );
}
