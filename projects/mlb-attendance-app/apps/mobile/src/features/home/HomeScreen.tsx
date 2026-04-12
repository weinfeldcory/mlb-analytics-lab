import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../components/common/Screen";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";

export function HomeScreen() {
  const router = useRouter();
  const { attendanceLogs, games, teams, venues, stats } = useAppData();
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const latestLog = attendanceLogs[0];
  const latestGame = latestLog ? gamesById.get(latestLog.gameId) : undefined;
  const latestGameLabel = latestGame ? formatGameLabel(latestGame, teamsById, venuesById) : undefined;

  return (
    <Screen
      title="Your Live Sports Record"
      subtitle="This zero-cost MVP keeps Home focused on the next action, recent activity, and a light progress snapshot."
    >
      <PrimaryButton label="Log a Game" onPress={() => router.push("/(tabs)/log-game")} />

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Games Attended</Text>
          <Text style={styles.statValue}>{stats.totalGamesAttended}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Record</Text>
          <Text style={styles.statValue}>
            {stats.wins}-{stats.losses}
          </Text>
        </View>
      </View>

      <SectionCard title="Latest Logged Game">
        {latestGame && latestGameLabel ? (
          <>
            <Text style={styles.primaryText}>{latestGameLabel.title}</Text>
            <Text style={styles.secondaryText}>{latestGameLabel.subtitle}</Text>
            <Text style={styles.secondaryText}>
              Seat: {latestLog.seat.section}
              {latestLog.seat.row ? ` • Row ${latestLog.seat.row}` : ""}
              {latestLog.seat.seatNumber ? ` • Seat ${latestLog.seat.seatNumber}` : ""}
            </Text>
          </>
        ) : (
          <Text style={styles.secondaryText}>No games logged yet. Add your first attendance record.</Text>
        )}
      </SectionCard>

      <SectionCard title="Recent Moment">
        <Text style={styles.primaryText}>
          {stats.recentMoments[0]?.title ?? "Your memorable moments will show up here after you log a game."}
        </Text>
        {stats.recentMoments[0] ? <Text style={styles.secondaryText}>{stats.recentMoments[0].subtitle}</Text> : null}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: spacing.md
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.xs
  },
  statLabel: {
    fontSize: 14,
    color: colors.slate500
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.navy
  },
  primaryText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.slate900
  },
  secondaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.slate500
  }
});
