import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Screen } from "../src/components/common/Screen";
import { LabeledInput } from "../src/components/common/LabeledInput";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { SectionCard } from "../src/components/common/SectionCard";
import { useAppData } from "../src/providers/AppDataProvider";
import { colors, spacing } from "../src/styles/tokens";

export default function FollowingScreen() {
  const router = useRouter();
  const { teams, friends, followers, searchProfiles, requestFollow, unfollowUser } = useAppData();
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
    setPendingActionIds((current) => [...current, friendId]);
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
    setPendingActionIds((current) => [...current, friendId]);
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
        <SectionCard title="Find people" subtitle="Search by username, display name, or exact email to grow your social circle.">
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
                <View key={friend.id} style={styles.personCard}>
                  <Pressable style={styles.personCopy} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
                    <Text style={styles.personName}>{friend.displayName}</Text>
                    <Text style={styles.personMeta}>{friend.username ? `@${friend.username}` : "@fan"}</Text>
                    {statLine ? <Text style={styles.personMeta}>{statLine}</Text> : null}
                  </Pressable>
                  {isFollowing ? (
                    <PrimaryButton label={isActing ? "Following..." : "Following"} onPress={() => router.push((`/friends/${friend.id}`) as Href)} disabled={isActing} />
                  ) : (
                    <PrimaryButton label={isActing ? "Following..." : "Follow"} onPress={() => void handleFollow(friend.id)} disabled={isActing} />
                  )}
                </View>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Activity" subtitle="A lightweight feed of what people you follow are adding to their ledger.">
          <Text style={styles.helperText}>Follow people to see their activity.</Text>
        </SectionCard>

        <SectionCard title="Following" subtitle="The people whose baseball ledgers you can revisit right now.">
          <View style={styles.stack}>
            {followingCards.length ? followingCards.map((friend) => {
              const favoriteTeam = teams.find((team) => team.id === friend.favoriteTeamId);
              const statLine = [
                friend.sharedGamesLogged !== null && friend.sharedGamesLogged !== undefined ? `${friend.sharedGamesLogged} games` : null,
                favoriteTeam?.name ?? null
              ].filter(Boolean).join(" · ");
              const isActing = pendingActionIds.includes(friend.id);

              return (
                <View key={friend.id} style={styles.personCard}>
                  <Pressable style={styles.personCopy} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
                    <Text style={styles.personName}>{friend.displayName}</Text>
                    <Text style={styles.personMeta}>{friend.username ? `@${friend.username}` : "@fan"}</Text>
                    {statLine ? <Text style={styles.personMeta}>{statLine}</Text> : null}
                  </Pressable>
                  <View style={styles.actionStack}>
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
                <Pressable key={friend.id} style={styles.personCard} onPress={() => router.push((`/friends/${friend.id}`) as Href)}>
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
  linkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy
  }
});
