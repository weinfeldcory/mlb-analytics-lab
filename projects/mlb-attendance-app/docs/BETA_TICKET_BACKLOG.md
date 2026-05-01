# MLB Attendance App Beta Ticket Backlog

Last updated: 2026-05-01

This backlog turns the current roadmap into a tactical beta plan for the next two weeks. It is grouped by subproduct so work can ship in coherent slices instead of one-off UI changes.

## How To Use This Backlog

- `P0`: required for a credible private beta
- `P1`: strong beta improvements once the loop is stable
- `P2`: valuable depth, but not required before inviting more testers

For execution, prefer shipping one complete slice at a time:

1. capture and trust
2. first-run and dashboard clarity
3. history and memory depth
4. hosted identity and social basics
5. data quality and player completeness

## 1. Capture And Save Loop

### `P0`

- Finish the post-log flow.
  - Scope: save -> recap -> game detail -> back to dashboard/history.
  - Acceptance: a successful save always lands in a satisfying next step.

- Add guided memory prompts during logging and later editing.
  - Scope: optional prompts, quick memory chips, skip-for-now path.
  - Acceptance: richer journals without making logging slower.

- Add manual trust states for all log outcomes.
  - Scope: saving, saved, duplicate, failure, player-data pending.
  - Acceptance: users never wonder whether a game actually saved.

### `P1`

- Add faster backfill helpers.
  - Examples: recent seat patterns, common companions, recent search recall.

- Add a manual fallback path for unresolved games.

## 2. First-Run And Identity

### `P0`

- Finish the new onboarding flow and first-run empty states.
  - Scope: concise onboarding, favorite team save, first-game prompt.
  - Acceptance: a new user knows what to do in under 60 seconds.

- Simplify account surfaces around value and next action.
  - Scope: login, account creation, profile identity section.

### `P1`

- Add lightweight profile preferences.
  - Candidates: profile visibility, default reminder for memory prompts.

## 3. Home Dashboard

### `P0`

- Keep the top of Home focused on:
  - ledger hero
  - next best action
  - latest game
  - top personal insights

- Tighten level progress readability.
  - Scope: raw counts first, point logic secondary, simpler copy.

- Make zero-log states feel intentional.

### `P1`

- Add better milestone storytelling.
  - Scope: park progress, rivalry streaks, first-visit moments.

- Add better friend overlap summaries once the hosted social graph is live.

## 4. History And Memory Pages

### `P0`

- Ship logged-game detail pages as personal memory artifacts.
  - Scope: score, line score, seat, memory fields, player status, safe edit/delete.

- Improve history browse ergonomics.
  - Scope: search, filters, grouped views, faster revisit path to detail page.

- Make editing state safer.
  - Scope: clearer save/cancel state and better density in cards.

### `P1`

- Add “missing details” and “missing memories” cleanup flows.

- Add season review slices and print/export prep.

## 5. Stats And Player Insights

### `P0`

- Add summary modules above tables.
  - Scope: top hitters seen, most-seen starters, favorite-team angle, season lens.

- Add player-data completeness caveats.
  - Acceptance: no player insight is shown as fully complete if source data is partial.

### `P1`

- Add first split views.
  - Scope: season, venue, opponent, weekday, home vs away.

- Add friend-safe shared stats later, only after profile privacy rules are firm.

## 6. Hosted Accounts, Sync, And Recovery

### `P0`

- Keep hosted identity stable and obvious.
  - Scope: sync status, debug page, recovery docs, no user-specific runtime branches.

- Finish isolation QA.
  - Scope: sign-out clears in-memory state, hosted data rehydrates correctly, local fallback stays isolated.

### `P1`

- Add profile visibility controls that tie into social pages.

- Add safer import/recovery handoff between local and hosted ledgers.

## 7. Social Graph MVP

### `P0`

- Replace mocked friends with real hosted user profiles.
  - Scope: searchable profiles, one profile per auth user, safe public fields only.

- Add follow-request relationships.
  - Scope: request, accept, reject, unfollow, pending requests.

- Add a privacy-safe friend profile page.
  - Scope: display name, favorite team, shared games count, shared stadium count.
  - Do not show: seat, companions, memory notes, exact private history.

### `P1`

- Add shared profile stats beyond counts.
  - Candidates: teams seen count, favorite-team record, witnessed home runs.
  - Only if those can be served without exposing private log rows.

## 8. Catalog And Data Quality

### `P0`

- Keep the full MLB catalog usable for backfill.
  - Scope: search quality, canonical identity, data quality metadata.

- Document and repair incomplete player-data batches.

### `P1`

- Expand enriched player data across all catalog games.

- Build repeatable repair/backfill scripts for missing player lines.

## 9. Beta Operations And Trust

### `P0`

- Maintain security and exposure hygiene.
  - Scope: no secrets in repo, legal placeholders linked, debug info sanitized.

- Keep docs current for:
  - security audit
  - account isolation QA
  - social graph MVP
  - data recovery

### `P1`

- Add basic beta event tracking later.
  - Candidates: sign up, first log, second log, follow request, onboarding complete.

## Recommended Build Order From Here

1. Finish the log -> recap -> detail -> history loop.
2. Finish first-run polish and zero-log Home states.
3. Replace mocked social data with hosted profile discovery and follow requests.
4. Add privacy-safe friend profile pages.
5. Add stats summary modules and player-data completeness warnings.

## Active Build Queue

### In progress

- Post-log recap and logged-game detail flow
- Guided memory prompts
- History browse improvements
- Hosted social graph foundation

### Next

- Profile-based friend search and pending request UI
- Friend profile page
- Home social section cleanup against real hosted data
