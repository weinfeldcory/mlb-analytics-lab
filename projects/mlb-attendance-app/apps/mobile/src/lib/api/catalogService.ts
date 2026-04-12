import { games, teams, venues } from "../data/mockSportsData";
import type { Game, Team, Venue } from "../../types/models";

export interface GameSearchFilters {
  query?: string;
  date?: string;
  stadium?: string;
}

export interface CatalogBundle {
  games: Game[];
  teams: Team[];
  venues: Venue[];
}

export async function getCatalog(): Promise<CatalogBundle> {
  return {
    games,
    teams,
    venues
  };
}

export async function searchGames(filters: GameSearchFilters): Promise<Game[]> {
  const query = filters.query?.trim().toLowerCase();
  const date = filters.date?.trim();
  const stadium = filters.stadium?.trim().toLowerCase();

  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const venueMap = new Map(venues.map((venue) => [venue.id, venue]));

  return games.filter((game) => {
    const homeTeam = teamMap.get(game.homeTeamId);
    const awayTeam = teamMap.get(game.awayTeamId);
    const venue = venueMap.get(game.venueId);

    const matchesQuery =
      !query ||
      homeTeam?.name.toLowerCase().includes(query) ||
      awayTeam?.name.toLowerCase().includes(query) ||
      homeTeam?.abbreviation.toLowerCase().includes(query) ||
      awayTeam?.abbreviation.toLowerCase().includes(query) ||
      venue?.name.toLowerCase().includes(query);

    const matchesDate = !date || game.startDate.includes(date);
    const matchesStadium = !stadium || venue?.name.toLowerCase().includes(stadium);

    return Boolean(matchesQuery && matchesDate && matchesStadium);
  });
}

