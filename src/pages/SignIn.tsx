import { ArrowLeft, Lock, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PathBubbles } from "../components/PathBubbles";
import { Blobs, Button, Field, Input, Notice, PasswordInput, cx } from "../components/ui";
import { NEEDS_CODE, useStore } from "../lib/store";
import { CodeStep } from "../components/CodeStep";
import { supabase } from "../lib/supabase";

export default function SignIn() {
  const [params] = useSearchParams();
  const next = params.get("next");
  const [as, setAs] = useState<"client" | "lawyer">(params.get("as") === "lawyer" ? "lawyer" : "client");
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const { signIn, resetPassword, mode: appMode } = useStore();
  const navigate = useNavigate();
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");

  /** Reset with the 6-digit code from the email (works even if the link opens in another browser). */
  const finishReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setErr("Enter the code from the email.");
    if (newPw.length < 6) return setErr("Your new password needs at least 6 characters.");
    setErr("");
    setBusy(true);
    const v = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "recovery" });
    if (v.error) {
      setBusy(false);
      return setErr(/expired|invalid/i.test(v.error.message) ? "That code is wrong or has expired. Check the latest email, or send a new code." : v.error.message);
    }
    const u = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (u.error) return setErr(/different from the old/i.test(u.error.message) ? "Please choose a password you haven't used before." : u.error.message);
    navigate(next || (as === "lawyer" ? "/lawyer/dashboard" : "/me"));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    if (mode === "forgot") {
      const error = await resetPassword(email);
      setBusy(false);
      if (error) setErr(error);
      else setSent(true);
      return;
    }
    const error = await signIn(email, pw);
    setBusy(false);
    if (error === NEEDS_CODE) return setNeedCode(true);
    if (error) return setErr(error);
    navigate(next || (as === "lawyer" ? "/lawyer/dashboard" : "/me"));
  };

  if (needCode)
    return (
      <section className="relative overflow-hidden">
        <Blobs />
        <div className="relative mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-14">
          <div className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-plum-100 sm:p-8">
            <CodeStep email={email.trim()} onBack={() => setNeedCode(false)} onVerified={() => navigate(next || (as === "lawyer" ? "/lawyer/dashboard" : "/me"))} />
          </div>
        </div>
      </section>
    );

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-5xl gap-10 px-4 lg:gap-12 sm:px-6 py-6 sm:py-10 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md">
          {mode === "signin" ? (
            <>
              <p className="font-script text-3xl text-tangerine-500">welcome back, love</p>
              <h1 className="h-page font-display font-semibold text-ink">Sign in to Tyche</h1>
              <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-plum-50 p-1">
                {([["client", "I'm here for support"], ["lawyer", "I'm a lawyer"]] as const).map(([r, l]) => (
                  <button key={r} type="button" onClick={() => setAs(r)} className={cx("rounded-full py-2.5 text-sm font-semibold transition", as === r ? "bg-white text-plum-700 shadow" : "text-plum-500")}>
                    {l}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setMode("signin"); setSent(false); setErr(""); }} className="-my-2 inline-flex items-center gap-1 py-2 text-sm font-semibold text-plum-600">
                <ArrowLeft size={16} /> Back to sign in
              </button>
              <h1 className="h-page mt-2 font-display font-semibold text-ink">Reset your password</h1>
              <p className="mt-2 text-plum-700/80">We'll email you a code to choose a new one.</p>
            </>
          )}

          {sent ? (
            <form onSubmit={finishReset} className="mt-6 space-y-4 rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100 sm:p-8">
              <div className="text-center">
                <MailCheck className="mx-auto text-lagoon-500" size={40} />
                <p className="mt-3 font-display text-xl font-semibold text-ink">Check your inbox</p>
                <p className="mt-1 text-sm text-plum-600">If there's an account for <b>{email}</b>, we've sent a code. Check spam too.</p>
              </div>
              <Field label="Code from the email">
                <Input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="code" aria-label="Reset code" className="text-center text-xl tracking-[0.4em]" />
              </Field>
              <Field label="New password" hint="At least 6 characters">
                <PasswordInput required minLength={6} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
              </Field>
              {err && <Notice>{err}</Notice>}
              <Button className="w-full" size="lg" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
              <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setErr(""); }} className="block w-full py-2 text-center text-sm font-medium text-plum-600 hover:underline">
                Didn't get it? Send a new code
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4 rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100 sm:p-8">
              <Field label="Email">
                <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </Field>
              {mode === "signin" && (
                <>
                  <Field label="Password">
                    <PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                  </Field>
                  {appMode === "live" && (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => { setMode("forgot"); setErr(""); }} className="inline-block py-2 text-sm font-medium text-plum-600 hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  )}
                </>
              )}
              {err && <Notice>{err}</Notice>}
              <Button className="w-full" size="lg" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Send reset code"}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-plum-400"><Lock size={12} /> Your session is private and encrypted.</p>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-plum-600">
            {as === "lawyer" ? (
              <>New to Tyche? <Link to="/join/lawyer" className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Create a lawyer account</Link></>
            ) : (
              <>No account yet? <span className="hidden sm:inline">Pick a path — you'll create one as you go.</span><span className="sm:hidden"><Link to="/hire" className="inline-block py-2.5 font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Hire a lawyer</Link> · <Link to="/report" className="inline-block py-2.5 font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Report</Link> · <Link to="/community" className="inline-block py-2.5 font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Community</Link></span></>
            )}
          </p>
        </div>
        <div className="hidden rounded-[2rem] bg-white/70 p-4 ring-1 ring-plum-100 sm:block sm:rounded-5xl sm:p-8">
          <p className="font-script text-2xl text-tangerine-500">new here?</p>
          <h2 className="mb-6 font-display text-2xl font-semibold text-ink">Start with what you need</h2>
          <PathBubbles compact single />
        </div>
      </div>
    </section>
  );
}

/** Where the "reset password" email link lands. */
export function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(/session/i.test(error.message) ? "This reset link has expired. Please request a new one." : error.message);
    navigate("/me");
  };
  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="h-page font-display font-semibold text-ink">Choose a new password</h1>
        <form onSubmit={save} className="mt-6 space-y-4 rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100 sm:p-8">
          <Field label="New password" hint="At least 6 characters">
            <PasswordInput required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </Field>
          {err && <Notice>{err}</Notice>}
          <Button className="w-full" size="lg" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
        </form>
      </div>
    </section>
  );
}
