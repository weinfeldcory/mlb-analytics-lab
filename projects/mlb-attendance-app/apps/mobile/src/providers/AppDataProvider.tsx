import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { attendanceLogs as seededAttendanceLogs, games, mockUser, teams, venues } from "../lib/data/mockSportsData";
import { buildAttendanceLog } from "../lib/api/attendanceService";
import { searchGames as searchCatalogGames } from "../lib/api/catalogService";
import { calculatePersonalStats } from "../features/stats/calculatePersonalStats";
import type { AttendanceLog, CreateAttendanceInput, Game, PersonalStats, Team, UserProfile, Venue } from "../types/models";

interface AppDataContextValue {
  profile: UserProfile;
  teams: Team[];
  venues: Venue[];
  games: Game[];
  attendanceLogs: AttendanceLog[];
  stats: PersonalStats;
  addAttendanceLog: (input: CreateAttendanceInput) => Promise<AttendanceLog>;
  searchGames: (filters: { query?: string; date?: string; stadium?: string }) => Promise<Game[]>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(
    [...seededAttendanceLogs].sort((left, right) => right.attendedOn.localeCompare(left.attendedOn))
  );

  const stats = useMemo(() => {
    return calculatePersonalStats({
      user: mockUser,
      attendanceLogs,
      games,
      teams,
      venues
    });
  }, [attendanceLogs]);

  async function addAttendanceLog(input: CreateAttendanceInput) {
    if (attendanceLogs.some((existingLog) => existingLog.userId === input.userId && existingLog.gameId === input.gameId)) {
      throw new Error("That game is already in your history.");
    }

    const log = await buildAttendanceLog(input);
    setAttendanceLogs((currentLogs) => [log, ...currentLogs]);
    return log;
  }

  async function searchGames(filters: { query?: string; date?: string; stadium?: string }) {
    return searchCatalogGames(filters);
  }

  const value: AppDataContextValue = {
    profile: mockUser,
    teams,
    venues,
    games,
    attendanceLogs,
    stats,
    addAttendanceLog,
    searchGames
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
