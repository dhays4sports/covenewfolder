# AW-UI-2.2 — Inbox-First Agent Navigation

Status: Complete  
CoverageFit version: 3.20.62

## Outcome

The Agent Workspace now starts where producer work starts: the homeowner review queue. Existing direct consultation links remain direct, and opening a row moves into the full guided Consultation view.

## Implemented

- Inbox-first default with direct-link-aware consultation landing.
- Inbox/Consultation/Pipeline tab order aligned to the daily workflow.
- All, Needs attention, New, and Due today quick summaries derived from existing records.
- Action-first sorting: overdue, due today, new, upcoming, unscheduled, then completed.
- Cleaner homeowner rows with name, review reason, property, received time, delivery status, stage, follow-up state, and one primary action.
- True unread behavior while records remain in the queue.
- Immediately available search plus progressively disclosed delivery, stage, and follow-up filters.
- Clear-filter, saved-device, connected, sync, empty, and no-match recovery states.
- Responsive two-by-two summary controls and single-column mobile review rows.

## Intentionally unchanged

Consultation records, active-record storage, inbox authorization, remote sync, opened/acknowledged mutations, follow-up, disposition, pipeline reporting, assessment, scoring, recommendations, completion, document generation, SMS, D1, and Cloudflare Functions.

## Verification

```text
node AW_UI_2_2_QA.mjs
node AW_UI_2_1_QA.mjs
node STATIC_RELEASE_QA.js
node WR1C2_DEPLOYMENT_QA.js
node WR1C6_API_BASELINE_QA.js
```

The completed ZIP is root-deployable and includes the updated program roadmap for AW-UI-2.3 through AW-UI-2.6.
