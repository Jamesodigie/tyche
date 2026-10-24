import { BellRing, CalendarCheck2, Gavel, MessageCircleHeart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { playChime, primeAudio } from "../lib/notify";
import { useStore } from "../lib/store";
import { Button, cx } from "./ui";

type Toast = { id: number; icon: "booking" | "offer" | "support"; title: string; body: string; to: string };

/**
 * Watches for new activity and plays a chime + shows a toast:
 *  • lawyers: a new booking  • clients: a new offer, a confirmed booking  • everyone: a support reply
 *  • admins: a new support message
 */
export function ActivityAlerts() {
  const { user, bookings, bids, reports, support, admin, isAdmin } = useStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<{ key: string; ids: Set<string> } | null>(null);

  useEffect(() => primeAudio(), []);

  useEffect(() => {
    if (!user) {
      seen.current = null;
      return;
    }
    const myReports = new Set(reports.map((r) => r.id));
    const lawyerBookings = bookings.filter((b) => user.lawyerId && b.lawyerId === user.lawyerId && b.status === "upcoming");
    const clientBookings = bookings.filter((b) => b.clientId === user.id && b.status === "upcoming");
    const offers = bids.filter((b) => myReports.has(b.reportId));
    const replies = support.filter((m) => m.fromAdmin);
    const inbox = isAdmin ? (admin?.support || []).filter((m) => !m.fromAdmin && m.userId !== user.id) : [];
    const ids = new Set([
      ...lawyerBookings.map((b) => "LB" + b.id),
      ...clientBookings.map((b) => "CB" + b.id),
      ...offers.map((b) => "OF" + b.id),
      ...replies.map((m) => "SR" + m.id),
      ...inbox.map((m) => "AI" + m.id),
    ]);

    // First snapshot for this account: remember what's there, don't alert.
    if (!seen.current || seen.current.key !== user.id) {
      seen.current = { key: user.id, ids };
      return;
    }
    const fresh: Toast[] = [];
    const now = Date.now();
    for (const b of lawyerBookings)
      if (!seen.current.ids.has("LB" + b.id)) fresh.push({ id: now + fresh.length, icon: "booking", title: "You've been booked! 🎉", body: `${b.clientName} · ${b.date} at ${b.time}`, to: "/lawyer/dashboard" });
    for (const b of clientBookings)
      if (!seen.current.ids.has("CB" + b.id)) fresh.push({ id: now + fresh.length, icon: "booking", title: "Your session is booked 💜", body: `${b.date} at ${b.time}`, to: `/messages/${b.id}` });
    for (const b of offers)
      if (!seen.current.ids.has("OF" + b.id)) fresh.push({ id: now + fresh.length, icon: "offer", title: "A lawyer sent you an offer", body: b.free ? "Free " + b.kind : "Tap to see it", to: "/me" });
    for (const m of replies)
      if (!seen.current.ids.has("SR" + m.id) && !m.readAt) fresh.push({ id: now + fresh.length, icon: "support", title: "Tyche Support replied", body: m.text.slice(0, 80), to: "" });
    for (const m of inbox)
      if (!seen.current.ids.has("AI" + m.id)) fresh.push({ id: now + fresh.length, icon: "support", title: "New support message", body: m.text.slice(0, 80), to: "/admin/support" });
    seen.current = { key: user.id, ids };
    if (!fresh.length) return;
    playChime(fresh.some((t) => t.icon === "booking") ? "booking" : "message");
    setToasts((p) => [...fresh, ...p].slice(0, 3));
  }, [user, bookings, bids, reports, support, admin, isAdmin]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((p) => p.slice(0, -1)), 7000);
    return () => clearTimeout(t);
  }, [toasts]);

  if (!toasts.length) return null;
  const Icon = { booking: CalendarCheck2, offer: Gavel, support: MessageCircleHeart };
  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-3 pt-3">
      {toasts.map((t) => {
        const I = Icon[t.icon];
        const inner = (
          <>
            <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-full", t.icon === "booking" ? "bg-tangerine-100 text-tangerine-600" : "bg-plum-100 text-plum-600")}><I size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{t.title}</span>
              <span className="block truncate text-xs text-plum-500">{t.body}</span>
            </span>
          </>
        );
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-plum-100">
            {t.to ? <Link to={t.to} className="flex min-w-0 flex-1 items-center gap-3" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}>{inner}</Link> : <span className="flex min-w-0 flex-1 items-center gap-3">{inner}</span>}
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="grid h-8 w-8 place-items-center rounded-full text-plum-400 hover:bg-plum-50" aria-label="Dismiss"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}

/** "Turn on notifications" card for dashboards. */
export function NotificationsCard({ compact }: { compact?: boolean }) {
  const { pushState, enablePush, disablePush } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (pushState === "unconfigured") return null;
  const on = pushState === "on";
  const toggle = async () => {
    setBusy(true);
    setMsg("");
    if (on) await disablePush();
    else {
      const err = await enablePush();
      if (err) setMsg(err);
      else playChime("message");
    }
    setBusy(false);
  };
  return (
    <div className={cx("flex flex-wrap items-center gap-3 rounded-3xl bg-white ring-1 ring-plum-100", compact ? "p-3" : "p-4")}>
      <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-full", on ? "bg-lagoon-100 text-lagoon-600" : "bg-plum-100 text-plum-600")}><BellRing size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{on ? "Notifications are on" : "Get notified"}</p>
        <p className="text-xs text-plum-500">
          {pushState === "unsupported"
            ? "On iPhone, add Tyche to your Home Screen, then open it from there to turn on notifications."
            : pushState === "denied"
              ? "Notifications are blocked — allow them for Tyche in your phone or browser settings."
              : on
                ? "We'll let you know about bookings, offers and news from Tyche."
                : "Bookings, offers and messages — even when Tyche is closed."}
        </p>
        {msg && <p className="mt-1 text-xs font-semibold text-tangerine-600">{msg}</p>}
      </div>
      {pushState !== "unsupported" && pushState !== "denied" && (
        <Button size="sm" variant={on ? "ghost" : "primary"} onClick={toggle} disabled={busy}>{busy ? "…" : on ? "Turn off" : "Turn on"}</Button>
      )}
    </div>
  );
}
