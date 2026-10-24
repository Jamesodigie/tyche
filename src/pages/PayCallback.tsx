import { CalendarCheck2, HeartHandshake, Hourglass, MessageCircle, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Blobs, Button } from "../components/ui";
import { useStore, type VerifyResult } from "../lib/store";

/** Paystack sends people back here (?reference=…) after checkout. */
export default function PayCallback() {
  const [params] = useSearchParams();
  const ref = params.get("reference") || params.get("trxref") || "";
  const { verifyPayment, ready, user } = useStore();
  const navigate = useNavigate();
  const [res, setRes] = useState<VerifyResult | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!ready || !ref) return;
    if (!user) return setRes({ error: "Please sign in with the account you paid with to finish." });
    let alive = true;
    const run = async () => {
      const out = await verifyPayment(ref);
      if (!alive) return;
      if (out.status === "pending" && tries.current < 6) {
        tries.current += 1;
        setRes(out);
        setTimeout(run, 2500);
        return;
      }
      setRes(out);
      if (out.status === "success" && out.purpose === "booking" && out.bookingId) {
        setTimeout(() => alive && navigate(`/messages/${out.bookingId}`, { replace: true }), 1800);
      }
    };
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ref, user?.id]);

  const box = (icon: React.ReactNode, title: string, body: React.ReactNode, actions?: React.ReactNode) => (
    <section className="relative overflow-hidden">
      <Blobs />
      <div className="relative mx-auto max-w-xl px-4 py-12 text-center sm:px-6 sm:py-20">
        <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-lagoon-100 text-lagoon-600">{icon}</div>
        <h1 className="h-page mt-6 font-display font-semibold text-ink">{title}</h1>
        <div className="mt-3 text-lg text-plum-700/80">{body}</div>
        {actions && <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>}
      </div>
    </section>
  );

  if (!ref) return box(<XCircle size={38} />, "No payment found", "This link is missing its payment reference.", <Button to="/me">Go to my space</Button>);
  if (!res || res.status === "pending")
    return box(<Hourglass size={38} className="animate-pulse" />, "Confirming your payment…", "This usually takes a few seconds. Please don't close this page.");
  if (res.error)
    return box(<XCircle size={38} />, "We couldn't confirm that yet", res.error, <><Button to={`/signin?next=${encodeURIComponent(`/pay/callback?reference=${ref}`)}`}>Sign in</Button><Button variant="outline" to="/me">Go to my space</Button></>);
  if (res.status === "failed")
    return box(<XCircle size={38} />, "Payment didn't go through", res.message || "You haven't been charged. You can try again.", <Button to="/me">Go to my space</Button>);
  if (res.purpose === "community")
    return box(
      <HeartHandshake size={38} />,
      "Welcome to the circle 💜",
      "Your membership is active. Tap below to join the private WhatsApp group — please don't share the link.",
      res.inviteUrl ? (
        <Button size="lg" variant="teal" onClick={() => window.open(res.inviteUrl!, "_blank", "noopener")}><MessageCircle size={18} /> Join the WhatsApp group</Button>
      ) : (
        <Button size="lg" to="/community/join">See my membership</Button>
      ),
    );
  return box(<CalendarCheck2 size={38} />, "You're booked 💜", "Payment confirmed. Taking you to your chat with your lawyer…", <Button to={`/messages/${res.bookingId}`}>Open chat now</Button>);
}
