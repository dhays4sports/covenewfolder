## 3.20.71 — RC-SMS-1.9.6 Shared Number Operations Certification

- Certified the full pre-port shared-number collision/recovery matrix across CoverageFit, producer/manual texting, appointments, CRM/quote follow-up, service routing, STOP/START, unknown outbound, duplicate webhooks, retries, completed-customer re-entry, and producer release.
- Added a non-destructive protected Operations readiness snapshot for build synchronization, runtime configuration presence, webhook-health evidence, retry state, and relationship/storage evidence without exposing secrets.
- Hardened completed-workflow explicit re-entry to create a fresh workflow episode on the same sender/recipient relationship and clear stale answers.
- Hardened producer release to resume the exact active CoverageFit step only when consent permits.
- Hardened legacy opted-out lazy normalization so preserved pre-takeover workflow state survives without a D1 migration.
- Added RC-SMS-1.9.6 D1 compatibility fixtures, contract, sprint record, and certification matrix.
- Final 408-FARMERS carrier certification remains RC-SMS-1.10.

## 3.20.70 — RC-SMS-1.9.5 Global Consent + Suppression Boundary

- Added authoritative channel-level `smsConsent` state for every 408-FARMERS sender/recipient relationship while preserving the existing D1 storage boundary.
- Made STOP globally suppress CoverageFit, CRM, appointment, quote, service, life, commercial, campaign, system, producer-console, external-registration, and retry programmatic sends.
- Made START restore channel permission only; preserved workflows stay paused/human-owned until explicitly resumed, preventing blind intake restart.
- Added immediate pre-delivery permission re-checks so queued/retry work scheduled before STOP is denied at execution time.
- Added provider consent reconciliation with `unknown`, `active`, `opted_out`, and `blocked` states; provider suppression forces local suppression while provider-active evidence cannot override a customer/application STOP.
- Added protected `/api/sms/consent/` read/reconciliation handling and redacted consent visibility in SMS Operations.
- Distinguished producer-console sends as human-initiated provenance while keeping all programmatic delivery subject to global suppression.
- Advanced live conversation schema to 1.6, orchestration schema to 1.2, outbound registry schema to 1.2, and embedded the 1.9.6 certification roadmap.

## 3.20.69 — RC-SMS-1.9.4 Cross-Workflow Ownership + Producer Continuity

- Added formal `acquire`, `transfer`, `pause`, `resume`, `release`, and `close` ownership operations while keeping one authoritative `sms_conversations` relationship.
- Separated persistent relationship owner from expiring reply context so service, appointment, life, commercial, and system replies can route correctly without surrendering producer ownership.
- Added live conversation schema 1.5 / orchestration schema 1.1 with stable workflow IDs and bounded workflow episode history under the same customer/channel record.
- Added protected producer continuity controls for take ownership, return to CoverageFit, pause/resume automation, close/start workflow, transfer/release ownership, and clear reply context while preserving legacy producer actions.
- Extended the registered SMS gateway with `transfer` and `release` ownership effects, explicit `ownershipTarget`, bounded reply-context TTL, and retry preservation of that provenance.
- Kept manual/unregistered RingCentral outbound human-safe and now clears stale reply context when Dylan personally takes the floor.
- Preserved the exact paused CoverageFit workflow step across producer takeover/resume and kept specialized routes human-safe with no automatic specialized bot response.
- Added no D1 table, migration, or environment variable; advanced the embedded roadmap so RC-SMS-1.9.5 Global Consent + Suppression Boundary is next.

## 3.20.68 — RC-SMS-1.9.3 Multi-Source Outbound Registry + SMS Gateway

- Added a private outbound registry keyed primarily by RingCentral provider message ID, with a ten-minute hashed fingerprint compatibility fallback and durable idempotency results in the existing `sms_conversations` store.
- Added protected `POST /api/sms/send` and `POST /api/sms/outbound/register` boundaries with bounded origin, workflow, reply-route, ownership-effect, and idempotency contracts.
- Routed live CoverageFit automated replies, producer-console handoff resends, and retry delivery through the same gateway instead of allowing hidden direct RingCentral programmatic sends.
- Changed outbound webhook handling to resolve registered source metadata before classifying an outbound event as manual/unknown, while preserving producer-safe takeover for truly unregistered messages.
- Added schema 1.4 last-outbound provenance to the shared live conversation and exposed redacted source/reply-route context in SMS Operations.
- Preserved the existing CoverageFit intake engine, RingCentral transport/client, secure handoff, producer authorization, D1 table boundary, and 1.9.2 human-safe fallback with no new environment variable or migration.
- Advanced the embedded roadmap so RC-SMS-1.9.4 Cross-Workflow Ownership + Producer Continuity is the next authoritative sprint.

## 3.20.67 — RC-SMS-1.9.2 Shared Number Conversation Orchestrator

- Added a dedicated SMS orchestration layer that separates channel status, conversation ownership, automation mode, business workflow, and preserved CoverageFit workflow state.
- Changed live RingCentral routing so explicit CoverageFit intent continues through the existing deterministic intake while fresh ambiguous shared-number messages default to producer-safe handling.
- Preserved the exact CoverageFit step during manual/unregistered outbound takeover instead of allowing `human_takeover` to erase workflow meaning.
- Blocked CoverageFit automated replies while producer ownership is active and synchronized the existing producer pause/resume controls with the new ownership model.
- Added backward-compatible in-place normalization for existing `sms_conversations` records with no D1 migration or new environment variable.
- Extended the protected SMS Operations surface with redacted owner, workflow, workflow-state, and automation-mode visibility.
- Embedded `RC-SMS-ROADMAP.md` with the proceeding RC-SMS-1.9.3 through RC-SMS-1.10 implementation and certification sequence.

## 3.20.66 — AW-UI-2.6 Accessibility and Regression Certification

- Added roving arrow-key, Home, and End navigation to the six Focus Mode stages and restored focus to the active Workspace tab whenever a record or cross-view action hides the initiating control.
- Removed an inherited extra closing section between Recommendation Builder and consultation closeout so landmark, heading, and form relationships remain structurally deterministic.
- Connected screen-reader instructions to the main Workspace, clarified native disclosure names, and gave the mobile action panel an explicit labeled region and guardrail relationship.
- Extended visible focus to links, buttons, inputs, selects, text areas, summaries, and custom focus targets, including inverse header focus and system-color forced-colors treatment.
- Raised warning-text contrast, added increased-contrast preferences, applied comprehensive reduced-motion behavior, and removed the fixed 320-pixel document minimum for 400-percent zoom reflow.
- Certified the complete AW-UI-2.1 through 2.6 contract, current static/deployment/API baselines, cross-browser fallbacks, protected backend equivalence, archive hygiene, and root-deployable structure.
- Approved the Workspace UI 2 program for controlled production deployment while retaining physical Safari/VoiceOver and Windows screen-reader checks as post-deploy operational evidence rather than claiming universal assistive-technology coverage.

## 3.20.65 — AW-UI-2.5 Mobile Agent Console

- Added a bottom-safe mobile action dock that keeps Call, Text, the current consultation stage, and More actions reachable during long consultations.
- Added a bounded native More sheet for Email, Consultation Document, Client Snapshot, and Inbox using the established selected-record destinations, availability, preview, and activity behavior.
- Collapsed derived homeowner context on compact screens while preserving the full wide-desktop sticky snapshot.
- Converted Focus Mode stages into a swipeable snap-aligned strip with horizontal-only selected-stage centering.
- Added iPhone safe-area spacing, 44-pixel-or-larger touch targets, 16-pixel form inputs, short-landscape handling, dynamic-viewport action-sheet limits, and long-content overflow safeguards.
- Kept required guardrails visible and preserved every consultation, checklist, recommendation, completion, inbox, document, SMS, D1, authorization, and Cloudflare deployment contract.

## 3.20.64 — AW-UI-2.4 Sticky Snapshot and Quick Actions

- Reframed the selected-homeowner header as a compact snapshot of homeowner, property, review reason, top priority, consultation status, and recommended next step.
- Bound snapshot facts to the existing assessment, disposition, follow-up, and six-stage Consultation Progress models without creating another customer or workflow record.
- Kept Call, Text, and Email behavior and added Consultation Document and Client Snapshot actions through their existing destinations, availability rules, preview preparation, and activity logging.
- Made the snapshot rail sticky only on wide desktop and safely expandable without sticky positioning at smaller widths.
- Preserved AW-UI-2.3 Focus Mode and every checklist, verification, recommendation, completion, disposition, follow-up, inbox, pipeline, document, SMS, D1, authorization, and Cloudflare deployment contract.

## 3.20.63 — AW-UI-2.3 Guided Consultation Focus Mode

- Added a Focus Mode that presents one existing Consultation Progress stage and its relevant working surfaces at a time.
- Bound Understand, Verify, Discuss, Recommend, Decide, and Next step navigation directly to the established record-derived progress model.
- Added previous, next, direct-stage, and return-to-recommended-stage controls with visible complete, current, needs-attention, and upcoming states.
- Kept supporting context, detailed evidence, and recommendation coaching in the established progressive disclosures.
- Added a one-click full-record view while keeping manual stage navigation view-only and session-only.
- Preserved every checklist, verification, recommendation, completion, disposition, follow-up, consultation, inbox, pipeline, document, SMS, D1, authorization, and Cloudflare deployment contract.

## 3.20.62 — AW-UI-2.2 Inbox-First Agent Navigation

- Made the Producer Inbox the default daily Workspace view while preserving direct consultation links and the existing active-record contract.
- Added four derived queue summaries for all reviews, needs attention, new reviews, and follow-ups due today without creating another queue store.
- Reworked homeowner rows around identity, review reason, property, received time, delivery status, consultation stage, follow-up state, and one primary open/continue action.
- Kept new records unread while the producer is only viewing the Inbox; opening the Consultation view retains the existing server-backed opened-state behavior.
- Moved delivery, stage, and follow-up filters behind accessible progressive disclosure while keeping search immediately available.
- Added connected, saved-device, empty, no-match, clear-filter, sync, and connection-recovery states using the existing secure inbox client.
- Preserved every assessment, scoring, consultation, recommendation, completion, document, pipeline, SMS, D1, authorization, and Cloudflare deployment contract.

## 3.20.61 — AW-UI-2.1 Simplified Workspace Architecture

- Reframed the Agent Workspace around one clear task: choose a homeowner, follow the guided review, and record the next action.
- Applied the SMS Simulator's calmer interaction principles through a CoverageFit navy shell, compact tools menu, restrained elevation, and a five-stage workspace orientation strip.
- Replaced internal sprint language in the primary experience with producer-friendly review, readiness, preparation, conversation, and closeout language.
- Moved operational readiness behind native progressive disclosure while preserving the complete PC-1.5 live-pilot surface and dynamic state.
- Preserved all existing consultation IDs, APIs, storage keys, scoring, recommendations, completion, print, inbox, pipeline, FLOW, and RC-SMS contracts.
- Added the AW-UI-2 roadmap, sprint record, contract, and dedicated static regression certification to the root-deployable package.

## 3.20.60 — HOME-2.9 Mobile, Accessibility & Performance Certification

- Repaired malformed assessment container, summary, and completion markup that could destabilize browser layout and focus behavior.
- Replaced visual-only property captions with true labels; added skip navigation, semantic progress, connected validation, stable question announcements and focus, explicit answer selection state, and short-screen dialog scrolling.
- Added narrow-phone, landscape, safe-area, touch-target, iOS input-size, reduced-motion, and forced-colors safeguards to the Home transition and assessment.
- Replaced the 139 KB assessment header bitmap with the existing SVG logo and changed ordered route scripts to parallel deferred fetching, keeping the assessment initial-transfer contract below 500 KB.
- Preserved HOME-2.8 recovery, one-time property confirmation, seven-day draft continuity, zero-repeat completion, assessment questions, recommendations, two lead points, and Protection Score calculations.

## 3.20.59 — HOME-2.8 Continuity, Branching & Recovery

- Recovered a trusted 408FARMERS Home handoff from the existing browser profile when the short-lived transition marker is missing after refresh or back navigation.
- Added a recent-handoff renter guard that returns a misrouted renter to 408FARMERS renters contact options using a bounded URL with no personal data.
- Preserved owner-occupied, landlord, and buyer handoffs on the existing Home assessment path.
- Reused the existing seven-day CoverageFit assessment draft, one-time property confirmation, contact/consent continuity, and completed consultation record.
- Kept branch and recovery context outside question selection, answer impacts, recommendations, and Protection Score calculations.

## 3.20.58 — HOME-2.7 Campaign Matching & QR Routing

