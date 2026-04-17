# MLB Attendance App Product Roadmap

Last updated: 2026-04-16

## Product Thesis

This app should become the easiest way for a fan to build a durable personal record of every MLB game they attended.

The product wins if logging a game is faster than opening Notes, the record is trustworthy across devices, and the stats feel personal enough to make the fan come back even when they are not at the ballpark.

## Current Product Baseline

As of 2026-04-16, the mobile app is still a prototype:

- Expo mobile app with five tabs: Home, Log Game, History, Stats, Profile
- seeded MLB teams, venues, games, and attendance logs
- in-memory state only, so data does not survive app restarts
- create-only attendance flow with duplicate prevention
- basic derived stats and recent moments
- placeholder profile experience

Current product constraints visible in code:

- no edit or delete flow for logged games
- no local persistence, sync, backup, or account model
- tiny catalog footprint with fixed 2025 seeded games
- no onboarding, notifications, imports, or attachment support
- domain types still leak from `apps/mobile` into `packages/domain`
- no real automated test floor yet

## Strategy

The sequencing should stay strict:

1. Make the single-user logging loop trustworthy.
2. Make the record durable on device.
3. Reduce manual entry with a real catalog and import path.
4. Turn the logbook into a collectible stats product.
5. Add accounts and sync only when the local experience is solid.
6. Defer social and live context until they strengthen, not distract from, the core journal.

## Product Principles

- Personal record first: every roadmap decision should improve the quality of the fan's own logbook.
- Trust before delight: persistence, editability, and data integrity matter more than badges.
- Low-friction entry: the app should ask for as little manual data as possible at logging time.
- Stable identities: teams, venues, and games need canonical IDs before deeper analytics can be trusted.
- Offline matters: a stadium product cannot assume perfect connectivity.

## Success Metrics

Early product health should be measured with simple signals:

- time to first successful log
- percentage of logs created without leaving the log flow
- edit/delete usage rate after first save
- duplicate-save prevention rate
- seven-day retention after first logged game
- average logs per active user
- percent of active users with favorite team set
- percent of logs tied to canonical game IDs instead of manual fallback records

## Roadmap Overview

## Release 0.1: Trustworthy Personal MVP

Target window: April 16, 2026 to May 31, 2026

Goal:

- ship an experience that feels like a real personal logbook instead of a seeded demo

Must-have outcomes:

- user can create, review, edit, and delete attendance logs
- home screen clearly drives the next useful action
- profile supports favorite team and basic preferences
- empty states and success states are coherent across all tabs
- domain logic has one canonical home and a first test baseline

Core workstreams:

- product hardening
- attendance CRUD
- profile basics
- UX consistency
- engineering foundation

Ticket candidates:

- Move shared product types into `packages/domain` so the domain package no longer imports from `apps/mobile`.
- Add unit tests for attendance creation, duplicate prevention, witnessed event generation, and personal stats calculation.
- Add edit and delete controls in `History` with confirmation and optimistic UI state.
- Expand the log model with optional freeform memory, companion, giveaway, and weather notes.
- Upgrade `Home` to show last log, progress milestone, and a clear CTA when the logbook is empty.
- Replace `Profile` placeholder content with favorite team selection and lightweight app preferences.
- Add first-run onboarding with a clear explanation of what the app stores and how stats are derived.
- Standardize validation, zero states, and success feedback across `Log Game`, `History`, `Stats`, and `Home`.

Exit criteria:

- app no longer depends on demo-only assumptions in core flows
- user can correct mistakes after saving
- engineering surface is stable enough to persist data safely next

## Release 0.2: Local Persistence And Offline Reliability

Target window: June 1, 2026 to July 15, 2026

Goal:

- make the app trustworthy as a durable local record

Must-have outcomes:

- attendance logs and profile data survive app restarts
- storage schema can evolve without wiping user data
- local failures are surfaced clearly and recoverably

Core workstreams:

- storage layer
- repository abstraction
- migration support
- offline-safe behavior

Ticket candidates:

- Replace in-memory provider state with a repository backed by persistent local storage.
- Persist attendance logs, favorite team, onboarding completion, and app preferences.
- Add seeded-data bootstrap logic so demo fixtures are optional and never overwrite user-created records.
- Add storage versioning and migrations for attendance logs, notes, and future metadata fields.
- Add integrity checks for malformed local state and a recovery path for corrupted payloads.
- Add save-state messaging so the user can distinguish draft, saved, and failed actions.
- Write tests around repository reads, writes, migrations, and duplicate detection after reload.

