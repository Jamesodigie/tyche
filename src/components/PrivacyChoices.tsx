import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Link } from "react-router-dom";

/**
 * Optional analytics only run after the visitor says yes (NDPA: consent for non-essential tracking).
 * The choice lives on this device only. Essential storage (sign-in, quick exit) needs no consent.
 */
const KEY = "tyche:analytics";
type Choice = "yes" | "no" | null;
const EVT = "tyche:privacy-choices";

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}
function write(v: Exclude<Choice, null>) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode: choice lasts this visit */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
}

/** Opens the choices card again (e.g. from the footer or Privacy Policy). */
export const openPrivacyChoices = () => window.dispatchEvent(new CustomEvent(EVT, { detail: "open" }));

export function PrivacyChoices() {
  const [choice, setChoice] = useState<Choice>(read);
  const [open, setOpen] = useState(() => read() === null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d === "open") setOpen(true);
      else { setChoice(d); setOpen(false); }
    };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <>
      {choice === "yes" && <Analytics />}
      {open && (
        <div
          role="dialog"
          aria-label="Privacy choices"
          className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-3xl bg-white p-4 text-sm text-ink shadow-2xl ring-1 ring-plum-100 lg:inset-x-auto lg:bottom-5 lg:left-5"
        >
          <p className="font-semibold">Can we count visits?</p>
          <p className="mt-1 text-plum-600">
            We'd like to use simple, anonymous visit counts (no recordings of your screen, no ads) to improve Tyche. It's off unless you say yes.{" "}
            <Link to="/privacy" className="font-semibold text-plum-700 underline">Privacy Policy</Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => write("no")} className="min-h-[40px] flex-1 rounded-full bg-cream px-4 font-semibold text-ink">No thanks</button>
            <button onClick={() => write("yes")} className="min-h-[40px] flex-1 rounded-full bg-plum-700 px-4 font-semibold text-white">Allow</button>
          </div>
          {choice && <p className="mt-2 text-xs text-plum-400">Right now: {choice === "yes" ? "allowed" : "off"}. You can change this any time.</p>}
        </div>
      )}
    </>
  );
}
