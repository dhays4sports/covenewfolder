# TX-1.1 — Transition Route & State Management

## Goal
Insert a production-ready CoverageFit transition step into existing 408FARMERS handoffs without changing direct-visitor behavior or exposing transferred personal information in the visible URL.

## Delivered
- Added the reachable `/transition/` route.
- Routed incoming CoverageFit prefill handoffs through the transition after the existing prospect profile is normalized and stored.
- Preserved the original destination so `/home/`, `/assessment/`, and campaign entry flows continue where they previously would have opened.
- Updated `/campaign/` to enter the transition while preserving its existing assessment destination.
- Stored transition state in `sessionStorage` under `coveragefit_transition_v1`.
- Removed contact, property, handoff, and destination markers from the visible URL before transition completion.
- Added safe refresh, missing-session, reduced-motion, manual-continue, and same-origin destination handling.
- Used `location.replace()` on entry and exit to avoid adding a redirect loop to browser history.

## Deferred
- Premium visual treatment is TX-1.2.
- Staged intelligent progress timeline is TX-1.3.
- Reason-specific copy and property confirmation are TX-1.4 and TX-1.5.
