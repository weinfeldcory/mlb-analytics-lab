import type { Game, Team, Venue } from "@mlb-attendance/domain";

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
