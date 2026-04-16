# NFL Pick'em Product Roadmap

## Purpose

Define the next product phase for `nfl-pick-em-game` based on the codebase as it exists on April 15, 2026.

This roadmap is grounded in the current project state:

- a lightweight Node server with file-backed state
- a usable standings, weekly-board, lines, and results web shell
- commissioner-backed season config, weekly pick editing, lines editing, and season launch flows
- automated store tests covering season config, weekly picks, lines updates, and clean-season launch

## Product Standard

The next major version of this project should be:

- reliable enough to run the weekly pool without falling back to the spreadsheet for routine commissioner work
- structured enough that a new NFL season can be launched from the app without manual JSON edits
- readable enough that players can scan standings, this week’s board, and current lines in one pass
- auditable enough that scoring and operational changes stop feeling like opaque spreadsheet mutations
- extensible enough that live game ingestion and authenticated commissioner workflows can be added without rewriting the product again

## Current Status Snapshot

The project has now moved beyond pure migration scaffold status.

Already working:

- standings, lines, weekly picks, and recent results are rendered from backend state
- the weekly board can now be switched to and edited for any configured week
- commissioner tools include season metadata updates, lines-board editing, and clean-season launch
- store behavior is covered by automated tests

Still missing at the product level:

- app-native scoring reconciliation from results
- historical seasons and season-scoped persistence
- authenticated commissioner actions
- direct line and result ingestion from external data sources
- public read-only participant views separated from admin workflows

## Exit Criteria

The next product bar is met when all of the following are true:

- a commissioner can launch, operate, and close a season without touching source files
- weekly scoring is computed from app-owned data rather than spreadsheet-carried totals
- lines and results can be refreshed from a trusted ingestion path with clear stale-data visibility
- the product supports multiple seasons without destructive resets
- commissioner actions are authenticated and separated from participant-facing views

## Strategy

The work should happen in this order:

1. Finish commissioner operations inside the current architecture.
2. Make scoring and standings app-owned.
3. Move persistence from one mutable JSON document to season-scoped storage.
4. Add auth and participant/public modes after the data model is stable.

This sequence matters. It is better to finish product ownership of operations before widening the platform surface area.

## Workstreams

### Workstream 1: Commissioner Operations

Outcome:

- the spreadsheet stops being the operational control panel

Required outcomes:

- support editing any week, not just the currently active week
- support commissioner-managed lines updates
- support clean next-season launch inside the app
- validate season and week inputs more defensibly

Status:

- substantially complete in the current codebase

### Workstream 2: Scoring Engine

Outcome:

- standings become recomputed product outputs rather than imported artifacts

Required outcomes:

- define scoring rules for POTD, totals, and DOTD in backend services
- store weekly outcomes and scoring decisions explicitly
- recompute standings from weekly picks plus results
- expose scoring breakdowns and reconciliation status in the UI

Evidence of completion:

- standings can be rebuilt from raw app data
- commissioner no longer needs to hand-edit standings or expected points

### Workstream 3: Season-Scoped Persistence

Outcome:

- the app can support multiple NFL seasons cleanly

Required outcomes:

- move runtime state out of one mutable JSON file
- introduce season-scoped persistence and selection
- preserve prior seasons without overwrite risk
- support archival browsing

Evidence of completion:

- `data/season-state.json` becomes bootstrap data, not the production runtime model
- launching a new season does not wipe historical data

### Workstream 4: Data Ingestion

Outcome:

- lines and results become operationally trustworthy

Required outcomes:

- ingest weekly lines from a source the commissioner trusts
- ingest or reconcile game results directly into backend state
- surface ingestion freshness and failure states
- support manual correction with clear override semantics

Evidence of completion:

- live standings can be updated without spreadsheet copy-paste
- stale or broken data feeds are visible in the product

### Workstream 5: Access Control And Views

Outcome:

- commissioner operations and participant consumption are separated

Required outcomes:

- add commissioner authentication
- split admin actions from read-only participant views
- support safe public sharing
- gate destructive or sensitive actions behind auth

Evidence of completion:

- players can use the product without seeing admin controls
- commissioner actions are no longer anonymous

## Recommended Delivery Sequence

### Cycle 1

Focus:

- backend scoring engine
- score reconciliation UI
- standings recomputation

Success gate:

- imported standings are no longer the source of truth

### Cycle 2

Focus:

- season-scoped persistence
- historical season support
- season selector in UI and API

Success gate:

- a new season can launch without overwriting the previous one

### Cycle 3

Focus:

- direct lines and results ingestion
- operational health status
- manual correction audit flow

Success gate:

- the commissioner can run the pool without spreadsheet data entry

### Cycle 4

Focus:

- authentication
- admin vs participant views
- shareable read-only routes

Success gate:

- the product supports both operations and consumption cleanly

## Immediate Priority

The highest-value next build step is the scoring engine.

The current product now supports core commissioner setup and weekly operations, but standings are still imported rather than computed. That is the main remaining gap between "usable scaffold" and "app-owned pool product."
