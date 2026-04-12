import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "../../styles/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center"
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    backgroundColor: colors.navySoft
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  }
});

