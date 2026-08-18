# Sprint B.1.1 — CoverageFit Attribution Receiver

## Objective
Allow CoverageFit to receive, persist, and expose campaign attribution sent by 408-FARMERS or any other approved entry source.

## Completed
- Added shared attribution receiver at `assets/js/attribution.js`.
- Added first-touch and session-level persistence.
- Added a stable session ID.
- Added attribution to assessment/report payloads.
- Added campaign and UTM hidden fields to contact forms.
- Added attribution context to analytics events and `dataLayer` pushes.
- Preserved campaign and session ID on the report redirect.
- Added the v1 integration contract.

## QA checklist
- [x] Direct visitors remain supported.
- [x] Approved query parameters are captured.
- [x] First touch is not overwritten by ordinary navigation.
- [x] Explicit later campaign parameters update last touch.
- [x] Home and Business assessment payloads use the same engine and receive attribution.
- [x] Forms receive hidden attribution fields.
- [x] Existing score, recommendation, and report logic remains unchanged.

## Next
Sprint B.1.2 updates 408-FARMERS to send the receiver contract and launch the real CoverageFit Home assessment.
