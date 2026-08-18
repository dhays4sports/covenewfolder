# GC-1.4 — Verify Before Advising

Release: CoverageFit 3.20.33

## Outcome

The existing Consultation Command Center now presents one verification-status map before the producer begins advising:

1. Known
2. Inferred
3. Missing
4. Needs confirmation

The model is derived from the existing Workspace snapshot, recommendation metadata, evidence-quality handoff, and property-confirmation state. It does not create a second evidence system or alter stored assessment facts.

## Status contract

### Known

Clear homeowner-reported assessment answers. These remain a starting point and must still be validated when they describe policy language, limits, deductibles, endorsements, exclusions, or underwriting details.

### Inferred

CoverageFit findings derived from assessment responses. They are explicitly labeled as interpretations and are never promoted to verified facts.

### Missing

Required assessment answers whose existing evidence quality is `missing`.

### Needs confirmation

Existing `needs-verification` policy checks, partial homeowner answers, and an available Property Intelligence profile that has not been customer-confirmed.

## Preserved architecture

- GC-1.1 Consultation Command Center
- GC-1.2 Prospect Story
- GC-1.3 Priority Findings
- Assessment evidence-quality classifications
- Protection Score formula and assessment evaluation
- Detailed evidence handoff and Consultation Guide
- Zero-repeat intake and semantic entry context
- Attribution, reporting, consultation records, and RC-SMS

## Deferred

GC-1.5 will use verified findings and missing information to organize context-specific consultation questions. GC-1.4 does not generate a new question library or make recommendations.
