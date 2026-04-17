# Busy March Madness Product Roadmap

## Objective

Take the current prototype from a workable browser app to a product platform that can support:

- the 2027 tournament in web form
- a stable mobile-ready backend and design system
- a participant-facing mobile app after the web product is proven

This roadmap is intentionally sequenced to avoid building native clients on top of unstable product assumptions.

For prioritized execution, see `BACKLOG.md`.

## Product Strategy

The development path should be:

1. Build a reliable responsive web product.
2. Stabilize the backend, domain model, and API contracts.
3. Prove core workflows during a live tournament cycle.
4. Ship a participant-first mobile app.
5. Expand selective commissioner workflows on mobile only after the web admin experience is mature.

## Current Status As Of April 15, 2026

Already true:

- the product has a backend-persisted web app rather than a spreadsheet-only workflow
- draft, season config, and standings logic are exposed through service-oriented server modules
- the web app has started the move from one dashboard into clearer surfaces such as `Overview`, `Draft Room`, and deeper detail workspaces

Still gating the roadmap:

- runtime persistence now uses SQLite, but most season data is still stored as one serialized state blob instead of normalized season tables
- direct live game ingestion is not yet app-owned
- authentication and public/read-only roles do not exist yet
- the shell is improved, but not yet at the clarity bar required before a native client should inherit it

## Success Criteria By Stage

### Stage 1: 2027 Web-Ready Product

Success means:

- the full season can be operated inside the web app
- the draft works cleanly on desktop and phone
- standings and game updates are app-owned
- commissioner actions are authenticated
- public/read-only participant views exist

### Stage 2: Mobile-Ready Platform

Success means:

- the backend supports stable season-scoped APIs
- auth, permissions, and notifications are modeled cleanly
- the mobile web experience mirrors the core mobile information architecture
- the product can support native clients without backend rewrites

### Stage 3: Native Mobile App

Success means:

- participants can follow the game comfortably from a phone
- live updates and notifications are better than the spreadsheet workflow
- the native app depends on the same backend and domain rules as the web product

## Phase Plan

## Phase 0: Stabilize The Codebase

Purpose:

- make the codebase easier to change
- reduce prototype debt before adding large features

Epics:

- frontend modularization
- backend service extraction
- test hardening
- documentation alignment

Ticket candidates:

- Split remaining view logic into `src/ui/` modules.
- Introduce `server/services/` boundaries for seasons, draft, games, and standings.
- Remove hidden dependencies on `src/data.js` defaults from season-sensitive logic.
- Add test fixtures for at least two synthetic seasons.
- Add a contributor-facing setup note for local development and reset flows.

Definition of done:

- the app behavior matches the current prototype
- modules are clearer and smaller
- key logic is covered by tests

Current assessment:

- mostly complete
- remaining work is documentation and cleanup, not major restructuring

## Phase 1: Multi-Season Foundation

Purpose:

- replace the single mutable JSON store
- make season rollover and historical access first-class

Epics:

- SQLite persistence
- season-scoped data model
- migration framework
- season administration

Ticket candidates:

- Keep SQLite as the default runtime store and finish the migration runner path.
- Define normalized tables for seasons, owners, teams, draft picks, games, scoring rules, users, and audit events.
- Add repository helpers for loading a season summary, season detail, and draft history.
- Refactor write operations to target repository-backed season records instead of a serialized state blob.
- Add season selector support to the API.
- Build a new season creation flow that does not wipe prior seasons.
- Preserve existing `data/season-state.json` only as import/bootstrap data.

Definition of done:

- multiple seasons can exist simultaneously
- current season can be switched in the UI
- historical seasons remain readable
- draft and standings flows no longer depend on rewriting a whole season blob

## Phase 2: Web Experience Rewrite

Purpose:

- make the app feel like a real product, not a prototype dashboard
- establish the design language that mobile will inherit

Epics:

- app shell redesign
- draft room redesign
- participant information architecture
- mobile-first layout

Ticket candidates:

- Redesign the shell into `Overview`, `Draft Room`, `Standings`, `Teams`, `Scoring Lab`, and `Commissioner`.
- Consolidate the homepage so the most important live context and actions are visible without long-scroll exploration.
- Replace long-scroll landing behavior with clearer sections and stronger hierarchy.
- Promote the draft room into a dedicated high-focus surface.
- Build a concise overview screen for live tournament context.
- Add mobile navigation suited to phones.
- Reduce visual density in cards, tables, and controls.
- Standardize spacing, typography, borders, and motion under a shared design system.
- Add presentation mode for draft night and shared screens.

Definition of done:

- the app is comfortable on phone and desktop
- the homepage is dramatically faster to scan without dropping meaningful functionality
- the draft room is the cleanest and most obvious workflow in the product
- the UI feels calm, polished, and high-trust

## Phase 3: Tournament Operations

Purpose:

- remove the remaining spreadsheet dependency
- make live tournament scoring and standings trustworthy

Epics:

