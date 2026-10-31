import { ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ctx } from "../lib/store";
import { useStore } from "../lib/store";
import { cx } from "./ui";

/** Builds a JSON copy of everything this person can see about themselves and downloads it. */
export function downloadMyData(s: Ctx) {
  // Previews are big image data; the files themselves stay downloadable from each report.
  const strip = (r: Ctx["reports"][number]) => ({ ...r, evidence: r.evidence.map(({ preview: _p, ...e }) => e) });
  const data = {
    exported_at: new Date().toISOString(),
    account: s.user,
    reports: s.reports.map(strip),
    bookings: s.bookings,
    offers_from_lawyers: s.bids,
    messages: s.messages,
    community: s.community,
    support_chat: s.support,
    lawyer_profile: s.myLawyer,
    payouts: s.myPayouts,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `tyche-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Shortcut card to Settings (photo, password, email, your data, delete account). */
export function YourData({ className }: { className?: string }) {
  const { user } = useStore();
  if (!user) return null;
  return (
    <Link to="/settings" className={cx("flex items-center gap-3 rounded-3xl bg-white p-3 ring-1 ring-plum-100 transition hover:bg-plum-50", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-plum-50 text-plum-600"><SettingsIcon size={18} /></span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold text-ink">Settings</span>
        <span className="block text-xs text-plum-500">Photo, password, email, invite friends, your data</span>
      </span>
      <ChevronRight size={18} className="text-plum-400" />
    </Link>
  );
}
