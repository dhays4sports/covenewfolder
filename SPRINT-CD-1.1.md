# CD-1.1 — Document Information Architecture

Release: CoverageFit 3.20.39

## Objective

Make the existing printable consultation document immediately understandable by establishing one clear reading order before the section-specific Consultation Document sprints refine its content.

## Implementation

- Added one immutable `consultation-document-architecture.js` configuration inside the existing Print Engine.
- Defined seven canonical chapters:
  1. Executive Summary
  2. Protection Snapshot
  3. Property Snapshot
  4. Items to Verify
  5. Priority Findings
  6. Recommendations
  7. Decisions and Next Steps
- Organized those chapters into three current document parts:
  - Review Overview
  - Property & Verification
  - Consultation Record
- Added a compact document map to every existing printable part so the producer can see where they are and what follows.
- Renamed the overall printable artifact and its Agent Workspace launch action from Agent Guide to the Home Protection Consultation / Consultation Document identity while retaining the existing optional cover, print controls, page counters, and secure consultation-record route.
- Added semantic document-page and chapter markers so CD-1.2 through CD-1.6 can improve the intended area without creating parallel sections or a second report engine.

## Boundaries

- CD-1.1 changes hierarchy, labels, and navigation only.
- It does not rewrite the Executive Summary, Protection Snapshot, finding explanations, recommendations, completion content, or overall consumer-language system reserved for CD-1.2 through CD-1.7.
- It does not create a carrier proposal, quote, eligibility result, underwriting decision, discount promise, or coverage determination.
- Assessment, Protection Score, Agent Workspace, consultation persistence, attribution, reporting, FLOW, and RC-SMS contracts remain unchanged.

## QA

Run:

```sh
node CD1_1_QA.mjs
npm test
node STATIC_RELEASE_QA.js
```
