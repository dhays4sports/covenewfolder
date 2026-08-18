# RC-SMS-1.9.1 — Immediate Producer Queue Alerts

Status: complete in CoverageFit 3.20.54.

## Outcome

When the automated SMS journey reaches a point that needs Dylan, CoverageFit sends one immediate producer email through the existing Resend integration and records its redacted state on the existing conversation.

## Actionable events

- A guided buyer, current-home, or home-and-auto intake completes and the CoverageFit link is delivered.
- The prospect replies `DYLAN` or otherwise requests a personal response.
- A business, landlord, life, servicing, special, or other direct-handling category is captured.
- The intent router escalates after the second unclear menu response.

Intermediate answers, HELP, STOP, duplicate provider events, and producer manual takeover do not trigger an alert. An existing `awaiting_producer` conversation is not alerted again.

## Delivery and privacy contract

- Reuses `RESEND_API_KEY`, `COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL`, `COVERAGEFIT_NOTIFICATION_FROM`, optional reply-to, and the CoverageFit site origin.
- Uses a separate `RCSMS_PRODUCER_ALERTS_ENABLED` kill switch, defaulting on when the shared email path is configured.
- Uses a conversation/event/type idempotency key and the existing bounded two-attempt delivery policy.
- Commits the webhook response and conversation before scheduling email; alert failure never changes or delays the customer SMS outcome.
- Labels time-sensitive work with `[RUSH]` and pre-port tests with `[TEST]`.
- Includes only action status, broad intent, priority, generic referral/direct attribution, and an opaque protected SMS Operations URL.
- Excludes name, phone, address, closing date, transcript, partner identity, and insurance details.

## Operations

The protected `/agent/sms-operations/` surface exposes alert enablement/configuration and per-conversation alert state. Its same-origin, producer-authorized **Send test alert** action verifies Resend before the production number is ported and does not create a fake lead.

## Preserved boundaries

Customer-facing SMS copy, CoverageFit handoff behavior, CRO-1.6.2.1 intent continuity, completed-review email notifications, dual lead intake, STOP, producer takeover, assessment/scoring, and producer judgment are unchanged. Production number porting and live carrier certification remain RC-SMS-1.10.
