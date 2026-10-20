import { ArrowRight, Gavel, HeartHandshake, Scale, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cx } from "./ui";

export const PATHS = [
  {
    to: "/report",
    icon: ShieldCheck,
    title: "Report harassment",
    line: "Save your evidence safely and let verified lawyers offer to help.",
    bg: "from-tangerine-50 to-blush-100",
    ring: "hover:ring-tangerine-200",
    dot: "bg-tangerine-500",
  },
  {
    to: "/hire",
    icon: Scale,
    title: "Hire a lawyer",
    line: "Book a consultation or engage a lawyer for your case — on calls, chat or Meet.",
    bg: "from-plum-50 to-plum-100",
    ring: "hover:ring-plum-200",
    dot: "bg-plum-600",
  },
  {
    to: "/community",
    icon: HeartHandshake,
    title: "Join our community",
    line: "A private WhatsApp circle of up to 10,000 women who get it.",
    bg: "from-lagoon-50 to-lagoon-100",
    ring: "hover:ring-lagoon-200",
    dot: "bg-lagoon-500",
  },
  {
    to: "/join/lawyer",
    icon: Gavel,
    title: "I am a lawyer",
    line: "Set your fees and hours, get cases, and get paid through Tyche.",
    bg: "from-blush-50 to-blush-200",
    ring: "hover:ring-blush-300",
    dot: "bg-ink",
  },
];

export function PathBubbles({ onPick, compact }: { onPick?: () => void; compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PATHS.map((p, i) => (
        <Link
          key={p.to}
          to={p.to}
          onClick={onPick}
          style={{ animationDelay: `${i * 80}ms` }}
          className={cx(
            "group relative flex animate-rise items-start gap-4 overflow-hidden rounded-[2.25rem] bg-gradient-to-br p-5 ring-2 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-soft",
            p.bg,
            p.ring,
            compact ? "sm:p-6" : "sm:p-7",
          )}
        >
          <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50" />
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-plum-700 shadow-sm">
            <p.icon size={26} strokeWidth={1.8} />
            <span className={cx("absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white", p.dot)} />
          </span>
          <span className="relative flex-1">
            <span className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              {p.title}
              <ArrowRight size={18} className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            <span className="mt-1 block text-[15px] leading-snug text-plum-700/80">{p.line}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