- Accepted the canonical `home_flyer_<ZIP>_<rate|fit>` context from the new 408FARMERS short QR routes and existing query-style routes.
- Added a bounded flyer-context acknowledgement to the secure transition and early assessment explanation.
- Preserved campaign ZIP and variant in the existing completed consultation context for Dylan without adding personal data to the campaign record.
- Kept campaign values outside question selection, weights, answer impacts, recommendations, and Protection Score calculations.
- Preserved HOME-2.6 intent reception, one-time property confirmation, invisible contact/consent reuse, immediate assessment start, and FLOW-1.5 responsiveness.

## 3.20.57 — HOME-2.6 CoverageFit Intent Reception

- Added a bounded, session-scoped receiver for Home review goal, housing context, and timing.
- Personalized the secure transition and assessment opening while keeping entry intent separate from assessment evidence.
- Preserved the existing one-time property confirmation, zero-repeat contact and consent handoff, and immediate assessment continuation.
- Carried the three intent values into Dylan’s existing local and server-backed completed report context without adding another record schema.
- Added an explicit scoring firewall: entry-intent values never select questions, alter weights or answer impacts, or enter Protection Score calculations.

## 3.20.56 — HOME-2.1 Journey Contract and Conversion Baseline

- Accepted and scrubbed the bounded Home intent fields reserved by 408-HOME-2.1.
- Preserved those fields in the prospect and personalization contexts without using them in scoring.
- Mapped existing trusted Home assessment start and completion signals into the shared privacy-safe journey vocabulary.
- Preserved FLOW-1.5 property confirmation, zero-repeat completion, and question-two responsiveness behavior.

## 3.20.55 — FLOW-1.5 Confirmed Assessment Entry and Responsiveness Correction

- Fixed the question-two page freeze by removing recursive child/subtree observation from the intent-payoff checkpoint and making its copy writes idempotent.
- Preserved the existing one-click property confirmation for trusted, structured 408FARMERS handoffs and synchronized it with all property-owning 408FARMERS funnel routes.
- Preserved assessment questions, scoring, recommendations, reports, consultation records, zero-repeat contact reuse, dual lead delivery, and producer alerts.
- Added dedicated observer-loop QA and a real Chromium test covering both manual property confirmation and a professional 408FARMERS quick-confirm handoff through question two.

## 3.20.54 — RC-SMS-1.9.1 Immediate Producer Queue Alerts

- Added immediate, privacy-safe producer email alerts when an SMS intake becomes actionable: completed guided intake, DYLAN request, direct-handling request, or second invalid-response escalation.
- Reused the established Resend delivery configuration with event-scoped idempotency and bounded retries; delivery runs after the customer webhook response is safely committed.
- Added RUSH and test labeling, opaque deep links into the protected SMS Operations queue, redacted alert state, and a protected pre-port test action.
- Preserved customer SMS copy and timing, CoverageFit handoffs, completed-review lead notifications, STOP behavior, producer takeover, and the pre-port RingCentral boundary.

## 3.20.53 — CRO-1.6.2.1 Intent Payoff and Promise Alignment

- Replaced transition `Dashboard` labels with the canonical `Protection Snapshot` promise.
- Reframed generic, buyer, non-renewal, and professional handoffs around customer outcomes instead of internal process language.
- Balanced professional discount motivation with broader protection clarity throughout assessment, completion, and private Snapshot presentation.
- Added a producer-facing professional-program verification action without creating an eligibility result.
- Preserved assessment questions, Protection Score, recommendation rules, zero-repeat contact reuse, dual lead delivery, and non-gated Formspree behavior.

## 3.20.52 — CRO-1.6.2 Professional Intent Continuity

- Strengthened the existing professional transition around the customer’s original discount-review intent.
- Added one bounded presentation module that keeps professional context visible during the unchanged Home assessment, checkpoint, completion, and private Snapshot.
- Updated Dylan’s existing Prospect Story to identify a professional discount eligibility request and its licensed verification requirement.
- Preserved zero-repeat contact handling, dual completion delivery, assessment questions, Protection Score math, recommendation ordering, and producer judgment.
- Added no automated eligibility or discount determination and made no guarantee of qualification, availability, savings, rate, or response time.

## 3.20.51 — PC-1.5 Live Producer Pilot Readiness

- Added one centrally derived live pilot preflight to the existing Agent Workspace without adding another workflow or persistence system.
- Checks the selected saved review, prepared guided consultation, server-backed secure save/recovery state, existing Consultation Document route, and a producer-confirmed Print Preview on the current device.
- Keeps the real-device acknowledgement consultation-specific and memory-only so it cannot be mistaken for a permanent certification or a completed live pilot.
- Gives the producer one next setup action and a clear ready-for-pilot state while preserving the existing Command Center and Current Focus workflow.
- Preserved assessment output, Protection Score, producer judgment, Guided Consultation, Consultation Completion, Consultation Document story, attribution, FLOW, and RC-SMS architecture; 408FARMERS requires no runtime change.
- Added dedicated PC-1.5 QA, a deployed-device pilot runbook, and complete regression, static, deployment, compatibility, API, Cloudflare build, archive, and clean-room verification. Actual Dylan-led Safari/macOS and physical-printer pilot evidence remains a release input for PC-1.6.

## 3.20.50 — PC-1.4 Print/PDF Production Certification

- Added one immutable production-readiness profile over the existing Consultation Document HTML renderer and browser print service.
- Gated printing on a complete shell, US Letter profile, running chrome, page counters, print colors, readable split controls, final-page behavior, and an available browser print function.
- Added a calm output-check state plus producer guidance for Letter portrait, Default or 100% scale, background graphics, browser headers and footers, and final page review.
- Hardened paged-media behavior for long content, heading placement, widows/orphans, responsive assets, and trailing-page prevention without changing document content.
- Preserved assessment output, Protection Score, producer judgment, Guided Consultation, Consultation Completion, attribution, FLOW, and RC-SMS architecture; 408FARMERS requires no runtime change.
- Added dedicated PC-1.4 QA and a synthetic browser-certification harness plus complete regression, static, deployment, cross-browser, API, Cloudflare build, archive, and clean-room verification; deployed-browser execution remains bounded to PC-1.5.

## 3.20.49 — PC-1.3 Consultation Persistence and Recovery Hardening

- Added a minimal checklist progress checkpoint to the existing consultation record while retaining the established checklist engine and device-local key as the canonical working path.
- Restored the newest valid device or consultation-record checkpoint, rejected mismatched or expired plans, and wrote recovered state back to the device for continued offline use.
- Added a same-origin, producer-authorized checklist endpoint with bounded payload validation, newest-write protection, and no homeowner identity in the progress payload or D1 metadata.
- Added debounced secure synchronization, page-exit keepalive, safe offline fallback, and visible saved/recovered/pending status in the Agent Workspace.
- Preserved assessment output, Protection Score, producer judgment, Consultation Completion, Consultation Document, attribution, FLOW, and RC-SMS architecture.
- Added dedicated PC-1.3 recovery QA plus complete regression, static, deployment, Cloudflare build, archive, and clean-room verification.

## 3.20.48 — PC-1.2 Producer Usability Polish

- Added one compact Current Focus guide immediately below the selected homeowner, keeping the producer oriented throughout the long consultation view.
- Reused the existing GC-1.8 six-stage progress model to show the current stage, one next action, completion progress, and truthful earlier-step attention state without creating another workflow engine.
- Made the focus guide sticky on larger screens, static and touch-friendly on smaller screens, and adjusted anchor offsets so guided actions land on visible content.
- Added accessible live guidance and a native progressbar that update whenever existing checklist, recommendation, disposition, or follow-up state changes.
- Preserved consultation persistence boundaries, assessment output, Protection Score, producer judgment, Consultation Document, attribution, FLOW, and RC-SMS architecture.
- Added dedicated PC-1.2 QA plus complete regression, static, deployment, cross-project, build, archive, and clean-room verification.

## 3.20.47 — PC-1.1 End-to-End Consultation Workflow Audit

- Audited the existing 408FARMERS-to-CoverageFit intake, assessment, Agent Workspace, saved consultation, Guided Consultation, homeowner document, and reopen paths.
- Rehydrated the active full consultation record before deriving customer-report and consultation actions, fixing an unavailable customer-report action when only the lightweight queue summary had been read.
- Added the opaque consultation record ID to the existing conversation-plan contract and isolated checklist persistence by that ID, preventing similar homeowner records from sharing browser-local progress.
- Preserved legacy-report fallback behavior when no consultation ID exists and kept checklist state presentation-only and separate from verified facts, recommendations, and completion decisions.
- Preserved zero-repeat handoff, attribution, Protection Score, assessment routing, Recommendation Builder, Consultation Completion, Consultation Document, FLOW, and RC-SMS architecture.
- Added dedicated PC-1.1 workflow continuity QA plus complete regression, static, deployment, build, cross-project, and clean-package verification.

## 3.20.46 — CD-1.8 Producer/Consumer Consistency

- Added one immutable Producer/Consumer Story projection over the existing Command Center, Recommendation Builder, and Consultation Completion models.
- Added a progressive-disclosure Workspace preview showing the review purpose, shared priority order, confirmation details, saved recommendation state, and current next step that carry into the homeowner document.
- Changed the Consultation Document to consume the Command Center priority order and rationale instead of independently ranking its first three findings.
- Carried the same prospect-story narrative, review reason, confirmation details, saved recommendation judgments, completion state, and agreed or working next step into the document models.
- Preserved truthful draft/completed boundaries, producer control, Protection Score math, assessment output, evidence status, attribution, FLOW, and RC-SMS architecture.
- Added dedicated CD-1.8 consistency QA and complete regression, static, deployment, and clean-package verification; the Consultation Document sprint family is complete.

## 3.20.45 — CD-1.7 Consumer Language Pass

- Added one bounded consumer-language layer to the existing Consultation Document presentation pipeline.
- Reworked reader-facing labels and system-generated explanations across the Executive Summary, Protection Snapshot, Property Snapshot, Priority Findings, Recommendations, and Decisions and Next Steps chapters.
- Explained policy summary, rebuilding amount, deductible, annual policy cost, formal insurance quote, confirmation state, and insurance-company authority in direct language.
- Kept homeowner decisions and producer-entered reasoning verbatim while simplifying only CoverageFit-generated copy.
- Preserved Protection Score math and bands, assessment findings, recommendation order and decisions, evidence classifications, consultation completion state, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.7 QA and complete regression coverage; Producer/Consumer Consistency remains deferred to CD-1.8.

## 3.20.44 — CD-1.6 Decisions and Next Steps

- Connected the existing Consultation Document to the GC-1.9 Consultation Completion record.
- Replaced generic closeout placeholders with the producer-recorded homeowner decision, unresolved status and details, formal carrier-quote status and requirements, finding decisions, agreed next action, and saved follow-up context.
- Added explicit completed and draft presentation states so older or unfinished records never appear to contain finalized decisions.
- Kept working context available for draft records while separating it from the authoritative saved closeout.
- Preserved CD-1.4 priority ordering, CD-1.5 recommendation explanations, producer control, assessment output, Protection Score, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.6 QA and complete regression coverage; the Consumer Language Pass remains deferred to CD-1.7.

## 3.20.43 — CD-1.5 Recommendation Explanations

- Connected the existing Consultation Document to the GC-1.6 Recommendation Builder and GC-1.7 Explanation Assist outputs.
- Added a recommendation explanation to each priority finding with status, verification readiness, plain-language meaning, importance, and recorded producer reasoning.
- Preserved safe undecided, unverified, deferred, consider, carrier-quote, and not-recommended states without inventing a professional judgment.
- Expanded topic verification prompts using the existing Explanation Assist guidance while retaining the assessment evidence and current-policy guardrails.
- Preserved CD-1.4 priority ordering, Protection Score math, assessment output, producer control, consultation persistence, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.5 QA and complete regression coverage; Decisions and Next Steps remain deferred to CD-1.6.

## 3.20.42 — CD-1.4 Priority Findings

- Refined the existing Consultation Record into a distinct Priority Findings chapter without creating a new document section or recommendation source.
- Reused the established print recommendation model to order meaningful findings deterministically, limit the primary consultation sequence to three, and preserve older saved-review fallbacks.
- Added explicit conversation sequence, finding summary, priority rationale, and evidence-aware `Check policy`, `Ask homeowner`, or `Discuss and confirm` cues.
- Kept existing consultation questions, producer guidance, verification prompts, and notes in the Recommendations chapter for the bounded CD-1.5 refinement.
- Preserved Protection Score math, assessment output, evidence classification, consultation persistence, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.4 QA and complete regression coverage; Recommendation Explanations remain deferred to CD-1.5.

## 3.20.41 — CD-1.3 Protection Snapshot

