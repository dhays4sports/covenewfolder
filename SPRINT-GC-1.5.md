# GC-1.5 — Guided Questions

Release: CoverageFit 3.20.34

## Objective

Help a beginner-friendly producer understand what to ask next based on the homeowner’s actual assessment findings and incomplete information, without creating a generic script library or another consultation workflow.

## Implementation

- Advanced the existing conversation planner to derive one bounded `guidedQuestions` collection.
- Uses the existing evidence handoff for missing answers, partial answers, and policy-verification prompts.
- Uses existing property confirmation state and ranked recommendation conversation starters for the remaining questions.
- Orders the work as: ask for missing information, clarify partial answers, verify policy details, confirm property context, then explore ranked findings.
- Suppresses a finding question when the same assessment key already has an unresolved or policy-verification question.
- Renders the derived questions inside the existing Agent Workspace During phase with a purpose label, source context, and a concise reason.
- Leaves the current agenda, timeline, persistent checklist, consultation document, assessment, score, attribution, reporting, and SMS systems intact.

## Guardrails

- Questions are discussion support, not automated advice or a coverage conclusion.
- Homeowner-reported information still requires policy and producer verification where applicable.
- No discount, eligibility, rate, underwriting, coverage, or timing result is asserted.
- Producer judgment remains responsible for the final consultation and recommendation.

## QA

Run:

```sh
node GC1_5_QA.js
npm test
node STATIC_RELEASE_QA.js
```

GC-1.6 Recommendation Builder remains deferred to the next bounded sprint.
