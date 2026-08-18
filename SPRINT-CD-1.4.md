# CD-1.4 — Priority Findings

Release: CoverageFit 3.20.42

## Objective

Make the Consultation Document's Priority Findings immediately understandable by showing only meaningful assessment topics, ordering them by importance, and distinguishing the finding from the guidance used during the licensed conversation.

## Implementation

- Advanced the existing immutable Consultation Guide model to reuse the established print recommendation ordering model.
- Filters empty recommendation shells, retains a bounded three-finding conversation sequence, and preserves the saved-review fallback path.
- Labels the sequence `Address first`, `Discuss next`, and `Also review`.
- Separates `What the assessment found` and `Why it is prioritized` from the existing Recommendations chapter content.
- Maps existing evidence quality to bounded `Check policy`, `Ask homeowner`, or `Discuss and confirm` cues without changing the underlying classification.
- Added responsive and print-safe hierarchy through the existing HTML renderer.

## Guardrails

- No new assessment, scoring, recommendation, document, persistence, attribution, or API system was created.
- Protection Score math, bands, assessment findings, and evidence classifications are unchanged.
- Findings organize the consultation; they do not establish coverage, eligibility, pricing, underwriting, or policy outcomes.
- Existing consultation questions and producer guidance remain available and are not treated as verified facts.
- FLOW, referral attribution, consultation records, reporting, and RC-SMS behavior are unchanged.

## Deferred

- Recommendation Explanations: CD-1.5.
- Decisions and Next Steps: CD-1.6.
- Consumer Language Pass: CD-1.7.
- Producer/Consumer Consistency: CD-1.8.
