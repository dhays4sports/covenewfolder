# CoverageFit v3.20.70

## Current release — CoverageFit 3.20.71 / RC-SMS-1.9.6

RC-SMS-1.9.6 certifies the complete **pre-port shared-number operations layer**: collision/recovery routing, producer continuity, global consent, outbound provenance, retries, legacy-record compatibility, and a non-destructive Operations readiness snapshot. The final 408-FARMERS RingCentral/carrier path is intentionally **not** certified here; RC-SMS-1.10 is next.

Primary handoff files:

- `SPRINT-RC-SMS-1.9.6.md`
- `RC_SMS_1_9_6_CONTRACT.json`
- `RC_SMS_1_9_6_RELEASE_CERTIFICATION.md`
- `RC-SMS-ROADMAP.md`


RC-SMS-1.9.5 makes SMS consent and suppression authoritative across the shared 408-FARMERS sender/recipient relationship. STOP now blocks every programmatic sender behind the gateway—including CoverageFit, CRM/quote follow-up, appointments, service, life/commercial, campaigns, producer-console sends, external pre-registration, and retries—without deleting the preserved workflow state.

The live conversation advances to schema 1.6 with orchestration schema 1.2, outbound-registry schema 1.2, and consent schema 1.0. `smsConsent` tracks application permission, STOP/START timestamps and source, the last consent command, and bounded provider consent status. Programmatic sends check consent when prepared and again immediately before RingCentral delivery, so queued work is denied if STOP occurs before execution.

START restores channel permission only. It does not blindly restart or resume an old CoverageFit intake; preserved workflows remain producer-owned/human-only until explicitly resumed. Provider `blocked` or `opted_out` signals can force local suppression, while a provider `active` signal cannot by itself override an existing customer/application STOP.

No D1 migration, new table, or new environment variable is required. A protected `/api/sms/consent/` route provides bounded provider-status reconciliation and SMS Operations now displays redacted consent/provider state.

The proceeding plan is embedded in `RC-SMS-ROADMAP.md`: **RC-SMS-1.9.6 — Shared Number Operations Certification is next**, followed by RC-SMS-1.10 final 408-FARMERS port + live carrier certification.

See `SPRINT-RC-SMS-1.9.5.md`, `RC_SMS_1_9_5_CONTRACT.json`, `RC_SMS_1_9_5_RELEASE_CERTIFICATION.md`, `RC-SMS-ROADMAP.md`, and `RCSMS1_9_5_QA.mjs`.

## Prior release: CoverageFit v3.20.69

RC-SMS-1.9.4 completed cross-workflow ownership and producer continuity while keeping one shared SMS relationship.

## Prior release: CoverageFit v3.20.68

RC-SMS-1.9.3 added the private multi-source outbound registry and made the SMS gateway the single programmatic RingCentral send boundary.

## Prior release: CoverageFit v3.20.67

RC-SMS-1.9.2 turned the RingCentral sender into a shared-number communication channel with explicit channel status, conversation ownership, automation mode, workflow state preservation, producer-safe ambiguous inbound routing, and manual/unregistered outbound takeover protection.

## Prior release: CoverageFit v3.20.54

RC-SMS-1.9.1 added immediate, privacy-safe producer email alerts when the 408-FARMERS SMS intake becomes actionable. Production number porting remained deferred.

## Prior release: CoverageFit v3.20.53

CRO-1.6.2 preserves professional discount eligibility-review intent across the existing CoverageFit transition, Home assessment, completion handoff, private customer Snapshot, and Producer Workspace. A connected role remains visible and the customer is continually shown the benefit of completing the review: Dylan receives organized home and coverage context to verify which Farmers professional discounts may be available.

CoverageFit remains educational. It does not make an eligibility, discount, underwriting, pricing, coverage, or carrier-fit decision. No assessment question, Protection Score formula, contact capture, consultation delivery, or producer-decision system changed.

Paired sender: 408FARMERS 408-CRO-1.6.2.1
See `SPRINT-CRO-1.6.2.md`, `CRO1_6_2_QA.mjs`, and `CRO1_6_2_BROWSER_CERTIFICATION.mjs`.

# Prior release: CoverageFit v3.20.51

