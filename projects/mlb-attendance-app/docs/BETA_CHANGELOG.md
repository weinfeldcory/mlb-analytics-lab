# Witnessed Beta Changelog

Last updated: 2026-05-02

This file tracks user-visible product changes for the private beta. It is not a git log. It should answer: what can testers do now that they could not do before?

## 2026-05-02

- Hosted auth recovery is more resilient when the deployed Supabase project lags the latest social-profile schema.
- Password reset now routes to a real in-app reset screen instead of a dead page.
- Hosted social/profile failures are less likely to block account access to the core ledger.

## 2026-05-01

- Added multi-step onboarding with favorite-team setup and a guided first-run flow.
- Added post-log recap and dedicated logged-game detail pages.
- Added guided memory prompts and richer edit flows for logged games.
- Added a hosted social MVP foundation: searchable profiles, follow requests, and privacy-safe friend profile pages.
- Added sync/debug status surfaces so testers can tell whether they are in hosted or local mode.
- Added legal placeholder pages for Terms, Privacy, and Beta Disclaimer.
- Added full 2021-present MLB catalog support for the logging/search flow.

## Update Rules

- Add only user-visible changes or important trust/recovery changes.
- Group entries by date.
- Prefer plain product language over implementation detail.
- Update this file whenever a meaningful beta capability ships.