Exit criteria:

- user history survives restarts
- data model can evolve safely
- app is dependable enough to start backfilling real attendance

## Release 0.3: Catalog Quality And Backfill

Target window: July 16, 2026 to September 15, 2026

Goal:

- remove the main manual-entry pain from logging and backfilling

Must-have outcomes:

- catalog covers normal MLB attendance scenarios across seasons
- users can search by team, venue, and date with low friction
- backfilling prior attendance is practical

Core workstreams:

- catalog expansion
- search quality
- import tooling
- identity normalization

Ticket candidates:

- Expand the catalog service beyond seeded games to season-aware MLB schedules.
- Add team, venue, season, and date filters plus stronger matchup search.
- Introduce canonical IDs for leagues, teams, venues, and games.
- Add handling for doubleheaders, postponed games, resumed games, and incomplete score states.
- Add manual fallback entries for games the catalog cannot resolve yet, but keep them visibly distinct.
- Add CSV import and guided batch entry for historical attendance backfill.
- Add fuzzy matching for venue names, abbreviations, and imperfect recollection.

Exit criteria:

- most real MLB attendance history can be logged without workarounds
- catalog identity is stable enough for long-term stats and sync

## Release 0.4: Personal Stats, Collections, And Memories

Target window: September 16, 2026 to November 30, 2026

Goal:

- turn the logbook into a product fans revisit between games

Must-have outcomes:

- stats feel deeper and more specific than a generic tracker
- collection progress creates repeat engagement
- memories become first-class, not incidental

Core workstreams:

- advanced stats
- progress systems
- richer memory objects
- visual summaries

Ticket candidates:

- Add splits by season, opponent, weekday, stadium, and section.
- Track park progress, rivalry series progress, opening day attendance, and giveaway collections.
- Expand witnessed moments from a derived label list into a richer schema with manual additions.
- Add photos or attachments after a log is saved.
- Add milestone states, badges, and recap cards that summarize personal progress.
- Build season and lifetime summary views that feel collectible, not spreadsheet-like.

Exit criteria:

- users return for stats and progress, not only for data entry
- the product has a clear identity as a fan record, not just a utility form

## Release 1.0: Account, Sync, And Backup

Target window: after local product-market fit signals are positive

Goal:

- make the personal record durable across devices without compromising offline behavior

Must-have outcomes:

- account creation and sign-in are simple
- sync respects offline-created records and duplicate conflicts
- users can export or back up their own data

Core workstreams:

- authentication
- backend data model
- sync engine
- conflict resolution
- privacy and export

Ticket candidates:

- Add low-friction auth and account recovery.
- Define backend models for users, logs, notes, collections, and derived stats.
- Implement sync semantics for offline-created and locally-edited records.
- Add export and backup options.
- Add privacy controls and account-level settings.

Exit criteria:

- users trust the app across devices
- backend contracts reflect the domain cleanly

## Release 1.1+: Optional Social And Live Context

Only start this work after Release 1.0 is stable.

Potential bets:

- shareable season recap cards
- friend comparisons or follows
- upcoming-game reminders
- collaborative memories for shared attendance
- live game context for an already selected attended game

Guardrails:

- every social feature must be opt-in
- live features cannot displace the personal record as the core product
- privacy defaults must stay conservative

## Now / Next / Later

Now:

- attendance edit/delete
- profile preferences and favorite team editing
- richer notes on a log
- domain model cleanup
- test baseline
- UX consistency across tabs

Next:

- persistent storage
- migration/versioning
- repository abstraction
- error handling and recovery
- seeded-data bootstrap rules

Later:

- full-season catalog
- CSV and batch import
- advanced collections and memories
- account sync
- social and live features

## Explicit Non-Goals For 2026

Do not spend roadmap capacity on these yet:

- ticket purchase or resale
- seat maps with exact stadium geometry
- fantasy, betting, or predictive gaming loops
- broad multi-sport expansion before MLB product fit
- chat or feed features
- aggressive notification systems before retention value is proven

## Key Product Risks

- Overbuilding social features before the single-user loop is strong
- Shipping sync before local storage and identity rules are stable
- Treating seeded fixture coverage as equivalent to real catalog support
- Letting stats logic fragment again across app and domain layers
- Adding too many logging fields before the core save flow becomes fast

## Recommended Immediate Build Order

If work starts today, the next three implementation slices should be:

1. Domain cleanup plus test baseline.
2. Attendance edit/delete and richer notes.
3. Local persistence repository with migrations.

That order keeps product trust moving forward while avoiding rework when storage lands.
