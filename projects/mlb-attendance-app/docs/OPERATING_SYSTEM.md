# Witnessed Operating System

Last updated: 2026-05-02

This document defines the minimum product/engineering operating system for Witnessed as it moves through private beta.

## Purpose

The goal is not to add process. The goal is to keep execution fast while making sure:

- the roadmap stays honest
- shipped work is reflected in docs
- the next high-leverage tickets are always ready
- live beta issues do not get buried in roadmap language

## Source Of Truth By Layer

Use one document for one job.

### Vision / Product Sequence

- [PRODUCT_ROADMAP_MOBILE.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/PRODUCT_ROADMAP_MOBILE.md)

Use for:

- release sequencing
- major product bets
- current product baseline
- what is `Shipped`, `Foundation Shipped`, `Active`, `Next`, or `Later`

### Page-Level Product Direction

- [PAGE_ROADMAPS.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/PAGE_ROADMAPS.md)
- [PAGE_BACKLOG.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/PAGE_BACKLOG.md)

Use for:

- screen-by-screen direction
- page-specific execution order

### Tactical Execution Backlog

- [BETA_TICKET_BACKLOG.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/docs/BETA_TICKET_BACKLOG.md)

Use for:

- the next 2 weeks of actual implementation work
- the standing next 3 highest-leverage tickets
- cross-cutting workstreams

### Durable Decisions

- `docs/rfcs/`

Use for:

- data model decisions
- identity decisions
- storage/sync/policy boundaries

### Live Beta Tracking

- [BETA_CHANGELOG.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/docs/BETA_CHANGELOG.md)
- [KNOWN_ISSUES.md](/Users/coryweinfeld/mlb-analytics-lab/projects/mlb-attendance-app/docs/KNOWN_ISSUES.md)

Use for:

- what changed for testers
- what is currently broken, risky, or degraded

## Status Language

Use these statuses consistently across roadmap and backlog docs:

- `Shipped`
- `Foundation Shipped`
- `Active`
- `Next`
- `Later`

Rules:

- `Shipped` means a real user can use it now.
- `Foundation Shipped` means the core exists, but polish or expansion is still needed.
- `Active` means this is the current primary build arc.
- `Next` means it should follow the active arc if priorities hold.
- `Later` means important, but not the best current use of effort.

## Workflow After Shipping Meaningful Work

After a meaningful product push:

1. Update shipped state in the roadmap/backlog docs.
2. Move stale “in progress” items into `Shipped` or `Foundation Shipped`.
3. Refresh the standing next 3 queue in the beta backlog.
4. Add tester-visible changes to `BETA_CHANGELOG.md`.
5. Add or update operational risks in `KNOWN_ISSUES.md`.

## Ticket Writing Standard

Prefer tickets that include:

- a clear goal
- a narrow implementation slice
- concrete tasks
- short acceptance criteria

Avoid large vague tickets like “improve stats” or “make history better.”

## Sequencing Principle

Default priority order:

1. trust and recovery
2. core capture flow
3. first-run clarity
4. retention/return-value surfaces
5. social expansion
6. deeper collections and expansion

## Recommended Operating Cadence

- After every meaningful product push: run the roadmap/backlog refresh workflow.
- Before widening beta: review `KNOWN_ISSUES.md`, `security-audit.md`, and `account-isolation-qa.md`.
- Before starting a new feature arc: confirm the standing next 3 still reflects the highest-leverage work.

## Tooling

Use the local `roadmap-update` skill to run the roadmap/backlog maintenance workflow after meaningful shipping work. The skill should reconcile what shipped, update roadmap status, and keep the next-ticket queue ready.
