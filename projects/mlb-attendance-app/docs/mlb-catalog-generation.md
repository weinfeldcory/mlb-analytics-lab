# MLB Catalog Generation

Status: Active  
Date: 2026-05-01

## Purpose

Keep `apps/mobile/src/lib/data/mlbGameCatalog.json` fresh with:
- newly completed MLB games
- updated final scores and line scores
- hitter and pitcher box-score data for player insights

## Source

The catalog is generated from the free MLB Stats API:
- schedule endpoint for games and line scores
- boxscore endpoint for hitter and pitcher appearances

## Scripts

- `scripts/fetch_full_mlb_catalog.py`
  - main catalog refresh script
  - supports incremental refresh and full rebuild
- `scripts/mlb_boxscore_utils.py`
  - shared box-score extraction helpers
- `scripts/fetch_user_game_logs.py`
  - personal seeded-game enrichment script

## Output

Generated file:
- `apps/mobile/src/lib/data/mlbGameCatalog.json`

Each game now includes:
- base game metadata
- line score
- `pitchers`
- `batters`
- `playerDataStatus`
- `playerDataCheckedAt`
- `playerDataSource`
- `playerDataWarnings`

## Recommended Commands

Incremental refresh for recent games:

```bash
python3 scripts/fetch_full_mlb_catalog.py --recent-days 10
```

Incremental refresh but skip games already marked complete:

```bash
python3 scripts/fetch_full_mlb_catalog.py --recent-days 10 --skip-existing-complete
```

Refresh one season:

```bash
python3 scripts/fetch_full_mlb_catalog.py --season 2026
```

Refresh an explicit date range:

```bash
python3 scripts/fetch_full_mlb_catalog.py --date-from 2026-04-20 --date-to 2026-05-01
```

Dry run:

```bash
python3 scripts/fetch_full_mlb_catalog.py --recent-days 10 --dry-run
```

Full rebuild:

```bash
python3 scripts/fetch_full_mlb_catalog.py 2021 2026 --full-rebuild
```

## Nightly Automation

Workflow:
- `.github/workflows/nightly-mlb-catalog-refresh.yml`

Behavior:
- runs nightly
- refreshes recent games
- commits `mlbGameCatalog.json` only if it changed
- rebuilds and republishes the GitHub Pages app only when catalog data changed

## Data Quality Notes

`playerDataStatus` values:
- `complete`
- `missing_batters`
- `missing_pitchers`
- `missing_batters_and_pitchers`
- `source_unavailable`

This prevents the app from silently treating missing player data as true zero values.

## Operational Guidance

- Nightly job should focus on recent games for speed and freshness.
- Manual season/date-range refreshes are appropriate for repair work.
- If player insights look stale, first inspect the latest catalog diff and `playerDataStatus` values.
- If a game repeatedly fails enrichment, rerun a targeted date-range refresh before doing a full rebuild.
