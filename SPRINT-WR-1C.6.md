# WR-1C.6 — Regression Freeze & API Baseline

## Goal

Freeze the Agent Workspace public compatibility surface before AW-6 and later Workspace extensions.

## Completed

- Inventoried public Workspace modules, methods, constants, events, storage keys, schemas, diagnostics, and contract fields.
- Added a machine-readable baseline in `WR1C_API_BASELINE.json`.
- Added the human-readable compatibility contract in `WR1C_API_BASELINE.md`.
- Added automated baseline enforcement in `WR1C6_API_BASELINE_QA.js`.
- Defined patch, minor, major, and deprecation rules.
- Preserved all existing runtime behavior.

## Regression boundary

Future development must not remove or rename frozen members, alter existing event meanings, silently invalidate persistence, or mutate the immutable Workspace contract without an explicit major-version migration.

## Files changed

- `VERSION`
- `CHANGELOG.md`
- `ROADMAP.md`
- `QA.md`

## Files added

- `WR1C_API_BASELINE.json`
- `WR1C_API_BASELINE.md`
- `WR1C6_API_BASELINE_QA.js`
- `SPRINT-WR-1C.6.md`

## Runtime impact

None. This sprint adds certification, documentation, and regression enforcement only.
