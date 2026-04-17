import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/common/Screen";
import { LabeledInput } from "../../components/common/LabeledInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";
import type { AttendanceLog } from "@mlb-attendance/domain";

function createDraft(log: AttendanceLog) {
  return {
    section: log.seat.section,
    row: log.seat.row ?? "",
    seatNumber: log.seat.seatNumber ?? "",
    memorableMoment: log.memorableMoment ?? "",
    companion: log.companion ?? "",
    giveaway: log.giveaway ?? "",
    weather: log.weather ?? ""
  };
}

export function HistoryScreen() {
  const { attendanceLogs, games, teams, venues, updateAttendanceLog, deleteAttendanceLog } = useAppData();
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [draft, setDraft] = useState(createDraft(attendanceLogs[0] ?? {
    id: "",
    userId: "",
    gameId: "",
    venueId: "",
    attendedOn: "",
    seat: { section: "" },
    witnessedEvents: []
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function beginEditing(log: AttendanceLog) {
    setEditingLogId(log.id);
    setDraft(createDraft(log));
    setMessage(null);
    setError(null);
  }

  function cancelEditing() {
    setEditingLogId(null);
    setMessage(null);
    setError(null);
  }

  async function handleSave(logId: string) {
    if (!draft.section.trim()) {
      setError("Section is required.");
      return;
    }

    try {
      await updateAttendanceLog(logId, {
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
      setEditingLogId(null);
      setError(null);
      setMessage("Attendance log updated.");
    } catch (updateError) {
      setMessage(null);
      setError(updateError instanceof Error ? updateError.message : "Could not update the attendance log.");
    }
  }

  async function handleDelete(logId: string) {
    try {
      await deleteAttendanceLog(logId);
      if (editingLogId === logId) {
        setEditingLogId(null);
      }
      setError(null);
      setMessage("Attendance log deleted.");
    } catch (deleteError) {
      setMessage(null);
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the attendance log.");
    }
  }

  return (
    <Screen
      title="History"
      subtitle="A simple chronological record of the games you logged, where you sat, and what you saw."
    >
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {attendanceLogs.map((log) => {
        const game = gamesById.get(log.gameId);
        if (!game) {
          return null;
        }

        const label = formatGameLabel(game, teamsById, venuesById);
        const isEditing = editingLogId === log.id;

        return (
          <SectionCard key={log.id} title={label.title}>
            <Text style={styles.subtitle}>{label.subtitle}</Text>
            <Text style={styles.score}>Final: {label.score}</Text>
            {isEditing ? (
              <>
                <LabeledInput
                  label="Section"
                  value={draft.section}
                  onChangeText={(value) => setDraft((current) => ({ ...current, section: value }))}
                  placeholder="214A"
                  autoCapitalize="characters"
                />
                <LabeledInput
                  label="Row"
                  value={draft.row}
                  onChangeText={(value) => setDraft((current) => ({ ...current, row: value }))}
                  placeholder="5"
                  autoCapitalize="characters"
                />
                <LabeledInput
                  label="Seat"
                  value={draft.seatNumber}
                  onChangeText={(value) => setDraft((current) => ({ ...current, seatNumber: value }))}
                  placeholder="7"
                  autoCapitalize="characters"
                />
                <LabeledInput
                  label="Memorable moment"
                  value={draft.memorableMoment}
                  onChangeText={(value) => setDraft((current) => ({ ...current, memorableMoment: value }))}
                  placeholder="What stood out?"
                />
                <LabeledInput
                  label="Who you went with"
                  value={draft.companion}
                  onChangeText={(value) => setDraft((current) => ({ ...current, companion: value }))}
                  placeholder="Dad, Sam, coworkers..."
                />
                <LabeledInput
                  label="Giveaway"
                  value={draft.giveaway}
                  onChangeText={(value) => setDraft((current) => ({ ...current, giveaway: value }))}
                  placeholder="Bobblehead, jersey, cap..."
                />
                <LabeledInput
                  label="Weather"
                  value={draft.weather}
                  onChangeText={(value) => setDraft((current) => ({ ...current, weather: value }))}
                  placeholder="72F and clear"
                />
                <PrimaryButton label="Save Changes" onPress={() => handleSave(log.id)} />
                <Pressable onPress={cancelEditing}>
                  <Text style={styles.linkText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.detail}>
                  Seat: {log.seat.section}
                  {log.seat.row ? ` • Row ${log.seat.row}` : ""}
                  {log.seat.seatNumber ? ` • Seat ${log.seat.seatNumber}` : ""}
                </Text>
                {log.memorableMoment ? <Text style={styles.noteText}>{log.memorableMoment}</Text> : null}
                {log.companion ? <Text style={styles.metaText}>With: {log.companion}</Text> : null}
                {log.giveaway ? <Text style={styles.metaText}>Giveaway: {log.giveaway}</Text> : null}
                {log.weather ? <Text style={styles.metaText}>Weather: {log.weather}</Text> : null}
                <View style={styles.eventRow}>
                  {log.witnessedEvents.slice(0, 3).map((event) => (
                    <View key={event.id} style={styles.eventPill}>
                      <Text style={styles.eventLabel}>{event.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionRow}>
                  <Pressable onPress={() => beginEditing(log)}>
                    <Text style={styles.linkText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(log.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </>
            )}
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
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate900
  },
  metaText: {
    fontSize: 14,
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
  actionRow: {
    flexDirection: "row",
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
  successText: {
    fontSize: 14,
    color: colors.green
  },
  errorText: {
    fontSize: 14,
    color: colors.red
  }
});
