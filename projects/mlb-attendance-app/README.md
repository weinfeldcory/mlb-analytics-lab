# MLB Attendance App

Expo + TypeScript attendance tracker that now supports a browser-first web experience alongside the existing mobile shell.

Current product slice includes:
- responsive navigation and page shell for web
- attendance dashboard with seeded MLB history and derived stats
- game search and attendance logging flow
- editable history logbook
- profile preferences plus local import/export tools
- lightweight local multi-user gating on a shared browser/device
- shared domain package for attendance and stat calculations

## Run It

From `projects/mlb-attendance-app`:

```bash
corepack pnpm install
corepack pnpm run dev:web
```

Other useful commands:

```bash
corepack pnpm run dev
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build:web
```

## Hosted Setup

To make the app usable from other devices:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
3. In Supabase Auth, use email/password auth and disable email confirmation if you want sign-up to open the ledger immediately for friends.
4. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:
   - `EXPO_PUBLIC_APP_DATA_BACKEND=hosted`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Start the web app with `corepack pnpm run dev:web` or export it with `corepack pnpm run build:web`.

Once those env vars are present, the app switches from local persistence to hosted account storage automatically.

## Deploy The URL

### Fastest tonight: GitHub Pages

This repo now includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

To use it:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql).
3. In GitHub repo settings for `weinfeldcory/sports-games-and-mlb-analytics-lab`:
   - enable `Pages` with source `GitHub Actions`
   - add repository variable `EXPO_PUBLIC_SUPABASE_URL`
   - add repository secret `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Push `main`.

Expected URL:

`https://weinfeldcory.github.io/sports-games-and-mlb-analytics-lab/`

The Pages deploy builds with:
- `EXPO_PUBLIC_APP_DATA_BACKEND=hosted`
- `EXPO_PUBLIC_BASE_URL=/sports-games-and-mlb-analytics-lab`

### Alternative: Vercel

If you prefer Vercel, this repo also includes [`vercel.json`](./vercel.json).

Build settings:
- build command: `corepack pnpm run build:web`
- publish directory: `apps/mobile/dist`

## Notes

- Without hosted env vars, data stays local to the browser or device.
- With hosted env vars, auth and attendance data move to Supabase-backed accounts.
- The web app runs through Expo web, so the same app shell continues to work for mobile.

Planning docs:
- `PRODUCT_ROADMAP_MOBILE.md`
- `HOSTED_MIGRATION_PLAN.md`
