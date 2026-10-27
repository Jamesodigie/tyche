// POST /api/sync — copies new things to the Tyche Google Apps Script (Sheets + Photos/Drive).
//   (signed in)  { }                      — your sign-up row (once verified) + your new uploads
//   (admin)      { action: "backfill" }   — everyone's missing rows and uploads, a batch at a time
//   (admin)      { action: "ping" }       — check the Google connection works
// Each item is marked when copied, so nothing is sent twice. Returns { more: true } if time ran out.
import {
  HttpError,
  body,
  db,
  env,
  handler,
  requireUser,
  toGoogle,
} from "./_lib.js";

const MAX_FILE = 20 * 1024 * 1024; // Apps Script accepts ~50MB; base64 grows files by a third
const BUDGET_MS = 40_000;

const mimeOf = (name: string, kind?: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return (
    map[ext] ||
    (kind === "image"
      ? "image/jpeg"
      : kind === "video"
        ? "video/mp4"
        : "application/octet-stream")
  );
};

/** Storage sometimes reports a generic or form type; only trust a real file type. */
const realMime = (m: string) => (/^(image|video|audio|application|text)\/[\w.+-]+$/i.test(m) && !/octet-stream/i.test(m) ? m : "");

async function download(bucket: string, path: string) {
  const { data, error } = await db().storage.from(bucket).download(path);
  if (error || !data)
    throw new Error(`download failed: ${error?.message || path}`);
  const buf = Buffer.from(await data.arrayBuffer());
  return { buf, mime: data.type || "" };
}

/** Sign-up row for one person, once their email is verified. */
async function syncSignup(userId: string): Promise<boolean> {
  const { data: p } = await db()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!p || p.google_logged_at) return false;
  const { data: au } = await db().auth.admin.getUserById(userId);
  if (au?.user && !au.user.email_confirmed_at && !au.user.confirmed_at)
    return false; // wait for the code
  // Claim first so two tabs/requests can't both send the same row.
  if (!(await claim("profiles", "id", userId, "google_logged_at")))
    return false;
  const ok = await toGoogle("signup", {
    date: p.created_at,
    name: p.name,
    email: p.email,
    phone: p.phone,
    role:
      p.role === "lawyer" ? "Lawyer" : p.role === "admin" ? "Admin" : "Client",
  }).catch(() => false);
  if (!ok) await release("profiles", "id", userId, "google_logged_at");
  return ok;
}

/** Atomically marks a row as copied (only one caller wins). */
async function claim(table: string, key: string, id: string, col: string) {
  const { data } = await db()
    .from(table)
    .update({ [col]: new Date().toISOString() })
    .eq(key, id)
    .is(col, null)
    .select(key);
  return !!data && data.length > 0;
}
async function release(table: string, key: string, id: string, col: string) {
  await db()
    .from(table)
    .update({ [col]: null })
    .eq(key, id);
}

/** Evidence files + lawyer licences not copied yet. */
async function syncFiles(
  filter: { userId?: string },
  deadline: number,
): Promise<boolean> {
  let q = db()
    .from("evidence")
    .select("*, reports(id, alias, created_at)")
    .is("google_synced_at", null)
    .order("created_at")
    .limit(25);
  if (filter.userId) q = q.eq("user_id", filter.userId);
  const { data: files } = await q;
  for (const f of files || []) {
    if (Date.now() > deadline) return true;
    if (!(await claim("evidence", "id", f.id, "google_synced_at"))) continue;
    if (f.size > MAX_FILE) continue; // too big for Apps Script — stays in Tyche's private storage (admins can open it there)
    let ok = false;
    try {
      const { buf, mime } = await download("evidence", f.path);
      const rep = (f as any).reports;
      ok = await toGoogle("file", {
        folder: "Evidence",
        name: `${rep?.id || f.report_id} - ${f.name}`,
        mime: realMime(mime) || mimeOf(f.name, f.kind),
        base64: buf.toString("base64"),
        description: `Tyche report ${rep?.id || f.report_id}${rep?.alias ? ` · ${rep.alias}` : ""} · uploaded ${new Date(f.created_at).toISOString().slice(0, 10)}`,
      });
    } catch (e) {
      console.error("evidence sync failed", e);
    }
    if (!ok) await release("evidence", "id", f.id, "google_synced_at");
  }
  let lq = db()
    .from("lawyers")
    .select("id, name, user_id, licence_path")
    .not("licence_path", "is", null)
    .is("licence_synced_at", null)
    .limit(10);
  if (filter.userId) lq = lq.eq("user_id", filter.userId);
  const { data: lws } = await lq;
  for (const l of lws || []) {
    if (Date.now() > deadline) return true;
    if (!(await claim("lawyers", "id", l.id, "licence_synced_at"))) continue;
    let ok = false;
    try {
      const { buf, mime } = await download("licences", l.licence_path);
      const name = l.licence_path.split("/").pop() || "licence";
      ok = await toGoogle("file", {
        folder: "Lawyer licences",
        name: `${l.name} - ${name}`,
        mime: realMime(mime) || mimeOf(name),
        base64: buf.toString("base64"),
        description: `Call-to-bar licence · ${l.name}`,
      });
    } catch (e) {
      console.error("licence sync failed", e);
    }
    if (!ok) await release("lawyers", "id", l.id, "licence_synced_at");
  }
  return false;
}

export default handler(["POST"], async (req) => {
  if (!env("GOOGLE_SCRIPT_URL")) return { configured: false };
  const me = await requireUser(req);
  const b = body<{ action?: string }>(req);
  const deadline = Date.now() + BUDGET_MS;

  if (b.action === "ping" || b.action === "backfill") {
    if (me.role !== "admin") throw new HttpError(403, "Admins only.");
    if (b.action === "ping") {
      const ok = await toGoogle("ping", {});
      if (!ok)
        throw new HttpError(
          502,
          "Google didn't answer. Check the script URL and that SECRET matches GOOGLE_SCRIPT_SECRET.",
        );
      return { ok: true };
    }
    const { data: people } = await db()
      .from("profiles")
      .select("id")
      .is("google_logged_at", null)
      .order("created_at")
      .limit(100);
    for (const p of people || []) {
      if (Date.now() > deadline) return { more: true };
      await syncSignup(p.id);
    }
    const more = await syncFiles({}, deadline);
    return { more };
  }

  await syncSignup(me.id);
  const more = await syncFiles({ userId: me.id }, deadline);
  return { more };
});
