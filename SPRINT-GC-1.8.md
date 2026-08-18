# GC-1.8 — Consultation Progress

Release: CoverageFit 3.20.37

## Objective

Give a beginner producer one calm, explicit path through the consultation while preserving every existing working surface and the producer’s professional judgment.

## Implementation

- Added one centralized `consultation-progress.js` model to the existing Agent Workspace.
- The model derives six macro stages from existing state:
  - Understand — opening checklist work and the existing Command Center;
  - Verify — context checklist work plus explicit finding verification or deferral;
  - Discuss — the existing review and connect checklist phases;
  - Recommend — structured judgments in the existing Recommendation Builder;
  - Decide — the existing consultation disposition and final outcome;
  - Next step — the existing secure follow-up state or local next-touchpoint record.
- One current stage is emphasized. Incomplete earlier stages are labeled `Needs attention` if the operational record has advanced past them.
- Each macro stage links to the corresponding existing workspace surface; the detailed checklist remains the working control for questions, checks, and notes.
- Progress updates when the checklist or Recommendation Builder changes and when the selected consultation record rerenders.

## Guardrails

- Consultation Progress stores nothing and creates no API, assessment, checklist, recommendation, or disposition contract.
- A deferred finding is handled for sequence purposes but remains explicitly unresolved; it is never presented as verified.
- Advancing the consultation does not convert homeowner-reported, inferred, missing, or unconfirmed information into fact.
- The sequence does not produce a quote, carrier proposal, eligibility result, rate, discount, underwriting outcome, or coverage determination.

## QA

Run:

```sh
node GC1_8_QA.mjs
npm test
node STATIC_RELEASE_QA.js
```

GC-1.9 Consultation Completion remains deferred to the next bounded sprint.
