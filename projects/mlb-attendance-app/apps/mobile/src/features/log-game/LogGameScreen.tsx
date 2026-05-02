import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../../components/common/EmptyState";
import { FilterChip } from "../../components/common/FilterChip";
import { Screen } from "../../components/common/Screen";
import { LabeledInput } from "../../components/common/LabeledInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { StatusPill } from "../../components/common/StatusPill";
import { useAppData } from "../../providers/AppDataProvider";
import { useResponsiveLayout } from "../../styles/responsive";
import { colors, radii, shadows, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";
import type { Game } from "@mlb-attendance/domain";
import { MEMORY_CHIPS, applyMemoryChip } from "../history/gameDetailHelpers";

type StatusTone = "idle" | "info" | "success" | "error";

function buildGameNotes(game: Game) {
  const notes = [];

  if (game.walkOff) {
    notes.push("Walk-off finish");
  }
  if (game.innings && game.innings > 9) {
    notes.push(`${game.innings} innings`);
  }
  if (game.featuredPlayerHomeRun) {
    notes.push(`${game.featuredPlayerHomeRun} homer`);
  }

  return notes;
}

export function LogGameScreen() {
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const { profile, teams, venues, games, searchGames, addAttendanceLog } = useAppData();
  const isWide = responsive.isWideDesktop;
  const isCompact = responsive.isCompact;
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
  const favoriteTeam = teams.find((team) => team.id === profile.favoriteTeamId);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [stadium, setStadium] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [memorableMoment, setMemorableMoment] = useState("");
  const [companion, setCompanion] = useState("");
  const [giveaway, setGiveaway] = useState("");
  const [weather, setWeather] = useState("");
  const [searchError, setSearchError] = useState("");
  const [seatError, setSeatError] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchStatus, setSearchStatus] = useState<{ tone: StatusTone; message: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ tone: StatusTone; message: string } | null>(null);
  const selectedGameLabel = selectedGame ? formatGameLabel(selectedGame, teamsById, venuesById) : null;
  const latestSeason = useMemo(() => {
    const years = games
      .map((game) => Number(game.startDate.slice(0, 4)))
      .filter((year) => Number.isFinite(year));
    return years.length ? String(Math.max(...years)) : "";
  }, [games]);

  const quickFinds = [
    favoriteTeam ? { label: favoriteTeam.abbreviation, action: () => applyQuickSearch({ query: favoriteTeam.abbreviation }) } : null,
    latestSeason ? { label: latestSeason, action: () => applyQuickSearch({ date: latestSeason }) } : null,
    { label: "Recent games", action: () => applyQuickSearch({}) }
  ].filter(Boolean) as Array<{ label: string; action: () => void }>;

  async function handleSearch() {
    setIsSearching(true);
    setConfirmation(null);
    setSaveStatus(null);
    setSearchStatus({
      tone: "info",
      message: "Searching the MLB catalog now."
    });

    try {
      const trimmedQuery = query.trim();
      const trimmedDate = date.trim();
      const trimmedStadium = stadium.trim();
      const hasFilters = Boolean(trimmedQuery || trimmedDate || trimmedStadium);
      const matches = await searchGames({
        query: trimmedQuery,
        date: trimmedDate,
        stadium: trimmedStadium
      });
      const orderedMatches = [...matches].sort((left, right) => right.startDate.localeCompare(left.startDate));
      const visibleMatches = hasFilters ? orderedMatches : orderedMatches.slice(0, 12);

      setResults(visibleMatches);
      setSearchError(visibleMatches.length ? "" : "No games matched those filters. Try team, date, or stadium.");
      setSearchStatus(
        visibleMatches.length
          ? {
              tone: "success",
              message: `${visibleMatches.length} game${visibleMatches.length === 1 ? "" : "s"} ready to review.`
            }
          : {
              tone: "error",
              message: "No games matched that search."
            }
      );
      setSelectedGame(null);
    } catch {
      setSearchStatus({
        tone: "error",
        message: "Search failed. Try again."
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function applyQuickSearch(next: { query?: string; date?: string; stadium?: string }) {
    setQuery(next.query ?? "");
    setDate(next.date ?? "");
    setStadium(next.stadium ?? "");
    setConfirmation(null);
    setIsSearching(true);
    setSaveStatus(null);
    setSearchStatus({
      tone: "info",
      message: "Searching the MLB catalog now."
    });

    try {
      const matches = await searchGames(next);
      const orderedMatches = [...matches].sort((left, right) => right.startDate.localeCompare(left.startDate));
      const visibleMatches = next.query || next.date || next.stadium ? orderedMatches : orderedMatches.slice(0, 12);
      setResults(visibleMatches);
      setSelectedGame(null);
      setSearchError(visibleMatches.length ? "" : "No games matched that quick find. Try a manual search.");
      setSearchStatus(
        visibleMatches.length
          ? {
              tone: "success",
              message: `${visibleMatches.length} game${visibleMatches.length === 1 ? "" : "s"} ready to review.`
            }
          : {
              tone: "error",
              message: "No games matched that quick find."
            }
      );
    } catch {
      setSearchStatus({
        tone: "error",
        message: "Search failed. Try again."
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave() {
    if (!selectedGame) {
      setSearchError("Select a game before saving.");
      setSaveStatus({
        tone: "error",
        message: "Choose a game before saving."
      });
      return;
    }

    if (!section.trim()) {
      setSeatError("Section is required. Row and seat can stay blank.");
      setSaveStatus({
        tone: "error",
        message: "Section is required before save."
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus({
      tone: "info",
      message: "Saving this game to your ledger now."
    });

    try {
      const savedLog = await addAttendanceLog({
        userId: profile.id,
        gameId: selectedGame.id,
        seat: {
          section,
          row,
          seatNumber
        },
        memorableMoment,
        companion,
        giveaway,
        weather
      });

      setSeatError("");
      setSearchError("");
      setConfirmation(
        `Saved ${savedLog.attendedOn} in section ${savedLog.seat.section}. You can review it in History and Stats now.`
      );
      setSaveStatus({
        tone: "success",
        message: "Saved to your ledger."
      });
      setSelectedGame(null);
      setResults([]);
      setSection("");
      setRow("");
      setSeatNumber("");
      setMemorableMoment("");
      setCompanion("");
      setGiveaway("");
      setWeather("");
      router.push((`/log-recap?logId=${encodeURIComponent(savedLog.id)}`) as Href);
    } catch (error) {
      setConfirmation(null);
      const message = error instanceof Error ? error.message : "We could not save that game.";
      setSearchError(message);
      setSaveStatus({
        tone: "error",
        message
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen
      title="Log a Game"
      subtitle="Find the matchup fast, confirm the exact game, and save the memory without fighting a form."
    >
      <View style={styles.stepRow}>
        <StatusPill label="1 Find" tone="info" />
        <StatusPill label="2 Confirm" tone={selectedGame ? "success" : "default"} />
        <StatusPill label="3 Save" tone={section.trim() ? "success" : "default"} />
        <StatusPill label="4 Details" tone="default" />
      </View>

      <View style={[styles.topGrid, isWide ? styles.topGridWide : null]}>
        <SectionCard title="1. Find the game" subtitle="Start broad, then narrow only if you need to.">
          <View style={styles.quickFindHeader}>
            <Text style={styles.helperText}>Large search first, then quick filters for team, season, or recent games.</Text>
            <View style={styles.quickFindRow}>
              {quickFinds.map((quickFind) => (
                <FilterChip key={quickFind.label} label={quickFind.label} onPress={quickFind.action} />
              ))}
            </View>
          </View>
          <View style={[styles.formGrid, isWide ? styles.formGridWide : null]}>
            <View style={styles.formColumn}>
              <LabeledInput
                label="Team or matchup"
                value={query}
                onChangeText={setQuery}
                placeholder="Yankees, Mets, Red Sox, BAL..."
                returnKeyType="search"
                onSubmitEditing={() => {
                  void handleSearch();
                }}
              />
              <LabeledInput
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="07/20/2025, 07-20-2025, July 20, 2025, or 2025"
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => {
                  void handleSearch();
                }}
              />
            </View>
            <View style={styles.formColumn}>
              <LabeledInput
                label="Stadium"
                value={stadium}
                onChangeText={setStadium}
                placeholder="Fenway, Yankee Stadium..."
                returnKeyType="search"
                onSubmitEditing={() => {
                  void handleSearch();
                }}
              />
              <View style={styles.searchMetaCard}>
                <Text style={styles.searchMetaLabel}>MLB catalog</Text>
                <Text style={styles.searchMetaValue}>{games.length} MLB finals ready to log</Text>
                <Text style={styles.searchMetaCopy}>No filter also works. We will show the most recent games first.</Text>
              </View>
            </View>
          </View>
          <PrimaryButton label={isSearching ? "Searching..." : "Search Games"} onPress={handleSearch} disabled={isSearching} />
          {searchStatus ? (
            <View style={[styles.statusCard, searchStatus.tone === "success" ? styles.statusCardSuccess : null, searchStatus.tone === "error" ? styles.statusCardError : null]}>
              <Text style={[styles.statusText, searchStatus.tone === "success" ? styles.statusTextSuccess : null, searchStatus.tone === "error" ? styles.statusTextError : null]}>
                {searchStatus.message}
              </Text>
            </View>
          ) : null}
          {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
        </SectionCard>

        <SectionCard title="2. Confirm the game" subtitle="Make sure the exact matchup, date, and result look right.">
          {selectedGame && selectedGameLabel ? (
            <View style={styles.selectedGameCard}>
              <Text style={styles.gameTitle}>{selectedGameLabel.title}</Text>
              <Text style={styles.gameSubtitle}>{selectedGameLabel.subtitle}</Text>
              <Text style={styles.gameScore}>Final: {selectedGameLabel.score}</Text>
              <View style={styles.noteRow}>
                {buildGameNotes(selectedGame).map((note) => (
                  <StatusPill key={note} label={note} tone="info" />
                ))}
              </View>
              <Text style={styles.helperText}>
                Save with just the seat section now. You can add or edit the memory details later in History.
              </Text>
            </View>
          ) : (
            <EmptyState
              eyebrow="Select a matchup"
              title="No game selected yet"
              body="Use quick find or search, then choose the exact attended game before you save."
            />
          )}
        </SectionCard>
      </View>

      {results.length ? (
        <SectionCard title={`Select a result (${results.length})`} subtitle="Most recent matching games appear first.">
          <Text style={styles.helperText}>
            Pick the exact game you attended. Most recent matching games show first.
          </Text>
          <View style={[styles.resultsGrid, !isCompact ? styles.resultsGridWide : null]}>
            {results.map((game) => {
              const label = formatGameLabel(game, teamsById, venuesById);
              const isSelected = selectedGame?.id === game.id;

              return (
                <Pressable
                  key={game.id}
                  onPress={() => {
                    setSelectedGame(game);
                    setSearchError("");
                    setConfirmation(null);
                  }}
                  style={[styles.gameOption, !isCompact ? styles.gameOptionWide : null, isSelected ? styles.gameOptionSelected : null]}
                >
                  <Text style={styles.gameTitle}>{label.title}</Text>
                  <Text style={styles.gameSubtitle}>{label.subtitle}</Text>
                  <Text style={styles.gameScore}>Final: {label.score}</Text>
                  <View style={styles.noteRow}>
                    {buildGameNotes(game).slice(0, 3).map((note) => (
                      <StatusPill key={`${game.id}_${note}`} label={note} tone="default" />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>
      ) : null}

      <View style={[styles.bottomGrid, isWide ? styles.bottomGridWide : null]}>
        <View style={styles.formColumn}>
          <SectionCard title="3. Save it fast" subtitle="Seat section helps memory later, but row and seat can stay blank.">
            <Text style={styles.helperText}>
              If you do not remember the section, save it as unknown and clean it up later.
            </Text>
            <View style={styles.quickFindRow}>
              <FilterChip label="I don't remember" selected={section.trim().toLowerCase() === "unknown"} onPress={() => {
                setSection("Unknown");
                setSeatError("");
              }} />
            </View>
            <LabeledInput
              label="Section"
              value={section}
              onChangeText={setSection}
              placeholder="214A"
              autoCapitalize="characters"
              error={seatError}
            />
            <View style={[styles.formGrid, styles.formGridWide]}>
              <View style={styles.formColumn}>
                <LabeledInput
                  label="Row (optional)"
                  value={row}
                  onChangeText={setRow}
                  placeholder="5"
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.formColumn}>
                <LabeledInput
                  label="Seat (optional)"
                  value={seatNumber}
                  onChangeText={setSeatNumber}
                  placeholder="7"
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <PrimaryButton
              label={isSaving ? "Saving..." : "Save Attendance Log"}
              onPress={handleSave}
              disabled={!selectedGame || isSaving}
            />
            {saveStatus ? (
              <View style={[styles.statusCard, saveStatus.tone === "success" ? styles.statusCardSuccess : null, saveStatus.tone === "error" ? styles.statusCardError : null]}>
                <Text style={[styles.statusText, saveStatus.tone === "success" ? styles.statusTextSuccess : null, saveStatus.tone === "error" ? styles.statusTextError : null]}>
                  {saveStatus.message}
                </Text>
              </View>
            ) : null}
          </SectionCard>
        </View>

        <View style={styles.formColumn}>
          <SectionCard title="4. Add memory details" subtitle="Optional now. Useful later.">
            <Text style={styles.helperText}>
              These prompts are optional. A quick line now makes the game feel personal later, but you can skip every one.
            </Text>
            <LabeledInput
              label="What do you remember most?"
              value={memorableMoment}
              onChangeText={setMemorableMoment}
              placeholder="Big play, rivalry feel, birthday trip, or whatever still sticks."
              multiline
              numberOfLines={4}
            />
            <Text style={styles.helperText}>Quick memory sparks</Text>
            <View style={styles.quickFindRow}>
              {MEMORY_CHIPS.map((chip) => (
                <FilterChip
                  key={chip}
                  label={chip}
                  onPress={() => setMemorableMoment((current) => applyMemoryChip(current, chip))}
                />
              ))}
            </View>
            <LabeledInput
              label="Who did you go with?"
              value={companion}
              onChangeText={setCompanion}
              placeholder="Friend, family, date, coworkers..."
            />
            <View style={[styles.formGrid, styles.formGridWide]}>
              <View style={styles.formColumn}>
                <LabeledInput
                  label="Giveaway or souvenir"
                  value={giveaway}
                  onChangeText={setGiveaway}
                  placeholder="Bobblehead, jersey, cap..."
                />
              </View>
              <View style={styles.formColumn}>
                <LabeledInput
                  label="Weather"
                  value={weather}
                  onChangeText={setWeather}
                  placeholder="Warm, cold, rain delay..."
                />
              </View>
            </View>
            <Text style={styles.helperText}>
              Other good memory angles: where you sat, whether it was part of a trip, and if a big play changed the night.
            </Text>
            <Pressable
              onPress={() => {
                setMemorableMoment("");
                setCompanion("");
                setGiveaway("");
                setWeather("");
              }}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </SectionCard>
        </View>
      </View>

      {confirmation ? (
        <SectionCard title="Saved" subtitle="Your log is in the ledger and ready for review.">
          <Text style={styles.successText}>{confirmation}</Text>
          <PrimaryButton label="View History" onPress={() => router.push("/(tabs)/history")} />
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topGrid: {
    gap: spacing.lg
  },
  topGridWide: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  bottomGrid: {
    gap: spacing.lg
  },
  bottomGridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  formGrid: {
    gap: spacing.md
  },
  formGridWide: {
    flexDirection: "row"
  },
  formColumn: {
    flex: 1,
    gap: spacing.md
  },
  searchMetaCard: {
    backgroundColor: colors.slate050,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.xs
  },
  searchMetaLabel: {
    fontSize: 12,
    color: colors.slate500,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  searchMetaValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy
  },
  searchMetaCopy: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.slate500
  },
  quickFindHeader: {
    gap: spacing.sm
  },
  quickFindRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy
  },
  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate500
  },
  resultsGrid: {
    gap: spacing.md
  },
  resultsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  gameOption: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card
  },
  gameOptionWide: {
    width: "48%"
  },
  gameOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAccent
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text
  },
  gameSubtitle: {
    fontSize: 14,
    color: colors.textMuted
  },
  gameScore: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary
  },
  noteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  selectedGameCard: {
    gap: spacing.sm
  },
  errorText: {
    fontSize: 13,
    color: colors.danger
  },
  statusCard: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  statusCardSuccess: {
    borderColor: colors.info,
    backgroundColor: colors.surfaceAccent
  },
  statusCardError: {
    borderColor: colors.danger,
    backgroundColor: colors.surfaceDanger
  },
  statusText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted
  },
  statusTextSuccess: {
    color: colors.primary
  },
  statusTextError: {
    color: colors.danger
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted
  }
});
