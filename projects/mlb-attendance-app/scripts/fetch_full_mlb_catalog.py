from __future__ import annotations

import argparse
import json
import urllib.parse
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from mlb_boxscore_utils import (
    build_batters,
    build_line_score,
    build_pitchers,
    build_player_data_quality,
    fetch_boxscore,
    get_json,
)

GAME_TYPES = "R,D,L,W,F,C"
DEFAULT_DELAY_SECONDS = 0.15
DEFAULT_RECENT_DAYS = 7
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "apps"
    / "mobile"
    / "src"
    / "lib"
    / "data"
    / "mlbGameCatalog.json"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch and refresh the full MLB game catalog.")
    parser.add_argument("start_year", nargs="?", type=int)
    parser.add_argument("end_year", nargs="?", type=int)
    parser.add_argument("--season", type=int, help="Refresh one specific season.")
    parser.add_argument("--date-from", help="Refresh from YYYY-MM-DD.")
    parser.add_argument("--date-to", help="Refresh through YYYY-MM-DD.")
    parser.add_argument("--recent-days", type=int, default=DEFAULT_RECENT_DAYS, help="Incremental refresh window in days.")
    parser.add_argument("--limit", type=int, help="Limit number of final games processed.")
    parser.add_argument("--delay-seconds", type=float, default=DEFAULT_DELAY_SECONDS, help="Delay between box score requests.")
    parser.add_argument("--skip-existing-complete", action="store_true", help="Do not refetch games already marked complete.")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing output.")
    parser.add_argument("--full-rebuild", action="store_true", help="Rebuild the full year range instead of incremental refresh.")
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="Override output path.")
    return parser.parse_args()


def parse_iso_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def fetch_schedule_range(start_date: date, end_date: date) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "sportId": 1,
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "gameType": GAME_TYPES,
            "hydrate": "linescore",
        }
    )
    payload = get_json(f"https://statsapi.mlb.com/api/v1/schedule?{query}")
    return payload.get("dates", [])


def fetch_schedule_for_year(year: int) -> list[dict[str, Any]]:
    return fetch_schedule_range(date(year, 1, 1), date(year, 12, 31))


def is_final_game(game: dict[str, Any]) -> bool:
    status = game.get("status", {})
    detailed_state = (status.get("detailedState") or "").lower()
    coded_state = status.get("codedGameState")
    abstract_state = (status.get("abstractGameState") or "").lower()
    return (
        abstract_state == "final"
        or coded_state in {"F", "O"}
        or detailed_state in {"final", "game over", "completed early"}
    )


def load_existing_catalog(output_path: Path) -> dict[int, dict[str, Any]]:
    if not output_path.exists():
        return {}

    data = json.loads(output_path.read_text())
    return {int(game["gamePk"]): game for game in data}


