// POST /api/verify { reference } — called by the browser when Paystack sends the user back.
import { HttpError, body, db, fulfil, handler, requireUser } from "./_lib.js";

export default handler(["POST"], async (req) => {
  const me = await requireUser(req);
  const { reference } = body<{ reference?: string }>(req);
  if (!reference) throw new HttpError(400, "Missing payment reference.");
  const { data: pay } = await db().from("payments").select("user_id").eq("reference", reference).single();
  if (!pay || pay.user_id !== me.id) throw new HttpError(404, "We couldn't find that payment.");
  return fulfil(reference);
});