PC-1.5 adds one live producer pilot preflight to the existing Agent Workspace. It confirms that the selected homeowner review, guided consultation, secure PC-1.3 save/recovery path, existing Consultation Document action, and this device's manually reviewed Print Preview are ready before the producer begins a pilot call.

The preflight derives from existing workflow and persistence state and keeps the real-device acknowledgement limited to the selected consultation and open Workspace session. It does not create another workflow, store a pilot result, or imply that coverage, pricing, underwriting, or a live producer pilot has been completed.

See `SPRINT-PC-1.5.md`, `PC1_5_QA.mjs`, and `PC1_5_LIVE_PRODUCER_PILOT_RUNBOOK.md`.

## Prior release: 3.20.50

PC-1.4 certifies and hardens the existing Home Protection Consultation for production browser printing and Save as PDF. One central readiness profile verifies the complete document shell, US Letter pagination, running header and footer, page counters, print colors, readable page breaks, final-page behavior, and the browser print service before enabling the print action.

See `SPRINT-PC-1.4.md`, `PC1_4_QA.mjs`, and `PC1_4_PRINT_PDF_CERTIFICATION.md`.

## Prior release: 3.20.49

PC-1.3 makes Guided Consultation progress recoverable without creating a second workflow. The existing checklist remains the canonical working state, while its minimal status checkpoint is also stored inside the selected consultation record. The newest valid checkpoint is restored across refreshes and connected producer devices; browser-local operation remains available offline.

Secure inbox consultations now synchronize progress through a same-origin, producer-authorized endpoint with bounded validation, stale-write protection, and no homeowner identity in the checkpoint or D1 metadata. The Workspace shows whether progress is saved on the device, recovered, pending secure sync, or saved with the consultation.

See `SPRINT-PC-1.3.md` and `PC1_3_QA.mjs`.

## Earlier release: 3.20.48

PC-1.2 adds a compact Current Focus guide to the existing Agent Workspace. It uses the established six-stage Consultation Progress model to keep the current stage, one next action, completion progress, and any earlier-step attention visible without creating another workflow or persistence layer.

The guide remains sticky on larger screens, becomes static and touch-friendly on smaller screens, and updates from existing checklist, recommendation, disposition, and follow-up state. The 408FARMERS handoff, CoverageFit intake and assessment, Guided Consultation, Consultation Document, Protection Score, attribution, FLOW, and RC-SMS systems remain structurally unchanged.

See `SPRINT-PC-1.2.md` and `PC1_2_QA.mjs`.

## Prior release: 3.20.47

PC-1.1 completed the end-to-end consultation workflow audit, restored full active-record hydration for report actions, and isolated checklist progress by opaque consultation ID.

See `SPRINT-PC-1.1.md` and `PC1_1_QA.mjs`.

## Prior release: 3.20.46

CD-1.8 completes the Consultation Document sprint family with one immutable Producer/Consumer Story shared by the Agent Workspace and the existing three-part Home Protection Consultation. Review purpose, journey narrative, priority order, confirmation details, saved recommendation judgments, completion state, and next action now come from the same consultation record and centralized guidance models.

The Workspace includes a calm document-story preview, and the homeowner document uses the exact command-center priority order instead of independently re-ranking findings. Draft work remains draft; only saved producer judgments and a completed closeout appear as recorded decisions.

See `SPRINT-CD-1.8.md` and `CD1_8_QA.mjs`.

## Prior release: 3.20.45

CD-1.7 completed the consumer-language pass while preserving the underlying Protection Score, recommendation decisions, confirmation states, draft/completed distinction, and formal insurance-company authority.

See `SPRINT-CD-1.7.md` and `CD1_7_QA.mjs`.

## Prior release: 3.20.44

CD-1.6 turned the existing Decisions and Next Steps chapter into a truthful consultation closeout. The document carries the producer-recorded homeowner decision, unresolved work, formal quote status and requirements, finding decisions, agreed next action, and saved follow-up context from GC-1.9.

See `SPRINT-CD-1.6.md` and `CD1_6_QA.mjs`.

## Prior release: 3.20.43

CD-1.5 added clear Recommendation Explanations to the existing Consultation Record. Each priority finding shows what the topic means, why it matters, the producer-controlled recommendation status, whether verification is complete for discussion, and the recorded reason for that judgment.

