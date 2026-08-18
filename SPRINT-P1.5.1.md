# P1.5.1 — Consultation Timeline Data Model

## Status
Production complete in v3.18.7.

## Runtime implementation
- Added `assets/js/print/models/timeline-model.js`.
- Maps the AW-4 conversation plan and AW-5 checklist state into one immutable printable timeline model.
- Normalizes sections, items, consultation status, timing, questions, guardrails, and source traceability.
- Derives reviewed/current/upcoming status without mutating the Print Model.
- Updated the Timeline section to consume the dedicated model.

## Deliberately deferred
- Timeline HTML rendering.
- Professional timeline layout.
- Report-shell integration beyond the existing composer path.
