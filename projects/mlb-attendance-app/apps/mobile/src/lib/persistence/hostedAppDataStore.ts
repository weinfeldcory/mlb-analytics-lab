import AsyncStorage from "@react-native-async-storage/async-storage";
import { games, mockUser, teams, venues } from "../data/mockSportsData";
import { calculatePersonalStats, type AttendanceLog, type UserProfile, type WitnessedEvent } from "@mlb-attendance/domain";
import type {
  AppDataStore,
  AppSessionAccount,
  CurrentSessionState,
  HydratedAppDataState,
  PersistCurrentUserParams,
  SignInParams,
  SignOutParams,
  SignUpParams
} from "./appDataStore";
import { buildHostedRedirectUrl, getSupabaseEnv, supabase } from "./supabaseClient";

type AttendanceLogRow = {
  id: string;
  user_id: string;
  game_id: string;
  venue_id: string;
  attended_on: string;
  seat_section: string;
  seat_row: string | null;
  seat_number: string | null;
  witnessed_events: WitnessedEvent[] | null;
  memorable_moment: string | null;
  companion: string | null;
  giveaway: string | null;
  weather: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  username?: string | null;
  display_name: string;
  favorite_team_id: string | null;
  avatar_url?: string | null;
  profile_visibility?: "public" | "followers_only" | "private";
  following_ids: string[] | null;
  has_completed_onboarding: boolean;
  shared_games_logged?: number | null;
  shared_stadiums_visited?: number | null;
  shared_home_runs_witnessed?: number | null;
  shared_level_title?: string | null;
};

const PROFILE_SELECT_BASE = "id, email, display_name, favorite_team_id, following_ids, has_completed_onboarding";
const PROFILE_SELECT_EXTENDED = `${PROFILE_SELECT_BASE}, username, avatar_url, profile_visibility, shared_games_logged, shared_stadiums_visited, shared_home_runs_witnessed, shared_level_title`;

function isMissingProfileSchemaError(message: string) {
  const normalized = message.toLowerCase();
  return [
    "profiles.username",
    "profiles.avatar_url",
    "profiles.profile_visibility",
    "shared_games_logged",
    "shared_stadiums_visited",
    "shared_home_runs_witnessed",
    "shared_level_title",
    "'username' column",
    "'avatar_url' column",
    "'profile_visibility' column",
    "'shared_games_logged' column",
    "'shared_stadiums_visited' column",
    "'shared_home_runs_witnessed' column",
    "'shared_level_title' column",
    "schema cache"
  ].some((pattern) => normalized.includes(pattern));
}

type AttendanceLogUpsertRow = Omit<AttendanceLogRow, "id">;
type HostedCachedState = {
  version: 1;
  userId: string;
  email: string;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
  lastLocalWriteAt: string;
};

function sortAttendanceLogs(logs: AttendanceLog[]) {
  return [...logs].sort((left, right) => right.attendedOn.localeCompare(left.attendedOn));
}

function buildHostedCacheKey(userId: string) {
  return `hostedCache_${userId}`;
}

function mergeAttendanceLogs(primary: AttendanceLog[], secondary: AttendanceLog[]) {
  const byGameId = new Map<string, AttendanceLog>();

  primary.forEach((log) => {
    byGameId.set(log.gameId, log);
  });

  secondary.forEach((log) => {
    byGameId.set(log.gameId, log);
  });

  return sortAttendanceLogs([...byGameId.values()]);
}

function mergeHostedProfile(remoteProfile: UserProfile, cachedProfile?: UserProfile) {
  if (!cachedProfile) {
    return remoteProfile;
  }

  return {
    ...remoteProfile,
    username: cachedProfile.username ?? remoteProfile.username,
    displayName: cachedProfile.displayName?.trim() || remoteProfile.displayName,
    favoriteTeamId: cachedProfile.favoriteTeamId ?? remoteProfile.favoriteTeamId,
    followingIds: cachedProfile.followingIds ?? remoteProfile.followingIds,
    avatarUrl: cachedProfile.avatarUrl ?? remoteProfile.avatarUrl,
    profileVisibility: cachedProfile.profileVisibility ?? remoteProfile.profileVisibility,
    hasCompletedOnboarding: cachedProfile.hasCompletedOnboarding ?? remoteProfile.hasCompletedOnboarding
  };
}

