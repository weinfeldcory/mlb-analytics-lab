# MLB Attendance App Page Roadmaps

Last updated: 2026-04-29

This file is the page-level companion to `PRODUCT_ROADMAP_MOBILE.md`.

The product roadmap answers release sequencing across the whole app. This document answers a narrower question: what each page is for, what is already true in the product today, and what the next page-specific improvements should be.

## How To Use This Document

- Treat each page as a product surface with a clear job.
- Keep near-term page work aligned to the current product focus: polish the local ledger before expanding the catalog.
- Update the page roadmap when a page changes shape enough that the old acceptance criteria no longer describe reality.

## Shared Principles

- Personal record first: every page should strengthen the fan’s own attendance ledger.
- Fast scan, then depth: answer the obvious question quickly, then support deeper exploration.
- Trust should be visible: storage state, save state, edit state, and destructive actions should never feel hidden.
- Seed-aware, not seed-dependent: page design should survive the transition from fixtures to a real catalog.
- Responsive by default: the app now lives on web and mobile, so page roadmaps should assume both matter.

## Home

### Product role

Home is the front door to the ledger. It should explain the state of the user’s record, why it matters, and what the next useful action is.

### Current state

- summary cards for games attended, favorite-team record, hits seen, and pitchers seen
- level/progression framing tied to games, parks, and home runs
- latest-game recap
- attendance-pattern grid by weekday and first-pitch time
- sortable team summary table
- followed-friend feed and follow suggestions
- next-action logic already exists, but it is not yet the dominant visual idea

### What great looks like

- one clear hero explains the ledger in under five seconds
- progress feels collectible rather than decorative
- the page naturally suggests one next action without feeling busy
- friend context adds comparison, not noise

### Near-term roadmap

1. Collapse the current top modules into one stronger hero that combines progress, latest state, and next-best action.
2. Tighten the dashboard hierarchy so only one or two modules compete for attention above the fold.
3. Make friend cards comparative by showing overlap, shared parks, same games, or favorite-team record deltas.
4. Improve sparse-history behavior for the attendance-pattern view so low-volume users still understand it.

### Later roadmap

1. Add season recap modules and streaks.
2. Add park progress, rivalry progress, and opening-day collection surfaces.
3. Add pinned metrics or saved views for repeat users.

### Acceptance criteria for the next release

- Home has one obvious hero and one obvious next action.
- The user can interpret their progress without needing another page.
- Friend content feels meaningfully different from Profile.

## Log Game

### Product role

Log Game is the core capture flow. It should get the user from memory to saved record with minimal friction.

### Current state

- seeded local catalog search by team, date, and stadium
- selected-game summary before save
- required seat section and optional row/seat
- optional memory metadata for companion, giveaway, weather, and memorable moment
- duplicate prevention
- success confirmation after save

### What great looks like

- the user can find the right game with minimal typing
- the form asks for only what is necessary at save time
- save state is explicit enough that the user trusts the result
- the page supports both same-day logging and older backfill work

### Near-term roadmap

1. Improve search quality for abbreviations, venue aliases, fuzzy team recall, and date handling.
2. Add clearer save-state messaging for saving, saved, duplicate blocked, and failed.
3. Add season and opponent filters once the local catalog grows.
4. Add a manual fallback path for unresolved games so the ledger is not blocked by catalog gaps.
5. Add repeat-entry helpers such as recent seat patterns, common companions, or note fragments.

### Later roadmap

1. Guided backfill mode for multi-game entry sessions.
2. CSV import and validation flow.
3. Photo and attachment support after save.

### Acceptance criteria for the next release

- normal MLB queries resolve without repeated retries
- the user always knows whether a save actually succeeded
- the page is credible for both live logging and backfill

## History

### Product role

History is the editable source of truth for the ledger. It should make saved attendance feel correctable, inspectable, and safe.

### Current state

- filterable logbook
- sort and view controls
- edit flow for seat and memory metadata
- delete flow with an in-card confirmation step
- richer game artifacts including line score, R/H/E, starters, top hitters, and witnessed-event pills

### What great looks like

- the user trusts History enough to clean up years of attendance there
- each saved game feels like a compact baseball artifact
- destructive actions are safe
- larger histories remain easy to scan and review

### Near-term roadmap

1. Add stronger unsaved-change signaling while editing.
2. Improve card density and hierarchy so score, performers, notes, and actions feel balanced.
3. Add faster bulk-review or repeat-edit affordances for backfill sessions.
4. Prepare season-focused views and exports once larger histories become common.

### Later roadmap

1. Add attachments and photo memories.
2. Add richer witnessed-event editing or tagging.
3. Add export-by-season or print-friendly history views.

### Acceptance criteria for the next release

- History feels like the authoritative ledger
- edit state is obvious before save
- the page remains usable when the record is much larger than the seeded demo set

## Stats

### Product role

Stats turns the ledger into a personal baseball analytics product. It should reward more logging with more interesting answers.

### Current state

- hitter and pitcher summary tables
- sortable columns
- threshold and attribute filters using the current dropdown control
- baseball-style innings formatting
- stats derived from real batting and pitching lines in the seeded data

### What great looks like

- the user can answer fun and serious baseball questions from their own attendance history
- the page has narrative shape instead of feeling like two raw data tables
- filters feel exploratory, not spreadsheet-heavy

### Near-term roadmap

1. Add first split views beyond raw player totals: season, opponent, stadium, weekday, and home-vs-away.
2. Add stronger summary modules above the tables so the page tells a story before the grids begin.
3. Add lightweight stat explanations where baseball-specific formatting or derived rates may confuse users.
4. Make the current filter UX feel lighter and more obviously grouped, especially on web.

### Later roadmap

1. Park leaderboards, rivalry summaries, and opening-day history.
2. Season-over-season and lifetime trend views.
3. Favorite-team player history and franchise-specific collections.

### Acceptance criteria for the next release

- the page exposes at least one meaningful split layer
- the top of the page has narrative summary value, not just counters
- users can interpret the derived stats without guessing

## Profile

### Product role

Profile is the control center for identity, storage trust, and data portability. It should make the ledger feel owned.

### Current state

- onboarding-complete profile state
- display name and favorite-team controls
- friend follow toggles
- storage status messaging
- import, export, retry-load, and reset controls

### What great looks like

- the user understands what is stored locally and what reset can destroy
- data portability feels real, not hidden in a utility corner
- identity settings stay simple and subordinate to the ledger

### Near-term roadmap

1. Clarify storage and reset copy so browser/device-local ownership is unmistakable.
2. Make import/export success and failure states more explicit and calmer.
3. Separate identity, follows, and data-management sections more strongly.
4. Add a small set of real product preferences such as timezone handling or default stats behavior.

### Later roadmap

1. Sign-in and account linking.
2. Sync and conflict-resolution controls.
3. Privacy, sharing, and export settings.

### Acceptance criteria for the next release

- Profile clearly communicates ownership of the ledger
- destructive and import/export actions are understandable
- settings feel complete for a single-user local-first product

## Cross-Page Workstreams

These are not owned by one page, but they should be reviewed before large changes ship:

- repository and migration test coverage
- seeded data refresh and future catalog expansion
- keyboard and accessibility behavior on web
- consistent empty, loading, saving, and failure states
- navigation and information hierarchy across tabs
- performance once the local record becomes much larger

## Suggested Operating Rhythm

For each release:

1. pick one primary page to deepen
2. pick one secondary page to keep aligned
3. reserve a smaller budget for cross-page consistency and trust fixes
4. update this document when a page materially changes shape

That should keep the app from drifting into five partially-finished tabs with different product standards.
