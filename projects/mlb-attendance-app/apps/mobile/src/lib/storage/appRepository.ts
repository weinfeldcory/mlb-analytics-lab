import AsyncStorage from "@react-native-async-storage/async-storage";
import { attendanceLogs as seededAttendanceLogs, mockUser } from "../data/mockSportsData";
import type { AttendanceLog, UserProfile } from "@mlb-attendance/domain";

const STORAGE_KEY = "mlb-attendance-app:state";
const STORAGE_VERSION = 1;

interface PersistedAppStateV1 {
  version: 1;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
}

export interface AppRepositoryState {
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
}

function createDefaultState(): AppRepositoryState {
  return {
    profile: mockUser,
    attendanceLogs: [...seededAttendanceLogs].sort((left, right) => right.attendedOn.localeCompare(left.attendedOn)),
    seededDataImported: true
  };
}

function normalizeProfile(input: UserProfile | null | undefined): UserProfile {
  return {
    id: input?.id || mockUser.id,
    displayName: input?.displayName?.trim() || mockUser.displayName,
    favoriteTeamId: input?.favoriteTeamId || undefined
  };
}

function normalizeAttendanceLog(log: AttendanceLog): AttendanceLog {
  return {
    ...log,
    seat: {
      section: log.seat.section.trim(),
      row: log.seat.row?.trim() || undefined,
      seatNumber: log.seat.seatNumber?.trim() || undefined
    },
    memorableMoment: log.memorableMoment?.trim() || undefined,
    companion: log.companion?.trim() || undefined,
    giveaway: log.giveaway?.trim() || undefined,
    weather: log.weather?.trim() || undefined
  };
}

function sanitizeState(input: AppRepositoryState): AppRepositoryState {
  return {
    profile: normalizeProfile(input.profile),
    attendanceLogs: input.attendanceLogs
      .map((log) => normalizeAttendanceLog(log))
      .sort((left, right) => right.attendedOn.localeCompare(left.attendedOn)),
    seededDataImported: input.seededDataImported
  };
}

export function serializeAppState(state: AppRepositoryState): string {
  const sanitizedState = sanitizeState(state);
  const payload: PersistedAppStateV1 = {
    version: STORAGE_VERSION,
    profile: sanitizedState.profile,
    attendanceLogs: sanitizedState.attendanceLogs,
    seededDataImported: sanitizedState.seededDataImported
  };

  return JSON.stringify(payload, null, 2);
}

export function parseImportedAppState(raw: string): AppRepositoryState {
  const parsed = JSON.parse(raw) as unknown;
  return migratePersistedState(parsed);
}

function migratePersistedState(parsed: unknown): AppRepositoryState {
  if (!parsed || typeof parsed !== "object") {
    return createDefaultState();
  }

  const candidate = parsed as Partial<PersistedAppStateV1>;
  if (candidate.version !== STORAGE_VERSION || !candidate.profile || !Array.isArray(candidate.attendanceLogs)) {
    return createDefaultState();
  }

  return sanitizeState({
    profile: candidate.profile,
    attendanceLogs: candidate.attendanceLogs,
    seededDataImported: candidate.seededDataImported ?? true
  });
}

export async function loadAppState(): Promise<AppRepositoryState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    return migratePersistedState(JSON.parse(raw));
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return createDefaultState();
  }
}

export async function saveAppState(state: AppRepositoryState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, serializeAppState(state));
}

export async function clearAppState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
