# Sports Games And MLB Analytics Lab

Workspace repo with separate project folders so each sports product stays isolated while daily journals remain centralized at the repo root.

## Projects

- `projects/march-madness-game`
  March Madness draft room, scoring experiments, and live standings app.
- `projects/baseball-analytics-app`
  MLB projection modeling, DuckDB pipeline, SQL transforms, and local viewer.
- `projects/mlb-attendance-app`
  Mobile-first MLB attendance tracker built with Expo and shared domain code.
- `projects/nfl-pick-em-game`
  NFL pick'em pool app scaffold with file-backed state and commissioner views.

## MLB Analytics Quick Start

From the repo root:

```bash
.venv/bin/python projects/baseball-analytics-app/src/build_modeling_tables.py
.venv/bin/python projects/baseball-analytics-app/src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
.venv/bin/python projects/baseball-analytics-app/src/export_hitter_projection_vs_current_2026.py
```

Then host the viewer from the MLB project folder:

```bash
cd projects/baseball-analytics-app
python3 -m http.server 8000
```

Open `http://localhost:8000/viewer/` to browse 2026 projections against current stats and 162-game pace.

## Session Workflow

Use the done workflow at the end of each session:

```bash
scripts/done "Short summary of what changed"
```

The workflow appends a session entry to the repo-level daily journal file, such as `journal/2026-04-06.md`, commits all non-ignored changes, and pushes the current branch to `origin`. Project folders should not keep their own daily journals.

In Codex sessions, `done` means run `scripts/done` from the repo root. Add a short summary after it when useful:

```text
done Add hitter analysis export
```

Do not use `/done`; Codex intercepts unsupported slash commands before they reach the assistant.
