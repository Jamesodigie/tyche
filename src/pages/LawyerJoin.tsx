import { CodeStep } from "../components/CodeStep";
import { ArrowLeft, ArrowRight, BadgeCheck, FileCheck2, Gavel, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { channelIcon } from "../components/LawyerCard";
import { Avatar, Blobs, Button, Card, Chip, Field, Input, Notice, PasswordInput, Select, Stepper, Textarea, Toggle } from "../components/ui";
import {
  CHANNEL_LABEL, DAYS, PRACTICE_AREAS, STATES, TYCHE_FEE, lawyerTake, naira, tycheTake,
  type Channel,
} from "../lib/data";
import { useStore, type LawyerInput } from "../lib/store";

const STEPS = ["About you", "Your practice", "Your fees", "Your availability", "Review"];
const LANGS = ["English", "Pidgin", "Yoruba", "Igbo", "Hausa", "French", "Arabic"];

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function FeeBlock({ label, sub, fee, free, onFee, onFree, freeLabel }: { label: string; sub: string; fee: number; free: boolean; onFee: (n: number) => void; onFree: (b: boolean) => void; freeLabel: string }) {
  return (
    <div className="rounded-4xl bg-cream p-5 ring-1 ring-plum-100">
      <p className="font-display text-xl font-semibold text-ink">{label}</p>
      <p className="text-sm text-plum-500">{sub}</p>
      <div className="mt-4"><Toggle on={free} onChange={onFree} label={freeLabel} sub="Free sessions get a 'Free' badge and show up first for women who need it most." /></div>
      {!free && (
        <div className="mt-4">
          <Field label="Your fee (₦)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-plum-400">₦</span>
              <Input type="number" min={0} step={1000} value={fee || ""} onChange={(e) => onFee(+e.target.value)} className="pl-9" placeholder="15000" />
            </div>
          </Field>
          {fee > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-2xl bg-white p-3"><p className="text-plum-400">Client pays</p><p className="font-semibold text-ink">{naira(fee)}</p></div>
              <div className="rounded-2xl bg-white p-3"><p className="text-plum-400">Tyche ({TYCHE_FEE * 100}%)</p><p className="font-semibold text-ink">{naira(tycheTake(fee))}</p></div>
              <div className="rounded-2xl bg-lagoon-50 p-3 ring-1 ring-lagoon-200"><p className="text-lagoon-600">You receive</p><p className="font-semibold text-lagoon-600">{naira(lawyerTake(fee))}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LawyerJoin() {
  const { user, myLawyer, signUp, createLawyer, uploadLicence } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<"" | "created" | "confirm">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [licence, setLicence] = useState<File | null>(null);
  const [f, setF] = useState({
    name: user?.name || "", email: user?.email || "", phone: "", password: "", meetLink: "",
    scn: "", branch: "", yearCalled: "", state: "Lagos", city: "",
    areas: [] as string[], languages: ["English"] as string[], bio: "", licence: "",
    consultFee: 10000, consultFree: false, bookingFee: 150000, bookingFree: false, sessionMins: 30,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"], from: "09:00", to: "17:00",
    channels: ["call", "chat", "meet"] as Channel[],
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const valid = [
    f.name.trim().length > 2 && (!!user || (/\S+@\S+\.\S+/.test(f.email) && f.phone.replace(/\D/g, "").length >= 10 && f.password.length >= 6)),
    f.scn.trim() && f.yearCalled && f.city.trim() && f.areas.length > 0,
    (f.consultFree || f.consultFee > 0) && (f.bookingFree || f.bookingFee > 0),
    f.days.length > 0 && f.channels.length > 0 && f.from < f.to && (!f.meetLink || /^https:\/\/meet\.google\.com\//.test(f.meetLink.trim())),
    true,
  ][step];

  const finish = async () => {
    setErr("");
    setBusy(true);
    const input: LawyerInput = {
      name: f.name.trim(), state: f.state, city: f.city.trim(), yearCalled: +f.yearCalled, scn: f.scn.trim(), branch: f.branch.trim() || undefined,
      areas: f.areas, languages: f.languages, bio: f.bio.trim(), consultFee: f.consultFee, consultFree: f.consultFree,
      bookingFee: f.bookingFee, bookingFree: f.bookingFree, sessionMins: f.sessionMins, days: f.days, from: f.from, to: f.to,
      channels: f.channels, meetLink: f.meetLink.trim() || undefined,
    };
    if (user) {
      const error = await createLawyer(input, licence);
      setBusy(false);
      return error ? setErr(error) : setDone("created");
    }
    const out = await signUp({ name: input.name, email: f.email.trim(), password: f.password, phone: f.phone, role: "lawyer", lawyer: input });
    if (out.error) {
      setBusy(false);
      return setErr(out.error);
    }
    if (out.needsConfirm) {
      setBusy(false);
      return setDone("confirm");
    }
    // Account exists and the profile is created from the sign-up details; attach the licence if given.
    if (licence) await uploadLicence(licence);
    setBusy(false);
    setDone("created");
  };

  if (myLawyer && !done)
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6 sm:py-20">
        <BadgeCheck className="mx-auto text-lagoon-500" size={44} />
        <h1 className="h-page mt-3 font-display font-semibold text-ink">You already have a lawyer profile</h1>
        <Button className="mt-6" to="/lawyer/dashboard">Go to my dashboard <ArrowRight size={18} /></Button>
      </div>
    );

  if (done === "confirm")
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-14">
          <Card className="p-5 sm:p-8">
            <CodeStep
              email={f.email.trim()}
              onBack={() => { setDone(""); setStep(0); }}
              onVerified={async () => {
                // Signed in now: the lawyer profile is created from the sign-up details. Attach the licence if given.
                if (licence) await uploadLicence(licence).catch(() => null);
                setDone("created");
              }}
            />
          </Card>
        </div>
      </section>
    );

  if (done)
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lagoon-100 text-lagoon-600 animate-rise"><BadgeCheck size={40} /></div>
          <p className="mt-6 font-script text-3xl text-tangerine-500">welcome aboard, Counsel</p>
          <h1 className="h-page font-display font-semibold text-ink">Your profile is in, {f.name.split(" ")[0]}!</h1>
          <p className="mt-4 text-lg text-plum-700/80">
            Our team will confirm your enrolment with the Bar within 24–48 hours. While you wait, have a look around your
            case board — you'll be able to send offers as soon as you're verified.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/lawyer/dashboard")}>Go to my dashboard <ArrowRight size={18} /></Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/lawyers")}>See other lawyers</Button>
          </div>
        </div>
      </section>
    );

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 py-6 sm:py-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="font-script text-3xl text-tangerine-500">hello, Counsel</p>
          <h1 className="h-page font-display font-semibold text-ink">Join Tyche as a lawyer</h1>
          <p className="mt-1 max-w-xl text-sm text-plum-700/80 sm:mt-2 sm:text-base">Set your own fees and hours. Get matched with women who need you. Get paid through Tyche — no chasing anyone.</p>
          <Card className="mt-8 p-6 sm:p-8">
            <Stepper steps={STEPS} current={step} />

            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Full name (as on your call-to-bar certificate)"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Barr. Adaeze Okafor" /></Field></div>
                {user ? (
                  <p className="rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600 sm:col-span-2">Signed in as <b>{user.email}</b> — we'll attach your lawyer profile to this account.</p>
                ) : (
                  <>
                    <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@chambers.ng" autoComplete="email" /></Field>
                    <Field label="Phone"><Input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0803 000 0000" autoComplete="tel" /></Field>
                    <div className="sm:col-span-2"><Field label="Create a password" hint="At least 6 characters"><PasswordInput value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" /></Field></div>
                    <p className="text-sm text-plum-500 sm:col-span-2">Already on Tyche? <Link to="/signin?as=lawyer&next=/join/lawyer" className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Sign in first</Link></p>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Supreme Court enrolment number"><Input value={f.scn} onChange={(e) => set("scn", e.target.value)} placeholder="SCN 0XXXXX" /></Field>
                <Field label="Year called to bar"><Input type="number" min={1970} max={new Date().getFullYear()} value={f.yearCalled} onChange={(e) => set("yearCalled", e.target.value)} placeholder="2015" /></Field>
                <Field label="NBA branch" optional><Input value={f.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Ikeja" /></Field>
                <Field label="State"><Select value={f.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <div className="sm:col-span-2"><Field label="City / area"><Input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Lekki" /></Field></div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-ink">What do you handle? <span className="font-normal text-plum-400">pick all that apply</span></p>
                  <div className="flex flex-wrap gap-2">{PRACTICE_AREAS.map((a) => <Chip key={a} active={f.areas.includes(a)} onClick={() => set("areas", toggle(f.areas, a))}>{a}</Chip>)}</div>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-ink">Languages you speak with clients</p>
                  <div className="flex flex-wrap gap-2">{LANGS.map((a) => <Chip tone="teal" key={a} active={f.languages.includes(a)} onClick={() => set("languages", toggle(f.languages, a))}>{a}</Chip>)}</div>
                </div>
                <div className="sm:col-span-2"><Field label="A few warm words about you" hint="Women read this before choosing you. Be human — how do you make people feel safe?"><Textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="I've spent 8 years helping women…" /></Field></div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-semibold text-ink">Practising licence / call-to-bar certificate</p>
                  <label className="flex cursor-pointer items-center gap-4 rounded-3xl border-2 border-dashed border-plum-200 bg-cream p-5 hover:border-plum-400">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-plum-100 text-plum-600">{licence ? <FileCheck2 /> : <Upload />}</span>
                    <span className="text-sm"><span className="block font-semibold text-ink">{licence?.name || "Upload a PDF or photo"}</span><span className="text-plum-500">Only our verification team sees this.</span></span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setLicence(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="rounded-3xl bg-tangerine-50 p-4 text-sm text-ink">
                  <b>How fees work:</b> clients pay through Tyche when they book. After each paid session we pay you automatically —
                  you receive {100 - TYCHE_FEE * 100}% in your bank account and Tyche keeps {TYCHE_FEE * 100}%. Consultation and booking are priced separately.
                  You'll add your bank account from your dashboard.
                </p>
                <FeeBlock label="Consultation fee" sub="A first conversation to understand someone's situation." fee={f.consultFee} free={f.consultFree} onFee={(n) => set("consultFee", n)} onFree={(b) => set("consultFree", b)} freeLabel="Offer free consultations" />
                <FeeBlock label="Booking fee" sub="When a client engages you to work on their case." fee={f.bookingFee} free={f.bookingFree} onFee={(n) => set("bookingFee", n)} onFree={(b) => set("bookingFree", b)} freeLabel="Take some cases pro bono (free booking)" />
                <Field label="Consultation length">
                  <div className="flex flex-wrap gap-2">{[20, 30, 45, 60].map((m) => <Chip key={m} active={f.sessionMins === m} onClick={() => set("sessionMins", m)}>{m} mins</Chip>)}</div>
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Which days can clients book you?</p>
                  <div className="flex flex-wrap gap-2">{DAYS.map((d) => <Chip key={d} active={f.days.includes(d)} onClick={() => set("days", toggle(f.days, d))}>{d}</Chip>)}</div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="From"><Input type="time" value={f.from} onChange={(e) => set("from", e.target.value)} /></Field>
                  <Field label="To"><Input type="time" value={f.to} onChange={(e) => set("to", e.target.value)} /></Field>
                </div>
                <Field label="Your Google Meet link" optional hint="Paste a standing Meet link (meet.google.com/…). Clients who book a Meet session get it automatically — you can change it per booking.">
                  <Input value={f.meetLink} onChange={(e) => set("meetLink", e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" inputMode="url" />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">How can clients talk to you? <span className="font-normal text-plum-400">all happen inside Tyche</span></p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => {
                      const I = channelIcon[c];
                      const on = f.channels.includes(c);
                      return (
                        <button type="button" key={c} onClick={() => set("channels", toggle(f.channels, c))} className={`rounded-3xl border-2 p-4 text-left transition ${on ? "border-lagoon-400 bg-lagoon-50" : "border-plum-100 bg-white"}`}>
                          <I className={on ? "text-lagoon-600" : "text-plum-300"} />
                          <p className="mt-2 text-sm font-semibold text-ink">{CHANNEL_LABEL[c]}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-4xl bg-cream p-5">
                  <Avatar name={f.name} size={64} hue={260} />
                  <div>
                    <p className="font-display text-2xl font-semibold text-ink">{f.name}</p>
                    <p className="text-sm text-plum-500">{f.city}, {f.state} · Called {f.yearCalled} · {f.scn}</p>
                  </div>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ["Practice areas", f.areas.join(", ")],
                    ["Languages", f.languages.join(", ")],
                    ["Consultation", f.consultFree ? "Free" : `${naira(f.consultFee)} · you get ${naira(lawyerTake(f.consultFee))}`],
                    ["Booking", f.bookingFree ? "Free (pro bono)" : `${naira(f.bookingFee)} · you get ${naira(lawyerTake(f.bookingFee))}`],
                    ["Availability", `${f.days.join(", ")} · ${f.from}–${f.to}`],
                    ["Talks via", f.channels.map((c) => CHANNEL_LABEL[c]).join(", ")],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-3xl bg-white p-4 ring-1 ring-plum-100"><dt className="text-plum-400">{k}</dt><dd className="mt-0.5 font-medium text-ink">{v}</dd></div>
                  ))}
                </dl>
                <p className="text-sm text-plum-500">By creating an account you agree to Tyche's lawyer terms, including the {TYCHE_FEE * 100}% service fee and our confidentiality standards.</p>
              </div>
            )}

            {err && <div className="mt-6"><Notice>{err}</Notice></div>}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={18} /> Back</Button> : <span />}
              {step < STEPS.length - 1 ? (
                <Button disabled={!valid} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={18} /></Button>
              ) : (
                <Button variant="warm" onClick={finish} disabled={busy}><Sparkles size={18} /> {busy ? "Creating your account…" : "Create my lawyer account"}</Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="hidden space-y-4 lg:block lg:pt-28">
          {[
            { icon: Gavel, t: "Cases come to you", d: "Women share anonymised reports. You see the evidence and send an offer." },
            { icon: BadgeCheck, t: "You set the terms", d: "Your fees, your hours, free or paid — change them any time." },
            { icon: Sparkles, t: "Paid through Tyche", d: `Clients pay upfront. You keep ${100 - TYCHE_FEE * 100}%, paid straight to your bank automatically.` },
          ].map((x) => (
            <div key={x.t} className="rounded-4xl bg-white/80 p-5 ring-1 ring-plum-100">
              <x.icon className="text-tangerine-500" />
              <p className="mt-3 font-display text-lg font-semibold text-ink">{x.t}</p>
              <p className="text-sm text-plum-600">{x.d}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
