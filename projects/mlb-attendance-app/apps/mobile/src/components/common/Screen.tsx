import { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../styles/tokens";

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export function Screen({ title, subtitle, children, scrollable = true }: ScreenProps) {
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scrollable ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.slate050
  },
  scroll: {
    paddingBottom: spacing.xxl
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.slate900
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate500
  }
});

