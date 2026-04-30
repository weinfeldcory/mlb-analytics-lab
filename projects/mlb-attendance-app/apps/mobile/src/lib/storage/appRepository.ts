import AsyncStorage from "@react-native-async-storage/async-storage";
import { attendanceLogs as seededAttendanceLogs, mockUser } from "../data/mockSportsData";
import type { AttendanceLog, UserProfile } from "@mlb-attendance/domain";

const STORAGE_KEY = "mlb-attendance-app:state";
const STORAGE_VERSION = 5;
const SEEDED_DATA_VERSION = "real-mlb-history-v1";

interface PersistedAppStateV1 {
  version: 1;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
}

interface PersistedAppStateV2 {
  version: 2;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
}

interface PersistedAppStateV3 {
  version: 3;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
  seededDataVersion: string;
}

interface PersistedAppStateV4 {
  version: 4;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
  seededDataVersion: string;
}

interface PersistedAppStateV5 {
  version: 5;
  currentAccountId: string | null;
  accounts: LocalAccountRecord[];
}

export interface AppRepositoryState {
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  seededDataImported: boolean;
  seededDataVersion: string;
}

export interface LocalAccountRecord extends AppRepositoryState {
  id: string;
  username: string;
  password: string;
}

export interface PersistedRootState {
  currentAccountId: string | null;
  accounts: LocalAccountRecord[];
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildUserId(username: string) {
  return `user_${normalizeUsername(username).replace(/[^a-z0-9-_]/g, "") || "local"}`;
}

function createDefaultState(profileOverride?: UserProfile): AppRepositoryState {
  return {
    profile: normalizeProfile(profileOverride ?? mockUser),
    attendanceLogs: [...seededAttendanceLogs].sort((left, right) => right.attendedOn.localeCompare(left.attendedOn)),
    seededDataImported: true,
    seededDataVersion: SEEDED_DATA_VERSION
  };
}

function normalizeProfile(input: UserProfile | null | undefined): UserProfile {
  return {
    id: input?.id || mockUser.id,
    displayName: input?.displayName?.trim() || mockUser.displayName,
    favoriteTeamId: input?.favoriteTeamId || undefined,
    followingIds: [...new Set((input?.followingIds ?? mockUser.followingIds ?? []).filter(Boolean))],
    hasCompletedOnboarding: input?.hasCompletedOnboarding ?? false
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
    seededDataImported: input.seededDataImported,
    seededDataVersion: input.seededDataVersion
  };
}

function sanitizeAccount(account: LocalAccountRecord): LocalAccountRecord {
  const sanitizedState = sanitizeState(account);

  return {
    id: account.id || buildUserId(account.username),
    username: normalizeUsername(account.username),
    password: account.password ?? "",
    ...sanitizedState,
    profile: {
      ...sanitizedState.profile,
      id: sanitizedState.profile.id || buildUserId(account.username)
    }
  };
}

function createRootStateFromLegacy(state: AppRepositoryState): PersistedRootState {
  const baseUsername = normalizeUsername(state.profile.displayName || "cory");
  const account = sanitizeAccount({
    id: state.profile.id || buildUserId(baseUsername),
    username: baseUsername,
    password: "",
    ...state,
    profile: {
      ...state.profile,
      id: state.profile.id || buildUserId(baseUsername)
    }
  });

  return {
    currentAccountId: account.id,
    accounts: [account]
  };
}

function migrateLegacyAppState(parsed: unknown): AppRepositoryState {
  if (!parsed || typeof parsed !== "object") {
    return createDefaultState();
  }

  const candidate = parsed as Partial<PersistedAppStateV1 | PersistedAppStateV2 | PersistedAppStateV3 | PersistedAppStateV4>;
  if (
    (candidate.version !== 1 &&
      candidate.version !== 2 &&
      candidate.version !== 3 &&
      candidate.version !== 4) ||
    !candidate.profile ||
    !Array.isArray(candidate.attendanceLogs)
  ) {
    return createDefaultState();
  }

  if (candidate.version !== 4 || candidate.seededDataVersion !== SEEDED_DATA_VERSION) {
    return {
      ...createDefaultState(candidate.profile),
      profile: normalizeProfile({
        ...candidate.profile,
        hasCompletedOnboarding: true
      })
    };
  }

  return sanitizeState({
    profile: candidate.profile,
    attendanceLogs: candidate.attendanceLogs,
    seededDataImported: candidate.seededDataImported ?? true,
    seededDataVersion: candidate.seededDataVersion ?? SEEDED_DATA_VERSION
  });
}

function migratePersistedRootState(parsed: unknown): PersistedRootState {
  if (!parsed || typeof parsed !== "object") {
    return {
      currentAccountId: null,
      accounts: []
    };
  }

  const candidate = parsed as Partial<PersistedAppStateV5>;
  if (candidate.version === STORAGE_VERSION && Array.isArray(candidate.accounts)) {
    const accounts = candidate.accounts.map(sanitizeAccount);
    const currentAccountId = accounts.some((account) => account.id === candidate.currentAccountId)
      ? candidate.currentAccountId ?? null
      : accounts[0]?.id ?? null;

    return {
      currentAccountId,
      accounts
    };
  }

  return createRootStateFromLegacy(migrateLegacyAppState(parsed));
}

export function createLocalAccount(params: {
  identifier: string;
  password: string;
  displayName?: string;
}): LocalAccountRecord {
  const username = normalizeUsername(params.identifier);
  const userId = buildUserId(username);
  const defaultState = createDefaultState({
    ...mockUser,
    id: userId,
    displayName: params.displayName?.trim() || params.identifier.trim() || mockUser.displayName,
    hasCompletedOnboarding: false
  });

  return sanitizeAccount({
    id: userId,
    username,
    password: params.password,
    ...defaultState,
    profile: {
      ...defaultState.profile,
      id: userId
    }
  });
}

export function serializeAppState(state: AppRepositoryState): string {
  const sanitizedState = sanitizeState(state);
  const payload: PersistedAppStateV4 = {
    version: 4,
    profile: sanitizedState.profile,
    attendanceLogs: sanitizedState.attendanceLogs,
    seededDataImported: sanitizedState.seededDataImported,
    seededDataVersion: sanitizedState.seededDataVersion
  };

  return JSON.stringify(payload, null, 2);
}

export function parseImportedAppState(raw: string): AppRepositoryState {
  const parsed = JSON.parse(raw) as unknown;
  return migrateLegacyAppState(parsed);
}

export async function loadRootState(): Promise<PersistedRootState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      currentAccountId: null,
      accounts: []
    };
  }

  try {
    return migratePersistedRootState(JSON.parse(raw));
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return {
      currentAccountId: null,
      accounts: []
    };
  }
}

export async function saveRootState(state: PersistedRootState): Promise<void> {
  const payload: PersistedAppStateV5 = {
    version: STORAGE_VERSION,
    currentAccountId: state.currentAccountId,
    accounts: state.accounts.map(sanitizeAccount)
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload, null, 2));
}

export async function clearAllAppState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