- direct game ingestion
- recomputation engine
- commissioner correction tools
- audit trail

Ticket candidates:

- Add normalized game ingestion from an app-controlled source.
- Store raw and normalized game updates by season.
- Recompute standings from stored games only.
- Add retry-safe game update processing.
- Add manual correction tools for commissioner use.
- Record audit events for all manual data changes.
- Add operational status indicators for ingestion freshness and failures.

Definition of done:

- standings no longer depend on Google Sheets
- game updates are visible and auditable
- manual corrections are explicit and recoverable

## Phase 4: Access Control And Public Product Modes

Purpose:

- separate commissioner workflows from participant consumption
- prepare for logged-in and public mobile users

Epics:

- authentication
- roles and permissions
- read-only public views
- user/session model

Ticket candidates:

- Add commissioner authentication.
- Define roles for commissioner, admin, and viewer.
- Hide destructive tools behind authenticated views.
- Add a public participant mode with no write affordances.
- Add shareable season and standings routes.
- Add per-user session handling and API authorization checks.

Definition of done:

- commissioner actions require auth
- public viewers can safely consume the product
- the app supports distinct user journeys cleanly

## Phase 5: Mobile-Ready Platform Layer

Purpose:

- make the backend and product shape stable enough for a native client

Epics:

- API formalization
- notification/event model
- mobile-first screen model
- analytics and observability

Ticket candidates:

- Formalize response contracts for season summary, season detail, standings, teams, and draft state.
- Add event records for picks, game finals, lead changes, and season transitions.
- Decide which commissioner workflows stay web-only even after a native participant app exists.
- Define notification-worthy events and the delivery model before choosing push infrastructure.
- Document the mobile screen inventory against existing web surfaces so the native app inherits proven concepts rather than redesigning them from scratch.

Definition of done:

- the backend exposes stable, season-scoped contracts that a native client can rely on
- core participant screens are already proven in responsive web form
- the mobile app can be built without reopening domain model or auth fundamentals

## Updated Near-Term Recommendation

The next practical platform sequence is:

1. finish documentation and state-cleanup work around the current SQLite-backed runtime
2. normalize season persistence and add repository-backed reads/writes
3. complete the web shell simplification around `Overview`, `Draft Room`, and explicit season context
4. add direct live game ingestion only after the season model is stable
5. add auth and public/read-only modes before committing to native client scope

## Phase 6: Native Mobile App V1

Purpose:

- ship the first real phone app with participant-first value

Recommended scope:

- iPhone first
- participant-first
- commissioner-light

Initial mobile surfaces:

- season picker
- live overview
- standings
- my teams
- draft board
- notifications inbox

Ticket candidates:

- Choose mobile stack after Phase 5 is complete.
- Build auth/session integration for mobile.
- Build participant home screen with live tournament context.
- Build standings screen with owner and team drill-down.
- Build `My Teams` screen with points, remaining value, and live status.
- Build draft board and pick feed.
- Add push notifications for picks, finals, and lead changes.
- Add cached read support for poor network conditions.

Definition of done:

- a participant can use the phone app as the primary way to follow the pool
- the native experience is faster and calmer than mobile web for live use

## Phase 7: Commissioner Mobile Expansion

Purpose:

- bring only the right admin workflows to mobile

Epics:

- safe mobile draft controls
- lightweight correction tools
- admin alerts

Ticket candidates:

- Add lock/unlock draft controls with confirmation.
- Add make/undo pick support.
- Add manual assignment correction flow.
- Add admin alerts for ingestion failures and unusual state.
- Keep season setup and large structural admin tools web-only unless proven necessary.

Definition of done:

- commissioners can handle urgent live tasks from a phone
- complex admin workflows still live where they are safest

## Recommended Mobile Build Approach

Recommendation:

- responsive web first
- backend/API stabilization second
- iPhone native app third

Preferred technical options after the platform stabilizes:

- React Native / Expo if speed and shared frontend velocity matter most
- native iOS if maximum polish and Apple-style interaction quality matter most

Decision rule:

- do not choose the mobile stack until Phase 5 is substantially complete

## Quarterly Execution Model

Use the roadmap in rolling cycles:

1. Choose one phase as primary.
2. Pick 1-2 epics only.
3. Convert ticket candidates into actual tasks.
4. Ship one coherent improvement slice.
5. Re-evaluate based on real usage.

## Recommended Next Three Execution Sprints

### Sprint A

- finish frontend modularization
- design new shell structure
- define SQLite schema

### Sprint B

- implement multi-season persistence
- add season selector
- remove static-owner assumptions from standings and simulations

### Sprint C

- rebuild landing shell around `Overview`, `Draft Room`, and `Standings`
- improve mobile navigation
- simplify commissioner controls

## Current Recommendation

The best next step is still Phase 1 plus Phase 2 work in parallel:

- build the multi-season backend foundation
- redesign the product shell and draft experience

That combination creates the right base for both the 2027 web product and the eventual mobile app.
