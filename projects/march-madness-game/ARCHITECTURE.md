# Busy March Madness Architecture

## Objective

Move the current prototype into a durable tournament application that can support the 2027 NCAA tournament with:

- multi-season storage
- commissioner and public experiences
- direct game ingestion
- maintainable frontend and backend boundaries
- reliable draft-night operations

## Current Architecture

The current app is a thin full-stack prototype:

- static frontend shell in `index.html`
- browser modules in `src/`
- lightweight Node HTTP server in `server/`
- JSON-file persistence in `data/season-state.json`

This has been good enough for prototyping draft flow, standings, and scoring analytics, but it still has prototype-era constraints:

- season state is stored as one mutable JSON document
- frontend rendering is concentrated in one large `src/main.js`
- scoring utilities still depend on static defaults in `src/data.js`
- no explicit multi-season domain model exists
- no role separation or audit layer exists

## 2027 Target Architecture

### Frontend

Organize the frontend into small modules with clear responsibilities:

- `src/main.js`
  - app bootstrap
  - refresh cycle
  - action wiring
- `src/lib/`
  - formatting helpers
  - shared view utilities
- `src/ui/`
  - app shell sections
  - draft view
  - standings view
  - teams view
  - scoring lab view
  - commissioner view

The UI should evolve toward six product surfaces:

- Overview
- Draft Room
- Standings
- Teams
- Scoring Lab
- Commissioner

### Backend

Move the backend from file-based mutation helpers to explicit services:

- `server/app.js`
  - request routing
  - HTTP concerns only
- `server/services/seasons.js`
  - season lifecycle
- `server/services/draft.js`
  - pick flow
  - lock/undo/manual overrides
- `server/services/games.js`
  - ingestion
  - corrections
- `server/services/standings.js`
  - backend summaries

### Storage

The preferred next storage step is SQLite, not a larger database.

Why:

- it supports multi-season persistence cleanly
- it is simpler than the current JSON file while remaining lightweight
- it is sufficient for a single-pool application with admin workflows
- it enables migrations, audit history, and reliable season rollover

## Domain Model

The app should converge on these core entities:

- `Season`
- `Owner`
- `Team`
- `DraftPick`
- `Game`
- `ScoringRuleSet`
- `User`
- `Role`
- `AuditEvent`

Key invariants:

- seasons are isolated from one another
- standings are derived from season-owned teams, games, and scoring rules
- draft order and pick history are season-specific
- destructive commissioner actions are explicit and auditable

## Product Modes

The app should support multiple operating modes in one coherent product:

- Commissioner mode
- Participant mode
- Public display mode
- Historical season browser
- Live tournament mode
- Draft-night mode

## Near-Term Refactor Rules

While the codebase is transitioning, these rules should hold:

- avoid behavior changes unless they fix clear defects
- keep scoring logic testable and separate from rendering
- move large files toward small modules instead of adding more logic to existing monoliths
- treat `src/data.js` as seed/default data, not long-term source of truth
- prefer incremental refactors that preserve the current app shell
