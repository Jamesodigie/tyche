// Sounds + push subscription helpers (browser side).

let ctx: AudioContext | null = null;

/** A short, soft two-note chime made in code (no audio file to download). */
export function playChime(kind: "booking" | "message" = "booking") {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const notes = kind === "booking" ? [784, 1046.5, 1318.5] : [880, 1174.7];
    notes.forEach((f, i) => {
      const t = ctx!.currentTime + i * 0.16;
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx!.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    navigator.vibrate?.(kind === "booking" ? [120, 60, 120] : 80);
  } catch { /* sound is a nice-to-have */ }
}

/** Unlock audio on the first tap so later chimes are allowed to play. */
export function primeAudio() {
  const unlock = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC && !ctx) ctx = new AC();
      ctx?.resume().catch(() => {});
    } catch { /* ignore */ }
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}

export const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || "";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export async function currentPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) || null;
}

/** Asks permission and returns the new subscription (JSON) — or an error message. */
export async function subscribePush(): Promise<{ sub?: PushSubscriptionJSON; error?: string }> {
  if (!pushSupported()) return { error: "This browser doesn't support notifications. On iPhone, add Tyche to your Home Screen first, then open it from there." };
  if (!VAPID_PUBLIC_KEY) return { error: "Notifications aren't switched on for Tyche yet." };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { error: "Notifications are blocked. You can allow them in your browser or phone settings." };
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY) }));
  return { sub: sub.toJSON() };
}

/** Generates a VAPID key pair in the browser (used once by an admin during setup). */
export async function generateVapidKeys() {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { publicKey: b64u(raw), privateKey: jwk.d as string };
}
