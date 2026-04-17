import type {
  AttendanceLog,
  FavoriteTeamSplit,
  Game,
  PersonalStats,
  Team,
  UserProfile,
  Venue
} from "../models";

function didTeamWin(game: Game, teamId: string) {
  if (game.homeTeamId === teamId) {
    return game.homeScore > game.awayScore;
  }

  if (game.awayTeamId === teamId) {
    return game.awayScore > game.homeScore;
  }

  return false;
}

function createFavoriteTeamSplit(
  favoriteTeamId: string | undefined,
  logs: AttendanceLog[],
  gamesById: Map<string, Game>,
  teamsById: Map<string, Team>
): FavoriteTeamSplit | undefined {
  if (!favoriteTeamId) {
    return undefined;
  }

  const relevantLogs = logs.filter((log) => {
    const game = gamesById.get(log.gameId);
    if (!game) {
      return false;
    }

    return game.homeTeamId === favoriteTeamId || game.awayTeamId === favoriteTeamId;
  });

  const wins = relevantLogs.filter((log) => {
    const game = gamesById.get(log.gameId);
    return game ? didTeamWin(game, favoriteTeamId) : false;
  }).length;

  const teamName = teamsById.get(favoriteTeamId)?.name ?? "Favorite Team";

  return {
    teamId: favoriteTeamId,
    teamName,
    gamesAttended: relevantLogs.length,
    wins,
    losses: relevantLogs.length - wins
  };
}

export function calculatePersonalStats(params: {
  user: UserProfile;
  attendanceLogs: AttendanceLog[];
  games: Game[];
  teams: Team[];
  venues: Venue[];
}): PersonalStats {
  const { user, attendanceLogs, games, teams } = params;
  const gamesById = new Map(games.map((game) => [game.id, game]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const favoriteTeamSplit = createFavoriteTeamSplit(user.favoriteTeamId, attendanceLogs, gamesById, teamsById);

  const wins = attendanceLogs.filter((log) =>
    log.witnessedEvents.some((event) => event.type === "team_win")
  ).length;
  const losses = attendanceLogs.filter((log) =>
    log.witnessedEvents.some((event) => event.type === "team_loss")
  ).length;

  return {
    totalGamesAttended: attendanceLogs.length,
    wins,
    losses,
    uniqueStadiumsVisited: new Set(attendanceLogs.map((log) => log.venueId)).size,
    uniqueSectionsSatIn: new Set(
      attendanceLogs.map((log) => `${log.venueId}:${log.seat.section.trim().toLowerCase()}`)
    ).size,
    favoriteTeamSplit,
    witnessedHomeRuns: attendanceLogs.reduce((count, log) => {
      return count + log.witnessedEvents.filter((event) => event.type === "home_run").length;
    }, 0),
    recentMoments: [...attendanceLogs]
      .sort((left, right) => right.attendedOn.localeCompare(left.attendedOn))
      .slice(0, 3)
      .map((log) => {
        const game = gamesById.get(log.gameId);
        const opponentId = game
          ? game.homeTeamId === user.favoriteTeamId
            ? game.awayTeamId
            : game.homeTeamId
          : undefined;
        const opponentName = opponentId ? teamsById.get(opponentId)?.name : undefined;

        return {
          attendanceLogId: log.id,
          title: log.memorableMoment ?? "Memorable game",
          subtitle: opponentName ? `Against ${opponentName} on ${log.attendedOn}` : log.attendedOn
        };
      })
  };
}
