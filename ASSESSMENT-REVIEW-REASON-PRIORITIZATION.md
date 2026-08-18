# Review-Reason-Aware Assessment Prioritization

## Purpose

ASMT-1.4 adapts the Home assessment conversation to the homeowner's stated reason for requesting a review. It changes question-level context and final discussion-priority ordering only.

It does **not** change:

- question weights;
- answer score impacts;
- weighted penalties;
- category scores;
- the overall Protection Review Readiness Score;
- eligibility, pricing, underwriting, hazard, or coverage conclusions.

## Supported journeys

### Home purchase

Prioritizes rebuilding assumptions, deductible readiness, separate hazards, and foundational liability decisions before coverage options are finalized.

### Annual renewal

Prioritizes changes since the prior review, rebuilding updates, water terms, deductibles, and liability before the renewal decision.

### Non-renewal or cancellation

Prioritizes accurate current property details, rebuilding assumptions, deductible readiness, and separately handled hazards while preparing for replacement-coverage discussions. CoverageFit does not infer why a carrier acted and does not predict eligibility.

### Premium increase

Prioritizes deductible tradeoffs and protection terms commonly reconsidered when responding to price, so the homeowner can understand what may be changed before making a price-driven decision.

## Ranking method

Each applicable question receives a bounded `reviewReasonPriorityBoost`. That boost is added only when the selected answer has a nonzero score impact. The underlying weighted penalty remains unchanged.

Priority ranking remains:

1. weighted answer penalty;
2. finding-type bonus;
3. property-aware priority boost, when applicable;
4. review-reason priority boost, when applicable;
5. deterministic question order for exact ties.

A confirmed strength receives no priority boost because it does not enter the priority queue.

## Transparency

The completed report stores:

- the raw review reason;
- normalized reason key and label;
- the methodology identifier and version;
- contextual question keys;
- prioritized question keys;
- per-finding reason context;
- per-finding reason boost;
- an explicit `scoreFormulaChanged: false` marker.

## Privacy and truthfulness

The feature uses the homeowner-selected review reason already carried through CoverageFit personalization. It does not use public records, infer a carrier's reason for non-renewal, or make eligibility or pricing predictions.
