// /api/payout — lawyers connect the bank account their 80% is paid into (via Bachs).
//   GET  — list of Nigerian banks
//   POST { bankCode, accountNumber, bankName } — checks the account name with Bachs and saves it as
//        the lawyer's Bachs payout destination. Every paid session then pays the lawyer automatically.
//   PUT  (admins) — retry payouts that haven't gone out yet. Also run daily by Vercel Cron (GET with CRON_SECRET).
import { HttpError, bachs, body, db, env, handler, requireUser, runPayouts } from "./_lib.js";

let banksCache: { at: number; list: { name: string; code: string }[] } | null = null;

export default handler(["GET", "POST", "PUT"], async (req) => {
  // Daily cron: Vercel sends "Authorization: Bearer <CRON_SECRET>".
  const cron = env("CRON_SECRET");
  if (req.method === "GET" && cron && req.headers.authorization === `Bearer ${cron}`) return { ran: await runPayouts() };

  if (req.method === "GET") {
    if (!banksCache || Date.now() - banksCache.at > 12 * 3600 * 1000) {
      const out = await bachs<{ banks: { name: string; code: string }[] }>("/v1/reference/banks?country=NG");
      const clean = (t: string) => t.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
      banksCache = { at: Date.now(), list: (out.banks || []).map(({ name, code }) => ({ name: clean(name), code })).sort((a, b) => a.name.localeCompare(b.name)) };
    }
    return { banks: banksCache.list };
  }

  const me = await requireUser(req);

  if (req.method === "PUT") {
    if (me.role !== "admin") throw new HttpError(403, "Only admins can run payouts.");
    return { ran: await runPayouts() };
  }

  const { data: lawyer } = await db().from("lawyers").select("*").eq("user_id", me.id).single();
  if (!lawyer) throw new HttpError(403, "Only lawyers can add a payout account.");

  const b = body<{ bankCode?: string; accountNumber?: string; bankName?: string }>(req);
  const acct = (b.accountNumber || "").replace(/\D/g, "");
  if (!b.bankCode || acct.length !== 10) throw new HttpError(400, "Please choose your bank and enter your 10-digit account number.");

  const resolved = await bachs<{ resolved: boolean; account_name: string | null; message: string | null }>("/v1/misc/bank-accounts/resolve", {
    method: "POST",
    body: { account_number: acct, bank_code: b.bankCode, country: "NG" },
  }).catch(() => ({ resolved: false, account_name: null, message: null }));
  if (!resolved.resolved || !resolved.account_name)
    throw new HttpError(400, resolved.message || "We couldn't verify that account. Please check the number and bank.");

  const dest = await bachs<{ id: string; status?: string }>("/v1/payouts/destinations", {
    method: "POST",
    idempotencyKey: `TYD_${lawyer.id}_${b.bankCode}_${acct}`,
    body: {
      currency: "NGN",
      type: "bank_account",
      account_number: acct,
      bank_code: b.bankCode,
      account_name: resolved.account_name,
      bank_name: b.bankName || null,
      label: `Tyche lawyer · ${lawyer.name}`.slice(0, 80),
      metadata: { lawyer_id: lawyer.id },
    },
  });

  const update = {
    payout_destination: dest.id,
    payout_bank: b.bankName || b.bankCode,
    payout_account_name: resolved.account_name,
    payout_last4: acct.slice(-4),
  };
  const { error } = await db().from("lawyers").update(update).eq("id", lawyer.id);
  if (error) throw new HttpError(500, `Couldn't save your bank details: ${error.message}`);
  // Anything that was waiting for this lawyer's bank can go now (or once Bachs approves it).
  runPayouts().catch(() => {});
  return { payoutBank: update.payout_bank, payoutAccountName: update.payout_account_name, payoutLast4: update.payout_last4 };
});
