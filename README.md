# Tyche

Safety, support and justice for women in Nigeria — keep evidence safe, talk to a verified lawyer, report when ready, and join a private community.

## Run it

```bash
npm install
npm run dev      # local
npm run build    # production build in /dist
```

React 18 + Vite + TypeScript + Tailwind. Deploys as a static site (Vercel / Netlify configs included for client-side routing).

## What's in it

| Path | What it does |
|---|---|
| `/` | Landing page + "What brings you here?" welcome bubbles on first load |
| `/report` | Report harassment: private account → what happened → evidence upload / voice note → who sees it → submit |
| `/report/sent/:id` | Confirmation + lawyer offers (bids) as they arrive |
| `/hire` | Choose **consultation** or **booking**, quick sign-up, or sign in |
| `/lawyers` | Browse/filter verified lawyers by type, area, state, free-only |
| `/lawyers/:id` | Lawyer profile: fees, availability, channels, reviews |
| `/book/:id` | Booking flow: type → date/time/channel (call, chat, Google Meet in Tyche) → account → pay Tyche |
| `/community`, `/community/join` | Paid WhatsApp circle (10,000 cap): details → house rules → pay → invite |
| `/join/lawyer` | Lawyer sign-up: details → practice & licence → fees (free toggles, 80/20 preview) → availability → review |
| `/lawyer/dashboard` | Case board (see evidence, bid), offers, bookings, earnings (20% Tyche fee), fees & hours editor |
| `/me` | Client space: offers, bookings, reports & evidence vault, community status |
| `/messages`, `/session/:id` | In-app chat, voice call and Meet rooms |
| `/how-it-works`, `/for-lawyers`, `/safety`, `/about`, `/signin` | Supporting pages |
| `/admin` | **Admin dashboard** (admin accounts in live mode; passcode `tyche-admin` in preview): overview & sign-up chart, lawyer approvals, users (search, suspend, CSV export), report moderation, bookings & payments with the 20% split, community capacity, settings |

Plus a **Quick exit** button on every page (or press Esc 3×).

## Installable app (PWA)

Tyche installs to the home screen on Android, iPhone and desktop:

- Manifest, icons (incl. maskable) and shortcuts (Report, Hire a lawyer, Messages, My space) are set in `vite.config.ts`; icons live in `public/icons/`.
- A service worker caches only the app shell and static assets, so Tyche opens offline. It never caches user data.
- An install sheet appears once (snoozed 14 days) — native prompt on Android/Chrome, step-by-step on iPhone. "Get the app" also lives in the mobile menu and footer.
- When a new version deploys, users see a "Refresh" toast.
- On phones there's a bottom tab bar; the layout respects notches/safe areas when installed.

The site must be served over **HTTPS** to be installable (Vercel/Netlify do this automatically).

## Business rules (in `src/lib/data.ts`)

- `TYCHE_FEE = 0.2` — Tyche keeps 20% of consultation and booking fees; lawyers get 80%.
- Consultation fee and booking fee are separate; either can be set free by the lawyer.
- `COMMUNITY_CAP = 10_000`, `COMMUNITY_PRICE = 5_000` (placeholder — set your real price), `COMMUNITY_MEMBERS` (demo count).

## Going live

Tyche runs in **preview mode** (sample data in the browser) until Supabase keys are set. Follow **[GO-LIVE.md](GO-LIVE.md)** to connect:

- **Supabase** — accounts, database, private evidence storage, realtime chat. Schema + security rules: `supabase/schema.sql` (tests: `supabase/tests/rls_test.py`).
- **Paystack** — checkout for bookings and the community, with automatic 80/20 split via lawyer subaccounts (`api/`).
- **Admin** — real admin accounts (`profiles.role = 'admin'`) instead of the preview passcode.

Sessions run in a private in-app video/voice room (Jitsi) or on the lawyer's Google Meet link.
