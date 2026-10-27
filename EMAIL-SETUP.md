# Tyche transactional email setup

This feature is in branch `feat/transactional-emails`. It adds a database-backed queue and a protected Vercel worker. Configure and test it on a Preview deployment before merging to production.

## Email events implemented

- Supabase Auth: welcome/verification code and password reset templates.
- Welcome after email verification.
- Report saved.
- Lawyer offer received.
- Booking confirmed (client and lawyer).
- Booking reminders at 24 hours and 1 hour (client and lawyer).
- Booking cancelled.
- Payment received and payment not completed.

Application emails deliberately omit report descriptions, allegations, uploaded evidence and other sensitive details.

## 1. Verify the sending domain in Resend

1. Sign in to https://resend.com and add `gettyche.com.ng`.
2. Add the exact DNS records Resend displays at your domain DNS provider. Do not guess the records.
3. Wait until Resend shows the domain as verified. Confirm SPF/DKIM are verified.
4. Create a server-side API key for Tyche.

Use a sender such as `notifications@gettyche.com.ng`. Set up a real support inbox to receive replies.

## 2. Add Vercel environment variables

In Vercel → Tyche → Settings → Environment Variables, set these for Production and Preview as appropriate:

- `RESEND_API_KEY`: the Resend API key (server-side only).
- `TYCHE_EMAIL_FROM`: `Tyche <notifications@gettyche.com.ng>`
- `TYCHE_EMAIL_REPLY_TO`: a monitored support inbox, e.g. `support@gettyche.com.ng`
- `SITE_URL`: `https://gettyche.com.ng`
- `CRON_SECRET`: a long random secret. Keep the existing value if the payout cron already uses it; do not rotate it without updating dependent jobs.

Never use a `VITE_` prefix for secrets. Never put the Resend API key in browser code.

## 3. Apply the database migration

1. Open the Tyche Supabase project.
2. Go to SQL Editor → New query.
3. Open `supabase/email-notifications.sql` in this branch, copy all its contents, paste it into SQL Editor and run it once.
4. Confirm it completes without an error. It creates the private `tyche_email_jobs` queue and database triggers.

The worker uses the existing server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables. Never paste the service-role key into chat or browser code.

## 4. Configure Supabase Auth emails

1. In Supabase → Authentication → Emails → SMTP Settings, enable custom SMTP and configure it using Resend's current SMTP details from its dashboard.
2. In Authentication → URL Configuration, set Site URL to `https://gettyche.com.ng` and ensure the deployed domain and password-reset redirect are allowed.
3. In Authentication → Emails → Templates:
   - **Confirm signup**: use `supabase/email-templates/confirm-signup.html`. It includes `{{ .Token }}`, so the existing six-digit verification-code flow continues to work.
   - **Reset password**: use `supabase/email-templates/reset-password.html`. It uses `{{ .ConfirmationURL }}`; keep the reset-password redirect URL allowed by Supabase.
4. Save and test with an account you control.

The confirmation template is the welcome/verification message. A separate welcome email is queued after Supabase confirms the email address.

## 5. Schedule the email worker

The protected endpoint is `GET /api/email-worker`. It checks `Authorization: Bearer <CRON_SECRET>`, processes up to 50 due jobs per run and retries transient failures up to five attempts.

To avoid breaking deployments on Vercel plans that do not support frequent cron schedules, the email worker is not added to vercel.json by default. Use an external scheduler such as cron-job.org to run it every five minutes. If your Vercel plan supports a five-minute Cron Job, you can add this schedule in vercel.json:

- URL: `https://gettyche.com.ng/api/email-worker`
- Method: GET
- Frequency: every 5 minutes
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

Do not put the secret in the URL. Use the same `CRON_SECRET` as Vercel. A successful run returns a summary such as `{"ok":true,"sent":2,"skipped":0,"failed":0,"checked":2}`.

## 6. Test in this order

1. Deploy the branch to a Vercel Preview deployment first.
2. Create a test account. Verify the code email arrives, then check that the separate welcome email arrives.
3. Request a password reset and follow the reset link.
4. Save a test report; check for “Your report has been saved”.
5. Submit a lawyer offer; check the report owner's inbox.
6. Make a free test booking or complete a Bachs sandbox payment. Confirm both client and lawyer receive the booking email.
7. Complete a Bachs sandbox payment and confirm the payment receipt only arrives after the database payment status becomes `success`.
8. Create a confirmed test booking more than 24 hours away. Inspect `public.tyche_email_jobs` and confirm the two reminder times are queued for both participants. Use test accounts only.
9. Check Resend → Emails and the queue table for failures.

Inspect queue status with:

```sql
select event_type, status, scheduled_at, attempts, last_error, created_at
from public.tyche_email_jobs
order by created_at desc
limit 50;
```

## Notes

- Payment receipt emails are queued only when a payment row changes to `success`; a browser redirect alone cannot trigger a receipt.
- Reminder jobs are created when a booking becomes confirmed. If Tyche later adds rescheduling, reminder jobs must be refreshed when date/time changes.
- Verify Resend's domain and configure Supabase custom SMTP before relying on production delivery.
