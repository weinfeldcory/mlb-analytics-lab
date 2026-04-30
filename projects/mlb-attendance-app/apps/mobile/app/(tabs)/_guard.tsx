import { Redirect } from "expo-router";
import type { Href } from "expo-router";
import { useAppData } from "../../src/providers/AppDataProvider";

export function OnboardingGuard() {
  const { isHydrated, isAuthenticated, profile } = useAppData();

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href={"/auth" as Href} />;
  }

  if (!profile.hasCompletedOnboarding) {
    return <Redirect href={"/onboarding" as Href} />;
  }

  return null;
}
