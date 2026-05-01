import type { AttendanceLog, BatterAppearance, Game, PitcherAppearance } from "@mlb-attendance/domain";
import { formatBaseballInnings } from "../../lib/formatters";

export const MEMORY_CHIPS = [
  "Walk-off",
  "First visit",
  "Rivalry game",
  "Playoff game",
  "Great seats",
  "Rain delay",
  "Extra innings",
  "Bobblehead / giveaway"
] as const;

export function applyMemoryChip(currentValue: string, chip: string) {
  const trimmed = currentValue.trim();
  if (!trimmed) {
    return chip;
  }
  if (trimmed.toLowerCase().includes(chip.toLowerCase())) {
    return currentValue;
  }
  return `${trimmed}${trimmed.endsWith(".") ? "" : "."} ${chip}`;
}

export function createDraft(log: AttendanceLog) {
  return {
    section: log.seat.section,
    row: log.seat.row ?? "",
    seatNumber: log.seat.seatNumber ?? "",
    memorableMoment: log.memorableMoment ?? "",
    companion: log.companion ?? "",
    giveaway: log.giveaway ?? "",
    weather: log.weather ?? ""
  };
}

export function getStartingPitcher(game: Game, teamId: string) {
  const pitchers = game.pitchersUsed?.filter((pitcher) => pitcher.teamId === teamId) ?? [];
  return pitchers.find((pitcher) => pitcher.role === "starter") ?? [...pitchers].sort((left, right) => (right.inningsPitched ?? 0) - (left.inningsPitched ?? 0))[0];
}

export function getTopHitters(game: Game, teamId: string) {
  const hitters = game.battersUsed?.filter((batter) => batter.teamId === teamId) ?? [];
  return [...hitters]
    .sort((left, right) => {
      if (right.homeRuns !== left.homeRuns) {
        return right.homeRuns - left.homeRuns;
      }
      if (right.hits !== left.hits) {
        return right.hits - left.hits;
      }
      if (right.rbis !== left.rbis) {
        return right.rbis - left.rbis;
      }
      if (right.walks !== left.walks) {
        return right.walks - left.walks;
      }
      return right.atBats - left.atBats;
    })
    .slice(0, 3);
}

export function formatPitcherLine(pitcher: PitcherAppearance | undefined) {
  if (!pitcher) {
    return "No starting pitcher data";
  }

  return `${formatBaseballInnings(pitcher.inningsPitched)} IP • ${pitcher.strikeouts ?? 0} K • ${pitcher.hitsAllowed ?? 0} H • ${pitcher.runsAllowed ?? 0} R`;
}

export function formatHitterLine(hitter: BatterAppearance) {
  const extras = [];
  if (hitter.homeRuns) {
    extras.push(`${hitter.homeRuns} HR`);
  }
  if (hitter.rbis) {
    extras.push(`${hitter.rbis} RBI`);
  }
  if (hitter.walks) {
    extras.push(`${hitter.walks} BB`);
  }

  const statTail = extras.length ? ` • ${extras.join(" • ")}` : "";
  return `${hitter.hits}-${hitter.atBats}${statTail}`;
}

export function getPlayerDataMessage(game: Game) {
  if (game.battersUsed?.length && game.pitchersUsed?.length) {
    return {
      label: "Complete player lines",
      detail: "Top hitters and pitcher usage are attached to this game."
    };
  }

  if (game.battersUsed?.length) {
    return {
      label: "Missing pitcher detail",
      detail: "Hitter lines are attached, but pitcher detail is still being backfilled."
    };
  }

  if (game.pitchersUsed?.length) {
    return {
      label: "Missing hitter detail",
      detail: "Pitcher lines are attached, but hitter detail is still being backfilled."
    };
  }

  return {
    label: "Player data pending",
    detail: "This game saved correctly, but player-level lines are still unavailable."
  };
}