async function loadHostedCache(userId: string): Promise<HostedCachedState | null> {
  const raw = await AsyncStorage.getItem(buildHostedCacheKey(userId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HostedCachedState>;
    if (
      parsed.version !== 1
      || parsed.userId !== userId
      || typeof parsed.email !== "string"
      || !parsed.profile
      || !Array.isArray(parsed.attendanceLogs)
      || typeof parsed.lastLocalWriteAt !== "string"
    ) {
      return null;
    }

    return {
      version: 1,
      userId,
      email: parsed.email,
      profile: parsed.profile,
      attendanceLogs: sortAttendanceLogs(parsed.attendanceLogs),
      lastLocalWriteAt: parsed.lastLocalWriteAt
    };
  } catch {
    return null;
  }
}

async function saveHostedCache(params: {
  userId: string;
  email: string;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
}) {
  const payload: HostedCachedState = {
    version: 1,
    userId: params.userId,
    email: params.email,
    profile: params.profile,
    attendanceLogs: sortAttendanceLogs(params.attendanceLogs),
    lastLocalWriteAt: new Date().toISOString()
  };

  await AsyncStorage.setItem(buildHostedCacheKey(params.userId), JSON.stringify(payload, null, 2));
}

function createSignedOutState(): HydratedAppDataState {
  return {
    accounts: [],
    currentAccount: null,
    currentUserId: null,
    profile: mockUser,
    attendanceLogs: []
  };
}

function requireSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env.isConfigured || !supabase) {
    throw new Error("Hosted auth is enabled but Supabase env vars are missing.");
  }

  return supabase;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // Fall through to String(error).
  }

  return String(error);
}

function mapProfileRowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username ?? undefined,
    displayName: row.display_name,
    favoriteTeamId: row.favorite_team_id ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    profileVisibility: row.profile_visibility ?? "followers_only",
    followingIds: row.following_ids ?? [],
    hasCompletedOnboarding: row.has_completed_onboarding
  };
}

