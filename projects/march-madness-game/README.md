# Busy March Madness

Busy March Madness is the in-house pool app intended to replace the spreadsheet workflow for draft night and tournament tracking.

## Current Scope

The current build supports:

- commissioner-controlled draft flow with backend persistence
- season setup for owners, teams, and scoring rules
- standings, team ownership, path analysis, and scoring views
- a workspace-style shell for `Overview`, `Draft Room`, and deeper analytics surfaces

It does not yet support:

- multi-season runtime persistence
- direct live game ingestion
- authentication or public/read-only roles

## Local Development

Requirements:

- Node.js 18+

Install and run:

```bash
npm install
npm run dev
```

The app serves from the local Node server defined in `server/server.js`.

## Tests

Run the current test suite with:

```bash
npm test
```

This covers scoring logic plus core draft and season service behavior.

## Persistence Model Today

The runtime store is currently SQLite, with legacy JSON bootstrap support:

- default database path: `data/season-state.db`
- override path: `SEASON_DB_PATH=/absolute/path/to/season-state.db`

Legacy bootstrap/import paths still exist:

- default path: `data/season-state.json`
- override path: `SEASON_STATE_PATH=/absolute/path/to/season-state.json`

On first run, the server will seed SQLite from available legacy JSON state if needed.

## Reset Flows

There are two reset modes exposed by the current product:

- `empty`: keep the baseline field, clear all drafted owners, and restart pick order
- `sheet`: restore teams to the baseline imported ownership state and restart pick order

These actions currently operate against the active JSON store.

## Safe Local Sandbox Workflow

If you want to experiment without touching the default store:

```bash
mkdir -p /tmp/mmg
cp data/season-state.json /tmp/mmg/season-state.json
SEASON_STATE_PATH=/tmp/mmg/season-state.json SEASON_DB_PATH=/tmp/mmg/season-state.db npm run dev
```

This keeps local testing isolated from the checked-in bootstrap state and database.

## Near-Term Product Priorities

The immediate roadmap is:

1. Finish the move from JSON/bootstrap-era storage to normalized SQLite-backed season persistence.
2. Replace blob-oriented season storage with normalized season-scoped tables and repositories.
3. Add explicit season selection and historical season reads.
4. Keep tightening the shell so the overview and draft experience are faster to scan.
5. Add direct game ingestion and then authentication/public roles.
