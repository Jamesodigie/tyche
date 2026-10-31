import { YourData } from "../components/YourData";
import { PhotoPicker } from "../components/PhotoPicker";
import {
  BadgeCheck, Banknote, Briefcase, CalendarHeart, CheckCircle2, Clock, Eye, FileCheck2, Gavel, Link2, MessageCircleHeart, Save, Send, Settings2, Upload, Video, Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EvidenceChip } from "../components/EvidenceChip";
import { channelIcon } from "../components/LawyerCard";
import { Avatar, Badge, Blobs, Button, Card, Chip, Empty, Field, Input, Notice, Select, Textarea, Toggle, cx } from "../components/ui";
import {
  CHANNEL_LABEL, DAYS, KIND_COPY, PRACTICE_AREAS, TYCHE_FEE, lawyerTake, naira, timeAgo, tycheTake,
  type Booking, type Channel, type Lawyer, type Report, type SessionKind,
} from "../lib/data";
import { NotificationsCard } from "../components/Alerts";
import { SupportAvatar, openSupport } from "../components/Support";
import { useStore } from "../lib/store";

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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pickKind = (k: SessionKind) => {
    setKind(k);
    setFree(k === "consultation" ? me.consultFree : me.bookingFree);
    setFee((k === "consultation" ? me.consultFee : me.bookingFee) || (k === "consultation" ? 10000 : 150000));
  };

  const send = async () => {
    setBusy(true);
    setErr("");
    const error = await addBid({ reportId: r.id, lawyerId: me.id, kind, free, fee: free ? 0 : fee, message: msg.trim() });
    setBusy(false);
    if (error) setErr(error);
    else setOpen(false);
  };

  return (
    <Card className="p-5 sm:p-6">
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
          {r.evidence.length ? r.evidence.map((e) => <EvidenceChip key={e.id} e={e} />) : <span className="text-sm text-plum-400">No files yet</span>}
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
          {err && <Notice>{err}</Notice>}
          <div className="flex gap-2">
            <Button variant="warm" disabled={msg.trim().length < 10 || busy} onClick={send}><Send size={16} /> {busy ? "Sending…" : "Send offer"}</Button>
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof Lawyer>(k: K, v: Lawyer[K]) => { setSaved(false); setErr(""); setL((p) => ({ ...p, [k]: v })); };
  const save = async () => {
    if (l.meetLink && !/^https:\/\/meet\.google\.com\//.test(l.meetLink.trim())) return setErr("Your Meet link should start with https://meet.google.com/");
    if (l.from >= l.to) return setErr("Your start time should be before your end time.");
    setBusy(true);
    const error = await updateLawyer({ ...l, meetLink: l.meetLink?.trim() || undefined });
    setBusy(false);
    if (error) setErr(error);
    else setSaved(true);
  };
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
        <Field label="Your Google Meet link" optional hint="Added automatically to Meet bookings.">
          <Input value={l.meetLink || ""} onChange={(e) => set("meetLink", e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" inputMode="url" />
        </Field>
        <Field label="About you">
          <Textarea value={l.bio} onChange={(e) => set("bio", e.target.value)} />
        </Field>
        <p className="text-sm font-semibold text-ink">Practice areas</p>
        <div className="flex flex-wrap gap-2">{PRACTICE_AREAS.map((a) => <Chip key={a} active={l.areas.includes(a)} onClick={() => set("areas", tog(l.areas, a))}>{a}</Chip>)}</div>
      </Card>
      <div className="flex items-center gap-3 lg:col-span-2">
        <Button onClick={save} disabled={busy}><Save size={18} /> {busy ? "Saving…" : "Save changes"}</Button>
        {err && <span className="text-sm font-semibold text-tangerine-600">{err}</span>}
        {saved && <span className="flex items-center gap-1 text-sm font-semibold text-lagoon-600"><CheckCircle2 size={16} /> Saved — your profile is updated</span>}
      </div>
    </div>
  );
}

function SetupCards({ me }: { me: Lawyer }) {
  const { mode, banks, setupPayout, uploadLicence } = useStore();
  const [bankList, setBankList] = useState<{ name: string; code: string }[]>([]);
  const [bank, setBank] = useState("");
  const [acct, setAcct] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"" | "payout" | "licence">("");
  const [err, setErr] = useState("");
  const showPayout = !me.payoutReady || editing;
  useEffect(() => {
    if (showPayout && !bankList.length) banks().then(setBankList).catch(() => {});
  }, [showPayout, bankList.length, banks]);

  const savePayout = async () => {
    setBusy("payout");
    setErr("");
    const name = bankList.find((b) => b.code === bank)?.name || bank;
    const error = await setupPayout(bank, name, acct);
    setBusy("");
    if (error) setErr(error);
    else setEditing(false);
  };
  const onLicence = async (f?: File) => {
    if (!f) return;
    setBusy("licence");
    const error = await uploadLicence(f);
    setBusy("");
    if (error) setErr(error);
  };

  const needsLicence = mode === "live" && !me.hasLicence && me.status !== "approved";
  if (!showPayout && !needsLicence)
    return (
      <p className="mt-6 flex flex-wrap items-center gap-2 rounded-3xl bg-white p-4 text-sm text-plum-700 ring-1 ring-plum-100">
        <Banknote size={18} className="text-lagoon-500" /> Payouts go to <b>{me.payoutBank}</b> ····{me.payoutLast4}{me.payoutAccountName ? ` (${me.payoutAccountName})` : ""}.
        <button onClick={() => setEditing(true)} className="ml-auto py-1 font-semibold text-plum-600 underline">Change</button>
      </p>
    );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {showPayout && (
        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-ink"><Banknote className="text-tangerine-500" /> {me.payoutReady ? "Change payout account" : "Add your payout account"}</p>
          <p className="mt-1 text-sm text-plum-600">
            Your {100 - TYCHE_FEE * 100}% of every paid session is paid into this account automatically. {!me.payoutReady && "Until you add it, your earnings wait safely with Tyche."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select value={bank} onChange={(e) => setBank(e.target.value)} aria-label="Bank">
              <option value="">{bankList.length ? "Choose your bank" : "Loading banks…"}</option>
              {bankList.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </Select>
            <Input value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit account number" inputMode="numeric" aria-label="Account number" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={savePayout} disabled={!bank || acct.length !== 10 || busy === "payout"}>{busy === "payout" ? "Checking account…" : "Verify & save"}</Button>
            {me.payoutReady && <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </Card>
      )}
      {needsLicence && (
        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-ink"><FileCheck2 className="text-tangerine-500" /> Upload your licence</p>
          <p className="mt-1 text-sm text-plum-600">We need your call-to-bar certificate or practising licence to verify you. Only our team sees it.</p>
          <label className="mt-4 inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white">
            <Upload size={16} /> {busy === "licence" ? "Uploading…" : "Choose file"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onLicence(e.target.files?.[0])} />
          </label>
        </Card>
      )}
      {err && <div className="lg:col-span-2"><Notice>{err}</Notice></div>}
    </div>
  );
}

function LawyerBookingCard({ b, report }: { b: Booking; report?: Report }) {
  const { setMeetLink, completeBooking } = useStore();
  const I = channelIcon[b.channel];
  const [link, setLink] = useState(b.meetLink || "");
  const [msg, setMsg] = useState("");
  const saveLink = async () => {
    if (link && !/^https:\/\/meet\.google\.com\//.test(link.trim())) return setMsg("Use a https://meet.google.com/ link");
    const error = await setMeetLink(b.id, link.trim());
    setMsg(error || "Saved ✓");
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar name={b.clientName} hue={330} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{b.clientName}</p>
          <p className="text-sm text-plum-500">{KIND_COPY[b.kind].title} · {b.fee ? naira(b.fee) : "Free"}</p>
        </div>
        <Badge tone={b.status === "done" ? "plum" : "teal"}>{b.status === "done" ? "Completed" : "Upcoming"}</Badge>
      </div>
      <p className="mt-4 flex items-center gap-2 rounded-3xl bg-cream p-3 text-sm text-ink"><I size={16} className="shrink-0 text-plum-500" /> {new Date(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {b.time} · {CHANNEL_LABEL[b.channel]}</p>
      {report && <p className="mt-2 text-xs text-plum-500">Shared report: <b>{report.id}</b> · {report.category}</p>}
      {b.channel === "meet" && b.status === "upcoming" && (
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-plum-300" />
            <Input value={link} onChange={(e) => { setLink(e.target.value); setMsg(""); }} placeholder="Google Meet link for this session" className="py-2 pl-9 text-sm" aria-label="Google Meet link" />
          </div>
          <Button size="sm" variant="soft" onClick={saveLink}>Save</Button>
        </div>
      )}
      {msg && <p className="mt-1 text-xs font-semibold text-plum-600">{msg}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" to={`/session/${b.id}`}><Video size={16} /> Start session</Button>
        <Button size="sm" variant="outline" to={`/messages/${b.id}`}><MessageCircleHeart size={16} /> Message</Button>
        {b.status === "upcoming" && <Button size="sm" variant="ghost" onClick={() => completeBooking(b.id)}><CheckCircle2 size={16} /> Mark done</Button>}
      </div>
    </Card>
  );
}

const payoutLabel = (s?: string) =>
  ({ queued: "Sending", waiting: "Waiting for your bank", sent: "On its way", completed: "Paid ✓", failed: "Delayed — we're on it" } as Record<string, string>)[s || ""] || "Processing";

/** Lawyers must have a photo to be approved and listed. */
function PhotoNeeded({ name }: { name: string }) {
  const { uploadPhoto } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="mt-5 rounded-3xl bg-tangerine-50 p-4 ring-1 ring-tangerine-200">
      <p className="mb-3 text-sm font-semibold text-ink">Add your profile photo — it's required. Clients only see lawyers with a photo.</p>
      <PhotoPicker
        name={name}
        required
        hint={busy ? "Uploading…" : "Tap to choose a clear photo of your face."}
        onPick={async (f) => {
          setBusy(true);
          setErr("");
          const e = await uploadPhoto(f);
          setBusy(false);
          if (e) setErr(e);
        }}
        className="bg-white"
      />
      {err && <p className="mt-2 text-sm text-tangerine-600">{err}</p>}
    </div>
  );
}

export default function LawyerDashboard() {
  const { user, myLawyer: me, caseBoard, bids, bookings, lawyerState, ready, myPayouts, mode } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("cases");
  const [area, setArea] = useState("");

  if (!ready) return <div className="grid min-h-[50vh] place-items-center text-plum-400">Loading…</div>;
  if (!user || !me)
    return (
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-20">
        <Empty icon={<Gavel />} title="This space is for Tyche lawyers" sub={user ? "Your account doesn't have a lawyer profile yet. It takes a few minutes." : "Sign in with your lawyer account, or create one in a few minutes."} action={<div className="flex flex-wrap justify-center gap-2">{!user && <Button to="/signin?as=lawyer&next=/lawyer/dashboard">Sign in as a lawyer</Button>}<Button variant={user ? "primary" : "outline"} to="/join/lawyer">{user ? "Create my lawyer profile" : "Join Tyche"}</Button></div>} />
      </div>
    );

  const open = caseBoard.filter((r) => r.shareWithLawyers && (!area || r.category === area || r.setting === area));
  const myBids = bids.filter((b) => b.lawyerId === me.id);
  const myBookings = bookings.filter((b) => b.lawyerId === me.id && (b.status === "upcoming" || b.status === "done"));
  const cases = new Map([...caseBoard].map((r) => [r.id, r]));
  const gross = myBookings.reduce((n, b) => n + b.fee, 0);

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <Avatar src={me.photoUrl} name={me.name} hue={me.hue} size={60} />
          <div className="flex-1">
            <p className="font-script text-2xl text-tangerine-500">good to see you, Counsel</p>
            <h1 className="h-page flex flex-wrap items-center gap-2 font-display font-semibold text-ink">
              {me.name}
              {me.verified ? <Badge tone="teal"><BadgeCheck size={14} /> Verified</Badge> : <Badge tone="warm"><Clock size={14} /> Verification pending</Badge>}
            </h1>
          </div>
          <Button variant="outline" to={`/lawyers/${me.id}`}>View public profile</Button>
        </div>

        {!me.photoUrl && mode === "live" && <PhotoNeeded name={me.name} />}

        <SetupCards me={me} />

        {!me.verified && (
          <p className="mt-6 rounded-3xl bg-tangerine-50 p-4 text-sm text-ink">
            {lawyerState(me) === "rejected"
              ? "We couldn't verify your enrolment yet, so your profile isn't visible to clients. Please email the Tyche team with your call-to-bar certificate to try again."
              : "We're confirming your enrolment with the Bar (24–48 hrs). You can look around now — you'll be able to bid on cases and appear to clients as soon as you're approved."}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-4">
          {[
            { t: "Open cases", v: open.length, c: "bg-tangerine-100 text-tangerine-600", i: Briefcase },
            { t: "Offers sent", v: myBids.length, c: "bg-plum-100 text-plum-600", i: Send },
            { t: "Bookings", v: myBookings.length, c: "bg-lagoon-100 text-lagoon-600", i: CalendarHeart },
            { t: "You've earned", v: naira(lawyerTake(gross)), c: "bg-blush-200 text-plum-700", i: Wallet },
          ].map((s) => (
            <div key={s.t} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-soft ring-1 ring-plum-100 sm:flex-row sm:items-center sm:gap-4 sm:rounded-4xl sm:p-5">
              <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12", s.c)}><s.i size={22} /></span>
              <span className="min-w-0"><span className="block truncate font-display text-xl font-semibold text-ink sm:text-2xl">{s.v}</span><span className="block text-xs leading-tight text-plum-500 sm:text-sm">{s.t}</span></span>
            </div>
          ))}
        </div>


        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <NotificationsCard compact />
          <button onClick={() => openSupport()} className="flex items-center gap-3 rounded-3xl bg-white p-3 text-left ring-1 ring-plum-100 transition hover:bg-plum-50">
            <SupportAvatar size={40} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">Message support</span>
              <span className="block text-xs text-plum-500">Chat, FAQ or WhatsApp — we're here</span>
            </span>
          </button>
        </div>
        <YourData className="mt-3" />
        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx("flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition", tab === t.id ? "bg-plum-600 text-white" : "bg-white text-plum-600 ring-1 ring-plum-100")}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "cases" && (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="text-sm text-plum-600 sm:text-base">Women who chose to share their story with verified lawyers. Names stay hidden until they book you.</p>
                <Select value={area} onChange={(e) => setArea(e.target.value)} className="w-full sm:ml-auto sm:w-auto">
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
                  const r = cases.get(b.reportId);
                  return (
                    <Card key={b.id} className="flex flex-wrap items-center gap-4 p-5">
                      <div className="flex-1">
                        <p className="font-semibold text-ink">{r ? <>“{r.alias}” · {r.category}</> : <>Case {b.reportId}</>}</p>
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
                {myBookings.map((b) => <LawyerBookingCard key={b.id} b={b} report={b.reportId ? cases.get(b.reportId) : undefined} />)}
              </div>
            ) : (
              <Empty icon={<CalendarHeart />} title="No bookings yet" sub="When a client books you or accepts your offer, it'll show here." />
            ))}

          {tab === "earnings" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                <Card className="p-5 sm:p-6"><p className="text-sm text-plum-500">Clients paid</p><p className="font-display text-3xl font-semibold text-ink">{naira(gross)}</p></Card>
                <Card className="p-6"><p className="text-sm text-plum-500">Tyche service fee ({TYCHE_FEE * 100}%)</p><p className="font-display text-3xl font-semibold text-ink">{naira(tycheTake(gross))}</p></Card>
                <Card className="bg-lagoon-50 p-6 ring-lagoon-200"><p className="text-sm text-lagoon-600">Your earnings</p><p className="font-display text-3xl font-semibold text-lagoon-600">{naira(lawyerTake(gross))}</p></Card>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-plum-50 text-plum-500"><tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Tyche</th><th className="px-5 py-3">You</th><th className="px-5 py-3">Payout</th></tr></thead>
                  <tbody>
                    {myBookings.length ? myBookings.map((b) => (
                      <tr key={b.id} className="border-t border-plum-50">
                        <td className="px-5 py-3 font-medium text-ink">{b.clientName}</td>
                        <td className="px-5 py-3 capitalize text-plum-600">{b.kind}</td>
                        <td className="px-5 py-3">{b.fee ? naira(b.fee) : "Free"}</td>
                        <td className="px-5 py-3 text-plum-500">{naira(tycheTake(b.fee))}</td>
                        <td className="px-5 py-3 font-semibold text-lagoon-600">{naira(lawyerTake(b.fee))}</td>
                        <td className="px-5 py-3 text-xs text-plum-500">{b.fee ? payoutLabel(myPayouts.find((p) => p.bookingId === b.id)?.status) : "—"}</td>
                      </tr>
                    )) : <tr><td colSpan={6} className="px-5 py-8 text-center text-plum-400">No payments yet</td></tr>}
                  </tbody>
                </table>
                </div>
              </Card>
              <p className="text-sm text-plum-500">Your 80% is paid into your bank account automatically after each paid session (new bank accounts are checked by our payment partner first).</p>
            </div>
          )}

          {tab === "profile" && <ProfileEditor me={me} />}
        </div>
      </div>
    </section>
  );
}
