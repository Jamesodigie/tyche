// DELETE /api/account — permanently deletes the signed-in person's Tyche account.
// The app checks their password first. Removes their uploaded files and the account;
// database rows go with it (reports, evidence, messages, bookings…). Payment records stay,
// without the name attached, because the law requires us to keep them.
import { HttpError, db, handler, requireUser } from "./_lib.js";

async function removeFolder(bucket: string, folder: string) {
  const store = db().storage.from(bucket);
  // Walk one level of sub-folders (evidence is stored as <user>/<report>/<file>).
  const { data: top } = await store.list(folder, { limit: 1000 });
  const paths: string[] = [];
  for (const item of top || []) {
    if (item.id) paths.push(`${folder}/${item.name}`);
    else {
      const { data: inner } = await store.list(`${folder}/${item.name}`, { limit: 1000 });
      for (const f of inner || []) if (f.id) paths.push(`${folder}/${item.name}/${f.name}`);
    }
  }
  for (let i = 0; i < paths.length; i += 100) await store.remove(paths.slice(i, i + 100));
  return paths.length;
}

export default handler(["DELETE"], async (req) => {
  const me = await requireUser(req);
  if (me.role === "admin") throw new HttpError(400, "Admin accounts can't be deleted here. Ask another admin to remove you first.");

  // Don't strand someone who has a paid session coming up.
  const today = new Date().toISOString().slice(0, 10);
  const { data: lawyer } = await db().from("lawyers").select("id").eq("user_id", me.id).maybeSingle();
  let q = db().from("bookings").select("id").eq("status", "confirmed").gte("date", today);
  q = lawyer ? q.or(`client_id.eq.${me.id},lawyer_id.eq.${lawyer.id}`) : q.eq("client_id", me.id);
  const { data: upcoming } = await q.limit(1);
  if (upcoming?.length)
    throw new HttpError(409, "You have an upcoming session. Please finish or cancel it first, or message support and we'll help.");

  let files = 0;
  for (const bucket of ["evidence", "licences", "avatars"]) files += await removeFolder(bucket, me.id).catch(() => 0);

  // Note for the team: copies in the private Google backup (Sheets/Photos/Drive) are removed by hand.
  await db().from("admin_log").insert({ actor: null, text: `Account deleted by its owner: ${me.email} (${me.role}). ${files} file(s) removed from Tyche storage. Remove their rows/files from the Google backup.` });

  const { error } = await db().auth.admin.deleteUser(me.id);
  if (error) throw new HttpError(500, "We couldn't delete your account. Please message support.");
  return { deleted: true };
});
