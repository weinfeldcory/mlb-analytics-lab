import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { Screen } from "../../components/common/Screen";
import { LabeledInput } from "../../components/common/LabeledInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SectionCard } from "../../components/common/SectionCard";
import { useAppData } from "../../providers/AppDataProvider";
import { colors, spacing } from "../../styles/tokens";

export function ProfileScreen() {
  const {
    profile,
    teams,
    updateProfile,
    persistenceStatus,
    persistenceError,
    exportAppData,
    importAppData,
    resetAppData,
    retryHydration
  } = useAppData();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [favoriteTeamId, setFavoriteTeamId] = useState(profile.favoriteTeamId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [importExportText, setImportExportText] = useState("");

  useEffect(() => {
    setDisplayName(profile.displayName);
    setFavoriteTeamId(profile.favoriteTeamId ?? "");
  }, [profile.displayName, profile.favoriteTeamId]);

  async function handleSave() {
    await updateProfile({
      displayName,
      favoriteTeamId
    });
    setMessage("Profile preferences saved on this device.");
  }

  function handleExport() {
    setImportExportText(exportAppData());
    setMessage("Current device record exported into the text box below.");
  }

  async function handleImport() {
    try {
      await importAppData(importExportText);
      setMessage("Imported app data into this device record.");
    } catch {
      setMessage(null);
    }
  }

  async function handleReset() {
    await resetAppData();
    setImportExportText("");
    setMessage("Reset the local record back to the seeded demo state.");
  }

  return (
    <Screen
      title="Profile"
      subtitle="Set the identity and favorite-team context that shape your personal attendance record."
    >
      <SectionCard title="Identity">
        <LabeledInput
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
        />
        <PrimaryButton label="Save Profile" onPress={handleSave} />
        {message ? <Text style={styles.successText}>{message}</Text> : null}
      </SectionCard>

      <SectionCard title="Favorite Team">
        <View style={styles.teamList}>
          {teams.map((team) => {
            const isSelected = team.id === favoriteTeamId;

            return (
              <Pressable
                key={team.id}
                onPress={() => setFavoriteTeamId(team.id)}
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
      </SectionCard>

      <SectionCard title="Storage">
        <Text style={styles.storageText}>Save status: {persistenceStatus}</Text>
        <Text style={styles.helperText}>
          Your profile and attendance logbook now persist on this device between app restarts.
        </Text>
        {persistenceError ? <Text style={styles.errorText}>{persistenceError}</Text> : null}
        {persistenceStatus === "error" ? (
          <PrimaryButton label="Retry Storage Load" onPress={retryHydration} />
        ) : null}
      </SectionCard>

      <SectionCard title="Debug Tools">
        <Text style={styles.helperText}>
          Export the current device record, paste an exported payload to import, or reset back to the seeded demo state.
        </Text>
        <LabeledInput
          label="Import / export JSON"
          value={importExportText}
          onChangeText={setImportExportText}
          placeholder='{"version":1,"profile":...}'
        />
        <View style={styles.actionStack}>
          <PrimaryButton label="Export Local Record" onPress={handleExport} />
          <PrimaryButton label="Import Pasted Record" onPress={handleImport} />
          <PrimaryButton label="Reset To Seeded Demo" onPress={handleReset} />
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  teamList: {
    gap: spacing.sm
  },
  teamOption: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.white
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
  },
  successText: {
    fontSize: 14,
    color: colors.green
  },
  errorText: {
    fontSize: 14,
    color: colors.red
  },
  storageText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.slate900
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.slate500
  },
  actionStack: {
    gap: spacing.sm
  }
});
