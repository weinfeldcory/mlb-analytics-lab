# MLB Analytics Projections

Local MLB projection workspace using `pybaseball`, DuckDB, pandas, and SQL.

The current workflow is aimed at team building, not just forecasting. The 2026 exports now cover both hitters and pitchers, preserve traceable prior and in-season blend logic, and surface roster-construction outputs that can roll into a team-level season estimate.

## Planning Docs

- `PRODUCT_ROADMAP.md`
  Product direction, workstreams, and delivery sequence.
- `BACKLOG.md`
  Execution-level follow-up work derived from the roadmap.
- `EXPORT_FIELD_GLOSSARY.md`
  Viewer-facing hitter and pitcher field definitions for the current export contract.

## Layout

- `src/`
  Python scripts for pulls, model builds, exports, and ad hoc queries.
- `sql/`
  Modeling SQL used to build the DuckDB tables.
- `data/`
  Raw and processed exports for the MLB project.
- `viewer/`
  Local browser viewer for projections and live comparison files.
- `mlb.duckdb`
  Project-local DuckDB database.

## Common Commands

Run from the repo root:

```bash
.venv/bin/python projects/baseball-analytics-app/src/build_modeling_tables.py
.venv/bin/python projects/baseball-analytics-app/src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
.venv/bin/python projects/baseball-analytics-app/src/export_hitter_projection_vs_current_2026.py
.venv/bin/python projects/baseball-analytics-app/src/export_pitcher_projection_vs_current_2026.py
```

Or run from inside this folder:

```bash
../../.venv/bin/python src/build_modeling_tables.py
../../.venv/bin/python src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
../../.venv/bin/python src/export_hitter_projection_vs_current_2026.py
../../.venv/bin/python src/export_pitcher_projection_vs_current_2026.py
```

## Refresh Workflow

Use this order when refreshing the local product:

1. Pull or update source data.
2. Rebuild DuckDB modeling tables.
3. Export viewer-ready hitter and pitcher files.
4. Reload the local viewer and sanity-check the outputs.

### 1. Pull source data

Run the ingestion scripts needed for the refresh you want:

```bash
.venv/bin/python projects/baseball-analytics-app/src/pull_data.py
.venv/bin/python projects/baseball-analytics-app/src/pull_games.py
.venv/bin/python projects/baseball-analytics-app/src/pull_live_completed_games.py --start-date 2026-03-27 --end-date 2026-04-08
```

Use narrower date windows for in-season refreshes when you only need live completed games updated.

### 2. Rebuild modeling tables

```bash
.venv/bin/python projects/baseball-analytics-app/src/build_modeling_tables.py
```

This executes the SQL pipeline in `sql/` and refreshes the DuckDB modeling tables used by the exports.

### 3. Export product outputs

```bash
.venv/bin/python projects/baseball-analytics-app/src/export_hitter_projection_vs_current_2026.py
.venv/bin/python projects/baseball-analytics-app/src/export_pitcher_projection_vs_current_2026.py
```

These scripts write both processed outputs and viewer-facing JSON:

- `data/processed/*.json`
- `data/processed/*.csv`
- `viewer/data/*.json`

### 4. Check the viewer

From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/viewer/` and confirm:

- hitter data loads
- pitcher data loads
- roster builder still works
- summary cards and team rollups look reasonable

If the viewer looks stale after a rerun, verify that the matching `viewer/data/*.json` files were rewritten by the export scripts.

## Viewer

From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/viewer/`.

The viewer is organized around roster-construction questions:

- `Team-Building Value`
  Composite score balancing talent, playing time, role fit, upside, and risk.
- `Blended Talent`
  Prior model plus bounded in-season offensive signal.
- `Blended Run Prevention` / `Blended Pitch Quality`
  Pitcher-side split between current performance signal and historical pitch-quality priors.
- `Blended Playing Time`
  Preseason role expectation blended with current usage pace.
- `Upside`, `Floor`, `Starter Probability`, `Stability`, `Platoon Risk`
  Team-building lenses for acquisition and roster-fit decisions.

The roster builder now supports:

- `13 hitters + 13 pitchers`
  A full roster shell with position and role-aware slot assignment.
- `Season estimate`
  Runs scored from the selected hitters, runs allowed from the selected pitchers, and wins from a `1.83` Pythagorean exponent.
- `Team stat rollup`
  Aggregate offensive and pitching outputs for the selected roster.

Each row also carries trace fields in the export JSON/CSV so the logic is inspectable:

- model priors and reliability weights
- age and role adjustments
- current-season signal scores and blend weights
- final blended roster scores and inferred role label
