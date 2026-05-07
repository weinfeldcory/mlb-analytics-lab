import type { FollowRequest, FriendProfile, SocialActivityItem } from "@mlb-attendance/domain";

export interface SocialGraphService {
  kind: "local" | "hosted";
  searchProfiles: (params: { currentUserId: string; query: string }) => Promise<FriendProfile[]>;
  getFollowing: (params: { currentUserId: string; followingIds?: string[] }) => Promise<FriendProfile[]>;
  getFollowers: (params: { currentUserId: string }) => Promise<FriendProfile[]>;
  getFollowingActivity: (params: { currentUserId: string }) => Promise<SocialActivityItem[]>;
  getPendingFollowRequests: (params: { currentUserId: string }) => Promise<FollowRequest[]>;
  requestFollow: (params: { currentUserId: string; targetUserId: string }) => Promise<void>;
  acceptFollowRequest: (params: { currentUserId: string; requestId: string }) => Promise<void>;
  rejectFollowRequest: (params: { currentUserId: string; requestId: string }) => Promise<void>;
  unfollowUser: (params: { currentUserId: string; targetUserId: string }) => Promise<void>;
  getFriendProfile: (params: { currentUserId: string; targetUserId: string }) => Promise<FriendProfile | null>;
}
