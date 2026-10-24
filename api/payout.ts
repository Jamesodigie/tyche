// /api/payout — lawyers connect the bank account they get paid into.
//   GET  — list of Nigerian banks
//   POST { bankCode, accountNumber } — checks the account name with Paystack and creates/updates
//        the lawyer's Paystack subaccount. Paystack then splits every payment automatically:
//        TYCHE_PERCENT to Tyche, the rest straight to the lawyer.
import { HttpError, TYCHE_PERCENT, body, db, handler, paystack, requireUser } from "./_lib.js";

let banksCache: { at: number; list: { name: string; code: string }[] } | null = null;

export default handler(["GET", "POST"], async (req) => {
  if (req.method === "GET") {
    if (!banksCache || Date.now() - banksCache.at > 12 * 3600 * 1000) {
      const list = await paystack<{ name: string; code: string; active: boolean }[]>("/bank?country=nigeria&perPage=100");
      banksCache = { at: Date.now(), list: list.filter((b) => b.active !== false).map(({ name, code }) => ({ name, code })) };
    }
    return { banks: banksCache.list };
  }

  const me = await requireUser(req);
  const { data: lawyer } = await db().from("lawyers").select("*").eq("user_id", me.id).single();
  if (!lawyer) throw new HttpError(403, "Only lawyers can add a payout account.");

  const b = body<{ bankCode?: string; accountNumber?: string; bankName?: string }>(req);
  const acct = (b.accountNumber || "").replace(/\D/g, "");
  if (!b.bankCode || acct.length !== 10) throw new HttpError(400, "Please choose your bank and enter your 10-digit account number.");

  const resolved = await paystack<{ account_name: string }>(
    `/bank/resolve?account_number=${acct}&bank_code=${encodeURIComponent(b.bankCode)}`,
  ).catch(() => {
    throw new HttpError(400, "We couldn't verify that account. Please check the number and bank.");
  });

  const payload = {
    business_name: lawyer.name,
    settlement_bank: b.bankCode,
    account_number: acct,
    percentage_charge: TYCHE_PERCENT, // Tyche's share of each payment
    description: "Tyche lawyer payouts",
  };
  const sub = lawyer.subaccount_code
    ? await paystack<{ subaccount_code: string }>(`/subaccount/${lawyer.subaccount_code}`, { method: "PUT", body: payload })
    : await paystack<{ subaccount_code: string }>("/subaccount", { method: "POST", body: payload });

  const update = {
    subaccount_code: sub.subaccount_code || lawyer.subaccount_code,
    payout_bank: b.bankName || b.bankCode,
    payout_account_name: resolved.account_name,
    payout_last4: acct.slice(-4),
  };
  await db().from("lawyers").update(update).eq("id", lawyer.id);
  return { payoutBank: update.payout_bank, payoutAccountName: update.payout_account_name, payoutLast4: update.payout_last4 };
});
