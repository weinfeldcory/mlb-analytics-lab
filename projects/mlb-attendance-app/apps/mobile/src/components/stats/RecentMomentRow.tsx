import { StyleSheet, Text, View } from "react-native";
import type { RecentMoment } from "../../types/models";
import { colors, spacing } from "../../styles/tokens";

interface RecentMomentRowProps {
  moment: RecentMoment;
}

export function RecentMomentRow({ moment }: RecentMomentRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.copy}>
        <Text style={styles.title}>{moment.title}</Text>
        <Text style={styles.subtitle}>{moment.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.amber,
    marginTop: 6
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate900,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate500
  }
});

