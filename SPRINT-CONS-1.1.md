# CONS-1.1 — Completed Review Consultation Handoff

## Goal
Connect a completed homeowner Coverage Review to a durable, accessible consultation record in the existing Agent Workspace.

## Implemented
- Added `CoverageFitConsultationRecords`, a versioned browser-local archive for completed Home review payloads.
- Creates a record after the homeowner submits the final contact step, not from an incomplete assessment state.
- Stores up to 25 records and preserves the selected record across Workspace visits.
- Added an accessible saved-record selector to `/agent/workspace/`.
- Added opaque `consultation_id` deep-link support without placing customer information in the URL.
- Mirrors the active consultation report to `coveragefit_home_report` so the current customer report, Print Engine, Conversation Planner, and Consultation Checklist continue working.
- Retained legacy latest-report fallback for existing saved assessments created before CONS-1.1.

## Definition of Done
- A completed Home review creates a durable consultation record.
- The record appears through the normal Agent Workspace workflow.
- Earlier records remain selectable after a later review is completed.
- Selecting a record updates all existing Workspace surfaces through the established data adapter.
- Direct and legacy assessment behavior remains compatible.

## Deferred
- Shared-account or server-side persistence across devices.
- Consultation status, owner, notes, follow-up date, and CRM synchronization.
- Record deletion, export, and search beyond the bounded selector.
