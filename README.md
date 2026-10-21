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
| `/admin` | **Admin dashboard** (passcode `tyche-admin`): overview & sign-up chart, lawyer approvals, users (search, suspend, CSV export), report moderation, bookings & payments with the 20% split, community capacity, settings |

Plus a **Quick exit** button on every page (or press Esc 3×).

## Business rules (in `src/lib/data.ts`)

- `TYCHE_FEE = 0.2` — Tyche keeps 20% of consultation and booking fees; lawyers get 80%.
- Consultation fee and booking fee are separate; either can be set free by the lawyer.
- `COMMUNITY_CAP = 10_000`, `COMMUNITY_PRICE = 5_000` (placeholder — set your real price), `COMMUNITY_MEMBERS` (demo count).

## Still front-end only

Data lives in the browser (`localStorage`, see `src/lib/store.tsx`) and the lawyers/cases are demo data. To go live, connect:

- **Auth + database + file storage** (e.g. Supabase) — replace the store functions.
- **Payments** — Paystack checkout for bookings and community, with split/subaccount payouts for the 80/20.
- **Calls / Meet** — a voice/video SDK (e.g. Daily, Agora) and Google Calendar API to create Meet links per booking.
- **WhatsApp invite** — send the group invite link after community payment.
- **Admin auth** — the `/admin` passcode (`ADMIN_PASSCODE` in `src/lib/store.tsx`) is a front-end gate for the demo only. Before launch, protect admin with real accounts and roles on the server.
- **Lawyer verification** — approvals in `/admin` currently live in the browser; persist them in the database.
