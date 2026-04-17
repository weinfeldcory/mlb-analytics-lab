# Baseball Analytics App Product Roadmap

## Purpose

Define the next product phase for the baseball analytics app based on the current codebase as of 2026-04-15.

This roadmap is intended to stay grounded in what already exists in the project:

- documented local refresh workflow in `README.md`
- documented viewer export contract in `EXPORT_FIELD_GLOSSARY.md`
- modular viewer code under `viewer/modules/`
- working hitter board, pitcher board, and roster builder using 2026 viewer exports

The roadmap should now focus less on basic product framing and more on making the app easier to trust, compare, validate, and share.

## Product Standard

The next major version of this project should be:

- reliable enough that refreshes can be rerun without guessing which scripts or files matter
- inspectable enough that users can explain a player ranking without reading SQL by hand
- decision-oriented enough that comparison and roster-swap questions are first-class workflows
- operational enough that stale exports or broken contracts are caught before the viewer is shared
- publishable enough that the static viewer can be handed off without a custom walkthrough

## Current Status Snapshot

The project has already cleared several foundation milestones:

- the refresh workflow is documented in `README.md`
- the hitter and pitcher export contract is documented in `EXPORT_FIELD_GLOSSARY.md`
- `viewer/main.js` has already been reduced to a thin entrypoint and the viewer is split across focused modules
- the landing experience now centers the roster builder and season estimate rather than only a long raw table
- hitter and pitcher exports both support traceable prior/current blend logic and team-building fields

That changes the roadmap materially. The main product risk is no longer "can this project be organized?" It is now:

- the app still relies on table scanning for most comparison decisions
- explanation lives mostly in labels and docs rather than in-product reasoning surfaces
- export validation and publish operations are still implicit
- artifact naming still mixes preseason-style and in-season-style outputs in ways that will get messier with each season

## In-Flight Build Read

The current worktree has already started moving on the first product cycle:

- hitter and pitcher boards now include dedicated comparison panels with two-slot selection flows
- comparison state is already persisted locally, which removes one major trust and usability gap
- board controls now support decision vs projection views, row limits, and reset actions
- reading-guide surfaces have started to turn filtered slices into product language rather than raw table state

That means the remaining Cycle 1 gap is narrower than the roadmap previously implied:

- comparison exists, but still needs a stronger explanation layer for why scores move
- comparison surfaces still need final polish around delta language, hierarchy, and trust cues
- roster-swap and team-shape decision outputs remain the next major product unlock after explanation lands

## Exit Criteria

The next product bar is met when all of the following are true:

- a user can compare two or more hitters or pitchers directly in the viewer
- the viewer explains why a player scores high or low using the existing trace fields
- roster swaps expose their impact on season estimate and team-shape outputs
- export refreshes fail loudly when required fields or output files are missing
- the project has one documented publish path for a static viewer bundle
- season naming and artifact naming are consistent enough to support 2027 work without ambiguity

## Strategy

The work should now happen in this order:

1. Add comparison and explanation workflows on top of the existing data contract.
2. Strengthen roster decision support so the product is centered on team construction, not list browsing.
3. Add validation and publishing guardrails before expanding the model surface area again.
4. Only then widen the product into additional scenarios such as trade packages, baselines, and historical views.

This order matters because the current project already has enough signal and structure to be useful. The constraint is not lack of metrics. The constraint is turning existing model outputs into faster, more defensible decisions.

## Workstreams

### Workstream 1: Comparison And Explanation

Outcome:

- the viewer supports real player decisions instead of manual cross-scanning

Required outcomes:

- add side-by-side hitter comparison
- add side-by-side pitcher comparison
- add a score explanation surface using existing prior, blend, role, and reliability fields
- show the contribution of prior signal, current signal, playing time, and role assumptions in product language
- allow comparison state to survive refreshes or be shareable via URL state when practical

Evidence of completion:

- a user can compare alternatives without scanning multiple distant rows
- the viewer can answer "why is this player here?" in the product itself
- comparison and explanation become the fastest path to trust

### Workstream 2: Team-Building Decision Support

Outcome:

- roster construction becomes the center of the product rather than an adjacent feature

Required outcomes:

- add swap-in and swap-out delta views for hitters and pitchers
- expose how a roster move changes runs scored, runs allowed, wins, and role balance
- improve feedback when roster slots are hard to fill or structurally unbalanced
- surface team strengths, weaknesses, and scarcity flags from the selected roster
- clarify which player attributes matter most for each slot type

Evidence of completion:

- users can understand the impact of a roster move in one pass
- the season estimate reads as a decision output, not just a calculation
- the roster builder becomes the default workflow for answering "what should this team look like?"

### Workstream 3: Validation And Operations

Outcome:

- refreshes and publishes are safer and easier to trust

Required outcomes:

- add lightweight export validation for required fields, non-empty outputs, and expected viewer files
- add stale-data checks around live game windows and export timestamps
- define one publish-ready static bundle workflow
- separate local dev artifacts from publish artifacts
- document preseason vs in-season refresh cadence and expectations

Evidence of completion:

- broken refreshes are detected before the viewer is opened
- stale exports are visible before sharing
- publishing the viewer is routine rather than custom

### Workstream 4: Season And Artifact Management

Outcome:

- the project can evolve across seasons without naming drift or contract confusion

Required outcomes:

- define file naming rules for preseason projections, in-season blends, and viewer-ready bundles
- standardize year references across scripts, exports, and docs
- clarify which outputs are canonical product files versus exploratory artifacts
- prepare the workflow so a 2027 rollover is mechanical rather than interpretive

Evidence of completion:

- a new season can be added without duplicating ambiguous naming patterns
- core artifacts are easy to identify from the file tree
- product contracts survive year-over-year evolution

## Recommended Delivery Sequence

### Cycle 1

Focus:

- finish hitter and pitcher comparison so the current scaffolding becomes a stable product surface
- add the score explanation surface on top of the existing trace fields
- finish the first pass at comparison-oriented information architecture already underway in the boards

Success gate:

- the app can justify and compare player rankings from the UI alone

### Cycle 2

Focus:

- roster swap deltas
- stronger team-level interpretation
- slot-fit and role-balance feedback

Success gate:

- roster construction clearly becomes the primary product workflow

### Cycle 3

Focus:

- export validation
- stale-data checks
- publish path and operations runbook

Success gate:

- the app is safer to refresh and easier to share

### Cycle 4

Focus:

- season naming cleanup
- artifact taxonomy
- 2027 rollover readiness

Success gate:

- the project can add new seasons without product-contract ambiguity

## Design Standard

The viewer should continue to feel like a compact internal baseball decision board:

- strong task hierarchy
- compact high-signal summaries
- explanation close to rankings and roster choices
- comparison surfaces that minimize eye travel
- traceability without exposing raw implementation clutter

This should not drift back toward a long stacked dashboard or a metrics scrapbook.

## Non-Goals For The Next Cycles

Do not prioritize the following before the current roadmap is complete:

- adding many more model outputs without explanation surfaces
- heavy chart expansion that does not support a concrete decision task
- native-app ambitions before the static product is operationally stable
- deeper ML experimentation that weakens inspectability
- broad historical backfills that distract from the 2026 and 2027 product workflow

## Immediate Priority

The highest-value immediate focus is:

1. finish the in-flight comparison cycle by adding explanation and polishing comparison trust cues
2. move directly into roster swap deltas and team decision feedback
3. add export validation and a real publish path before widening the product surface

Those are the missing pieces between a strong local analyst tool and a product that can be trusted and shared.
