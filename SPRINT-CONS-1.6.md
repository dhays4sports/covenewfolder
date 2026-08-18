# CONS-1.6 — Consultation Notes and Activity Timeline

## Goal
Add persistent producer notes and a chronological consultation activity timeline to the existing server-backed Agent Workspace workflow.

## Implemented
- Authenticated same-origin consultation activity endpoint.
- Persistent server-backed producer notes.
- Chronological activity events for delivery, opening, acknowledgment, follow-up changes, notes, and consultation-document and customer-report access.
- Integrated note form and accessible latest-first activity timeline in the existing Workspace.
- Search coverage for producer note content.
- Backward-compatible normalization for CONS-1.3 through CONS-1.5 records.

## Acceptance
- Existing inbox, lifecycle, follow-up queue, documents, reports, planner, checklist, and local fallback remain available.
- Customer information remains out of URLs.
- Notes and activity require the existing session-only producer key.
