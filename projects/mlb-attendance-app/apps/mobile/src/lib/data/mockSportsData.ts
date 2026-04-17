import type { AttendanceLog, Game, Team, UserProfile, Venue } from "@mlb-attendance/domain";

export const mockUser: UserProfile = {
  id: "user_1",
  displayName: "Cory",
  favoriteTeamId: "team_nyy"
};

export const teams: Team[] = [
  { id: "team_nyy", sport: "MLB", city: "New York", name: "Yankees", abbreviation: "NYY" },
  { id: "team_bos", sport: "MLB", city: "Boston", name: "Red Sox", abbreviation: "BOS" },
  { id: "team_bal", sport: "MLB", city: "Baltimore", name: "Orioles", abbreviation: "BAL" },
  { id: "team_lad", sport: "MLB", city: "Los Angeles", name: "Dodgers", abbreviation: "LAD" }
];

export const venues: Venue[] = [
  { id: "venue_yankee", name: "Yankee Stadium", city: "Bronx", state: "NY" },
  { id: "venue_camden", name: "Camden Yards", city: "Baltimore", state: "MD" },
  { id: "venue_fenway", name: "Fenway Park", city: "Boston", state: "MA" }
];

export const games: Game[] = [
  {
    id: "game_001",
    sport: "MLB",
    startDate: "2025-04-06",
    venueId: "venue_yankee",
    homeTeamId: "team_nyy",
    awayTeamId: "team_bos",
    homeScore: 6,
    awayScore: 4,
    status: "final",
    featuredPlayerHomeRun: "Aaron Judge"
  },
  {
    id: "game_002",
    sport: "MLB",
    startDate: "2025-05-18",
    venueId: "venue_camden",
    homeTeamId: "team_bal",
    awayTeamId: "team_nyy",
    homeScore: 2,
    awayScore: 1,
    status: "final",
    innings: 10,
    walkOff: true
  },
  {
    id: "game_003",
    sport: "MLB",
    startDate: "2025-07-20",
    venueId: "venue_fenway",
    homeTeamId: "team_bos",
    awayTeamId: "team_nyy",
    homeScore: 0,
    awayScore: 5,
    status: "final",
    featuredPlayerHomeRun: "Aaron Judge"
  }
];

export const attendanceLogs: AttendanceLog[] = [
  {
    id: "attendance_001",
    userId: "user_1",
    gameId: "game_001",
    venueId: "venue_yankee",
    attendedOn: "2025-04-06",
    seat: {
      section: "214A",
      row: "5",
      seatNumber: "7"
    },
    witnessedEvents: [
      {
        id: "event_001",
        attendanceLogId: "attendance_001",
        type: "team_win",
        label: "Yankees win",
        teamId: "team_nyy"
      },
      {
        id: "event_002",
        attendanceLogId: "attendance_001",
        type: "home_run",
        label: "Aaron Judge home run",
        playerName: "Aaron Judge",
        teamId: "team_nyy"
      }
    ],
    memorableMoment: "Judge put one into the left-field seats in the seventh."
  },
  {
    id: "attendance_002",
    userId: "user_1",
    gameId: "game_002",
    venueId: "venue_camden",
    attendedOn: "2025-05-18",
    seat: {
      section: "76"
    },
    witnessedEvents: [
      {
        id: "event_003",
        attendanceLogId: "attendance_002",
        type: "team_loss",
        label: "Yankees loss",
        teamId: "team_nyy"
      },
      {
        id: "event_004",
        attendanceLogId: "attendance_002",
        type: "extra_innings",
        label: "Extra-innings game"
      },
      {
        id: "event_005",
        attendanceLogId: "attendance_002",
        type: "walk_off",
        label: "Walk-off finish"
      }
    ],
    memorableMoment: "The Orioles won it in the tenth on a walk-off single."
  },
  {
    id: "attendance_003",
    userId: "user_1",
    gameId: "game_003",
    venueId: "venue_fenway",
    attendedOn: "2025-07-20",
    seat: {
      section: "Grandstand 12",
      row: "9"
    },
    witnessedEvents: [
      {
        id: "event_006",
        attendanceLogId: "attendance_003",
        type: "team_win",
        label: "Yankees win",
        teamId: "team_nyy"
      },
      {
        id: "event_007",
        attendanceLogId: "attendance_003",
        type: "shutout",
        label: "Shutout victory",
        teamId: "team_nyy"
      },
      {
        id: "event_008",
        attendanceLogId: "attendance_003",
        type: "home_run",
        label: "Aaron Judge home run",
        playerName: "Aaron Judge",
        teamId: "team_nyy"
      }
    ],
    memorableMoment: "A road shutout at Fenway with another Judge homer."
  }
];
