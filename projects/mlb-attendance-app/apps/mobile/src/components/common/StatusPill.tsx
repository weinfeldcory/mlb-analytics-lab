import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../styles/tokens";

export type StatusPillTone = "default" | "success" | "warning" | "danger" | "info" | "dark";

interface StatusPillProps {
  label: string;
  tone?: StatusPillTone;
}

const toneStyles = {
  default: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.line,
    textColor: colors.textMuted
  },
  success: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: "rgba(27,127,106,0.2)",
    textColor: colors.success
  },
  warning: {
    backgroundColor: colors.surfaceWarning,
    borderColor: "rgba(229,169,61,0.22)",
    textColor: colors.navy
  },
  danger: {
    backgroundColor: colors.surfaceDanger,
    borderColor: "rgba(184,77,61,0.18)",
    textColor: colors.danger
  },
  info: {
    backgroundColor: colors.surfaceAccent,
    borderColor: "rgba(17,36,61,0.12)",
    textColor: colors.primary
  },
  dark: {
    backgroundColor: "rgba(255,253,248,0.1)",
    borderColor: "rgba(255,253,248,0.12)",
    textColor: colors.textInverse
  }
} as const;

export function StatusPill({ label, tone = "default" }: StatusPillProps) {
  const style = toneStyles[tone];

  return (
    <View style={[styles.pill, { backgroundColor: style.backgroundColor, borderColor: style.borderColor }]}>
      <Text style={[styles.label, { color: style.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    alignSelf: "flex-start"
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4
  }
});
