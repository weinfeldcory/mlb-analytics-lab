# Busy March Madness Product Spec

## Goal

Replace the spreadsheet workflow with a web app that can run the pool end to end:

- season setup
- live draft
- scoring rules management
- live standings and max-path analysis
- eventual direct game-data ingestion

The app should become the source of truth. The spreadsheet is only a migration aid.

## 2027 Product Standard

For the 2027 tournament, the app should be:

- reliable enough to run draft night without fallback tabs
- clean enough to evolve safely during the season
- polished enough that participants treat it as the primary interface
- structured enough to support multiple seasons and user roles

The working product target is now broader than spreadsheet replacement. The app should become a durable tournament system with commissioner controls, participant views, live tournament tracking, and historical season continuity.

## Core Users

- Commissioner: configures the season, runs the draft, resolves mistakes, updates rules
- Participants: follow the draft, standings, team ownership, and live tournament outcomes
- Admin/operator: maintains data ingestion and season rollover

## Product Principles

- The app owns state, not local browser storage and not Google Sheets
- Draft-night interactions must be fast, obvious, and hard to break
- Scoring logic should be inspectable, not hidden behind spreadsheet formulas
- Every season should be reproducible from backend data
- Public views should be readable on phones without requiring multiple tabs
- The default experience should feel calm, minimal, and high-trust under pressure
- Advanced controls should be progressively disclosed instead of always visible
- Architecture should favor modular services and season-scoped domain data

## Must-Have Functionality

### Season Setup

- Create a new season year
- Define owners
- Load or edit the tournament field
- Configure scoring matrix by seed and round
- Reset draft state without deleting historical seasons

### Draft Room

- Display current pick owner and pick number
- Support snake or linear draft order
- Assign teams to owners through the app UI
- Lock and unlock the draft
- Undo the most recent pick
- Support commissioner override/manual assignment
- Persist pick history in backend state

### Standings + Tournament Tracking

- Show current standings
- Show expected finish and true max
- Show team ownership and per-team contribution
- Show unresolved title paths / remaining outcomes
- Display scoring matrix and fairness diagnostics

### Admin / Reliability

- Backend persistence independent of browser `localStorage`
- Explicit API for draft actions and season config
- Clear yearly reset workflow
- Safe handling of unassigned teams and changed owner lists
- Auditability for commissioner overrides
- Safer confirmation flows for destructive actions

### UX / Experience

- Clear navigation between live views and admin tools
- Full mobile readability for participants
- Draft-night presentation mode
- Public read-only mode for non-admin viewers
- Cleaner visual hierarchy with less dashboard clutter

## Next Critical Functionality

### Data Ingestion

- Pull tournament games and results directly from an app-controlled source
- Store normalized game records in backend state or database
- Recompute standings from backend data only
- Remove spreadsheet dependency for live scoring

### Multi-Season Model

- Keep historical seasons accessible
- Preserve draft history, owners, scoring matrix, and results by season
- Make current season switchable in the UI

### Access Control

- Commissioner/admin authentication
- Public read-only views for participants
- Auditability for manual overrides

## Nice-to-Have Functionality

- Draft timer
- Live participant board view
- Export season data
- Historical comparisons across years
- Playoff / upset probability visualizations
- “What if” scoring sandbox
- Personalized participant landing pages
- Apple-style polished motion and transitions

## Current Build Status

### Working

- Backend-persisted season state
- Draft room with pick flow, lock, undo, manual assignment
- Season setup form
- Standings, teams, scoring, and fairness views

### In Progress

- Better information architecture and polish
- Socially acceptable scoring optimization
- Stronger documentation of target functionality

### Missing

- Direct live game ingestion
- Authentication
- Multi-season storage model
- Production-grade database
- Public/private role separation

## Definition of Spreadsheet Replacement

The spreadsheet can be retired when all of the following are true:

- a new season can be created entirely inside the app
- the live draft can be run entirely inside the app
- scoring rules can be edited and saved inside the app
- live tournament game data is ingested directly by the app backend
- standings and analytics no longer depend on Google Sheets formulas or tabs

## Recommended Near-Term Roadmap

1. Refactor the frontend and backend into clearer modules and services
2. Move from JSON-file persistence to SQLite with a multi-season schema
3. Redesign the shell into focused product surfaces with calmer UI hierarchy
4. Finalize a usable constrained scoring model
5. Add backend game ingestion and normalized live game state
6. Add authentication and commissioner/public role separation
7. Introduce public display mode and historical season browsing