- Added one immutable, presentation-only Protection Snapshot model that consumes the authoritative Protection Score bands without recalculating or changing the score.
- Upgraded the existing Review Overview score card with the canonical category, category range, band interpretation, 0–100 position scale, consultation guidance, and explicit decision guardrail.
- Added truthful unscored behavior for missing, malformed, or out-of-range score values.
- Preserved CD-1.1 document architecture, CD-1.2 Executive Summary, assessment methodology, recommendation order, consultation records, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.3 QA and complete regression coverage; Priority Findings remain deferred to CD-1.4.

## 3.20.40 — CD-1.2 Executive Summary

- Refined the existing Review Overview Executive Summary around homeowner identity, review purpose, the assessment narrative, strongest foundation, first focus, confirmation needs, and the next action.
- Advanced the immutable Executive Summary model additively with a centralized overview contract derived only from existing normalized print-model fields.
- Added responsive and print-safe hierarchy for the review-purpose and summary-highlight callouts inside the existing Consultation Document renderer.
- Preserved the CD-1.1 information architecture, Protection Score methodology, assessment routing, recommendation order, consultation records, attribution, FLOW, and RC-SMS systems.
- Added dedicated CD-1.2 QA and complete regression coverage; Protection Snapshot refinement remains deferred to CD-1.3.

## 3.20.39 — CD-1.1 Document Information Architecture

- Added one immutable information-architecture configuration to the existing Consultation Document Print Engine.
- Organized seven canonical chapters into Review Overview, Property & Verification, and Consultation Record parts.
- Added a compact document map with a clear active-part indicator to every existing printable section.
- Renamed the printable artifact Home Protection Consultation, aligned the Agent Workspace action to Consultation Document, and added semantic page/chapter markers for the remaining CD sprint family.
- Preserved the existing document models, recommendation ordering, Protection Score, optional cover, print controls, page counters, secure record access, and three-part rendering pipeline.
- Deferred section-specific content refinement to CD-1.2 through CD-1.7 and producer/consumer consistency certification to CD-1.8.

## 3.20.38 — GC-1.9 Consultation Completion

- Added one structured closeout inside the existing Agent Workspace After phase.
- Captures the homeowner decision summary, explicit unresolved status and details, carrier-quote status and requirements, and the owner/action for the next step.
- Shows the existing recommendation judgments, open assessment/finding signals, and secure follow-up state beside the closeout form.
- Persists the same bounded completion record locally or through the authenticated consultation API and records a redacted operational activity event.
- Advances early records to Consultation completed without closing them or overwriting proposal, decision-pending, or closed dispositions.
- Does not create a carrier proposal, infer a homeowner decision, silently resolve verification work, or change Protection Score, assessment, attribution, reporting, FLOW, or RC-SMS behavior.

## 3.20.37 — GC-1.8 Consultation Progress

- Added one centrally derived six-stage consultation sequence: Understand, Verify, Discuss, Recommend, Decide, and Next step.
- Uses the existing consultation checklist, explicit producer verification, structured recommendation plan, disposition, and secure follow-up state without adding another persistence or API contract.
- Highlights one current action and labels incomplete earlier work as Needs attention when the operational record has moved ahead.
- Links each stage to the existing Command Center, verification map, Guided Questions, Recommendation Builder, disposition, or follow-up surface.
- Keeps deferred findings explicitly unresolved and never promotes homeowner-reported, inferred, or missing information into verified fact.
- Existing assessment, Protection Score, attribution, consultation documents, reporting, FLOW, and RC-SMS architecture remain intact.

## 3.20.36 — GC-1.7 Explanation Assist

- Added one centralized Explanation Assist model to the existing Recommendation Builder.
- Gives each ranked finding four bounded coaching views: what the issue means, why it matters, how to explain it naturally, and what to verify before final advice.
- Uses the current assessment finding, evidence state, topic context, verification attestation, and producer judgment without creating a second finding or recommendation source.
- Adds topic-aware guidance for rebuilding, water, deductibles, roof terms, ordinance or law, belongings, loss of use, liability, umbrella, separate hazards, property use, pools, and detached structures, with a safe general fallback.
- Uses progressive disclosure and readiness labels to reduce workspace clutter for a beginner producer.
- Keeps unverified findings explicitly framed as assessment questions rather than confirmed coverage gaps.
- Does not persist coaching text, select a recommendation, create a quote or proposal, or make a coverage, eligibility, discount, rate, or underwriting claim.
- Existing assessment, Protection Score, attribution, checklist, Recommendation Builder persistence, consultation documents, reporting, FLOW, and RC-SMS architecture remain intact.

## 3.20.35 — GC-1.6 Recommendation Builder

- Added one structured Recommendation Builder beneath the existing guided consultation flow.
- Uses the GC-1.3 ranked findings and existing evidence classifications instead of creating a new recommendation source.
- Requires an explicit producer verification attestation before a finding can be marked `Recommend for carrier quote`.
- Supports `Not decided`, `Discuss / consider`, `Recommend for carrier quote`, `Defer`, and `Not recommended after review` judgments.
- Requires producer reasoning for recommended and not-recommended findings and keeps that reasoning distinct from CoverageFit’s assessment rationale.
- Persists recommendation plans inside the existing browser-local or secure server-backed consultation record, with normalized activity and operational metadata.
- Does not create carrier proposals, guarantee coverage, or convert homeowner-reported or inferred information into verified fact.
- Existing assessment, Protection Score, attribution, checklist, consultation document, reporting, FLOW, and RC-SMS architecture remain intact.

## 3.20.34 — GC-1.5 Guided Questions

- Added one centrally derived Guided Questions model to the existing conversation planner.
- Orders unanswered assessment details, partial answers, policy checks, property confirmation, and ranked findings into a bounded next-question sequence.
- Preserves the actual assessment follow-up question and recommendation conversation-starter wording instead of introducing a generic script library.
- Suppresses duplicate finding questions when the same assessment key already needs clarification or policy verification.
- Added a calm `What to ask next` surface to the existing During phase with question purpose, source context, and concise selection reasoning.
- Existing checklist, agenda, Protection Score, assessment, attribution, reporting, consultation documents, and RC-SMS architecture remain intact.

## 3.20.33 — GC-1.4 Verify Before Advising

- Added one centrally derived verification-status map to the existing Consultation Command Center.
- Explicitly separates `Known`, `Inferred`, `Missing`, and `Needs confirmation` information for beginner-friendly consultation preparation.
- `Known` means a clear homeowner-reported answer, not an independently verified policy fact.
- `Inferred` findings are visibly identified as CoverageFit interpretations derived from assessment responses.
- Missing answers remain distinct from partial homeowner details, policy checks, and unconfirmed property information.
- Existing evidence quality, priority ranking, Protection Score, assessment, attribution, reporting, consultation records, and RC-SMS architecture remain unchanged.

## 3.20.32 — GC-1.3 Priority Findings

- Replaced the Command Center's pass-through priority list with one centrally derived, three-item consultation sequence.
- Uses the assessment's existing `priorityScore`, weighted penalty, finding type, review-reason relevance, property relevance, and evidence quality as deterministic ranking signals.
- Shows `Discuss first`, `Discuss next`, and `Then review`, plus a concise explanation of why each finding belongs in that position.
- Adds bounded `Check policy`, `Ask homeowner`, or `Discuss finding` cues from the existing evidence classification.
- Older saved reports retain deterministic priority-label and source-order fallbacks.
- Raw scores stay hidden; Protection Score math, assessment output, the full recommendation list, evidence classifications, attribution, reporting, consultation records, and RC-SMS architecture remain unchanged.

## 3.20.31 — GC-1.2 Prospect Story

- Added a concise Prospect Story inside the existing Consultation Command Center.
- Extended the additive Workspace snapshot with separate occupation, housing, buyer, urgency, referral, campaign, entry-surface, and SMS context already preserved in completed reports.
- Added safe stories for homebuyer, professional, home + auto, general homeowner, referred, direct, web, SMS, and time-sensitive journeys.
- Kept the homeowner’s review reason separate from occupation, campaign, referral, housing, and entry context.
- Internal IDs remain hidden, and professional or urgent language makes no eligibility, discount, rate, underwriting, coverage, or timing promise.
- Corrected date-only policy renewal rendering so west-of-UTC browsers do not display the prior calendar day.
- Existing assessment, Protection Score, recommendation, evidence, attribution, consultation-record, reporting, and RC-SMS contracts remain intact.

## 3.20.30 — GC-1.1 Consultation Command Center

- Added one centrally derived command center to the existing Agent Workspace.
- The selected consultation now immediately answers Who, Why, Status, Top Priorities, Verify, and Next Action.
- Review reason remains distinct from occupation, campaign, referral, and other acquisition context.
- Priority findings retain the assessment's existing recommendation order; verification items retain existing evidence classifications and order.
- Next actions link into the existing evidence, guided-checklist, and disposition workflow without adding a parallel consultation system.
- Assessment, Protection Score, recommendation, evidence, attribution, reporting, consultation-record, and RC-SMS contracts remain unchanged.

## 3.20.29 — FLOW-1.4 Entry-Specific Transition Messaging

- The existing transition route now centrally derives messaging for homebuyer, professional, home + auto, general homeowner, and time-sensitive entries.
- Professional messaging incorporates occupation context into the broader home protection review without promising eligibility or discounts.
- Home + auto messaging prepares the home portion of the existing assessment without creating a bundle-specific assessment or promising savings.
- Time-sensitive messaging carries explicit RUSH context forward while stating that coverage availability and timing still require confirmation.
- Web buyer closing, occupancy, urgency, partner, referral, and launch-surface context is now persisted and scrubbed by the existing prefill pipeline.
- Existing assessment routing, attribution, legacy `segment` fallback, and RC-SMS architecture remain intact.

## 3.20.28 — FLOW-1.3 Semantic Entry Context

- CoverageFit prefill intake advances to v1.3 and accepts separate `review_context`, `occupation_segment`, and `housing_context` parameters.
- `review_context` is now the canonical reason-for-review value; legacy `segment` is retained only as a backwards-compatible fallback.
- Occupation and housing context are persisted independently on the prospect profile and normalized personalization journey.
- The new fields are included in browser URL scrubbing alongside existing prefill PII/context parameters.
- No assessment, recommendation, or consultation logic was duplicated.

## 3.20.27 — RC-SMS-1.9 Operations Dashboard + Reliability

- Added protected `/agent/sms-operations/` dashboard for conversation status, CoverageFit progression, retry jobs, webhook health, campaign activity, and redacted audit history.
- Added persisted retry jobs for failed automated RingCentral sends with bounded retry attempts.
- Added webhook health counters and failure timestamps, stale conversation classification, configurable operational retention, and cleanup controls.
- CoverageFit secure handoff resolution now marks the originating SMS conversation as started; completed private snapshots mark the originating SMS conversation as CoverageFit completed.
- Added redacted operational audit events for producer actions and delivery/webhook failures.
- Reused the existing `sms_conversations` D1 table with prefixed records; no new database migration required.

## 3.20.26 — RC-SMS-1.8 Homeowner, Bundle + Expanded RUSH Paths

- Added deterministic current-home review and home+auto SMS paths using the existing conversation engine.
- Added bounded servicing, landlord, business, life, and special-request routing to Dylan.
- Expanded RUSH so priority persists across supported guided paths without coverage or turnaround guarantees.
- Extended secure SMS handoff and producer summaries with path-specific context while preserving opaque token URLs.
- No database migration required.

## 3.20.25 — RC-SMS-1.7 Producer Handoff + Manual Takeover

- Completed buyer SMS intake now transitions from secure CoverageFit-link delivery into `awaiting_producer` with a concise Dylan-ready summary.
- RingCentral outbound webhook events now distinguish known automation/operator message echoes from genuine producer replies.
- A genuine manual RingCentral reply records a producer transcript item and immediately moves the conversation to `human_takeover`, suppressing further automation.
- Added a producer-authenticated SMS handoff API for queued/takeover conversations with pause, resume, secure-link resend, complete, and not-proceeding controls.
- Extended the protected SMS Connection Lab with a producer summary and takeover-control simulation.
- Reused the existing SMS D1 conversation records; no new migration or parallel operations store was introduced.

## 3.20.24 — RC-SMS-1.6 Realtor Partner Attribution

- Added server-side, deployment-configured realtor partner code registry for text-first SMS attribution.
- Partner codes are removed before SMS command/intent interpretation and persist on the existing conversation record.
- Secure CoverageFit handoffs carry canonical partner identity server-side without exposing realtor identity in the public token URL.
- Existing CoverageFit prospect/report integration retains partner attribution through the zero-repeat journey.
- Synchronized 408FARMERS buyer text links to support `partner_code` / `Ref: CODE`.

## 3.20.23 — RC-SMS-1.5 Secure Personalized CoverageFit Continuation

