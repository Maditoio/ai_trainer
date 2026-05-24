# AI Trainer

Web platform for image labeling and quiz tasks with tiered USDT platform rewards, internal wallet, and admin management.

## Stack

- Next.js (App Router) on Vercel
- Neon Postgres via Vercel Postgres (`POSTGRES_URL`)
- Vercel Blob for task images
- Drizzle ORM + Auth.js (credentials)

## Setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` from Vercel Postgres (or `POSTGRES_URL`).
2. Install dependencies: `npm install`
3. Fresh database (wipes **all** tables in `public`, reapplies schema, seeds):

   ```bash
   npm run db:fresh
   ```

   Use this when you have an old/conflicting schema. This uses `pg` over TCP and avoids the drizzle-kit “websocket” terminal error.

4. Or step by step: `npm run db:reset` → **`npm run db:migrate`** → `npm run db:seed`  
   **Important:** `db:reset` deletes all tables — you must run `db:migrate` before `db:seed`.
5. Run dev: `npm run dev`

## Vercel deployment

1. Import repo and add **Vercel Postgres** + **Blob** storage.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Deploy, then run `npm run db:push` and `npm run db:seed` against production DB (or use Vercel CLI).

## Features

- **Free training**: 3 questions, 1/day, 1 USDT bonus on completion
- **Tasks**: Admin-created image label / multiple choice questions
- **Tiers**: Daily limits and per-question USDT rewards; upgrade via wallet
- **Wallet**: Internal ledger; deposit requests approved by admin

Platform balances are not on-chain cryptocurrency until integrated later.

## Default admin (after seed)

Uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env (see seed script).
