# Hosted Migration Plan

## Goal

Make Witnessed usable across devices and by multiple people without losing the current strengths:
- fast local-feeling game entry
- rich stats and levels
- browser-first usability
- simple import/export safety rails

The current app is still a local-first product:
- auth is device-local only
- usernames and passwords are stored locally
- attendance history lives in browser/device storage
- game catalog is seeded in-app

That is good enough for prototyping and same-device sharing, but not for a hosted product.

## Current Seam

The migration seam is now the app data store layer:
- `apps/mobile/src/lib/persistence/appDataStore.ts`
- `apps/mobile/src/lib/persistence/localAppDataStore.ts`
- `apps/mobile/src/providers/AppDataProvider.tsx`

Today:
- `AppDataProvider` owns app state and screen-facing actions
- `localAppDataStore` owns session hydration, sign-in, sign-up, sign-out, and persistence to local storage

Hosted migration should replace the local store with a hosted implementation rather than pushing backend logic into screens.

## Recommended Architecture

Use a staged Supabase-first backend:
- `Supabase Auth` for email/password auth and session management
- `Postgres` for user profiles and attendance logs
- `Row Level Security` so users only access their own data
- optional `Edge Functions` later for catalog sync, import jobs, or richer stats precomputation

This is the fastest path from the current prototype to a real hosted product because it solves auth, sessions, storage, and per-user access control together.

## Staged Rollout

### Stage 0: Stabilize the boundary

Status:
- in progress

Work:
- keep screens and domain logic talking only to `AppDataProvider`
- keep persistence details behind the store contract
- keep local import/export working as the bridge off old local ledgers

Exit criteria:
- swapping store implementations does not require screen rewrites

### Stage 1: Hosted schema and auth wiring

Work:
- add Supabase client setup to `apps/mobile`
- add environment variables for project URL and anon key
- create a `hostedAppDataStore` that implements `AppDataStore`
- replace local username auth UI with email/password or username-plus-email sign-up

Minimum tables:

`users`
- managed by Supabase Auth

`profiles`
- `id uuid primary key` references auth user id
- `display_name text not null`
- `favorite_team_id text null`
- `has_completed_onboarding boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`attendance_logs`
- `id uuid primary key`
- `user_id uuid not null` references auth user id
- `game_id text not null`
- `venue_id text not null`
- `attended_on date not null`
- `seat_section text not null`
- `seat_row text null`
- `seat_number text null`
- `memorable_moment text null`
- `companion text null`
- `giveaway text null`
- `weather text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Suggested constraint:
- unique on `(user_id, game_id)`

Optional later table:

`profile_following`
- `user_id uuid not null`
- `friend_profile_id text not null`

That keeps the current social/follow model flexible while the app still uses seeded friend data.

### Stage 2: Hosted reads and writes

Work:
- hydrate profile and attendance logs from Supabase session
- write profile updates and attendance CRUD to hosted storage
- keep optimistic UI in `AppDataProvider`
- keep local fallback only for cached display state, not source of truth

Exit criteria:
- a user can sign in on two devices and see the same ledger
- refresh does not lose state

### Stage 3: Local-to-hosted migration

Work:
- detect local legacy state on first hosted sign-in
- offer `Import my existing ledger`
- upload imported logs into the hosted account
- preserve JSON import/export as a backup path

Migration rule:
- hosted account becomes source of truth once import completes

### Stage 4: Shared catalog and backfill quality

Work:
- move the game catalog out of a fixed local seed
- store all MLB final games needed for logging and backfill
- support 2021+ historical coverage cleanly
- optionally pre-index by season, team, and venue for faster search

This is critical because better auth alone does not fix the current `39 games ready to log` ceiling.

## App Changes By Layer

### UI layer

Keep current screens:
- `auth`
- `onboarding`
- `home`
- `log game`
- `history`
- `stats`
- `profile`

UI changes should be small:
- replace local username/password copy with hosted account copy
- show sync state instead of device-save language
- keep game entry fast and dominant

### Provider layer

`AppDataProvider` should remain the app-facing orchestrator for:
- hydration
- current profile
- attendance logs
- stats derivation
- optimistic updates
- error states

It should not own backend-specific query logic.

### Persistence layer

Implement two stores behind one contract:
- `localAppDataStore`
- `hostedAppDataStore`

Selection path:
- default to local in development until hosted env vars exist
- switch to hosted when backend is configured

## Suggested Supabase Mapping

`UserProfile`
- `id` -> `profiles.id`
- `displayName` -> `profiles.display_name`
- `favoriteTeamId` -> `profiles.favorite_team_id`
- `hasCompletedOnboarding` -> `profiles.has_completed_onboarding`

`AttendanceLog`
- `id` -> `attendance_logs.id`
- `userId` -> `attendance_logs.user_id`
- `gameId` -> `attendance_logs.game_id`
- `venueId` -> `attendance_logs.venue_id`
- `attendedOn` -> `attendance_logs.attended_on`
- `seat.section` -> `attendance_logs.seat_section`
- `seat.row` -> `attendance_logs.seat_row`
- `seat.seatNumber` -> `attendance_logs.seat_number`
- `memorableMoment` -> `attendance_logs.memorable_moment`
- `companion` -> `attendance_logs.companion`
- `giveaway` -> `attendance_logs.giveaway`
- `weather` -> `attendance_logs.weather`

## Risks To Manage

### Auth complexity

Local usernames do not map cleanly to production auth. Avoid carrying them forward as the primary identity. Use email-based auth and treat old usernames as display names if needed.

### Stats freshness

Stats are derived client-side today. Keep that for the first hosted version so product behavior stays stable. Only move stats server-side if scale or performance forces it.

### Catalog incompleteness

Hosted auth without a complete game catalog still produces a frustrating logging experience. Catalog expansion needs to happen in parallel with hosted work.

### Offline behavior

The current app feels instant because everything is local. Hosted writes need optimistic UI and retry states so game entry still feels easier than adding a note.

## Implementation Order

1. Keep the new store boundary and finish any provider cleanup.
2. Add Supabase client configuration and environment handling.
3. Create database schema and row-level security.
4. Implement `hostedAppDataStore` for auth, hydration, and CRUD.
5. Swap auth screen copy and flow from local usernames to hosted accounts.
6. Add local-ledger import into hosted accounts.
7. Expand the game catalog beyond the current 39-game seed.

## Definition Of Done For Hosted V1

Hosted V1 is done when:
- a new user can create an account and log a game from another device later
- a returning user sees the same profile, stats, and history everywhere
- local legacy users can import their existing ledger
- the app still feels fast when logging a game
- profile and attendance data are no longer device-bound
