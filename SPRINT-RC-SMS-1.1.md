# RC-SMS-1.1 — Conversation Engine and Protected Simulator

## Status

Implemented, verified, and deployable in CoverageFit v3.20.19.

## User-visible feature

A protected internal simulator is available at `/agent/sms-simulator/`. It uses the existing CoverageFit producer access key, resumes the same opaque test conversation after a refresh, and lets the producer exercise the deterministic 408FARMERS conversation engine without connecting RingCentral or sending a live SMS.

## Implemented behavior

- Creates only opaque `sms-sim-*` conversation identifiers.
- Restricts simulator contacts to reserved North American 555 test numbers.
- Stores the producer key and active simulator ID in session storage, never in the URL.
- Persists conversation state and bounded transcripts in the D1 `sms_conversations` table.
- Processes every inbound simulator message through one valid state.
- Suppresses duplicate inbound message IDs so webhook-style retries cannot generate duplicate replies.
- Supports restart by inbound command or operator action.
- Supports a complete fictional buyer path: intent, property address, closing timing, occupancy, auto-review interest, and CoverageFit-ready state.
- Provides operator controls for awaiting-producer, human-takeover, and completed states.
- Includes explicit messaging that no live SMS is sent.

## Security and privacy

- The API requires the existing `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` bearer token.
- Mutating requests must originate from the same CoverageFit origin.
- No RingCentral client secret, JWT, account ID, extension ID, or sending number is required.
- No phone number, property address, conversation transcript, or access key is placed in a public URL.
- The UI directs operators to use fictional test details only.

## Deferred

RC-SMS-1.2 will add RingCentral authentication, webhook validation, configurable sending-number support, and one live automated response. RC-SMS-1.3 now provides production intent routing and core messaging controls. Personalized CoverageFit handoff, realtor attribution, and manual takeover remain in their mapped later sprints.
