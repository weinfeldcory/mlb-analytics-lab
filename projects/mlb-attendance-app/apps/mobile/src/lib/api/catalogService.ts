import { games, teams, venues } from "../data/mockSportsData";
import type { Game, Team, Venue } from "@mlb-attendance/domain";

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

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildVenueAliases(venue: Venue | undefined) {
  if (!venue) {
    return [];
  }

  return [
    venue.name,
    venue.city,
    venue.state ? `${venue.city} ${venue.state}` : ""
  ].filter(Boolean);
}

function matchesDate(gameDate: string, rawDate?: string) {
  const date = rawDate?.trim();
  if (!date) {
    return true;
  }

  const compactQuery = date.replace(/[^\d]/g, "");
  const compactGameDate = gameDate.replace(/[^\d]/g, "");

  return gameDate.includes(date) || compactGameDate.includes(compactQuery);
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
  const normalizedQuery = query ? normalizeSearchValue(query) : "";
  const normalizedStadium = stadium ? normalizeSearchValue(stadium) : "";

  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const venueMap = new Map(venues.map((venue) => [venue.id, venue]));

  return games.filter((game) => {
    const homeTeam = teamMap.get(game.homeTeamId);
    const awayTeam = teamMap.get(game.awayTeamId);
    const venue = venueMap.get(game.venueId);

    const searchHaystack = [
      homeTeam ? `${homeTeam.city} ${homeTeam.name}` : "",
      awayTeam ? `${awayTeam.city} ${awayTeam.name}` : "",
      homeTeam?.abbreviation ?? "",
      awayTeam?.abbreviation ?? "",
      homeTeam && awayTeam ? `${awayTeam.abbreviation} at ${homeTeam.abbreviation}` : "",
      homeTeam && awayTeam ? `${awayTeam.name} vs ${homeTeam.name}` : "",
      homeTeam && awayTeam ? `${awayTeam.city} ${awayTeam.name} ${homeTeam.city} ${homeTeam.name}` : "",
      venue?.name ?? "",
      ...buildVenueAliases(venue)
    ]
      .join(" ")
      .toLowerCase();

    const normalizedHaystack = normalizeSearchValue(searchHaystack);

    const matchesQuery =
      !query ||
      searchHaystack.includes(query) ||
      normalizedHaystack.includes(normalizedQuery);

    const matchesDateValue = matchesDate(game.startDate, date);
    const matchesStadium =
      !stadium ||
      buildVenueAliases(venue).some((alias) => alias.toLowerCase().includes(stadium)) ||
      buildVenueAliases(venue).some((alias) => normalizeSearchValue(alias).includes(normalizedStadium));

    return Boolean(matchesQuery && matchesDateValue && matchesStadium);
  });
}