- Added a 24-hour opaque SMS handoff token backed by a dedicated D1 table.
- Completed homebuyer SMS conversations now receive a secure CoverageFit continuation link.
- Added `/sms/continue/` and `/api/sms/handoff/read` to resolve buyer context without exposing property or purchase details in URLs.
- Existing CoverageFit personalization and transition storage receives the buyer address, closing context, occupancy, auto-review interest, and urgency.
- Added safe generic fallback behavior for invalid or expired handoffs.
- Extended the protected simulator to display and open the generated continuation link.

## 3.20.22 — RC-SMS-1.4 Complete Homebuyer SMS Intake

- Extends the live and simulated buyer route through property address, closing date, occupancy, and auto-review interest.
- Accepts exact, numeric, month-name, relative, weekday, and bounded approximate closing timing.
- Flags past and invalid dates for clarification without losing the conversation state.
- Adds explicit and automatic RUSH priority while stating that priority does not guarantee coverage, eligibility, or turnaround time.
- Preserves captured buyer context through HELP and personal-handoff commands.
- Keeps non-buyer top-level intents safely queued for Dylan and defers the secure CoverageFit continuation to RC-SMS-1.5.
- Reuses the existing SMS D1 table and RingCentral configuration with no new migration.
- Adds RC-SMS-1.4 simulator, live-webhook, continuity, urgency, and regression coverage.

## 3.20.21 — RC-SMS-1.3 Intent Router and Messaging Controls

- Replaces the live one-welcome boundary with deterministic Buyer, Home Review, Home and Auto, and Other intent routing.
- Recognizes numeric and bounded natural-language requests, including first-message buyer and realtor-referral language.
- Adds STOP, START, RESTART, HELP, DYLAN, and AGENT command behavior.
- Allows one helpful invalid-response retry before automatically queuing the conversation for Dylan.
- Keeps queued, human-takeover, completed, and opted-out conversations from producing repetitive automation.
- Adds structured live intent, retry, command, opt-out, resume, and outbound-count persistence without changing the D1 schema.
- Updates the protected simulator, documentation, and RC-SMS-1.3 acceptance coverage.

## 3.20.20 — RC-SMS-1.2 RingCentral Live Connection

- Adds server-side RingCentral JWT authentication with bounded access-token caching and no browser-visible credentials.
- Adds a public HTTPS webhook route that echoes RingCentral validation challenges and verifies the configured validation token for live events.
- Adds inbound instant-SMS normalization, destination checks, opaque hashed conversation IDs, D1 persistence, and duplicate message-event locking.
- Sends one compliant welcome response to the first valid inbound SMS through the configured temporary RingCentral number.
- Suppresses repeated welcome replies, ignores outbound/non-SMS/wrong-destination events, and records STOP without sending an automated response.
- Adds protected connection health checks for sender assignment, `SmsSender` capability, and webhook subscription status.
- Adds a protected action to create or renew the RingCentral instant-SMS webhook subscription.
- Keeps the RC-SMS-1.1 simulator independent and fully functional without RingCentral configuration.
- Adds RC-SMS-1.2 acceptance coverage and deployment documentation.

## 3.20.19 — RC-SMS-1.1 Conversation Engine and Simulator

- Adds a deterministic server-side 408FARMERS SMS conversation engine that can be exercised before RingCentral is connected.
- Adds a protected internal simulator at `/agent/sms-simulator/` using the existing producer access key and session-only browser storage.
- Persists opaque simulator conversations in the new D1 `sms_conversations` table so refreshes resume the same test conversation.
- Adds duplicate-message ID protection, bounded transcript retention, explicit state transitions, restart behavior, and operator-state controls.
- Supports a complete fictional buyer-path simulation through address, closing timing, occupancy, bundle interest, and CoverageFit-ready status.
- Restricts simulator phone input to reserved North American 555 test numbers and keeps phone, property, and access-key data out of URLs.
- Sends no live SMS and requires no RingCentral credentials; live webhook and outbound-SMS integration remains RC-SMS-1.2.

## 3.20.18 — NP-1.5 End-to-End Referral Attribution

- Adds privacy-safe, server-deduplicated events for share-module view, share click, referred visit, assessment start, and successful referred completion.
- Requires a matching durable server-backed Home report before a referral completion can be recorded.
- Preserves the originating anonymous referral identity and bounded campaign context through the existing 408FARMERS bridge, CoverageFit Home welcome, assessment, and submission flow.
- Adds canonical A/B flyer identifiers for any five-digit ZIP: `home_flyer_<ZIP>_rate` and `home_flyer_<ZIP>_fit`.
- Carries `campaign_id`, `campaign_variant`, and `campaign_zip` through 408FARMERS forms, CoverageFit attribution, personalization, report integration, and referral-event metadata.
- Stores only privacy-limited campaign, channel, five-digit ZIP, timestamp, and one-way deduplication context; no homeowner identity, contact information, full address, raw report ID, raw session ID, answers, score, or policy data.
- Adds the `referral_events` D1 migration, Cloudflare Pages Function route, NP-1.5 acceptance coverage, and paired 408FARMERS contract tests.

## 3.20.17 — NP-1.4 408FARMERS Referral Bridge

- Moves unique neighbor-share links to clean `408farmers.com/neighbor/r/[anonymous-token]` paths.
- Changes the generic sharing fallback to `408farmers.com/neighbor/`.
- Preserves the same anonymous token across SMS, native share, and copy actions after the public-domain change.
- Retains the existing CoverageFit Home referred welcome, server token verification, and single intake implementation.
- Cleans referral and bridge parameters from the visible CoverageFit Home URL after session capture.
- Coordinates with the 408FARMERS full-screen bridge, bounded campaign pass-through, safe invalid-token fallback, and stable back-button navigation.
- Adds dedicated NP-1.4 and cross-repository acceptance coverage.

## 3.20.16 — NP-1.3 Anonymous Referral Links

- Added one random, non-sequential, 90-day referral token for each acknowledged, durable Home Coverage Review.
- Added idempotent `POST /api/referrals/create` and privacy-limited `POST /api/referrals/read` Cloudflare Pages Functions backed by the new D1 `referral_links` table.
- Reused the same token across Text a Neighbor, native share, and copy-link actions while adding bounded `sms`, `native`, or `copy` channel markers.
- Stored only a one-way origin submission identifier plus campaign source, campaign, medium, content, entry path, five-digit ZIP, and creation timestamps; no homeowner or recipient PII is placed in referral URLs or records.
- Added safe generic-neighbor fallback for malformed, unavailable, expired, local-only, or temporarily unavailable referral links without changing the existing successful-submission or report behavior.
- Added NP-1.3 deployment documentation, D1 migration, and automated acceptance coverage.

## 3.20.15 — NP-1.2 Referred Homeowner Welcome

- Added a referral-specific CoverageFit Home welcome for the exact `ref=neighbor` route.
- Added the headline **A Neighbor Shared This Home Coverage Review With You**, the five-minute review CTA, and clear non-instant-quote expectations.
- Added session-scoped refresh continuity with a six-hour expiry and no referrer, recipient, contact, property, report, or assessment data.
- Added safe fallback behavior for missing, invalid, duplicated, expired, and non-Home referral states.
- Updated NP-1.1 sharing to use the functional `https://coveragefit.com/home/?ref=neighbor` destination until the 408FARMERS referral bridge is implemented in NP-1.4.
- Preserved the existing CoverageFit Home page, assessment, scoring, lead submission, private Snapshot, personalized onboarding, and direct-visitor experiences.
- Added NP-1.2 documentation and automated acceptance coverage.

## 3.20.14 — NP-1.1 Post-Submission Share Module

- Added a voluntary neighbor-sharing section to the matching private Home Protection Snapshot after an acknowledged successful lead submission.
- Added **Text a Neighbor**, native **Share the Review**, and explicit **Copy link** actions using the canonical `https://408farmers.com/` destination.
- Added iPhone/iPad and Android SMS formats plus desktop clipboard and selectable-link fallbacks.
- Added a short-lived, session-scoped, privacy-safe success receipt so direct report visits, failed submissions, expired receipts, and mismatched report links never display the module.
- Added dismissible, responsive, accessible, and print-excluded presentation without changing assessment, scoring, report, Formspree, secure consultation, or redirect contracts.
- Added NP-1.1 documentation and automated acceptance coverage.

## 3.20.13 — CONV-1.1 Zero-Repeat Handoff

- Routed recognized 408FARMERS Home handoffs from the animated transition directly to the assessment while preserving CoverageFit Home for direct traffic.
- Added a visible 408FARMERS-to-CoverageFit bridge and five-minute-review destination language.
- Added one-click confirmation for complete transferred addresses with an editable fallback and optional property details.
- Carried forward valid contact fields and required only missing information or missing contact permission.
- Automatically submitted eligible completed assessments through the existing private report, local consultation, Cloudflare D1, Formspree, and producer-notification workflow before opening the Snapshot.
- Preserved missing-data, incomplete-assessment, private-report, D1, and browser-local fallback behavior.
- Preserved Protection Score calculations, assessment configuration, evidence classifications, recommendation ordering, Agent Workspace normalization, D1 schema, producer authentication, and notification contracts.

## 3.20.12 — DOC-1.2 Call-Ready Consultation Guide

- Renamed and reorganized the internal document around a live homeowner consultation.
- Replaced the compressed four-column topic layout with a sequential What we know, Ask, What to explore, Check, and Notes flow.
- Increased minimum readable type and removed the fixed three-page compression.
- Hid unavailable property and policy fields while preserving all known values.
- Added topic-level notes plus structured decisions, missing-information, owner, due-date, and follow-up capture.
- Simplified evidence labels without changing evidence-quality data.
- Enabled print page counters so the guide can grow beyond three pages when needed.
- Preserved print adapters, immutable report data, scoring, recommendation ordering, D1, authentication, private reports, and producer notifications.

## 3.20.11 — AW-7.1 Consultation-First Agent Workspace

- Made the selected homeowner consultation the default Workspace experience.
- Added separate Consultation, Inbox, and Pipeline views while preserving all existing capabilities.
- Added a compact active-customer header with call, text, email, and consultation-switching actions.
- Organized the active record into Before, During, and After phases.
- Combined the conversation timeline and consultation checklist into one working consultation flow.
- Collapsed secure inbox setup automatically after connection while preserving session-only authentication.
- Simplified producer-facing evidence and document labels without changing underlying evidence states.
- Improved mobile pacing, touch targets, and nested-scroll behavior.
- Preserved D1, authentication, scoring, reports, pipeline calculations, follow-up, disposition, notes, activity, private reports, and producer notifications.

## 3.20.10 — ASMT-1.8 Consumer Clarity and Completion Optimization

- Collapsed optional property details while keeping required address confirmation visible.
- Added a presentation-only consumer copy layer for simpler question and answer language.
- Replaced live evidence-quality jargon with friendly homeowner guidance while preserving evidence metadata.
- Converted the early insight into a non-blocking inline checkpoint.
- Updated the assessment estimate to about five minutes.
- Improved mobile question density and navigation pacing.
- Preserved the Protection Score, scoring inputs, evidence logic, continuity, reporting, D1, and producer notifications.

## 3.20.9 — ASMT-1.7 Assessment Continuity and Respectful Exit

- Added a seven-day local draft contract that saves the current question, exact answer selections, early-insight state, and confirmed-property state throughout the Home assessment.
- Added a visible Save & Exit control, a pause-confirmation dialog, and a returning-user dialog with Continue My Review and Start Over choices.
- Returning homeowners resume at the stable saved question key with prior selections restored; expired drafts are deleted automatically.
- Added a CoverageFit Home confirmation notice after a homeowner pauses the assessment.
- Kept incomplete drafts entirely local and prevented them from creating a Protection Score, private report, consultation record, D1 submission, Formspree submission, or producer notification.
- Added paused, resumed, expired, restarted, and continuity-completed analytics events.
- Preserved the Home question set, weights, answer impacts, evidence classifications, Protection Score, category scores, property and review-reason prioritization, reports, Workspace, D1, and notification paths unchanged.

## 3.20.8 — RPT-1.3 Agent Workspace Customer Report Recovery

- Fixed Agent Workspace customer-report links that could open an unavailable state when the consultation record existed but its durable private-report record or opaque report ID was unavailable.
- The Workspace now caches the active consultation report before navigation and marks the route as an explicit Workspace preview.
- The customer report route now uses that same-origin Workspace copy only when opened from the Workspace and the durable lookup is missing or unavailable.
- Normal customer-facing private links retain their existing expiration, deletion, and no-stale-cache behavior.
- Updated current Agent Workspace configuration language from Netlify to Cloudflare while preserving historical migration documents.

## 3.20.7 — CONS-2.1 Privacy-Safe New Review Notification

