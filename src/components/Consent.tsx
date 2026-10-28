import { Link } from "react-router-dom";
import { cx } from "./ui";

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
