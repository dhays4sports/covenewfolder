# AW-UI-2.5 — Mobile Agent Console

Status: Complete  
Release: 3.20.65

## Outcome

The Consultation view now behaves like a working mobile console rather than a compressed desktop page. The selected homeowner remains compact, the active consultation stage is easy to swipe to, and Call, Text, the current stage, and additional actions remain thumb-reachable while the producer works through long consultation content.

## Delivered

- Added a bottom action dock for Call, Text, the record-derived current stage, and a native More disclosure.
- Added Email, Consultation Document, Client Snapshot, and Inbox actions to a bounded action sheet above the dock.
- Reused the selected consultation’s established phone, email, document, report, availability, preview, and activity-logging behavior.
- Automatically collapses the derived homeowner snapshot on compact screens and restores it as open on wide desktop.
- Reworked the six Focus Mode stages into a swipeable, snap-aligned strip and centers the selected stage horizontally without moving the page vertically.
- Added safe-area padding for the dock, working surface, and action sheet on notched iPhones.
- Enforced 44-pixel-or-larger touch controls, 16-pixel working form inputs, and larger save/closeout actions.
- Added short-landscape density rules and bounded dynamic-viewport scrolling for the More sheet and long checklist surfaces.
- Added overflow containment and wrapping for long customer, evidence, recommendation, checklist, activity, and guardrail content.
- Supports outside-tap, explicit close, Escape, and action-based dismissal for the More sheet.

## Preserved boundaries

- The mobile dock and action sheet create no contact, customer, progress, or availability record.
- No assessment question, Protection Score, finding order, evidence state, recommendation meaning, or completion rule changed.
- No checklist, recommendation, completion, disposition, follow-up, consultation, inbox, pipeline, document, SMS, referral, D1, or Cloudflare Functions persistence changed.
- No storage key, API route, query parameter, database migration, or authorization behavior was added.
- AW-UI-2.3 Focus Mode and AW-UI-2.4 wide-desktop sticky snapshot remain intact.
- Required professional, evidence, recommendation, completion, and action guardrails remain visible.
- Root-deployable Cloudflare Pages structure remains intact.

## Deferred

- AW-UI-2.6 — Accessibility and Regression Certification

## Certification

Dedicated AW-UI-2.5 QA covers mobile action reachability, destination/availability reuse, native disclosure behavior, stage centering, touch targets, form sizing, safe areas, narrow phones, short landscape, long-content handling, reduced motion, forced colors, unchanged persistence boundaries, roadmap continuity, versioning, and root deployment. Prior AW-UI, static release, deployment, and frozen API baselines are run again before packaging.
