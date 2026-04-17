import type { AttendanceLog, CreateAttendanceInput, Game, WitnessedEvent } from "../models";

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

export function buildAttendanceLog(params: {
  input: CreateAttendanceInput;
  game: Game;
  favoriteTeamId?: string;
  now?: number;
}): AttendanceLog {
  const { input, game, favoriteTeamId, now = Date.now() } = params;
  const trimmedSeat = {
    section: input.seat.section.trim(),
    row: input.seat.row?.trim() || undefined,
    seatNumber: input.seat.seatNumber?.trim() || undefined
  };
  const memorableMoment = input.memorableMoment?.trim() || undefined;
  const companion = input.companion?.trim() || undefined;
  const giveaway = input.giveaway?.trim() || undefined;
  const weather = input.weather?.trim() || undefined;

  const id = `attendance_${now}`;

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
      favoriteTeamId
    }),
    memorableMoment,
    companion,
    giveaway,
    weather
  };
}
