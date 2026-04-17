# Busy March Madness 2027 Roadmap

## Purpose

Define the product standard for the 2027 tournament and the sequence required to get there.

This file is the year-specific bridge between:

- `PRODUCT_SPEC.md` for product requirements
- `PRODUCT_ROADMAP_MOBILE.md` for long-range platform sequencing
- `BACKLOG.md` for execution-level ticketing

## 2027 Product Standard

The 2027 version should be:

- reliable enough to run draft night without fallback tabs or spreadsheet rescue steps
- clear enough that participants prefer it over the spreadsheet during the tournament
- consolidated enough that the homepage is fast to scan and does not require long-scroll interpretation
- structured enough that a new season can be launched without code edits
- safe enough that commissioner actions are authenticated, explicit, and recoverable
- durable enough that the 2027 work becomes the foundation for later mobile products

## 2027 Exit Criteria

The 2027 product bar is met when all of the following are true:

- the season can be configured inside the app
- the live draft can be run entirely inside the app on desktop and phone
- standings and scoring are computed from app-owned backend data
- the product supports season-scoped persistence instead of one mutable JSON document
- commissioner workflows require authentication
- participants have a clean read-only view for following the pool
- the homepage surfaces the most important information and actions without hiding existing functionality
- season rollover does not require destructive resets or code changes

## Current Status As Of April 15, 2026

Completed:

- backend service boundaries exist for draft, season, and standings flows
- the app already supports backend-persisted draft actions and season configuration
- the product shell has been split into overview, draft room, and detail workspaces
- automated tests cover scoring plus core season and draft service behavior
- runtime season state now boots into SQLite with season summaries and current-season selection

In progress:

- the shell rewrite is partially complete, but the information architecture is still heavier than the target 2027 product
- season logic is more modular, but persistence still stores one large `state_json` blob per season instead of normalized season tables
- scoring analysis is present, but the live product still needs a cleaner balance between operations and scoring-lab depth
- API season selection exists, but the UI and service model still need explicit historical-season product behavior

Not started at the required level:

- normalized multi-table season persistence
- direct live game ingestion
- authentication, roles, and public/read-only views
- season rollover and historical browsing as first-class product behavior

## Strategy

The 2027 work should happen in this order:

1. Stabilize the codebase so changes stop increasing prototype debt.
2. Build the multi-season backend foundation before adding more product surface area.
3. Redesign the web experience around draft-night and participant clarity.
4. Remove spreadsheet dependency from tournament operations.
5. Add access control and public product modes once the data model is stable.

This sequence matters. Native mobile, richer analytics, and visual polish should not outrun the backend and workflow foundations.

## Workstreams

### Workstream 1: Foundation Cleanup

Outcome:

- the codebase is easier to change without regressions

Required outcomes:

- split large frontend files into smaller UI modules
- extract backend service boundaries from storage and HTTP concerns
- remove static season assumptions from scoring and standings logic
- add stronger tests and fixtures for season behavior
- document local development and reset flows

Evidence of completion:

- `src/main.js` is no longer the center of unrelated UI logic
- `server/app.js` is thin and service-oriented
- tests cover at least two synthetic seasons

### Workstream 2: Multi-Season Persistence

Outcome:

- the product can support 2027 without remaining trapped in a single mutable JSON file

Required outcomes:

- keep SQLite as the runtime store and finish the migration path away from blob-only season records
- define season-scoped tables for owners, teams, picks, games, rules, and audit events
- add repository/service layers for season reads and writes
- make season selection explicit in the API
- support season creation and historical browsing without wiping prior seasons

Evidence of completion:

- multiple seasons can coexist
- current season is selected rather than implied
- `data/season-state.json` is bootstrap data only
- draft, config, and standings flows no longer depend on rewriting a whole serialized state document

### Workstream 3: Web Experience Rewrite

Outcome:

- the app feels like a product instead of a prototype dashboard

Required outcomes:

- redesign the shell around `Overview`, `Draft Room`, `Standings`, `Teams`, `Scoring Lab`, and `Commissioner`
- consolidate the homepage so users can understand state, next actions, and live context without traversing a long dashboard
- make the Draft Room the highest-focus workflow in the product
- improve phone navigation and reduce long-scroll dashboard behavior
- establish a calmer design language with clearer hierarchy and less clutter
- add presentation mode for draft-night display

Evidence of completion:

- the homepage is materially shorter, clearer, and faster to scan with no meaningful feature loss
- a participant can follow the draft and standings comfortably from a phone
- the commissioner workflow is obvious without exposing every control at once
- the visual system feels calm, precise, and high-trust

### Workstream 4: Tournament Operations

Outcome:

- the spreadsheet is no longer part of live tournament operations

