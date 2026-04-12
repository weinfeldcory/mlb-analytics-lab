# Busy March Madness 2027 Roadmap

## Product Standard

The 2027 version should be clean enough to trust on draft night, polished enough that participants prefer it over the spreadsheet, and structured enough that a new season can be launched without code edits.

For execution detail, see `PRODUCT_ROADMAP_MOBILE.md`.

## Design Standard

The visual direction should lean on Apple-like principles:

- strong hierarchy
- quiet surfaces
- restrained color
- spacious layout
- obvious primary actions
- progressive disclosure for advanced controls
- smooth but subtle motion

This does not mean copying Apple styling directly. It means using clarity, restraint, and precision as the default.

## Milestone 1: Foundation

Target:

- clean module boundaries
- stable backend contracts
- multi-season-capable persistence
- stronger tests

Deliverables:

- split `src/main.js` into view and utility modules
- document target architecture
- replace single-file JSON persistence with SQLite
- remove static-owner assumptions from scoring paths
- add request validation for API writes
- add season fixtures for tests

## Milestone 2: Experience

Target:

- modern shell
- focused navigation
- clearer commissioner workflow
- participant-friendly live views

Deliverables:

- redesign app shell around primary surfaces
- introduce `Overview`, `Draft Room`, `Standings`, and `Commissioner`
- improve mobile navigation and information density
- add a full-screen draft presentation mode
- restyle surfaces, tables, and controls with a calmer visual system

## Milestone 3: Tournament Operations

Target:

- direct live tournament operations through the app
- safer admin workflows
- public read-only consumption

Deliverables:

- direct game ingestion pipeline
- commissioner authentication
- public/read-only views
- audit log for manual corrections
- season rollover flow

## Non-Goals For Early 2027 Work

Avoid spending early cycles on:

- decorative animations
- overbuilt charting
- exotic probability widgets
- speculative multiplayer features

## Immediate Implementation Priorities

1. Clean up the frontend module structure.
2. Introduce a documented target architecture.
3. Make the backend season model capable of multi-season storage.
4. Redesign the app shell and draft workflow.
5. Add auth and direct ingestion after the data model is stable.
