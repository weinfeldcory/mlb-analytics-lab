import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../styles/tokens";

interface StatCardProps {
  label: string;
  value: string;
  accent?: "navy" | "green" | "amber";
}

const accentMap = {
  navy: colors.navy,
  green: colors.green,
  amber: colors.amber
};

export function StatCard({ label, value, accent = "navy" }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentMap[accent] }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    gap: spacing.sm
  },
  label: {
    fontSize: 14,
    color: colors.slate500
  },
  value: {
    fontSize: 26,
    fontWeight: "700"
  }
});