See `SPRINT-CD-1.5.md` and `CD1_5_QA.mjs`.

## Prior release: 3.20.42

CD-1.4 turns the Consultation Record into a clearer Priority Findings chapter. The existing recommendation presentation model now orders the meaningful findings, the document shows the first three in conversation order, and each finding separates what the assessment found, why it is prioritized, and what must be confirmed before advice is finalized.

This sprint does not change Protection Score math, assessment output, evidence classification, or producer judgment. Existing consultation questions and guidance remain intact for CD-1.5 Recommendation Explanations.

See `SPRINT-CD-1.4.md` and `CD1_4_QA.mjs`.

## Prior release: 3.20.41

CD-1.3 turns the existing score card into a readable Protection Snapshot. It now shows the authoritative Protection Score, canonical category and range, position on the 0–100 scale, a plain-language interpretation, and guidance for using the result during the consultation.

The snapshot is presentation-only. It does not recalculate the score or change assessment weights, category bands, recommendation ordering, or evidence status. Missing or invalid scores display a truthful Not scored state, and the document continues to state that the score is not a coverage, underwriting, pricing, eligibility, or policy decision.

See `SPRINT-CD-1.3.md` and `CD1_3_QA.mjs`.

## Prior release: 3.20.40

CD-1.2 makes the first Consultation Document chapter work as a true executive summary. The existing Review Overview now establishes who the homeowner is, why the review started, what the assessment is showing, the strongest foundation, the first discussion focus, what still needs confirmation, and the next action without changing the underlying score, recommendation order, or consultation record.

The summary remains evidence-aware: assessment responses organize the conversation, but current policy details still require confirmation before advice is finalized. CD-1.3 remains the bounded next sprint for the Protection Snapshot.

See `SPRINT-CD-1.2.md` and `CD1_2_QA.mjs`.

## Prior release: 3.20.39

CD-1.1 reorganizes the existing printable consultation document into one clear three-part reading sequence: Review Overview, Property & Verification, and Consultation Record.

Seven centrally configured chapters now identify where the Executive Summary, Protection Snapshot, Property Snapshot, Items to Verify, Priority Findings, Recommendations, and Decisions and Next Steps belong. A compact map appears on every part, and semantic chapter markers give the remaining Consultation Document sprints stable extension points without creating a second document system.

See `SPRINT-CD-1.1.md` and `CD1_1_QA.mjs`.

## Prior release: 3.20.38

GC-1.9 adds a structured Consultation Completion closeout to the existing Agent Workspace. The producer records what the homeowner decided, whether unresolved items remain, the carrier-quote status and requirements, and who owns the next action.

The closeout is stored inside the existing local or secure consultation record and advances an early record to Consultation completed without closing it or overwriting a later disposition. Existing recommendation judgments, evidence status, and follow-up context remain visible without being copied into a competing workflow.

See `SPRINT-GC-1.9.md` and `GC1_9_QA.mjs`.

## Prior release: 3.20.37

GC-1.8 added the six-stage Consultation Progress sequence.

## Prior release: 3.20.36

GC-1.7 added beginner-friendly Explanation Assist inside each existing Recommendation Builder finding.

## Prior release: 3.20.35

GC-1.6 added the producer-controlled Recommendation Builder and secure structured-plan persistence.

## Prior release: 3.20.34

GC-1.5 added assessment-driven Guided Questions to the existing conversation planner and consultation-first Agent Workspace.

## Prior release: 3.20.33

GC-1.4 separates known, inferred, missing, and needs-confirmation information inside the existing Consultation Command Center while preserving evidence classifications and producer judgment.

## Prior release: 3.20.30

GC-1.1 adds the Consultation Command Center to the existing Agent Workspace. The first selected-consultation view now presents Who, Why, Status, Top Priorities, Verify, and Next Action from the normalized workspace snapshot, existing evidence handoff, consultation stage, and guided-checklist progress. It preserves the established recommendation order and evidence classifications and links into the existing workflow without creating a parallel consultation system.

See `SPRINT-GC-1.1.md` and `GC1_1_QA.js`.

## Prior release: 3.20.29

FLOW-1.4 added centralized entry-specific transition messaging for homebuyer, professional, home + auto, general homeowner, and time-sensitive journeys while preserving one assessment and conditional eligibility language.

