import { StyleSheet, Text, View } from "react-native";
import { useResponsiveLayout } from "../../styles/responsive";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface MetricCardProps {
  label: string;
  value: string;
  meta?: string;
  accent?: "navy" | "green" | "amber" | "red";
  inverse?: boolean;
}

const accentMap = {
  navy: colors.primary,
  green: colors.success,
  amber: colors.warning,
  red: colors.danger
} as const;

export function MetricCard({ label, value, meta, accent = "navy", inverse = false }: MetricCardProps) {
  const responsive = useResponsiveLayout();

  return (
    <View style={[styles.card, responsive.isCompact ? styles.cardCompact : null, inverse ? styles.cardInverse : null]}>
      <Text style={[styles.label, inverse ? styles.labelInverse : null]}>{label}</Text>
      <Text
        style={[
          styles.value,
          responsive.isCompact ? styles.valueCompact : null,
          { color: inverse ? colors.textInverse : accentMap[accent] }
        ]}
      >
        {value}
      </Text>
      {meta ? (
        <Text style={[styles.meta, responsive.isCompact ? styles.metaCompact : null, inverse ? styles.metaInverse : null]}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card
  },
  cardCompact: {
    minWidth: 132,
    padding: spacing.md
  },
  cardInverse: {
    backgroundColor: colors.surfaceDarkAlt,
    borderColor: "rgba(255,253,248,0.08)"
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textSoft
  },
  labelInverse: {
    color: "rgba(255,253,248,0.68)"
  },
  value: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900"
  },
  valueCompact: {
    fontSize: 24,
    lineHeight: 28
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted
  },
  metaCompact: {
    fontSize: 12,
    lineHeight: 17
  },
  metaInverse: {
    color: "rgba(255,253,248,0.76)"
  }
});
