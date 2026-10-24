import { ArrowLeft, Lock, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PathBubbles } from "../components/PathBubbles";
import { Blobs, Button, Field, Input, Notice, PasswordInput, cx } from "../components/ui";
import { useStore } from "../lib/store";
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
    if (error) return setErr(error);
    navigate(next || (as === "lawyer" ? "/lawyer/dashboard" : "/me"));
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-6xl 2xl:max-w-7xl gap-10 px-4 lg:gap-12 sm:px-6 py-8 sm:py-14 lg:grid-cols-2">
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
              <p className="mt-2 text-plum-700/80">We'll email you a link to choose a new one.</p>
            </>
          )}

          {sent ? (
            <div className="mt-6 rounded-4xl bg-white p-6 text-center shadow-soft ring-1 ring-plum-100 sm:p-8">
              <MailCheck className="mx-auto text-lagoon-500" size={40} />
              <p className="mt-3 font-display text-xl font-semibold text-ink">Check your inbox</p>
              <p className="mt-1 text-sm text-plum-600">If there's an account for <b>{email}</b>, a reset link is on its way.</p>
            </div>
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
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Send reset link"}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-plum-400"><Lock size={12} /> Your session is private and encrypted.</p>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-plum-600">
            {as === "lawyer" ? (
              <>New to Tyche? <Link to="/join/lawyer" className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Create a lawyer account</Link></>
            ) : (
              <>No account yet? Pick a path — you'll create one as you go.</>
            )}
          </p>
        </div>
        <div className="rounded-[2rem] bg-white/70 p-4 ring-1 ring-plum-100 sm:rounded-5xl sm:p-8">
          <p className="font-script text-2xl text-tangerine-500">new here?</p>
          <h2 className="mb-6 font-display text-2xl font-semibold text-ink">Start with what you need</h2>
          <PathBubbles compact />
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
