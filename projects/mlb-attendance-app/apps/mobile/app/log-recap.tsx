import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/common/Screen";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { SectionCard } from "../src/components/common/SectionCard";
import { useAppData } from "../src/providers/AppDataProvider";
import { colors, spacing } from "../src/styles/tokens";
import { formatGameLabel } from "../src/lib/formatters";
import type { Game } from "@mlb-attendance/domain";

const milestoneTargets = [1, 5, 10, 20, 30, 50];

function getGameInsight(game: Game) {
  const topHitter = [...(game.battersUsed ?? [])].sort((left, right) => {
    if (right.homeRuns !== left.homeRuns) {
      return right.homeRuns - left.homeRuns;
    }
    if (right.hits !== left.hits) {
      return right.hits - left.hits;
    }
    return right.rbis - left.rbis;
  })[0];
  const topPitcher = [...(game.pitchersUsed ?? [])].sort((left, right) => {
    if ((right.strikeouts ?? 0) !== (left.strikeouts ?? 0)) {
      return (right.strikeouts ?? 0) - (left.strikeouts ?? 0);
    }
    return (right.inningsPitched ?? 0) - (left.inningsPitched ?? 0);
  })[0];

  if (topHitter && (topHitter.homeRuns > 0 || topHitter.hits > 0)) {
    return `${topHitter.playerName} finished ${topHitter.hits}-${topHitter.atBats}${topHitter.homeRuns ? ` with ${topHitter.homeRuns} HR` : ""}.`;
  }

  if (topPitcher && ((topPitcher.strikeouts ?? 0) > 0 || (topPitcher.inningsPitched ?? 0) > 0)) {
    return `${topPitcher.pitcherName} worked ${topPitcher.inningsPitched ?? 0} IP with ${topPitcher.strikeouts ?? 0} K.`;
  }

  return null;
}

function getMilestoneMessage(totalGames: number, stadiums: number) {
  const gameMilestone = milestoneTargets.includes(totalGames) ? `${totalGames} games logged` : null;
  const stadiumMilestone = [1, 5, 10, 20, 30].includes(stadiums) ? `${stadiums} stadiums visited` : null;

  if (gameMilestone && stadiumMilestone) {
    return `Milestone unlocked: ${gameMilestone} and ${stadiumMilestone}.`;
  }
  if (gameMilestone) {
    return `Milestone unlocked: ${gameMilestone}.`;
  }
  if (stadiumMilestone) {
    return `Milestone unlocked: ${stadiumMilestone}.`;
  }

  const nextGameTarget = milestoneTargets.find((target) => target > totalGames);
  if (!nextGameTarget) {
    return "Your ledger cleared every current game milestone.";
  }

  return `${nextGameTarget - totalGames} more ${nextGameTarget - totalGames === 1 ? "game" : "games"} until ${nextGameTarget} logged.`;
}

export default function LogRecapScreen() {
  const router = useRouter();
  const { logId } = useLocalSearchParams<{ logId?: string }>();
  const { isHydrated, isAuthenticated, attendanceLogs, games, teams, venues, stats } = useAppData();
  const authRoute = "/auth" as Href;
  const gamesById = new Map(games.map((game) => [game.id, game]));
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const venuesById = new Map(venues.map((venue) => [venue.id, venue]));
  const log = typeof logId === "string" ? attendanceLogs.find((entry) => entry.id === logId) : attendanceLogs[0];
  const game = log ? gamesById.get(log.gameId) : undefined;
  const label = game ? formatGameLabel(game, teamsById, venuesById) : null;
  const gameInsight = game ? getGameInsight(game) : null;
  const isPlayerDataComplete = Boolean(game?.battersUsed?.length && game?.pitchersUsed?.length);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href={authRoute} />;
  }

  if (!log || !game || !label) {
    return <Redirect href={"/(tabs)/history" as Href} />;
  }

  return (
    <Screen
      title="Game Added"
      subtitle="A quick recap of what just changed in your ledger."
    >
      <SectionCard title="Your Latest Add">
        <Text style={styles.successTitle}>Game added to your ledger.</Text>
        <Text style={styles.primaryText}>{label.title}</Text>
        <Text style={styles.secondaryText}>{label.subtitle}</Text>
        <Text style={styles.secondaryText}>Final: {label.score}</Text>
      </SectionCard>

      <View style={styles.grid}>
        <SectionCard title="Ledger Update">
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total games</Text>
              <Text style={styles.statValue}>{stats.totalGamesAttended}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Stadiums</Text>
              <Text style={styles.statValue}>{stats.uniqueStadiumsVisited}</Text>
            </View>
          </View>
          <Text style={styles.secondaryText}>
            Favorite-team record: {stats.favoriteTeamSplit ? `${stats.favoriteTeamSplit.wins}-${stats.favoriteTeamSplit.losses}` : `${stats.wins}-${stats.losses}`}
          </Text>
          <Text style={styles.secondaryText}>{getMilestoneMessage(stats.totalGamesAttended, stats.uniqueStadiumsVisited)}</Text>
        </SectionCard>

        <SectionCard title="Player Snapshot">
          {isPlayerDataComplete ? (
            <Text style={styles.primaryText}>{gameInsight ?? "Player data is attached, but this game did not produce one standout line yet."}</Text>
          ) : (
            <Text style={styles.secondaryText}>Player insights for this game are still being backfilled. Your ledger saved correctly.</Text>
          )}
        </SectionCard>
      </View>

      {log.memorableMoment ? (
        <SectionCard title="Memory Saved">
          <Text style={styles.primaryText}>{log.memorableMoment}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.actionStack}>
        <PrimaryButton label="View Dashboard" onPress={() => router.push("/(tabs)" as Href)} />
        <PrimaryButton label="Add Details / Memory" onPress={() => router.push((`/logged-game/${log.id}`) as Href)} />
        <PrimaryButton label="Log Another Game" onPress={() => router.push("/(tabs)/log-game" as Href)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.green
  },
  primaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.slate900,
    fontWeight: "700"
  },
  secondaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate500
  },
  grid: {
    gap: spacing.lg
  },
  statGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.slate050,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs
  },
  statLabel: {
    fontSize: 12,
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
  }
});
