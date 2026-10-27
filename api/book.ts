// POST /api/book — create a booking with a lawyer. Prices are always taken from the
// database (never from the browser). Free sessions are confirmed immediately; paid
// ones return a Bachs checkout URL. After payment the lawyer's share is paid out automatically.
import { HttpError, TYCHE_PERCENT, afterBookingConfirmed, body, db, handler, reference, requireUser, startPayment } from "./_lib.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Input = {
  lawyerId?: string;
  kind?: "consultation" | "booking";
  date?: string;
  time?: string;
  channel?: "call" | "chat" | "meet";
  note?: string;
  reportId?: string;
  bidId?: string;
};

export default handler(["POST"], async (req) => {
  const me = await requireUser(req);
  const b = body<Input>(req);

  if (!b.lawyerId || !b.date || !b.time || !b.channel) throw new HttpError(400, "Please choose a day, time and how you'd like to talk.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) throw new HttpError(400, "That date doesn't look right.");
  if (!/^\d{1,2}:\d{2}(am|pm)$/.test(b.time)) throw new HttpError(400, "That time doesn't look right.");

  const { data: lawyer } = await db().from("lawyers").select("*").eq("id", b.lawyerId).eq("status", "approved").single();
  if (!lawyer) throw new HttpError(404, "This lawyer isn't taking bookings right now.");
  if (lawyer.user_id === me.id) throw new HttpError(400, "You can't book yourself.");
  if (!lawyer.channels.includes(b.channel)) throw new HttpError(400, "This lawyer doesn't offer that way of talking.");

  const day = new Date(`${b.date}T12:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (day.getTime() < today.getTime()) throw new HttpError(400, "Please pick a future date.");
  if (!lawyer.days.includes(DAYS[day.getUTCDay()])) throw new HttpError(400, "The lawyer isn't available on that day.");

  // Price: from the accepted offer, or from the lawyer's listed fees.
  let kind = b.kind === "booking" ? "booking" : "consultation";
  let fee = kind === "consultation" ? (lawyer.consult_free ? 0 : lawyer.consult_fee) : lawyer.booking_free ? 0 : lawyer.booking_fee;
  let reportId: string | null = null;

  if (b.bidId) {
    const { data: bid } = await db().from("bids").select("*, reports(user_id)").eq("id", b.bidId).single();
    if (!bid || bid.lawyer_id !== lawyer.id || (bid as any).reports?.user_id !== me.id) throw new HttpError(404, "That offer isn't available.");
    if (bid.status === "declined") throw new HttpError(400, "You declined this offer.");
    kind = bid.kind;
    fee = bid.free ? 0 : bid.fee;
    reportId = bid.report_id;
  }
  if (b.reportId) {
    const { data: rep } = await db().from("reports").select("id, user_id").eq("id", b.reportId).single();
    if (!rep || rep.user_id !== me.id) throw new HttpError(404, "We couldn't find that report.");
    reportId = rep.id;
  }

  // Slot taken? (confirmed bookings, or someone mid-checkout in the last 30 minutes)
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: clash } = await db()
    .from("bookings")
    .select("id, status, created_at")
    .eq("lawyer_id", lawyer.id)
    .eq("date", b.date)
    .eq("time", b.time)
    .in("status", ["confirmed", "completed", "pending_payment"]);
  if ((clash || []).some((c) => c.status !== "pending_payment" || c.created_at > since))
    throw new HttpError(409, "Someone just booked that time. Please pick another slot.");

  const note = (b.note || "").trim().slice(0, 4000) || null;
  const { data: booking, error } = await db()
    .from("bookings")
    .insert({
      client_id: me.id,
      lawyer_id: lawyer.id,
      client_name: me.name || "Client",
      kind,
      date: b.date,
      time: b.time,
      channel: b.channel,
      fee,
      status: fee > 0 ? "pending_payment" : "confirmed",
      report_id: reportId,
      bid_id: b.bidId || null,
      meet_link: b.channel === "meet" ? lawyer.meet_link : null,
      note,
    })
    .select("*, lawyers(user_id)")
    .single();
  if (error || !booking) throw new HttpError(500, error?.message || "Couldn't create the booking.");

  if (fee === 0) {
    await afterBookingConfirmed(booking);
    return { bookingId: booking.id, status: "confirmed" };
  }

  if (!me.email) throw new HttpError(400, "Please add an email address to your account to pay.");
  const ref = reference("TYB");
  const tyche = Math.round((fee * TYCHE_PERCENT) / 100);
  await db().from("payments").insert({
    reference: ref,
    purpose: "booking",
    user_id: me.id,
    booking_id: booking.id,
    amount: fee,
    tyche_share: tyche,
    lawyer_share: fee - tyche,
  });
  await db().from("bookings").update({ paystack_reference: ref }).eq("id", booking.id);

  const payUrl = await startPayment({
    req,
    reference: ref,
    email: me.email,
    name: me.name || undefined,
    amountNaira: fee,
    description: `${kind === "booking" ? "Booking" : "Consultation"} with ${lawyer.name}`,
    metadata: { purpose: "booking", booking_id: booking.id, user_id: me.id, lawyer: lawyer.name },
  });
  return { bookingId: booking.id, status: "pending_payment", payUrl, reference: ref };
});
