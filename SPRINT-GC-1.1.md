# GC-1.1 — Consultation Command Center

Release: CoverageFit 3.20.30

GC-1.1 adds one beginner-friendly starting layer to the existing Agent Workspace. It derives a concise command-center model from the current workspace snapshot, evidence handoff, consultation disposition, and checklist progress.

The first selected-consultation view now answers:

- Who: homeowner identity and property.
- Why: the normalized homeowner review reason.
- Status: consultation stage plus guided-step progress.
- Top priorities: at most three findings in the assessment's existing recommendation order.
- Verify: at most three policy checks or homeowner questions, retaining their existing evidence classification and order.
- Next action: a deterministic link into the existing preparation, guided-consultation, or outcome workflow.

## Boundaries

- No acquisition, assessment, scoring, recommendation, evidence, attribution, consultation-record, reporting, or SMS contract changed.
- No new ranking model was added; GC-1.3 remains responsible for consultation-importance ranking.
- No inferred fact is promoted to confirmed; GC-1.4 remains responsible for the broader known/inferred/missing/verification experience.
- No guided-question generator, recommendation builder, or consultation-document redesign is included.
- Producer judgment and carrier verification remain required.

## QA

Run `node GC1_1_QA.js` for the sprint-specific contract suite and `npm test` for complete regression.
