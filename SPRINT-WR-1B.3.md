# WR-1B.3 — Empty & Error States

## Goal
Make every Workspace failure or missing-data condition intentional, understandable, and recoverable.

## Implemented
- Distinct no-assessment and data-adapter failure pages
- Missing Property Intelligence state
- Missing recommendation state
- Planner unavailable recovery state
- Checklist empty/error retry controls
- Storage-unavailable warning
- Shared responsive state styling and accessible semantics

## Non-goals
- No planner, checklist, persistence, recommendation, or customer-facing logic changes
- No automatic data repair

## Regression
Run `node RUN_REGRESSION_SUITE.js`.
