# MLB Attendance App Page Backlog

Last updated: 2026-04-29

This backlog is derived from `PAGE_ROADMAPS.md` and is ordered for near-term execution. It assumes the current product priority is a quality pass on the local ledger before major catalog expansion.

## Priority Bands

- `P0`: trust, correctness, or core usability
- `P1`: meaningful product depth once the basics are stable
- `P2`: valuable expansion after the current loop is strong

## Current Recommended Build Order

1. Home: build a single hero and clearer next-best-action experience
2. Stats: add first split views and narrative summary modules
3. Log Game: improve search matching and save-state trust
4. History: add unsaved-change signaling and better bulk-review ergonomics
5. Profile: clarify storage, import/export, and reset semantics
6. Cross-page: expand repository and migration test coverage

## Backlog By Page

## Home

### `P0`

- Build one dominant hero module that combines current state, progress, and the next-best action.
  - Why now: Home is information-rich but visually fragmented.
  - Acceptance: the top third has one clear module and one clear CTA.

- Tighten the dashboard hierarchy so secondary modules stop competing with the main story.
  - Acceptance: the page reads in one deliberate sequence instead of several equal-weight cards.

### `P1`

- Make friend cards comparative instead of descriptive.
  - Examples: shared parks, same games, favorite-team record delta, overlapping player sightings.
  - Acceptance: every friend card surfaces one useful comparison.

- Improve sparse-history behavior in the attendance-pattern module.
  - Acceptance: low-volume users can still interpret what the grid means.

### `P2`

- Add season recap cards and streaks.
- Add collectible surfaces such as park progress and rivalry tracking.

## Stats

### `P0`

- Add first split views beyond aggregate player totals.
  - Suggested first set: season, opponent, stadium, weekday, home vs away.
  - Acceptance: users can answer at least one meaningful question not possible today.

- Add narrative summary modules above the hitter and pitcher tables.
  - Examples: season leaders, favorite-team split, most-seen starters, most-seen opponents.
  - Acceptance: the page has a story before the dense tables begin.

### `P1`

- Add stat explanations for derived rates and baseball formatting.
  - Acceptance: batting average, ERA, and innings formatting are legible without baseball-insider assumptions.

- Lighten the current filter UX and grouping.
  - Acceptance: controls feel intentional on web and mobile, not crowded.

### `P2`

- Add screenshot-friendly recap blocks.
- Add park leaderboards, rivalry summaries, and opening-day history.

## Log Game

### `P0`

- Improve game search matching quality.
  - Scope: abbreviations, venue aliases, fuzzy team recall, stronger date handling.
  - Acceptance: common queries resolve the intended game without retries.

- Add explicit save-state feedback.
  - States: saving, saved, duplicate blocked, failed.
  - Acceptance: the user always knows whether the record actually persisted.

### `P1`

- Add season and opponent filters.
  - Acceptance: larger result sets can be narrowed without leaning on raw text search alone.

- Add a manual fallback game flow for catalog gaps.
  - Acceptance: unresolved games can still be logged without pretending they are canonical.

### `P2`

- Add repeat-entry helpers for seats, companions, and note fragments.
- Add guided batch backfill mode.

## History

### `P0`

- Add unsaved-change signaling while editing.
  - Acceptance: users can tell when they have modified a record before saving or canceling.

- Improve card hierarchy and density in the game detail artifact.
  - Acceptance: score, line score, performers, notes, and actions feel balanced rather than stacked.

### `P1`

- Add faster bulk-review or repeat-edit tools for backfill sessions.
  - Acceptance: updating many records in one sitting feels practical.

- Prepare season-focused views or exports.
  - Acceptance: larger ledgers can be reviewed in season-sized slices.

### `P2`

- Add attachments and richer memory objects.
- Add print-friendly or export-by-season history views.

## Profile

### `P0`

- Clarify local-storage ownership, export coverage, and reset consequences.
  - Acceptance: users understand exactly what is local, portable, and destructible.

- Improve import/export success and failure guidance.
  - Acceptance: malformed payloads fail clearly and successful imports feel trustworthy.

### `P1`

- Separate identity, follows, and data-management sections more strongly.
  - Acceptance: Profile reads like a control center instead of a mixed settings page.

- Add meaningful app preferences.
  - Candidates: timezone handling, default stats split, display density.

### `P2`

- Add account-readiness messaging and future backup guidance.
- Add privacy and sharing controls once auth exists.

## Cross-Page Infrastructure

### `P0`

- Add tests around repository migrations, hydration failure recovery, and local-state integrity.
  - Acceptance: local trust is backed by more than domain-only tests.

- Standardize saving, error, and empty-state language across pages.
  - Acceptance: the app communicates trust and failure states consistently.

### `P1`

- Audit keyboard, focus, and responsive behavior on Expo web.
- Keep seeded data refreshes aligned with the richer game model.

### `P2`

- Review performance for much larger local histories.
- Add migration coverage for future canonical catalog models.

## Suggested Next Sprint

If work is batched into one focused sprint, the best bundle now is:

1. Home hero plus next-best-action redesign
2. Stats split views plus top-of-page summary modules
3. Log Game search-quality and save-state improvements

That bundle improves the three most visible product surfaces without depending on accounts, backend work, or a full catalog rebuild.
