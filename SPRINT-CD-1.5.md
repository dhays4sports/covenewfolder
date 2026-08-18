# CD-1.5 — Recommendation Explanations

Release: CoverageFit 3.20.43

## Objective

Make each Consultation Document recommendation understandable by connecting the priority finding to a plain-language explanation, its importance, verification readiness, the producer-controlled judgment, and the reason for that judgment.

## Implementation

- Reused GC-1.6 Recommendation Builder to rehydrate the current saved producer judgment for the three priority findings.
- Reused GC-1.7 Explanation Assist for topic-specific meaning, importance, and verification guidance.
- Carried the bounded guidance through the existing Consultation Document context and Print Engine contract.
- Added safe presentation states for no recommendation, discuss or consider, recommendation for carrier quote, defer, and not recommended after review.
- Added explicit `Verified for discussion` and `Verification needed` labels.
- Preserved the existing conversation question, producer direction, verification checklist, and notes beneath each explanation.

## Guardrails

- No second recommendation source, explanation library, document renderer, persistence contract, or API was created.
- CoverageFit does not automatically select or finalize a producer recommendation.
- Unverified findings remain assessment questions rather than confirmed coverage gaps.
- `Recommendation for carrier quote` does not promise availability, coverage, eligibility, price, underwriting approval, or issued-policy terms.
- Carrier forms, underwriting, the formal quote, and the issued policy control final terms.
- Assessment, Protection Score, attribution, reporting, FLOW, and RC-SMS behavior remain unchanged.

## Deferred

- Decisions and Next Steps: CD-1.6.
- Consumer Language Pass: CD-1.7.
- Producer/Consumer Consistency: CD-1.8.
