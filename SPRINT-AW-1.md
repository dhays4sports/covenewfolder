# Sprint AW-1 — Agent Workspace Foundation

## Objective
Rebuild the Agent Workspace from the v3.10.0 B.4B production baseline as a small, deployable internal experience that prepares Dylan for a Home consultation without changing customer-facing engines.

## Baseline Confirmation
- Uploaded repository `VERSION` was `3.10.0`.
- `SPRINT-B.4B.md` matched Property Confirmation & Prefill.
- Assessment, Protection Score, recommendation, report, attribution, and Property Intelligence engines were present.
- Later B.13A workspace files were isolated add-ons and were removed before the rebuild.

## Implemented
- Internal route: `/agent/workspace/`.
- Production workspace header with internal-use labeling.
- Executive summary card.
- Protection Score and status band.
- Customer name, top priority, and positive starting point.
- Property snapshot sourced from the existing report payload or Property Intelligence profile.
- Top three recommendation-topic cards sourced from the existing Home report payload.
- Safe empty state when no Home assessment is stored.
- Manual refresh and same-browser storage refresh behavior.
- Responsive mobile and tablet layouts.
- Keyboard focus treatment, skip link, semantic headings, live status, and reduced-motion support.

## Planned, Not Implemented
- AW-2 centralized workspace adapter.
- AW-3 conversation planning logic.
- AW-4 timeline interface.
- AW-5 persistent checklist.
- AW-6 printable consultation sheet.
- AW-7 private notes.
- AW-8 final accessibility, interaction, and visual polish.

## Deferred Deliberately
- Authentication and CRM synchronization.
- Customer search or multi-customer storage.
- Editing customer assessment data from the workspace.
- Any rewrite of the scoring, recommendation, report, attribution, or Property Intelligence engines.

## Files Added
- `SPRINT-AW-1.md`
- `AW1_QA.json`

## Files Updated
- `agent/workspace/index.html`
- `agent/workspace/workspace.css`
- `assets/js/agent-workspace.js`
- `VERSION`
- `CHANGELOG.md`
- `ROADMAP.md`

## Removed Abandoned Workspace Experiment Files
- `assets/js/workspace-data.js`
- `assets/js/conversation-planner.js`
- `SPRINT-B.13A.1.md`
- `SPRINT-B.13A.2.1.md`
- `SPRINT-B.13A.2.2.md`
- `SPRINT-B.13A.2.3.md`

## Regression Notes
- No customer-facing HTML was modified.
- No assessment, score, recommendation, report, attribution, or Property Intelligence engine was modified.
- Workspace reads `coveragefit_home_report` and Property Intelligence data without writing to either source.
- Missing or malformed local storage is handled without breaking the page.
- Existing `/home/report/` and `/assessment/` routes remain the source experiences.

## Completion Standard
AW-1 is complete because the workspace route is functional, directly reachable, populated by real saved Home assessment data, responsive, empty-state safe, documented, and regression checked.
