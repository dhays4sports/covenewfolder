# AW-UI-2.3 — Guided Consultation Focus Mode

Status: Complete  
Release: 3.20.63

## Outcome

An open consultation now starts in Focus Mode and shows the work for one existing Consultation Progress stage at a time. The selected homeowner, Current Focus, record-derived progress, and one relevant working surface remain dominant. A producer can move backward or forward, inspect any stage, return to the record-recommended stage, or reveal the full consultation without changing consultation data.

## Delivered

- Bound the existing six-stage `CoverageFitConsultationProgress` model to a dedicated Focus Mode navigator.
- Preserved Understand, Verify, Discuss, Recommend, Decide, and Next step in their authoritative order.
- Added previous/next controls, direct stage selection, and an explicit return to the recommended current stage.
- Kept complete, current, needs-attention, and upcoming states visible in stage navigation.
- Scoped the existing Command Center, evidence, guided questions, checklist, Recommendation Builder, Consultation Completion, disposition, follow-up, and activity surfaces to their relevant stages.
- Kept Conversation readiness, homeowner document context, contact/property details, and recommendation coaching behind their established native disclosures.
- Added a one-click Show full record control that removes presentation filtering and restores every established surface.
- Kept manual stage selection view-only and session-only. It creates no progress record and never marks work complete.

## Preserved boundaries

- No assessment question, score, finding-order, evidence, recommendation, or completion semantic changed.
- No element ID used by the existing workspace was removed or renamed.
- No checklist, recommendation, completion, disposition, follow-up, consultation, inbox, pipeline, SMS, referral, document, D1, or Cloudflare Functions persistence changed.
- No storage key, API route, query parameter, database migration, or access behavior was added.
- Root-deployable Cloudflare Pages structure remains intact.

## Deferred

- AW-UI-2.4 — Sticky Snapshot and Quick Actions
- AW-UI-2.5 — Mobile Agent Console
- AW-UI-2.6 — Accessibility and Regression Certification

## Certification

Dedicated AW-UI-2.3 QA covers stage binding, stage-aware view filtering, full-record recovery, navigation semantics, progressive disclosure, responsive/forced-color safeguards, unchanged persistence boundaries, roadmap continuity, versioning, and root deployment. Prior AW-UI, static release, deployment, and frozen API baselines are run again before packaging.
