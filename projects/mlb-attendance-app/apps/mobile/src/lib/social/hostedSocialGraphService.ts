import type { FollowRequest, FollowStatus, FriendProfile, ProfileVisibility, SocialActivityItem, SocialActivityType } from "@mlb-attendance/domain";
import { getSupabaseEnv, supabase } from "../persistence/supabaseClient";
import type { SocialGraphService } from "./socialGraphService";

type PublicProfileRow = {
  user_id: string;
  username: string | null;
  display_name: string;
  favorite_team_id: string | null;
  avatar_url: string | null;
  profile_visibility: ProfileVisibility;
  shared_games_logged: number | null;
  shared_stadiums_visited: number | null;
  shared_home_runs_witnessed: number | null;
  shared_level_title: string | null;
  relationship_status: FollowStatus | null;
};

type PendingFollowRow = {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string | null;
  display_name: string;
  favorite_team_id: string | null;
  avatar_url: string | null;
  profile_visibility: ProfileVisibility;
  shared_games_logged: number | null;
  shared_stadiums_visited: number | null;
  shared_home_runs_witnessed: number | null;
  shared_level_title: string | null;
};

type SocialActivityRow = {
  activity_id: string;
  actor_user_id: string;
  actor_display_name: string;
  actor_username: string | null;
  game_id: string;
  venue_id: string;
  attended_on: string;
  activity_at: string;
  activity_type: SocialActivityType;
  memory_preview: string | null;
  milestone_label: string | null;
};

function requireSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env.isConfigured || !supabase) {
    throw new Error("Hosted social features are enabled but Supabase env vars are missing.");
  }

  return supabase;
}

function isHostedSocialUnavailable(message: string) {
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
    "function public.search_profiles",
    "function public.get_following_profiles",
    "function public.get_follower_profiles",
    "function public.get_following_activity_feed",
    "function public.get_pending_follow_requests",
    "function public.get_friend_profile",
    "relation \"user_follows\" does not exist",
    "schema cache"
  ].some((pattern) => normalized.includes(pattern));
}

async function requireAuthenticatedUserId() {
  const client = requireSupabaseClient();
  const {
    data: { session },
    error
  } = await client.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.user?.id) {
    throw new Error("Sign in again to manage follow relationships.");
  }

  return session.user.id;
}

function mapProfileRow(row: PublicProfileRow): FriendProfile {
  return {
    id: row.user_id,
    username: row.username ?? undefined,
    displayName: row.display_name,
    favoriteTeamId: row.favorite_team_id ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    profileVisibility: row.profile_visibility,
    sharedGamesLogged: row.shared_games_logged ?? null,
    sharedStadiumsVisited: row.shared_stadiums_visited ?? null,
    sharedHomeRunsWitnessed: row.shared_home_runs_witnessed ?? null,
    sharedLevelTitle: row.shared_level_title ?? null,
    relationshipStatus: row.relationship_status ?? "not_following"
  };
}

function mapSocialActivityRow(row: SocialActivityRow): SocialActivityItem {
  return {
    id: row.activity_id,
    actorUserId: row.actor_user_id,
    actorDisplayName: row.actor_display_name,
    actorUsername: row.actor_username ?? undefined,
    gameId: row.game_id,
    venueId: row.venue_id,
    attendedOn: row.attended_on,
    activityAt: row.activity_at,
    activityType: row.activity_type,
    memoryPreview: row.memory_preview,
    milestoneLabel: row.milestone_label
  };
}

function mapPendingFollowRow(row: PendingFollowRow, currentUserId: string): FollowRequest {
  return {
    id: row.id,
    followerId: row.follower_id,
    followingId: row.following_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    direction: row.following_id === currentUserId ? "incoming" : "outgoing",
    profile: {
      id: row.user_id,
      username: row.username ?? undefined,
      displayName: row.display_name,
      favoriteTeamId: row.favorite_team_id ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      profileVisibility: row.profile_visibility,
      sharedGamesLogged: row.shared_games_logged ?? null,
      sharedStadiumsVisited: row.shared_stadiums_visited ?? null,
      sharedHomeRunsWitnessed: row.shared_home_runs_witnessed ?? null,
      sharedLevelTitle: row.shared_level_title ?? null,
      relationshipStatus: row.status
    }
  };
}

