import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export function PrimaryButton({ label, onPress, disabled = false, variant = "primary" }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.buttonSecondary : null,
        variant === "ghost" ? styles.buttonGhost : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <Text style={[styles.label, variant !== "primary" ? styles.labelAlt : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 50,
    ...shadows.card
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.line
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderColor: colors.line
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    transform: [{ translateY: 1 }]
  },
  label: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  labelAlt: {
    color: colors.primary
  }
});
