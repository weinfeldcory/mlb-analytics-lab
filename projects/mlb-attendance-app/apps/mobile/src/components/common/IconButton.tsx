import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../../styles/tokens";

interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  onPress: () => void;
}

export function IconButton({ icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}>
      <View>{icon}</View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  pressed: {
    opacity: 0.88
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary
  }
});
