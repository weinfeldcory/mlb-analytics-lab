import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useResponsiveLayout } from "../../styles/responsive";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface HeroCardProps {
  children: ReactNode;
}

export function HeroCard({ children }: HeroCardProps) {
  const responsive = useResponsiveLayout();

  return <View style={[styles.card, responsive.isCompact ? styles.cardCompact : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDark,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,253,248,0.08)",
    gap: spacing.lg,
    ...shadows.hero
  },
  cardCompact: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md
  }
});