def build_catalog_game(game: dict[str, Any], fallback_date: str, existing_game: dict[str, Any] | None, delay_seconds: float) -> dict[str, Any]:
    linescore = game.get("linescore") or {}
    line_score = build_line_score(linescore)
    linescore_teams = linescore.get("teams", {})
    home_line = linescore_teams.get("home", {})
    away_line = linescore_teams.get("away", {})

    base_record: dict[str, Any] = {
        "date": fallback_date,
        "gameDate": game.get("gameDate"),
        "gamePk": game["gamePk"],
        "homeTeam": game["teams"]["home"]["team"],
        "awayTeam": game["teams"]["away"]["team"],
        "homeScore": game["teams"]["home"].get("score", home_line.get("runs", 0) or 0),
        "awayScore": game["teams"]["away"].get("score", away_line.get("runs", 0) or 0),
        "homeHits": home_line.get("hits", 0) or 0,
        "awayHits": away_line.get("hits", 0) or 0,
        "homeErrors": home_line.get("errors", 0) or 0,
        "awayErrors": away_line.get("errors", 0) or 0,
        "lineScore": line_score,
        "venue": game["venue"],
    }

    try:
        boxscore = fetch_boxscore(game["gamePk"], delay_seconds=delay_seconds)
        pitchers = build_pitchers(game, boxscore)
        batters = build_batters(game, boxscore)
        quality = build_player_data_quality(batters, pitchers)
        base_record.update(
            {
                "pitchers": pitchers,
                "batters": batters,
                **quality,
            }
        )
        return base_record
    except Exception as error:
        if existing_game:
            preserved = dict(existing_game)
            preserved.update(base_record)
            preserved.setdefault("pitchers", existing_game.get("pitchers", []))
            preserved.setdefault("batters", existing_game.get("batters", []))
            preserved["playerDataWarnings"] = list(existing_game.get("playerDataWarnings", []))
            preserved["playerDataWarnings"].append(f"Refresh failed: {error}")
            preserved["playerDataStatus"] = existing_game.get("playerDataStatus", "source_unavailable")
            return preserved

        return {
            **base_record,
            "pitchers": [],
            "batters": [],
            "playerDataStatus": "source_unavailable",
            "playerDataCheckedAt": datetime.utcnow().isoformat() + "Z",
            "playerDataSource": "mlb_stats_api_boxscore",
            "playerDataWarnings": [f"Refresh failed: {error}"],
        }


def iter_target_days(args: argparse.Namespace) -> tuple[list[dict[str, Any]], str]:
    today = date.today()

    if args.date_from or args.date_to:
        start_date = parse_iso_date(args.date_from or args.date_to)
        end_date = parse_iso_date(args.date_to or args.date_from)
        return fetch_schedule_range(start_date, end_date), f"{start_date.isoformat()} to {end_date.isoformat()}"

    if args.season:
        return fetch_schedule_for_year(args.season), f"season {args.season}"

    if args.full_rebuild or args.start_year or args.end_year:
        start_year = args.start_year or today.year
        end_year = args.end_year or start_year
        days: list[dict[str, Any]] = []
        for year in range(start_year, end_year + 1):
            days.extend(fetch_schedule_for_year(year))
        return days, f"full rebuild {start_year}-{end_year}"

    start_date = today - timedelta(days=args.recent_days)
    return fetch_schedule_range(start_date, today), f"recent {start_date.isoformat()} to {today.isoformat()}"


def build_output(args: argparse.Namespace, output_path: Path) -> tuple[list[dict[str, Any]], dict[str, int | str]]:
    existing_catalog = load_existing_catalog(output_path)
    days, refresh_label = iter_target_days(args)

    processed = 0
    updated = 0
    skipped = 0

    for day in days:
        game_date = day.get("date")
        for game in day.get("games", []):
            if not is_final_game(game):
                continue

            existing = existing_catalog.get(int(game["gamePk"]))
            if args.skip_existing_complete and existing and existing.get("playerDataStatus") == "complete":
                skipped += 1
                continue

            existing_catalog[int(game["gamePk"])] = build_catalog_game(
                game,
                game_date,
                existing_game=existing,
                delay_seconds=args.delay_seconds,
            )
            processed += 1
            updated += 1

            if args.limit and processed >= args.limit:
                break

        if args.limit and processed >= args.limit:
            break

    output = sorted(existing_catalog.values(), key=lambda game: (game["date"], game["gamePk"]))
    summary = {
        "refresh_scope": refresh_label,
        "catalog_games": len(output),
        "processed": processed,
        "updated": updated,
        "skipped": skipped,
    }
    return output, summary


def main() -> int:
    args = parse_args()
    output_path = Path(args.output)
    output, summary = build_output(args, output_path)

    if not args.dry_run:
        output_path.write_text(json.dumps(output, indent=2) + "\n")

    print(json.dumps(summary, indent=2))
    if not args.dry_run:
        print(f"Wrote {len(output)} MLB games to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
