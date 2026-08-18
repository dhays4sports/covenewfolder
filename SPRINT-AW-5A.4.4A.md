# AW-5A.4.4A — Event System Skeleton

## Goal
Introduce a centralized checklist lifecycle event contract without adding Agent Workspace listeners or changing visible UI behavior.

## Events
- `coveragefit:consultation-checklist-ready`
- `coveragefit:consultation-checklist-change`
- `coveragefit:consultation-checklist-reset`

## Event detail contract
Each event exposes an immutable detail object containing:

```js
{
  state,
  reason,
  version,
  timestamp
}
```

`state` is the immutable object returned by `getWorkspaceState()`.

## Implementation
- Added the frozen public `EVENTS` registry to the checklist engine.
- Added a guarded internal event dispatcher compatible with browser execution and non-browser regression tests.
- The engine emits `ready` after a ready checklist is generated or restored.
- Status mutations emit `change` after persistence completes.
- `reset`, `resetItem`, `resetPhase`, and `clear` emit `reset` after state mutation.
- Removed the Agent Workspace's duplicate checklist-ready dispatch.
- Kept the Workspace free of checklist event listeners.
- Consolidated reset methods inside the frozen engine API so the previously intended methods remain reliable.

## Scope boundaries
- No Workspace listeners.
- No event-driven rendering.
- No UI changes.
- No planner calculation changes.
- No customer-facing changes.

## Regression notes
- Workspace initialization still calls `restoreFromPlan(plan)` and then reads `getWorkspaceState()`.
- Persistence remains synchronous and completes before change/reset events are emitted.
- Existing checklist status, progress, reset, and workspace-contract behavior is preserved.
