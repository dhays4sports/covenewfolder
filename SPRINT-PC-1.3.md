# PC-1.3 — Consultation Persistence and Recovery Hardening

## Objective

Protect in-progress Guided Consultation work from refreshes, browser changes, interrupted connections, and late network writes without creating another workflow or turning working state into verified advice.

## Implemented capability

The existing Consultation Checklist remains the only working-state engine. Its minimal progress projection—checklist and plan identity, current phase, item IDs, statuses, and timestamps—is now checkpointed inside the selected consultation record as well as the established device-local key.

On Workspace load, CoverageFit validates both locations and restores the newest valid checkpoint. A checkpoint is rejected when it belongs to another consultation plan, uses an incompatible schema, is malformed, or is older than the existing expiration limit. Consultation-record recovery writes through to device storage so work can continue offline.

## Secure synchronization

Server-backed consultations synchronize the same minimal checkpoint through `/api/consultations/checklist`.

- The endpoint requires same-origin requests and the existing producer access token.
- Payloads are bounded to 60 uniquely identified checklist items and the three existing working statuses.
- Older updates are acknowledged as stale and do not overwrite newer work.
- Checklist updates do not reorder the consultation queue or create activity-feed noise.
- The progress payload and D1 metadata contain no name, email, phone, address, answer, finding narrative, or producer note.
- Debounced saves reduce traffic; a keepalive attempt protects the latest change when leaving the page.

When the secure inbox is disconnected or unreachable, the consultation continues to work and save on the device. The producer sees a calm state label for device save, recovery, pending secure sync, or secure save.

## Preserved boundaries

- Checklist status remains working progress, not confirmation, professional judgment, or consultation completion.
- Recommendation Builder verification and decisions remain producer-controlled.
- Consultation Completion remains the authoritative closeout record.
- Protection Score, assessment answers and scoring, Consultation Document, attribution, zero-repeat handoff, FLOW, and RC-SMS contracts are unchanged.
- No 408FARMERS runtime change is required.
- No D1 migration is required because the existing consultation JSON record stores the additive checkpoint.

## Verification

Dedicated PC-1.3 QA covers newest-valid recovery, cross-plan isolation, offline fallback, local consultation persistence, stale-write protection, authorized API validation, safe metadata, Workspace status, deployment routing, and architecture-preservation hashes. Complete regression, static, deployment, Cloudflare build, archive-integrity, and clean-room extraction checks are required before Deployable status.

PC-1.4 Print/PDF Production Certification remains deferred.
