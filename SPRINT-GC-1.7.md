# GC-1.7 — Explanation Assist

Release: CoverageFit 3.20.36

## Objective

Help a beginner producer understand and explain an assessment finding naturally while keeping verified facts, professional judgment, carrier confirmation, and final policy terms clearly separate.

## Implementation

- Added one centralized `explanation-assist.js` model inside the existing Agent Workspace architecture.
- Explanation Assist consumes the current GC-1.3 ranked finding and GC-1.6 Recommendation Builder state.
- Every existing builder finding receives four progressively disclosed coaching elements:
  - what the specific assessment issue is and what the topic means;
  - why the topic may matter to the homeowner;
  - a calm, homeowner-facing talk track;
  - a bounded checklist of facts, policy terms, forms, and carrier details to verify.
- Topic-aware guidance is derived centrally for the major homeowner protection categories, with a safe general fallback for older or uncommon findings.
- Readiness labels distinguish `Verify first`, `Ready to discuss`, and `Judgment recorded` states.
- Producer cues react to the current structured judgment without choosing or changing that judgment.
- The first finding opens by default; the remaining coaching stays behind native progressive disclosure, and disclosure choices survive Recommendation Builder rerenders.

## Guardrails

- An unverified finding is described as an assessment question, not a confirmed coverage gap.
- Explanation Assist never selects, upgrades, or persists a recommendation.
- Final forms, limits, deductibles, eligibility, availability, underwriting, and coverage outcomes require carrier confirmation and are controlled by the issued policy.
- No carrier proposal, quote document, second assessment, campaign fork, or parallel consultation system was created.

## QA

Run:

```sh
node GC1_7_QA.mjs
npm test
node STATIC_RELEASE_QA.js
```

GC-1.8 Consultation Progress remains deferred to the next bounded sprint.
