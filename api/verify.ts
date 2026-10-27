// POST /api/verify { reference } — called by the browser when Paystack sends the user back.
// Booking payments need the account that paid. Community payments can be guests: the reference
// (only known to the payer) is enough to confirm them.
import { HttpError, body, db, fulfil, handler, requireUser } from "./_lib.js";

export default handler(["POST"], async (req) => {
  const { reference } = body<{ reference?: string }>(req);
  if (!reference) throw new HttpError(400, "Missing payment reference.");
  const { data: pay } = await db().from("payments").select("user_id, purpose").eq("reference", reference).single();
  if (!pay) throw new HttpError(404, "We couldn't find that payment.");
  if (pay.user_id || pay.purpose !== "community") {
    const me = await requireUser(req);
    if (pay.user_id !== me.id) throw new HttpError(404, "We couldn't find that payment.");
  }
  return fulfil(reference);
});
