import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { NEEDS_CODE, useStore } from "../lib/store";
import { CodeStep } from "./CodeStep";
import { ConsentChecks, consentOk, consentRecord } from "./Consent";
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
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [f, setF] = useState({ name: defaultName, email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [consent, setConsent] = useState({ adult: false, terms: false });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    if (mode === "existing") {
      const error = await signIn(f.email, f.password);
      setBusy(false);
      if (error === NEEDS_CODE) return setConfirm(true);
      return error ? setErr(error) : onDone();
    }
    if (!consentOk(consent)) {
      setBusy(false);
      return setErr(consent.adult ? "Please agree to the Terms and Privacy Policy to continue." : "Please confirm you're 18 or older to create an account.");
    }
    const out = await signUp({ name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone || undefined, role: "client", consent: consentRecord(consent) });
    setBusy(false);
    if (out.error) return setErr(out.error);
    if (out.needsConfirm) return setConfirm(true);
    onDone();
  };

  if (confirm) return <CodeStep email={f.email.trim()} onVerified={onDone} onBack={() => setConfirm(false)} />;

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "new" && (
        <Field label={nameLabel} hint={nameHint}>
          <Input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={namePlaceholder} autoComplete="nickname" />
        </Field>
      )}
      <Field label="Email" hint={mode === "new" ? "So you can get back in. Never shown to lawyers or the public." : undefined}>
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
      {mode === "new" && <ConsentChecks value={consent} onChange={setConsent} />}
      {err && <Notice>{err}</Notice>}
      <Button className="w-full" size="lg" disabled={busy || (mode === "new" && !consentOk(consent))}>
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
