# Baseball Analytics App Product Roadmap

## Purpose

Define the product direction for the baseball analytics app and the sequence required to move it from a strong local analyst tool to a clearer decision product.

This file is the planning bridge between:

- `README.md` for current project setup and workflow
- `BACKLOG.md` for execution-level work
- the current Python/SQL/viewer implementation for what already exists

## Product Standard

The next major version of this project should be:

- reliable enough that a full refresh from raw pulls to viewer export can be run without manual spelunking
- inspectable enough that every displayed score can be traced back to blend inputs and role assumptions
- clear enough that the viewer helps answer baseball decisions rather than feeling like a dense analyst sandbox
- broad enough to compare hitters, pitchers, teams, and full roster builds inside one coherent workflow
- current enough that in-season refreshes and preseason baseline refreshes follow one predictable operating model
- publishable enough that the app can be shared beyond the local machine without ad hoc setup steps

## Exit Criteria

The product bar is met when all of the following are true:

- data refresh is documented and reproducible from pulls through export
- hitter and pitcher outputs follow a stable export contract with explicit field definitions
- the viewer supports a clear decision workflow for ranking players, comparing alternatives, and building a roster
- the app exposes enough provenance to explain why a player is high or low without reading SQL by hand
- team-level and roster-level outputs are easy to interpret without knowing the implementation details
- the project can be run locally and published in a repeatable way
- the codebase is modular enough that new model work does not require editing one giant viewer script

## Current Product Read

The project already has meaningful product value:

- strong local data workflow using `pybaseball`, DuckDB, pandas, and SQL
- traceable hitter and pitcher exports with preseason and in-season blend logic
- a working viewer that supports player ranking, filtering, and roster construction
- team-level season estimation from selected hitters and pitchers

The biggest gaps are product-shape gaps rather than idea gaps:

- the project behaves like an internal lab tool more than a finished analytics product
- the viewer is concentrated in a large `viewer/main.js` file
- the app has no documented product surface hierarchy beyond the current page layout
- export contracts and refresh flows are implied by code, not documented as product primitives
- there is no clear publishing path for sharing the work beyond local static hosting

## Strategy

The work should happen in this order:

1. Stabilize the data product contract before expanding the surface area.
2. Improve the viewer information architecture before adding more metrics.
3. Add comparison and explanation workflows before adding more speculative model complexity.
4. Make publishing and recurring refreshes easy once the local product shape is stable.

This order matters. More metrics, more charts, and more model variants will increase complexity faster than value if the export contract and user workflow remain loose.

## Workstreams

### Workstream 1: Data Product Foundation

Outcome:

- the analytics outputs behave like stable product data, not just ad hoc exports

Required outcomes:

- document the refresh pipeline from pulls to modeling tables to JSON exports
- define the canonical hitter and pitcher export fields and their meanings
- make trace and blend fields first-class documented product outputs
- align season naming and file naming so yearly refreshes are obvious
- reduce hidden assumptions in scripts and SQL execution order

Evidence of completion:

- a new refresh can be run from the docs without reading source code first
- hitter and pitcher exports each have a documented schema and glossary
- downstream viewer logic depends on stable field contracts rather than incidental field presence

### Workstream 2: Viewer Productization

Outcome:

- the viewer feels like a baseball decision board instead of a raw analytics page

Required outcomes:

- redesign the page around explicit user tasks such as `Rank`, `Compare`, `Build Roster`, and `Assess Team`
- shorten the cognitive path from landing to useful answer
- make summary cards and team views more decision-oriented
- break `viewer/main.js` into smaller modules by data loading, state, rendering, and roster logic
- tighten the visual hierarchy so the primary workflow is obvious on desktop and usable on laptop screens

Evidence of completion:

- a user can answer top-level questions without scanning a giant table first
- the viewer code is no longer centered in one large file
- the roster builder, hitter board, and pitcher board feel like connected surfaces rather than stacked sections

### Workstream 3: Comparison And Explanation

Outcome:

- the app supports actual baseball choices, not just rankings

Required outcomes:

- add player-to-player comparison views
- add explanation panels for why a score moved up or down
- expose prior vs current signal contribution more clearly
- show tradeoff lenses such as floor vs upside, role fit, and playing-time risk
- add saved or shareable comparison states where practical

Evidence of completion:

- users can compare two or more players without manual cross-scanning
- the app explains score construction in product language
- roster-fit decisions are easier to defend from the UI alone

### Workstream 4: Team Building And Scenario Analysis

Outcome:

- team construction becomes a stronger product pillar than isolated player browsing

Required outcomes:

- improve roster slot logic and selection feedback
- add team templates or baseline roster assumptions
- support what-if swaps and delta views for roster changes
- make team-level season outputs easier to interpret
- add clearer guardrails around position balance and pitching role balance

Evidence of completion:

- a user can understand the impact of roster swaps quickly
- team-level outputs read as decisions, not just aggregate math
- roster construction becomes the product's defining workflow

### Workstream 5: Publishing And Operations

Outcome:

- the app can be refreshed and shared consistently

Required outcomes:

- define the local runbook and recurring refresh cadence
- add a lightweight publish path for the static viewer and data bundle
- separate development artifacts from publish-ready artifacts
- add validation checks for missing data, stale exports, and broken field assumptions
- document how and when to refresh preseason vs in-season outputs

Evidence of completion:

- there is one documented path to publish the viewer
- stale or incomplete exports are detectable before publish
- the app can be shared without custom explanation every time

## Recommended Delivery Sequence

### Cycle 1

Focus:

- roadmap and backlog grounding
- export contract documentation
- refresh workflow documentation
- identify viewer surface priorities

Success gate:

- the project has a clear product direction and the data contract is documented

### Cycle 2

Focus:

- modularize `viewer/main.js`
- tighten page hierarchy
- improve summary and team panels

Success gate:

- the viewer is easier to extend and easier to read

### Cycle 3

Focus:

- player comparison workflow
- score explanation surface
- better roster feedback

Success gate:

- the app supports real comparison decisions instead of table scanning alone

### Cycle 4

Focus:

- what-if roster changes
- team scenario outputs
- team-building UX refinement

Success gate:

- roster construction is clearly the center of the product

### Cycle 5

Focus:

- publish path
- validation checks
- refresh cadence and operations

Success gate:

- the app can be maintained and shared without ad hoc recovery steps

## Design Standard

The viewer should follow these principles:

- clear task hierarchy
- strong information density without visual clutter
- obvious primary actions
- explanation near the decision, not buried in docs
- compact comparison surfaces
- traceability without requiring SQL fluency

This should feel like a sharp internal baseball front-office tool, not a generic dashboard and not a decorative consumer app.

## Non-Goals For The Next Cycles

Do not spend early cycles on:

- decorative chart sprawl
- unsupported mobile-native ambitions
- adding more metrics before making current metrics easier to use
- speculative ML complexity that weakens traceability
- backfilling every historical season before the 2026 product workflow is solid

## Immediate Priority

The highest-value immediate focus is:

1. define the export contract and refresh workflow
2. modularize the viewer and improve the decision workflow

Those two efforts unlock everything else without increasing product chaos.
