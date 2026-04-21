import { Redirect } from "expo-router";
import type { Href } from "expo-router";
import { useAppData } from "../../src/providers/AppDataProvider";

export function OnboardingGuard() {
  const { isHydrated, profile } = useAppData();

  if (!isHydrated) {
    return null;
  }

  if (!profile.hasCompletedOnboarding) {
    return <Redirect href={"/onboarding" as Href} />;
  }

  return null;
}