- Added one server-side producer email alert when a new completed Home review reaches the secure inbox.
- Kept email content generic and excluded homeowner identity, contact, property, score, findings, review reason, report tokens, campaign, and session data.
- Added Cloudflare request-lifecycle background delivery, Resend idempotency, timeout handling, one bounded retry for temporary errors, and non-blocking failure behavior.
- Added persistent sent, failed, skipped, pending, and legacy notification states plus truthful Agent Workspace delivery language.
- Added a producer-notified activity event only after provider acceptance and preserved duplicate-send protection.
- Preserved assessment, scoring, report, evidence handoff, consultation, pipeline, private-report, Cloudflare, and browser-local behavior.

## 3.20.6 — ASMT-1.6 Evidence-Aware Consultation Handoff

- Added one normalized producer handoff that separates confirmed homeowner-reported facts, policy-verification items, and unresolved questions.
- Added an Assessment Evidence card to the existing Agent Workspace and preserved evidence state across recommendations, timeline items, and checklist tasks.
- Added a bounded evidence-alignment step to the Conversation Planner so the producer resolves open evidence before relying on recommendation topics.
- Added the same grouped handoff and evidence-aware topic labels to the certified Consultation Document.
- Preserved legacy-report compatibility with a truthful manual-review state and retained the existing consultation, private-report, Cloudflare, and browser-local workflows.
- Preserved assessment questions, evidence classifications, weights, answer impacts, penalties, category scores, Protection Score, property and review-reason boosts, and recommendation ordering.

## 3.20.5 — ASMT-1.5 Assessment Completion and Evidence Quality

- Added a versioned evidence-quality layer that classifies each active finding as confirmed, partial, needing verification, or missing without adding assessment questions.
- Added answer-level evidence feedback and a completed-Snapshot summary showing clear responses, follow-up items, and unanswered required topics.
- Added first-missing-question recovery at Snapshot finalization and contact submission so dynamically incomplete assessments cannot be treated as complete.
- Preserved question weights, answer impacts, weighted penalties, category scores, Protection Score, property boosts, review-reason boosts, and priority ordering.
- Persisted per-finding evidence metadata and a report-level completion summary through private reports and Agent Workspace normalization.
- Added client- and server-side rejection of reports explicitly marked incomplete while preserving compatibility with legacy reports that predate the completion contract.

## 3.20.4 — ASMT-1.4 Review-Reason-Aware Assessment Prioritization

- Added bounded question context and priority-ordering adjustments for home purchase, annual renewal, non-renewal or cancellation, and premium-increase reviews.
- Preserved every question weight, answer impact, category calculation, and Protection Score formula; review reason changes ordering and explanation only.
- Added a distinct visible review-reason callout on relevant questions and transparent report metadata showing the applied reason, contextual questions, and priority boosts.
- Added non-renewal normalization before generic renewal matching and explicit language that CoverageFit does not infer carrier action reasons or predict eligibility.
- Added scenario tests proving identical answers receive identical scores across journeys while producing deliberately different discussion-priority ordering.

## 3.20.3 — ASMT-1.3 Property-Aware Assessment Personalization

- Preserved the eleven-question, 100-weight universal Home assessment while adding conditional questions only for homeowner-confirmed pools, detached structures, and roofs at least 15 years old.
- Added confirmed property context to rebuilding questions and a bounded older-home priority boost to building-code term verification without changing the numeric score.
- Added visible question-level personalization explanations, property-aware report metadata, active-question diagnostics, and transparent applicability reasons.
- Prevented unverified provider or public-record values from activating questions and explicitly prohibited underwriting, eligibility, valuation, hazard, condition, and coverage conclusions.
- Added scenario-based activation, normalization, priority-ordering, privacy, and backward-compatibility tests.

## 3.20.2 — ASMT-1.2 Assessment Question Validity and Bias Audit

- Rewrote Home assessment prompts around verifiable review history, confirmed policy terms, deliberate decisions, exposure review, and practical financial readiness.
- Removed fixed-limit and product-ownership assumptions, including the automatic treatment of `$500,000 or higher` liability as universally strong and the automatic penalty for deliberately declining an umbrella after review.
- Added truthful answer paths for unknown deductibles, partial water-term knowledge, review-history uncertainty, and separate building-code, settlement-method, and temporary-living-expense states.
- Added a neutral Separate Hazards domain covering earthquake, flood, and other causes of loss commonly handled outside a standard home policy.
- Preserved the normalized 100-point scoring methodology while recalibrating all affected findings and adding question-level validity, bias, and scenario tests.

## 3.20.1 — ASMT-1.1 Protection Score Methodology and Normalization

- Defined the Protection Score as a response-based measure of review readiness and clarity rather than a determination of policy adequacy.
- Replaced raw point subtraction with one normalized weighted formula for the overall score and every category score.
- Set Home question weights to exactly 100 and bounded every answer impact between 0 and 1 so no answer can deduct more than its assigned weight.
- Distinguished strengths, considerations, uncertainty, and identified gaps, with deliberate materiality-based priority and strength ranking.
- Centralized the authoritative score bands across assessment, reports, Agent Workspace, Business report compatibility, and consultation print output.
- Added transparent methodology documentation, payload diagnostics, and scenario-based calibration coverage.

## 3.20.0 — OPS-CF-1.1 Cloudflare Runtime Migration

- Preserved the existing GitHub repository and Cloudflare Pages deployment while replacing all Netlify Functions with Cloudflare Pages Functions under `/functions/api/`.
- Replaced Netlify Blobs with a Cloudflare D1 schema for consultation records, private prospect reports, and API rate-limit buckets.
- Added an idempotent D1 migration, Pages route manifest, Cloudflare setup guide, preview-environment contract, and Wrangler reference configuration.
- Preserved all existing `/api/consultations/*` and `/api/reports/*` browser contracts, producer authentication, opaque prospect report links, 30-day report expiration, and browser-local fallbacks.
- Removed the Netlify runtime configuration and `@netlify/blobs` dependency.

## 3.19.31 — RPT-1.2 Private Durable Prospect Report Access

- Replaced customer name, property, campaign, and session query parameters with a 256-bit opaque report identifier stored in the URL fragment.
- Added same-origin Netlify Functions and a dedicated Netlify Blobs store for private prospect reports with body-based token retrieval, 30-day expiration, no-store responses, hashed storage keys, and truthful unavailable or expired states.
- Added cross-device report retrieval, temporary cached recovery, and a clearly labeled one-day device-only fallback when server storage is unavailable.
- Minimized the server-delivered prospect payload by excluding contact details, session identifiers, consultation identifiers, and internal personalization records.
- Updated the Agent Workspace customer-report action to open the active consultation's private report link while retaining legacy browser-local preview compatibility.

## 3.19.30 — RPT-1.1 Prospect Snapshot Composition and Print Compression

- Replaced the stacked customer report with one focused three-page Home Protection Snapshot.
- Removed the duplicate executive cover, repeated score, repeated strengths, repeated priority views, action timeline, and duplicate conversion CTA.
- Consolidated the Protection Preparedness Score and category breakdown into one overview and preserved three educational priority cards with plain-language findings, why-it-matters context, and questions to discuss.
- Removed customer-facing confidence percentages and added deterministic three-page Letter print composition with explicit page labels.
- Generated and visually inspected a populated three-page Chromium PDF; macOS Safari certification remains scheduled for live production certification.

## 3.19.29 — DOC-1.1 Consultation Document Production Audit and Compression

- Replaced the default multi-section internal report packet with a focused three-page agent consultation document: Consultation Brief, Property and Current Coverage, and Coverage Conversation Guide.
- Fixed reconstruction limit, deductible, current carrier, current premium, and renewal-date propagation from saved consultation records into the Print Engine.
- Preserved recommendation explanations, conversation questions, producer direction, and confirmation evidence in the generated document.
- Fixed year formatting and duplicated generated-language patterns, made the branded cover optional, and added customer contact, review reason, missing information, decision space, and next-action content.
- Verified a populated Letter-size PDF as three pages with backgrounds, headers, footers, and deterministic page labels; Chrome and Safari-specific print certification remains scheduled for the live deployment environment.

## 3.19.28 — CONS-2.0 Consultation Pipeline Trend and Export

- Added date-bucketed consultation-volume and policy-bound conversion trends to the existing Agent Workspace reporting surface.
- Added accessible trend detail with daily, weekly, monthly, quarterly, or yearly buckets selected automatically from the active reporting window.
- Added a downloadable, formula-safe UTF-8 pipeline CSV containing one consultation row for the selected date range.
- Preserved date and source segmentation, queue scoping, secure inbox synchronization, disposition, follow-ups, notes, activity, documents, reports, and browser-local fallback.

## 3.19.27 — CONS-1.9 Consultation Pipeline Date Range and Source Segmentation

- Added all-time, 7-day, 30-day, 90-day, and bounded custom reporting ranges to the existing Agent Workspace pipeline summary.
- Applied the selected date range consistently to pipeline totals, stage counts, final outcomes, and the existing consultation queue.
- Added campaign, referral-source, and entry-source breakdowns with truthful unattributed buckets.
- Preserved secure inbox synchronization, disposition, follow-ups, notes, activity, consultation documents, reports, and browser-local fallback.

## 3.19.26 — CONS-1.8 Consultation Pipeline Summary and Outcome Reporting

- Added a pipeline summary to the existing Agent Workspace using all synchronized consultation records.
- Added total, open, closed, and policy-bound metrics plus stage-by-stage counts and closed-outcome reporting.
- Added stage-summary actions that focus the existing consultation queue without changing the underlying records.
- Preserved secure inbox synchronization, disposition, follow-ups, notes, activity, documents, reports, and browser-local fallback.

## 3.19.25 — CONS-1.7 Consultation Outcome and Disposition

- Added a persistent consultation workflow stage and final outcome to the existing Agent Workspace.
- Added server-backed disposition persistence, validation, metadata, inbox counts, and activity events.
- Added stage filtering, queue badges, optional disposition notes, closing outcomes, and reopening behavior.
- Preserved delivery lifecycle, follow-up queue, notes, consultation documents, reports, and browser-local fallback.

## 3.19.24 — CONS-1.6 Consultation Notes and Activity Timeline
- Added persistent producer notes to server-backed homeowner consultation records.
- Added a chronological activity timeline for delivery, opening, acknowledgment, follow-up changes, notes, and consultation document access.
- Added an authenticated same-origin activity endpoint while preserving browser-local fallback records and existing inbox workflows.
- Preserved consultation search, filters, follow-up queue, documents, reports, planner, checklist, and assessment behavior.

## 3.19.23 — CONS-1.5 Producer Inbox Search, Filters, and Follow-Up Queue
- Added searchable, filterable consultation queue controls to the existing Agent Workspace.
- Added server-backed follow-up scheduling with due date, action note, completion, clearing, and urgency states.
- Added overdue, due-today, upcoming, completed, and unscheduled queue organization without changing consultation content ordering.
- Preserved secure inbox authentication, delivery lifecycle, browser-local fallbacks, consultation documents, reports, planner, and checklist workflows.

## 3.19.22 — CONS-1.4 Producer Inbox Delivery State and Record Acknowledgment
- Added a server-backed consultation lifecycle with delivery timestamps and New, Opened, and Acknowledged producer states.
- Added an authenticated same-origin status endpoint that advances consultation records without allowing lifecycle downgrades.
- Added delivery-state badges, timestamps, new-record counts, automatic opened tracking, and an explicit Acknowledge review action to the existing Agent Workspace.
- Preserved browser-local consultation records, secure inbox authentication, remote synchronization, consultation documents, and all existing Workspace workflows.

## 3.19.21 — CONS-1.3 Server-Backed Producer Inbox Foundation
- Added same-origin Netlify Functions that persist completed Home consultation records in Netlify Blobs with payload validation, bot trapping, and request rate limits.
- Added a producer-authenticated inbox endpoint that fails closed until a Functions-scoped access key is configured.
- Added a session-only secure inbox connection and sync workflow to the existing Agent Workspace, importing remote records into the established consultation selector, document, planner, checklist, and print pipelines.
- Preserved browser-local consultation records and Formspree submission as resilient fallbacks when the remote inbox is unavailable.

## 3.19.20 — CONS-1.2 Consultation Document Access
- Added a visible Open consultation document action for the active saved homeowner review in the existing Agent Workspace.
- Added an internal consultation document route that loads the selected opaque consultation record and generates the existing Print Engine document from that record.
- Added an in-document Print / Save PDF control that opens the browser print dialog while preserving the existing customer report and Workspace workflows.
- Added accessible loading, empty, error, and print-status states without exposing customer information in the URL.

## 3.19.19 — CONS-1.1 Completed Review Consultation Handoff
- Added a durable browser-local consultation record store for completed Home Coverage Reviews.
- Created the consultation record only after the homeowner submits the completed review, preserving the final contact, property, review-reason, score, and recommendation payload.
- Added a saved-record selector to the existing Agent Workspace so producers can reopen earlier homeowner reviews instead of seeing only the latest overwritten report.
- Preserved the legacy `coveragefit_home_report` key as a compatibility mirror for the existing report, print, planner, and checklist pipelines.

