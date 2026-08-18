# CoverageFit Agent Workspace UI 2 Roadmap

## North star

The Agent Workspace should feel like a guided producer console, not a collection of internal systems. At every moment Dylan should be able to answer three questions without hunting: Which homeowner am I helping? What matters now? What is the next action?

The SMS Simulator is the interaction reference: calm hierarchy, obvious actions, compact supporting information, and progressive disclosure. CoverageFit branding, producer workflows, data semantics, and professional guardrails remain authoritative.

## Program invariants

- Do not change assessment questions, Protection Score math, finding order, evidence classification, or recommendation semantics.
- Do not replace consultation, inbox, pipeline, SMS, handoff, referral, document, D1, or Cloudflare Functions architectures.
- Preserve existing element IDs, storage keys, API routes, authorization behavior, and server-backed recovery.
- Keep producer judgment explicit. CoverageFit never presents itself as a carrier, quote, eligibility, underwriting, or coverage decision engine.
- Keep customer data and access secrets out of URLs, logs, roadmap documents, fixtures, and screenshots.
- Retain the root-deployable Cloudflare Pages files: `index.html`, `404.html`, `_headers`, `_routes.json`, `functions/`, and all route/assets directories.
- Each sprint must add focused QA and pass the current/prior AW-UI checks plus static, deployment, and frozen-API baselines before packaging; historical aggregate results must be reviewed separately because many legacy files pin an exact former release number.

## Sprint sequence

### AW-UI-2.1 — Simplified Workspace Architecture — Complete in 3.20.61

Delivered:

- CoverageFit navy application shell inspired by the SMS Simulator.
- One compact Tools disclosure for SMS Simulator, refresh, Consultation Document, and Client Snapshot.
- One five-stage orientation strip: Prepare, Verify, Discuss, Recommend, Close.
- Selected homeowner and Current Focus retained as the dominant working context.
- Conversation readiness moved behind native progressive disclosure with its complete PC-1.5 behavior preserved.
- Primary phase language simplified to Prepare, Work the review, and Record the outcome.
- Restrained card elevation and mobile-safe responsive behavior.
- Dedicated contract and static QA coverage.

Acceptance boundary: this sprint simplifies architecture and language. It does not yet change the default inbox workflow, create a dynamic focus mode, add a sticky snapshot rail, or redesign the entire mobile consultation surface.

### AW-UI-2.2 — Inbox-First Agent Navigation — Complete in 3.20.62

Goal: make the producer inbox the natural start for daily work while preserving direct links into an active consultation.

Delivered:

- Normal Workspace visits land in the Producer Inbox; existing direct consultation links still open the requested review.
- Inbox navigation clears the consultation deep-link parameter so refresh returns to the daily queue.
- Four quick summaries derive all, needs-attention, new, and due-today counts from existing records.
- Homeowner rows prioritize identity, review reason, property, received time, delivery state, consultation stage, follow-up state, and one primary action.
- New records remain unread until the Consultation view is actually opened.
- Search stays visible while delivery, stage, and follow-up filters use native progressive disclosure.
- Connected, saved-device, empty, no-match, clear-filter, sync, and connection-recovery states reuse the existing secure inbox client.
- No new queue store, API, storage key, or duplicate consultation state was introduced.

Acceptance boundary: this sprint changes daily navigation and queue presentation. It does not yet reduce an open consultation to one stage at a time, add the sticky client snapshot rail, or complete the dedicated mobile-console and final-certification passes.

### AW-UI-2.3 — Guided Consultation Focus Mode — Complete in 3.20.63

Goal: show one consultation stage and its relevant work at a time without removing access to the complete record.

Delivered:

- Bound the existing six-stage Consultation Progress model to a focused working surface without adding another tracker.
- Added direct, previous, next, and return-to-recommended-stage navigation with visible complete, current, needs-attention, and upcoming states.
- Scoped the Command Center, evidence, questions/checklist, Recommendation Builder, completion/disposition, and follow-up/activity surfaces to their relevant stages.
- Kept readiness, contact/property context, the homeowner document story, and recommendation coaching behind their established progressive disclosures.
- Added one-click full-record access; manual stage selection is view-only, session-only, and cannot mark work complete.
- Preserved every checklist, verification, recommendation, completion, disposition, follow-up, record, inbox, document, D1, and Cloudflare Functions persistence contract.

Acceptance boundary: this sprint changes only how an open consultation is presented and navigated. It does not add the sticky customer snapshot rail, redesign the complete mobile console, or perform the final accessibility and production regression certification.

### AW-UI-2.4 — Sticky Snapshot and Quick Actions — Complete in 3.20.64

Goal: keep essential homeowner context and producer actions available without duplicating the consultation record.

Delivered:

