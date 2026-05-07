import { friends as seededFriends } from "../data/mockSportsData";
import type { FollowRequest, FriendProfile } from "@mlb-attendance/domain";
import { normalizeDisplayNameToUsername } from "./username";
import type { SocialGraphService } from "./socialGraphService";

function withDefaultStatus(profile: FriendProfile, status: FriendProfile["relationshipStatus"]) {
  return {
    ...profile,
    relationshipStatus: status
  };
}

export const localSocialGraphService: SocialGraphService = {
  kind: "local",
  async previewUsername(params) {
    return normalizeDisplayNameToUsername(params.displayName);
  },
  async searchProfiles(params) {
    const query = params.query.trim().toLowerCase();
    return seededFriends
      .filter((friend) => friend.id !== params.currentUserId)
      .filter((friend) => {
        if (!query) {
          return true;
        }

        return [friend.displayName, friend.bio, friend.homeCity]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .map((friend) => withDefaultStatus(friend, "not_following"));
  },
  async getFollowing(params) {
    const following = new Set(params.followingIds ?? []);
    return seededFriends
      .filter((friend) => following.has(friend.id))
      .map((friend) => withDefaultStatus(friend, "accepted"));
  },
  async getFollowers() {
    return [];
  },
  async getFollowingActivity() {
    return [];
  },
  async getPendingFollowRequests() {
    return [];
  },
  async requestFollow() {
    return;
  },
  async acceptFollowRequest() {
    return;
  },
  async rejectFollowRequest() {
    return;
  },
  async unfollowUser() {
    return;
  },
  async getFriendProfile(params) {
    const friend = seededFriends.find((candidate) => candidate.id === params.targetUserId);
    return friend ? withDefaultStatus(friend, "accepted") : null;
  }
};
