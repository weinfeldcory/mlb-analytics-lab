import { games, mockUser, teams, venues } from "../data/mockSportsData";
import { calculatePersonalStats } from "../../features/stats/calculatePersonalStats";
import type { AttendanceLog, CreateAttendanceInput, Game, PersonalStats, UserProfile, Venue, WitnessedEvent } from "../../types/models";

function createWitnessedEvents(params: {
  logId: string;
  game: Game;
  favoriteTeamId?: string;
}): WitnessedEvent[] {
  const { logId, game, favoriteTeamId } = params;
  const events: WitnessedEvent[] = [];
  const teamId = favoriteTeamId;

  if (teamId && (game.homeTeamId === teamId || game.awayTeamId === teamId)) {
    const didFavoriteTeamWin =
      (game.homeTeamId === teamId && game.homeScore > game.awayScore) ||
      (game.awayTeamId === teamId && game.awayScore > game.homeScore);

    events.push({
      id: `${logId}_result`,
      attendanceLogId: logId,
      type: didFavoriteTeamWin ? "team_win" : "team_loss",
      label: didFavoriteTeamWin ? "Favorite team win" : "Favorite team loss",
      teamId
    });

    const favoriteTeamRuns = game.homeTeamId === teamId ? game.homeScore : game.awayScore;
    const opponentRuns = game.homeTeamId === teamId ? game.awayScore : game.homeScore;

    if (favoriteTeamRuns > 0 && opponentRuns === 0) {
      events.push({
        id: `${logId}_shutout`,
        attendanceLogId: logId,
        type: "shutout",
        label: "Shutout witnessed",
        teamId
      });
    }
  }

  if ((game.innings ?? 9) > 9) {
    events.push({
      id: `${logId}_extra`,
      attendanceLogId: logId,
      type: "extra_innings",
      label: "Extra-innings game"
    });
  }

  if (game.walkOff) {
    events.push({
      id: `${logId}_walkoff`,
      attendanceLogId: logId,
      type: "walk_off",
      label: "Walk-off finish"
    });
  }

  if (game.featuredPlayerHomeRun) {
    events.push({
      id: `${logId}_hr`,
      attendanceLogId: logId,
      type: "home_run",
      label: `${game.featuredPlayerHomeRun} home run`,
      playerName: game.featuredPlayerHomeRun,
      teamId
    });
  }

  return events;
}

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

  const trimmedSeat = {
    section: input.seat.section.trim(),
    row: input.seat.row?.trim() || undefined,
    seatNumber: input.seat.seatNumber?.trim() || undefined
  };

  const id = `attendance_${Date.now()}`;

  return {
    id,
    userId: input.userId,
    gameId: input.gameId,
    venueId: game.venueId,
    attendedOn: game.startDate,
    seat: trimmedSeat,
    witnessedEvents: createWitnessedEvents({
      logId: id,
      game,
      favoriteTeamId: mockUser.favoriteTeamId
    }),
    memorableMoment: undefined
  };
}
