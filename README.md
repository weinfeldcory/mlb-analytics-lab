# MLB Analytics Lab

Local baseball analytics workspace using `pybaseball`, DuckDB, pandas, and SQL.

## Local Projection Viewer

Build the modeling tables and export the comparison view:

```bash
.venv/bin/python src/build_modeling_tables.py
.venv/bin/python src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
.venv/bin/python src/export_hitter_projection_vs_current_2026.py
```

Then host the local viewer:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/viewer/` to browse 2026 projections against current stats and 162-game pace.

## Live Completed Games Pull

Pull completed MLB games and per-player boxscore lines from MLB StatsAPI:

```bash
.venv/bin/python src/pull_live_completed_games.py
```

Optional date range:

```bash
.venv/bin/python src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
```

This writes raw CSV snapshots under `data/raw/` and refreshes these DuckDB tables:

- `live_completed_games`
- `live_batting_lines`
- `live_pitching_lines`
- `live_rosters`

## Session Workflow

Use the done workflow at the end of each session:

```bash
scripts/done "Short summary of what changed"
```

The workflow appends a session entry to the daily journal file, such as `journal/2026-04-06.md`, commits all non-ignored changes, and pushes the current branch to `origin`.

In Codex sessions, `done` means run `scripts/done` from the repo root. Add a short summary after it when useful:

```text
done Add hitter analysis export
```

Do not use `/done`; Codex intercepts unsupported slash commands before they reach the assistant.
