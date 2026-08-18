# Sprint AW-2 — Shared Workspace Data Layer

## Objective
Create one versioned, read-only workspace adapter that converts existing CoverageFit Home report and Property Intelligence data into a stable internal contract for the Agent Workspace and future workspace features.

## Baseline Confirmation
- Input repository version: `3.11.0`.
- `SPRINT-AW-1.md` and `AW1_QA.json` were present.
- `/agent/workspace/` was functional and directly read `coveragefit_home_report` plus Property Intelligence data.
- Customer assessment, Protection Score, recommendation, report, attribution, and Property Intelligence engines were intact.

## Files Modified
- `agent/workspace/index.html`
- `assets/js/agent-workspace.js`
- `VERSION`
- `CHANGELOG.md`
- `ROADMAP.md`

## Files Added
- `assets/js/workspace-data.js`
- `SPRINT-AW-2.md`
- `AW2_QA.js`
- `AW2_QA.json`

## Implemented
- Added `window.CoverageFitWorkspaceData` as the single workspace data adapter.
- Added versioned adapter and output schema metadata.
- Centralized safe reading of the Home report and Property Intelligence profile.
- Normalized customer identity, assessment metadata, score, status, strengths, recommendations, property facts, attribution, and diagnostics.
- Added stable recommendation fields for future planner and checklist features, including title, priority, confidence, explanation, conversation starter, producer notes, evidence, and source metadata.
- Added a normalized property contract with confirmation status and quality metadata.
- Added explicit `ready` and `empty` workspace states.
- Added non-fatal diagnostics for missing score, customer name, recommendations, or property data.
- Added cross-tab data subscriptions for report and property storage changes.
- Refactored `agent-workspace.js` into a presentation-only renderer that consumes the shared adapter.
- Preserved AW-1 visual behavior and route.

## Planned, Not Implemented
- AW-3 Conversation Planner Engine.
- Agenda generation, topic sequencing, or conversation logic.
- Checklist, notes, print sheet, CRM, and multi-customer storage.

## Deferred Deliberately
- Changes to existing report payload generation.
- Migration of customer-facing report pages to the workspace adapter.
- Persistent workspace-owned customer records.
- Authentication or remote synchronization.

## Adapter Contract
`CoverageFitWorkspaceData.getSnapshot()` returns:
- schema and adapter versions
- product and workspace state
- source metadata
- normalized customer
- normalized assessment
- strengths
- normalized recommendations
- normalized property profile
- executive summary
- attribution
- diagnostics

The adapter is read-only. It does not alter assessment or Property Intelligence storage.

## Regression Notes
- No customer-facing HTML was modified.
- No assessment, scoring, recommendation, report, attribution, or Property Intelligence engine was modified.
- The workspace remains empty-state safe when local storage is missing or malformed.
- AW-1 presentation sections remain reachable and populated through the adapter.
- Adapter fixture tests cover populated, empty, malformed-score, property-confirmed, and clone-isolation behavior.

## Completion Standard
AW-2 is complete because the workspace has one implemented and wired data boundary, AW-1 consumes that boundary, the contract is versioned and tested, and protected customer-facing engines remain unchanged.
