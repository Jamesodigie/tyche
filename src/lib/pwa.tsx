import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Chrome/Edge/Android fire `beforeinstallprompt`; iOS Safari never does, so we show manual steps there.
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Ctx = {
  canPrompt: boolean; // native install dialog available
  isIOS: boolean;
  isStandalone: boolean; // already running as the installed app
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: (snooze?: boolean) => void;
  install: () => Promise<boolean>;
};

const PwaCtx = createContext<Ctx | null>(null);
const SNOOZE_KEY = "tyche:install-snooze";
const SNOOZE_DAYS = 14;

const detectIOS = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const detectStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function snoozed() {
  try {
    const t = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    return Date.now() - t < SNOOZE_DAYS * 864e5;
  } catch {
    return false;
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isStandalone, setStandalone] = useState(detectStandalone);
  const isIOS = detectIOS();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setEvt(null);
      setSheetOpen(false);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onMq = () => setStandalone(detectStandalone());
    mq?.addEventListener?.("change", onMq);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq?.removeEventListener?.("change", onMq);
    };
  }, []);

  // Gently offer installation once per fortnight, after the visitor has had time to look around.
  useEffect(() => {
    if (isStandalone || snoozed()) return;
    if (!evt && !isIOS) return;
    const t = setTimeout(() => {
      let welcomed = true;
      try { welcomed = !!sessionStorage.getItem("tyche:welcomed"); } catch { /* noop */ }
      if (welcomed && !window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/session")) setSheetOpen(true);
    }, 25000);
    return () => clearTimeout(t);
  }, [evt, isIOS, isStandalone]);

  const closeSheet = useCallback((snooze = true) => {
    setSheetOpen(false);
    if (snooze) try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch { /* noop */ }
  }, []);

  const install = useCallback(async () => {
    if (!evt) return false;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") setSheetOpen(false);
    return outcome === "accepted";
  }, [evt]);

  return (
    <PwaCtx.Provider value={{ canPrompt: !!evt, isIOS, isStandalone, sheetOpen, openSheet: () => setSheetOpen(true), closeSheet, install }}>
      {children}
    </PwaCtx.Provider>
  );
}

export function usePwa() {
  const c = useContext(PwaCtx);
  if (!c) throw new Error("usePwa outside provider");
  return c;
}
