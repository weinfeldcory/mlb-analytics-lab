import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { attendanceLogs as seededAttendanceLogs, games, mockUser, teams, venues } from "../lib/data/mockSportsData";
import { buildAttendanceLog } from "../lib/api/attendanceService";
import { searchGames as searchCatalogGames } from "../lib/api/catalogService";
import { calculatePersonalStats } from "@mlb-attendance/domain";
import type { AttendanceLog, CreateAttendanceInput, Game, PersonalStats, Team, UserProfile, Venue } from "@mlb-attendance/domain";

interface AppDataContextValue {
  profile: UserProfile;
  teams: Team[];
  venues: Venue[];
  games: Game[];
  attendanceLogs: AttendanceLog[];
  stats: PersonalStats;
  addAttendanceLog: (input: CreateAttendanceInput) => Promise<AttendanceLog>;
  updateAttendanceLog: (
    logId: string,
    updates: {
      seat: AttendanceLog["seat"];
      memorableMoment?: string;
      companion?: string;
      giveaway?: string;
      weather?: string;
    }
  ) => Promise<AttendanceLog>;
  deleteAttendanceLog: (logId: string) => Promise<void>;
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

  async function updateAttendanceLog(
    logId: string,
    updates: {
      seat: AttendanceLog["seat"];
      memorableMoment?: string;
      companion?: string;
      giveaway?: string;
      weather?: string;
    }
  ) {
    let updatedLog: AttendanceLog | undefined;

    setAttendanceLogs((currentLogs) =>
      currentLogs.map((log) => {
        if (log.id !== logId) {
          return log;
        }

        updatedLog = {
          ...log,
          seat: {
            section: updates.seat.section.trim(),
            row: updates.seat.row?.trim() || undefined,
            seatNumber: updates.seat.seatNumber?.trim() || undefined
          },
          memorableMoment: updates.memorableMoment?.trim() || undefined,
          companion: updates.companion?.trim() || undefined,
          giveaway: updates.giveaway?.trim() || undefined,
          weather: updates.weather?.trim() || undefined
        };

        return updatedLog;
      })
    );

    if (!updatedLog) {
      throw new Error("That attendance log could not be found.");
    }

    return updatedLog;
  }

  async function deleteAttendanceLog(logId: string) {
    let deleted = false;

    setAttendanceLogs((currentLogs) =>
      currentLogs.filter((log) => {
        const shouldKeep = log.id !== logId;
        if (!shouldKeep) {
          deleted = true;
        }
        return shouldKeep;
      })
    );

    if (!deleted) {
      throw new Error("That attendance log could not be found.");
    }
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
    updateAttendanceLog,
    deleteAttendanceLog,
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
