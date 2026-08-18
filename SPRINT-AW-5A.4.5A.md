# AW-5A.4.5A — Diagnostics Expansion

## Goal
Expand the Consultation Checklist diagnostics contract with stable engine, planner, checklist, persistence, generation, and integrity metadata.

## Implementation
- Added `engineVersion`.
- Added `plannerFingerprint` sourced from the existing plan fingerprint.
- Added a deterministic `checklistFingerprint` derived from checklist structure and current item state.
- Added `storageHealth` with status, availability, restoration, key, last-save timestamp, and recovery reason.
- Added `generationTimestamp` sourced from the checklist generation timestamp.
- Added `integrityStatus` with `healthy`, `warning`, `invalid`, and `empty` states.
- Preserved the existing diagnostics fields and immutable Workspace contract.

## Scope boundaries
- No Workspace UI changes.
- No new event names or listeners.
- No planner changes.
- No persistence write or recovery behavior changes.
- No customer-facing changes.

## Regression notes
- Fingerprints are deterministic for equivalent checklist state.
- Status mutations change the checklist fingerprint but not the planner fingerprint.
- Diagnostics remain delivered to the Workspace through the existing event-driven immutable state contract.
- Existing checklist validation remains the source of integrity truth.