## Prior release: 3.20.23

RC-SMS-1.5 adds a secure zero-repeat continuation from the completed homebuyer SMS intake into CoverageFit. The final SMS now includes a short-lived opaque link; the token resolves server-side, is removed from browser history, and carries the buyer's property, closing, occupancy, auto-review, and urgency context into the existing CoverageFit Home journey without exposing those details in the URL.

Apply `migrations/0005_rc_sms_1_5_handoffs.sql` before deployment. See `SPRINT-RC-SMS-1.5.md` and `RCSMS1_5_QA.mjs`.

RC-SMS-1.4 completes the bounded homebuyer SMS intake. A live RingCentral or simulated buyer conversation now collects the property address, closing date, occupancy, and auto-review interest, while preserving STOP, START, RESTART, HELP, DYLAN, and RUSH controls. Natural date responses such as `next Friday` and `this week` are supported, and past or invalid dates receive correction prompts without losing prior answers.

RUSH is an operational priority only and does not guarantee coverage, eligibility, or turnaround time. The secure zero-repeat CoverageFit continuation remains RC-SMS-1.5. No new D1 migration or RingCentral environment variable is required. See `SPRINT-RC-SMS-1.4.md` and `RCSMS1_4_QA.mjs`.

## Prior release: 3.20.21

RC-SMS-1.3 advances the RingCentral SMS connection from a single welcome into a deterministic intent router with messaging controls. Live inbound texts can now identify Buyer, Home Review, Home and Auto, or Other requests using numeric or bounded natural-language responses. STOP, START, RESTART, HELP, DYLAN, and AGENT behavior is implemented, and a second unclear menu response exits the automation loop by queuing the conversation for Dylan.

The protected `/agent/sms-simulator/` page now exposes invalid-attempt and command context while retaining the existing fictional buyer-path simulator and RingCentral Connection Lab. No credentials are exposed to browser code. Full buyer questioning remains RC-SMS-1.4. See `SPRINT-RC-SMS-1.3.md`.

RC-SMS-1.2 added the protected RingCentral JWT connection, validated inbound webhook, configurable SMS sender, duplicate-event suppression, and one bounded automated welcome. RC-SMS-1.3 supersedes the one-response boundary with live intent and command routing.

## Prior release: 3.20.19

# CoverageFit v3.20.19

RC-SMS-1.1 adds a protected internal 408FARMERS SMS conversation simulator at `/agent/sms-simulator/`. The deterministic engine persists opaque test conversations in D1, prevents duplicate message processing, supports a complete fictional buyer-flow test, and exposes operator-only state controls without sending live SMS or requiring RingCentral credentials.

Apply `migrations/0004_rc_sms_1_1_conversations.sql` to preview and production D1 before using the simulator. The simulator uses the existing `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`. See `SPRINT-RC-SMS-1.1.md` and `RCSMS1_1_QA.mjs`.

## Prior release: 3.20.18

# CoverageFit v3.20.18

NP-1.5 carries one anonymous Neighborhood Protection Pass identity through share-module view, share action, referred visit, assessment start, and successful referred completion. D1 is the authoritative deduplication layer, so normal reloads do not inflate the funnel. A completion is accepted only when the referred homeowner has a matching durable server-backed Home report.

The A/B flyer campaign contract now works for any five-digit ZIP. Version A uses `home_flyer_<ZIP>_rate`; Version B uses `home_flyer_<ZIP>_fit`. CoverageFit and 408FARMERS normalize the same `campaign_zip` and `campaign_variant` inputs.

Apply `migrations/0002_np_1_3_referral_links.sql` and `migrations/0003_np_1_5_referral_events.sql` before production deployment. See `SPRINT-NP-1.5.md` and `NP1_5_QA.mjs`.

Production runtime remains Cloudflare Pages Functions plus D1.

## Prior release: 3.20.17

NP-1.4 moved unique neighbor-share links to the branded `408farmers.com/neighbor/r/[anonymous-token]` bridge while preserving the existing CoverageFit referral welcome.

## Prior release: 3.20.16

NP-1.3 added one anonymous, reusable, expiring referral token per durable Home review.

