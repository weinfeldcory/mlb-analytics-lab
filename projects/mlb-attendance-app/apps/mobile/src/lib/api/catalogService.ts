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

function normalizeTokenValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toTokens(value: string) {
  return normalizeTokenValue(value)
    .split(/\s+/)
    .filter(Boolean);
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

function buildDateAliases(gameDate: string) {
  const [year, month, day] = gameDate.split("-").map(Number);
  if (!year || !month || !day) {
    return [gameDate];
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const longMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
  const shortMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);

  return [
    gameDate,
    `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`,
    `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}-${year}`,
    `${month}/${day}/${year}`,
    `${month}-${day}-${year}`,
    longMonth,
    shortMonth,
    String(year)
  ];
}

function matchesTokenSet(haystack: string, rawValue?: string) {
  const value = rawValue?.trim();
  if (!value) {
    return true;
  }

  const haystackTokens = toTokens(haystack);
  const queryTokens = toTokens(value);
  return queryTokens.every((token) => haystackTokens.some((candidate) => candidate.includes(token)));
}

function matchesDate(gameDate: string, rawDate?: string) {
  const date = rawDate?.trim();
  if (!date) {
    return true;
  }

  const normalizedQuery = normalizeTokenValue(date);
  const compactQuery = date.replace(/[^\d]/g, "");

  return buildDateAliases(gameDate).some((alias) => {
    const compactAlias = alias.replace(/[^\d]/g, "");
    return (
      alias.toLowerCase().includes(date.toLowerCase()) ||
      normalizeTokenValue(alias).includes(normalizedQuery) ||
      matchesTokenSet(alias, date) ||
      (compactQuery.length > 0 && compactAlias.includes(compactQuery))
    );
  });
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
      homeTeam && awayTeam ? `${homeTeam.abbreviation} vs ${awayTeam.abbreviation}` : "",
      homeTeam && awayTeam ? `${awayTeam.name} vs ${homeTeam.name}` : "",
      homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : "",
      homeTeam && awayTeam ? `${awayTeam.city} ${awayTeam.name} at ${homeTeam.city} ${homeTeam.name}` : "",
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
      normalizedHaystack.includes(normalizedQuery) ||
      matchesTokenSet(searchHaystack, query);

    const matchesDateValue = matchesDate(game.startDate, date);
    const matchesStadium =
      !stadium ||
      buildVenueAliases(venue).some((alias) => alias.toLowerCase().includes(stadium)) ||
      buildVenueAliases(venue).some((alias) => normalizeSearchValue(alias).includes(normalizedStadium)) ||
      buildVenueAliases(venue).some((alias) => matchesTokenSet(alias, stadium));

    return Boolean(matchesQuery && matchesDateValue && matchesStadium);
  });
}
