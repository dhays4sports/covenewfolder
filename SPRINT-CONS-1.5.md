# CONS-1.5 — Producer Inbox Search, Filters, and Follow-Up Queue

## Goal
Turn the existing server-backed producer inbox into an actionable follow-up queue without changing the assessment, consultation document, or customer-report workflows.

## Implemented
- Search across homeowner identity, contact information, property address, review context, campaign, referral, and follow-up note.
- Delivery filters for New, Opened, Acknowledged, and browser-local records.
- Follow-up filters for needs action, overdue, due today, upcoming, completed, and unscheduled.
- Urgency-sorted queue cards that open the selected consultation through the existing Workspace pipeline.
- Server-backed follow-up due date and short action note.
- Follow-up completion, clearing, and rescheduling.
- Same-origin authenticated Netlify Function for follow-up mutations.
- Browser-local synchronization through the existing consultation archive.

## Acceptance criteria
- Search and filters operate on the existing saved consultation records.
- Queue results never create duplicate records or parallel consultation views.
- Follow-up state persists on the server and returns through normal inbox sync.
- Overdue and due-today states are derived truthfully from the producer's local date.
- Local-only records remain searchable and are labeled as unavailable for server follow-up.
- Existing New, Opened, Acknowledged, document, report, planner, checklist, and fallback behavior remains operational.