## Prior release: 3.20.15

NP-1.2 added the referred-homeowner welcome and safe generic referral state.

## Prior release: 3.20.14

NP-1.1 added a voluntary, privacy-safe sharing section after an acknowledged successful Home-review submission opens its matching private Protection Snapshot. Homeowners can text a neighbor, use the native device share sheet, or copy the referral review link without supplying a recipient phone number.

## Prior release: 3.20.13

CONV-1.1 removes avoidable repeat steps for recognized 408FARMERS Home-review visitors. The animated transition opens the Home assessment directly, displays clear 408FARMERS-to-CoverageFit continuity, offers one-click confirmation for a complete transferred address, asks only for contact or permission that is actually missing, and automatically opens the existing private Protection Snapshot after a fully completed assessment when valid contact and permission are already present.

## Prior release: 3.20.12

DOC-1.2 turns the internal Agent Guide into a readable live-call document while preserving report data and compliance guardrails.

## Prior release: 3.20.11

AW-7.1 makes the active homeowner consultation the default Agent Workspace experience. Consultation, Inbox, and Pipeline are separate views, with the selected record organized into Before, During, and After phases.


## Prior release: 3.20.10

ASMT-1.8 improves the homeowner assessment without changing its underlying model. Required property confirmation is shown first, optional home details are collapsed, visible question and answer language is simplified through a presentation-only layer, evidence jargon is reduced, the early insight is non-blocking, and the estimate is now a truthful five minutes. ASMT-1.7 Save & Exit and seven-day local drafts remain intact.

# CoverageFit v3.20.7 — CONS-2.1 Privacy-Safe New Review Notification

A newly completed Home Coverage Review can now send one generic producer email alert linking to the secure Agent Workspace. The alert intentionally excludes homeowner identity, contact information, property details, Protection Score, findings, review reason, consultation ID, report token, campaign, and session data. Provider failure never blocks the saved review.

See `NEW-REVIEW-NOTIFICATION.md` and `SPRINT-CONS-2.1.md`.

## Prior release: 3.20.6

ASMT-1.6 carries confirmed homeowner-reported facts, policy-verification items, and unresolved questions into the Agent Workspace, Conversation Planner, Consultation Checklist, and printable Consultation Document without changing scoring or recommendation ordering.

## Prior release: 3.20.5

ASMT-1.5 classifies every active response as confirmed, partial, needing verification, or missing, blocks genuinely incomplete finalization, and preserves the evidence state in completed reports.

## Prior release: 3.20.4

ASMT-1.4 uses the homeowner's selected review reason to add bounded, transparent question context and reorder discussion priorities for home purchase, renewal, non-renewal or cancellation, and premium-increase journeys without changing the score.

CoverageFit v3.20.3

ASMT-1.3 adds property-aware assessment personalization. The eleven-question universal Home review remains intact, while homeowner-confirmed pool, detached-structure, older-roof, age, size, and story details now add only relevant questions or context. The feature does not use unconfirmed public records and does not make underwriting, valuation, eligibility, hazard, condition, or coverage conclusions.

## Current release: 3.20.3

See `ASSESSMENT-QUESTION-VALIDITY-AUDIT.md` for the question-by-question findings and `PROTECTION-SCORE-METHODOLOGY.md` for the normalized scoring contract and calibration scenarios. Cloudflare production setup remains documented in `CLOUDFLARE-SETUP.md`.

CoverageFit v3.20.1

ASMT-1.1 replaces the former raw point-subtraction score with the versioned `coveragefit-protection-score-v1` methodology. The Protection Score now measures response-based review readiness and clarity, uses normalized Home weights totaling 100, distinguishes uncertainty from identified gaps, and applies one authoritative band table throughout the assessment, reports, Agent Workspace, and consultation document.

## Current release: 3.20.1

See `PROTECTION-SCORE-METHODOLOGY.md` for the formula, category normalization, finding definitions, score bands, priority ranking, Home weights, calibration scenarios, and limitations. Cloudflare production setup remains documented in `CLOUDFLARE-SETUP.md`.

CoverageFit v3.20.0

OPS-CF-1.1 moves the existing server-backed CoverageFit workflows to the current GitHub → Cloudflare Pages architecture. Cloudflare Pages Functions now serve the same `/api/consultations/*` and `/api/reports/*` routes, while Cloudflare D1 stores producer consultations and private prospect reports.

