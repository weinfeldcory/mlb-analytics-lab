import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Screen } from "../../src/components/common/Screen";
import { LabeledInput } from "../../src/components/common/LabeledInput";
import { PrimaryButton } from "../../src/components/common/PrimaryButton";
import { SectionCard } from "../../src/components/common/SectionCard";
import { formatGameLabel } from "../../src/lib/formatters";
import { useAppData } from "../../src/providers/AppDataProvider";
import { colors, spacing } from "../../src/styles/tokens";
import {
  MEMORY_CHIPS,
  applyMemoryChip,
  createDraft,
  formatHitterLine,
  formatPitcherLine,
  getPlayerDataMessage,
  getStartingPitcher,
  getTopHitters
} from "../../src/features/history/gameDetailHelpers";

export default function LoggedGameDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const { isHydrated, isAuthenticated, attendanceLogs, games, teams, venues, updateAttendanceLog, deleteAttendanceLog } = useAppData();
  const { logId } = useLocalSearchParams<{ logId: string }>();
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const log = typeof logId === "string" ? attendanceLogs.find((entry) => entry.id === logId) : undefined;
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof createDraft> | null>(log ? createDraft(log) : null);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href={"/auth" as Href} />;
  }

  if (!log) {
    return <Redirect href={"/(tabs)/history" as Href} />;
  }

  const activeLog = log;
  const game = gamesById.get(activeLog.gameId);
  if (!game) {
    return <Redirect href={"/(tabs)/history" as Href} />;
  }

  const label = formatGameLabel(game, teamsById, venuesById);
  const innings = game.lineScore?.length
    ? game.lineScore
    : Array.from({ length: Math.max(game.innings ?? 9, 9) }, (_, index) => ({
        inning: index + 1,
        homeRuns: -1,
        awayRuns: -1
      }));
  const awayTeam = teamsById.get(game.awayTeamId);
  const homeTeam = teamsById.get(game.homeTeamId);
  const awayStarter = getStartingPitcher(game, game.awayTeamId);
  const homeStarter = getStartingPitcher(game, game.homeTeamId);
  const awayTopHitters = getTopHitters(game, game.awayTeamId);
  const homeTopHitters = getTopHitters(game, game.homeTeamId);
  const playerDataMessage = getPlayerDataMessage(game);

  function beginEditing() {
    setDraft(createDraft(activeLog));
    setIsEditing(true);
    setIsConfirmingDelete(false);
    setMessage(null);
    setError(null);
  }

  async function handleSave() {
    if (!draft || !draft.section.trim()) {
      setError("Section is required.");
      return;
    }

    try {
      await updateAttendanceLog(activeLog.id, {
        seat: {
          section: draft.section,
          row: draft.row,
          seatNumber: draft.seatNumber
        },
        memorableMoment: draft.memorableMoment,
        companion: draft.companion,
        giveaway: draft.giveaway,
        weather: draft.weather
      });
      setIsEditing(false);
      setError(null);
      setMessage("Memory page updated.");
    } catch (updateError) {
      setMessage(null);
      setError(updateError instanceof Error ? updateError.message : "Could not update this saved game.");
    }
  }

  async function handleDelete() {
    try {
      await deleteAttendanceLog(activeLog.id);
      router.replace("/(tabs)/history");
    } catch (deleteError) {
      setMessage(null);
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this saved game.");
    }
  }

  return (
    <Screen
      title={label.title}
      subtitle="A permanent memory page for this attended game, with your notes, seat, and whatever box-score detail is available."
    >
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <SectionCard title="Game Card">
        <Text style={styles.subtitle}>{label.subtitle}</Text>
        <Text style={styles.score}>Final: {label.score}</Text>
        <Text style={styles.detail}>
          Seat: {activeLog.seat.section}
          {activeLog.seat.row ? ` • Row ${activeLog.seat.row}` : ""}
          {activeLog.seat.seatNumber ? ` • Seat ${activeLog.seat.seatNumber}` : ""}
        </Text>
        <Text style={styles.metaText}>{playerDataMessage.label}</Text>
        <Text style={styles.helperText}>{playerDataMessage.detail}</Text>
      </SectionCard>

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <SectionCard title="Line Score">
          <View style={styles.boxscoreCard}>
            <View style={styles.boxscoreHeader}>
              <Text style={[styles.boxscoreHeaderLabel, styles.boxscoreTeamCol]}>Team</Text>
              {innings.map((inning) => (
                <Text key={`${game.id}_inning_${inning.inning}`} style={styles.boxscoreHeaderLabel}>
                  {inning.inning}
                </Text>
              ))}
              <Text style={styles.boxscoreHeaderLabel}>R</Text>
              <Text style={styles.boxscoreHeaderLabel}>H</Text>
              <Text style={styles.boxscoreHeaderLabel}>E</Text>
            </View>
            <View style={styles.boxscoreRow}>
              <Text style={[styles.boxscoreTeam, styles.boxscoreTeamCol]}>{awayTeam?.abbreviation ?? "AWY"}</Text>
              {innings.map((inning) => (
                <Text key={`${game.id}_away_${inning.inning}`} style={styles.boxscoreCell}>
                  {inning.awayRuns >= 0 ? inning.awayRuns : "-"}
                </Text>
              ))}
              <Text style={styles.boxscoreCellStrong}>{game.awayScore}</Text>
              <Text style={styles.boxscoreCellStrong}>{game.awayHits}</Text>
              <Text style={styles.boxscoreCellStrong}>{game.awayErrors ?? 0}</Text>
            </View>
            <View style={styles.boxscoreRow}>
              <Text style={[styles.boxscoreTeam, styles.boxscoreTeamCol]}>{homeTeam?.abbreviation ?? "HME"}</Text>
              {innings.map((inning) => (
                <Text key={`${game.id}_home_${inning.inning}`} style={styles.boxscoreCell}>
                  {inning.homeRuns >= 0 ? inning.homeRuns : "-"}
                </Text>
              ))}
              <Text style={styles.boxscoreCellStrong}>{game.homeScore}</Text>
              <Text style={styles.boxscoreCellStrong}>{game.homeHits}</Text>
              <Text style={styles.boxscoreCellStrong}>{game.homeErrors ?? 0}</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Memory">
          {isEditing && draft ? (
            <View style={styles.formColumn}>
              <LabeledInput
                label="Section"
                value={draft.section}
                onChangeText={(value) => setDraft((current) => current ? { ...current, section: value } : current)}
                placeholder="214A"
                autoCapitalize="characters"
              />
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <LabeledInput
                    label="Row"
                    value={draft.row}
                    onChangeText={(value) => setDraft((current) => current ? { ...current, row: value } : current)}
                    placeholder="5"
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.formColumn}>
                  <LabeledInput
                    label="Seat"
                    value={draft.seatNumber}
                    onChangeText={(value) => setDraft((current) => current ? { ...current, seatNumber: value } : current)}
                    placeholder="7"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
              <LabeledInput
                label="What do you remember most?"
                value={draft.memorableMoment}
                onChangeText={(value) => setDraft((current) => current ? { ...current, memorableMoment: value } : current)}
                placeholder="Big play, rivalry feeling, part of a trip..."
                multiline
                numberOfLines={4}
              />
              <Text style={styles.helperText}>Quick memory sparks</Text>
              <View style={styles.chipRow}>
                {MEMORY_CHIPS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() =>
                      setDraft((current) =>
                        current
                          ? { ...current, memorableMoment: applyMemoryChip(current.memorableMoment, chip) }
                          : current
                      )
                    }
                    style={styles.memoryChip}
                  >
                    <Text style={styles.memoryChipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
              <LabeledInput
                label="Who did you go with?"
                value={draft.companion}
                onChangeText={(value) => setDraft((current) => current ? { ...current, companion: value } : current)}
                placeholder="Friend, family, date..."
              />
              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <LabeledInput
                    label="Giveaway or souvenir"
                    value={draft.giveaway}
                    onChangeText={(value) => setDraft((current) => current ? { ...current, giveaway: value } : current)}
                    placeholder="Bobblehead, souvenir cup..."
                  />
                </View>
                <View style={styles.formColumn}>
                  <LabeledInput
                    label="Weather"
                    value={draft.weather}
                    onChangeText={(value) => setDraft((current) => current ? { ...current, weather: value } : current)}
                    placeholder="Warm, cold, rain delay..."
                  />
                </View>
              </View>
              <View style={styles.actionRow}>
                <PrimaryButton label="Save Changes" onPress={handleSave} />
                <Pressable onPress={() => setIsEditing(false)}>
                  <Text style={styles.linkText}>Skip for now</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.formColumn}>
              {activeLog.memorableMoment ? <Text style={styles.noteText}>{activeLog.memorableMoment}</Text> : <Text style={styles.helperText}>No memory note yet.</Text>}
              {activeLog.companion ? <Text style={styles.metaText}>With: {activeLog.companion}</Text> : null}
              {activeLog.giveaway ? <Text style={styles.metaText}>Giveaway: {activeLog.giveaway}</Text> : null}
              {activeLog.weather ? <Text style={styles.metaText}>Weather: {activeLog.weather}</Text> : null}
              <View style={styles.actionRow}>
                <PrimaryButton label="Edit Log" onPress={beginEditing} />
                <Pressable onPress={() => setIsConfirmingDelete(true)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
              {isConfirmingDelete ? (
                <View style={styles.confirmDeleteCard}>
                  <Text style={styles.confirmDeleteTitle}>Delete this saved game?</Text>
                  <Text style={styles.helperText}>This removes the attendance record and updates your stats immediately.</Text>
                  <View style={styles.actionRow}>
                    <PrimaryButton label="Confirm Delete" onPress={handleDelete} />
                    <Pressable onPress={() => setIsConfirmingDelete(false)}>
                      <Text style={styles.linkText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </SectionCard>
      </View>

      <View style={[styles.grid, isWide ? styles.gridWide : null]}>
        <SectionCard title={`${awayTeam?.city ?? ""} ${awayTeam?.name ?? ""}`}>
          <Text style={styles.performerLabel}>Starter</Text>
          <Text style={styles.performerPrimary}>{awayStarter?.pitcherName ?? "No data"}</Text>
          <Text style={styles.performerMeta}>{formatPitcherLine(awayStarter)}</Text>
          <Text style={styles.performerLabel}>Top hitters</Text>
          {awayTopHitters.length ? awayTopHitters.map((hitter) => (
            <View key={`${game.id}_${hitter.teamId}_${hitter.playerName}`} style={styles.performerRow}>
              <Text style={styles.performerPrimary}>{hitter.playerName}</Text>
              <Text style={styles.performerMeta}>{formatHitterLine(hitter)}</Text>
            </View>
          )) : <Text style={styles.performerMeta}>Hitter detail still pending</Text>}
        </SectionCard>

        <SectionCard title={`${homeTeam?.city ?? ""} ${homeTeam?.name ?? ""}`}>
          <Text style={styles.performerLabel}>Starter</Text>
          <Text style={styles.performerPrimary}>{homeStarter?.pitcherName ?? "No data"}</Text>
          <Text style={styles.performerMeta}>{formatPitcherLine(homeStarter)}</Text>
          <Text style={styles.performerLabel}>Top hitters</Text>
          {homeTopHitters.length ? homeTopHitters.map((hitter) => (
            <View key={`${game.id}_${hitter.teamId}_${hitter.playerName}`} style={styles.performerRow}>
              <Text style={styles.performerPrimary}>{hitter.playerName}</Text>
              <Text style={styles.performerMeta}>{formatHitterLine(hitter)}</Text>
            </View>
          )) : <Text style={styles.performerMeta}>Hitter detail still pending</Text>}
        </SectionCard>
      </View>

      <SectionCard title="Witnessed Events">
        <View style={styles.eventRow}>
          {activeLog.witnessedEvents.length ? activeLog.witnessedEvents.map((event) => (
            <View key={event.id} style={styles.eventPill}>
              <Text style={styles.eventLabel}>{event.label}</Text>
            </View>
          )) : <Text style={styles.helperText}>No tagged witnessed events yet.</Text>}
        </View>
      </SectionCard>
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
  metaText: {
    fontSize: 14,
    color: colors.slate500
  },
  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate500
  },
  successText: {
    fontSize: 14,
    color: colors.green
  },
  errorText: {
    fontSize: 14,
    color: colors.red
  },
  grid: {
    gap: spacing.lg
  },
  gridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  boxscoreCard: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    backgroundColor: colors.slate050,
    padding: spacing.md,
    gap: spacing.xs
  },
  boxscoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200
  },
  boxscoreHeaderLabel: {
    width: 24,
    textAlign: "right",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500,
    fontWeight: "700"
  },
  boxscoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  boxscoreTeamCol: {
    flex: 1,
    width: "auto",
    textAlign: "left"
  },
  boxscoreTeam: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.slate900
  },
  boxscoreCell: {
    width: 24,
    textAlign: "right",
    fontSize: 12,
    color: colors.slate700
  },
  boxscoreCellStrong: {
    width: 24,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "800",
    color: colors.navy
  },
  formColumn: {
    flex: 1,
    gap: spacing.md
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  memoryChip: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  memoryChipText: {
    fontSize: 12,
    color: colors.navy,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.red
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate900
  },
  performerLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.slate500
  },
  performerRow: {
    gap: 2
  },
  performerPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.slate900
  },
  performerMeta: {
    fontSize: 13,
    color: colors.slate500
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
  },
  confirmDeleteCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.slate050
  },
  confirmDeleteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.slate900
  }
});