- Reframed the established Active consultation header as a compact snapshot for homeowner, property, review reason, top assessment priority, consultation status, and recommended next step.
- Derived status from the existing disposition stage and next step from the existing six-stage Consultation Progress model.
- Reused Call, Text, Email, Consultation Document, and Client Snapshot destinations, availability rules, report-preview preparation, and activity logging.
- Kept the rail sticky only on wide desktop and converted its derived review facts to a native expandable, non-sticky disclosure on narrower layouts.
- Preserved every existing Active consultation ID and introduced no duplicate customer record, storage key, API route, D1 migration, or server mutation.

Acceptance boundary: this sprint keeps desktop context and actions available. It does not redesign the complete narrow-screen work surface or perform the final accessibility and production regression certification.

### AW-UI-2.5 — Mobile Agent Console — Complete in 3.20.65

Goal: make real producer work comfortable on narrow phones and tablets.

Delivered:

- Added a bottom-safe consultation dock for Call, Text, the current record-derived stage, and a native More action disclosure.
- Added Email, Consultation Document, Client Snapshot, and Inbox to a bounded, dismissible action sheet using existing destination and availability rules.
- Collapsed the derived homeowner snapshot automatically on compact screens while preserving its wide-desktop sticky behavior.
- Reworked the six Focus Mode stages into a swipeable, snap-aligned strip with horizontal-only selected-stage centering.
- Added 44-pixel-or-larger touch targets, 16-pixel working form inputs, safe-area spacing, dynamic viewport limits, short-landscape density, and long-content wrapping/containment.
- Kept professional, evidence, recommendation, completion, and action guardrails visible.
- Added no mobile state store, storage key, API route, D1 migration, or server mutation.

Acceptance boundary: this sprint optimizes mobile and tablet operation. The program-wide keyboard, screen-reader, contrast, zoom, forced-colors, Safari matrix, full regression, and production release decision remain in AW-UI-2.6.

### AW-UI-2.6 — Accessibility and Regression Certification — Complete in 3.20.66

Goal: certify the complete Workspace UI 2 program before release.

Delivered:

- Added roving Left/Right Arrow, Home, and End keyboard operation to the six Focus Mode stages and attached concise screen-reader instructions to the main Workspace and stage navigator.
- Preserved focus when a consultation row, pipeline filter, mobile action, or Inbox action hides its initiating control by moving focus to the selected Workspace tab.
- Corrected native disclosure naming and labeled the mobile action panel as a selected-homeowner region with its guardrail programmatically associated.
- Extended visible focus to every interactive element class, increased warning contrast, added increased-contrast preferences, and broadened forced-colors boundaries and selected/disabled states.
- Applied complete reduced-motion suppression and removed the fixed document minimum so narrow reflow remains usable at 400-percent zoom, with a dedicated 256-to-320-CSS-pixel safeguard.
- Reviewed landmark, tab, disclosure, live-region, progress, form-label, disabled-action, generated-control, and status semantics at source level for screen-reader compatibility.
- Certified Safari 16.4+ source/fallback compatibility: native details, guarded matchMedia, legacy MediaQueryList listener fallback, vh before dvh, safe areas, momentum scrolling, and progressive visual enhancements.
- Passed all AW-UI-2 focused suites, static release, Cloudflare deployment, frozen API, cross-browser source, JavaScript syntax, secret-hygiene, backend-equivalence, and root-archive checks.
- Dispositioned no open code blocker and approved controlled production deployment. Physical Safari/VoiceOver and Windows screen-reader execution remain post-deploy operational evidence; this package does not claim universal assistive-technology certification.

Acceptance boundary: this sprint certifies the Workspace UI 2 source, interaction, fallback, regression, and deployment contract. It does not change assessment, scoring, consultation, recommendation, completion, inbox, pipeline, SMS, D1, authorization, or server behavior, and it does not represent unperformed physical-device or assistive-technology runs as completed.

## Sprint resumption notes

Use CoverageFit `3.20.66` and this file as the certified AW-UI-2 production baseline. The AW-UI-2 program is complete.

Before starting the next sprint:

1. Run `node AW_UI_2_6_QA.mjs`, `node AW_UI_2_5_QA.mjs`, `node AW_UI_2_4_QA.mjs`, `node AW_UI_2_3_QA.mjs`, `node AW_UI_2_2_QA.mjs`, `node AW_UI_2_1_QA.mjs`, and the deployment/API regression checks.
2. Treat `AW_UI_2_1_CONTRACT.json` through `AW_UI_2_6_CONTRACT.json` as completed boundaries.
3. Preserve the root deployment layout and existing dynamic IDs in `agent/workspace/index.html`.
4. Reuse the current inbox APIs and consultation records; do not introduce parallel state.
5. Preserve `AW_UI_2_6_ACCESSIBILITY_REGRESSION_CERTIFICATION.md` and the release certificate as the production decision record for future Workspace changes.

Expected baseline archive: `CoverageFit_v3.20.66_AWUI2.6_Accessibility_Regression_Certified_ROOT_DEPLOYABLE.zip`.
