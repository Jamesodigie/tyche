# Taking Tyche live

Until the steps below are done, the site runs in **preview mode** (a dark "Preview mode" bar at the top, sample lawyers, nothing saved to a server). As soon as the Supabase keys are added in Vercel, preview mode switches off and the demo data disappears.

Time needed: about 30–40 minutes.

---

## 1. Create the database (Supabase)

1. Go to **supabase.com** → sign up → **New project**.
   - Name: `tyche` · Region: **West EU (London)** or **Central EU (Frankfurt)** (closest to Nigeria) · set a strong database password and save it somewhere safe.
2. When it's ready, open **SQL Editor → New query**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy **everything**, paste it in, click **Run**. You should see "Success. No rows returned".
4. **Sign-up codes (email verification).** Everyone who reports, hires a lawyer or joins as a lawyer verifies their email with a 6-digit code. (Joining the community needs no account.)
   - **Authentication → Sign In / Providers → Email**: keep **Email** enabled and turn **Confirm email ON**. Save.
   - **Authentication → Emails → Templates → Confirm signup**: set the subject to `Your Tyche code` and replace the message with the contents of [`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html) (it shows the code with `{{ .Token }}`). Save.
   - **Authentication → Emails → SMTP Settings**: turn on custom SMTP. Supabase's built-in mailer only delivers to your own team's emails, so real users won't get codes without this. Easiest: a Gmail address with an **App password** (Google Account → Security → 2-Step Verification → App passwords) — host `smtp.gmail.com`, port `465`, username = the Gmail address, password = the 16-letter app password, sender email = the same Gmail address, sender name `Tyche`. Later you can switch to a domain sender (e.g. Resend or Zoho with hello@your-domain).
5. **Authentication → URL Configuration**:
   - Site URL: `https://YOUR-DOMAIN` (or `https://tyche-phi.vercel.app` until you have a domain)
   - Redirect URLs: add `https://YOUR-DOMAIN/**` and `https://tyche-phi.vercel.app/**`
6. **Project Settings → API Keys** — keep this tab open, you need three values for step 3:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon / publishable** key — safe to be public
   - **service_role / secret** key — ⚠️ never share this or put it anywhere except Vercel

> Password-reset emails use Supabase's built-in mailer, which only sends a few emails per hour. Before you have many users, add your own email sender under **Authentication → Emails → SMTP settings** (Resend, Brevo, Zoho, etc.).

## 2. Payments (Bachs)

1. Log in to **bachs.io** → **Developers** (developer portal).
2. Copy your **Secret key**. Start with the **sandbox** key (`sk_sandbox_…`) to test, then switch to the **live** key (`sk_live_…`). Tyche picks sandbox or live from the key itself.
3. **Webhooks → Add endpoint**: URL `https://YOUR-DOMAIN/api/bachs-webhook`. Tick at least `collection.succeeded`, `checkout.completed` and the `payout.*` events. Copy the endpoint's **signing secret** (`whsec_…`).
4. Make sure your Bachs balance settles in **NGN** (lawyer payouts are sent in naira).

How money moves: clients pay Tyche through a Bachs checkout page (card or bank transfer). When a paid session is confirmed, Tyche automatically sends **80% to the lawyer's bank** with a Bachs payout and keeps 20%. Each lawyer adds their bank in their dashboard; Bachs checks new bank accounts before the first payout, so the first one can wait until Bachs approves it. Waiting payouts retry every morning, and you can push them from **Admin → Bookings & payments → Send waiting payouts**. Bachs' own fees come out of Tyche's 20%.

## 2b. Google Sheets & Photos

New sign-ups go to your **Sign-ups** sheet, paid community members to your **Community** sheet, and every uploaded photo/file (evidence and lawyer licences) to **Google Photos** (album "Tyche uploads"). Anything Photos can't take goes to Google Drive → "Tyche uploads".

1. Open the Sign-ups sheet → **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with [`google/Code.gs`](google/Code.gs). Change `SECRET` to a long random password of your own.
3. **Project Settings (⚙️) → tick "Show appsscript.json"**, open `appsscript.json` and replace it with [`google/appsscript.json`](google/appsscript.json).
4. **Deploy → New deployment → Web app** · Execute as: **Me** · Who has access: **Anyone** → Deploy → allow access. Copy the **Web app URL**.
5. In Vercel add `GOOGLE_SCRIPT_URL` (the Web app URL) and `GOOGLE_SCRIPT_SECRET` (the same password as `SECRET`). Redeploy.
6. In Tyche go to **Admin → Settings → Test connection**, then **Send everything now** to copy anything from before.

Uploads go to **Drive** until Google Photos is switched on (optional, ~10 minutes): in Google Cloud Console create a project, enable **Photos Library API**, set up the OAuth consent screen (add yourself as a test user), then in Apps Script **Project Settings → Change project** to that project's number, and deploy a new version.

> Keep both sheets' sharing on **Restricted** (only you and your team): they contain names, emails and phone numbers. Evidence copies are very sensitive — only share the Google account with people who need it, and delete the copy too when a woman asks us to delete her evidence.

## 3. Add the keys in Vercel

Vercel → your **tyche** project → **Settings → Environment Variables**. Add each of these (Environment: **Production and Preview**):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `SUPABASE_URL` | Supabase Project URL (same as above) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role / secret key |
| `BACHS_SECRET_KEY` | Bachs secret key (`sk_sandbox_…` first, then `sk_live_…`) |
| `BACHS_WEBHOOK_SECRET` | Bachs webhook signing secret (`whsec_…`) |
| `CRON_SECRET` | Any long random text — lets Vercel's daily job retry lawyer payouts |
| `GOOGLE_SCRIPT_URL` | Your Apps Script Web app URL (step 2b) |
| `GOOGLE_SCRIPT_SECRET` | The same password as `SECRET` in Code.gs |
| `COMMUNITY_INVITE_URL` | Optional. Tyche's WhatsApp group link is already built in (shown only to paid members). Set this only if you change the group link. |
| `COMMUNITY_PRICE` | Yearly price in naira, e.g. `5000` |
| `SITE_URL` | `https://YOUR-DOMAIN` (no trailing slash) |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications — see step 3b |
| `VAPID_PUBLIC_KEY` | Same value as `VITE_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | Push notifications private key — keep secret |
| `VAPID_SUBJECT` | `mailto:you@your-domain` |

Then **Deployments → ⋯ on the latest → Redeploy**. The "Preview mode" bar should be gone.

## 3b. Push notifications (optional, 2 minutes)

1. Sign in to `/admin` → **Notifications** → **Generate keys**.
2. Copy the four values into Vercel (table above) and **Redeploy**.
3. Users and lawyers can now tap **Turn on** under "Get notified" in their dashboard. Lawyers get a notification (plus a chime in the app) when they're booked, and you can send announcements from **/admin → Notifications** to everyone, just users, or just lawyers.

On iPhone, notifications only work after Tyche is added to the Home Screen (Share → Add to Home Screen) and opened from there — that's an Apple rule.

## 4. Make yourself the admin

1. On the live site, create an account normally (e.g. via **Hire a lawyer → Choose consultation**) with your own email.
2. In Supabase **SQL Editor**, run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Go to `https://YOUR-DOMAIN/admin` and sign in. You'll approve lawyers, see users, payments and community members there, answer **Support chat**, and send **Notifications**.

## 5. Your domain

1. Buy the domain (e.g. at Vercel → Domains, Namecheap, or Whogohost for `.ng`).
2. Vercel → project → **Settings → Domains → Add** → follow the DNS records Vercel shows you.
3. Once it's live, update the domain in: `SITE_URL` (Vercel), Supabase **URL Configuration**, and the Bachs **webhook URL**. Redeploy.

## 6. Test before announcing

With the Bachs **sandbox** key:

1. In a private window, sign up as a lawyer via **For lawyers → Create a lawyer account**, add a payout bank account in the dashboard, and upload a licence.
2. As admin, approve them in **/admin → Lawyer approvals**.
3. In another private window, file a report as a client → the lawyer sends an offer → accept, pay on the Bachs sandbox checkout → you should land in the chat.
4. Join the community and check the WhatsApp invite appears.
5. Check **/admin → Bookings & payments** shows the payment and the lawyer's payout.

Then swap `BACHS_SECRET_KEY` to the live key (and the live webhook secret), redeploy, and you're open. 🎉

---

### What runs where

- **Website** (`src/`): React app on Vercel. Talks to Supabase directly for everything protected by row-level security.
- **Server functions** (`api/`): run on Vercel; the only code that sees the secret keys. Prices are always read from the database here, never trusted from the browser.
  - `POST /api/book` — creates a booking, starts the Bachs checkout (or confirms free sessions)
  - `POST /api/verify` — confirms a payment when the client returns from Bachs
  - `POST /api/bachs-webhook` — confirms payments and payout results from Bachs directly (signature-checked)
  - `GET/POST /api/community` — membership status, join + checkout, private invite link
  - `GET/POST/PUT /api/payout` — bank list; verify a lawyer's bank and save it as a Bachs payout destination; retry payouts (admin + daily cron)
  - `POST /api/sync` — copies sign-ups and uploads to Google (Apps Script)
  - `POST /api/push` — save a device for notifications; admins send announcements
- **Database rules** (`supabase/schema.sql`): who can see and change what. Tested with `supabase/tests/rls_test.py`.

### Privacy, in short

- Reports and evidence are readable only by the person who filed them (and admins).
- Approved lawyers see shared reports through an anonymised case board with no name, email or phone. A lawyer only sees a client's name once that client books them.
- Evidence files sit in a private storage bucket and open via short-lived links.
- Bookings, payments and memberships can only be created by the server after Bachs confirms the money.
