import { ExternalLink, Lock, MessageCircleHeart, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Button, Empty, cx } from "../components/ui";
import { CHANNEL_LABEL, KIND_COPY, type Channel } from "../lib/data";
import { useStore } from "../lib/store";

export default function Session() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { bookings, lawyers, user } = useStore();
  const b = bookings.find((x) => x.id === id);
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const c = setTimeout(() => setConnected(true), 2200);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { clearTimeout(c); clearInterval(t); };
  }, []);

  if (!b)
    return <div className="mx-auto max-w-xl px-4 sm:px-6 py-12 sm:py-20"><Empty icon={<Video />} title="Session not found" action={<Button to="/me">Back to my space</Button>} /></div>;

  const mode = (params.get("mode") as Channel) || b.channel;
  if (mode === "chat") return <Navigate to={`/messages/${b.id}`} replace />;

  const l = lawyers.find((x) => x.id === b.lawyerId)!;
  const isLawyer = user?.role === "lawyer";
  const other = isLawyer ? { name: b.clientName, hue: 330 } : { name: l.name, hue: l.hue };
  const back = isLawyer ? "/lawyer/dashboard" : "/me";
  const t = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-plum-900 text-white">
      <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-plum-600/40 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-tangerine-500/20 blur-3xl" />

      <header className="relative flex items-center justify-between px-6 py-5">
        <img src="/tyche-mark.png" alt="Tyche" className="h-9" />
        <div className="text-center">
          <p className="text-sm font-semibold">{KIND_COPY[b.kind].title} · {CHANNEL_LABEL[mode]}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-plum-200"><Lock size={11} /> Private & encrypted</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm">{connected ? t : "--:--"}</span>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6">
        {mode === "meet" ? (
          <div className="grid w-full max-w-5xl gap-4 md:grid-cols-[2fr_1fr]">
            <div className="relative grid aspect-video place-items-center rounded-5xl bg-gradient-to-br from-plum-700 to-plum-800 ring-1 ring-white/10">
              <div className="text-center">
                <Avatar name={other.name} hue={other.hue} size={120} className={cx("mx-auto ring-plum-700", !connected && "animate-pulse")} />
                <p className="mt-4 font-display text-2xl">{other.name}</p>
                <p className="text-sm text-plum-200">{connected ? "Connected" : "Waiting for them to join…"}</p>
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-black/30 px-3 py-1 text-xs">{other.name}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative grid aspect-video place-items-center rounded-4xl bg-plum-800 ring-1 ring-white/10">
                {cam ? <Avatar name={user?.name || "You"} hue={isLawyer ? l.hue : 285} size={64} className="ring-plum-800" /> : <VideoOff className="text-plum-300" />}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/30 px-3 py-1 text-xs">You</span>
              </div>
              <div className="rounded-4xl bg-white/10 p-5 text-sm ring-1 ring-white/10">
                <p className="font-semibold">Google Meet in Tyche</p>
                <p className="mt-1 text-plum-100">Prefer the full Meet experience? Open the secure room — your link is private to this booking.</p>
                <a href={`https://meet.google.com/`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-tangerine-200 hover:underline">Open in Google Meet <ExternalLink size={14} /></a>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative mx-auto w-fit">
              {connected && <span className="absolute inset-0 animate-ping rounded-full bg-tangerine-400/30" />}
              <Avatar name={other.name} hue={other.hue} size={160} className="relative ring-8 ring-white/10" />
            </div>
            <p className="mt-8 font-display text-4xl font-semibold">{other.name}</p>
            <p className="mt-2 text-plum-200">{connected ? "On call · your number stays hidden" : "Calling…"}</p>
          </div>
        )}
      </main>

      <footer className="relative flex items-center justify-center gap-4 px-6 pb-10 pt-6">
        <button onClick={() => setMuted(!muted)} className={cx("grid h-14 w-14 place-items-center rounded-full transition", muted ? "bg-white text-plum-700" : "bg-white/15 hover:bg-white/25")} title="Mute">{muted ? <MicOff /> : <Mic />}</button>
        {mode === "meet" && <button onClick={() => setCam(!cam)} className={cx("grid h-14 w-14 place-items-center rounded-full transition", !cam ? "bg-white text-plum-700" : "bg-white/15 hover:bg-white/25")} title="Camera">{cam ? <Video /> : <VideoOff />}</button>}
        <Link to={`/messages/${b.id}`} className="grid h-14 w-14 place-items-center rounded-full bg-white/15 hover:bg-white/25" title="Chat"><MessageCircleHeart /></Link>
        <button onClick={() => navigate(back)} className="grid h-16 w-16 place-items-center rounded-full bg-tangerine-500 shadow-glow transition hover:bg-tangerine-600" title="End"><PhoneOff /></button>
      </footer>
    </div>
  );
}
