import { StyleSheet, Text, View } from "react-native";
import { useResponsiveLayout } from "../../styles/responsive";
import { colors, spacing } from "../../styles/tokens";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  const responsive = useResponsiveLayout();

  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, responsive.isCompact ? styles.titleCompact : null]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, responsive.isCompact ? styles.subtitleCompact : null]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.clay
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: colors.text
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 28
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    maxWidth: 860
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20
  }
});
