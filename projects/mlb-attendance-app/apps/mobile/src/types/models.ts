export type SportCode = "MLB";

export interface UserProfile {
  id: string;
  displayName: string;
  favoriteTeamId?: string;
}

export interface Team {
  id: string;
  sport: SportCode;
  city: string;
  name: string;
  abbreviation: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
}

export interface Game {
  id: string;
  sport: SportCode;
  startDate: string;
  venueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: "final";
  innings?: number;
  walkOff?: boolean;
  featuredPlayerHomeRun?: string;
}

export interface SeatInfo {
  section: string;
  row?: string;
  seatNumber?: string;
}

export interface WitnessedEvent {
  id: string;
  attendanceLogId: string;
  type:
    | "team_win"
    | "team_loss"
    | "home_run"
    | "walk_off"
    | "extra_innings"
    | "shutout";
  label: string;
  playerName?: string;
  teamId?: string;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  gameId: string;
  venueId: string;
  attendedOn: string;
  seat: SeatInfo;
  witnessedEvents: WitnessedEvent[];
  memorableMoment?: string;
}

export interface FavoriteTeamSplit {
  teamId: string;
  teamName: string;
  gamesAttended: number;
  wins: number;
  losses: number;
}

export interface RecentMoment {
  attendanceLogId: string;
  title: string;
  subtitle: string;
}

export interface PersonalStats {
  totalGamesAttended: number;
  wins: number;
  losses: number;
  uniqueStadiumsVisited: number;
  uniqueSectionsSatIn: number;
  favoriteTeamSplit?: FavoriteTeamSplit;
  witnessedHomeRuns: number;
  recentMoments: RecentMoment[];
}

export interface CreateAttendanceInput {
  userId: string;
  gameId: string;
  seat: SeatInfo;
}
