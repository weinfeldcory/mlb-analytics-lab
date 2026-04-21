import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";
import { colors, radii, spacing } from "../../styles/tokens";

interface PlaceholderPanelProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PlaceholderPanel({ title, body, actionLabel, onAction }: PlaceholderPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate200
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.slate900
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate500
  }
});
