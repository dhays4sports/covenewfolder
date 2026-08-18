# WR-1B.4.1 — Motion Foundation

## Goal

Establish a reusable, accessible motion foundation before applying animations to individual Workspace components.

## Implemented

- Added instant, fast, normal, and slow duration tokens.
- Added standard, emphasized, and exit easing tokens.
- Added opt-in fade, slide-up, scale, collapse, and surface-transition utilities.
- Added `CoverageFitWorkspaceMotion` as a frozen public helper.
- Added reduced-motion detection and preference-change subscriptions.
- Added safe frame scheduling and duration waiting helpers.
- Added global `prefers-reduced-motion` CSS safeguards.

## Guardrails

- No checklist animation was introduced.
- No timeline or progress animation was introduced.
- No loading, card, sidebar, or dialog animation was introduced.
- No engine, persistence, planner, event, or customer-facing behavior changed.

## Regression Notes

Run `node RUN_REGRESSION_SUITE.js`. The dedicated suite is `WR1B4_1_QA.js`.
