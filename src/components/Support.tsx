import { ChevronDown, HelpCircle, MessageCircle, MessagesSquare, Phone, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_DISPLAY } from "../lib/data";
import { useStore } from "../lib/store";
import { cx } from "./ui";

/** Open the support panel from anywhere: openSupport() or openSupport("faq"). */
export const openSupport = (tab: "chat" | "faq" = "chat") => window.dispatchEvent(new CustomEvent("tyche:support", { detail: tab }));

export const whatsappLink = (text = "Hi Tyche, I need some help.") => `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;

export const SUPPORT_FAQ: [string, string][] = [
  ["I'm in danger right now. What do I do?", "Please call 112 — Nigeria's free emergency number — or get to a safe place first. Tyche will be here when you're ready."],
  ["Will lawyers see my name?", "No. Lawyers only see your nickname and your story. Your name and contact are shared only with a lawyer you choose to book."],
  ["How do I report harassment?", "Tap Report, write what happened in your own words and add any evidence (screenshots, voice notes, videos). You decide whether verified lawyers can see it."],
  ["Consultation or booking — what's the difference?", "A consultation is a first conversation to understand your options. A booking is when you engage the lawyer to work on your case. Many lawyers offer free consultations."],
  ["How do payments work?", "You pay securely through Tyche with Bachs — card, bank transfer and more. If a session doesn't happen, message us here and we'll make it right."],
  ["Can I delete my report or evidence?", "Yes. Send us a message here or on WhatsApp and we'll remove it for you — including our backup copy."],
  ["How do I join the community?", "Go to Community → Join the community. After payment you'll get a private WhatsApp invite."],
  ["I'm a lawyer. How do I get verified?", "Create a lawyer account and upload your call-to-bar certificate. Our team checks it, usually within 24–48 hours."],
];

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Small round photo of the support team. */
export function SupportAvatar({ size = 44, online = true }: { size?: number; online?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <img src="/support-agent.jpg" alt="Tyche support" className="h-full w-full rounded-full object-cover ring-2 ring-white" />
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-lagoon-400 ring-2 ring-white" />}
    </span>
  );
}

const LAUNCHER_ROUTES = ["/me", "/lawyer/dashboard", "/messages"];

export function SupportWidget() {
  const { pathname } = useLocation();
  const { user, support, sendSupport, markSupportRead } = useStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "faq">("chat");
  const [faq, setFaq] = useState(-1);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const unread = support.filter((m) => m.fromAdmin && !m.readAt).length;
  const showLauncher = LAUNCHER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  useEffect(() => {
    const onOpen = (e: Event) => {
      setTab(((e as CustomEvent).detail as "chat" | "faq") || "chat");
      setOpen(true);
    };
    window.addEventListener("tyche:support", onOpen);
    return () => window.removeEventListener("tyche:support", onOpen);
  }, []);

  useEffect(() => {
    if (open && tab === "chat") {
      const box = endRef.current?.parentElement;
      if (box) box.scrollTop = box.scrollHeight;
      if (unread) markSupportRead();
    }
  }, [open, tab, support.length, unread, markSupportRead]);

  useEffect(() => setOpen(false), [pathname]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    setErr("");
    const error = await sendSupport(t);
    if (error) {
      setErr(error);
      setText(t);
    }
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/session")) return null;

  return (
    <>
      {showLauncher && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-2xl ring-1 ring-plum-100 transition hover:scale-105 lg:bottom-20 lg:right-5"
          aria-label="Chat with Tyche support"
        >
          <SupportAvatar size={40} />
          <span className="text-sm font-semibold text-plum-700">Help</span>
          {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-tangerine-500 px-1 text-[11px] font-bold text-white">{unread}</span>}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[66] flex items-end justify-center bg-plum-900/30 sm:inset-auto sm:bottom-5 sm:right-5 sm:block sm:bg-transparent" onClick={() => setOpen(false)}>
          <div
            className="safe-bottom flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-cream shadow-2xl ring-1 ring-plum-100 sm:h-[600px] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[380px] sm:rounded-4xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Tyche support"
          >
            {/* header */}
            <div className="bg-gradient-to-br from-plum-600 to-plum-700 px-4 pb-3 pt-4 text-white">
              <div className="flex items-center gap-3">
                <SupportAvatar size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold leading-tight">Tyche Support</p>
                  <p className="text-xs text-plum-100">We're here for you · usually reply within minutes</p>
                </div>
                <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close"><X size={20} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={whatsappLink()} target="_blank" rel="noreferrer" className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-sm font-semibold text-white">
                  <MessageCircle size={16} /> WhatsApp us
                </a>
                <a href={`tel:+${SUPPORT_WHATSAPP}`} className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-white/15 text-sm font-semibold text-white hover:bg-white/25">
                  <Phone size={15} /> {SUPPORT_WHATSAPP_DISPLAY}
                </a>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-white/10 p-1">
                {(["chat", "faq"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={cx("flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition", tab === t ? "bg-white text-plum-700" : "text-white")}>
                    {t === "chat" ? <><MessagesSquare size={15} /> Message us</> : <><HelpCircle size={15} /> FAQ</>}
                  </button>
                ))}
              </div>
            </div>

            {/* body */}
            {tab === "faq" ? (
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {SUPPORT_FAQ.map(([q, a], i) => (
                  <div key={q} className="rounded-2xl bg-white ring-1 ring-plum-100">
                    <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink">
                      {q}
                      <ChevronDown size={16} className={cx("shrink-0 text-plum-400 transition", faq === i && "rotate-180")} />
                    </button>
                    {faq === i && <p className="px-4 pb-3 text-sm text-plum-700">{a}</p>}
                  </div>
                ))}
                <button onClick={() => setTab("chat")} className="mt-2 w-full rounded-full bg-plum-600 py-3 text-sm font-semibold text-white">Still need help? Message us</button>
              </div>
            ) : !user ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <SupportAvatar size={72} />
                <p className="font-display text-xl font-semibold text-ink">Hi love, how can we help?</p>
                <p className="text-sm text-plum-600">Sign in to chat with our team here, or reach us on WhatsApp right away.</p>
                <Link to="/signin" className="mt-1 w-full rounded-full bg-plum-600 py-3 text-sm font-semibold text-white">Sign in to chat</Link>
                <a href={whatsappLink()} target="_blank" rel="noreferrer" className="w-full rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white">Chat on WhatsApp</a>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto p-3 grain">
                  <div className="flex items-end gap-2">
                    <SupportAvatar size={28} online={false} />
                    <p className="max-w-[80%] rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-ink shadow-sm">
                      Hi {user.name.split(" ")[0]} 💜 Tell us what's going on — a real person from the Tyche team will reply here. Everything you share stays private.
                    </p>
                  </div>
                  {support.map((m) => (
                    <div key={m.id} className={cx("flex items-end gap-2", m.fromAdmin ? "justify-start" : "justify-end")}>
                      {m.fromAdmin && <SupportAvatar size={28} online={false} />}
                      <p className={cx("max-w-[80%] whitespace-pre-wrap rounded-3xl px-4 py-2.5 text-sm shadow-sm", m.fromAdmin ? "rounded-bl-md bg-white text-ink" : "rounded-br-md bg-plum-600 text-white")}>
                        {m.text}
                        <span className={cx("mt-1 block text-[10px]", m.fromAdmin ? "text-plum-300" : "text-plum-200")}>{time(m.at)}</span>
                      </p>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                {err && <p className="bg-blush-100 px-4 py-2 text-xs text-plum-800">{err}</p>}
                <form onSubmit={send} className="flex items-center gap-2 border-t border-plum-100 bg-white p-2.5">
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message…" className="min-w-0 flex-1 rounded-full bg-cream px-4 py-3 text-base outline-none ring-plum-200 focus:ring-2 sm:text-sm" />
                  <button disabled={!text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-plum-600 text-white disabled:opacity-40" aria-label="Send"><Send size={18} /></button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
