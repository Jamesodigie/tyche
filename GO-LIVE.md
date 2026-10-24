# Taking Tyche live

Until the steps below are done, the site runs in **preview mode** (a dark "Preview mode" bar at the top, sample lawyers, nothing saved to a server). As soon as the Supabase keys are added in Vercel, preview mode switches off and the demo data disappears.

Time needed: about 30–40 minutes.

---

## 1. Create the database (Supabase)

1. Go to **supabase.com** → sign up → **New project**.
   - Name: `tyche` · Region: **West EU (London)** or **Central EU (Frankfurt)** (closest to Nigeria) · set a strong database password and save it somewhere safe.
2. When it's ready, open **SQL Editor → New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy **everything**, paste it in, click **Run**. You should see "Success. No rows returned".
4. **Authentication → Sign In / Providers → Email**:
   - Keep **Email** enabled.
   - Turn **Confirm email OFF** for launch (recommended). Tyche asks people to create an account in the middle of reporting or booking — an email-confirmation detour loses people at a hard moment. You can turn it on later; the app handles both.
5. **Authentication → URL Configuration**:
   - Site URL: `https://YOUR-DOMAIN` (or `https://tyche-phi.vercel.app` until you have a domain)
   - Redirect URLs: add `https://YOUR-DOMAIN/**` and `https://tyche-phi.vercel.app/**`
6. **Project Settings → API Keys** — keep this tab open, you need three values for step 3:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon / publishable** key — safe to be public
   - **service_role / secret** key — ⚠️ never share this or put it anywhere except Vercel

> Password-reset emails use Supabase's built-in mailer, which only sends a few emails per hour. Before you have many users, add your own email sender under **Authentication → Emails → SMTP settings** (Resend, Brevo, Zoho, etc.).

## 2. Payments (Paystack)

1. In the Paystack dashboard go to **Settings → API Keys & Webhooks**.
2. Copy your **Secret key**. Start with the **Test** secret key (`sk_test_…`) so you can try a booking with Paystack's test card, then switch to the **Live** key (`sk_live_…`).
3. Set **Webhook URL** (test and live) to: `https://YOUR-DOMAIN/api/paystack-webhook`
   This confirms payments even if someone closes their browser before returning to Tyche.

How money moves: each lawyer adds their bank account in their dashboard. Tyche creates a Paystack **subaccount** for them with a 20% charge, so every payment is split automatically — **80% settles to the lawyer, 20% to you**, on Paystack's normal settlement schedule. Tyche pays the Paystack transaction fee out of its 20%. If a lawyer hasn't added a bank account yet, the full amount comes to you and you pay them out manually.

> If you'd rather hold lawyers' money until a session has happened (and refund no-shows), that needs Paystack's manual settlement on subaccounts — ask and I'll switch it.

## 3. Add the keys in Vercel

Vercel → your **tyche** project → **Settings → Environment Variables**. Add each of these (Environment: **Production and Preview**):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `SUPABASE_URL` | Supabase Project URL (same as above) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role / secret key |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_…` first, then `sk_live_…`) |
| `COMMUNITY_INVITE_URL` | Your WhatsApp group invite link (`https://chat.whatsapp.com/…`) — shown only to paid members |
| `COMMUNITY_PRICE` | Yearly price in naira, e.g. `5000` |
| `COMMUNITY_CAP` | `10000` |
| `SITE_URL` | `https://YOUR-DOMAIN` (no trailing slash) |

Then **Deployments → ⋯ on the latest → Redeploy**. The "Preview mode" bar should be gone.

## 4. Make yourself the admin

1. On the live site, create an account normally (e.g. via **Hire a lawyer → Choose consultation**) with your own email.
2. In Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Go to `https://YOUR-DOMAIN/admin` and sign in. You'll approve lawyers, see users, payments and community members there.

## 5. Your domain

1. Buy the domain (e.g. at Vercel → Domains, Namecheap, or Whogohost for `.ng`).
2. Vercel → project → **Settings → Domains → Add** → follow the DNS records Vercel shows you.
3. Once it's live, update the domain in: `SITE_URL` (Vercel), Supabase **URL Configuration**, and the Paystack **webhook URL**. Redeploy.

## 6. Test before announcing

With the Paystack **test** key:

1. In a private window, sign up as a lawyer via **For lawyers → Create a lawyer account**, add a payout account in the dashboard (test mode accepts Paystack's test bank details), and upload a licence.
2. As admin, approve them in **/admin → Lawyer approvals**.
3. In another private window, file a report as a client → the lawyer sends an offer → accept, pay with Paystack's test card → you should land in the chat.
4. Join the community and check the WhatsApp invite appears.
5. Check **/admin → Bookings & payments** shows the split.

Then swap `PAYSTACK_SECRET_KEY` to the live key, redeploy, and you're open. 🎉

---

### What runs where

- **Website** (`src/`): React app on Vercel. Talks to Supabase directly for everything protected by row-level security.
- **Server functions** (`api/`): run on Vercel; the only code that sees the secret keys. Prices are always read from the database here, never trusted from the browser.
  - `POST /api/book` — creates a booking, starts the Paystack checkout (or confirms free sessions)
  - `POST /api/verify` — confirms a payment when the client returns from Paystack
  - `POST /api/paystack-webhook` — confirms payments from Paystack directly (signature-checked)
  - `GET/POST /api/community` — membership status, join + checkout, private invite link
  - `GET/POST /api/payout` — bank list; verify a lawyer's account and create their Paystack subaccount
- **Database rules** (`supabase/schema.sql`): who can see and change what. Tested with `supabase/tests/rls_test.py`.

### Privacy, in short

- Reports and evidence are readable only by the person who filed them (and admins).
- Approved lawyers see shared reports through an anonymised case board with no name, email or phone. A lawyer only sees a client's name once that client books them.
- Evidence files sit in a private storage bucket and open via short-lived links.
- Bookings, payments and memberships can only be created by the server after Paystack confirms the money.