## Current release: 3.20.0

The repository no longer requires Netlify for production. Configure the Cloudflare D1 binding `COVERAGEFIT_DB`, the encrypted secret `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`, and apply `migrations/0001_ops_cf_1_1.sql`. See `CLOUDFLARE-SETUP.md` for the preview and production workflow.

CoverageFit v3.19.31

RPT-1.2 replaces URL-exposed customer information and browser-only prospect report retrieval with private opaque report links backed by Netlify Functions and Netlify Blobs. Private reports expire after 30 days and provide truthful expired, unavailable, temporary-service, and device-only fallback states.

## Current release: 3.19.31

Completed Home reviews now redirect to `/home/report/#report_id=<opaque-id>`. The fragment contains no customer name, property address, campaign, or session ID and is not sent in normal page requests. The report route retrieves a minimized prospect-safe payload from the server, caches a temporary local copy for short outages, and remains compatible with legacy browser-local reports opened from the Agent Workspace.

CoverageFit v3.19.30

RPT-1.1 compresses the homeowner-facing Protection Snapshot into three clear pages while preserving the strongest educational guidance and one focused producer next step.

## Current release: 3.19.30

The customer report now contains one personalized overview, three educational topics, and one next-step page. Duplicate covers, repeated score and strength treatments, customer confidence percentages, repeated actions, and duplicate CTAs have been removed. DOC-1.1 remains the current three-page internal agent consultation document.

## Current release: 3.19.1

P1.6.2 expands the Professional Report Shell with model-driven producer, agency, contact, document-reference, and confidentiality details across the cover and shared running header/footer. Page numbering remains deferred to P1.6.3.

## Current release: 3.19.0

P1.6.1 adds the Professional Report Shell Foundation. The HTML renderer now composes the existing section output inside a reusable report shell with a model-driven cover page and shared print header/footer chrome. Page numbering and final browser-print controls are intentionally deferred.

## Current release: 3.18.9

P1.5.3 upgrades the Consultation Timeline into a professional, state-aware, responsive, print-safe report section while preserving the immutable timeline model → section → composer → HTML renderer path.

## Current release: 3.18.8

P1.5.2 adds the real Consultation Timeline renderer while preserving the immutable model → section → composer → HTML renderer path.

## Current release: v3.18.6

P1.4.3 adds the professional Consultation Checklist layout while preserving the immutable checklist model and section-driven print pipeline.

## Current release: v3.18.5
P1.4.2 adds the model-driven printable Consultation Checklist renderer. Professional checklist layout refinement remains P1.4.3.

## Current release: v3.18.3
P1.3.6 improves recommendation print pagination for long, grouped consultation reports while preserving the immutable model and section-driven renderer pipeline.

## P1.3.4 Recommendation Ordering

- Deterministic model-level priority and category ordering is complete.
- Exact ties preserve source order; grouping remains deferred to P1.3.5.

## Printable Recommendations

P1.3.2 adds model-driven semantic HTML for consultation recommendations. The section supports unlimited recommendations and remains composed through the shared Print Engine pipeline.

## Current release: 3.17.7

P1.2.3 adds the professional Property Summary print layout.

## Current product sprint
P1.1.1 adds the production Executive Summary data model. The printable visual component remains intentionally deferred to P1.1.2.

## v3.16.7

AW-6B.1A adds the runtime Print Section Registry. It provides validated registration, deterministic ordering, immutable metadata, duplicate protection, dependency injection into the Print Engine, and regression coverage. No printable content or composer behavior is included in this micro sprint.

## v3.16.6

AW-6A.5 completed. Automatic renderer selection, end-to-end pipeline, renderer QA, and public Print Engine APIs finalized.


## CoverageFit v3.15 Agent Workspace Baseline

Version 3.15 establishes the first production-ready Agent Workspace baseline, including the Conversation Planner, synchronized timeline, persistent consultation checklist, progress tracking, accessibility, responsive behavior, render/lifecycle hardening, deployment controls, and frozen compatibility contracts.

Release documentation:

