import { Copy, Download, FileText, HelpCircle, KeyRound, LogOut, Mail, MessageCircle, Share2, ShieldCheck, Trash2, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationsCard } from "../components/Alerts";
import { PhotoPicker } from "../components/PhotoPicker";
import { openPrivacyChoices } from "../components/PrivacyChoices";
import { openSupport, whatsappLink } from "../components/Support";
import { downloadMyData } from "../components/YourData";
import { Blobs, Button, Card, Field, Input, Notice, PasswordInput, cx } from "../components/ui";
import { SUPPORT_WHATSAPP_DISPLAY } from "../lib/data";
import { EMAIL_NEEDS_OTHER, useStore } from "../lib/store";

const SITE = "https://gettyche.com.ng";

function Section({ icon, title, sub, children, id }: { icon: ReactNode; title: string; sub?: string; children: ReactNode; id?: string }) {
  return (
    <Card className="p-4 sm:p-6" id={id}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-plum-50 text-plum-600">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
          {sub && <p className="text-sm text-plum-500">{sub}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function ProfileSection() {
  const { user, uploadPhoto, updateProfile } = useStore();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!user) return null;
  const isLawyer = user.role === "lawyer";
  return (
    <Section icon={<UserRound size={20} />} title="Your profile" sub={isLawyer ? "Clients see your photo and name. A photo is required for lawyers." : "Only Tyche and the lawyers you book see this."}>
      <PhotoPicker
        name={user.name}
        currentUrl={user.avatarUrl}
        required={isLawyer}
        hint={photoBusy ? "Uploading…" : "Tap to choose a photo. We shrink it so it uploads fast."}
        onPick={async (f) => {
          setPhotoBusy(true);
          setMsg(null);
          const e = await uploadPhoto(f);
          setPhotoBusy(false);
          setMsg(e ? { ok: false, text: e } : { ok: true, text: "Photo updated." });
        }}
      />
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          const err = await updateProfile({ name, phone });
          setBusy(false);
          setMsg(err ? { ok: false, text: err } : { ok: true, text: "Saved." });
        }}
      >
        <Field label={isLawyer ? "Your name" : "Name or nickname"}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Phone" optional>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="0803 000 0000" />
        </Field>
        <div className="sm:col-span-2">
          {msg && <div className="mb-3"><Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice></div>}
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
          {isLawyer && <Link to="/lawyer/dashboard" className="ml-3 inline-block py-2 text-sm font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Fees, availability & bank → dashboard</Link>}
        </div>
      </form>
    </Section>
  );
}

function EmailSection() {
  const { user, changeEmail, confirmEmailChange } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [half, setHalf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!user) return null;
  return (
    <Section icon={<Mail size={20} />} title="Email" sub={`You sign in with ${user.email}`}>
      {!sentTo ? (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMsg(null);
            const err = await changeEmail(email, pw);
            setBusy(false);
            if (err) return setMsg({ ok: false, text: err });
            setSentTo(email.trim().toLowerCase());
          }}
        >
          <Field label="New email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
          <Field label="Your password"><PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>
          <Button type="submit" variant="soft" disabled={busy}>{busy ? "Sending…" : "Send code"}</Button>
        </form>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMsg(null);
            const err = await confirmEmailChange(sentTo, code);
            setBusy(false);
            if (err === EMAIL_NEEDS_OTHER) {
              setHalf(true);
              setCode("");
              return setMsg({ ok: true, text: "First code accepted. Now enter the code from your other inbox." });
            }
            if (err) return setMsg({ ok: false, text: err });
            setHalf(false);
            setMsg({ ok: true, text: `Done — you now sign in with ${sentTo}.` });
            setSentTo("");
            setEmail("");
            setPw("");
            setCode("");
          }}
        >
          <p className="text-sm text-plum-600">
            {half
              ? <>Almost done. Enter the code we sent to your <b>other</b> inbox ({user.email} or {sentTo}).</>
              : <>We sent a code to <b className="break-all text-ink">{sentTo}</b>. Enter it below. If a code also arrives at <b className="break-all text-ink">{user.email}</b>, you'll enter that one next.</>}
          </p>
          <Field label="Code from the email">
            <Input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Email change code" className="text-center text-xl tracking-[0.3em]" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Confirm new email"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setSentTo(""); setCode(""); setHalf(false); setMsg(null); }}>Cancel</Button>
          </div>
        </form>
      )}
      {msg && <div className="mt-3"><Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice></div>}
    </Section>
  );
}

function PasswordSection() {
  const { changePassword } = useStore();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Section icon={<KeyRound size={20} />} title="Password">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          const err = await changePassword(cur, next);
          setBusy(false);
          if (err) return setMsg({ ok: false, text: err });
          setCur("");
          setNext("");
          setMsg({ ok: true, text: "Password changed." });
        }}
      >
        <Field label="Current password"><PasswordInput required value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></Field>
        <Field label="New password" hint="At least 6 characters"><PasswordInput required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></Field>
        <div className="sm:col-span-2">
          {msg && <div className="mb-3"><Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice></div>}
          <Button type="submit" variant="soft" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
          <Link to="/signin" className="ml-3 inline-block py-2 text-sm text-plum-600 hover:underline">Forgot it?</Link>
        </div>
      </form>
    </Section>
  );
}

