import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Screen } from "../../components/common/Screen";
import { DropdownField, type DropdownOption } from "../../components/common/DropdownField";
import { LabeledInput } from "../../components/common/LabeledInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";
import { formatBaseballInnings, formatGameLabel } from "../../lib/formatters";
import type { AttendanceLog, BatterAppearance, Game, PitcherAppearance } from "@mlb-attendance/domain";

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

function getStartingPitcher(game: Game, teamId: string) {
  const pitchers = game.pitchersUsed?.filter((pitcher) => pitcher.teamId === teamId) ?? [];
  return pitchers.find((pitcher) => pitcher.role === "starter") ?? [...pitchers].sort((left, right) => (right.inningsPitched ?? 0) - (left.inningsPitched ?? 0))[0];
}

function getTopHitters(game: Game, teamId: string) {
  const hitters = game.battersUsed?.filter((batter) => batter.teamId === teamId) ?? [];
  return [...hitters]
    .sort((left, right) => {
      if (right.homeRuns !== left.homeRuns) {
        return right.homeRuns - left.homeRuns;
      }
      if (right.hits !== left.hits) {
        return right.hits - left.hits;
      }
      if (right.rbis !== left.rbis) {
        return right.rbis - left.rbis;
      }
      if (right.walks !== left.walks) {
        return right.walks - left.walks;
      }
      return right.atBats - left.atBats;
    })
    .slice(0, 2);
}

function formatPitcherLine(pitcher: PitcherAppearance | undefined) {
  if (!pitcher) {
    return "No starting pitcher data";
  }

  return `${formatBaseballInnings(pitcher.inningsPitched)} IP • ${pitcher.strikeouts ?? 0} K • ${pitcher.hitsAllowed ?? 0} H • ${pitcher.runsAllowed ?? 0} R`;
}

function formatHitterLine(hitter: BatterAppearance) {
  const extras = [];
  if (hitter.homeRuns) {
    extras.push(`${hitter.homeRuns} HR`);
  }
  if (hitter.rbis) {
    extras.push(`${hitter.rbis} RBI`);
  }
  if (hitter.walks) {
    extras.push(`${hitter.walks} BB`);
  }

  const statTail = extras.length ? ` • ${extras.join(" • ")}` : "";
  return `${hitter.hits}-${hitter.atBats}${statTail}`;
}