function buildDefaultUsername(email: string, userId: string) {
  const base = email
    .split("@")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "fan"}-${userId.replace(/-/g, "").slice(0, 6)}`;
}

const SOCIAL_LEVEL_RULES = {
  game: 10,
  stadium: 40,
  homeRun: 3,
  extraInnings: 15,
  walkOff: 20,
  uniqueTeam: 5
} as const;

const SOCIAL_LEVEL_THRESHOLDS = [
  { title: "Rookie Scorer", points: 0 },
  { title: "Bleacher Regular", points: 100 },
  { title: "Series Tracker", points: 250 },
  { title: "Road Tripper", points: 450 },
  { title: "Stadium Hunter", points: 700 },
  { title: "Homer Historian", points: 1000 },
  { title: "Pennant Chaser", points: 1400 },
  { title: "Ledger Legend", points: 1900 }
];

function getSharedProfileStats(profile: UserProfile, attendanceLogs: AttendanceLog[]) {
  const stats = calculatePersonalStats({
    user: profile,
    attendanceLogs,
    games,
    teams,
    venues
  });
  const attendedGames = attendanceLogs
    .map((log) => games.find((game) => game.id === log.gameId))
    .filter(Boolean);
  const extraInningsGames = attendedGames.filter((game) => (game?.innings ?? 0) > 9).length;
  const walkOffGames = attendedGames.filter((game) => Boolean(game?.walkOff)).length;
  const uniqueTeamsSeen = stats.teamSeenSummaries.length;
  const points =
    stats.totalGamesAttended * SOCIAL_LEVEL_RULES.game +
    stats.uniqueStadiumsVisited * SOCIAL_LEVEL_RULES.stadium +
    stats.witnessedHomeRuns * SOCIAL_LEVEL_RULES.homeRun +
    extraInningsGames * SOCIAL_LEVEL_RULES.extraInnings +
    walkOffGames * SOCIAL_LEVEL_RULES.walkOff +
    uniqueTeamsSeen * SOCIAL_LEVEL_RULES.uniqueTeam;
  const currentLevel = [...SOCIAL_LEVEL_THRESHOLDS].reverse().find((level) => points >= level.points) ?? SOCIAL_LEVEL_THRESHOLDS[0];

  return {
    gamesLogged: stats.totalGamesAttended,
    stadiumsVisited: stats.uniqueStadiumsVisited,
    homeRunsWitnessed: stats.witnessedHomeRuns,
    levelTitle: currentLevel.title
  };
}

function mapAttendanceRowToLog(row: AttendanceLogRow): AttendanceLog {
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    venueId: row.venue_id,
    attendedOn: row.attended_on,
    seat: {
      section: row.seat_section,
      row: row.seat_row ?? undefined,
      seatNumber: row.seat_number ?? undefined
    },
    witnessedEvents: row.witnessed_events ?? [],
    memorableMoment: row.memorable_moment ?? undefined,
    companion: row.companion ?? undefined,
    giveaway: row.giveaway ?? undefined,
    weather: row.weather ?? undefined
  };
}

function mapAttendanceRowToUpsertRow(row: AttendanceLogRow): AttendanceLogUpsertRow {
  return {
    user_id: row.user_id,
    game_id: row.game_id,
    venue_id: row.venue_id,
    attended_on: row.attended_on,
    seat_section: row.seat_section.trim(),
    seat_row: row.seat_row?.trim() || null,
    seat_number: row.seat_number?.trim() || null,
    witnessed_events: row.witnessed_events ?? [],
    memorable_moment: row.memorable_moment?.trim() || null,
    companion: row.companion?.trim() || null,
    giveaway: row.giveaway?.trim() || null,
    weather: row.weather?.trim() || null
  };
}

function mapLogToAttendanceUpsertRow(log: AttendanceLog): AttendanceLogUpsertRow {
  return {
    user_id: log.userId,
    game_id: log.gameId,
    venue_id: log.venueId,
    attended_on: log.attendedOn,
    seat_section: log.seat.section.trim(),
    seat_row: log.seat.row?.trim() || null,
    seat_number: log.seat.seatNumber?.trim() || null,
    witnessed_events: log.witnessedEvents ?? [],
    memorable_moment: log.memorableMoment?.trim() || null,
    companion: log.companion?.trim() || null,
    giveaway: log.giveaway?.trim() || null,
    weather: log.weather?.trim() || null
  };
}

function buildAccount(userId: string, email: string): AppSessionAccount {
  return {
    id: userId,
    label: email
  };
}

async function fetchProfileRowForUser(userId: string) {
  const client = requireSupabaseClient();
  const extendedQuery = await client
    .from("profiles")
    .select(PROFILE_SELECT_EXTENDED)
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (!extendedQuery.error) {
    return extendedQuery.data ?? null;
  }

  if (!isMissingProfileSchemaError(extendedQuery.error.message)) {
    throw new Error(extendedQuery.error.message);
  }

  const fallbackQuery = await client
    .from("profiles")
    .select(PROFILE_SELECT_BASE)
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (fallbackQuery.error) {
    throw new Error(`profiles fallback read failed: ${fallbackQuery.error.message}`);
  }

  return fallbackQuery.data ?? null;
}

async function upsertHostedProfile(params: {
  userId: string;
  email: string;
  profile: UserProfile;
  attendanceLogs: AttendanceLog[];
}) {
  const client = requireSupabaseClient();
  const sharedStats = getSharedProfileStats(params.profile, params.attendanceLogs);
  const fullRow = {
    id: params.userId,
    email: params.email,
    username: params.profile.username?.trim().toLowerCase() || buildDefaultUsername(params.email, params.userId),
    display_name: params.profile.displayName.trim(),
    favorite_team_id: params.profile.favoriteTeamId ?? null,
    avatar_url: params.profile.avatarUrl?.trim() || null,
    profile_visibility: params.profile.profileVisibility ?? "followers_only",
    following_ids: params.profile.followingIds ?? [],
    has_completed_onboarding: params.profile.hasCompletedOnboarding ?? false,
    shared_games_logged: sharedStats.gamesLogged,
    shared_stadiums_visited: sharedStats.stadiumsVisited,
    shared_home_runs_witnessed: sharedStats.homeRunsWitnessed,
    shared_level_title: sharedStats.levelTitle
  };

  const { error: fullError } = await client.from("profiles").upsert(fullRow);
  if (!fullError) {
    return;
  }

  if (!isMissingProfileSchemaError(fullError.message)) {
    throw new Error(`profiles upsert failed: ${fullError.message}`);
  }

  const { error: fallbackError } = await client.from("profiles").upsert({
    id: params.userId,
    email: params.email,
    display_name: params.profile.displayName.trim(),
    favorite_team_id: params.profile.favoriteTeamId ?? null,
    following_ids: params.profile.followingIds ?? [],
    has_completed_onboarding: params.profile.hasCompletedOnboarding ?? false
  });

  if (fallbackError) {
    throw new Error(`profiles fallback upsert failed: ${fallbackError.message}`);
  }
}

async function ensureHostedProfile(userId: string, email: string, fallbackDisplayName?: string) {
  const client = requireSupabaseClient();
  const existingProfile = await fetchProfileRowForUser(userId);

  if (existingProfile) {
    return existingProfile;
  }

  const seedProfile = {
    id: userId,
    email,
    username: buildDefaultUsername(email, userId),
    display_name: fallbackDisplayName?.trim() || email.split("@")[0] || "Fan",
    favorite_team_id: null,
    avatar_url: null,
    profile_visibility: "followers_only" as const,
    following_ids: [],
    has_completed_onboarding: false,
    shared_games_logged: 0,
    shared_stadiums_visited: 0
  };

  await upsertHostedProfile({
    userId,
    email,
    profile: mapProfileRowToProfile(seedProfile),
    attendanceLogs: []
  });

  return (await fetchProfileRowForUser(userId)) ?? seedProfile;
}

async function fetchHydratedStateForUser(userId: string, email: string, fallbackDisplayName?: string) {
  const client = requireSupabaseClient();
  const cachedState = await loadHostedCache(userId);

  try {
    const profileRow = await ensureHostedProfile(userId, email, fallbackDisplayName);
  const { data: rawAttendanceRows, error: attendanceError } = await client
      .from("attendance_logs")
      .select(
        "id, user_id, game_id, venue_id, attended_on, seat_section, seat_row, seat_number, witnessed_events, memorable_moment, companion, giveaway, weather"
      )
      .eq("user_id", userId)
      .order("attended_on", { ascending: false })
      .returns<AttendanceLogRow[]>();

    if (attendanceError) {
      throw new Error(`attendance read failed: ${attendanceError.message}`);
    }

    const remoteState = {
      accounts: [buildAccount(userId, email)],
      currentAccount: buildAccount(userId, email),
      currentUserId: userId,
      profile: mapProfileRowToProfile(profileRow),
      attendanceLogs: (rawAttendanceRows ?? []).map(mapAttendanceRowToLog)
    } satisfies HydratedAppDataState;

    const mergedState = cachedState
      ? {
          ...remoteState,
          profile: mergeHostedProfile(remoteState.profile, cachedState.profile),
          attendanceLogs: mergeAttendanceLogs(remoteState.attendanceLogs, cachedState.attendanceLogs)
        }
      : remoteState;

    await saveHostedCache({
      userId,
      email,
      profile: mergedState.profile,
      attendanceLogs: mergedState.attendanceLogs
    });

    return mergedState;
  } catch (error) {
    if (cachedState) {
      return {
        accounts: [buildAccount(userId, cachedState.email)],
        currentAccount: buildAccount(userId, cachedState.email),
        currentUserId: userId,
        profile: cachedState.profile,
        attendanceLogs: sortAttendanceLogs(cachedState.attendanceLogs)
      };
    }

    throw new Error(`hosted hydration failed: ${toErrorMessage(error)}`);
  }
}

async function syncHostedState(params: PersistCurrentUserParams) {
  if (!params.currentUserId) {
    return;
  }

  const client = requireSupabaseClient();
  const {
    data: { session },
    error: sessionError
  } = await client.auth.getSession();

  if (sessionError) {
    throw new Error(`session lookup failed: ${sessionError.message}`);
  }

  if (!session?.user) {
    throw new Error("Your hosted session expired. Sign in again.");
  }

  const email = session.user.email;
  if (!email) {
    throw new Error("Hosted account is missing an email address.");
  }

  await saveHostedCache({
    userId: session.user.id,
    email,
    profile: params.profile,
    attendanceLogs: params.attendanceLogs
  });

  await upsertHostedProfile({
    userId: session.user.id,
    email,
    profile: params.profile,
    attendanceLogs: params.attendanceLogs
  });

  const nextRows = params.attendanceLogs.map((log) =>
    mapLogToAttendanceUpsertRow({
      ...log,
      userId: session.user.id
    })
  );

  const { data: existingRows, error: existingRowsError } = await client
    .from("attendance_logs")
    .select("game_id")
    .eq("user_id", session.user.id)
    .returns<Array<{ game_id: string }>>();

  if (existingRowsError) {
    throw new Error(`existing attendance read failed: ${existingRowsError.message}`);
  }

  const nextGameIds = new Set(nextRows.map((row) => row.game_id));
  const gameIdsToDelete = (existingRows ?? []).map((row) => row.game_id).filter((gameId) => !nextGameIds.has(gameId));

  if (nextRows.length > 0) {
    const { error: upsertLogsError } = await client
      .from("attendance_logs")
      .upsert(nextRows, { onConflict: "user_id,game_id" });
    if (upsertLogsError) {
      throw new Error(`attendance upsert failed: ${upsertLogsError.message}`);
    }
  }

  if (gameIdsToDelete.length > 0) {
    const { error: deleteLogsError } = await client
      .from("attendance_logs")
      .delete()
      .eq("user_id", session.user.id)
      .in("game_id", gameIdsToDelete);

    if (deleteLogsError) {
      throw new Error(`attendance delete failed: ${deleteLogsError.message}`);
    }
  }

  await saveHostedCache({
    userId: session.user.id,
    email,
    profile: params.profile,
    attendanceLogs: params.attendanceLogs
  });
}

export const hostedAppDataStore: AppDataStore = {
  kind: "hosted",
  async hydrate() {
    const client = requireSupabaseClient();
    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!session?.user?.email) {
      return createSignedOutState();
    }

    return fetchHydratedStateForUser(
      session.user.id,
      session.user.email,
      session.user.user_metadata?.display_name as string | undefined
    );
  },
  persistCurrentUser: syncHostedState,
  async signIn(params: SignInParams) {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: params.identifier.trim(),
      password: params.password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user?.email) {
      throw new Error("Hosted sign-in did not return a usable session.");
    }

    return fetchHydratedStateForUser(data.user.id, data.user.email, data.user.user_metadata?.display_name as string | undefined);
  },
  async signUp(params: SignUpParams) {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: params.identifier.trim(),
      password: params.password,
      options: {
        data: {
          display_name: params.displayName?.trim() || params.identifier.trim().split("@")[0] || "Fan"
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user?.email) {
      throw new Error("Hosted sign-up did not return a usable account.");
    }

    if (!data.session) {
      throw new Error("Sign-up succeeded, but email confirmation is still required before the ledger can open.");
    }

    return fetchHydratedStateForUser(
      data.user.id,
      data.user.email,
      (data.user.user_metadata?.display_name as string | undefined) ?? params.displayName
    );
  },
  async signOut(params: SignOutParams) {
    try {
      await syncHostedState(params.currentSession);
    } catch {
      // Logout should not be blocked by a sync failure.
    }

    const client = requireSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }

    return createSignedOutState();
  },
  async requestPasswordReset(identifier: string) {
    const client = requireSupabaseClient();
    const email = identifier.trim().toLowerCase();

    if (!email) {
      throw new Error("Enter your email first.");
    }

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: buildHostedRedirectUrl("/reset-password")
    });
    if (error) {
      throw new Error(error.message);
    }

    return "If that email has a hosted account, a password reset email is on the way.";
  }
};
