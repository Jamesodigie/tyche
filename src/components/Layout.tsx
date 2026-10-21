import { LogOut, Menu, MessageCircleHeart, X, ShieldAlert, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { Avatar, Button, cx } from "./ui";
import { PathBubbles } from "./PathBubbles";

/** Leaves Tyche instantly and removes it from the back button. */
export function quickExit() {
  try { sessionStorage.clear(); } catch { /* noop */ }
  window.location.replace("https://www.google.com/search?q=weather+today");
}

function QuickExit() {
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
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105"
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
  useEffect(() => setOpen(false), [loc.pathname]);
  const dash = user?.role === "lawyer" ? "/lawyer/dashboard" : "/me";

  return (
    <header className="sticky top-0 z-40 border-b border-plum-100/60 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center" aria-label="Tyche home">
          <img src="/tyche-logo.png" alt="Tyche" className="h-10 w-auto" />
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
              <Link to={dash} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-4 shadow-sm ring-1 ring-plum-100 hover:ring-plum-300">
                <Avatar name={user.name} size={34} hue={user.role === "lawyer" ? 185 : 285} className="ring-0" />
                <span className="text-sm font-semibold text-ink">{user.name.split(" ")[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/signin">Sign in</Button>
              <Button size="sm" to="/report">Get support</Button>
            </>
          )}
        </div>
        <button className="rounded-full p-2 text-plum-700 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-plum-100 bg-cream px-5 pb-6 pt-3 lg:hidden">
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
                <Button variant="ghost" onClick={() => { signOut(); navigate("/"); }}><LogOut size={18} /> Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="outline" to="/signin">Sign in</Button>
                <Button to="/report">Get support</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-plum-900 text-plum-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="inline-block rounded-2xl bg-white px-3 py-2"><img src="/tyche-logo.png" alt="Tyche" className="h-8" /></div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-plum-200">
            Your safety matters. Your voice matters. Justice matters. Built in Nigeria, for us.
          </p>
          <p className="mt-6 flex items-start gap-2 rounded-2xl bg-white/5 p-4 text-sm text-plum-100">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-tangerine-400" />
            <span>In danger right now? Call <b className="text-white">112</b> — Nigeria's free emergency line.</span>
          </p>
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
                <li key={to}><Link to={to} className="text-plum-200 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-plum-300">
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
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-plum-900/40 p-4 backdrop-blur-sm animate-rise" onClick={close}>
      <div className="relative w-full max-w-3xl rounded-5xl bg-cream p-6 shadow-2xl sm:p-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-5 top-5 rounded-full p-2 text-plum-500 hover:bg-plum-50" aria-label="Close"><X /></button>
        <img src="/tyche-mark.png" alt="" className="mx-auto h-14" />
        <p className="mt-3 text-center font-script text-3xl text-tangerine-500">Hi love, welcome</p>
        <h2 className="text-center font-display text-3xl font-semibold text-ink sm:text-4xl">What brings you to Tyche today?</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-plum-600">Pick one — you can always come back for the others.</p>
        <div className="mt-8"><PathBubbles onPick={close} compact /></div>
        <p className="mt-6 text-center text-sm text-plum-500">
          Already have an account? <Link to="/signin" onClick={close} className="font-semibold text-plum-700 underline decoration-tangerine-400 underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  const bare = pathname.startsWith("/session/");
  const { user, isSuspended } = useStore();
  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      {!bare && <Header />}
      {user && isSuspended(user.email) && (
        <div className="bg-tangerine-100 px-5 py-3 text-center text-sm text-ink">
          Your account is paused while our team reviews it. You can still read your saved reports. Questions? Reach the Tyche team.
        </div>
      )}
      <main><Outlet /></main>
      {!bare && <Footer />}
      <QuickExit />
      <WelcomeBubbles />
    </div>
  );
}
