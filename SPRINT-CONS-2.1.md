# CONS-2.1 — Privacy-Safe New Review Notification

## Goal

Alert the configured producer when a completed Home Coverage Review reaches the secure producer inbox, without placing customer or assessment information in email.

## Implemented

- Server-only Resend notification adapter
- Generic text and HTML alert linking to Agent Workspace
- Cloudflare request-lifecycle background delivery so homeowner completion does not wait on the email provider
- Idempotency, timeout handling, and one bounded retry for temporary failures
- Persistent sent, failed, skipped, pending, and legacy states
- Producer-notified activity event only after provider acceptance
- Truthful Agent Workspace notification delivery language
- Non-blocking failure behavior for homeowner submissions
- Legacy-record compatibility and duplicate-send protection
- Preview and Production setup documentation

## Acceptance criteria

- A configured new review creates one generic producer email.
- Customer identity, contact, property, score, findings, reason, token, campaign, and session data are excluded.
- A Sent consultation is not emailed twice.
- Provider latency or failure does not delay or prevent D1 persistence or the 201 submission response.
- Temporary errors receive no more than one retry.
- Notification status is visible in the secure producer workflow.
- Existing assessment, scoring, reporting, consultation, and pipeline behavior remains unchanged.

## Deferred

SMS or push alerts, digest notifications, multi-producer routing, in-app notification preferences, manual resend controls, queue-backed delivery, and provider open tracking.
