import type { Game, Team, Venue } from "@mlb-attendance/domain";

export function formatBaseballInnings(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return "0.0";
  }

  const wholeInnings = Math.trunc(value);
  const outs = Math.round((value - wholeInnings) * 3);

  if (outs >= 3) {
    return `${wholeInnings + 1}.0`;
  }

  return `${wholeInnings}.${outs}`;
}

export function formatGameLabel(game: Game, teamsById: Map<string, Team>, venuesById: Map<string, Venue>) {
  const awayTeam = teamsById.get(game.awayTeamId);
  const homeTeam = teamsById.get(game.homeTeamId);
  const venue = venuesById.get(game.venueId);

  return {
    title: `${awayTeam?.abbreviation ?? "AWAY"} at ${homeTeam?.abbreviation ?? "HOME"}`,
    subtitle: `${game.startDate} • ${venue?.name ?? "Unknown venue"}`,
    score: `${game.awayScore}-${game.homeScore}`
  };
}
