from __future__ import annotations

import json
import ssl
import time
import urllib.request
from datetime import datetime, timezone
from typing import Any

SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

PLAYER_DATA_SOURCE = "mlb_stats_api_boxscore"


def get_json(url: str) -> dict[str, Any]:
    with urllib.request.urlopen(url, context=SSL_CONTEXT) as response:
        return json.load(response)


def fetch_boxscore(game_pk: int, delay_seconds: float = 0.0) -> dict[str, Any]:
    if delay_seconds > 0:
        time.sleep(delay_seconds)
    return get_json(f"https://statsapi.mlb.com/api/v1/game/{game_pk}/boxscore")


def fetch_linescore(game_pk: int, delay_seconds: float = 0.0) -> dict[str, Any]:
    if delay_seconds > 0:
        time.sleep(delay_seconds)
    return get_json(f"https://statsapi.mlb.com/api/v1/game/{game_pk}/linescore")


def build_line_score(linescore: dict[str, Any] | None) -> list[dict[str, int]]:
    if not linescore:
        return []

    innings: list[dict[str, int]] = []
    for inning in linescore.get("innings", []):
        innings.append(
            {
                "inning": inning.get("num"),
                "homeRuns": inning.get("home", {}).get("runs", 0),
                "awayRuns": inning.get("away", {}).get("runs", 0),
            }
        )

    return innings


def _normalize_team_id(match: dict[str, Any], side: str) -> str:
    return str(match["teams"][side]["team"]["id"])


def build_pitchers(match: dict[str, Any], boxscore: dict[str, Any]) -> list[dict[str, Any]]:
    pitchers: list[dict[str, Any]] = []

    for side in ("home", "away"):
        team_id = _normalize_team_id(match, side)
        players = boxscore.get("teams", {}).get(side, {}).get("players", {})
        for player in players.values():
            position = player.get("position", {}).get("abbreviation")
            if position != "P":
                continue

            pitching = player.get("stats", {}).get("pitching") or {}
            if not pitching.get("inningsPitched"):
                continue

            decision = None
            if pitching.get("wins", 0):
                decision = "win"
            elif pitching.get("losses", 0):
                decision = "loss"
            elif pitching.get("saves", 0):
                decision = "save"
            elif pitching.get("holds", 0):
                decision = "hold"

            pitchers.append(
                {
                    "teamId": team_id,
                    "playerId": player.get("person", {}).get("id"),
                    "pitcherName": player["person"]["fullName"],
                    "inningsPitched": pitching.get("inningsPitched"),
                    "hitsAllowed": pitching.get("hits", 0),
                    "runsAllowed": pitching.get("runs", 0),
                    "earnedRunsAllowed": pitching.get("earnedRuns", 0),
                    "strikeouts": pitching.get("strikeOuts", 0),
                    "walksAllowed": pitching.get("baseOnBalls", 0),
                    "homeRunsAllowed": pitching.get("homeRuns", 0),
                    "pitchesThrown": pitching.get("numberOfPitches"),
                    "strikes": pitching.get("strikes"),
                    "decision": decision,
                    "save": bool(pitching.get("saves", 0)),
                    "blownSave": bool(pitching.get("blownSaves", 0)),
                    "hold": bool(pitching.get("holds", 0)),
                }
            )

    return pitchers


def build_batters(match: dict[str, Any], boxscore: dict[str, Any]) -> list[dict[str, Any]]:
    batters: list[dict[str, Any]] = []

    for side in ("home", "away"):
        team_id = _normalize_team_id(match, side)
        players = boxscore.get("teams", {}).get(side, {}).get("players", {})
        for player in players.values():
            position = player.get("position", {}).get("abbreviation")
            if position == "P":
                continue
            batting = player.get("stats", {}).get("batting") or {}
            if not batting.get("atBats") and not batting.get("plateAppearances"):
                continue

            batters.append(
                {
                    "teamId": team_id,
                    "playerId": player.get("person", {}).get("id"),
                    "playerName": player["person"]["fullName"],
                    "position": position,
                    "atBats": batting.get("atBats", 0),
                    "plateAppearances": batting.get("plateAppearances"),
                    "hits": batting.get("hits", 0),
                    "doubles": batting.get("doubles", 0),
                    "triples": batting.get("triples", 0),
                    "homeRuns": batting.get("homeRuns", 0),
                    "rbis": batting.get("rbi", 0),
                    "runs": batting.get("runs", 0),
                    "strikeouts": batting.get("strikeOuts", 0),
                    "walks": batting.get("baseOnBalls", 0),
                    "stolenBases": batting.get("stolenBases", 0),
                }
            )

    return batters


def build_player_data_quality(
    batters: list[dict[str, Any]],
    pitchers: list[dict[str, Any]],
) -> dict[str, Any]:
    batter_team_ids = {batter["teamId"] for batter in batters}
    pitcher_team_ids = {pitcher["teamId"] for pitcher in pitchers}

    missing_batters = len(batter_team_ids) < 2
    missing_pitchers = len(pitcher_team_ids) < 2
    warnings: list[str] = []

    if missing_batters:
        warnings.append("Missing batter data for one or both teams.")
    if missing_pitchers:
        warnings.append("Missing pitcher data for one or both teams.")

    if missing_batters and missing_pitchers:
        status = "missing_batters_and_pitchers"
    elif missing_batters:
        status = "missing_batters"
    elif missing_pitchers:
        status = "missing_pitchers"
    else:
        status = "complete"

    return {
        "playerDataStatus": status,
        "playerDataCheckedAt": datetime.now(timezone.utc).isoformat(),
        "playerDataSource": PLAYER_DATA_SOURCE,
        "playerDataWarnings": warnings,
    }
