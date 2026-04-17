import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/common/Screen";
import { LabeledInput } from "../../components/common/LabeledInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";
import { formatGameLabel } from "../../lib/formatters";
import type { Game } from "@mlb-attendance/domain";

export function LogGameScreen() {
  const router = useRouter();
  const { profile, teams, venues, searchGames, addAttendanceLog } = useAppData();
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const venuesById = useMemo(() => new Map(venues.map((venue) => [venue.id, venue])), [venues]);
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

  async function handleSearch() {
    const matches = await searchGames({ query, date, stadium });
    setResults(matches);
    setSearchError(matches.length ? "" : "No games matched those filters. Try team, date, or stadium.");
    setSelectedGame(null);
    setConfirmation(null);
  }

  async function handleSave() {
    if (!selectedGame) {
      setSearchError("Select a game before saving.");
      return;
    }

    if (!section.trim()) {
      setSeatError("Section is required. Row and seat can stay blank.");
      return;
    }

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
      setSection("");
      setRow("");
      setSeatNumber("");
      setMemorableMoment("");
      setCompanion("");
      setGiveaway("");
      setWeather("");
    } catch (error) {
      setConfirmation(null);
      setSearchError(error instanceof Error ? error.message : "We could not save that game.");
    }
  }

  return (
    <Screen
      title="Log a Game"
      subtitle="Zero-cost MVP flow: find a seeded MLB game, confirm the seat details you remember, and save the attendance record."
    >
      <SectionCard title="1. Find the Game">
        <LabeledInput
          label="Team or matchup"
          value={query}
          onChangeText={setQuery}
          placeholder="Yankees, Red Sox, BAL..."
        />
        <LabeledInput
          label="Date"
          value={date}
          onChangeText={setDate}
          placeholder="2025-07-20"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Stadium"
          value={stadium}
          onChangeText={setStadium}
          placeholder="Fenway, Yankee Stadium..."
        />
        <PrimaryButton label="Search Games" onPress={handleSearch} />
        {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
      </SectionCard>

      {results.length ? (
        <SectionCard title="2. Select a Game">
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
                style={[styles.gameOption, isSelected ? styles.gameOptionSelected : null]}
              >
                <Text style={styles.gameTitle}>{label.title}</Text>
                <Text style={styles.gameSubtitle}>{label.subtitle}</Text>
                <Text style={styles.gameSubtitle}>Final: {label.score}</Text>
              </Pressable>
            );
          })}
        </SectionCard>
      ) : null}

      <SectionCard title="3. Enter Seat Details">
        <LabeledInput
          label="Section"
          value={section}
          onChangeText={setSection}
          placeholder="214A"
          autoCapitalize="characters"
          error={seatError}
        />
        <LabeledInput
          label="Row (optional)"
          value={row}
          onChangeText={setRow}
          placeholder="5"
          autoCapitalize="characters"
        />
        <LabeledInput
          label="Seat (optional)"
          value={seatNumber}
          onChangeText={setSeatNumber}
          placeholder="7"
          autoCapitalize="characters"
        />
      </SectionCard>

      <SectionCard title="4. Add the Memory (Optional)">
        <LabeledInput
          label="Memorable moment"
          value={memorableMoment}
          onChangeText={setMemorableMoment}
          placeholder="Judge hit one into the second deck."
        />
        <LabeledInput
          label="Who you went with"
          value={companion}
          onChangeText={setCompanion}
          placeholder="Dad, Sam, coworkers..."
        />
        <LabeledInput
          label="Giveaway"
          value={giveaway}
          onChangeText={setGiveaway}
          placeholder="Bobblehead, jersey, cap..."
        />
        <LabeledInput
          label="Weather"
          value={weather}
          onChangeText={setWeather}
          placeholder="72F and clear"
        />
        <PrimaryButton label="Save Attendance Log" onPress={handleSave} disabled={!selectedGame} />
      </SectionCard>

      {confirmation ? (
        <SectionCard title="Saved">
          <Text style={styles.successText}>{confirmation}</Text>
          <PrimaryButton label="View History" onPress={() => router.push("/(tabs)/history")} />
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gameOption: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs
  },
  gameOptionSelected: {
    borderColor: colors.navy,
    backgroundColor: colors.slate100
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.slate900
  },
  gameSubtitle: {
    fontSize: 14,
    color: colors.slate500
  },
  errorText: {
    fontSize: 13,
    color: colors.red
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate700
  }
});
