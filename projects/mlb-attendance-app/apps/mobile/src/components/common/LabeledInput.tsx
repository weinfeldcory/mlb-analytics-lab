import { StyleSheet, Text, TextInput, TextInputSubmitEditingEventData, NativeSyntheticEvent, View } from "react-native";
import { colors, radii, shadows, spacing } from "../../styles/tokens";

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  blurOnSubmit?: boolean;
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  error,
  multiline = false,
  numberOfLines,
  secureTextEntry = false,
  keyboardType = "default",
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing
}: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        onSubmitEditing={onSubmitEditing}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline ? styles.inputMultiline : null, error ? styles.inputError : null]}
        placeholderTextColor={colors.slate400}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "800"
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 52,
    ...shadows.subtle
  },
  inputMultiline: {
    minHeight: 164
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    fontSize: 13,
    color: colors.danger
  }
});
