# Account And Onboarding Copy Audit

Status: Draft  
Date: 2026-05-01  
Scope: `apps/mobile/app/auth.tsx`, `apps/mobile/app/onboarding.tsx`

## Screen: Auth

File:
- [auth.tsx](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/apps/mobile/app/auth.tsx)

Primary purpose:
- let a user sign in or create an account as fast as possible

Primary action:
- `Sign In`
- `Create Account`

Copy to cut or simplify:
- `Hosted Accounts` / `Local Accounts`
  This frames the storage implementation instead of the user outcome.
- `Open your MLB attendance ledger from any device and keep it synced.`
  This is close, but still reads like product framing instead of immediate value.
- `Use an email and password to keep your attendance history, profile, and stats available anywhere you sign in.`
  Repeats the same promise as the hero title.
- Entire `What This Does` section
  It is explanatory rather than action-supporting, and it competes with the form.
- `Your profile and attendance history sync through the hosted backend instead of staying trapped on one browser.`
  `hosted backend` is implementation language, not user language.
- `Import and export still work as backup rails while the product moves from local ledgers to hosted accounts.`
  Too advanced for account entry. Not relevant to the first action.

Information hierarchy issues:
- The left explanatory column is heavier than the form itself.
- The screen explains storage mode before it proves value.
- The mode toggle buttons are visually equal to the submit CTA, which weakens the main action.

Recommended direction:
- Keep one short promise at the top.
- Remove implementation wording.
- Make the form and submit action dominate the screen.

## Screen: Onboarding

File:
- [onboarding.tsx](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/apps/mobile/app/onboarding.tsx)

Primary purpose:
- collect the minimum profile setup needed to enter the app

Primary action:
- `Enter The App`

Copy to cut or simplify:
- `First Run Setup`
  Neutral, but generic and not user-benefit oriented.
- `Start your ballpark ledger with a durable local record.`
  `durable local record` is implementation-heavy.
- `This app stores your attendance history on this browser or device, builds stats from the games tied to each saved log, and keeps seeded demo history available so you can backfill or replace it later.`
  Over-explains product internals and introduces seeded demo history too early.
- Entire `What This App Stores` section
  Explains internals instead of helping the user complete setup.
- Entire `How Stats Are Derived` section
  Too detailed for onboarding and not needed before first successful use.
- `Optional now. You can change it later in Profile.`
  Useful idea, but can be shortened.
- Error copy: `Add the name you want attached to your logbook.`
  Slightly verbose for a required-field message.

Information hierarchy issues:
- The screen asks for only two things, but the copy makes the setup feel much larger.
- The two explanatory cards compete with the actual setup form.
- The user is forced to process storage and stats explanations before entering the app.

Recommended direction:
- Reduce onboarding to identity plus favorite team.
- Keep one sentence on why favorite team helps.
- Move storage/stat explanations to Profile, Help, or a later education surface.

## Cross-Screen Findings

- The current copy often explains implementation instead of value.
- `local`, `hosted`, `storage`, `seeded`, and `import/export` appear too early.
- The screens are trying to educate and convert at the same time.
- The product feels more complex than the next action actually is.

## Suggested Rewrite Principles

- One screen, one purpose.
- Lead with user value, not data model or storage model.
- Keep only the copy that helps the user take the next step.
- Defer advanced explanations until after the user is inside the product.