export function HistoryScreen() {
  const { width } = useWindowDimensions();
  const { attendanceLogs, games, teams, venues, profile, updateAttendanceLog, deleteAttendanceLog } = useAppData();
  const isWide = width >= 1024;
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const gamesById = useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<"newest" | "oldest" | "venue" | "matchup">("newest");
  const [viewKey, setViewKey] = useState<"all" | "favorite-team" | "latest-season">("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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
  const latestSeason = attendanceLogs[0]?.attendedOn.slice(0, 4) ?? "";
  const sortOptions: Array<DropdownOption<typeof sortKey>> = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
    { label: "Venue", value: "venue" },
    { label: "Matchup", value: "matchup" }
  ];
  const viewOptions: Array<DropdownOption<typeof viewKey>> = [
    { label: "All games", value: "all" },
    { label: "Favorite team games", value: "favorite-team" },
    { label: latestSeason ? `${latestSeason} only` : "Latest season", value: "latest-season" }
  ];

  const filteredLogs = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const baseLogs = attendanceLogs.filter((log) => {
      const game = gamesById.get(log.gameId);
      if (!game) {
        return false;
      }

      if (viewKey === "favorite-team" && profile.favoriteTeamId) {
        const isFavoriteGame = game.homeTeamId === profile.favoriteTeamId || game.awayTeamId === profile.favoriteTeamId;
        if (!isFavoriteGame) {
          return false;
        }
      }

      if (viewKey === "latest-season" && latestSeason && !log.attendedOn.startsWith(latestSeason)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const homeTeam = game ? teamsById.get(game.homeTeamId) : undefined;
      const awayTeam = game ? teamsById.get(game.awayTeamId) : undefined;
      const venue = venuesById.get(log.venueId);
      const haystack = [
        log.attendedOn,
        log.seat.section,
        log.seat.row,
        log.seat.seatNumber,
        log.memorableMoment,
        log.companion,
        log.giveaway,
        log.weather,
        venue?.name,
        homeTeam?.name,
        awayTeam?.name,
        homeTeam?.abbreviation,
        awayTeam?.abbreviation
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    return [...baseLogs].sort((left, right) => {
      const leftGame = gamesById.get(left.gameId);
      const rightGame = gamesById.get(right.gameId);
      if (!leftGame || !rightGame) {
        return 0;
      }

      if (sortKey === "newest") {
        return right.attendedOn.localeCompare(left.attendedOn);
      }

      if (sortKey === "oldest") {
        return left.attendedOn.localeCompare(right.attendedOn);
      }

      if (sortKey === "venue") {
        const venueCompare = (venuesById.get(left.venueId)?.name ?? "").localeCompare(venuesById.get(right.venueId)?.name ?? "");
        return venueCompare || right.attendedOn.localeCompare(left.attendedOn);
      }

      const leftLabel = `${teamsById.get(leftGame.awayTeamId)?.abbreviation ?? ""} at ${teamsById.get(leftGame.homeTeamId)?.abbreviation ?? ""}`;
      const rightLabel = `${teamsById.get(rightGame.awayTeamId)?.abbreviation ?? ""} at ${teamsById.get(rightGame.homeTeamId)?.abbreviation ?? ""}`;
      return leftLabel.localeCompare(rightLabel) || right.attendedOn.localeCompare(left.attendedOn);
    });
  }, [attendanceLogs, filter, gamesById, latestSeason, profile.favoriteTeamId, sortKey, teamsById, venuesById, viewKey]);

  function beginEditing(log: AttendanceLog) {
    setEditingLogId(log.id);
    setPendingDeleteLogId(null);
    setDraft(createDraft(log));
    setMessage(null);
    setError(null);
  }

  function cancelEditing() {
    setEditingLogId(null);
    setPendingDeleteLogId(null);
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
      setPendingDeleteLogId(null);
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
      subtitle="Search, review, and edit the logbook behind your personal MLB attendance record."
    >
      <View style={[styles.summaryGrid, isWide ? styles.summaryGridWide : null]}>
        <SectionCard title="Search Logbook">
          <LabeledInput
            label="Filter by team, venue, date, seat, or note"
            value={filter}
            onChangeText={setFilter}
            placeholder="Yankees, Fenway, 2025-07, Judge..."
          />
          <Text style={styles.helperText}>
            Showing {filteredLogs.length} of {attendanceLogs.length} saved games.
          </Text>
          <View style={[styles.controlsRow, isWide ? styles.controlsRowWide : null]}>
            <DropdownField
              label="Sort"
              options={sortOptions}
              value={sortKey}
              onChange={(value) => {
                setSortKey(value);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "sort"}
              onToggle={() => setOpenDropdown((current) => current === "sort" ? null : "sort")}
            />
            <DropdownField
              label="View"
              options={viewOptions}
              value={viewKey}
              onChange={(value) => {
                setViewKey(value);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "view"}
              onToggle={() => setOpenDropdown((current) => current === "view" ? null : "view")}
            />
          </View>
        </SectionCard>

        <SectionCard title="Coverage">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Games logged</Text>
            <Text style={styles.metricValue}>{attendanceLogs.length}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Stadiums visited</Text>
            <Text style={styles.metricValue}>{new Set(attendanceLogs.map((log) => log.venueId)).size}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Latest entry</Text>
            <Text style={styles.metricValue}>{attendanceLogs[0]?.attendedOn ?? "None"}</Text>
          </View>
        </SectionCard>
      </View>

      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {filteredLogs.length ? (
        filteredLogs.map((log) => {
          const game = gamesById.get(log.gameId);
          if (!game) {
            return null;
          }

          const label = formatGameLabel(game, teamsById, venuesById);
          const isEditing = editingLogId === log.id;
          const isConfirmingDelete = pendingDeleteLogId === log.id;
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

          return (
            <SectionCard key={log.id} title={label.title}>
              <Text style={styles.subtitle}>{label.subtitle}</Text>
              <Text style={styles.score}>Final: {label.score}</Text>
              {isEditing ? (
                <>
                  <View style={[styles.formGrid, isWide ? styles.formGridWide : null]}>
                    <View style={styles.formColumn}>
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
                    </View>
                    <View style={styles.formColumn}>
                      <LabeledInput
                        label="Memorable moment"
                        value={draft.memorableMoment}
                        onChangeText={(value) => setDraft((current) => ({ ...current, memorableMoment: value }))}
                        placeholder="What stood out?"
                        multiline
                        numberOfLines={4}
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
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <PrimaryButton label="Save Changes" onPress={() => handleSave(log.id)} />
                    <Pressable onPress={cancelEditing}>
                      <Text style={styles.linkText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.detail}>
                    Seat: {log.seat.section}
                    {log.seat.row ? ` • Row ${log.seat.row}` : ""}
                    {log.seat.seatNumber ? ` • Seat ${log.seat.seatNumber}` : ""}
                  </Text>
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
                  <View style={[styles.performerGrid, isWide ? styles.performerGridWide : null]}>
                    <View style={styles.performerCard}>
                      <Text style={styles.performerTeam}>{awayTeam?.city} {awayTeam?.name}</Text>
                      <Text style={styles.performerLabel}>Starter</Text>
                      <Text style={styles.performerPrimary}>{awayStarter?.pitcherName ?? "No data"}</Text>
                      <Text style={styles.performerMeta}>{formatPitcherLine(awayStarter)}</Text>
                      <Text style={styles.performerLabel}>Top Hitters</Text>
                      {awayTopHitters.length ? awayTopHitters.map((hitter) => (
                        <View key={`${game.id}_${hitter.teamId}_${hitter.playerName}`} style={styles.performerRow}>
                          <Text style={styles.performerPrimary}>{hitter.playerName}</Text>
                          <Text style={styles.performerMeta}>{formatHitterLine(hitter)}</Text>
                        </View>
                      )) : <Text style={styles.performerMeta}>No batting lines available</Text>}
                    </View>
                    <View style={styles.performerCard}>
                      <Text style={styles.performerTeam}>{homeTeam?.city} {homeTeam?.name}</Text>
                      <Text style={styles.performerLabel}>Starter</Text>
                      <Text style={styles.performerPrimary}>{homeStarter?.pitcherName ?? "No data"}</Text>
                      <Text style={styles.performerMeta}>{formatPitcherLine(homeStarter)}</Text>
                      <Text style={styles.performerLabel}>Top Hitters</Text>
                      {homeTopHitters.length ? homeTopHitters.map((hitter) => (
                        <View key={`${game.id}_${hitter.teamId}_${hitter.playerName}`} style={styles.performerRow}>
                          <Text style={styles.performerPrimary}>{hitter.playerName}</Text>
                          <Text style={styles.performerMeta}>{formatHitterLine(hitter)}</Text>
                        </View>
                      )) : <Text style={styles.performerMeta}>No batting lines available</Text>}
                    </View>
                  </View>
                  {log.memorableMoment ? <Text style={styles.noteText}>{log.memorableMoment}</Text> : null}
                  {log.companion ? <Text style={styles.metaText}>With: {log.companion}</Text> : null}
                  {log.giveaway ? <Text style={styles.metaText}>Giveaway: {log.giveaway}</Text> : null}
                  {log.weather ? <Text style={styles.metaText}>Weather: {log.weather}</Text> : null}
                  <View style={styles.eventRow}>
                    {log.witnessedEvents.slice(0, 4).map((event) => (
                      <View key={event.id} style={styles.eventPill}>
                        <Text style={styles.eventLabel}>{event.label}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => beginEditing(log)}>
                      <Text style={styles.linkText}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => setPendingDeleteLogId(log.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                  {isConfirmingDelete ? (
                    <View style={styles.confirmDeleteCard}>
                      <View style={styles.confirmDeleteCopy}>
                        <Text style={styles.confirmDeleteTitle}>Delete this saved game?</Text>
                        <Text style={styles.metaText}>This removes the attendance record from your ledger and updates derived stats immediately.</Text>
                      </View>
                      <View style={styles.actionRow}>
                        <PrimaryButton label="Confirm Delete" onPress={() => handleDelete(log.id)} />
                        <Pressable onPress={() => setPendingDeleteLogId(null)}>
                          <Text style={styles.linkText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </SectionCard>
          );
        })
      ) : (
        <SectionCard title="No Matches">
          <Text style={styles.helperText}>No saved games matched that filter. Try a team name, venue, or a broader date fragment.</Text>
        </SectionCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    gap: spacing.lg
  },
  summaryGridWide: {
    flexDirection: "row"
  },
  helperText: {
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
    fontSize: 14,
    color: colors.slate700
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.navy
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate500
  },
  score: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.slate900
  },
  formGrid: {
    gap: spacing.md
  },
  formGridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  controlsRow: {
    gap: spacing.sm
  },
  controlsRowWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  formColumn: {
    flex: 1,
    gap: spacing.md
  },
  detail: {
    fontSize: 14,
    color: colors.slate700
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
  performerGrid: {
    gap: spacing.md
  },
  performerGridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  performerCard: {
    flex: 1,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.white
  },
  performerTeam: {
    fontSize: 15,
    fontWeight: "700",
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg
  },
  confirmDeleteCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.slate050
  },
  confirmDeleteCopy: {
    gap: spacing.xs
  },
  confirmDeleteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.slate900
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