export const hostedSocialGraphService: SocialGraphService = {
  kind: "hosted",
  async searchProfiles(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();
    const { data, error } = await client.rpc("search_profiles", {
      search_query: params.query.trim() || null
    });

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as PublicProfileRow[])
      .filter((row) => row.user_id !== currentUserId)
      .map(mapProfileRow);
  },
  async getFollowing() {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc("get_following_profiles");

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as PublicProfileRow[]).map(mapProfileRow);
  },
  async getFollowers() {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc("get_follower_profiles");

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as PublicProfileRow[]).map(mapProfileRow);
  },
  async getFollowingActivity(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    const { data, error } = await client.rpc("get_following_activity_feed");

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as SocialActivityRow[]).map(mapSocialActivityRow);
  },
  async getPendingFollowRequests(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();
    const { data, error } = await client.rpc("get_pending_follow_requests");

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return [];
      }
      throw new Error(error.message);
    }

    return ((data ?? []) as PendingFollowRow[]).map((row) => mapPendingFollowRow(row, currentUserId));
  },
  async requestFollow(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    if (params.currentUserId === params.targetUserId) {
      throw new Error("You cannot follow yourself.");
    }

    const { error: rpcError } = await client.rpc("follow_user", {
      target_user_id: params.targetUserId
    });

    if (!rpcError) {
      return;
    }

    if (
      !rpcError.message.toLowerCase().includes("function public.follow_user")
      && !rpcError.message.toLowerCase().includes("function follow_user")
    ) {
      throw new Error(rpcError.message);
    }

    const { data: existing, error: existingError } = await client
      .from("user_follows")
      .select("id, status")
      .eq("follower_id", params.currentUserId)
      .eq("following_id", params.targetUserId)
      .maybeSingle<{ id: string; status: FollowStatus }>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing?.status === "accepted") {
      return;
    }

    if (existing?.status === "pending") {
      const { error: updateError } = await client
        .from("user_follows")
        .update({ status: "accepted" })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
      return;
    }

    if (existing?.status === "blocked") {
      throw new Error("That profile is not available for new follow requests right now.");
    }

    if (existing?.id) {
      const { error: deleteError } = await client.from("user_follows").delete().eq("id", existing.id);
      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }

    const { error } = await client.from("user_follows").insert({
      follower_id: params.currentUserId,
      following_id: params.targetUserId,
      status: "accepted"
    });

    if (error) {
      throw new Error(error.message);
    }
  },
  async acceptFollowRequest(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    const { error } = await client
      .from("user_follows")
      .update({ status: "accepted" })
      .eq("id", params.requestId)
      .eq("following_id", params.currentUserId)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }
  },
  async rejectFollowRequest(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    const { error } = await client
      .from("user_follows")
      .update({ status: "rejected" })
      .eq("id", params.requestId)
      .eq("following_id", params.currentUserId)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }
  },
  async unfollowUser(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    const { error: rpcError } = await client.rpc("unfollow_user", {
      target_user_id: params.targetUserId
    });

    if (!rpcError) {
      return;
    }

    if (
      !rpcError.message.toLowerCase().includes("function public.unfollow_user")
      && !rpcError.message.toLowerCase().includes("function unfollow_user")
    ) {
      throw new Error(rpcError.message);
    }

    const { error } = await client
      .from("user_follows")
      .delete()
      .eq("follower_id", params.currentUserId)
      .eq("following_id", params.targetUserId);

    if (error) {
      throw new Error(error.message);
    }
  },
  async getFriendProfile(params) {
    const client = requireSupabaseClient();
    const currentUserId = await requireAuthenticatedUserId();

    if (currentUserId !== params.currentUserId) {
      throw new Error("Your account context is out of date. Refresh and try again.");
    }

    const { data, error } = await client.rpc("get_friend_profile", {
      target_user_id: params.targetUserId
    });

    if (error) {
      if (isHostedSocialUnavailable(error.message)) {
        return null;
      }
      throw new Error(error.message);
    }

    const row = Array.isArray(data) ? data[0] : null;
    return row ? mapProfileRow(row as PublicProfileRow) : null;
  }
};
