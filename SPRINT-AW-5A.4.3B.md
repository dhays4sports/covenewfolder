# AW-5A.4.3B — Expanded Workspace Contract

## Goal
Expand the Consultation Checklist workspace contract without changing Workspace consumption or introducing new behavior.

## Implementation
- Expanded `CoverageFitConsultationChecklist.getWorkspaceState()` with:
  - `progress`
  - `currentPhase`
  - `remainingMinutes`
  - `plannerVersion`
- `progress` is sourced from the existing `getProgress()` getter.
- `remainingMinutes` is sourced from the existing `getRemainingMinutes()` getter.
- `currentPhase` exposes the checklist's existing `currentPhaseId` as a string.
- `plannerVersion` exposes the checklist's existing planner version.
- Deep-froze the returned workspace contract so nested snapshots are read-only.

## Exclusions
- No Agent Workspace consumption changes.
- No UI changes.
- No event system.
- No planner changes.
- No persistence changes.
- No customer-facing changes.

## Regression Notes
- Existing checklist APIs and return shapes remain available.
- Existing progress, reset, planner regeneration, and persistence behavior is unchanged.
