# GC-1.6 — Recommendation Builder

Release: CoverageFit 3.20.35

## Objective

Help the producer turn verified priority findings into a structured recommendation plan while keeping professional judgment, policy verification, and carrier quoting clearly separate from CoverageFit’s assessment output.

## Implementation

- Added one centralized `recommendation-builder.js` model that consumes the existing GC-1.3 ranked findings and evidence classifications.
- Added a Recommendation Builder to the existing Agent Workspace During phase.
- For each ranked finding, the producer can:
  - attest that relevant homeowner facts and policy language were verified;
  - choose `Not decided`, `Discuss / consider`, `Recommend for carrier quote`, `Defer`, or `Not recommended after review`;
  - record producer reasoning separately from CoverageFit’s assessment rationale.
- `Recommend for carrier quote` is unavailable until verification is explicitly recorded.
- Producer reasoning is required for recommended and not-recommended findings.
- Recommendation plans are normalized and stored inside the existing consultation record:
  - browser-local reviews use the existing consultation-record store;
  - secure-inbox reviews use the existing D1-backed consultation record and producer authorization.
- Server-backed updates create one redacted operational activity event without exposing recommendation content in metadata.
- No new database migration is required because the existing consultation record is JSON-backed.

## Guardrails

- CoverageFit does not automatically select a recommendation.
- Assessment evidence remains homeowner-reported or system-derived until the producer explicitly verifies it.
- `Recommend for carrier quote` means include the item for formal carrier quoting and verification; it is not an offer, approval, or coverage guarantee.
- The Recommendation Builder does not create a carrier proposal or replace licensed producer judgment.

## QA

Run:

```sh
node GC1_6_QA.mjs
npm test
node STATIC_RELEASE_QA.js
```

GC-1.7 Explanation Assist remains deferred to the next bounded sprint.
