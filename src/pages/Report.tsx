import {
  ArrowLeft, ArrowRight, EyeOff, FileAudio, FileText, FileVideo, Heart, ImageIcon, Lock, Mic, PhoneCall, ShieldCheck, Square, Trash2, UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AccountForm } from "../components/AccountForm";
import { Blobs, Button, Card, Chip, Field, Input, Notice, Select, Stepper, Textarea, Toggle, cx } from "../components/ui";
import {
  AUTHORITIES, HARASSMENT_TYPES, SETTINGS, STATES, fileKind, prettySize, uid,
  type Evidence, type Report as R,
} from "../lib/data";
import { useStore } from "../lib/store";

const STEPS = ["Your safe space", "What happened", "Your evidence", "Who sees it", "Review"];
const WANTS = ["Understand my options", "Talk to a lawyer", "Report formally", "Get content taken down", "Feel safe again", "Just keep a record for now"];
const kindIcon = { image: ImageIcon, audio: FileAudio, video: FileVideo, doc: FileText };
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

function readPreview(f: File): Promise<string | undefined> {
  if (!f.type.startsWith("image/") || f.size > 1_500_000) return Promise.resolve(undefined);
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => res(undefined);
    r.readAsDataURL(f);
  });
}

function VoiceNote({ onDone }: { onDone: (e: Evidence, blob: Blob) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState("");
  const chunks = useRef<Blob[]>([]);
  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => chunks.current.push(e.data);
      m.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        onDone({ id: uid("E"), name: `voice-note-${new Date().toLocaleTimeString("en-GB").replace(/:/g, "")}.webm`, kind: "audio", size: blob.size }, blob);
      };
      m.start();
      setSecs(0);
      setRec(m);
    } catch {
      setErr("We couldn't reach your microphone. You can upload a recording instead.");
    }
  };
  const stop = () => { rec?.stop(); setRec(null); };
  return (
    <div className="flex flex-wrap items-center gap-3">
      {rec ? (
        <Button variant="warm" type="button" onClick={stop}><Square size={16} /> Stop · {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}</Button>
      ) : (
        <Button variant="soft" type="button" onClick={start}><Mic size={18} /> Record a voice note</Button>
      )}
      {rec && <span className="flex items-center gap-2 text-sm text-tangerine-600"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-tangerine-500" /> Recording…</span>}
      {err && <span className="text-sm text-plum-500">{err}</span>}
    </div>
  );
}

