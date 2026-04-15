# Baseball Analytics App Backlog

## How To Use This File

This backlog translates the roadmap into executable work.

Rules:

- `Now` means active priority for the next few development cycles.
- `Next` means important, but blocked on current foundation work.
- `Later` means intentionally deferred.
- each ticket should be small enough to complete without mixing unrelated concerns

Status labels:

- `[todo]`
- `[doing]`
- `[blocked]`
- `[done]`

## Now

These items are the highest-value next steps for turning the current project into a stronger product.

### Data Product Foundation

- [todo] Document the refresh pipeline in `README.md`.
  - Pulls
  - DuckDB table builds
  - export scripts
  - viewer refresh path

- [todo] Add a field glossary for hitter exports.
  - define core ranking fields
  - define blend fields
  - define trace fields

- [todo] Add a field glossary for pitcher exports.
  - define role bucket fields
  - define run-prevention and pitch-quality fields
  - define current-vs-prior blend fields

- [todo] Audit filename and season naming consistency.
  - clarify `2025` vs `2026` outputs
  - make preseason and in-season artifacts easier to distinguish

- [todo] Add lightweight export validation.
  - required fields present
  - no empty datasets
  - viewer JSON written successfully

### Viewer Productization

- [todo] Split `viewer/main.js` into smaller modules.
  - data loading
  - filter state
  - roster builder logic
  - hitter rendering
  - pitcher rendering

- [todo] Define the top-level viewer surface hierarchy.
  - `Overview`
  - `Hitters`
  - `Pitchers`
  - `Roster Builder`
  - `Team View`

- [todo] Improve the landing experience.
  - make the first screen answer what the app does
  - show the top action paths faster
  - reduce the feeling of one long stacked dashboard

- [todo] Tighten summary cards and team panels around decisions.
  - what should I look at
  - who leads
  - what risk tradeoffs matter

## Next

These items should follow once the foundation and viewer shape are stronger.

### Comparison And Explanation

- [todo] Add side-by-side player comparison.
  - hitter vs hitter
  - pitcher vs pitcher

- [todo] Add a score explanation panel.
  - prior contribution
  - in-season contribution
  - playing-time effect
  - role effect

- [todo] Add roster swap delta views.
  - replace one hitter
  - replace one pitcher
  - show season-estimate change

- [todo] Add clearer team-level views.
  - top roster strengths
  - top weaknesses
  - position scarcity or role-balance flags

### Operations

- [todo] Add publish-ready build guidance.
  - local static hosting
  - publish folder expectations
  - update cadence

- [todo] Add stale-data checks.
  - last refresh time
  - missing game ranges
  - export mismatch warnings

## Later

These are valuable, but should not outrun product clarity.

### Deeper Product Features

- [todo] Add saved roster scenarios
- [todo] Add compare-against-team baseline mode
- [todo] Add trade package evaluation workflow
- [todo] Add historical trend views where they support current decisions
- [todo] Add richer charting once comparison workflows are already strong

### Platform Expansion

- [todo] Add a real app shell if the static viewer proves stable
- [todo] Add authenticated sharing or private publishing if external usage grows
- [todo] Add API-backed delivery only after the static product contract is mature

## Recommended Order For The Next Three Work Cycles

### Cycle 1

- document the refresh workflow
- add export glossaries
- audit naming and validation gaps

### Cycle 2

- split `viewer/main.js`
- establish viewer surface hierarchy
- tighten the first-screen workflow

### Cycle 3

- add comparison views
- add score explanations
- add roster delta feedback
