import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ eyebrow, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.clay
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    color: colors.text
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted
  },
  action: {
    marginTop: spacing.sm
  }
});
