import { Download, Home, MessageCircleHeart, MoreVertical, PlusSquare, RefreshCw, Scale, Share, ShieldCheck, UserRound, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { usePwa } from "../lib/pwa";
import { useStore } from "../lib/store";
import { Button, cx } from "./ui";

/** Bottom sheet that installs Tyche (native prompt on Android/Chrome, steps on iPhone). */
export function InstallSheet() {
  const { sheetOpen, closeSheet, canPrompt, install, isIOS, isStandalone } = usePwa();
  if (!sheetOpen || isStandalone) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-plum-900/40 backdrop-blur-sm sm:items-center" onClick={() => closeSheet()}>
      <div className="safe-bottom w-full max-w-md animate-rise rounded-t-5xl bg-cream p-6 shadow-2xl sm:rounded-5xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-plum-100 sm:hidden" />
        <div className="flex items-start gap-4">
          <img src="/icons/icon-192.png" alt="" className="h-16 w-16 rounded-3xl shadow-soft ring-1 ring-plum-100" />
          <div className="flex-1">
            <p className="font-script text-2xl leading-none text-tangerine-500">keep us close</p>
            <h2 className="font-display text-2xl font-semibold text-ink">Get the Tyche app</h2>
          </div>
          <button onClick={() => closeSheet()} className="rounded-full p-1.5 text-plum-400 hover:bg-plum-50" aria-label="Close"><X size={20} /></button>
        </div>
        <ul className="mt-5 space-y-2 text-[15px] text-plum-700">
          <li className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-lagoon-500" /> Opens on its own, away from your browser tabs</li>
          <li className="flex gap-2"><MessageCircleHeart size={18} className="mt-0.5 shrink-0 text-lagoon-500" /> Get to your lawyer and messages in one tap</li>
          <li className="flex gap-2"><Download size={18} className="mt-0.5 shrink-0 text-lagoon-500" /> Tiny download, no app store needed</li>
        </ul>

        {canPrompt ? (
          <Button size="lg" className="mt-6 w-full" onClick={install}><Download size={18} /> Install Tyche</Button>
        ) : isIOS ? (
          <ol className="mt-6 space-y-3 rounded-4xl bg-white p-5 text-sm text-ink ring-1 ring-plum-100">
            <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">1</span><span>Tap <Share size={16} className="inline align-text-bottom text-[#0A84FF]" /> <b>Share</b> in Safari</span></li>
            <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">2</span><span>Scroll and tap <PlusSquare size={16} className="inline align-text-bottom" /> <b>Add to Home Screen</b></span></li>
            <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">3</span><span>Tap <b>Add</b> — that's it 💜</span></li>
          </ol>
        ) : (
          <ol className="mt-6 space-y-3 rounded-4xl bg-white p-5 text-sm text-ink ring-1 ring-plum-100">
            <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">1</span><span>Open your browser menu</span> <MoreVertical size={17} /></li>
            <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-100 text-xs font-bold text-plum-700">2</span><span>Tap <b>Install app</b> or <b>Add to Home screen</b></span></li>
          </ol>
        )}
        <button onClick={() => closeSheet()} className="mt-4 w-full py-2 text-sm font-medium text-plum-500">Maybe later</button>
      </div>
    </div>
  );
}

/** Small "install" entry point for headers/menus. Hidden once installed. */
export function InstallButton({ className, label = "Get the app" }: { className?: string; label?: string }) {
  const { isStandalone, openSheet } = usePwa();
  if (isStandalone) return null;
  return (
    <button onClick={openSheet} className={cx("inline-flex items-center gap-2", className)}>
      <Download size={16} /> {label}
    </button>
  );
}

/** Tells people when a new version is ready, and when they're offline. */
export function AppStatus() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Check for a fresh version every hour while the app is open.
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  return (
    <>
      {!online && (
        <div className="safe-top fixed inset-x-0 top-0 z-[65] flex items-center justify-center gap-2 bg-ink px-4 py-2 text-sm text-white">
          <WifiOff size={15} /> You're offline. Tyche still opens — reconnect to send or book.
        </div>
      )}
      {needRefresh && (
        <div className="fixed inset-x-4 bottom-24 z-[65] mx-auto flex max-w-md items-center gap-3 rounded-4xl bg-white p-4 shadow-2xl ring-1 ring-plum-100 lg:bottom-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-plum-100 text-plum-600"><RefreshCw size={18} /></span>
          <p className="flex-1 text-sm text-ink"><b>A fresh Tyche is ready.</b> Refresh to get the latest.</p>
          <button onClick={() => updateServiceWorker(true)} className="rounded-full bg-plum-600 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
          <button onClick={() => setNeedRefresh(false)} className="p-1 text-plum-400" aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
    </>
  );
}

/** Native-feeling tab bar on phones. */
export function BottomTabs() {
  const { user } = useStore();
  const { pathname } = useLocation();
  const me = user?.role === "lawyer" ? "/lawyer/dashboard" : "/me";
  const tabs = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/lawyers", label: "Lawyers", icon: Scale },
    { to: "/report", label: "Report", icon: ShieldCheck, primary: true },
    { to: "/messages", label: "Messages", icon: MessageCircleHeart },
    { to: user ? me : "/signin", label: user ? "Me" : "Sign in", icon: UserRound },
  ];
  if (pathname.startsWith("/session")) return null;
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-plum-100 bg-white/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) => cx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", isActive ? "text-plum-700" : "text-plum-400")}
          >
            {({ isActive }) =>
              t.primary ? (
                <>
                  <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-tangerine-500 text-white shadow-glow ring-4 ring-white"><t.icon size={22} /></span>
                  <span className={isActive ? "text-tangerine-600" : ""}>{t.label}</span>
                </>
              ) : (
                <>
                  <span className={cx("grid h-8 w-12 place-items-center rounded-full transition", isActive && "bg-plum-100")}><t.icon size={20} /></span>
                  {t.label}
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
