import { LogOut, Menu, MessageCircleHeart, X, ShieldAlert, LayoutDashboard, MessageCircle, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { Avatar, Button, cx } from "./ui";
import { PathBubbles } from "./PathBubbles";
import { BottomTabs, InstallButton, InstallSheet } from "./AppChrome";
import { SupportWidget, openSupport, whatsappLink } from "./Support";
import { ActivityAlerts } from "./Alerts";
import { INSTAGRAM_HANDLE, SUPPORT_WHATSAPP_DISPLAY } from "../lib/data";

/** Leaves Tyche instantly and removes it from the back button. */
export function quickExit() {
  try { sessionStorage.clear(); } catch { /* noop */ }
  window.location.replace("https://www.google.com/search?q=weather+today");
}

function QuickExit({ floatingOnPhones = false }: { floatingOnPhones?: boolean }) {
  useEffect(() => {
    let presses = 0, t: number | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      presses++;
      clearTimeout(t);
      t = window.setTimeout(() => (presses = 0), 900);
      if (presses >= 3) quickExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <button
      onClick={quickExit}
      title="Leave this site fast (or press Esc 3 times)"
      className={cx(
        "fixed bottom-5 right-5 z-50 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105",
        floatingOnPhones ? "inline-flex" : "hidden lg:inline-flex",
      )}
    >
      <X size={16} strokeWidth={3} /> Quick exit
    </button>
  );
}

const nav = [
  { to: "/hire", label: "Find a lawyer" },
  { to: "/report", label: "Report" },
  { to: "/community", label: "Community" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/for-lawyers", label: "For lawyers" },
];

function Header() {
  const { user, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);
  const dash = user?.role === "lawyer" ? "/lawyer/dashboard" : "/me";

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-plum-100/60 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <Link to="/" className="flex min-h-[44px] items-center" aria-label="Tyche home">
          <img src="/tyche-logo.png" alt="Tyche" className="h-8 w-auto sm:h-10" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cx("rounded-full px-4 py-2 text-[15px] font-medium transition", isActive ? "bg-plum-100 text-plum-700" : "text-ink/80 hover:text-plum-600")
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/messages" className="rounded-full p-2.5 text-plum-600 hover:bg-plum-50" title="Messages">
                <MessageCircleHeart size={22} />
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="rounded-full px-3 py-2 text-sm font-semibold text-plum-600 hover:bg-plum-50">Admin</Link>
              )}
              <Link to={dash} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 shadow-sm ring-1 ring-plum-100 hover:ring-plum-300">
                <Avatar name={user.name} size={34} hue={user.role === "lawyer" ? 185 : 285} className="ring-0" />
                <span className="text-sm font-semibold text-ink">{user.name.replace(/^(barr|dr|mrs?|ms)\.?\s+/i, "").split(" ")[0]}</span>
              </Link>
              <button onClick={async () => { await signOut(); navigate("/"); }} className="grid h-10 w-10 place-items-center rounded-full text-plum-500 hover:bg-plum-50" title="Sign out" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/signin">Sign in</Button>
              <Button size="sm" to="/report">Get support</Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 lg:hidden">
          <button
            onClick={quickExit}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white active:scale-95"
            aria-label="Quick exit — leave this site now"
          >
            <X size={15} strokeWidth={3} /> Exit
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full text-plum-700 hover:bg-plum-50" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-plum-100 bg-cream px-4 pb-6 pt-3 sm:px-6 lg:hidden">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className="block rounded-2xl px-4 py-3 font-medium text-ink hover:bg-plum-50">
              {n.label}
            </NavLink>
          ))}
          <div className="mt-3 grid gap-2">
            {user ? (
              <>
                <Button variant="soft" to={dash}><LayoutDashboard size={18} /> My dashboard</Button>
                <Button variant="soft" to="/messages"><MessageCircleHeart size={18} /> Messages</Button>
                {user.role === "admin" && <Button variant="soft" to="/admin">Admin dashboard</Button>}
                <Button variant="ghost" onClick={async () => { await signOut(); navigate("/"); }}><LogOut size={18} /> Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="outline" to="/signin">Sign in</Button>
                <Button to="/report">Get support</Button>
              </>
            )}
            <InstallButton className="justify-center rounded-full py-3 text-sm font-semibold text-plum-600" label="Install the Tyche app" />
          </div>
        </div>
      )}
    </header>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function Footer({ compactOnPhones }: { compactOnPhones?: boolean }) {
  return (
    <footer className={cx(compactOnPhones && "hidden lg:block", "section bg-plum-900 pb-[calc(5rem+env(safe-area-inset-bottom))] text-plum-100 lg:pb-0")}>
      {/* phones: short footer */}
      <div className="space-y-4 px-4 py-6 md:hidden">
        <p className="flex items-center gap-2 text-xs text-plum-100">
          <ShieldAlert size={15} className="shrink-0 text-tangerine-400" />
          <span>In danger right now? Call <b className="text-white">112</b> — free emergency line.</span>
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold text-white">
            <InstagramIcon size={14} /> @{INSTAGRAM_HANDLE}
          </a>
          <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#25D366] px-3 font-semibold text-white">
            <MessageCircle size={14} /> {SUPPORT_WHATSAPP_DISPLAY}
          </a>
          <button onClick={() => openSupport("faq")} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold text-white">
            <HelpCircle size={14} /> Help
          </button>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-plum-200">
          {[["/how-it-works", "How it works"], ["/community", "Community"], ["/for-lawyers", "For lawyers"], ["/safety", "Safety"], ["/about", "About"], ["/signin", "Sign in"]].map(([to, label]) => (
            <Link key={to} to={to} className="inline-block py-1.5 hover:text-white">{label}</Link>
          ))}
          <InstallButton className="inline-block py-1.5 font-semibold text-white" label="Get the app" />
        </nav>
        <p className="text-[11px] leading-relaxed text-plum-300">
          © {new Date().getFullYear()} Tyche · Lawyers are independent, verified by our team · <Link to="/admin" className="text-plum-400">Team</Link>
        </p>
      </div>
      <div className="mx-auto hidden max-w-5xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <div className="inline-block rounded-2xl bg-white px-3 py-2"><img src="/tyche-logo.png" alt="Tyche" className="h-8" /></div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-plum-200">
            Your safety matters. Your voice matters. Justice matters. Built in Nigeria, for us.
          </p>
          <InstallButton className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" label="Install the app" />
          <p className="mt-6 flex items-start gap-2 rounded-2xl bg-white/5 p-4 text-sm text-plum-100">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-tangerine-400" />
            <span>In danger right now? Call <b className="text-white">112</b> — Nigeria's free emergency line.</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20">
              <InstagramIcon size={16} /> @{INSTAGRAM_HANDLE}
            </a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white">
              <MessageCircle size={16} /> {SUPPORT_WHATSAPP_DISPLAY}
            </a>
            <button onClick={() => openSupport("faq")} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20">
              <HelpCircle size={16} /> Help & FAQ
            </button>
          </div>
        </div>
        {[
          { h: "Get help", l: [["/report", "Report harassment"], ["/hire", "Hire a lawyer"], ["/community", "Join the community"], ["/me", "My space"]] },
          { h: "Lawyers", l: [["/for-lawyers", "Why Tyche"], ["/join/lawyer", "Create a lawyer account"], ["/lawyer/dashboard", "Case board"]] },
          { h: "Tyche", l: [["/how-it-works", "How it works"], ["/safety", "Safety & privacy"], ["/about", "About us"], ["/signin", "Sign in"]] },
        ].map((c) => (
          <div key={c.h}>
            <p className="font-display text-lg text-white">{c.h}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.l.map(([to, label]) => (
                <li key={to}><Link to={to} className="inline-block py-1 text-plum-200 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hidden border-t border-white/10 px-4 py-6 text-center text-xs leading-relaxed text-plum-300 md:block">
        © {new Date().getFullYear()} Tyche. Lawyers on Tyche are independent practitioners verified by our team. · <Link to="/admin" className="text-plum-400 hover:text-white">Team</Link>
      </div>
    </footer>
  );
}

/** "What brings you here?" — shown once when Tyche first loads. */
function WelcomeBubbles() {
  const loc = useLocation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (loc.pathname !== "/") return;
    let seen = false;
    try { seen = !!sessionStorage.getItem("tyche:welcomed"); } catch { /* noop */ }
    if (!seen) {
      const t = setTimeout(() => setShow(true), 450);
      return () => clearTimeout(t);
    }
  }, [loc.pathname]);
  const close = () => {
    try { sessionStorage.setItem("tyche:welcomed", "1"); } catch { /* noop */ }
    setShow(false);
  };
  useEffect(() => { if (loc.pathname !== "/") setShow(false); }, [loc.pathname]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-plum-900/40 backdrop-blur-sm animate-rise sm:items-center sm:p-4" onClick={close}>
      <div className="safe-bottom relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-cream px-4 pb-6 pt-5 shadow-2xl sm:rounded-5xl sm:p-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-5 top-5 rounded-full p-2 text-plum-500 hover:bg-plum-50" aria-label="Close"><X /></button>
        <img src="/tyche-mark.png" alt="" className="mx-auto h-11 sm:h-14" />
        <p className="mt-2 text-center font-script text-2xl text-tangerine-500 sm:mt-3 sm:text-3xl">Hi love, welcome</p>
        <h2 className="text-center font-display text-[1.6rem] font-semibold leading-tight text-ink sm:text-4xl">What brings you to Tyche today?</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-plum-600">Pick one — you can always come back for the others.</p>
        <div className="mt-5 sm:mt-8"><PathBubbles onPick={close} compact /></div>
        <p className="mt-6 text-center text-sm text-plum-500">
          Already have an account? <Link to="/signin" onClick={close} className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  // Block body on purpose: newer Chrome makes scrollTo() return a Promise, and React would
  // try to call that Promise as the effect's cleanup ("n is not a function").
  useEffect(() => {
    try { window.scrollTo(0, 0); } catch { /* noop */ }
  }, [pathname]);
  const bare = pathname.startsWith("/session/");
  const { user, mode } = useStore();
  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      {!bare && <Header />}
      {mode === "preview" && !bare && (
        <div className="bg-ink px-4 py-2 text-center text-xs text-plum-100">
          Preview mode — sample data only, nothing is saved to a server. Add the Supabase keys in Vercel to go live.
        </div>
      )}
      {user?.suspended && (
        <div className="bg-tangerine-100 px-4 py-3 text-center text-sm text-ink">
          Your account is paused while our team reviews it. You can still read your saved reports. Questions? Reach the Tyche team.
        </div>
      )}
      <main><Outlet /></main>
      {!bare && <Footer compactOnPhones={["/me", "/lawyer/dashboard", "/messages", "/hire", "/signin", "/report", "/join", "/book", "/community/join", "/reset-password"].some((r) => pathname === r || pathname.startsWith(r + "/"))} />}
      <QuickExit floatingOnPhones={bare} />
      <WelcomeBubbles />
      {!bare && <BottomTabs />}
      <InstallSheet />
      <SupportWidget />
      <ActivityAlerts />
    </div>
  );
}
