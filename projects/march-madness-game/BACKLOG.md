# Busy March Madness Backlog

## How To Use This File

This backlog translates the roadmap into executable work.

Rules:

- `Now` means active priority for the next few development cycles.
- `Next` means important, but blocked on current foundation work.
- `Later` means intentionally deferred.
- Each ticket should be small enough to complete without mixing unrelated concerns.

Status labels:

- `[todo]`
- `[doing]`
- `[blocked]`
- `[done]`

## Now

These are the highest-value items for getting to a 2027-ready web product.

### Foundation

- [done] Extract backend service modules from `server/store.js`.
  - Create `server/services/seasons.js`, `server/services/draft.js`, and `server/services/standings.js`.
  - Keep HTTP routing in `server/app.js` thin.

- [doing] Remove static season assumptions from scoring and standings logic.
  - Stop relying on global `owners` from `src/data.js` where season-owned data should drive calculations.
  - Ensure simulations and standings use the selected season state only.

- [done] Add season test fixtures.
  - Create at least two synthetic season states.
  - Cover standings, draft flow, undo, and reset behavior.

- [doing] Document local development flows.
  - Add a short setup and reset guide for running the app locally.
  - Document how current SQLite-backed persistence works and where JSON bootstrap data still fits.

### Multi-Season Foundation

- [done] Introduce SQLite and a migration system.
  - Database bootstrap exists in `server/store.js`.
  - Migration tracking exists through `schema_migrations`.
  - Legacy JSON state can seed the database on first run.

- [doing] Define the initial normalized season schema.
  - Keep `seasons` for season metadata and compatibility.
  - Add `season_owners`.
  - Add `season_teams`.
  - Add `season_draft_picks`.
  - Add `season_games`.
  - Add `season_scoring_rules`.
  - Add `audit_events`.

- [todo] Add repositories for season reads and writes.
  - Load season summary.
  - Load season detail.
  - Write draft actions by season.
  - Write season config by season.
  - Read draft history without parsing a full state blob.

- [doing] Replace blob-oriented season writes with season-scoped persistence.
  - Preserve `data/season-state.json` as bootstrap/import data only.
  - Preserve `seasons.state_json` temporarily as a compatibility layer, not the primary domain model.

- [done] Add season selector support to the API.
  - Allow requesting current season explicitly.
  - The UI can already switch season context; remaining work is historical-season product polish.

- [todo] Add explicit season creation and season rollover flows.
  - Create a new season without mutating prior seasons.
  - Allow the commissioner to mark or switch the current season.
  - Keep historical seasons browsable after rollover.

### Experience Rewrite

- [doing] Redesign the app shell around core product surfaces.
  - `Overview`
  - `Draft Room`
  - `Standings`
  - `Teams`
  - `Scoring Lab`
  - `Commissioner`

- [doing] Build a proper `Overview` surface.
  - Current leader
  - Remaining live games
  - Key path/watch items
  - Recent picks or updates
  - Explicit season context and status

- [todo] Consolidate the homepage without feature loss.
  - Shorten the initial scroll depth substantially.
  - Move secondary analytics and reference material behind clearer surface boundaries.
  - Keep top actions and top context visible without forcing users to parse the entire dashboard.
  - Preserve access to existing information while reducing homepage cognitive load.

- [doing] Finish the Draft Room layout rewrite.
  - Make draft state the dominant experience.
  - Reduce commissioner control clutter.
  - Improve readability of available vs drafted teams.

- [doing] Add mobile-first navigation.
  - Replace anchor-link navigation with a clearer phone-friendly pattern.
  - Ensure the top-level product surfaces are reachable in one tap.

- [doing] Establish a shared design system direction.
  - Typography scale
  - spacing scale
  - surface and border tokens
  - button hierarchy
  - table/card patterns

- [todo] Thin `src/main.js` further.
  - Move shell wiring into focused workspace modules.
  - Extract season selector and response-status rendering helpers.
  - Keep bootstrap and refresh orchestration small.

## Next

These items should follow once the current foundation and shell work are stable.

### Tournament Operations

- [todo] Add direct game ingestion.
  - Choose the source.
  - Normalize incoming games.
  - Store raw and normalized state by season.

- [todo] Recompute standings from stored game data only.
  - No spreadsheet dependency.
  - No hidden fallback in live paths.

- [todo] Add operational status for live data.
  - Last successful sync
  - ingestion failures
  - stale data warnings

- [todo] Add commissioner correction tools for games.
  - Manual winner correction
  - score correction
  - explicit audit trail

### Access Control

- [todo] Add commissioner authentication.
  - Login/session model
  - protected write routes

- [todo] Define product roles.
  - commissioner
  - admin
  - viewer

- [todo] Add public/read-only mode.
  - safe participant view
  - shareable routes
  - no write affordances

- [todo] Add destructive action safeguards.
  - confirmation flows
  - audit events
  - recovery paths where practical

### Platform Preparation

- [todo] Version the API.
  - Define stable response shapes for mobile use.

- [todo] Add an event model.
  - picks
  - finals
  - lead changes
  - season transitions

- [todo] Document the mobile screen inventory.
  - participant home
  - standings
  - my teams
  - draft board
  - notifications

## Later

These are valuable, but should not distract from getting the core product right first.

### Native Mobile App

- [todo] Choose the native mobile stack after the backend stabilizes.
  - React Native / Expo
  - or native iOS

- [todo] Build participant-first iPhone app.
  - live overview
  - standings
  - my teams
  - draft board
  - notifications

- [todo] Add cached offline-friendly reads for mobile.

- [todo] Add push notifications for:
  - draft picks
  - game finals
  - lead changes

### Commissioner Mobile Expansion

- [todo] Add safe mobile draft controls.
  - make pick
  - undo pick
  - lock/unlock

- [todo] Add lightweight mobile correction tools.

### Nice-To-Have Product Features

- [todo] Draft timer
- [todo] Historical comparisons
- [todo] What-if scoring sandbox
- [todo] Personalized participant landing pages
- [todo] richer visual analytics

## Recommended Order For The Next Three Work Cycles

### Cycle 1

- local dev and reset documentation
- scoring/state cleanup
- season-state isolation guidance
- roadmap/doc alignment with the current SQLite-backed runtime
- `server/app.js` response helper cleanup

### Cycle 2

- normalized season schema
- season-scoped repositories
- season creation and rollover
- compatibility-layer reduction

### Cycle 3

- new app shell
- homepage consolidation
- overview screen
- mobile navigation
- continued Draft Room simplification
- historical season browsing polish

## Current Focus Recommendation

The best immediate focus remains:

1. close the remaining documentation and state-cleanup gaps around the current SQLite runtime
2. finish the normalized multi-season backend foundation
3. keep tightening the shell and draft experience

Those efforts unlock nearly everything that follows, including a real mobile app later.
