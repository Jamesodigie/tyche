import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Button, cx } from "./ui";

import { CONSENT_VERSION } from "../lib/store";
export { CONSENT_VERSION };

export type ConsentState = { adult: boolean; terms: boolean };
export const consentOk = (c: ConsentState, needAdult = true) => c.terms && (!needAdult || c.adult);

const linkCls = "font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-2";

/**
 * 18+ and Terms/Privacy consent shown on every sign-up (NDPA: no children's data without
 * parental consent; informed consent incl. transfers to providers outside Nigeria).
 */
export function ConsentChecks({ value, onChange, askAdult = true, className }: { value: ConsentState; onChange: (c: ConsentState) => void; askAdult?: boolean; className?: string }) {
  return (
    <div className={cx("space-y-2 rounded-2xl bg-cream p-3 text-sm text-ink", className)}>
      {askAdult && (
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-plum-600" checked={value.adult} onChange={(e) => onChange({ ...value, adult: e.target.checked })} aria-label="I'm 18 or older" />
          <span>I'm <b>18 or older</b>.</span>
        </label>
      )}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-plum-600" checked={value.terms} onChange={(e) => onChange({ ...value, terms: e.target.checked })} aria-label="I agree to the Terms and Privacy Policy" />
        <span>
          I agree to the <Link to="/terms" target="_blank" className={linkCls}>Terms</Link> and <Link to="/privacy" target="_blank" className={linkCls}>Privacy Policy</Link>, including my information being kept by Tyche's service providers, some of them outside Nigeria.
        </span>
      </label>
      {askAdult && !value.adult && (
        <p className="pl-7 text-xs text-plum-500">Under 18? Please ask a parent, guardian or a trusted adult to help you. If you're in danger right now, call <b>112</b>.</p>
      )}
    </div>
  );
}

/** What we save with the account so we can show when and to what someone agreed. */
export const consentRecord = (c: ConsentState) => ({ adult_confirmed: c.adult, terms_version: CONSENT_VERSION, consented_at: new Date().toISOString() });

/** One-time prompt for accounts created before consent was asked. Can't be skipped (signing out is the alternative). */
export function ConsentGate() {
  const { user, saveConsent, signOut } = useStore();
  const [c, setC] = useState<ConsentState>({ adult: false, terms: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!user?.needsConsent) return null;
  const save = async () => {
    setBusy(true);
    setErr("");
    const e = await saveConsent(consentRecord(c));
    setBusy(false);
    if (e) setErr(e);
  };
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-plum-900/40 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Please confirm">
      <div className="safe-bottom w-full max-w-md rounded-t-[1.75rem] bg-white p-5 shadow-2xl sm:rounded-4xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl font-semibold text-ink">A quick check, {user.name.split(" ")[0]}</p>
          {/* Quick exit must always be reachable, even over this prompt. */}
          <button
            onClick={() => { try { sessionStorage.clear(); } catch { /* noop */ } window.location.replace("https://www.google.com/search?q=weather+today"); }}
            className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white"
            aria-label="Quick exit — leave this site now"
          >✕ Exit</button>
        </div>
        <p className="mt-1 text-sm text-plum-600">We've updated how we look after your information. Please confirm to keep using Tyche.</p>
        <ConsentChecks className="mt-4" value={c} onChange={setC} />
        {err && <p className="mt-2 text-sm text-tangerine-600">{err}</p>}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <Button className="w-full sm:w-auto" disabled={busy || !consentOk(c)} onClick={save}>{busy ? "Saving…" : "Confirm & continue"}</Button>
          <Button className="w-full sm:w-auto" variant="ghost" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
