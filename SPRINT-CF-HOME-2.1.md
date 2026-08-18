# CF-HOME-2.1 — Journey Contract & Conversion Baseline Receiver

## Outcome

CoverageFit v3.20.56 completes the synchronized 408-HOME-2.1 measurement contract. Recognized 408FARMERS Home handoffs can carry the reserved semantic-intent fields, and CoverageFit emits privacy-safe Home journey events when the existing assessment starts and completes.

## Implemented

- Accepted and scrubbed `home_review_goal` and `review_timing` alongside the existing `housing_context` field.
- Preserved the bounded semantic fields in the stored prospect and personalization context.
- Added a receiver-only baseline adapter for recognized, trusted 408FARMERS Home handoffs.
- Mapped the existing `assessment_started` and `assessment_completed` events to the shared `home_assessment_started` and `home_assessment_completed` journey vocabulary.
- Limited journey-event properties to non-personal status, stage, contract, sender-build, and context-presence metadata.
- Preserved FLOW-1.5 direct assessment routing, structured property confirmation, zero-repeat completion, and the question-two responsiveness correction.

## Explicitly unchanged

- Assessment questions and answers
- Protection Score methodology
- Recommendations and report payloads
- Formspree completion submission
- Consultation creation and producer notification
- Direct CoverageFit traffic

The three engagement questions remain a 408FARMERS sender change scheduled for 408-HOME-2.2.