- `RELEASE_NOTES_v3.15.md`
- `RELEASE_HIGHLIGHTS.md`
- `MIGRATION_GUIDE_v3.15.md`
- `WR1C_API_BASELINE.md`

## CoverageFit v3.16 Print Engine Foundation

AW-6A.1 introduced `CoverageFitPrintEngine`. AW-6A.2 added section contracts and validation. AW-6A.3 established the serialization boundary. AW-6A.4 adds a working adapter registry and Home adapter so future Business, Landlord, and Life modules can plug into the same print pipeline. See `AW6_PRINT_ENGINE.md`, `AW6_PRINT_MODEL_CONTRACTS.md`, `AW6_PRINT_SERIALIZATION.md`, and `AW6_PRINT_ADAPTERS.md`.

# CoverageFit v1 Pilot

Deployment-ready pilot focused on one journey:

1. Landing page
2. 10-question guided assessment
3. Compact Protection Snapshot
4. Call/text booking page

## Configure
Edit `/producer.json`. The active Formspree endpoint is controlled by `formEndpoint`.

## Test routes
- `/`
- `/assessment/`
- `/home/report/` after assessment submission
- `/book/`
- `/triggers/homebuyer/`
- `/triggers/renewal/`
- `/triggers/premium-increase/`


## Meta Conversion Update
Added emotional trigger copy, risk-removing CTAs, early insight after question 2, human report introduction, and a reassuring booking page.


## CoverageFit Platform Update
- Root is now a platform chooser for Home, Business, Landlord, Auto, and Life journeys.
- `/home/` is a full Home landing page; existing assessment remains at `/assessment/`.
- `/business/` is a first-class CoverageFit Business landing page.
- `/landlord/` is a new landlord review landing page with direct contact CTA.
- Shared navigation, trust language, journey footer, and universal Coverage Review positioning were added.

## CoverageFit v2.2 — Business Profile + Industry Routing
- `/business/profile/` is now the first step for Business reviews.
- Supports ten industry routes and stores the profile in both sessionStorage and localStorage under `coveragefit_business_profile`.
- The existing shared Business assessment remains unchanged in question content for this phase, but receives the selected `industry` and `module` routing parameters.
- Business profile details are carried into the assessment context, Formspree submission, saved report payload, and consumer record.

## CoverageFit v2.3 — First Five Industry Modules

Business assessment modules are now active for Contractor, Restaurant, Professional Office, Retail, and Nonprofit. Each module includes industry-specific questions, conditional follow-up questions, category labels, profile context, and structured response storage. Healthcare, Technology, Property Management, Manufacturing, and Other continue to use the general business assessment until later phases.


## CoverageFit v2.4 — Shared Coverage Questions

The Business journey now merges every industry path into a shared Current Coverage section. It captures current carrier, renewal date, claims, locations, vehicles, general liability, property, business income, workers compensation, cyber, umbrella, professional liability, and certificate/contract requirements. A unified five-step progress system is displayed across Business Profile, Industry Review, Current Coverage, Snapshot, and Contact Review.

## CoverageFit v2.5 Business Snapshot
- Replaced the Business report with Business Profile, Operations, Current Coverage, Risk Areas, and transparent Preparedness Score sections.
- Score starts at 100, applies only predefined answer deductions, and deducts 2 points for missing carrier or renewal date.
- Score is explicitly educational and is not underwriting, eligibility, pricing, or a coverage determination.


## CoverageFit Business v2.6

Added dedicated industry modules for Healthcare, Technology, Property Management, Manufacturing, and Other. All ten Business Profile selections now route to a seven-question industry module before merging into the shared Current Coverage section.

Each new module includes industry-specific labels, conditional questions, structured response keys, Business Profile context, report storage, and lead payload integration.

## CoverageFit Business v2.7 Recommendation Engine
- Adds industry baseline recommendation rules for all ten business modules.
- Adds answer-triggered conditional recommendations and priority upgrades.
- Groups report recommendations into High Priority Review, Recommended Discussion, and Additional Consideration.
- Explains why each topic appears and identifies the response source that triggered it.
- Recommendations are educational discussion topics, not underwriting or coverage determinations.

