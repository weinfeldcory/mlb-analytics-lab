import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import type { SocialActivityItem } from "@mlb-attendance/domain";
import { Screen } from "../src/components/common/Screen";
import { LabeledInput } from "../src/components/common/LabeledInput";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { SectionCard } from "../src/components/common/SectionCard";
import { useAppData } from "../src/providers/AppDataProvider";
import { formatDisplayDate, formatGameLabel } from "../src/lib/formatters";
import { useResponsiveLayout } from "../src/styles/responsive";
import { colors, spacing } from "../src/styles/tokens";

export default function FollowingScreen() {
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const { teams, venues, games, currentUserId, profile, attendanceLogs, followingActivity, friends, followers, searchProfiles, requestFollow, unfollowUser } = useAppData();
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<typeof friends>([]);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [hasSearchedPeople, setHasSearchedPeople] = useState(false);
  const [peopleErrorMessage, setPeopleErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [pendingActionIds, setPendingActionIds] = useState<string[]>([]);
  const [optimisticFollowedIds, setOptimisticFollowedIds] = useState<string[]>([]);
  const [optimisticUnfollowedIds, setOptimisticUnfollowedIds] = useState<string[]>([]);

  const canonicalFollowingIds = friends.map((friend) => friend.id);
  const effectiveFollowingIds = new Set([
    ...canonicalFollowingIds.filter((id) => !optimisticUnfollowedIds.includes(id)),
    ...optimisticFollowedIds
  ]);
  const optimisticFollowingCards = peopleResults.filter((friend) => (
    optimisticFollowedIds.includes(friend.id)
    && !friends.some((existingFriend) => existingFriend.id === friend.id)
  ));
  const followingCards = [
    ...optimisticFollowingCards,
    ...friends.filter((friend) => !optimisticUnfollowedIds.includes(friend.id))
  ];
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const ownActivity = useMemo<SocialActivityItem[]>(() => {
    if (!currentUserId) {
      return [];
    }

    const milestoneThresholds = new Map<number, string>([
      [1, "Reached 1 logged game"],
      [5, "Reached 5 logged games"],
      [10, "Reached 10 logged games"],
      [25, "Reached 25 logged games"],
      [50, "Reached 50 logged games"]
    ]);

    return [...attendanceLogs]
      .sort((left, right) => left.attendedOn.localeCompare(right.attendedOn))
      .flatMap((log, index) => {
        const activityAt = `${log.attendedOn}T12:00:00.000Z`;
        const baseId = `${currentUserId}:${log.id}`;
        const items: SocialActivityItem[] = [
          {
            id: `${baseId}:log`,
            actorUserId: currentUserId,
            actorDisplayName: profile.displayName,
            actorUsername: profile.username,
            gameId: log.gameId,
            venueId: log.venueId,
            attendedOn: log.attendedOn,
            activityAt,
            activityType: "logged_game"
          }
        ];

        if (log.memorableMoment?.trim()) {
          items.push({
            id: `${baseId}:memory`,
            actorUserId: currentUserId,
            actorDisplayName: profile.displayName,
            actorUsername: profile.username,
            gameId: log.gameId,
            venueId: log.venueId,
            attendedOn: log.attendedOn,
            activityAt,
            activityType: "added_memory",
            memoryPreview: log.memorableMoment.trim()
          });
        }

        const milestoneLabel = milestoneThresholds.get(index + 1);
        if (milestoneLabel) {
          items.push({
            id: `${baseId}:milestone:${index + 1}`,
            actorUserId: currentUserId,
            actorDisplayName: profile.displayName,
            actorUsername: profile.username,
            gameId: log.gameId,
            venueId: log.venueId,
            attendedOn: log.attendedOn,
            activityAt,
            activityType: "milestone_reached",
            milestoneLabel
          });
        }

        return items;
      });
  }, [attendanceLogs, currentUserId, profile.displayName, profile.username]);

  const activityFeed = useMemo(() => {
    return [...ownActivity, ...followingActivity.filter((item) => item.actorUserId !== currentUserId)]
      .sort((left, right) => right.activityAt.localeCompare(left.activityAt))
      .slice(0, 20);
  }, [currentUserId, followingActivity, ownActivity]);

  useEffect(() => {
    const trimmedQuery = peopleQuery.trim();
    if (!trimmedQuery) {
      setPeopleResults([]);
      setHasSearchedPeople(false);
      setPeopleErrorMessage(null);
      setIsSearchingPeople(false);
      return;
    }

    let isCancelled = false;
    const timeout = setTimeout(() => {
      setIsSearchingPeople(true);
      void searchProfiles(trimmedQuery)
        .then((results) => {
          if (isCancelled) {
            return;
          }
          setPeopleResults(results);
          setHasSearchedPeople(true);
          setPeopleErrorMessage(null);
        })
        .catch((error) => {
          if (isCancelled) {
            return;
          }
          setPeopleResults([]);
          setHasSearchedPeople(true);
          setPeopleErrorMessage(error instanceof Error ? error.message : "Could not search profiles right now.");
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearchingPeople(false);
          }
        });
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [peopleQuery, searchProfiles]);

  useEffect(() => {
    setOptimisticFollowedIds((current) => current.filter((id) => !canonicalFollowingIds.includes(id)));
    setOptimisticUnfollowedIds((current) => current.filter((id) => canonicalFollowingIds.includes(id)));
  }, [canonicalFollowingIds]);

  async function handleFollow(friendId: string) {
    setActionErrorMessage(null);
    setPendingActionIds((current) => (current.includes(friendId) ? current : [...current, friendId]));
    setOptimisticFollowedIds((current) => (current.includes(friendId) ? current : [...current, friendId]));

    try {
      await requestFollow(friendId);
      setPeopleResults((current) => current.map((friend) => (
        friend.id === friendId
          ? { ...friend, relationshipStatus: "accepted" }
          : friend
      )));
    } catch (error) {
      setOptimisticFollowedIds((current) => current.filter((id) => id !== friendId));
      setActionErrorMessage(error instanceof Error ? error.message : "Could not follow that user right now.");
    } finally {
      setPendingActionIds((current) => current.filter((id) => id !== friendId));
    }
  }

  async function handleUnfollow(friendId: string) {
    setActionErrorMessage(null);
    setPendingActionIds((current) => (current.includes(friendId) ? current : [...current, friendId]));
    setOptimisticUnfollowedIds((current) => (current.includes(friendId) ? current : [...current, friendId]));

    try {
      await unfollowUser(friendId);
      setPeopleResults((current) => current.map((friend) => (
        friend.id === friendId
          ? { ...friend, relationshipStatus: "not_following" }
          : friend
      )));
    } catch (error) {
      setOptimisticUnfollowedIds((current) => current.filter((id) => id !== friendId));
      setActionErrorMessage(error instanceof Error ? error.message : "Could not unfollow that user right now.");
    } finally {
      setPendingActionIds((current) => current.filter((id) => id !== friendId));
    }
  }

  return (
    <Screen
      title="Following"
      subtitle="Find friends, follow their baseball history, and see what they’re logging."
    >
      <View style={styles.layout}>
        <SectionCard title="Find people" subtitle="Search by username, display name, or exact email to grow your Witnessed network.">
          <View style={styles.stack}>
            <LabeledInput
              label="Search for people to follow"
              value={peopleQuery}
              onChangeText={setPeopleQuery}
              placeholder="Search by username, display name, or exact email"
            />
            {isSearchingPeople ? <Text style={styles.helperText}>Searching…</Text> : null}
            {!peopleQuery.trim() ? <Text style={styles.helperText}>Search for people to follow</Text> : null}
            {peopleErrorMessage ? <Text style={styles.errorText}>{peopleErrorMessage}</Text> : null}
            {actionErrorMessage ? <Text style={styles.errorText}>{actionErrorMessage}</Text> : null}
            {!isSearchingPeople && hasSearchedPeople && !peopleErrorMessage && peopleResults.length === 0 ? (
              <Text style={styles.helperText}>No users found</Text>
            ) : null}
            {peopleResults.map((friend) => {
              const favoriteTeam = teams.find((team) => team.id === friend.favoriteTeamId);
              const statLine = [
                friend.sharedGamesLogged !== null && friend.sharedGamesLogged !== undefined ? `${friend.sharedGamesLogged} games` : null,
                favoriteTeam?.name ?? null
              ].filter(Boolean).join(" · ");
              const isFollowing = effectiveFollowingIds.has(friend.id);
              const isActing = pendingActionIds.includes(friend.id);

              return (
                <View key={friend.id} style={[styles.personCard, responsive.isCompact ? styles.personCardCompact : null]}>
                  <Pressable style={styles.personCopy} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
                    <Text style={styles.personName}>{friend.displayName}</Text>
                    <Text style={styles.personMeta}>{friend.username ? `@${friend.username}` : "@fan"}</Text>
                    {statLine ? <Text style={styles.personMeta}>{statLine}</Text> : null}
                  </Pressable>
                  {isFollowing ? (
                    <View style={[styles.actionStack, responsive.isCompact ? styles.actionStackCompact : null]}>
                      <PrimaryButton label={isActing ? "Following..." : "Following"} onPress={() => router.push((`/friends/${friend.id}`) as Href)} disabled={isActing} />
                    </View>
                  ) : (
                    <View style={[styles.actionStack, responsive.isCompact ? styles.actionStackCompact : null]}>
                      <PrimaryButton label={isActing ? "Following..." : "Follow"} onPress={() => void handleFollow(friend.id)} disabled={isActing} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Activity" subtitle="Recent baseball activity from your account and the people you follow.">
          <View style={styles.stack}>
            {!activityFeed.length ? (
              <Text style={styles.helperText}>
                {friends.length ? "No baseball activity yet." : "Follow people to see their baseball activity here."}
              </Text>
            ) : activityFeed.map((activity) => {
              const game = gamesById.get(activity.gameId);
              const label = game ? formatGameLabel(game, teamsById, venuesById) : null;
              const venueName = venuesById.get(activity.venueId)?.name ?? "Unknown venue";
              const actorHandle = activity.actorUsername ? `@${activity.actorUsername}` : "@fan";
              const actionCopy =
                activity.activityType === "added_memory"
                  ? "added a memory"
                  : activity.activityType === "milestone_reached"
                    ? activity.milestoneLabel ?? "reached a milestone"
                    : "logged a game";
              const preview = activity.memoryPreview?.trim();

              return (
                <Pressable
                  key={activity.id}
                  style={[styles.activityCard, responsive.isCompact ? styles.activityCardCompact : null]}
                  onPress={() => {
                    if (activity.actorUserId === currentUserId) {
                      const ownLog = attendanceLogs.find((log) => log.gameId === activity.gameId && log.attendedOn === activity.attendedOn);
                      if (ownLog) {
                        router.push((`/logged-game/${ownLog.id}`) as Href);
                        return;
                      }
                    }

                    router.push((`/friends/${activity.actorUserId}`) as Href);
                  }}
                >
                  <Text style={styles.activityEyebrow}>{activity.actorDisplayName} · {actorHandle}</Text>
                  <Text style={styles.activityTitle}>{actionCopy}</Text>
                  {label ? <Text style={styles.personName}>{label.title}</Text> : null}
                  <Text style={styles.personMeta}>
                    {formatDisplayDate(activity.attendedOn)} · {label ? label.score : venueName}
                  </Text>
                  <Text style={styles.personMeta}>{label ? label.subtitle.split("•")[1]?.trim() ?? venueName : venueName}</Text>
                  {preview ? <Text style={styles.activityPreview}>“{preview.length > 120 ? `${preview.slice(0, 117)}...` : preview}”</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Following" subtitle="The people whose baseball history you can revisit right now.">
          <View style={styles.stack}>
            {followingCards.length ? followingCards.map((friend) => {
              const favoriteTeam = teams.find((team) => team.id === friend.favoriteTeamId);
              const statLine = [
                friend.sharedGamesLogged !== null && friend.sharedGamesLogged !== undefined ? `${friend.sharedGamesLogged} games` : null,
                favoriteTeam?.name ?? null
              ].filter(Boolean).join(" · ");
              const isActing = pendingActionIds.includes(friend.id);

              return (
                <View key={friend.id} style={[styles.personCard, responsive.isCompact ? styles.personCardCompact : null]}>
                  <Pressable style={styles.personCopy} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
                    <Text style={styles.personName}>{friend.displayName}</Text>
                    <Text style={styles.personMeta}>{friend.username ? `@${friend.username}` : "@fan"}</Text>
                    {statLine ? <Text style={styles.personMeta}>{statLine}</Text> : null}
                  </Pressable>
                  <View style={[styles.actionStack, responsive.isCompact ? styles.actionStackCompact : null]}>
                    <PrimaryButton label="View" onPress={() => router.push((`/friends/${friend.id}`) as Href)} />
                    <Pressable onPress={() => void handleUnfollow(friend.id)} disabled={isActing}>
                      <Text style={styles.linkText}>Unfollow</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }) : <Text style={styles.helperText}>You’re not following anyone yet. Search for people above.</Text>}
          </View>
        </SectionCard>

        <SectionCard title="Followers" subtitle="The fans who already follow your baseball history.">
          <View style={styles.stack}>
            {followers.length ? followers.map((friend) => {
              const favoriteTeam = teams.find((team) => team.id === friend.favoriteTeamId);

              return (
                <Pressable key={friend.id} style={[styles.personCard, responsive.isCompact ? styles.personCardCompact : null]} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>{friend.displayName}</Text>
                    <Text style={styles.personMeta}>
                      {friend.username ? `@${friend.username}` : "@fan"}
                      {favoriteTeam ? ` · ${favoriteTeam.name}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.linkText}>View</Text>
                </Pressable>
              );
            }) : <Text style={styles.helperText}>No followers yet.</Text>}
          </View>
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: spacing.lg
  },
  stack: {
    gap: spacing.md
  },
  personCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.slate050
  },
  personCardCompact: {
    flexDirection: "column"
  },
  activityCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised
  },
  activityCardCompact: {
    padding: spacing.sm
  },
  personCopy: {
    flex: 1,
    gap: spacing.xs
  },
  personName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.slate900
  },
  personMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.slate500
  },
  activityEyebrow: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  activityTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.slate700
  },
  activityPreview: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.slate700
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.slate500
  },
  errorText: {
    fontSize: 14,
    color: colors.red
  },
  actionStack: {
    alignItems: "flex-end",
    gap: spacing.sm
  },
  actionStackCompact: {
    width: "100%",
    alignItems: "stretch"
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy
  }
});
