import { useState } from "react";
import { Download, Trash2, Database } from "lucide-react";
import { useStore } from "../lib/store";
import { cx } from "./ui";

/** NDPA rights in one place: get a copy of your data, or ask for your account to be deleted. */
export function YourData({ className }: { className?: string }) {
  const s = useStore();
  const [step, setStep] = useState<"idle" | "confirm" | "sent">("idle");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!s.user) return null;

  const download = () => {
    // Previews are big image data; the files themselves stay downloadable from each report.
    const strip = (r: (typeof s.reports)[number]) => ({ ...r, evidence: r.evidence.map(({ preview: _p, ...e }) => e) });
    const data = {
      exported_at: new Date().toISOString(),
      account: s.user,
      reports: s.reports.map(strip),
      bookings: s.bookings,
      offers_from_lawyers: s.bids,
      messages: s.messages,
      community: s.community,
      support_chat: s.support,
      lawyer_profile: s.myLawyer,
      payouts: s.myPayouts,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tyche-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const askDelete = async () => {
    setBusy(true);
    setErr("");
    const e = await s.sendSupport(
      "DELETE MY ACCOUNT: Please delete my Tyche account and all my information — reports, evidence, messages, and the copies in Tyche's Google backup (Sheets/Photos/Drive). (Sent from 'Your data'.)",
    );
    setBusy(false);
    if (e) return setErr(e);
    setStep("sent");
  };

  return (
    <details className={cx("group rounded-3xl bg-white p-3 ring-1 ring-plum-100", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-ink">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-plum-50 text-plum-600"><Database size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block">Your data</span>
          <span className="block text-xs font-normal text-plum-500">Download a copy or ask us to delete it</span>
        </span>
        <span className="text-plum-400 transition group-open:rotate-90">›</span>
      </summary>
      <div className="mt-3 space-y-3 text-sm text-plum-700">
        <button onClick={download} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-plum-700 px-4 font-semibold text-white">
          <Download size={16} /> Download my data
        </button>
        {step === "idle" && (
          <button onClick={() => setStep("confirm")} className="ml-2 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-cream px-4 font-semibold text-ink">
            <Trash2 size={16} /> Delete my account
          </button>
        )}
        {step === "confirm" && (
          <div className="rounded-2xl bg-tangerine-50 p-3">
            <p>This asks our team to delete your account, reports, evidence and messages, including our backup copies. It can't be undone. Download your data first if you want to keep it.</p>
            <div className="mt-2 flex gap-2">
              <button disabled={busy} onClick={askDelete} className="min-h-[40px] rounded-full bg-tangerine-600 px-4 font-semibold text-white">{busy ? "Sending…" : "Yes, delete everything"}</button>
              <button onClick={() => setStep("idle")} className="min-h-[40px] rounded-full bg-white px-4 font-semibold text-ink ring-1 ring-plum-100">Cancel</button>
            </div>
          </div>
        )}
        {step === "sent" && <p className="rounded-2xl bg-lagoon-50 p-3">Request sent. We'll confirm in your support chat when it's done — usually within 7 days.</p>}
        {err && <p className="text-tangerine-600">{err}</p>}
        <p className="text-xs text-plum-500">You can also ask us to correct your details, or stop using them, via support. See our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      </div>
    </details>
  );
}
