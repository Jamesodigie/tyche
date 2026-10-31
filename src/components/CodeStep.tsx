import { ArrowLeft, MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { Button, Notice } from "./ui";

/**
 * "Enter the 6-digit code we emailed you." Shown after sign-up (and when someone signs in
 * before verifying). Calls onVerified() once the code is accepted and the person is signed in.
 */
export function CodeStep({ email, onVerified, onBack, sentAlready = true }: { email: string; onVerified: () => void; onBack?: () => void; sentAlready?: boolean }) {
  const { verifyEmailCode, resendEmailCode, mode } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [wait, setWait] = useState(sentAlready ? 60 : 0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (value = code) => {
    const c = value.replace(/\D/g, "");
    if (c.length < 6) return setErr("Enter the code from the email.");
    setErr("");
    setBusy(true);
    const error = await verifyEmailCode(email, c);
    setBusy(false);
    if (error) return setErr(error);
    onVerified();
  };

  const resend = async () => {
    setErr("");
    setInfo("");
    const error = await resendEmailCode(email);
    if (error) return setErr(error);
    setInfo("New code sent. Check your inbox (and spam).");
    setWait(60);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lagoon-100 text-lagoon-600"><MailCheck size={26} /></div>
      <div>
        <p className="font-display text-xl font-semibold text-ink">Check your email</p>
        <p className="mt-1 text-sm text-plum-600">
          We sent a code to <b className="break-all text-ink">{email}</b>. Enter it below to verify your account.
        </p>
      </div>
      <input
        ref={input}
        value={code}
        onChange={(e) => {
          // Supabase codes are 6 digits by default but can be set to 8 — accept both.
          const v = e.target.value.replace(/\D/g, "").slice(0, 8);
          const pasted = v.length - code.length > 1;
          setCode(v);
          if (v.length === 8 || (pasted && v.length >= 6)) submit(v);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        placeholder="code"
        aria-label="6-digit code" maxLength={8}
        className="mx-auto block w-full max-w-[18rem] rounded-2xl border-2 border-plum-200 bg-white py-3 text-center font-mono text-2xl tracking-[0.3em] sm:text-3xl text-ink outline-none focus:border-plum-500"
      />
      {mode === "preview" && <p className="text-xs text-plum-400">Preview mode: the code is 123456.</p>}
      {err && <Notice>{err}</Notice>}
      {info && <Notice tone="success">{info}</Notice>}
      <Button type="submit" className="w-full" size="lg" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Verify & continue"}</Button>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        {wait > 0 ? (
          <span className="py-2 text-plum-400">Send a new code in {wait}s</span>
        ) : (
          <button type="button" onClick={resend} className="py-2 font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Send a new code</button>
        )}
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 py-2 text-plum-500"><ArrowLeft size={14} /> Change email</button>
        )}
      </div>
      <p className="text-xs text-plum-400">
        Can't find it? Check spam or promotions. Codes expire after 1 hour. Already verified this email before? Go back and choose <b>Sign in</b> instead.
      </p>
    </form>
  );
}
