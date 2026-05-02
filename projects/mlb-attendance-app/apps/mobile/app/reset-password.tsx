import { useEffect, useMemo, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { LabeledInput } from "../src/components/common/LabeledInput";
import { PrimaryButton } from "../src/components/common/PrimaryButton";
import { SectionCard } from "../src/components/common/SectionCard";
import { getHostedBackendMode, getSupabaseEnv, supabase } from "../src/lib/persistence/supabaseClient";
import { colors, spacing } from "../src/styles/tokens";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const authRoute = "/auth" as Href;
  const hostedMode = getHostedBackendMode();
  const hostedConfigured = getSupabaseEnv().isConfigured && Boolean(supabase);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canReset = useMemo(() => hostedMode && hostedConfigured, [hostedConfigured, hostedMode]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHelpMessage("Enter a new password for your hosted account.");
        setError(null);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHelpMessage("Enter a new password for your hosted account.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!canReset) {
    return <Redirect href={"/auth" as Href} />;
  }

  async function handleReset() {
    setError(null);
    setHelpMessage(null);

    if (!password.trim()) {
      setError("Enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase!.auth.updateUser({
        password
      });

      if (updateError) {
        throw updateError;
      }

      setHelpMessage("Password updated. You can log in with the new password now.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "We could not update your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.shell}>
          <View style={styles.hero}>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>Use the link from your email, then choose a new password for your hosted account.</Text>
          </View>

          <SectionCard title="Choose a new password">
            <LabeledInput
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              autoCapitalize="none"
              secureTextEntry
            />
            <LabeledInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              autoCapitalize="none"
              secureTextEntry
              onSubmitEditing={() => {
                if (!isSubmitting) {
                  void handleReset();
                }
              }}
            />
            <PrimaryButton label={isSubmitting ? "Updating..." : "Update Password"} onPress={handleReset} disabled={isSubmitting} />
            {helpMessage ? <Text style={styles.helpText}>{helpMessage}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable onPress={() => router.push(authRoute)}>
              <Text style={styles.backLink}>Back to log in</Text>
            </Pressable>
          </SectionCard>
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
  shell: {
    width: "100%",
    maxWidth: 640,
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
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.white
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: "rgba(255,253,248,0.86)"
  },
  helpText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.green
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.red
  },
  backLink: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy
  }
});
