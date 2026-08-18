# Sprint AW-3 — Conversation Planner Engine

## Objective
Create a deterministic internal planning engine that converts the AW-2 workspace snapshot into a structured consultation agenda for Dylan, without prematurely implementing the AW-4 timeline interface.

## Baseline Confirmation
- Input repository version: `3.11.1`.
- `SPRINT-AW-1.md`, `SPRINT-AW-2.md`, `AW1_QA.json`, and `AW2_QA.json` were present.
- `/agent/workspace/` consumed only `CoverageFitWorkspaceData`.
- The customer assessment, scoring, recommendation, report, attribution, and Property Intelligence engines were intact.

## Files Modified
- `agent/workspace/index.html`
- `assets/js/agent-workspace.js`
- `VERSION`
- `CHANGELOG.md`
- `ROADMAP.md`

## Files Added
- `assets/js/conversation-planner.js`
- `SPRINT-AW-3.md`
- `AW3_QA.js`
- `AW3_QA.json`

## Implemented
- Added `window.CoverageFitConversationPlanner` as a versioned, framework-free planning engine.
- Added `getPlan(snapshot, options)` as the stable AW-3 contract.
- Consumes only the normalized AW-2 workspace snapshot and does not read storage or raw report payloads.
- Generates five consultation phases: open and align, confirm facts, review priorities, connect the protection strategy, and agree on next steps.
- Orders recommendation topics by normalized priority, confidence, and original source order.
- Includes objectives, customer-facing prompts, internal coaching notes, evidence, source IDs, and estimated minutes.
- Adds explicit educational guardrails so recommendations remain discussion topics rather than binding product conclusions.
- Handles empty snapshots, missing recommendations, and absent Property Intelligence data safely.
- Loads the engine on `/agent/workspace/` and generates a plan whenever a ready workspace snapshot is rendered.
- Exposes the current plan as `window.CoverageFitAgentWorkspacePlan` and dispatches `coveragefit:conversation-plan-ready` for AW-4.
- Updates the existing workspace status line with plan topic count and estimated duration, while deliberately withholding timeline UI.

## Planned, Not Implemented
- AW-4 Conversation Timeline UI.
- Expand/collapse agenda sections, timeline navigation, or active-topic controls.
- Persistent consultation checklist, notes, or completed-topic state.

## Deferred Deliberately
- Changes to the recommendation engine or recommendation rules.
- Sales scripting that prescribes a specific product.
- CRM persistence, customer records, authentication, or remote synchronization.
- Product-specific branching beyond facts already present in the normalized recommendation topics.

## Planner Contract
`CoverageFitConversationPlanner.getPlan(snapshot)` returns:
- schema and planner versions
- ready or empty state
- customer and assessment context
- plan summary and estimated duration
- ordered sections and agenda items
- consolidated conversation questions
- educational guardrails
- non-fatal diagnostics

The planner is deterministic for the same normalized snapshot, except for its generated timestamp.

## Regression Notes
- No customer-facing HTML was modified.
- No assessment, scoring, recommendation, report, attribution, or Property Intelligence engine was modified.
- AW-1 presentation sections remain unchanged.
- AW-2 remains the only data source for the workspace.
- AW-3 does not write to local storage or mutate the workspace snapshot.
- Fixture tests cover empty, populated, priority ordering, topic limits, missing recommendations, missing property data, and repeatability.

## Completion Standard
AW-3 is complete because the planner is implemented, loaded, invoked through the workspace, exposed for AW-4, tested against representative fixtures, and leaves the customer-facing platform unchanged.
