import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../styles/tokens";

interface Segment<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrapper}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={[styles.segment, active ? styles.segmentActive : null]}>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
    alignSelf: "flex-start"
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill
  },
  segmentActive: {
    backgroundColor: colors.surfaceRaised
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textSoft
  },
  labelActive: {
    color: colors.primary
  }
});