Required outcomes:

- add direct game ingestion from an app-controlled source
- normalize and store game updates by season
- recompute standings from stored game data only
- support manual corrections with explicit audit history
- expose operational status for stale or failed ingestion

Evidence of completion:

- live standings depend only on app-owned data
- corrections are visible and recoverable
- operators can see whether the live feed is healthy

### Workstream 5: Access Control And Public Modes

Outcome:

- commissioner actions and participant consumption are cleanly separated

Required outcomes:

- add commissioner authentication
- define roles for commissioner, admin, and viewer
- hide destructive actions behind authenticated routes
- add public read-only views and shareable routes
- support season-scoped session and authorization checks

Evidence of completion:

- destructive actions require auth
- public viewers can safely use the product
- the product supports distinct commissioner and participant journeys

## Recommended Delivery Sequence From The Current State

### Cycle 1

Focus:

- local development documentation
- remaining scoring/state cleanup
- smaller shell cleanup passes that do not expand scope
- roadmap and backlog alignment to the current SQLite-backed implementation

Success gate:

- the current product is easier to operate and safer to iterate on

### Cycle 2

Focus:

- normalize the SQLite schema beyond `seasons.state_json`
- add repository helpers for season, owner, team, and draft reads/writes
- backfill or dual-write season summary and draft data
- tighten API season selection and season-creation flows

Success gate:

- the app can hold more than one season safely without whole-state rewrite assumptions

### Cycle 3

Focus:

- season selector in API and UI
- historical season reads
- homepage consolidation
- Draft Room simplification
- clearer phone navigation

Success gate:

- the participant-facing experience is clearly stronger and season context is explicit

### Cycle 4

Focus:

- direct game ingestion
- standings recomputation from backend data
- audit log and correction tools

Success gate:

- the spreadsheet is no longer required for live scoring

### Cycle 5

Focus:

- commissioner auth
- public/read-only mode
- destructive action safeguards
- season rollover workflow

Success gate:

- the product can run the 2027 tournament with role separation and safer operations

## Design Standard

The visual direction should continue to follow these principles:

- strong hierarchy
- quiet surfaces
- restrained color
- spacious layout
- obvious primary actions
- progressive disclosure for advanced controls
- smooth but subtle motion

This is not a request to mimic Apple styling. It is a request for clarity, restraint, and precision under live-use pressure.

## Non-Goals For Early 2027 Work

Do not spend early cycles on:

- decorative animation work
- overbuilt charting
- exotic probability widgets
- speculative multiplayer features
- native mobile clients before the web product and backend are stable

## Immediate Priority

The highest-value immediate focus remains:

1. finish documentation and the remaining cleanup needed before normalized schema work
2. replace blob-oriented season persistence with repository-backed season tables
3. continue redesigning the shell and draft experience on top of explicit season context

Those efforts unlock nearly everything else on the 2027 path.

## Current Gaps To Close Next

These are the highest-leverage roadmap gaps between the present codebase and the 2027 bar:

- `server/store.js` currently proves that SQLite bootstrapping works, but too much product state is still serialized into one `state_json` field
- `server/app.js` exposes season-aware routes, but the route layer still repeats response-shaping and depends on whole-state service reads
- `src/main.js` is smaller than before, but it still coordinates most shell behavior and remains the choke point for season selection, refresh, and workspace wiring
- the product exposes `Overview` and `Draft Room`, but the landing experience still asks users to interpret too much information before they can act
- local development is safer than before, but the docs need to treat SQLite as the default runtime path instead of the future plan

## Recommended Deliverables For The Next Two Cycles

### Cycle 1 Deliverables

- close doc drift in README, roadmap, and backlog files so contributors understand the current SQLite-backed runtime
- extract response-building helpers from `server/app.js` so every season-aware route does not duplicate summary payload assembly
- remove remaining static season assumptions from scoring and standings helpers
- define the first normalized schema slice for seasons, owners, teams, and draft picks

Exit signal:

- a new contributor can explain the runtime model correctly and the server code clearly separates route handling from state assembly

### Cycle 2 Deliverables

- add repository modules for season summary, season detail, and draft history
- dual-write draft and season-config mutations into normalized tables while preserving current app behavior
- add explicit season creation and season listing flows backed by SQLite, not JSON copies
- expose enough historical-season data for the UI to browse prior seasons safely

Exit signal:

- the app can create, select, and inspect multiple seasons using repository-backed data, while legacy blob storage remains only as a compatibility layer

## Dependency Rules

The following sequencing should stay fixed unless a hard blocker appears:

1. normalized persistence before direct ingestion
2. explicit season context before public shareable routes
3. web information architecture before native mobile investment
4. auth after the data model is stable enough to avoid reworking permissions twice