## CoverageFit Business v2.9 Production UI
- Branded staged Snapshot generation overlay
- Redesigned Contact Review experience and completion checklist
- Polished submit/success transition into the final report
- Improved empty states and report motion
- Score count-up and staggered recommendation animation
- Keyboard focus, live-region announcements, touch-target, contrast, and reduced-motion improvements
- Presentation-only enhancement; assessment, scoring, storage, and recommendation rules remain unchanged

## Recommendation pipeline

Version 3.6.0 uses one registered recommendation engine with separate Home and Business rule modules. See `RECOMMENDATION_PIPELINE_V3_6.md`.


## Agent Workspace v3.15 Certification

CoverageFit v3.15.9 is the certified stable Home-focused Agent Workspace baseline. See `WR1C_FINAL_PRODUCTION_CERTIFICATION.md`, `WR1C_READINESS_SCORE.md`, and `RELEASE_NOTES_v3.15.md`.


## AW-6A.3
Implemented print snapshot & serialization boundary.

## Print document composition
`CoverageFitPrintDocumentComposer.compose()` converts an immutable print model and registered section definitions into an ordered, immutable document structure. It does not render HTML; renderer integration is intentionally deferred.

### Print visibility
`assets/js/print-visibility.js` evaluates registered section requirements and visibility rules before composition. The Document Composer exposes visible and hidden sections as immutable structured output; it does not render HTML.
## Printable document runtime
The HTML print renderer is now composer-driven. It receives an immutable print model, composes registered sections, invokes only visible section renderers, and returns immutable HTML-renderer output. Section-specific printable content is intentionally not implemented in this release.

## Property Summary print model
Version 3.17.5 adds an immutable Property Summary model consumed by the print section. Visual rendering remains scheduled for P1.2.2.

### Recommendation Print Model
The printable consultation uses `CoverageFitRecommendationModel` to convert Recommendation Engine output into immutable, renderer-ready consultation data.

## v3.18.0 — Professional Recommendation Layout
Recommendations now render as a polished, client-facing consultation section with a priority summary and print-safe executive cards. Ordering and category grouping remain separate future sprints.

### P1.3.5 Recommendation Groups
Recommendations are organized into client-friendly protection categories while retaining deterministic priority order within each group.

### Checklist print model

The print pipeline now includes `CoverageFitChecklistModel`, an immutable adapter over the AW-5 consultation checklist. The Checklist section consumes this model; visible checklist rendering is intentionally deferred to P1.4.2.

## CONS-1.7 Consultation disposition

The Agent Workspace now tracks each consultation through a producer-controlled stage and, when closed, a required final outcome. Server-backed changes synchronize through `/api/consultations/disposition`; browser-local records retain their stage and outcome in local storage. Closing and reopening actions appear in the activity timeline.

## CONS-1.8 Pipeline summary and outcome reporting

The existing Agent Workspace now summarizes every synchronized consultation record with total, open, closed, and policy-bound counts. It reports totals for every supported workflow stage and final-outcome counts for closed consultations. Selecting a stage row focuses the existing queue filter; no duplicate reporting store or separate analytics route is created.
## CONS-1.9 Pipeline date range and source segmentation

The existing Agent Workspace pipeline now supports all-time, 7-day, 30-day, 90-day, and validated custom reporting windows of up to 366 days. The selected window scopes totals, stages, outcomes, and the existing queue consistently. Campaign, referral-source, and entry-source breakdowns use the same synchronized records and retain a visible Unattributed category when attribution is missing.



## CONS-2.0 Pipeline trend and CSV export

The existing Agent Workspace pipeline now displays consultation volume by received-date cohort and the current policy-bound conversion rate for each date bucket. Bucket granularity adapts to the active date range, and an accessible table exposes consultation, closing, and bound counts for every period. The Download pipeline CSV action exports one row per consultation in the active reporting window with customer, source, workflow, follow-up, and lifecycle fields; spreadsheet-formula prefixes are neutralized before download.


## NP-1.4 408FARMERS referral bridge

Anonymous neighbor shares now use the clean public route `https://408farmers.com/neighbor/r/[token]`. The 408FARMERS bridge presents a bounded full-screen handoff and transfers the token, share channel, and campaign attribution into the existing CoverageFit Home referred-homeowner welcome. Invalid links use `https://408farmers.com/neighbor/` and continue safely without a token. CoverageFit remains the only intake implementation.
