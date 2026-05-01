import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/common/Screen";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { SectionCard } from "../../src/components/common/SectionCard";
import { useAppData } from "../../src/providers/AppDataProvider";
import { colors, spacing } from "../../src/styles/tokens";

export default function FriendProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const {
    isHydrated,
    isAuthenticated,
    getFriendProfile,
    requestFollow,
    unfollowUser,
    teams
  } = useAppData();
  const [friend, setFriend] = useState<Awaited<ReturnType<typeof getFriendProfile>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const targetUserId = typeof userId === "string" ? userId : null;
  const favoriteTeamName = useMemo(() => {
    if (!friend?.favoriteTeamId) {
      return null;
    }
    const team = teams.find((candidate) => candidate.id === friend.favoriteTeamId);
    return team ? `${team.city} ${team.name}` : null;
  }, [friend?.favoriteTeamId, teams]);

  useEffect(() => {
    if (!isAuthenticated || !targetUserId) {
      return;
    }

    const nextTargetUserId = targetUserId;

    let canceled = false;

    async function loadFriend() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getFriendProfile(nextTargetUserId);
        if (!canceled) {
          setFriend(result);
        }
      } catch (loadError) {
        if (!canceled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load that fan profile.");
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    }

    void loadFriend();

    return () => {
      canceled = true;
    };
  }, [getFriendProfile, isAuthenticated, targetUserId]);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href={"/auth" as Href} />;
  }

  if (!targetUserId) {
    return <Redirect href={"/(tabs)/profile" as Href} />;
  }

  const canViewSharedStats = friend?.relationshipStatus === "accepted" || friend?.profileVisibility === "public";

  return (
    <Screen
      title={friend?.displayName ?? "Fan Profile"}
      subtitle="A privacy-safe baseball profile that shares only the résumé-level parts of someone’s attendance ledger."
    >
      <SectionCard title="Profile">
        {isLoading ? <Text style={styles.helperText}>Loading fan profile...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!isLoading && !error && !friend ? <Text style={styles.helperText}>That profile could not be found.</Text> : null}
        {friend ? (
          <View style={styles.stack}>
            <Text style={styles.displayName}>{friend.displayName}</Text>
            {friend.username ? <Text style={styles.metaText}>@{friend.username}</Text> : null}
            <Text style={styles.metaText}>
              Favorite team: {favoriteTeamName ?? "Not shared yet"}
            </Text>
            <Text style={styles.metaText}>
              Visibility: {friend.profileVisibility === "public" ? "Public" : friend.profileVisibility === "followers_only" ? "Followers only" : "Private"}
            </Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Shared Baseball Resume">
        {!friend ? <Text style={styles.helperText}>No shared stats available.</Text> : null}
        {friend && canViewSharedStats ? (
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Games logged</Text>
              <Text style={styles.statValue}>{friend.sharedGamesLogged ?? "—"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Stadiums visited</Text>
              <Text style={styles.statValue}>{friend.sharedStadiumsVisited ?? "—"}</Text>
            </View>
          </View>
        ) : null}
        {friend && !canViewSharedStats ? (
          <Text style={styles.helperText}>
            This fan only shares résumé-level stats with accepted followers.
          </Text>
        ) : null}
      </SectionCard>

      {friend ? (
        <SectionCard title="Relationship">
          <View style={styles.actionStack}>
            {friend.relationshipStatus === "accepted" ? (
              <PrimaryButton label="Unfollow" onPress={() => void unfollowUser(friend.id).then(() => router.replace("/(tabs)/profile"))} />
            ) : null}
            {friend.relationshipStatus === "pending" ? (
              <Text style={styles.helperText}>Follow request pending.</Text>
            ) : null}
            {friend.relationshipStatus === "not_following" ? (
              <PrimaryButton label="Request Follow" onPress={() => void requestFollow(friend.id).then(() => router.replace("/(tabs)/profile"))} />
            ) : null}
            {friend.relationshipStatus === "rejected" ? (
              <Text style={styles.helperText}>This request was previously declined. You can try again later.</Text>
            ) : null}
            {friend.relationshipStatus === "blocked" ? (
              <Text style={styles.helperText}>This profile is not available for new follow requests.</Text>
            ) : null}
            <Pressable onPress={() => router.push("/(tabs)/profile" as Href)}>
              <Text style={styles.linkText}>Back to Profile</Text>
            </Pressable>
          </View>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy
  },
  metaText: {
    fontSize: 14,
    color: colors.slate700
  },
  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate500
  },
  errorText: {
    fontSize: 14,
    color: colors.red
  },
  statGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate050,
    gap: spacing.xs
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500,
    fontWeight: "700"
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy
  },
  actionStack: {
    gap: spacing.sm
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy
  }
});
