import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/common/Screen";
import { SectionCard } from "../../components/common/SectionCard";
import { RecentMomentRow } from "../../components/stats/RecentMomentRow";
import { StatCard } from "../../components/stats/StatCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";

function formatWinPct(wins: number, losses: number) {
  const total = wins + losses;
  if (!total) {
    return ".000";
  }

  return `${(wins / total).toFixed(3).replace(/^0/, "")}`;
}

export function StatsScreen() {
  const { profile, stats } = useAppData();

  return (
    <Screen
      title="Stats"
      subtitle="A clean overview of the attendance record that matters most: totals, team performance, places visited, and the moments worth remembering."
    >
      <View style={styles.grid}>
        <StatCard label="Games Attended" value={`${stats.totalGamesAttended}`} accent="navy" />
        <StatCard label="Record" value={`${stats.wins}-${stats.losses}`} accent="green" />
        <StatCard label="Win Percentage" value={formatWinPct(stats.wins, stats.losses)} accent="amber" />
        <StatCard label="Home Runs Witnessed" value={`${stats.witnessedHomeRuns}`} accent="navy" />
      </View>

      <SectionCard title="Favorite Team Split">
        {stats.favoriteTeamSplit ? (
          <>
            <Text style={styles.primaryText}>
              {profile.displayName}, you have attended {stats.favoriteTeamSplit.gamesAttended} {stats.favoriteTeamSplit.teamName} games.
            </Text>
            <Text style={styles.secondaryText}>
              Record witnessed: {stats.favoriteTeamSplit.wins}-{stats.favoriteTeamSplit.losses}
            </Text>
          </>
        ) : (
          <Text style={styles.secondaryText}>Set a favorite team to unlock team-specific attendance splits.</Text>
        )}
      </SectionCard>

      <SectionCard title="Places">
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Unique stadiums visited</Text>
          <Text style={styles.metricValue}>{stats.uniqueStadiumsVisited}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Unique sections sat in</Text>
          <Text style={styles.metricValue}>{stats.uniqueSectionsSatIn}</Text>
        </View>
      </SectionCard>

      <SectionCard title="Recent Memorable Moments">
        {stats.recentMoments.map((moment) => (
          <RecentMomentRow key={moment.attendanceLogId} moment={moment} />
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  primaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate900,
    fontWeight: "600"
  },
  secondaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate500
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metricLabel: {
    fontSize: 15,
    color: colors.slate700
  },
  metricValue: {
    fontSize: 20,
    color: colors.navy,
    fontWeight: "700"
  }
});
