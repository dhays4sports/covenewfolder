# WR-1C.6 API Baseline and Regression Freeze

## Certification scope

This document freezes the public Agent Workspace compatibility surface beginning with CoverageFit **v3.15.7**. Future development may extend these interfaces, but must not silently remove, rename, or reinterpret them.

The machine-readable source of truth is `WR1C_API_BASELINE.json`.

## Frozen public modules

### `CoverageFitWorkspaceData` v1.0.0

Frozen members:

- `VERSION`
- `SCHEMA_VERSION`
- `REPORT_KEY`
- `PROPERTY_KEY`
- `getSnapshot(options)`
- `subscribe(callback)`

Frozen storage keys:

- `coveragefit_home_report`
- `coveragefit_property_profile_v1`

Frozen lifecycle events:

- `coveragefit:workspace-data-ready`
- `coveragefit:workspace-data-refresh`

`subscribe()` must continue returning an unsubscribe function.

### `CoverageFitConversationPlanner` v1.0.0

Frozen members:

- `VERSION`
- `SCHEMA_VERSION`
- `getPlan(snapshot, options)`

Frozen ready event:

- `coveragefit:conversation-planner-ready`

Planner output may gain optional fields, but existing fields and phase semantics must remain readable by the checklist engine and Workspace.

### `CoverageFitConsultationChecklist` v0.5.0

Frozen constants:

- `SCHEMA_VERSION = 1.0`
- `STORAGE_SCHEMA_VERSION = 1.0`
- `STORAGE_PREFIX = coveragefit.workspace.checklist`
- Status values: `pending`, `active`, `complete`

Frozen events:

- `coveragefit:consultation-checklist-engine-ready`
- `coveragefit:consultation-checklist-ready`
- `coveragefit:consultation-checklist-change`
- `coveragefit:consultation-checklist-reset`

Frozen mutation and query surface:

- Creation: `createEmpty`, `createItem`, `generateFromPlan`, `restoreFromPlan`
- Persistence: `save`, `clear`, `getStorageKey`
- Mutation: `setStatus`, `activate`, `complete`, `reopen`, `reset`, `resetItem`, `resetPhase`
- Validation and diagnostics: `validateItem`, `validateChecklist`, `diagnostics`
- Read models: `getSnapshot`, `getSummary`, `getProgress`, `getRemainingMinutes`, `getWorkspaceState`

Frozen Workspace contract fields:

```js
{
  checklist,
  summary,
  diagnostics,
  progress,
  currentPhase,
  remainingMinutes,
  plannerVersion,
  version
}
```

The returned Workspace contract must remain deeply immutable.

### `CoverageFitWorkspaceMotion` v0.2.0

Frozen members:

- `prefersReducedMotion`
- `getDuration`
- `nextFrame`
- `wait`
- `onPreferenceChange`
- `cancelClassCleanup`
- `scheduleClassCleanup`
- `restartClass`

Reduced-motion behavior remains a compatibility requirement, not an optional visual preference.

### Workspace diagnostics

`CoverageFitAgentWorkspacePerformance` v1.0.0 freezes:

- `getSnapshot()`
- `reset()`

`CoverageFitAgentWorkspaceLifecycle` v1.0.0 freezes:

- `getSnapshot()`
- `teardown()`

Lifecycle snapshot fields frozen for compatibility:

- `disposed`
- `listeners`
- `subscriptions`
- `teardowns`
- `pendingTimers`

## Persistence compatibility

The checklist persistence schema is frozen at `1.0`. Any incompatible change requires one of the following:

1. A migration that safely upgrades existing records.
2. A new storage schema version with explicit compatibility handling.
3. A documented major-version release.

Saved checklist state must never be interpreted under an incompatible plan fingerprint or checklist identity.

## Event compatibility

Existing event names are permanent within the v3.x line. Event payloads may gain optional fields, but existing fields cannot be removed or change meaning without a major version.

The checklist engine remains the sole authority for checklist state. Workspace UI code may project state but may not create a second mutable source of truth.

## Render-signature compatibility

Render signatures are internal optimization details. Their exact string format is not public. The frozen behavior is:

- Unchanged checklist, timeline, property, and recommendation surfaces may skip DOM replacement.
- A full Workspace refresh must invalidate signatures and rebuild from current source data.
- Optimization must not suppress required visual, focus, accessibility, or event updates.

## Versioning policy

- **Patch:** defect fixes only; no removals, renames, or schema incompatibility.
- **Minor:** additive optional fields, methods, and events are allowed.
- **Major:** required for breaking API, event, persistence, or required-field changes.
- **Deprecation:** document first, retain for at least one minor release, and provide a replacement path.

## Freeze result

The public compatibility baseline is certified and protected by `WR1C6_API_BASELINE_QA.js`. Future sprints must keep that suite green or intentionally introduce and document a major-version migration.
