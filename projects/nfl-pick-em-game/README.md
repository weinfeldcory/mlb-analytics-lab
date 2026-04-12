# NFL Pick'em Game

Spreadsheet-to-app migration scaffold for the NFL `Busy Picks` pool.

## What is in this first cut

- lightweight Node server with file-backed state
- imported 2025 spreadsheet snapshot as seed data
- standings, weekly picks, week 18 lines, and recent results views
- commissioner setup form for season metadata and owners

## Run

```bash
npm run dev
```

Then open `http://127.0.0.1:5173/`.

## Current migration source

- Spreadsheet: `Busy Picks 2025 Season`
- URL: `https://docs.google.com/spreadsheets/d/1jV5kmQBMXtmWVnMyztz54Mw0GY6LWiOz3YPCbAs51e8/edit`

## Next steps

- replace static snapshot data with direct spreadsheet import or league-data ingestion
- add weekly scoring reconciliation inside the backend
- add commissioner workflows for entering picks and updating lines in-app
