# CONS-1.3 — Server-Backed Producer Inbox Foundation

## Goal
Establish a secure, deployable receiving path so completed Home Coverage Reviews submitted on prospect devices can appear in the producer's existing Agent Workspace.

## Implemented
- Same-origin `POST /api/consultations/submit` Netlify Function.
- Producer-authenticated `GET /api/consultations/inbox` Netlify Function.
- Netlify Blobs persistence using store `coveragefit-consultations-v1`.
- Payload size, content-type, origin, consultation-schema, and honeypot validation.
- Function-level rate limiting for public submission and producer inbox reads.
- Functions-scoped `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` authentication using constant-time comparison.
- Session-only producer access-key storage in the browser.
- Existing Agent Workspace connection, sync, disconnect, empty, success, and error states.
- Remote records imported into the existing browser archive so all current Workspace, consultation document, planner, checklist, report, and print behavior remains unchanged.
- Browser-local consultation creation and Formspree submission retained as fallbacks.

## Definition of Done
A completed Home review can be persisted by the server endpoint, retrieved only with the configured producer key, synchronized through the normal Agent Workspace UI, and opened through the existing consultation workflow.

## Deployment Requirement
Deploy through a Netlify build-capable workflow and configure `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` for the Functions scope before using the producer inbox.

## Deferred
- Delivery state visible to the producer per consultation record.
- Producer acknowledgment, read/unread state, ownership, notes, and follow-up dates.
- Multi-user agency authentication and role-based access.
- Cloud deletion, retention controls, CRM synchronization, and audit history.
