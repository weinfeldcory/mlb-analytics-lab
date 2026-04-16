# NFL Pick'em Game

Spreadsheet-to-app migration scaffold for the NFL `Busy Picks` pool, now extended into a usable commissioner workflow.

## What is in the current build

- lightweight Node server with file-backed state
- imported 2025 spreadsheet snapshot as seed data
- standings, weekly picks, week 18 lines, and recent results views
- commissioner setup form for season metadata and owners
- week selector so any configured week can be reviewed or edited
- lines-board editor for updating the displayed slate in-app
- clean-season launch flow for starting the next season without editing JSON
- automated tests for state updates, lines updates, and season launch

## Run

```bash
npm run dev
```

Then open `http://127.0.0.1:5173/`.

## Current migration source

- Spreadsheet: `Busy Picks 2025 Season`
- URL: `https://docs.google.com/spreadsheets/d/1jV5kmQBMXtmWVnMyztz54Mw0GY6LWiOz3YPCbAs51e8/edit`

## Roadmap

- product roadmap: `PRODUCT_ROADMAP.md`
- next major milestone: app-owned scoring reconciliation and standings recomputation
