import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/common/Screen";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";

export function HistoryScreen() {
  const { attendanceLogs, games, teams, venues } = useAppData();
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);

  return (
    <Screen
      title="History"
      subtitle="A simple chronological record of the games you logged, where you sat, and what you saw."
    >
      {attendanceLogs.map((log) => {
        const game = gamesById.get(log.gameId);
        if (!game) {
          return null;
        }

        const label = formatGameLabel(game, teamsById, venuesById);

        return (
          <SectionCard key={log.id} title={label.title}>
            <Text style={styles.subtitle}>{label.subtitle}</Text>
            <Text style={styles.score}>Final: {label.score}</Text>
            <Text style={styles.detail}>
              Seat: {log.seat.section}
              {log.seat.row ? ` • Row ${log.seat.row}` : ""}
              {log.seat.seatNumber ? ` • Seat ${log.seat.seatNumber}` : ""}
            </Text>
            <View style={styles.eventRow}>
              {log.witnessedEvents.slice(0, 3).map((event) => (
                <View key={event.id} style={styles.eventPill}>
                  <Text style={styles.eventLabel}>{event.label}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: colors.slate500
  },
  score: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.slate900
  },
  detail: {
    fontSize: 14,
    color: colors.slate700
  },
  eventRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  eventPill: {
    backgroundColor: colors.slate100,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  eventLabel: {
    fontSize: 12,
    color: colors.navy
  }
});