function InviteSection() {
  const { user, referralCount, mode } = useStore();
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (mode === "live") referralCount().then(setCount).catch(() => {});
  }, [mode, referralCount]);
  if (!user) return null;
  const link = `${SITE}/?ref=${user.id}`;
  const text = user.role === "lawyer"
    ? `I'm on Tyche — verified lawyers helping people facing harassment in Nigeria. Join here: ${link}`
    : `Tyche helps you keep evidence safe, talk to a verified lawyer and find support — privately. ${link}`;
  return (
    <Section icon={<UsersRound size={20} />} title="Invite someone" sub="Know someone who needs support, or a lawyer who'd like to help? Share your link.">
      <div className="flex items-center gap-2 rounded-2xl bg-cream p-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm text-plum-700">{link}</span>
        <button
          type="button"
          onClick={async () => {
            try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* old browsers */ }
          }}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-plum-700 ring-1 ring-plum-100"
        >
          <Copy size={15} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white">
          <MessageCircle size={16} /> Share on WhatsApp
        </a>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" onClick={() => navigator.share({ title: "Tyche", text, url: link }).catch(() => {})} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-plum-50 px-4 text-sm font-semibold text-plum-700">
            <Share2 size={16} /> More ways to share
          </button>
        )}
      </div>
      {count !== null && <p className="mt-3 text-sm text-plum-500">{count === 0 ? "No one has joined with your link yet." : `${count} ${count === 1 ? "person has" : "people have"} joined with your link. Thank you!`}</p>}
    </Section>
  );
}

function DeleteSection() {
  const { deleteAccount, mode } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <Section icon={<Trash2 size={20} />} title="Delete my account" sub="Permanently removes your account, reports, evidence, messages and photo.">
      {!open ? (
        <Button variant="outline" onClick={() => setOpen(true)}>Delete my account</Button>
      ) : (
        <form
          className="space-y-3 rounded-3xl bg-tangerine-50 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr("");
            const er = await deleteAccount(pw);
            setBusy(false);
            if (er) return setErr(er);
            navigate("/?deleted=1");
          }}
        >
          <p className="text-sm text-ink">This can't be undone. If you might need your report later, <b>download your data first</b> (below). Payment records are kept as the law requires, without your name.</p>
          <Field label="Your password"><PasswordInput required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>
          <Field label='Type DELETE to confirm'><Input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" /></Field>
          {err && <Notice>{err}</Notice>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy || typed.trim().toUpperCase() !== "DELETE" || (!pw && mode === "live")} className="min-h-[44px] rounded-full bg-tangerine-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "Deleting…" : "Delete everything"}
            </button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPw(""); setTyped(""); setErr(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </Section>
  );
}

export default function Settings() {
  const store = useStore();
  const { user, ready, signOut } = store;
  const navigate = useNavigate();
  if (!user && !ready) return <div className="grid min-h-[50vh] place-items-center text-plum-400">Loading…</div>;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-2 text-plum-600">Sign in to change your settings.</p>
        <Button className="mt-6" to="/signin?next=/settings">Sign in</Button>
      </div>
    );
  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <p className="font-script text-2xl text-tangerine-500">your space, your rules</p>
          <h1 className="h-page font-display font-semibold text-ink">Settings</h1>
        </div>

        <ProfileSection />
        <EmailSection />
        <PasswordSection />

        <Section icon={<ShieldCheck size={20} />} title="Notifications & privacy">
          <NotificationsCard compact />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => downloadMyData(store)} className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-cream px-4 text-left text-sm font-semibold text-ink">
              <Download size={16} className="text-plum-600" /> Download my data
            </button>
            <button type="button" onClick={openPrivacyChoices} className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-cream px-4 text-left text-sm font-semibold text-ink">
              <ShieldCheck size={16} className="text-plum-600" /> Privacy choices (visit counts)
            </button>
            <Link to="/privacy" className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-cream px-4 text-sm font-semibold text-ink">
              <FileText size={16} className="text-plum-600" /> Privacy Policy
            </Link>
            <Link to="/terms" className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-cream px-4 text-sm font-semibold text-ink">
              <FileText size={16} className="text-plum-600" /> Terms of Use
            </Link>
          </div>
        </Section>

        <InviteSection />

        <Section icon={<HelpCircle size={20} />} title="Help & support" sub="We're here — chat with us, read the FAQ, or WhatsApp the team.">
          <div className="grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => openSupport()} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-plum-700 px-4 text-sm font-semibold text-white">
              <MessageCircle size={16} /> Message support
            </button>
            <button type="button" onClick={() => openSupport("faq")} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-cream px-4 text-sm font-semibold text-ink">
              <HelpCircle size={16} /> FAQ
            </button>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className={cx("flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 text-sm font-semibold text-white")}>
              <MessageCircle size={16} /> {SUPPORT_WHATSAPP_DISPLAY}
            </a>
          </div>
        </Section>

        <DeleteSection />

        <button
          type="button"
          onClick={async () => { await signOut(); navigate("/"); }}
          className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-plum-700 ring-1 ring-plum-100"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </section>
  );
}
