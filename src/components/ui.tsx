import { Check, Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { initials } from "../lib/data";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type BtnVariant = "primary" | "soft" | "ghost" | "outline" | "warm" | "teal";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-plum-200";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-plum-600 text-white hover:bg-plum-700 shadow-soft",
  warm: "bg-tangerine-500 text-white hover:bg-tangerine-600 shadow-glow",
  teal: "bg-lagoon-500 text-white hover:bg-lagoon-600",
  soft: "bg-plum-100 text-plum-700 hover:bg-plum-200",
  outline: "border-2 border-plum-200 text-plum-700 hover:border-plum-400 bg-white/70",
  ghost: "text-plum-700 hover:bg-plum-50",
};
const btnSizes = { sm: "min-h-[40px] px-4 py-2 text-sm", md: "min-h-[48px] px-6 py-3 text-[15px]", lg: "min-h-[52px] px-7 py-3.5 text-base sm:px-8 sm:py-4" };

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: keyof typeof btnSizes; to?: string };

export function Button({ variant = "primary", size = "md", className, to, children, ...rest }: BtnProps) {
  const cls = cx(btnBase, btnVariants[variant], btnSizes[size], className);
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-4xl bg-white border border-plum-100/70 shadow-soft", className)} {...rest}>{children}</div>;
}

export function Field({ label, hint, children, optional }: { label: string; hint?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-plum-400">optional</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-plum-500/80">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-plum-100 bg-cream px-4 py-3 text-base text-ink sm:text-[15px] placeholder:text-plum-300 outline-none transition focus:border-plum-400 focus:bg-white focus:ring-4 focus:ring-plum-100";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cx(inputCls, className)} {...p} />
));
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cx(inputCls, "min-h-[120px] resize-y", className)} {...p} />
));
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputCls, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%237A3BA8%22 stroke-width=%222%22 fill=%22none%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10", className)} {...p}>
      {children}
    </select>
  );
}

export function Chip({ active, onClick, children, tone = "plum" }: { active?: boolean; onClick?: () => void; children: ReactNode; tone?: "plum" | "teal" | "warm" }) {
  const on = { plum: "bg-plum-600 text-white border-plum-600", teal: "bg-lagoon-500 text-white border-lagoon-500", warm: "bg-tangerine-500 text-white border-tangerine-500" }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3.5 py-2 text-sm font-medium transition sm:px-4",
        active ? on : "border-plum-100 bg-white text-plum-700 hover:border-plum-300",
      )}
    >
      {active && <Check size={14} strokeWidth={3} />}
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className="flex w-full items-start gap-3 rounded-3xl border-2 border-plum-100 bg-white p-4 text-left transition hover:border-plum-200 sm:gap-4">
      <span className={cx("mt-0.5 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition", on ? "bg-lagoon-500" : "bg-plum-100")}>
        <span className={cx("h-5 w-5 rounded-full bg-white shadow transition", on && "translate-x-5")} />
      </span>
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-sm text-plum-500">{sub}</span>}
      </span>
    </button>
  );
}

export function Badge({ children, tone = "plum", className }: { children: ReactNode; tone?: "plum" | "teal" | "warm" | "blush"; className?: string }) {
  const t = { plum: "bg-plum-100 text-plum-700", teal: "bg-lagoon-100 text-lagoon-600", warm: "bg-tangerine-100 text-tangerine-600", blush: "bg-blush-100 text-plum-700" }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", t, className)}>{children}</span>;
}

export function Avatar({ name, hue = 285, size = 56, className, src }: { name: string; hue?: number; size?: number; className?: string; src?: string }) {
  if (src)
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        width={size}
        height={size}
        className={cx("shrink-0 rounded-full bg-plum-100 object-cover ring-4 ring-white", className)}
        style={{ width: size, height: size }}
      />
    );
  return (
    <span
      className={cx("grid shrink-0 place-items-center rounded-full font-display font-semibold text-white ring-4 ring-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `radial-gradient(circle at 30% 25%, hsl(${hue} 80% 72%), hsl(${hue} 58% 46%) 70%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cx(
                "grid h-7 w-7 shrink-0 text-xs sm:h-8 sm:w-8 sm:text-sm place-items-center rounded-full text-sm font-bold transition",
                i < current ? "bg-lagoon-500 text-white" : i === current ? "bg-plum-600 text-white ring-4 ring-plum-100" : "bg-plum-50 text-plum-300",
              )}
            >
              {i < current ? <Check size={15} strokeWidth={3} /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className={cx("h-1 flex-1 rounded-full", i < current ? "bg-lagoon-200" : "bg-plum-50")} />}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-plum-500">
        Step {current + 1} of {steps.length} · <span className="text-ink">{steps[current]}</span>
      </p>
    </div>
  );
}

export function Sparkle({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" fill="currentColor" />
    </svg>
  );
}

export function PageHero({ eyebrow, title, sub, children }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-5xl px-4 pb-4 pt-5 text-center sm:px-6 sm:pb-10 sm:pt-16">
        {eyebrow && <p className="font-script text-lg text-tangerine-500 sm:text-2xl">{eyebrow}</p>}
        <h1 className="h-page mx-auto mt-1 max-w-3xl font-display font-semibold leading-[1.08] text-ink">{title}</h1>
        {sub && <p className="mx-auto mt-2 max-w-2xl text-sm text-plum-700/80 sm:mt-4 sm:text-lg">{sub}</p>}
        {children}
      </div>
    </section>
  );
}

export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-tangerine-100 blur-3xl opacity-70" />
      <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-plum-100 blur-3xl opacity-80" />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-lagoon-100 blur-3xl opacity-60" />
    </div>
  );
}

export function Empty({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rounded-4xl border-2 border-dashed border-plum-100 bg-white/60 px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-100 text-plum-600">{icon}</div>
      <p className="mt-4 font-display text-xl font-semibold text-ink">{title}</p>
      {sub && <p className="mx-auto mt-1 max-w-sm text-sm text-plum-500">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Inline message for form errors / confirmations. */
export function Notice({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  const t = {
    error: "bg-blush-100 text-plum-800 ring-blush-300",
    info: "bg-plum-50 text-plum-700 ring-plum-100",
    success: "bg-lagoon-50 text-lagoon-600 ring-lagoon-200",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cx("rounded-2xl px-4 py-3 text-sm ring-1", t)}>
      {children}
    </p>
  );
}

/** Password field with show/hide. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cx("pr-12", props.className)} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-plum-400 hover:bg-plum-50" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
