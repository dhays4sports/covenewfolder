# AW-UI-2.1 — Simplified Workspace Architecture

Status: Complete  
CoverageFit version: 3.20.61

## Outcome

The Agent Workspace now presents one calmer hierarchy modeled on the SMS Simulator's usability principles while retaining CoverageFit branding and every established consultation capability.

## Implemented

- Replaced the crowded header action row with an accessible Tools disclosure.
- Introduced a dark CoverageFit application header and lighter, quieter working canvas.
- Added a compact five-stage orientation strip above the operational surfaces.
- Reworded primary headings around the producer's task instead of internal system names.
- Kept the selected homeowner and Current Focus immediately visible.
- Moved live-pilot readiness checks behind native progressive disclosure.
- Added outside-click, Escape, in-page disclosure opening, and readiness-state reflection behavior.
- Added responsive and forced-colors safeguards.
- Added the full AW-UI-2 roadmap at the deployable root.

## Intentionally unchanged

Assessment, scoring, findings, evidence, recommendation decisions, consultation progress, completion, follow-up, document generation, print, secure inbox, pipeline, referrals, SMS, handoffs, D1 storage, Cloudflare Functions, authorization, and deployment routing.

## Verification

Run:

```text
node AW_UI_2_1_QA.mjs
npm test
npm run cloudflare:functions:build
```

The packaged archive must contain the repository contents at ZIP root, not inside an additional directory.
