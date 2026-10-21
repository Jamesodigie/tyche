import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PathBubbles } from "../components/PathBubbles";
import { Blobs, Button, Field, Input, cx } from "../components/ui";
import { LAWYERS } from "../lib/data";
import { useStore, type Role } from "../lib/store";

export default function SignIn() {
  const [params] = useSearchParams();
  const next = params.get("next");
  const [role, setRole] = useState<Role>((params.get("as") as Role) || "client");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const { signIn, myLawyers } = useStore();
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "lawyer") {
      const mine = myLawyers.find((l) => l.id && email.toLowerCase().includes(l.name.split(" ")[0].toLowerCase())) || myLawyers[0];
      const l = mine || LAWYERS[0];
      signIn({ name: l.name, email, role: "lawyer", lawyerId: l.id });
      navigate(next || "/lawyer/dashboard");
    } else {
      const name = email.split("@")[0].replace(/[._\d]+/g, " ").trim() || "Friend";
      signIn({ name: name.charAt(0).toUpperCase() + name.slice(1), email, role: "client" });
      navigate(next || "/me");
    }
  };

  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto grid max-w-6xl 2xl:max-w-7xl gap-10 px-4 lg:gap-12 sm:px-6 py-8 sm:py-14 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md">
          <p className="font-script text-3xl text-tangerine-500">welcome back, love</p>
          <h1 className="h-page font-display font-semibold text-ink">Sign in to Tyche</h1>
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-plum-50 p-1">
            {([["client", "I'm here for support"], ["lawyer", "I'm a lawyer"]] as const).map(([r, l]) => (
              <button key={r} onClick={() => setRole(r)} className={cx("rounded-full py-2.5 text-sm font-semibold transition", role === r ? "bg-white text-plum-700 shadow" : "text-plum-500")}>
                {l}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-4xl bg-white p-6 shadow-soft ring-1 ring-plum-100 sm:p-8">
            <Field label="Email or phone">
              <Input required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input required type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="pr-12" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-plum-400 hover:bg-plum-50" aria-label="Show password">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end"><a href="#" className="inline-block py-2 text-sm font-medium text-plum-600 hover:underline">Forgot password?</a></div>
            <Button className="w-full" size="lg">Sign in</Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-plum-400"><Lock size={12} /> Your session is private and encrypted.</p>
          </form>
          <p className="mt-6 text-center text-sm text-plum-600">
            {role === "lawyer" ? (
              <>New to Tyche? <Link to="/join/lawyer" className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Create a lawyer account</Link></>
            ) : (
              <>No account yet? Pick a path on the right — you'll create one as you go.</>
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
