import { ArrowRight, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";
import { Button, Field, Input, Notice, PasswordInput } from "./ui";

/**
 * "Create your private space" — used wherever someone needs an account to continue.
 * Calls onDone() once they're signed in.
 */
export function AccountForm({
  cta,
  onDone,
  nameLabel = "What should we call you?",
  nameHint = "Lawyers see this name. A nickname is totally fine.",
  namePlaceholder = "e.g. Tomi",
  defaultName = "",
  askPhone = false,
}: {
  cta: string;
  onDone: () => void;
  nameLabel?: string;
  nameHint?: string;
  namePlaceholder?: string;
  defaultName?: string;
  askPhone?: boolean;
}) {
  const { signUp, signIn } = useStore();
  const loc = useLocation();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [f, setF] = useState({ name: defaultName, email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    if (mode === "existing") {
      const error = await signIn(f.email, f.password);
      setBusy(false);
      return error ? setErr(error) : onDone();
    }
    const out = await signUp({ name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone || undefined, role: "client" });
    setBusy(false);
    if (out.error) return setErr(out.error);
    if (out.needsConfirm) return setConfirm(true);
    onDone();
  };

  if (confirm)
    return (
      <div className="rounded-3xl bg-lagoon-50 p-5 text-center">
        <MailCheck className="mx-auto text-lagoon-600" size={36} />
        <p className="mt-2 font-display text-lg font-semibold text-ink">Confirm your email</p>
        <p className="mt-1 text-sm text-plum-700">
          We sent a link to <b>{f.email}</b>. Tap it, then{" "}
          <Link to={`/signin?next=${encodeURIComponent(loc.pathname + loc.search)}`} className="font-semibold underline">sign in</Link> to carry on.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "new" && (
        <Field label={nameLabel} hint={nameHint}>
          <Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={namePlaceholder} autoComplete="nickname" />
        </Field>
      )}
      <Field label="Email" hint={mode === "new" ? "So you can get back in. Never shown to anyone." : undefined}>
        <Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
      </Field>
      {askPhone && mode === "new" && (
        <Field label="Phone" optional>
          <Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0803 000 0000" autoComplete="tel" />
        </Field>
      )}
      <Field label="Password" hint={mode === "new" ? "At least 6 characters" : undefined}>
        <PasswordInput required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === "new" ? "new-password" : "current-password"} />
      </Field>
      {err && <Notice>{err}</Notice>}
      <Button className="w-full" size="lg" disabled={busy}>
        {busy ? "Please wait…" : <>{mode === "new" ? cta : "Sign in & continue"} <ArrowRight size={18} /></>}
      </Button>
      <p className="text-center text-sm text-plum-600">
        {mode === "new" ? "Already have an account? " : "New to Tyche? "}
        <button type="button" onClick={() => { setMode(mode === "new" ? "existing" : "new"); setErr(""); }} className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">
          {mode === "new" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </form>
  );
}
