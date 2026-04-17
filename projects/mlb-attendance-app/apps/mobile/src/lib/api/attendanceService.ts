import { games, mockUser, teams, venues } from "../data/mockSportsData";
import { buildAttendanceLog as buildDomainAttendanceLog, calculatePersonalStats } from "@mlb-attendance/domain";
import type { AttendanceLog, CreateAttendanceInput, Game, PersonalStats, UserProfile, Venue } from "@mlb-attendance/domain";

export interface DashboardData {
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  stats: PersonalStats;
}

export async function getDashboardData(params: {
  attendanceLogs: AttendanceLog[];
  gamesOverride?: Game[];
  venuesOverride?: Venue[];
}): Promise<DashboardData> {
  const activeGames = params.gamesOverride ?? games;
  const activeVenues = params.venuesOverride ?? venues;

  return {
    profile: mockUser,
    attendanceLogs: params.attendanceLogs,
    stats: calculatePersonalStats({
      user: mockUser,
      attendanceLogs: params.attendanceLogs,
      games: activeGames,
      teams,
      venues: activeVenues
    })
  };
}

export async function buildAttendanceLog(input: CreateAttendanceInput): Promise<AttendanceLog> {
  const game = games.find((candidate) => candidate.id === input.gameId);

  if (!game) {
    throw new Error("Selected game could not be found.");
  }

  return buildDomainAttendanceLog({
    input,
    game,
    favoriteTeamId: mockUser.favoriteTeamId
  });
}
