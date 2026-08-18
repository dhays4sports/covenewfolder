# CONS-1.9 — Consultation Pipeline Date Range and Source Segmentation

## Goal
Add bounded date filtering and campaign, referral-source, and entry-source breakdowns to the existing Agent Workspace pipeline summary.

## Acceptance criteria
- Existing synchronized consultation records remain the single reporting source.
- All-time, 7-day, 30-day, 90-day, and custom date windows are available.
- Custom ranges require valid inclusive dates and are limited to 366 days.
- Pipeline totals, stage counts, outcomes, and the consultation queue use the same selected date window.
- Campaign, referral, and entry-source counts and shares are visible.
- Missing attribution appears as Unattributed.
- Existing inbox, disposition, notes, activity, follow-up, report, and document workflows remain functional.

## Implementation
- Extended `assets/js/consultation-pipeline-summary.js` with date selection, record filtering, and source segmentation.
- Added integrated reporting controls and source panels to `agent/workspace/index.html`.
- Updated `assets/js/agent-workspace.js` to render the selected range and keep the queue consistent.
- Added responsive, accessible styling in `agent/workspace/workspace.css`.
- Added dedicated regression coverage in `CONS1_9_QA.js`.

## Known limitations
- Reporting covers records synchronized into the current browser rather than a server-side aggregate.
- Custom date ranges are limited to 366 days.
- Historical trends, CSV export, and producer-level attribution remain deferred.
