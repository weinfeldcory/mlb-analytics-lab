import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface InsightCardProps {
  eyebrow?: string;
  title: string;
  body: string;
  footer?: ReactNode;
  tone?: "default" | "accent" | "dark";
}

export function InsightCard({ eyebrow, title, body, footer, tone = "default" }: InsightCardProps) {
  return (
    <View style={[styles.card, tone === "accent" ? styles.cardAccent : null, tone === "dark" ? styles.cardDark : null]}>
      {eyebrow ? <Text style={[styles.eyebrow, tone === "dark" ? styles.eyebrowDark : null]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, tone === "dark" ? styles.titleDark : null]}>{title}</Text>
      <Text style={[styles.body, tone === "dark" ? styles.bodyDark : null]}>{body}</Text>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  cardAccent: {
    backgroundColor: colors.surfaceAccent
  },
  cardDark: {
    backgroundColor: colors.surfaceDark,
    borderColor: "rgba(255,253,248,0.08)"
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.clay
  },
  eyebrowDark: {
    color: colors.warning
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.text
  },
  titleDark: {
    color: colors.textInverse
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted
  },
  bodyDark: {
    color: "rgba(255,253,248,0.78)"
  },
  footer: {
    marginTop: spacing.xs
  }
});