export default function Report() {
  const { user, addReport } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState(false);
  const blobs = useRef(new Map<string, Blob>()); // evidence id → file, uploaded on save
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [r, setR] = useState<Omit<R, "id" | "createdAt" | "mine">>({
    alias: user?.name || "",
    category: "",
    setting: "",
    when: "",
    state: "Lagos",
    relation: "",
    description: "",
    wants: [],
    evidence: [],
    shareWithLawyers: true,
    hideName: true,
    authorities: [],
  });
  const set = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => setR((p) => ({ ...p, [k]: v }));

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const list: Evidence[] = [];
    const tooBig: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 50_000_000) { tooBig.push(f.name); continue; }
      const id = uid("E");
      blobs.current.set(id, f);
      list.push({ id, name: f.name, kind: fileKind(f), size: f.size, preview: await readPreview(f) });
    }
    setErr(tooBig.length ? `These files are over 50 MB and weren't added: ${tooBig.join(", ")}` : "");
    setR((p) => ({ ...p, evidence: [...p.evidence, ...list] }));
  };

  const valid = [
    r.alias.trim().length > 1 && !!user,
    r.category && r.setting && r.description.trim().length >= 10,
    true,
    true,
    true,
  ][step];

  const next = () => setStep(step + 1);

  const submit = async () => {
    setSaving(true);
    setErr("");
    const { evidence, ...fields } = r;
    const out = await addReport(fields, evidence.map((ev) => ({ ev, file: blobs.current.get(ev.id) })));
    setSaving(false);
    if (!out.id) return setErr(out.error || "We couldn't save your report. Please try again.");
    navigate(`/report/sent/${out.id}${out.error ? `?warn=${encodeURIComponent(out.error)}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 py-6 sm:py-10 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="font-script text-3xl text-tangerine-500">take your time, love</p>
          <h1 className="h-page font-display font-semibold text-ink">Tell us what happened</h1>
          <p className="mt-2 max-w-xl text-plum-700/80">There are no wrong answers and nothing is sent anywhere until you say so. Skip anything you're not ready to share.</p>

          <Card className="mt-8 p-6 sm:p-8">
            <Stepper steps={STEPS} current={step} />

            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-start gap-4 rounded-4xl bg-gradient-to-br from-blush-50 to-plum-50 p-5">
                  <Heart className="mt-1 shrink-0 fill-tangerine-200 text-tangerine-500" />
                  <p className="text-[15px] leading-relaxed text-ink">
                    First — whatever happened, it wasn't your fault. You're doing something brave just by being here.
                    Let's create a private space so your report and evidence are saved safely.
                  </p>
                </div>
                <Field label="Pick a nickname" hint="This is the only name lawyers will see until you choose to share more.">
                  <Input value={r.alias} onChange={(e) => set("alias", e.target.value)} placeholder="e.g. Sunflower" />
                </Field>
                {!user ? (
                  <div className="rounded-3xl bg-cream p-4 sm:p-5">
                    <p className="mb-4 text-sm font-semibold text-ink">Create your private account <span className="font-normal text-plum-500">— so your report and evidence are saved safely</span></p>
                    <AccountForm
                      cta="Create & continue"
                      nameLabel="Your name or a nickname"
                      nameHint="Only you and a lawyer you choose to book will see this."
                      defaultName={r.alias}
                      onDone={() => r.alias.trim().length > 1 && setStep(1)}
                    />
                  </div>
                ) : (
                  <p className="rounded-3xl bg-lagoon-50 p-4 text-sm text-lagoon-600">You're signed in as <b>{user.name}</b> — this report will be saved to your space.</p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">What best describes it?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {HARASSMENT_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => set("category", t)} className={cx("rounded-2xl border-2 p-3 text-left text-sm transition", r.category === t ? "border-plum-500 bg-plum-50 font-semibold text-plum-700" : "border-plum-100 text-ink hover:border-plum-300")}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Where did it happen?</p>
                  <div className="flex flex-wrap gap-2">{SETTINGS.map((s) => <Chip key={s} active={r.setting === s} onClick={() => set("setting", s)}>{s}</Chip>)}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="When?" optional><Input value={r.when} onChange={(e) => set("when", e.target.value)} placeholder="e.g. Last month" /></Field>
                  <Field label="State"><Select value={r.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                  <Field label="Who was it?" optional><Input value={r.relation} onChange={(e) => set("relation", e.target.value)} placeholder="e.g. My manager" /></Field>
                </div>
                <Field label="In your own words" hint="Write it however it comes. You can edit this later.">
                  <Textarea value={r.description} onChange={(e) => set("description", e.target.value)} className="min-h-[160px]" placeholder="It started when…" />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">What would help you most? <span className="font-normal text-plum-400">pick any</span></p>
                  <div className="flex flex-wrap gap-2">{WANTS.map((w) => <Chip tone="teal" key={w} active={r.wants.includes(w)} onClick={() => set("wants", toggle(r.wants, w))}>{w}</Chip>)}</div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <label
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                  className={cx("flex cursor-pointer flex-col items-center rounded-4xl border-2 border-dashed p-10 text-center transition", drag ? "border-tangerine-400 bg-tangerine-50" : "border-plum-200 bg-cream hover:border-plum-400")}
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-plum-600 shadow-sm"><UploadCloud size={30} /></span>
                  <span className="mt-4 font-display text-xl font-semibold text-ink">Drop your evidence here</span>
                  <span className="mt-1 text-sm text-plum-500">Screenshots, photos, voice notes, videos, emails, documents</span>
                  <span className="mt-4 rounded-full bg-plum-600 px-5 py-2 text-sm font-semibold text-white">Choose files</span>
                  <input type="file" multiple className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => addFiles(e.target.files)} />
                </label>
                <VoiceNote onDone={(e, blob) => { blobs.current.set(e.id, blob); set("evidence", [...r.evidence, e]); }} />
                {r.evidence.length > 0 && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {r.evidence.map((e) => {
                      const I = kindIcon[e.kind];
                      return (
                        <li key={e.id} className="flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-plum-100">
                          {e.preview ? <img src={e.preview} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-50 text-plum-600"><I /></span>}
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{e.name}</span><span className="text-xs text-plum-400">{prettySize(e.size)}</span></span>
                          <button type="button" onClick={() => set("evidence", r.evidence.filter((x) => x.id !== e.id))} className="rounded-full p-2 text-plum-400 hover:bg-blush-100 hover:text-tangerine-600" aria-label="Remove"><Trash2 size={18} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="flex items-center gap-2 text-sm text-plum-500"><Lock size={14} /> Evidence lives in your private vault. No evidence yet? That's okay — you can add it later.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Toggle on={r.shareWithLawyers} onChange={(v) => set("shareWithLawyers", v)} label="Let verified lawyers see my report and offer to help" sub="They'll see your story and evidence, then send you offers — free consultations, fees, and a note. You choose who (if anyone) to work with." />
                <Toggle on={r.hideName} onChange={(v) => set("hideName", v)} label="Keep my identity hidden" sub={`Lawyers only see "${r.alias || "your nickname"}". Your contact is never shared until you book.`} />
                <div className="rounded-4xl bg-cream p-5">
                  <p className="font-semibold text-ink">Would you like to report to anyone formally? <span className="font-normal text-plum-400">optional</span></p>
                  <p className="mt-1 text-sm text-plum-600">We'll prepare your report and walk you through it. We never contact anyone without your go-ahead.</p>
                  <div className="mt-4 grid gap-2">
                    {AUTHORITIES.map((a) => (
                      <label key={a.id} className={cx("flex cursor-pointer items-start gap-3 rounded-3xl border-2 bg-white p-4", r.authorities.includes(a.id) ? "border-plum-400" : "border-transparent")}>
                        <input type="checkbox" className="mt-1 h-4 w-4 accent-plum-600" checked={r.authorities.includes(a.id)} onChange={() => set("authorities", toggle(r.authorities, a.id))} />
                        <span><span className="block text-sm font-semibold text-ink">{a.name}</span><span className="text-xs text-plum-500">{a.note}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-sm">
                <div className="rounded-4xl bg-cream p-5">
                  <p className="text-plum-400">Nickname</p><p className="font-semibold text-ink">{r.alias}</p>
                  <p className="mt-3 text-plum-400">What happened</p><p className="font-semibold text-ink">{r.category} · {r.setting}{r.when && ` · ${r.when}`} · {r.state}</p>
                  <p className="mt-3 text-plum-400">In your words</p><p className="whitespace-pre-line text-ink">{r.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-plum-100"><p className="text-plum-400">Evidence</p><p className="font-semibold text-ink">{r.evidence.length} file{r.evidence.length === 1 ? "" : "s"}</p></div>
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-plum-100"><p className="text-plum-400">Lawyers can bid</p><p className="font-semibold text-ink">{r.shareWithLawyers ? "Yes" : "No — private"}</p></div>
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-plum-100"><p className="text-plum-400">Formal report</p><p className="font-semibold text-ink">{r.authorities.length ? AUTHORITIES.filter((a) => r.authorities.includes(a.id)).map((a) => a.name.split(" —")[0]).join(", ") : "Not now"}</p></div>
                </div>
              </div>
            )}

            {err && <div className="mt-6"><Notice>{err}</Notice></div>}
            {(user || step > 0) && (
              <div className="mt-8 flex items-center justify-between">
                {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}><ArrowLeft size={18} /> Back</Button> : <span />}
                {step < STEPS.length - 1 ? (
                  <Button disabled={!valid} onClick={next}>{step === 2 && !r.evidence.length ? "Skip for now" : "Continue"} <ArrowRight size={18} /></Button>
                ) : (
                  <Button variant="warm" size="lg" onClick={submit} disabled={saving}>
                    <ShieldCheck size={18} /> {saving ? (r.evidence.length ? "Uploading evidence…" : "Saving…") : "Save my report"}
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4 lg:pt-32">
          <div className="rounded-4xl bg-ink p-6 text-white">
            <PhoneCall className="text-tangerine-400" />
            <p className="mt-3 font-display text-xl font-semibold">In danger right now?</p>
            <p className="mt-1 text-sm text-plum-100">Call <b>112</b>, Nigeria's free emergency number. Your report will be right here when you're safe.</p>
          </div>
          <div className="rounded-4xl bg-white/80 p-6 ring-1 ring-plum-100">
            <EyeOff className="text-plum-500" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">Need to leave quickly?</p>
            <p className="mt-1 text-sm text-plum-600">Tap <b>Quick exit</b> at the bottom-right, or press <kbd className="rounded bg-plum-50 px-1.5">Esc</kbd> three times.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