## 3.19.18 — TX-2.0 Home Protection Dashboard Handoff
- Converted the existing personalized Home arrival into a dashboard-first handoff without creating a separate route.
- Added a truthful readiness summary for contact intake, property context, review reason, and Coverage Review availability.
- Reused the canonical session personalization context and existing completion receipt while preserving direct-visitor behavior.
- Kept the assessment destination, editable saved data, privacy boundaries, and all TX-1.1 through TX-1.9 behavior intact.

## 3.19.17 — TX-1.9 Transition Polish
- Consolidated transition motion into scoped duration and easing tokens while preserving the existing two-second onboarding sequence.
- Refined entrance, milestone, property, final-state, mobile, and exit motion without changing transition content or routing.
- Deferred initial focus until the first painted frame, expanded the mobile continuation target, and strengthened reduced-motion behavior.
- Added page-exit cleanup for timers, focus frames, and delayed navigation while preserving all TX-1.1 through TX-1.8 contracts.

## 3.19.16 — TX-1.8 Hero Personalization Components
- Replaced direct Home hero DOM assignments with reusable greeting, journey-context, reason-banner, and dynamic-CTA components.
- Added first-name greeting, review-reason and property context chips, and carried-forward-detail reassurance beneath the active CTA.
- Preserved the canonical TX-1.7 session context, short-lived welcome receipt, direct-visitor fallback, assessment destination, and privacy-safe public APIs.
- Added component-level sanitization, independent render contracts, responsive styling, and dedicated regression coverage.

## 3.19.15 — TX-1.7 Session-Based Personalization Engine
- Added one normalized, session-scoped personalization context for identity, contact, property, review reason, campaign, referral source, entry point, assessment, and shared session ID.
- Integrated the canonical context into the transition, Home welcome, assessment prefill, contact prefill, and assessment report payload while preserving legacy profile and attribution fallbacks.
- Added session-isolation safeguards, immutable runtime state, privacy-safe readiness events, and stale-context cleanup on new handoffs.
- Added first-name and property-address acknowledgement to the completed Home welcome without exposing those values through the public welcome API.

## 3.19.14 — TX-1.6 Personalized CoverageFit Welcome
- Added a completed-onboarding receipt that allows the existing CoverageFit Home hero to acknowledge a successful transition without storing contact or property data in the receipt.
- Added review-reason-specific Home welcome copy, status messaging, browser titles, and calls to action for new-home, renewal, non-renewal, premium-increase, and neutral journeys.
- Preserved the original Home experience for direct visitors, stale receipts, mismatched sessions, and non-Home destinations.
- Added short-lived receipt validation, session matching, safe text-only DOM updates, and stale-receipt cleanup on new handoffs.

## 3.19.13 — TX-1.5 Property Confirmation
- Added a privacy-safe property confirmation card that displays the transferred address only after runtime validation.
- Synchronized the card with the property milestone, including pending and confirmed states plus accessible address confirmation.
- Added structured-address fallback assembly and neutral no-address behavior so CoverageFit never claims a home was found without a credible address.
- Preserved TX-1.1 routing and URL privacy, TX-1.2 presentation and accessibility, TX-1.3 timing, and TX-1.4 review-reason personalization.

## 3.19.12 — TX-1.4 Dynamic Transition Personalization
- Added review-reason-specific transition copy for new home purchases, renewals, non-renewals, and premium increases.
- Tailored the transition kicker, heading, supporting message, four timeline milestones, final dashboard message, browser title, and accessible final announcement.
- Added deterministic reason normalization with non-renewal precedence and a neutral default for occupational or unknown contexts.
- Preserved TX-1.1 routing and privacy, TX-1.2 presentation and accessibility, and TX-1.3 timeline timing and fallback behavior.

## 3.19.11 — TX-1.3 Intelligent Progress Timeline
- Replaced the continuous loading indicator with four timed onboarding milestones and a final Home Protection Dashboard preparation state.
- Added accessible live milestone announcements, active/completed visual states, manual-continuation timer cancellation, and reduced-motion-safe completion.
- Added neutral missing-session milestones so fallback visitors are not shown false contact or property confirmation.
- Preserved TX-1.1 routing, URL privacy, refresh recovery, destination validation, and TX-1.2 premium presentation behavior.

## 3.19.10 — TX-1.2 Premium Transition UI
- Replaced the foundational handoff screen with a premium CoverageFit-branded onboarding interface.
- Added responsive and short-viewport layouts, safe-area support, accessible live status, keyboard focus treatment, and a no-script fallback.
- Added restrained entrance, progress, pulse, and exit motion with reduced-motion support.
- Preserved the TX-1.1 session, URL privacy, destination recovery, refresh, and manual-continuation contract.

## 3.19.9 — TX-1.1 Transition Route & State Management
- Added a reachable `/transition/` route for incoming CoverageFit handoffs.
- Routed stored 408FARMERS prospect profiles through the transition while preserving the original CoverageFit destination.
- Added URL-private session state, safe refresh and missing-session behavior, reduced-motion timing, and history-safe redirects.
- Updated the campaign entry route to transition before continuing to the existing assessment.


## v3.19.8 — CF-INT-1G Consultation and Workspace Propagation
- Added unified client intake and 408FARMERS campaign context to the Agent Workspace.
- Propagated verified contact, property, review context, and integration metadata through the workspace adapter.
- Added a privacy-safe Client Intake card without displaying internal session identifiers.

## v3.19.6 — CF-INT-1E Contact Capture Prefill
- Prefilled the final editable name, email, phone, and property ZIP fields from the 408FARMERS prospect profile.
- Added a confirmation notice and privacy-safe readiness event.
- Preserved direct-visitor and manually entered values.
## 3.19.3 — P1.6.4 Professional Report Shell Certification

- Added immutable report-shell diagnostics with validity, certification, warnings, section IDs, and pagination mode.
- Propagated shell certification details through HTML renderer diagnostics.
- Certified the HTML renderer metadata for production use.
- Added end-to-end six-section report-shell certification coverage.
- Preserved partial-report rendering while preventing incomplete reports from being falsely marked certified.

## 3.19.2 — P1.6.3 Page Numbering and Print Pagination Controls

- Added CSS paged-media page counters to the shared running footer.
- Added page-numbering opt-out and immutable shell diagnostics.
- Prevented the last report section from forcing an unnecessary trailing blank page.
- Preserved the reusable report-shell and section-composer architecture.

## 3.19.1 — P1.6.2 Shared Header/Footer Content Integration

- Expanded the immutable report-shell context with report reference, producer title, license, phone, email, and agency address.
- Added model-driven contact and document-reference details to the cover page.
- Upgraded the running header/footer to include document type, client/property subject, agency/producer ownership, contact details, report reference, and confidentiality.
- Preserved cover opt-out, HTML escaping, section composition, and renderer architecture.
- Page numbering remains deferred to P1.6.3.

## 3.19.0 — P1.6.1 Professional Report Shell Foundation

- Added a reusable report-shell runtime service consumed by the HTML renderer.
- Added a model-driven CoverageFit cover page using real consultation metadata.
- Added shared running header and footer chrome for printed report pages.
- Added safe HTML escaping for shell-level client, property, agency, and date values.
- Preserved the section composer and renderer pipeline; individual sections remain independent.
- Page numbering and final cross-section print certification remain deferred to later P1.6/P1.7 sprints.

## 3.18.9 — P1.5.3 Professional Consultation Timeline Layout

- Added professional reviewed/current/upcoming timeline hierarchy.
- Added model-driven section state labels and topic-count metadata.
- Added a client-friendly status legend and a dedicated “Discussing now” marker.
- Added responsive refinements and print continuity for section headings, first items, timeline cards, reference panels, and the footer.
- Preserved unlimited timeline items, HTML escaping, immutable models, and the existing composer/renderer path.

## 3.18.8 — P1.5.2 Consultation Timeline Renderer

- Added semantic, model-driven consultation timeline HTML.
- Renders reviewed, current, and upcoming states with section progress, timing, prompts, producer notes, questions, and guardrails.
- Added responsive and US Letter print-safe styling.

## 3.18.6 — P1.4.3 Professional Checklist Layout

- Upgraded checklist phases into executive cards with current-phase emphasis.
- Added model-driven overall and phase progress meters.
- Improved active/completed item hierarchy, responsive behavior, and print continuity.

## 3.18.5 — P1.4.2 Checklist Renderer
- Added real semantic checklist HTML from the immutable AW-5 checklist model.
- Added dynamic phase, status, progress, timing, prompt, and note rendering.
- Added escaped responsive and print-safe checklist styles.

## 3.18.3 — P1.3.6 Recommendation Print Polish
- Improved multi-page recommendation pagination and section continuity.
- Added first-card group markers and group-count metadata.
- Added print break, widow, orphan, and footer continuity rules.
- Preserved recommendation content, ordering, grouping, and architecture.

## 3.18.1 — P1.3.4 Recommendation Ordering

- Deterministic model-level priority and category ordering is complete.
- Exact ties preserve source order; grouping remains deferred to P1.3.5.

## 3.18.0 — P1.3.3 Professional Recommendation Layout

- Upgraded Recommendations into an executive consultation page with CoverageFit branding, a dynamic priority overview, numbered recommendation rails, stronger information hierarchy, responsive behavior, and print-safe pagination.
- Preserved unlimited model-driven recommendations, HTML escaping, and composer-based rendering.

## 3.17.9 — P1.3.2 Recommendation Renderer

- Added real semantic HTML output for unlimited recommendation items.
- Added priority/category labels, explanations, suggested review topics, and optional consultation questions.
- Added escaped, responsive, print-safe recommendation styling.

## 3.17.7 - P1.2.3 Professional Property Summary Layout

- Upgraded the Property Summary into a polished consultation page with overview strip, structured property details, coverage snapshot cards, numbered risk highlights, print-safe page controls, and confidential footer.
- Preserved model-driven rendering and HTML escaping.

## 3.17.2 — P1.1.1 Executive Summary Data Model
- Added the immutable Executive Summary model service.
- Mapped real print-model data into client, property, consultation, Protection Score, priorities, strengths, and next steps.
- Integrated the model with the Executive Summary section without adding presentation markup.

## 3.16.7 — AW-6B.1A Print Section Registry

- Added `CoverageFitPrintSectionRegistry` as a reusable UMD runtime service.
- Added validated section registration, lookup, removal, clearing, metadata, deterministic ordering, and diagnostics.
- Added duplicate registration protection with explicit replacement support.
- Wired the registry into the Agent Workspace and Print Engine dependency boundary.
- Added `AW6B1A_QA.js` and sprint documentation.
- Did not add section components, composition, or visible printable content.

## v3.16.6

AW-6A.5 completed. Automatic renderer selection, end-to-end pipeline, renderer QA, and public Print Engine APIs finalized.

## 3.16.4 — AW-6A.4 Print Data Adapters

- Added the working `CoverageFitPrintAdapterRegistry` runtime and registered Home print adapter.
- Routed Print Engine source resolution through adapters while preserving the legacy direct-source path.
- Added adapter identity/version metadata to immutable print models.
- Added custom adapter registration and discovery APIs plus regression coverage.
- Added no printable HTML, print CSS, browser-print controls, PDF generation, or customer-facing changes.

## 3.16.1 — AW-6A.2 Print Model Validation & Section Contracts

- Added immutable print-model section contracts and contract version 1.
- Added public section and whole-model validation APIs with structural errors and printable-content warnings.
- Added validation summaries to print-model diagnostics while preserving schema version 1 and all AW-6A.1 fields.
- Added compatibility-safe normalization, documentation, and regression coverage.
- Added no printable HTML, print CSS, browser-print controls, PDF generation, or customer-facing changes.

## 3.16.0 — AW-6A.1 Print Engine Skeleton

- Added the reusable `CoverageFitPrintEngine` and immutable print-model schema version 1.
- Wired the print-model layer to the Workspace Data, Conversation Planner, and Consultation Checklist contracts.
- Added explicit source injection, source-version metadata, diagnostics, engine documentation, and regression coverage.
- Added no printable HTML, print controls, print CSS, PDF behavior, or customer-facing changes.

## 3.15.9 — WR-1C.8 Final Production Certification

- Issued the final Workspace readiness score of 9.6 / 10.
- Certified the Home-focused Agent Workspace as the stable v3.15 production baseline for controlled production use.
- Closed WR-1 and documented remaining manual browser, assistive-technology, performance, soak, and live-deployment operational gates.
- Added final certification, readiness-score, sprint, test-report, and automated validation artifacts.
- No Workspace runtime, API, event, persistence, recommendation, report, or customer-facing behavior changes.

