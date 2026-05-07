import { PolicyScreen } from "../../src/components/common/PolicyScreen";

export default function BetaDisclaimerScreen() {
  return (
    <PolicyScreen
      title="Beta Disclaimer"
      summary="This page sets expectations for a private beta: the product is useful, but still changing. It is not final legal language."
      sections={[
        {
          title: "What to expect",
          body: [
            "This beta is intended for early feedback on account flows, baseball game logging, and personal stats. Some features may be incomplete, rough, or occasionally inconsistent while the product is still being hardened."
          ]
        },
        {
          title: "Data and reliability",
          body: [
            "Hosted sync and local storage should work, but temporary bugs, missing historical data, or recovery issues can still happen during beta. Keep anything important backed up if you are testing heavily."
          ]
        },
        {
          title: "No official relationship",
          body: [
            "Witnessed is an independent fan project and is not affiliated with, endorsed by, or sponsored by Major League Baseball, MLB Advanced Media, or any MLB club."
          ]
        },
        {
          title: "Feedback",
          body: [
            "If you find issues, use the beta debug page or send a clear summary of what happened, what account mode you were using, and what you expected to see. That helps isolate storage and sync bugs quickly."
          ]
        }
      ]}
    />
  );
}
