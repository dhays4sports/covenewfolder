# CONS-1.2 — Consultation Document Access

## Goal
Make the agent consultation document directly accessible from the selected saved record in the existing Agent Workspace.

## Implemented
- Added a visible `Open consultation document` action to the Workspace header.
- The action follows the active saved record by opaque `consultation_id`.
- Added `/agent/consultation/`, an internal route that selects the requested record, restores its conversation plan and checklist, and renders the existing certified Print Engine output.
- Added a `Print / Save PDF` control that opens the document frame's browser print dialog.
- Added accessible loading, ready, missing-record, and renderer-failure states.
- Preserved customer-report access, record switching, privacy boundaries, legacy fallback behavior, and all existing Workspace surfaces.

## Definition of Done
- The action is visible and enabled for a durable selected consultation record.
- The generated document is based on the selected record, not merely the latest report.
- The document can be printed or saved as PDF through the normal browser workflow.
- Only the opaque consultation ID appears in the route.
- Missing records and unavailable services fail safely with a route back to the Workspace.

## Deferred
- Server-backed producer inbox and cross-device record delivery.
- Direct binary PDF generation or cloud document storage.
- Emailing, CRM export, ownership, status, notes, and follow-up workflow.