## 3.15.8 — WR-1C.7 Release Notes

- Added the official CoverageFit v3.15 release notes, executive highlights, and migration guide.
- Consolidated AW-1 through AW-5, WR-1A, WR-1B, and completed WR-1C milestones into one release narrative.
- Documented compatibility expectations for future Home, Business, Landlord, and Life Workspace development.
- Added automated release-documentation validation.
- No runtime application behavior changed.

## 3.15.7 — WR-1C.6 Regression Freeze & API Baseline

- Froze the Agent Workspace public APIs, schemas, storage keys, lifecycle events, diagnostics, and immutable Workspace contract.
- Added machine-readable and human-readable API baseline documents.
- Added automated compatibility enforcement for future development.
- Defined semantic-version and deprecation rules for additive and breaking changes.
- No assessment, planner, checklist, persistence, recommendation, report, or customer-facing runtime behavior changes.

## 3.15.6 — WR-1C.3 Cross-Browser Certification

- Added automated browser-compatibility checks and a documented support matrix.
- Hardened UUID generation against unavailable browser crypto globals.
- Verified modern-browser fallbacks for motion, scrolling, viewport sizing, forced colors, and reduced motion.
- Attempted local headless Chromium execution; the container process timed out during environment initialization, so browser execution remains a manual gate. The complete source-level compatibility and regression baselines passed.
- Documented manual Safari, Firefox, Edge, iOS, and Android release gates without claiming unperformed tests.
- No assessment, planner, checklist, persistence, recommendation, report, or customer-facing workflow changes.

## 3.15.5 — WR-1C.2 Deployment Verification

- Added Netlify-compatible deployment configuration and static-host security headers.
- Added favicon, web manifest, robots, sitemap, and a dedicated 404 page.
- Normalized deployment metadata across all HTML routes, including the campaign redirect shim.
- Added automated deployment validation covering routes, metadata, assets, headers, and sitemap completeness.
- Verified clean extraction, local static serving, regression compatibility, and final package integrity.
- No assessment, planner, checklist, Workspace state, persistence, recommendation, or report behavior changes.

## 3.15.4 — WR-1B.10 Production Candidate

- Froze the polished Agent Workspace as the WR-1B production candidate.
- Added consolidated production-candidate, release-checklist, accessibility, performance, and regression reports.
- Revalidated the complete regression baseline, JavaScript syntax, static release integrity, and fresh-package extraction.
- Closed WR-1B while preserving WR-1C as the final manual production-audit and release-signoff gate.
- No Workspace runtime, planner, checklist, persistence, event-contract, recommendation, report, or customer-facing behavior changes.

## 3.15.3 — WR-1B.9 Interaction Polish

- Added reduced-motion-aware scrolling helpers and consistent sticky-header depth feedback.
- Added Alt+R Workspace refresh and Alt+C checklist visibility shortcuts with accessible shortcut metadata.
- Added refresh busy feedback, duplicate-refresh guarding, improved press/hover/disabled states, and safer touch behavior.
- Added explicit reset-cancellation announcements while preserving native confirmation dialogs.
- Added `WR1B9_QA.js` and sprint documentation.
- No planner, checklist-engine, persistence, event-contract, recommendation, or customer-facing behavior changes.

## 3.15.2 — WR-1B.8 Responsive Refinement

- Refined Workspace layouts for ultrawide desktops, compact laptops, tablets, foldables, landscape devices, and narrow phones.
- Added responsive content widths, grid adjustments, bounded checklist heights, safer header wrapping, and small-screen spacing refinements.
- Preserved all Workspace data, planner, checklist, persistence, event, motion, and performance behavior.
- Added `WR1B8_QA.js` and sprint documentation.

## 3.15.1 — WR-1B.7 Memory & Event Audit

- Added idempotent Workspace lifecycle teardown.
- Centralized listener and subscription cleanup.
- Cleared Workspace-owned timers on teardown and page exit.
- Added lifecycle diagnostics and duplicate-initialization protection.

## 3.15.0 — WR-1B.6 Render Performance

- Added stable render signatures for checklist, timeline, property, and recommendation surfaces.
- Skipped full DOM rebuilds when event payloads do not change a surface's rendered structure.
- Replaced unconditional progress writes with targeted DOM updates.
- Added immutable Workspace performance diagnostics for render counts, skipped renders, progress updates, and last event duration.
- Added `WR1B6_QA.js` and sprint documentation.
- No planner, checklist-engine, persistence, event-contract, motion, or customer-facing behavior changes.

## 3.14.9 — WR-1B.5 Component Cleanup

- Added a shared Workspace component vocabulary for cards, inset surfaces, buttons, badges, section headings, states, lists, and progress tracks.
- Applied shared component classes to static and JavaScript-generated Workspace markup while retaining all legacy class hooks.
- Centralized control heights, card padding, component gaps, and badge spacing in design tokens.
- Added `WR1B5_QA.js` and sprint documentation.
- No planner, checklist, persistence, event, motion, or customer-facing behavior changes.

## 3.14.8 — WR-1B.4.5 Motion Audit

- Audited Workspace motion for duplicate timers, cleanup reliability, reduced-motion compliance, focus stability, layout-shift risk, and interaction safety.
- Upgraded `CoverageFitWorkspaceMotion` to 0.2.0 with centralized class cleanup and replacement of overlapping timers.
- Routed checklist, timeline, progress, phase-refresh, and sidebar motion cleanup through the shared motion utility.
- Added `WR1B4_5_QA.js` and `WR1B4_5_MOTION_AUDIT.md`.
- No planner, checklist state, persistence, event-contract, or customer-facing behavior changes.

## 3.14.7 — WR-1B.4.4 Workspace Polish Motion

- Added a loading-to-ready exit transition and staggered Workspace surface entrance.
- Added subtle entrance motion for empty, error, property, recommendation, planner, and checklist recovery states.
- Added smooth mobile checklist sidebar expand/collapse behavior.
- Preserved native reset confirmations and all Workspace data, planner, checklist, persistence, and event behavior.
- Added WR1B4_4_QA.js and sprint documentation.

## 3.14.6 — WR-1B.4.3 Timeline & Progress Motion

- Added subtle current, completed, and updated timeline-topic transitions.
- Added motion feedback for percentage, completed-count, remaining-time, phase, and consultation-complete updates.
- Added smooth current-topic positioning while preserving reduced-motion behavior.
- Routed all timing through the shared Workspace motion foundation.
- Added WR1B4_3_QA.js and sprint documentation.

## 3.14.5 — WR-1B.4.2 Checklist Motion

- Added subtle checklist completion, reopen, and active-item transitions.
- Added phase refresh transitions after checklist events and resets.
- Routed animation timing through the shared Workspace motion foundation.
- Preserved reduced-motion behavior and checklist event-driven rendering.
- Added WR1B4_2_QA.js and sprint documentation.

# Changelog

## 3.14.4 — WR-1B.4.1 Motion Foundation

- Added shared Workspace motion duration and easing tokens.
- Added reusable fade, slide, scale, collapse, and surface-transition CSS utilities.
- Added a frozen `CoverageFitWorkspaceMotion` helper for reduced-motion detection, duration resolution, frame scheduling, preference subscriptions, and timing waits.
- Added global reduced-motion safeguards without opting existing components into new animation behavior.
- Added dedicated motion-foundation regression coverage.

## 3.14.3 — WR-1B.3 Empty & Error States

- Added intentional page-level empty and deployment-error states with clear recovery actions.
- Added dedicated missing-property and missing-recommendation states.
- Added planner and checklist recovery controls without changing engine behavior.
- Added a visible warning when checklist progress cannot be persisted.
- Added responsive, accessible, high-contrast-compatible state components.

# CoverageFit Changelog

## 3.14.2 — WR-1B.2 Loading Experience
- Added an intentional Agent Workspace loading surface with summary, property, timeline, recommendation, and checklist skeletons.
- Replaced the checklist spinner with a structured loading preview that better matches the final sidebar layout.
- Added responsive skeleton layouts for desktop, tablet, and narrow mobile screens.
- Added reduced-motion support and screen-reader loading semantics.
- Kept Workspace data, planner, checklist, persistence, event, and customer-facing behavior unchanged.
- Added dedicated loading-experience regression coverage.

## 3.14.1 — WR-1B.1 Design Tokens & Visual Consistency
- Added a semantic Workspace design-token system for brand, surface, text, border, status, focus, typography, spacing, radius, elevation, and motion values.
- Added compatibility aliases so existing Agent Workspace components retain their behavior while moving onto the shared token layer.
- Normalized card, button, sidebar, timeline, checklist, progress, empty-state, and responsive spacing styles.
- Reduced visual drift caused by hard-coded values without changing Workspace data, checklist, timeline, persistence, or customer-facing behavior.
- Added dedicated design-token regression coverage.

## 3.14.0 — WR-1A Validation & Regression Hardening
- Added realistic end-to-end Workspace scenarios for complete, partial, and empty Home assessment data.
- Added consultation walkthrough coverage across planner generation, checklist interaction, persistence restoration, refresh, and reset behavior.
- Added hardening coverage for repeated reset cycles, rapid status changes, blocked storage, corrupt and incompatible records, missing planner data, responsive behavior, keyboard safeguards, and checklist lifecycle listeners.
- Added a consolidated WR-1A production-readiness test report and documented known validation boundaries.
- Marked the AW-5 Consultation Checklist milestone complete and opened the WR-1 production-readiness milestone.
- No customer-facing assessment, recommendation, report, or pricing behavior changed.

## 3.13.7 — AW-5B.7 Mobile Optimization
- Added bounded, independently scrollable checklist behavior for tablet and phone layouts.
- Added sticky mobile checklist header, progress summary, and phase controls.
- Added dynamic viewport-height and safe-area support for modern mobile browsers.
- Improved compact card spacing, narrow-screen action layouts, text wrapping, and timeline ergonomics.
- Added automatic first-load collapse on mobile while preserving the user’s manual sidebar preference during the session.
- Added dedicated mobile optimization regression coverage.

## 3.13.6 — AW-5B.6 Accessibility
- Added screen-reader instructions and a polite atomic live announcement region.
- Added roving-tabindex keyboard navigation for the conversation timeline with arrow, Home, and End keys.
- Preserved keyboard focus across event-driven checklist and timeline rerenders.
- Added Escape-key collapse and focus return for the mobile checklist sidebar.
- Expanded semantic labels, current-step states, focus-visible treatment, touch targets, forced-colors support, and reduced-motion compatibility.
- Added dedicated accessibility regression coverage.

## 3.13.5 — AW-5B.5 Timeline Synchronization
- Restored the Agent Workspace conversation timeline UI from the existing conversation planner contract.
- Synchronized timeline current, upcoming, and reviewed states with the consultation checklist event payload.
- Added timeline-to-checklist activation so selecting a timeline topic activates the matching checklist item.
- Advanced the active consultation topic after completing an item when another pending topic remains.
- Kept the checklist engine and immutable workspace contract as the only source of consultation state.
- Added dedicated timeline synchronization regression coverage.

## 3.13.4 — AW-5B.4 Progress Display
- Added live checklist completion percentage and an accessible progress bar.
- Added completed-item count, remaining consultation minutes, and current-phase display.
- Added a consultation-complete state when every checklist item is complete.
- Kept all progress values sourced from the immutable Workspace contract and existing checklist events.
- Preserved checklist calculations, persistence, timeline behavior, and customer-facing applications.
- Added dedicated progress-display regression coverage.

## 3.13.3 — AW-5B.3 Checklist Interaction
- Added event-driven checklist completion, reopening, active-item selection, item reset, phase reset, and full reset controls.
- Routed every mutation through the Consultation Checklist engine so rendered state remains event-driven and persistence-compatible.
- Added confirmation prompts for phase and full-checklist resets.
- Added keyboard-focus, hover, disabled, and mobile interaction styling.
- Preserved checklist generation, planner logic, diagnostics, timeline behavior, and customer-facing applications.
- Added dedicated checklist-interaction regression coverage.

## 3.13.2 — AW-5B.2 Read-only Checklist Rendering
- Rendered consultation phases and checklist items from the immutable Workspace contract.
- Added current, upcoming, active, and completed visual states without introducing mutations.
- Added phase and item estimated-time metadata plus required and optional labels.
- Replaced AW-5B.1 content placeholders with a real read-only checklist region.
- Preserved checklist engine, persistence, event, timeline, and customer-facing behavior.
- Added dedicated checklist-rendering regression coverage.

