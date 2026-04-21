import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { LabeledInput } from "../src/components/common/LabeledInput";
import { SectionCard } from "../src/components/common/SectionCard";
import { useAppData } from "../src/providers/AppDataProvider";
import { colors, spacing } from "../src/styles/tokens";

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const { isHydrated, profile, teams, completeOnboarding } = useAppData();
  const isWide = width >= 1024;
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [favoriteTeamId, setFavoriteTeamId] = useState(profile.favoriteTeamId ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingShell}>
          <Text style={styles.loadingText}>Loading your local MLB record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profile.hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleContinue() {
    if (!displayName.trim()) {
      setError("Add the name you want attached to your logbook.");
      return;
    }

    await completeOnboarding({
      displayName,
      favoriteTeamId
    });
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <View style={styles.shell}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>First Run Setup</Text>
            <Text style={styles.title}>Start your ballpark ledger with a durable local record.</Text>
            <Text style={styles.subtitle}>
              This app stores your attendance history on this browser or device, builds stats from the games tied to each saved log,
              and keeps seeded demo history available so you can backfill or replace it later.
            </Text>
          </View>

          <View style={[styles.grid, isWide ? styles.gridWide : null]}>
            <View style={styles.mainColumn}>
              <SectionCard title="What This App Stores">
                <View style={styles.list}>
                  <Text style={styles.listItem}>Your display name, favorite team, follows, and saved attendance logs stay local.</Text>
                  <Text style={styles.listItem}>Each log stores the selected game, seat, and optional memory notes like companion, giveaway, and weather.</Text>
                  <Text style={styles.listItem}>You can export that record as JSON from Profile and import it later on the same or another device.</Text>
                </View>
              </SectionCard>

              <SectionCard title="How Stats Are Derived">
                <View style={styles.list}>
                  <Text style={styles.listItem}>Win-loss splits, teams seen, hitters seen, and pitchers seen are calculated from the games in your saved logbook.</Text>
                  <Text style={styles.listItem}>Witnessed moments like wins, losses, shutouts, and home runs come from the attached game result, not manual tagging.</Text>
                  <Text style={styles.listItem}>If you edit or delete a saved game later, the history and stats update with it.</Text>
                </View>
              </SectionCard>
            </View>

            <View style={styles.sideColumn}>
              <SectionCard title="Set Up Your Record">
                <LabeledInput
                  label="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  error={error ?? undefined}
                />
                <View style={styles.teamHeader}>
                  <Text style={styles.teamHeaderTitle}>Favorite team</Text>
                  <Text style={styles.teamHeaderCopy}>Optional now. You can change it later in Profile.</Text>
                </View>
                <View style={[styles.teamGrid, isWide ? styles.teamGridWide : null]}>
                  {teams.map((team) => {
                    const isSelected = favoriteTeamId === team.id;

                    return (
                      <Pressable
                        key={team.id}
                        onPress={() => setFavoriteTeamId(isSelected ? "" : team.id)}
                        style={[styles.teamOption, isSelected ? styles.teamOptionSelected : null]}
                      >
                        <Text style={styles.teamTitle}>
                          {team.city} {team.name}
                        </Text>
                        <Text style={styles.teamSubtitle}>{team.abbreviation}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <PrimaryButton label="Enter The App" onPress={handleContinue} />
              </SectionCard>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  scroll: {
    minHeight: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg
  },
  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  loadingText: {
    fontSize: 16,
    color: colors.slate700
  },
  backgroundOrbOne: {
    position: "absolute",
    top: -80,
    right: -30,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: colors.sky,
    opacity: 0.8
  },
  backgroundOrbTwo: {
    position: "absolute",
    bottom: 40,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: colors.slate100,
    opacity: 0.75
  },
  shell: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    gap: spacing.lg
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: 26,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.amber,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.white,
    maxWidth: 720
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,253,248,0.86)",
    maxWidth: 840
  },
  grid: {
    gap: spacing.lg
  },
  gridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  mainColumn: {
    flex: 1,
    gap: spacing.lg
  },
  sideColumn: {
    flex: 0.95,
    gap: spacing.lg
  },
  list: {
    gap: spacing.sm
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.slate700
  },
  teamHeader: {
    gap: spacing.xs
  },
  teamHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.slate900
  },
  teamHeaderCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.slate500
  },
  teamGrid: {
    gap: spacing.sm
  },
  teamGridWide: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  teamOption: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.white,
    minWidth: 180,
    flexGrow: 1
  },
  teamOptionSelected: {
    borderColor: colors.navy,
    backgroundColor: colors.slate100
  },
  teamTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.slate900
  },
  teamSubtitle: {
    fontSize: 13,
    color: colors.slate500
  }
});
