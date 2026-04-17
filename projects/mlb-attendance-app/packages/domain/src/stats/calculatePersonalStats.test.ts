import test from "node:test";
import assert from "node:assert/strict";
import { calculatePersonalStats } from "./calculatePersonalStats";
import type { AttendanceLog, Game, Team, UserProfile, Venue } from "../models";

const user: UserProfile = {
  id: "user_1",
  displayName: "Cory",
  favoriteTeamId: "team_nyy"
};

const teams: Team[] = [
  { id: "team_nyy", sport: "MLB", city: "New York", name: "Yankees", abbreviation: "NYY" },
  { id: "team_bos", sport: "MLB", city: "Boston", name: "Red Sox", abbreviation: "BOS" }
];

const venues: Venue[] = [
  { id: "venue_yankee", name: "Yankee Stadium", city: "Bronx", state: "NY" },
  { id: "venue_fenway", name: "Fenway Park", city: "Boston", state: "MA" }
];

const games: Game[] = [
  {
    id: "game_1",
    sport: "MLB",
    startDate: "2025-07-20",
    venueId: "venue_fenway",
    homeTeamId: "team_bos",
    awayTeamId: "team_nyy",
    homeScore: 0,
    awayScore: 5,
    status: "final",
    featuredPlayerHomeRun: "Aaron Judge"
  },
  {
    id: "game_2",
    sport: "MLB",
    startDate: "2025-04-06",
    venueId: "venue_yankee",
    homeTeamId: "team_nyy",
    awayTeamId: "team_bos",
    homeScore: 6,
    awayScore: 4,
    status: "final"
  }
];

test("calculatePersonalStats derives totals, favorite team split, and recent moments", () => {
  const attendanceLogs: AttendanceLog[] = [
    {
      id: "attendance_1",
      userId: "user_1",
      gameId: "game_2",
      venueId: "venue_yankee",
      attendedOn: "2025-04-06",
      seat: { section: "214A" },
      witnessedEvents: [{ id: "e1", attendanceLogId: "attendance_1", type: "team_win", label: "Win" }],
      memorableMoment: "Home opener"
    },
    {
      id: "attendance_2",
      userId: "user_1",
      gameId: "game_1",
      venueId: "venue_fenway",
      attendedOn: "2025-07-20",
      seat: { section: "Grandstand 12" },
      witnessedEvents: [
        { id: "e2", attendanceLogId: "attendance_2", type: "team_win", label: "Win" },
        { id: "e3", attendanceLogId: "attendance_2", type: "shutout", label: "Shutout" },
        { id: "e4", attendanceLogId: "attendance_2", type: "home_run", label: "Aaron Judge home run" }
      ],
      memorableMoment: "Road shutout"
    }
  ];

  const stats = calculatePersonalStats({
    user,
    attendanceLogs,
    games,
    teams,
    venues
  });

  assert.equal(stats.totalGamesAttended, 2);
  assert.equal(stats.wins, 2);
  assert.equal(stats.losses, 0);
  assert.equal(stats.uniqueStadiumsVisited, 2);
  assert.equal(stats.uniqueSectionsSatIn, 2);
  assert.equal(stats.witnessedHomeRuns, 1);
  assert.deepEqual(stats.favoriteTeamSplit, {
    teamId: "team_nyy",
    teamName: "Yankees",
    gamesAttended: 2,
    wins: 2,
    losses: 0
  });
  assert.deepEqual(
    stats.recentMoments.map((moment) => moment.title),
    ["Road shutout", "Home opener"]
  );
  assert.equal(stats.recentMoments[0]?.subtitle, "Against Red Sox on 2025-07-20");
});
