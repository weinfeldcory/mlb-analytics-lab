import { Screen } from "../../components/common/Screen";
import { PlaceholderPanel } from "../../components/common/PlaceholderPanel";
import { useAppData } from "../../providers/AppDataProvider";

export function ProfileScreen() {
  const { profile } = useAppData();

  return (
    <Screen
      title="Profile"
      subtitle="Profile should hold account-level information, preferences, achievements, and settings rather than becoming another dashboard."
    >
      <PlaceholderPanel
        title={profile.displayName}
        body="This prototype keeps profile intentionally light. Later this is where favorite team editing, account settings, and achievements should live."
      />
    </Screen>
  );
}