## 3.13.1 — AW-5B.1 Consultation Checklist Sidebar Shell
- Added the structural Agent Workspace consultation-checklist sidebar.
- Added loading, empty, error, and ready shell states without rendering checklist items.
- Added a progress placeholder and phase-region placeholder for later AW-5B sprints.
- Added sticky desktop positioning and responsive mobile collapse behavior.
- Preserved checklist engine, persistence, event, diagnostics, and customer-facing behavior.
- Added dedicated sidebar-shell regression coverage.

## 3.13.0 — AW-5A.4.6 Release Stabilization
- Added a one-command regression runner covering every included JavaScript QA suite.
- Added static release checks for required routes, local HTML references, and release-version consistency.
- Replaced stale checklist-engine version assertions with forward-compatible semantic-version checks.
- Converted legacy QA file paths to project-relative paths so tests run from any extracted location.
- Normalized Agent Workspace roadmap status and restored newest-first changelog ordering.
- No production runtime behavior or customer-facing files changed.

## 3.12.9 — AW-5A.4.5B Regression Suite
- Added a 65-check end-to-end regression suite for the Consultation Checklist engine.
- Covered progress calculations, reset behavior, planner regeneration, persistence restoration and recovery, diagnostics, and Workspace contract integrity.
- Confirmed all prior AW-5A.4 contract, event, and diagnostics regressions remain green.
- No production behavior or customer-facing files changed.

## 3.12.8 — AW-5A.4.5A Diagnostics Expansion
- Added engine version, planner fingerprint, checklist fingerprint, storage health, generation timestamp, and integrity status to checklist diagnostics.
- Added deterministic checklist-state fingerprinting without changing planner or persistence behavior.
- Preserved the existing event-driven immutable Workspace contract and customer-facing behavior.
- Added executable diagnostics regression coverage.

## 3.12.7 — AW-5A.4.4B Workspace Event Integration
- Added Agent Workspace listeners for checklist ready, change, and reset lifecycle events.
- Removed direct checklist workspace-state reads from `agent-workspace.js`.
- Workspace checklist state and progress status now update exclusively from immutable event payloads.
- Preserved planner generation, checklist restoration, persistence, manual refresh, and customer-facing behavior.
- Added executable event-integration regression coverage.

## 3.12.6 — AW-5A.4.4A Event System Skeleton
- Added centralized checklist lifecycle event names for ready, change, and reset.
- Checklist events now carry an immutable workspace-state contract plus reason, engine version, and timestamp.
- Moved checklist-ready dispatch ownership from the Agent Workspace into the checklist engine.
- Added engine-native reset, resetItem, and resetPhase methods so reset events and persistence execute through the stable frozen API.
- Added regression coverage for event names, immutable payloads, status-change events, reset events, and the absence of Workspace event listeners.

## v3.12.5 — AW-5A.4.3C Workspace Contract Integration

- Refactored Agent Workspace checklist reads to use only `getWorkspaceState()`.
- Removed direct consumption of checklist snapshots returned by lifecycle methods.
- Updated checklist-ready event detail and workspace global to expose the immutable contract.
- Preserved planner generation, checklist restoration, persistence, and visible UI behavior.

## 3.12.4 — Sprint AW-5A.4.3B Expanded Workspace Contract
- Expanded `CoverageFitConsultationChecklist.getWorkspaceState()` with progress, current phase, remaining minutes, and planner version.
- Reused existing checklist progress and remaining-time getters without introducing new calculations.
- Deep-froze the complete workspace contract, including nested snapshots, to enforce read-only consumption.
- Preserved Workspace, planner, persistence, event, UI, and customer-facing behavior.

## 3.11.6 — Sprint AW-5A.3 Persistent Checklist State
- Upgraded the Consultation Checklist engine to version 0.3.0.
- Added versioned, per-consultation local persistence and automatic restoration.
- Added status mutation APIs for activating, completing, and reopening checklist items.
- Added safe recovery for corrupt, incompatible, expired, unavailable, and unwritable storage.
- Updated Agent Workspace initialization to restore the current checklist from the AW-3 plan without adding UI.
- Added executable persistence and recovery tests while preserving customer-facing engines.

## 3.11.5 — Sprint AW-5A.2 Planner-to-Checklist Generation
- Upgraded the Consultation Checklist engine to version 0.2.0.
- Added deterministic checklist generation from the AW-3 Conversation Planner contract.
- Preserved phases, source agenda items, recommendation IDs, timing, priority, confidence, prompts, coaching notes, and evidence.
- Added stable item IDs, checklist fingerprints, duplicate recovery, validation, and diagnostics.
- Wired checklist generation into the Agent Workspace and exposed a stable checklist contract without adding UI or persistence.
- Added executable engine tests while preserving all customer-facing engines.

## 3.11.2 — Sprint AW-3 Conversation Planner Engine
- Added a versioned, deterministic `CoverageFitConversationPlanner` engine that consumes the AW-2 workspace snapshot contract.
- Generates a structured consultation agenda with opening, property context, prioritized review topics, whole-picture connections, and next steps.
- Orders recommendation topics by priority, confidence, and original engine order without changing recommendation logic.
- Added estimated timing, discussion prompts, coaching notes, source recommendation IDs, educational guardrails, and diagnostics.
- Wired the planner into the Agent Workspace and exposed the current plan for AW-4 without rendering the timeline UI early.
- Added executable planner fixture tests while preserving all customer-facing engines.

## 3.11.1 — Sprint AW-2 Shared Workspace Data Layer
- Added a versioned, read-only `CoverageFitWorkspaceData` adapter as the single data boundary for the Agent Workspace.
- Normalized customer, assessment, score, strengths, recommendations, property, attribution, and diagnostic data into a stable schema.
- Added safe ready and empty states, malformed-data diagnostics, and report/property storage subscriptions.
- Refactored the AW-1 renderer to consume the adapter instead of reading raw local storage or report shapes directly.
- Added executable adapter fixture tests without changing any customer-facing engine.

## 3.11.0 — Sprint AW-1 Agent Workspace Foundation
- Rebuilt `/agent/workspace/` from the v3.10.0 B.4B production baseline.
- Added a responsive internal workspace shell with an internal-only header and explicit customer-report link.
- Added executive summary, Protection Score, customer, priority, and positive-foundation presentation.
- Added a property snapshot that reads the existing Property Intelligence profile without changing it.
- Added top recommendation-topic cards sourced from the existing Home report payload.
- Added safe empty-state handling when no Home assessment exists on the device.
- Removed abandoned B.13A workspace adapter and planner files so later workspace experiments cannot affect the clean rebuild.
- Preserved all customer assessment, scoring, recommendation, attribution, report, and Property Intelligence engines.

## 3.10.0 — Sprint B.4B
- Added an editable Property Profile confirmation step before the Home assessment.
- Prefills saved or provider-supplied property data and clearly asks the homeowner to confirm or correct it.
- Saves user-verified address and property facts into the shared Property Intelligence profile.
- Carries confirmed ZIP and property profile data into the existing contact, assessment, and report payloads.
- Added profile completeness feedback, mobile layouts, reduced-motion support, and partial-profile continuation.

## 3.7.0 — Sprint B.2A
- Added deterministic confidence, impact, client explanation, conversation starter, producer notes, and supporting-answer metadata to normalized recommendations.
- Improved recommendation ordering using priority, confidence, evidence, and rule support.
- Enriched Home report cards with impact, confidence, evidence, and conversation prompts.

## 3.6.1 — Sprint B.1.1 Attribution Receiver

- Added cross-site campaign attribution receiving and persistence.
- Added attribution to assessment, report, lead, and analytics payloads.
- Added `INTEGRATION-ATTRIBUTION.md` and `SPRINT-B.1.1.md`.

## 3.6.0
- Consolidated Home and Business into one registered recommendation pipeline.
- Added product-specific Home and Business rule modules.
- Reduced the legacy Business recommendation file to a compatibility adapter.
- Centralized generation, merging, priority upgrades, enrichment, sorting, diagnostics, and product registration.
- Added a documented extension path for Landlord, Auto, and Life.


## 3.5.0 — Sprint 4: Shared Recommendation Engine
- Added a shared recommendation collector for Home and Business reports.
- Centralized priority normalization, de-duplication, priority upgrades, evidence merging, rule identifiers, and sorting.
- Migrated Business recommendations onto the shared collector without changing existing industry or conditional rules.
- Routed Home priority topics through the same shared normalization layer without changing Home scoring or topic selection.
- Preserved Trigger Library enrichment and Dynamic Illustration behavior.
- Removed the duplicate Volunteer Accident trigger definition identified during Sprint 3 QA.

## 3.4.0 — Sprint 3: Trigger Library
- Added shared trigger library for Home and Business reports.
- Added why-it-matters, practical-example, and question-to-discuss content.
- Wired all current Business recommendation topics to the shared library.
- Wired Home priority cards to the shared library.
- Added responsive and print-safe trigger detail cards.
- Preserved assessment, scoring, priority, and recommendation calculations.

## 3.3.0 — Sprint 2: Journey Timeline Engine
- Added shared report journey timelines.
- Removed inherited duplicate Business executive sections.

- v3.5.1: Removed duplicate Volunteer Accident trigger reference and prepared recommendation engine consolidation.

## 3.8.0 — Sprint B.3 Interactive Coverage Snapshot
- Added an interactive Home Coverage Snapshot dashboard to the report.
- Added animated score ring, category breakdown, priority/strength tabs, and next-conversation CTA.
- Reused the existing score, categories, strengths, and B.2A recommendation intelligence payload.

## 3.9.0 — Sprint B.4A Property Intelligence Framework
- Added a provider-neutral property intelligence service and profile schema.
- Added normalized address handling, provider adapters, field confidence, caching, persistence, and manual fallback.
- Added optional property profile data to the Home assessment payload.



- AW-5A.1 Checklist engine foundation added.

AW-5A.4.1 Progress Engine implemented.


- AW-5A.4.2A: Added reset()/clear() skeleton APIs.

- AW-5A.4.2B: Added resetItem API.

AW-5A.4.2C Reset Phase implemented.

- AW-5A.4.2D Persistence Integration

- AW-5A.4.2E Planner Regeneration implemented.


## AW-5A.4.3A
- Added immutable getWorkspaceState() public contract skeleton exposing checklist, summary, diagnostics and version. No UI or persistence changes.


## AW-6A.3
Implemented print snapshot & serialization boundary.

## 3.16.9 — AW-6B.1C Document Composer
- Added the runtime Document Composer for immutable print models.
- Added deterministic registry-to-document section composition without HTML rendering.
- Corrected AW-6B.1B section registration and loaded section modules in the workspace runtime.
- Added composer regression coverage.

## 3.17.0 — AW-6B.1D Visibility Engine
- Added the standalone print visibility runtime service.
- Added required-data checks, conditional section visibility, immutable empty-state decisions, and fail-closed diagnostics.
- Integrated visibility decisions into the Document Composer without adding HTML rendering.
## v3.17.1 — AW-6B.1E Renderer Integration
- Integrated the HTML renderer with the immutable Document Composer.
- Visible sections are rendered dynamically in registry/composer order.
- Added section-output validation and renderer diagnostics.
- Added browser runtime loading for the renderer registry before Print Engine initialization.
- No printable section content or hard-coded section ordering was introduced.

## 3.17.4 — P1.1.3 Executive Summary Professional Layout
- Added a professional, print-ready Executive Summary page.
- Added secure HTML escaping for model-derived content.
- Added responsive and US Letter print styling to the composed HTML document.

## 3.17.5 — P1.2.1 Property Summary Data Model
- Added the immutable Property Summary model and integrated it with the Property Summary print section.
- Added tolerant mapping, validation diagnostics, and regression coverage without introducing presentation markup.

## 3.17.6 — P1.2.2 Property Summary Renderer
- Added real semantic Property Summary HTML rendering from the immutable model.
- Added safe formatting, HTML escaping, partial-data states, and print-safe base styles.

## 3.17.8 — P1.3.1 Recommendation Data Model
- Added the immutable Recommendation print model and integrated it with the Recommendations section.

## 3.18.2 — P1.3.5 Recommendation Groups
- Added immutable category grouping and grouped recommendation rendering.

## 3.18.4 — P1.4.1 Checklist Data Model

- Added the immutable Checklist print data model.
- Normalized AW-5 checklist phases, items, statuses, priorities, progress, timing, and traceability.
- Wired the Checklist section to the dedicated model without adding presentation markup.
- Added P1.4.1 regression coverage.

## v3.19.4 — CF-INT-1C
- Added CoverageFit prospect-prefill intake for 408FARMERS handoffs.
- Added dual browser storage and immediate URL privacy cleanup.
- Preserved non-PII attribution and direct-visitor behavior.

## v3.19.7 — CF-INT-1F Unified Assessment Payload
- Unified verified consumer, property, review-context, and 408FARMERS integration data in the saved assessment payload.
- Preserved backward compatibility with existing report and submission contracts.
