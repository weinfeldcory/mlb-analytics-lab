# Baseball Analytics App Backlog

## How To Use This File

This backlog translates the current roadmap into executable work.

Rules:

- `Now` means active priority for the next few development cycles.
- `Next` means important follow-up once the active comparison and roster work lands.
- `Later` means intentionally deferred.
- each ticket should stay small enough to finish without mixing unrelated concerns

Status labels:

- `[todo]`
- `[doing]`
- `[blocked]`
- `[done]`

## Completed Foundations

These roadmap items are already in place and should not be treated as open work unless they regress.

- [done] Document the refresh pipeline in `README.md`.
- [done] Add a viewer-facing hitter and pitcher field glossary in `EXPORT_FIELD_GLOSSARY.md`.
- [done] Split the viewer out of one giant `viewer/main.js` entrypoint into modules.
- [done] Recenter the landing experience around roster construction and season estimate.
- [done] Tighten summary cards and team panels enough to support top-level scanning.
- [done] Add board-level controls for stat views, row limits, and filter resets.
- [done] Add first-pass reading guides so filtered board slices explain themselves in product language.

## Now

These are the highest-value next steps for turning the current project into a stronger decision product.

### Comparison And Explanation

- [doing] Add side-by-side hitter comparison.
  - pick two hitters from the board
  - compare team-build, talent, PT, upside, floor, and projection outputs
  - keep the comparison visible without losing table context
  - current status: compare slots and board actions are in place; remaining work is trust cues and explanation polish

- [doing] Add side-by-side pitcher comparison.
  - pick two pitchers from the board
  - compare run prevention, pitch quality, PT, role, and projection outputs
  - make role differences obvious
  - current status: compare slots and board actions are in place; remaining work is role contrast and explanation polish

- [done] Add a score explanation panel.
  - explain prior contribution
  - explain current-season contribution
  - explain playing-time effect
  - explain role and reliability effects
  - explanation now lives directly inside the hitter and pitcher comparison surfaces

- [done] Add comparison state persistence.
  - local persistence is wired through comparison storage
  - URL state can stay as a later enhancement if sharing becomes the stronger need

### Team-Building Decision Support

- [todo] Add roster swap delta views.
  - replace one hitter
  - replace one pitcher
  - show change in runs scored, runs allowed, and wins

- [todo] Add roster-balance feedback.
  - identify thin positions
  - identify overloaded bench or role mixes
  - identify weak rotation or bullpen structure

- [todo] Add selected-roster strengths and weaknesses summary.
  - best traits
  - biggest risks
  - scarcity or fragility flags

## Next

These items should follow once comparison and roster-decision workflows are live.

### Validation And Operations

- [todo] Add lightweight export validation.
  - required fields present
  - no empty datasets
  - viewer JSON written successfully
  - hitter and pitcher file versions align

- [todo] Add stale-data checks.
  - last refresh timestamp
  - missing live game windows
  - export mismatch warnings

- [todo] Add publish-ready build guidance.
  - static hosting path
  - publish folder expectations
  - update cadence

- [todo] Separate publish artifacts from development artifacts.
  - define canonical viewer bundle
  - clarify which processed files are product outputs

### Season And Artifact Management

- [todo] Audit filename and season naming consistency.
  - clarify `projection_engine` vs `projection_vs_current`
  - clarify preseason vs in-season artifacts
  - make yearly rollover easier

- [todo] Define canonical product artifacts for each season.
  - local modeling outputs
  - processed exports
  - viewer-ready exports

## Later

These are valuable, but should not outrun decision clarity and operational trust.

### Deeper Product Features

- [todo] Add saved roster scenarios
- [todo] Add compare-against-team baseline mode
- [todo] Add trade package evaluation workflow
- [todo] Add historical trend views where they support a current decision
- [todo] Add richer charting once comparison workflows are already strong

### Platform Expansion

- [todo] Add a fuller app shell only if the static viewer proves operationally stable
- [todo] Add authenticated sharing only if external usage grows
- [todo] Add API-backed delivery only after the static product contract is mature

## Recommended Order For The Next Three Work Cycles

### Cycle 1

- finish hitter comparison
- finish pitcher comparison
- add score explanations

### Cycle 2

- add roster swap deltas
- add roster-balance feedback
- add strengths and weaknesses summary

### Cycle 3

- add export validation
- add stale-data checks
- add publish workflow guidance
