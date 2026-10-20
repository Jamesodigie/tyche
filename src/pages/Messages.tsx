import { ArrowLeft, Lock, MessageCircleHeart, Paperclip, Phone, Send, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, Empty, cx } from "../components/ui";
import { KIND_COPY } from "../lib/data";
import { useStore } from "../lib/store";

export default function Messages() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user, bookings, lawyers, messages, sendMessage } = useStore();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const isLawyer = user?.role === "lawyer";
  const threads = bookings.filter((b) => (isLawyer ? b.lawyerId === user?.lawyerId : true));
  const active = threads.find((t) => t.id === threadId);
  const thread = messages.filter((m) => m.threadId === threadId);
  const me = isLawyer ? "lawyer" : "client";

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [thread.length, threadId]);

  if (!user)
    return <div className="mx-auto max-w-xl px-5 py-20"><Empty icon={<MessageCircleHeart />} title="Your private messages" sub="Sign in to chat with your lawyer." action={<Button to="/signin?next=/messages">Sign in</Button>} /></div>;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    sendMessage({ threadId: active.id, from: me, text: text.trim() });
    const firstFromMe = !thread.some((m) => m.from === me);
    setText("");
    if (!isLawyer && firstFromMe)
      setTimeout(() => sendMessage({ threadId: active.id, from: "lawyer", text: "Thank you for trusting me with this. I've noted everything — we'll go through it together during our session. Take care of yourself till then. 💜" }), 2200);
  };

  const otherName = (b: (typeof threads)[number]) => (isLawyer ? b.clientName : lawyers.find((l) => l.id === b.lawyerId)?.name || "Lawyer");
  const otherHue = (b: (typeof threads)[number]) => (isLawyer ? 330 : lawyers.find((l) => l.id === b.lawyerId)?.hue || 285);

  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div className="grid h-[calc(100vh-150px)] min-h-[520px] overflow-hidden rounded-5xl bg-white shadow-soft ring-1 ring-plum-100 md:grid-cols-[320px_1fr]">
        <aside className={cx("flex flex-col border-r border-plum-100", active && "hidden md:flex")}>
          <div className="border-b border-plum-100 p-5">
            <h1 className="font-display text-2xl font-semibold text-ink">Messages</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-plum-400"><Lock size={12} /> Private between you and your {isLawyer ? "clients" : "lawyers"}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {threads.length ? threads.map((b) => {
              const last = messages.filter((m) => m.threadId === b.id).at(-1);
              return (
                <Link key={b.id} to={`/messages/${b.id}`} className={cx("flex items-center gap-3 rounded-3xl p-3 transition", b.id === threadId ? "bg-plum-50" : "hover:bg-cream")}>
                  <Avatar name={otherName(b)} hue={otherHue(b)} size={46} className="ring-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{otherName(b)}</span>
                    <span className="block truncate text-sm text-plum-500">{last?.text || KIND_COPY[b.kind].title}</span>
                  </span>
                </Link>
              );
            }) : (
              <div className="p-6 text-center text-sm text-plum-500">
                No conversations yet. They start when you {isLawyer ? "get a booking" : "book a lawyer"}.
                {!isLawyer && <div className="mt-4"><Button size="sm" to="/hire">Hire a lawyer</Button></div>}
              </div>
            )}
          </div>
        </aside>

        <div className={cx("flex flex-col", !active && "hidden md:flex")}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-plum-100 p-4">
                <button onClick={() => navigate("/messages")} className="rounded-full p-2 text-plum-500 md:hidden"><ArrowLeft size={20} /></button>
                <Avatar name={otherName(active)} hue={otherHue(active)} size={44} className="ring-2" />
                <div className="flex-1">
                  <p className="font-semibold text-ink">{otherName(active)}</p>
                  <p className="text-xs text-plum-500">{KIND_COPY[active.kind].title} · {new Date(active.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, {active.time}</p>
                </div>
                <Link to={`/session/${active.id}?mode=call`} className="grid h-10 w-10 place-items-center rounded-full bg-lagoon-50 text-lagoon-600 hover:bg-lagoon-100" title="Voice call"><Phone size={18} /></Link>
                <Link to={`/session/${active.id}?mode=meet`} className="grid h-10 w-10 place-items-center rounded-full bg-plum-50 text-plum-600 hover:bg-plum-100" title="Google Meet"><Video size={18} /></Link>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-cream/60 p-5 grain">
                <p className="mx-auto w-fit rounded-full bg-white px-4 py-1.5 text-xs text-plum-500 shadow-sm"><Lock size={11} className="mr-1 inline" />Messages are private and stay inside Tyche</p>
                {thread.map((m) => (
                  <div key={m.id} className={cx("flex", m.from === me ? "justify-end" : "justify-start")}>
                    <p className={cx("max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] shadow-sm", m.from === me ? "rounded-br-md bg-plum-600 text-white" : "rounded-bl-md bg-white text-ink")}>
                      {m.text}
                      <span className={cx("mt-1 block text-[10px]", m.from === me ? "text-plum-200" : "text-plum-300")}>{new Date(m.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </p>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="flex items-center gap-2 border-t border-plum-100 p-3">
                <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-plum-400 hover:bg-plum-50" title="Attach"><Paperclip size={20} /></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className="flex-1 rounded-full bg-cream px-5 py-3 outline-none ring-plum-200 focus:ring-2" />
                <button className="grid h-11 w-11 place-items-center rounded-full bg-plum-600 text-white hover:bg-plum-700 disabled:opacity-40" disabled={!text.trim()}><Send size={18} /></button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div>
                <MessageCircleHeart className="mx-auto text-plum-200" size={56} />
                <p className="mt-3 font-display text-xl text-ink">Pick a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
