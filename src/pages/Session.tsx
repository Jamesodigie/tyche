import { ArrowLeft, ExternalLink, Lock, MessageCircleHeart, PhoneOff, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar, Button, Empty, cx } from "../components/ui";
import { CHANNEL_LABEL, KIND_COPY, type Booking, type Channel } from "../lib/data";
import { useStore } from "../lib/store";

/** Private room name only the two participants can work out. */
async function roomName(b: Booking) {
  const seed = `${b.id}:${b.clientId || ""}:${b.createdAt}`;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
    const hex = [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `Tyche-${b.id}-${hex.slice(0, 16)}`;
  } catch {
    return `Tyche-${b.id}-${btoa(seed).replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;
  }
}

export default function Session() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { bookings, findLawyer, user, ready } = useStore();
  const b = bookings.find((x) => x.id === id);
  const [room, setRoom] = useState("");
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    if (b) roomName(b).then(setRoom);
  }, [b]);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-plum-900 text-plum-200">Loading…</div>;
  if (!b)
    return <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-20"><Empty icon={<Video />} title="Session not found" sub="Sign in with the account you booked with." action={<Button to="/me">Back to my space</Button>} /></div>;
  if (b.status === "pending_payment")
    return <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-20"><Empty icon={<Video />} title="This session isn't confirmed yet" sub="It will open once payment goes through." action={<Button to="/me">Back to my space</Button>} /></div>;

  const mode = (params.get("mode") as Channel) || b.channel;
  if (mode === "chat") return <Navigate to={`/messages/${b.id}`} replace />;

  const l = findLawyer(b.lawyerId);
  const amLawyer = !!user?.lawyerId && user.lawyerId === b.lawyerId;
  const other = amLawyer ? { name: b.clientName, hue: 330 } : { name: l?.name || "Your lawyer", hue: l?.hue ?? 285 };
  const back = amLawyer ? "/lawyer/dashboard" : "/me";
  const audioOnly = mode === "call";
  const myName = user?.name || "Guest";
  const jitsi =
    room &&
    `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.disableDeepLinking=true` +
      `&config.startWithVideoMuted=${audioOnly}&config.startAudioOnly=${audioOnly}` +
      `&userInfo.displayName=${encodeURIComponent(JSON.stringify(myName))}`;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-plum-900 text-white">
      <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-plum-600/40 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-tangerine-500/20 blur-3xl" />

      <header className="safe-top relative flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to={back} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Back"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{KIND_COPY[b.kind].title} with {other.name}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-plum-200"><Lock size={11} /> {CHANNEL_LABEL[mode]} · {b.time}</p>
        </div>
        <Link to={`/messages/${b.id}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Chat"><MessageCircleHeart size={18} /></Link>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-6 sm:px-6">
        {inRoom && jitsi ? (
          <div className="flex w-full max-w-5xl flex-1 flex-col gap-3">
            <iframe
              title="Tyche session room"
              src={jitsi}
              allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
              className="min-h-[60vh] w-full flex-1 rounded-4xl border-0 bg-black"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={jitsi} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20">
                Open in a new tab <ExternalLink size={14} />
              </a>
              <button onClick={() => { setInRoom(false); navigate(back); }} className="inline-flex items-center gap-2 rounded-full bg-tangerine-500 px-5 py-2.5 text-sm font-semibold shadow-glow hover:bg-tangerine-600">
                <PhoneOff size={16} /> Leave
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md text-center">
            <Avatar name={other.name} hue={other.hue} size={120} className="mx-auto ring-8 ring-white/10" />
            <p className="mt-6 font-display text-3xl font-semibold">{other.name}</p>
            <p className="mt-1 text-plum-200">
              {new Date(b.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {b.time}
            </p>

            <div className="mt-8 grid gap-3">
              {mode === "meet" && b.meetLink && (
                <a href={b.meetLink} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-plum-700 hover:bg-plum-50">
                  <Video size={18} /> Join Google Meet <ExternalLink size={14} />
                </a>
              )}
              {mode === "meet" && !b.meetLink && (
                <p className="rounded-3xl bg-white/10 p-4 text-sm text-plum-100">
                  {amLawyer ? "Add a Google Meet link to this booking from your dashboard — or use Tyche's private video room below." : "Your lawyer hasn't added a Google Meet link yet. You can use Tyche's private video room below."}
                </p>
              )}
              <button
                onClick={() => setInRoom(true)}
                disabled={!room}
                className={cx(
                  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 font-semibold transition",
                  mode === "meet" && b.meetLink ? "bg-white/10 text-white hover:bg-white/20" : "bg-tangerine-500 text-white shadow-glow hover:bg-tangerine-600",
                )}
              >
                {audioOnly ? "Start voice call in Tyche" : "Open Tyche video room"}
              </button>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-plum-300">
              Your phone number is never shared. The room is private to this booking — only you and {other.name.split(" ")[0]} can open it from Tyche.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
