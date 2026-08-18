# CONS-1.4 — Producer Inbox Delivery State and Record Acknowledgment

## Goal
Add durable server-backed delivery and producer engagement state to remotely completed Home consultation records.

## Implemented
- Server delivery timestamp on successful consultation receipt.
- New, Opened, and Acknowledged record states.
- Authenticated same-origin status update endpoint.
- Monotonic status transitions with duplicate-submission preservation.
- Workspace lifecycle badge, delivery timestamps, and new-record count.
- Automatic Opened transition when a remote record becomes the active visible consultation.
- Explicit Acknowledge review action.
- Browser-local lifecycle synchronization and legacy CONS-1.3 record normalization.

## Acceptance criteria
- Completed remote review is stored with delivered and new timestamps.
- Inbox response exposes current status and lifecycle timestamps.
- Opening a remote record advances New to Opened.
- Acknowledgment advances New or Opened to Acknowledged.
- Advanced states cannot be downgraded.
- Local-only consultations remain available and are labeled truthfully.
- Existing inbox authentication, submission, consultation document, report, planner, and checklist workflows remain operational.
