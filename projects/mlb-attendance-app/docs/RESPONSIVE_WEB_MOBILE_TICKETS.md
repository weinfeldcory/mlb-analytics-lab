# Responsive Web And Mobile Browser Ticket Stack

Last updated: 2026-05-02

This ticket stack is for making the MLB Attendance App render cleanly in:

- smaller desktop browser windows
- tablet widths
- phone-sized mobile browsers

The goal is not just “make it fit.” The goal is to make the product condense intentionally so it still feels readable, tappable, and premium at narrow widths.

## Principles

- Mobile web is a real product surface, not a fallback.
- Dense baseball data should reflow, not just shrink.
- Important actions must stay visible without overlapping browser chrome.
- Cards, spacing, and typography should condense in steps, not collapse all at once.

## Recommended Ticket Order

1. responsive foundation
2. shell and global navigation
3. core loop surfaces
4. dense data surfaces
5. QA and regression protection

## Ticket R1: Define Responsive Breakpoints And Condensing Rules

### Goal

Create one consistent responsive system for the app instead of ad hoc per-screen layout decisions.

### Tasks

- Define core viewport bands:
  - phone
  - large phone / small tablet
  - tablet
  - desktop
  - wide desktop
- Define what changes at each band:
  - page padding
  - card padding
  - typography scale
  - grid column count
  - nav mode
  - sticky action behavior
- Centralize these rules in shared layout utilities or tokens where practical.

### Acceptance Criteria

- The app has explicit responsive rules.
- New screens can follow the same breakpoint system.
- No major screen relies on one-off width hacks as the primary strategy.

## Ticket R2: Redesign The Global Shell For Narrow Browser Widths

### Goal

Make the global shell condense gracefully as the browser narrows.

### Tasks

- Audit top nav, account status area, and page header behavior across widths.
- Prevent:
  - nav wrap chaos
  - clipped brand/header content
  - status pills forcing overflow
- Implement responsive shell modes:
  - desktop top nav
  - compact tablet header
  - mobile sticky/bottom nav
- Ensure active state stays obvious at every size.

### Acceptance Criteria

- The shell never looks broken or overpacked on smaller windows.
- Navigation remains readable and tappable.
- Page content gains vertical space instead of losing it to oversized chrome.

## Ticket R3: Make Home Fully Readable On Mobile Browser

### Goal

Ensure Home feels intentional and proportional on a phone-sized browser.

### Tasks

- Reflow the hero into a clean vertical stack on narrow screens.
- Ensure:
  - CTAs do not wrap awkwardly
  - metric cards stay legible
  - friend/social modules do not dominate
  - attendance heat map remains interpretable or degrades gracefully
- Reduce above-the-fold density on narrow screens.

### Acceptance Criteria

- Home is readable without pinch-zoom.
- The next action is obvious on phone-sized web.
- No hero/module content overlaps or compresses into illegibility.

## Ticket R4: Make Log Game A True Mobile Browser Capture Flow

### Goal

Make logging a game easy on a phone browser, not just on desktop web.

### Tasks

- Stack the guided steps cleanly for narrow widths.
- Add responsive treatment for:
  - large search bar
  - chip rows
  - selected-game preview
  - sticky continue/save bar
- Ensure result cards remain scannable without horizontal squeeze.
- Prevent the keyboard from obscuring the primary action where feasible.

### Acceptance Criteria

- A user can log a game comfortably on a mobile browser.
- Search, selection, and save all remain visible and understandable.
- Sticky actions do not conflict with browser chrome.

## Ticket R5: Make Recap And Logged-Game Detail Feel Native On Mobile Web

### Goal

Ensure post-save surfaces feel polished on phone screens.

### Tasks

- Reflow recap hero, stat cards, and CTAs for narrow widths.
- Reflow logged-game detail sections:
  - top hero
  - memory layer
  - line score
  - hitters/pitchers
  - actions
- Ensure line score and player modules degrade gracefully when width is tight.

### Acceptance Criteria

- Recap still feels rewarding on a phone browser.
- Logged-game detail remains revisitable and readable on mobile web.
- No dense box-score section becomes unusable at narrow widths.

## Ticket R6: Add Responsive Strategy For Stats And History Density

### Goal

Prevent the dense data screens from becoming unusable on smaller windows and mobile browsers.

### Tasks

- Audit Stats and History at narrow widths.
- Decide when to:
  - stack cards
  - collapse columns
  - use segmented views
  - allow safe horizontal scroll
- Ensure filters and controls do not crowd the first screen.

### Acceptance Criteria

- Stats and History remain usable below desktop widths.
- Data is still readable and actionable.
- The screens do not rely on tiny text to preserve layout.

## Ticket R7: Safe-Area, Viewport, And Browser Chrome Hardening

### Goal

Make the app reliable in real mobile browsers with notches, browser bars, and viewport shifts.

### Tasks

- Audit sticky bottom nav and sticky actions against mobile browser chrome.
- Add safe-area padding where needed.
- Test Safari and Chrome mobile browser viewport behavior.
- Ensure modals/CTAs are not hidden behind bottom browser controls.

### Acceptance Criteria

- Bottom actions remain accessible on mobile browsers.
- The app respects safe areas.
- Browser chrome does not hide critical UI.

## Ticket R8: Responsive QA Baseline

### Goal

Create a repeatable manual QA pass for viewport quality.

### Tasks

- Define baseline widths to test:
  - 390
  - 430
  - 768
  - 1024
  - 1280
- Define which screens must be checked at each width.
- Document the pass in a lightweight checklist.

### Acceptance Criteria

- Responsive regressions are easier to catch before release.
- The app has a repeatable viewport QA routine.

## Suggested Immediate Sprint

If you want a practical first responsive sprint:

1. `R1` Define responsive breakpoints and condensing rules
2. `R2` Redesign the global shell for narrow browser widths
3. `R3` Make Home fully readable on mobile browser
4. `R4` Make Log Game a true mobile browser capture flow

That sequence improves the most visible user pain first and creates the foundation for the denser pages afterward.
