## Current RC-SMS position

**RC-SMS-1.9.6 — Shared Number Operations Certification: COMPLETE (CoverageFit 3.20.71).** The pre-port shared-number architecture is certified across ownership, reply context, consent/suppression, outbound provenance, retries, legacy normalization, and collision recovery. **NEXT: RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification.**

## Agent Workspace UI 2 — Complete

- [x] AW-UI-2.1 — Simplified Workspace Architecture (3.20.61)
- [x] AW-UI-2.2 — Inbox-First Agent Navigation (3.20.62)
- [x] AW-UI-2.3 — Guided Consultation Focus Mode (3.20.63)
- [x] AW-UI-2.4 — Sticky Snapshot and Quick Actions (3.20.64)
- [x] AW-UI-2.5 — Mobile Agent Console (3.20.65)
- [x] AW-UI-2.6 — Accessibility and Regression Certification (3.20.66)

The authoritative scope, sequencing, invariants, and sprint-resumption notes are in `AW-UI-2_ROADMAP.md` at the deployable root.

## AW-UI-2.6 Accessibility and Regression Certification — Complete (3.20.66)

- Adds arrow-key, Home, and End navigation to Focus Mode and reliable focus transfer when switching between hidden Workspace views.
- Connects screen-reader instructions, native disclosure names, mobile action-region labeling, and status announcements without duplicating interaction state.
- Extends visible focus, contrast, reduced-motion, increased-contrast, forced-colors, and 400-percent zoom safeguards across the complete Workspace.
- Certifies the six AW-UI contracts, current static/deployment/API baselines, Safari-compatible fallbacks, protected backend equivalence, secret hygiene, and root archive.
- Approves controlled production deployment; physical Safari/VoiceOver and Windows screen-reader checks remain documented post-deploy operational evidence and are not represented as completed laboratory runs.

## AW-UI-2.5 Mobile Agent Console — Complete (3.20.65)

- Adds a bottom-safe action dock for Call, Text, the current stage, and a bounded More action sheet.
- Makes six-stage Focus Mode navigation swipeable and snap-aligned while horizontally centering the selected stage.
- Collapses homeowner context on compact screens and preserves the wide-desktop sticky snapshot.
- Adds safe-area spacing, mobile form and touch sizing, short-landscape density, and long-content overflow controls without hiding required guardrails.
- Reuses every existing destination and availability rule and adds no mobile storage, API route, database migration, or server mutation.

## AW-UI-2.4 Sticky Snapshot and Quick Actions — Complete (3.20.64)

- Keeps homeowner, property, review reason, top priority, consultation status, and recommended next step together in one compact desktop snapshot rail.
- Reuses existing Call, Text, Email, Consultation Document, and Client Snapshot destinations and availability rules.
- Stays sticky only on wide desktop and becomes a native expandable, non-sticky summary at smaller widths.
- Preserves Focus Mode and adds no customer store, action state, storage key, API route, database migration, or server mutation.

## AW-UI-2.3 Guided Consultation Focus Mode — Complete (3.20.63)

- Opens a selected consultation in one-stage Focus Mode using the existing six-stage Consultation Progress model.
- Provides direct, previous, next, and return-to-recommended-stage navigation with visible completion and attention states.
- Shows only the existing work relevant to Understand, Verify, Discuss, Recommend, Decide, or Next step while preserving one-click access to the full record.
- Keeps supporting context, evidence, and coaching in the established progressive disclosures.
- Adds no progress store, storage key, API route, database migration, or server mutation.

## AW-UI-2.2 Inbox-First Agent Navigation — Complete (3.20.62)

- Opens the Producer Inbox by default and preserves consultation-first behavior for direct links containing the existing opaque consultation ID.
- Summarizes all, needs-attention, new, and due-today reviews from existing delivery and follow-up state.
- Presents one readable homeowner row and one primary open/continue action per saved consultation.
- Keeps search visible and consolidates delivery, stage, and follow-up controls under More filters.
- Preserves true unread behavior until a review is actually opened and provides explicit connected, saved-device, empty, and no-match recovery states.
- Adds no queue storage, consultation state, API route, or server mutation.

## AW-UI-2.1 Simplified Workspace Architecture — Complete (3.20.61)

- Establishes a calmer CoverageFit shell inspired by the SMS Simulator without copying its customer-facing phone metaphor.
- Consolidates secondary workspace destinations into one accessible Tools menu and surfaces a five-stage review orientation.
- Keeps selected-customer context and Current Focus dominant while moving operational readiness behind progressive disclosure.
- Renames the primary workflow in producer language: Prepare, Work the review, and Record the outcome.
- Preserves every existing consultation, inbox, pipeline, persistence, recommendation, completion, document, FLOW, and RC-SMS contract.

## HOME-2.9 Mobile, Accessibility & Performance Certification — Complete (3.20.60)

- Certifies the Home transition and assessment contract from 320 px through desktop, including short landscape and safe areas.
- Adds route-specific keyboard, focus, label, validation, progress, reduced-motion, forced-colors, and touch-target safeguards.
- Keeps initial assessment transfer below 500 KB through SVG branding and ordered deferred scripts.
- Preserves the existing assessment, scoring, handoff, recovery, and completion architecture.

## HOME-2.8 Continuity, Branching & Recovery — Complete (3.20.59)

- Recovers trusted 408FARMERS browser handoffs when the transient transition marker is missing.
- Returns a recent misrouted renter to the bounded 408FARMERS renters path without exposing identity, contact, property, or assessment data.
- Leaves owner-occupied, landlord, and buyer contexts on the same existing Home assessment.
- Reuses the established seven-day assessment draft and preserves all scoring and completion behavior.

## HOME-2.7 Campaign Matching & QR Routing — Complete (3.20.58)

- Receives the canonical bounded flyer ZIP and creative variant from 408FARMERS short or compatible query routes.
- Acknowledges the matched campaign during the secure opening without presenting a quote, eligibility decision, savings promise, or assessment result.
- Carries campaign context into the existing consultation record while keeping it outside Protection Score calculations.
- Preserves the HOME-2.6 intent receiver, assessment, property confirmation, contact/consent reuse, and lead delivery.

## FLOW-1.5 Confirmed Assessment Entry and Responsiveness Correction — Complete (3.20.55)

- All property-owning 408FARMERS form funnels can now supply the structured address required for the established one-click property confirmation.
- Question two remains responsive because the checkpoint observer no longer watches and rewrites its own subtree.
- Manual addresses retain the editable property confirmation fallback; assessment and scoring contracts are unchanged.

## RC-SMS-1.9.4 Cross-Workflow Ownership + Producer Continuity — Complete (3.20.69)

- Separates persistent relationship ownership from expiring reply routing so producer continuity and specialized service/appointment/life/commercial context can coexist safely.
- Adds formal ownership transfer/pause/resume/release/close semantics, stable workflow IDs, and bounded workflow episode history under one shared SMS relationship.
- Preserves and restores the exact CoverageFit workflow step across producer takeover while keeping specialized routes human-safe and non-automated.
- Extends the outbound gateway with explicit transfer/release ownership effects, ownership targets, and bounded reply-context TTL preserved through retries.
- Adds protected producer controls for take/return/pause/resume/close/start/transfer/release/clear-context with no new D1 table, migration, or environment variable.
- `RC-SMS-1.9.5 — Global Consent + Suppression Boundary` is next. See `RC-SMS-ROADMAP.md`.

## RC-SMS-1.9.3 Multi-Source Outbound Registry + SMS Gateway — Complete (3.20.68)

- Makes a protected SMS gateway the single programmatic RingCentral send boundary and records source/workflow/reply-route/ownership provenance before delivery.
- Correlates RingCentral outbound echoes by provider message ID first, with a bounded hashed fingerprint compatibility fallback for external integrations.
- Preserves idempotency, retry provenance, producer-safe unknown outbound handling, and the existing shared-number orchestrator without a new D1 table or environment variable.

## RC-SMS-1.9.2 Shared Number Conversation Orchestrator — Complete (3.20.67)

- Separates shared-number channel status, conversation ownership, automation permission, workflow type/status, and preserved workflow state.
- Keeps explicit CoverageFit starts on the existing deterministic intake while routing fresh ambiguous messages producer-safe.
- Preserves the exact CoverageFit step when manual/unregistered RingCentral outbound activity transfers ownership to Dylan.
- Prevents customer replies during producer ownership from re-entering CoverageFit until the producer resumes the workflow.
- Requires no new D1 migration or environment variable and exposes redacted orchestration state in SMS Operations.
- See `RC-SMS-ROADMAP.md` for RC-SMS-1.9.3 through RC-SMS-1.10.

## RC-SMS-1.9.1 Immediate Producer Queue Alerts — Complete (3.20.54)

- Sends one deduplicated producer email when an SMS conversation first becomes actionable.
- Covers completed buyer/home/bundle intake, DYLAN requests, direct-handling requests, and second invalid-response escalation.
- Excludes prospect identity, contact data, property details, transcript, partner identity, and insurance details from email.
- Adds alert state and a protected test action to SMS Operations without changing the public journey or porting the production number.
- Keeps RC-SMS-1.10 production port/cutover and live carrier certification next.

## CRO-1.6.2.1 Intent Payoff and Promise Alignment — Complete (3.20.53)

- Customer outcome language is aligned from acquisition through transition, assessment, Snapshot, and producer follow-up.
- Professional intent remains visible without turning CoverageFit into an eligibility tool.
- Auto/renter acquisition no longer routes renters into the Home assessment.
- Questions, scoring, recommendations, lead delivery, and zero-repeat architecture are preserved.

## CRO-1.6.2 Professional Intent Continuity — Complete (3.20.52)

- Carries the professional discount eligibility-review purpose through transition, assessment, completion, private Snapshot, and Producer Workspace.
- Keeps Dylan’s licensed verification role explicit while CoverageFit remains non-decisional.
- Adds no assessment questions and changes no Protection Score, delivery, recommendation, or producer-decision logic.

# Production Consultation Readiness

- [x] PC-1.1 — End-to-End Consultation Workflow Audit
- [x] PC-1.2 — Producer Usability Polish
- [x] PC-1.3 — Consultation Persistence and Recovery Hardening
- [x] PC-1.4 — Print/PDF Production Certification
- [x] PC-1.5 — Live Producer Pilot Readiness
- [ ] PC-1.6 — Production Release Certification

## PC-1.1 End-to-End Consultation Workflow Audit — Complete (3.20.47)

- Audited the real saved-record path from normalized intake through assessment, Workspace guidance, recommendation and completion persistence, homeowner document generation, and later reopening.
- Fixed customer-report availability by resolving the full active consultation record after queue selection instead of relying on its lightweight display summary.
- Carried the opaque consultation ID into the existing conversation plan and checklist persistence key so similar homeowners cannot inherit one another's working progress.
- Retained a deterministic legacy fallback for report-only journeys that do not yet have a consultation record ID.
- Kept workflow progress separate from evidence verification, producer recommendations, homeowner decisions, quote status, and carrier authority.
- Certified the current 408FARMERS FLOW-1.4 sender against the later CoverageFit contract without changing the sender runtime or handoff payload.

## PC-1.2 Producer Usability Polish — Complete (3.20.48)

- Added a compact Current Focus guide directly under the selected homeowner so the producer can see the active consultation stage before entering the detailed Command Center.
- Reused the existing six-stage Consultation Progress model for current stage, completion percentage, attention state, guidance, and destination links.
- Kept one explicit next action visible while scrolling on larger screens and converted it to a calm, full-width static guide on smaller screens.
- Adjusted guided target offsets so Command Center, verification, questions, recommendation, disposition, and follow-up surfaces remain visible below the sticky controls.
- Added accessible live updates and progress semantics without changing checklist, recommendation, completion, or consultation-record persistence.
- Established the producer-orientation surface used by PC-1.3 recovery status.

## PC-1.3 Consultation Persistence and Recovery Hardening — Complete (3.20.49)

- Added a minimal progress checkpoint to the existing consultation record without introducing another checklist or workflow engine.
- Restores the newest valid device or consultation checkpoint and rejects stale, expired, or mismatched state.
- Secure inbox records synchronize through one bounded, authorized API; offline device progress remains fully usable.
- Gives the producer a visible saved, recovered, pending, or securely synchronized state.
- Established the recoverable consultation record used by the certified document path.

## PC-1.4 Print/PDF Production Certification — Complete (3.20.50)

- Added one central readiness profile over the existing Consultation Document renderer and browser print service.
- Checks the complete report shell, Letter page profile, running header and footer, page counters, print colors, readable split controls, final-page rule, and browser print capability before enabling printing.
- Gives the producer one calm output status and explicit Letter portrait, scale, background-graphics, browser-chrome, and final-review guidance.
- Hardens long-content pagination without changing assessment output, document story, recommendation order, producer decisions, or completion state.
- Keeps PC-1.5 Live Producer Pilot Readiness and deployed Safari/macOS device validation explicitly deferred.

## PC-1.5 Live Producer Pilot Readiness — Complete (3.20.51)

- Adds one preflight over the selected consultation, existing guided plan/checklist, secure PC-1.3 recovery path, existing Consultation Document action, and current-device Print Preview acknowledgement.
- Requires a server-backed consultation and connected secure producer inbox for the live pilot path; browser-local records remain available for ordinary offline work but do not satisfy the pilot gate.
- Gives the producer one next setup action and marks the path ready only when all five operational checks pass.
- Keeps the device acknowledgement limited to the selected consultation and current open Workspace session; it is not stored as a consultation result or production certification.
- Preserves the Command Center, Current Focus, Consultation Progress, Recommendation Builder, Consultation Completion, homeowner document, assessment, Protection Score, attribution, FLOW, and RC-SMS systems.
- Leaves execution evidence from the actual Dylan-led deployed Safari/macOS and physical-printer pilot, defect disposition, and final production release decision to PC-1.6.

# Guided Consultation

- [x] GC-1.1 — Consultation Command Center
- [x] GC-1.2 — Prospect Story
- [x] GC-1.3 — Priority Findings
- [x] GC-1.4 — Verify Before Advising
- [x] GC-1.5 — Guided Questions
- [x] GC-1.6 — Recommendation Builder
- [x] GC-1.7 — Explanation Assist
- [x] GC-1.8 — Consultation Progress
- [x] GC-1.9 — Consultation Completion

## GC-1.1 Consultation Command Center — Complete (3.20.30)

- The first selected-consultation view answers Who, Why, Status, Top Priorities, Verify, and Next Action.
- The command center derives from the existing workspace snapshot, evidence handoff, consultation stage, and checklist progress.
- Recommendation order and evidence classifications remain unchanged.
- No parallel intake, assessment, consultation, attribution, reporting, or SMS architecture was introduced.

## GC-1.2 Prospect Story — Complete (3.20.31)

- Preserved intake and attribution are summarized as one readable prospect narrative inside the Command Center.
- Review reason remains distinct from occupation, housing, campaign, referral, entry, and urgency context.
- Homebuyer, professional, bundle, homeowner, partner-referred, SMS, direct, and time-sensitive journeys receive safe bounded language.
- Internal attribution identifiers remain hidden, and no eligibility, discount, rate, underwriting, timing, or coverage result is asserted.

## GC-1.3 Priority Findings — Complete (3.20.32)

- The Command Center ranks up to three findings by the existing assessment priority signals instead of trusting display order alone.
- Each finding names its sequence, explains why it leads the consultation, and provides a bounded evidence-based discussion cue.
- Assessment priority score remains authoritative; evidence state only resolves otherwise comparable findings and never changes Protection Score math.
- Older reports fall back to their existing priority labels and source order.
- The full recommendation list, evidence classifications, and producer judgment remain intact.

## GC-1.4 Verify Before Advising — Complete (3.20.33)

- The Command Center separates clear homeowner reports, CoverageFit interpretations, unanswered assessment details, and explicit confirmation work.
- Known information remains labeled as homeowner-reported; it is not promoted to a verified policy fact.
- Inferred findings remain visibly system-derived and cannot silently become confirmed facts.
- Missing information and needs-confirmation work retain their existing evidence classifications and source prompts.
- The existing detailed evidence handoff remains the full working view below the Command Center.

## GC-1.5 Guided Questions — Complete (3.20.34)

- The existing conversation planner derives a bounded list of next-best questions from assessment evidence and ranked findings.
- Missing and partial homeowner details remain distinct from policy-verification work and property confirmation.
- Existing follow-up prompts and recommendation conversation starters supply the wording; no generic static script library was added.
- Duplicate questions for the same assessment key are suppressed, while the original agenda and checklist remain unchanged.
- Questions guide the producer without converting findings, inferred information, or homeowner reports into verified facts.

## GC-1.6 Recommendation Builder — Complete (3.20.35)

- The existing ranked findings now feed one structured producer-judgment workflow inside the During phase.
- Each finding keeps CoverageFit’s rationale and evidence state visible while producer verification and producer reasoning remain explicit separate inputs.
- A finding cannot be marked for carrier quoting until the producer attests that relevant facts and policy language were verified.
- Structured judgments persist in the existing consultation record locally or through the secure producer inbox.
- Recommendation output remains consultation support and does not become a carrier proposal, underwriting decision, or automated coverage conclusion.

## GC-1.7 Explanation Assist — Complete (3.20.36)

- Each existing ranked Recommendation Builder finding now includes progressively disclosed beginner-friendly coaching.
- The coaching separates the specific assessment issue, plain-language meaning, homeowner relevance, natural talk track, and carrier-verification work.
- Topic guidance is centrally derived from existing assessment identifiers and finding context rather than duplicated across pages or campaigns.
- Verification status and producer judgment adjust the coaching cue without changing, choosing, or persisting a recommendation.
- Final limits, forms, eligibility, underwriting, and coverage outcomes remain subject to carrier confirmation and the issued policy.

## GC-1.8 Consultation Progress — Complete (3.20.37)

- The existing Agent Workspace now presents one six-stage consultation sequence: Understand, Verify, Discuss, Recommend, Decide, and Next step.
- Progress is derived from the current checklist, producer verification attestations, recommendation judgments, disposition, and follow-up state rather than stored in a parallel tracker.
- One current step is emphasized, completed stages remain visible, and skipped earlier work is labeled Needs attention instead of being silently treated as complete.
- Every stage links to its existing working surface, while the detailed checklist remains the place where questions and checks are completed.
- Deferred findings stay visibly unresolved, and no assessment information becomes verified merely because the consultation advanced.

## GC-1.9 Consultation Completion — Complete (3.20.38)

- The existing After phase now includes one structured consultation closeout for decisions, unresolved work, carrier-quote status and requirements, and the assigned next action.
- Existing Recommendation Builder judgments, assessment evidence, and secure follow-up status remain visible as context rather than being duplicated into a new workflow.
- Ambiguous completion is prevented: open unresolved work requires an explanation, a quote waiting on items requires those items, and every closeout requires a decision summary and next action.
- Saving advances an early record to Consultation completed while preserving later stages and never closing the record automatically.
- Local and secure server-backed records use the same additive completion contract and preserve attribution, reporting, FLOW, and RC-SMS behavior.

# Consultation Document

- [x] CD-1.1 — Document Information Architecture
- [x] CD-1.2 — Executive Summary
- [x] CD-1.3 — Protection Snapshot
- [x] CD-1.4 — Priority Findings
- [x] CD-1.5 — Recommendation Explanations
- [x] CD-1.6 — Decisions and Next Steps
- [x] CD-1.7 — Consumer Language Pass
- [x] CD-1.8 — Producer/Consumer Consistency

## CD-1.1 Document Information Architecture — Complete (3.20.39)

- One immutable configuration defines the document's three-part reading order and seven canonical chapters.
- The current Print Engine sections now render as Review Overview, Property & Verification, and Consultation Record.
- Every part includes the same compact document map with the active part clearly identified.
- Semantic chapter markers establish bounded targets for CD-1.2 through CD-1.6 without adding a parallel document or report engine.
- Existing assessment, Protection Score, recommendation ordering, consultation persistence, attribution, reporting, FLOW, and RC-SMS behavior remain unchanged.

## CD-1.2 Executive Summary — Complete (3.20.40)

- The existing Review Overview now identifies the homeowner, home, contact information, and producer before explaining why the review started.
- One executive narrative summarizes what the existing assessment is showing without turning a response-based finding into a verified coverage fact.
- Strong foundation and first-focus callouts make the most useful starting context visible without changing Protection Score logic or recommendation ordering.
- Existing discussion priorities, missing information, and the derived next action remain visible in one scan-friendly sequence.
- Protection Snapshot refinement remains bounded to CD-1.3; downstream finding, recommendation, decision, language, and consistency work remains deferred to CD-1.4 through CD-1.8.

## CD-1.3 Protection Snapshot — Complete (3.20.41)

- One immutable presentation model maps the existing authoritative Protection Score into its canonical category, score range, interpretation, and scale position.
- The existing Review Overview score card now explains what the score means and how to use it during the consultation.
- A compact 0–100 band scale identifies the homeowner's position without changing the underlying score, bands, weights, or formula.
- Missing or invalid scores render a truthful Not scored state instead of being treated as zero.
- The card explicitly preserves the distinction between review readiness and any coverage, underwriting, pricing, eligibility, or policy decision.
- Priority Findings remain bounded to CD-1.4; later recommendation, decision, language, and consistency work remains deferred to CD-1.5 through CD-1.8.

## CD-1.4 Priority Findings — Complete (3.20.42)

- The existing Consultation Record now presents the three most meaningful findings in deterministic priority order using the established print recommendation model.
- Every finding clearly separates what the assessment found, why it appears in that position, and the evidence-aware action needed before advice is finalized.
- `Address first`, `Discuss next`, and `Also review` make the intended conversation sequence immediately scannable for a newer producer and understandable in the homeowner copy.
- Existing questions, exploration guidance, verification prompts, and note space remain in the Recommendations chapter instead of being rewritten early.
- Protection Score, assessment output, evidence classification, consultation persistence, attribution, FLOW, and RC-SMS behavior remain unchanged.
- Recommendation Explanations remain bounded to CD-1.5; later decision, language, and consistency work remains deferred to CD-1.6 through CD-1.8.

## CD-1.5 Recommendation Explanations — Complete (3.20.43)

- The Consultation Document now reuses the existing Recommendation Builder judgment and Explanation Assist education for each priority finding.
- Every topic separates recommendation status, verification readiness, what the topic means, why it matters, and the reason recorded by the producer.
- Undecided or unverified topics remain explicitly open and never appear as completed professional recommendations.
- `Recommend for carrier quote` remains a request for formal carrier evaluation, not a promise of coverage, pricing, eligibility, or underwriting approval.
- Existing assessment evidence and topic-specific policy checks remain visible in the conversation-support area.
- Decisions and Next Steps remain bounded to CD-1.6; later consumer-language and consistency work remains deferred to CD-1.7 and CD-1.8.

## CD-1.6 Decisions and Next Steps — Complete (3.20.44)

- The existing Consultation Document now consumes the structured closeout already saved by GC-1.9 instead of deriving a second decisions record.
- The chapter clearly presents what the homeowner decided, what remains open, formal carrier-quote status and requirements, finding-level producer judgments, and the agreed next action.
- Existing secure follow-up timing and notes appear beside the next action without duplicating scheduling or persistence.
- Completed closeouts and unfinished records have visibly different states; draft records never imply that a homeowner agreed, verification finished, or a quote was requested.
- Carrier forms, eligibility, underwriting, price, and issued-policy terms remain authoritative.
- The Consumer Language Pass remains bounded to CD-1.7; Producer/Consumer Consistency remains deferred to CD-1.8.

## CD-1.7 Consumer Language Pass — Complete (3.20.45)

- The existing three-part Consultation Document now uses one bounded consumer-language layer for CoverageFit-generated explanations.
- Score guidance, policy details, confirmation cues, recommendations, quote status, and final-policy guardrails use direct homeowner-readable language.
- Technical terms that must remain precise are explained inline, including the current policy summary (declarations page), estimated rebuilding amount, home deductible, and formal insurance quote.
- Homeowner decisions, producer-entered reasoning, record state, evidence classifications, recommendation judgments, and machine-readable document markers remain unchanged.
- The document continues to identify the formal quote and issued policy as the official sources and makes no coverage, price, eligibility, or insurance-company decision.
- Producer/Consumer Consistency remains bounded to CD-1.8.

## CD-1.8 Producer/Consumer Consistency — Complete (3.20.46)

- One immutable Producer/Consumer Story projection now connects the existing Command Center, Recommendation Builder, Consultation Completion record, and Consultation Document.
- The Workspace offers a progressive-disclosure preview of the story that will carry into the homeowner document without adding dashboard clutter.
- Review purpose, prospect narrative, priority IDs and order, confirmation details, recommendation state, completion state, and next action are sourced once and reused.
- The document no longer independently re-ranks its first three findings; it follows the same assessment-derived Command Center order Dylan sees.
- Unsaved or incomplete work remains clearly draft, and only saved producer judgments and completed closeout details appear as recorded decisions.
- The Consultation Document sprint family is complete. Any later document work should begin with an evidence-based audit of an actual defect or new product requirement.

# 408FARMERS Conversational SMS Intake

- [x] RC-SMS-1.1 — Conversation Engine and Protected Simulator
- [x] RC-SMS-1.2 — RingCentral Live Connection
- [x] RC-SMS-1.3 — Intent Router and Messaging Controls
- [x] RC-SMS-1.4 — Homebuyer Intake
- [x] RC-SMS-1.5 — Personalized CoverageFit Continuation
- [x] RC-SMS-1.6 — Realtor Partner Attribution
- [x] RC-SMS-1.7 — Producer Handoff and Manual Takeover
- [ ] RC-SMS-1.8 — Homeowner, Bundle, and RUSH Paths
- [ ] RC-SMS-1.9 — Operations Dashboard and Reliability
- [ ] RC-SMS-1.10 — 408-FARMERS Port Cutover

- **RC-SMS-1.1 Conversation Engine and Protected Simulator — Complete (3.20.19)**
  - Deterministic conversation state machine independent of RingCentral
  - Protected internal browser simulator using the existing producer access key
  - D1 persistence, refresh continuity, duplicate-message protection, and operator controls
  - Complete fictional buyer-path test with no live SMS and no credentials in the client
- **RC-SMS-1.2 RingCentral Live Connection — Complete (3.20.20)**
  - Server-side JWT authentication and configurable temporary sender
  - Validated inbound SMS webhook with duplicate-event suppression
  - One bounded automated welcome reply and protected connection health controls
  - Live carrier certification pending deployment credentials and a temporary SMS-enabled number
- **RC-SMS-1.3 Intent Router and Messaging Controls — Complete (3.20.21)**
  - Buyer, Home Review, Home and Auto, and Other classification from numeric or bounded natural language
  - STOP, START, RESTART, HELP, DYLAN, and AGENT controls
  - One useful invalid-response retry before producer queue
  - No repetitive automation after queue, takeover, completion, or opt-out
- **RC-SMS-1.4 Complete Homebuyer SMS Intake — Complete (3.20.22)**
  - Live and simulated buyer flows collect address, closing timing, occupancy, and auto-review interest
  - Natural date parsing, past-date correction, and operational RUSH priority are implemented
  - Secure personalized CoverageFit continuation remains RC-SMS-1.5


# Neighborhood Protection Pass

- [x] NP-1.1 — Post-Submission Share Module
- [x] NP-1.2 — Referred Homeowner Welcome
- [x] NP-1.3 — Anonymous Referral Links
- [x] NP-1.4 — 408FARMERS Referral Bridge
- [x] NP-1.5 — End-to-End Referral Attribution with any-ZIP A/B flyer identifiers
- [ ] NP-1.6 — Referral Funnel Reporting

## Neighborhood Protection Pass

- **NP-1.1 Post-Submission Share Module — Complete (3.20.14)**
  - Voluntary Text a Neighbor, native share, and copy-link actions after an acknowledged successful Home submission
  - Privacy-safe, session-scoped success gating tied to the matching private report
  - iPhone, Android, and desktop fallbacks without recipient contact collection
- **NP-1.2 Referred Homeowner Welcome — Complete (3.20.15)**
  - Exact `ref=neighbor` visitors receive a neighbor-shared Home welcome and five-minute CTA
  - Same-session refresh continuity uses a privacy-safe generic marker with six-hour expiry
  - Missing, invalid, duplicated, expired, and non-Home states retain safe default behavior
  - The existing CoverageFit Home page and `/assessment/` intake are reused without duplication
- **NP-1.3 Anonymous Referral Links — Complete (3.20.16)**
  - One random, non-sequential 90-day token is reused for each completed durable Home review
  - Hashed origin linkage and privacy-limited campaign/ZIP context are stored in D1 without homeowner PII
  - SMS, native share, and copy actions retain the same token with bounded channel markers
  - Invalid or expired tokens fall back to the safe generic neighbor welcome
- NP-1.4 408FARMERS Referral Bridge — planned
- NP-1.5 End-to-End Referral Attribution — planned
- NP-1.6 Referral Funnel Reporting — planned

## CONV-1.1 Zero-Repeat Handoff — Complete (3.20.13)

- Recognized 408FARMERS Home handoffs now move from the animated transition directly into the assessment.
- The transition explicitly explains that the 408FARMERS review is continuing through CoverageFit.
- Complete transferred addresses use one-click confirmation, while corrections and optional property details remain available.
- Previously supplied contact fields are carried forward; only missing required information or permission is requested.
- Eligible completed assessments automatically use the existing private-report, consultation, D1, Formspree, and notification path before opening the Protection Snapshot.
- CoverageFit Home and the standard editable forms remain available for direct, incomplete, and unrecognized traffic.
- Protection Score, evidence, recommendation, D1 schema, authentication, private-report, consultation, and producer-notification contracts remain unchanged.

Next: **CONV-1.2 Snapshot-to-Conversation Conversion**

## DOC-1.2 Call-Ready Consultation Guide — Complete (3.20.12)

- The internal Agent Guide now prioritizes readable live-call use rather than a fixed three-page export.
- Discussion topics use one sequential flow: What we know, Ask, What to explore, Check, and Notes.
- Unavailable property fields are omitted, while known report data remains unchanged.
- Evidence labels use plain producer language without changing stored evidence states.
- Decisions, missing information, owner, due date, follow-up method, and notes have dedicated capture areas.
- CSS page counters are enabled and the guide may extend beyond three pages.
- Print adapters, scoring, report data, D1, authentication, private reports, and producer notifications remain unchanged.

Next: **Controlled live print and call workflow certification**

## AW-7.1 Consultation-First Agent Workspace — Complete (3.20.11)

- Consultation is now the default selected-record view, with Inbox and Pipeline available as separate accessible views.
- The active homeowner appears first with call, text, email, review reason, property, and received-date context.
- Selected consultations are organized into Before, During, and After phases.
- The existing conversation timeline and checklist now share one working consultation flow.
- Secure inbox setup collapses after connection, while record search, pipeline reporting, disposition, follow-up, notes, activity, Agent Guide, and Client Snapshot access remain available.
- Producer-facing evidence labels are simplified without changing stored evidence quality or report contracts.
- D1, authentication, scoring, consultation records, pipeline calculations, report generation, private-report access, and notification behavior remain unchanged.

Next: **Controlled live print and call workflow certification**

## ASMT-1.8 Consumer Clarity and Completion Optimization — Complete (3.20.10)

## ASMT-1.7 Assessment Continuity and Respectful Exit — Complete (3.20.9)

- Home assessments save answer selections and the current question locally after every response and navigation action.
- A visible Save & Exit flow pauses the review for seven days without creating a score, report, consultation, or producer notification.
- Returning homeowners can continue at the exact saved question or start over, while confirmed property context and early-insight state remain aligned.
- Expired and completed drafts are removed automatically, and pause, resume, expiration, restart, and completion states are tracked.
- Assessment questions, weights, evidence classification, scoring, priority ordering, reports, D1, and notification behavior remain unchanged.

## RPT-1.3 Agent Workspace Customer Report Recovery — Complete (3.20.8)

# CoverageFit Assessment and Scoring

- **ASMT-1.1 Protection Score Methodology and Normalization — Complete (3.20.1)**
  - Protection Score measures response-based review readiness and clarity, not policy adequacy.
  - Overall and category scores use one normalized weighted formula and one authoritative band table.

- **ASMT-1.2 Assessment Question Validity and Bias Audit — Complete (3.20.2)**
  - Home questions use neutral, verifiable answer states and distinguish strengths, considerations, uncertainty, and identified gaps.

- **ASMT-1.3 Property-Aware Assessment Personalization — Complete (3.20.3)**
  - Homeowner-confirmed pools, detached structures, older roofs, and older-home context conditionally tailor questions and priority ordering without underwriting conclusions.

- **ASMT-1.4 Review-Reason-Aware Assessment Prioritization — Complete (3.20.4)**
  - Home purchase, renewal, non-renewal or cancellation, and premium-increase journeys add truthful question context and bounded priority-ordering boosts.
  - Review reason does not change question weights, answer impacts, the numeric Protection Score, or category scores.
  - Applied reason, contextual questions, and ranking adjustments are retained transparently in the report payload.

- **ASMT-1.5 Assessment Completion and Evidence Quality — Complete (3.20.5)**
  - Every active finding is classified as confirmed, partial, needing verification, or missing without adding questions or document requests.
  - Required missing responses return the homeowner to the first incomplete topic and cannot be saved as a finalized private Snapshot.
  - Completed Snapshots show clear-response and follow-up counts, while reports preserve evidence and completion metadata for the producer handoff.
  - Evidence quality does not change question weights, answer impacts, weighted penalties, category scores, the Protection Score, or priority ordering.

- **ASMT-1.6 Evidence-Aware Consultation Handoff — Complete (3.20.6)**
  - Confirmed facts, policy-verification items, and unresolved questions are normalized into one producer handoff.
  - Agent Workspace, the Conversation Planner, the Consultation Checklist, and the Consultation Document use the same grouped evidence contract.
  - Legacy records remain accessible with a truthful manual-review state.
  - Scoring, evidence classification, property and review-reason boosts, recommendation calculations, and topic ordering remain unchanged.

Next assessment priority: controlled live completion testing and funnel measurement.

# CoverageFit Cloudflare Runtime

- **OPS-CF-1.1 Cloudflare Runtime Migration — Complete (3.20.0)**
  - Existing GitHub → Cloudflare Pages deployment remains the production architecture
  - All producer inbox and private report APIs are implemented as Cloudflare Pages Functions under `/api/`
  - Cloudflare D1 replaces Netlify Blobs for consultation records, private reports, and rate-limit state
  - Production and preview environments use the `COVERAGEFIT_DB` binding and `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` secret
  - Opaque report links, 30-day expiration, Agent Workspace behavior, customer report behavior, and browser-local fallbacks remain intact

Next: **OPS-CF-1.2 Live Preview and Production Certification**

# CoverageFit Prospect Report Access

- **RPT-1.2 Private Durable Prospect Report Access — Complete (3.19.31)**
  - Completed Home reviews receive a 256-bit opaque private report identifier
  - Report identifiers remain in the URL fragment instead of query strings, keeping personal information out of URLs and normal page requests
  - Cloudflare Pages Functions and D1 provide cross-device report retrieval with 30-day expiration after OPS-CF-1.1
  - Expired, deleted, invalid, temporarily unavailable, and device-only fallback states are truthful and recoverable
  - Public report payloads omit customer contact details, session identifiers, consultation identifiers, and internal personalization data

Next: **OPS-CF-1.2 Live Preview and Production Certification**

# CoverageFit Consultation Management

- **CONS-1.1 Completed Review Consultation Handoff — Complete (3.19.19)**
  - Completed Home review submissions create durable browser-local consultation records
  - Records retain the final assessment, consumer, property, campaign, and recommendation context
  - Existing Agent Workspace can open and switch between saved homeowner consultation records
  - Selected records mirror into the legacy report key so current report, print, planner, and checklist behavior remains compatible
- **CONS-1.2 Consultation Document Access — Complete (3.19.20)**
  - Active saved records expose a visible Open consultation document Workspace action
  - The internal document route generates the certified Print Engine output from the selected opaque consultation record
  - Producers can print the document or choose Save as PDF from the browser print dialog
  - Direct empty, missing-record, and renderer-failure states remain accessible and recoverable

- **CONS-1.3 Server-Backed Producer Inbox Foundation — Complete (3.19.21)**
  - Completed Home reviews submit to a same-origin, rate-limited Cloudflare Pages Function and persist in D1 after OPS-CF-1.1
  - Producer inbox reads require a Functions-scoped access key and fail closed when the key is absent or invalid
  - Agent Workspace can connect, sync remote reviews, and import them into the existing consultation workflow
  - Browser-local records and Formspree remain available when server delivery or inbox access is unavailable

- **CONS-1.4 Producer Inbox Delivery State and Record Acknowledgment — Complete (3.19.22)**
  - Server receipt records a durable delivered timestamp and exposes newly delivered reviews as New
  - Viewing a selected remote consultation advances it to Opened through the authenticated status endpoint
  - Producers can explicitly acknowledge a remote review from the existing consultation selector
  - Server and browser-local lifecycle state remain synchronized without downgrading advanced records

- **CONS-1.5 Producer Inbox Search, Filters, and Follow-Up Queue — Complete (3.19.23)**
  - Agent Workspace searches consultations by homeowner, contact, address, review reason, campaign, and follow-up note
  - Delivery-status and follow-up filters create a focused actionable queue
  - Server-backed records support scheduled follow-up dates, short action notes, completion, and clearing
  - Overdue, due-today, upcoming, completed, and unscheduled states persist across producer inbox sessions

- **CONS-1.6 Consultation Notes and Activity Timeline — Complete (3.19.24)**
  - Server-backed records support persistent producer notes
  - The existing Workspace displays a latest-first chronological activity timeline
  - Delivery, opening, acknowledgment, follow-up changes, notes, consultation documents, and customer-report access are recorded
  - Legacy remote records gain truthful synthesized lifecycle history when loaded

- **CONS-1.7 Consultation Outcome and Disposition — Complete (3.19.25)**
  - Every consultation has an actionable workflow stage from review receipt through closing
  - Closing requires one supported final outcome and an optional disposition note
  - Reopening clears the current final outcome while preserving the chronological activity history
  - Queue search, stage filtering, local storage, and server-backed records use the same disposition contract

- **CONS-1.8 Consultation Pipeline Summary and Outcome Reporting — Complete (3.19.26)**
  - Existing Workspace displays total, open, closed, and policy-bound consultation counts
  - Every supported workflow stage reports a synchronized record total and pipeline share
  - Closed consultations report final-outcome counts and shares without changing source records
  - Stage-summary actions focus the existing queue while preserving all current search and filters

- **CONS-1.9 Consultation Pipeline Date Range and Source Segmentation — Complete (3.19.27)**
  - Pipeline reporting supports all-time, 7-day, 30-day, 90-day, and validated custom date ranges
  - The selected reporting window scopes totals, stages, outcomes, and the existing consultation queue consistently
  - Campaign, referral-source, and entry-source counts and shares are reported from the same synchronized records
  - Unattributed records remain visible rather than being silently excluded

- **CONS-2.0 Consultation Pipeline Trend and Export — Complete (3.19.28)**
  - The existing pipeline summary displays date-bucketed consultation volume and policy-bound conversion
  - Bucket granularity adapts from daily through yearly without dropping records from the selected reporting range
  - An accessible detail table exposes consultations, closed records, policy-bound outcomes, close rate, and conversion rate for every bucket
  - Producers can download a formula-safe CSV containing one consultation row from the active reporting window

- **DOC-1.1 Consultation Document Production Audit and Compression — Complete (3.19.29)**
  - The default agent document is compressed to three practical pages with an optional branded cover
  - Current carrier, reconstruction limit, deductible, premium, and renewal data flow into the print model correctly
  - Recommendation reasoning, conversation questions, producer guidance, missing information, decisions, and next action are preserved
  - Recommendations, checklist guidance, and timeline content are consolidated into one Coverage Conversation Guide

- **RPT-1.1 Prospect Snapshot Composition and Print Compression — Complete (3.19.30)**
  - The prospect report is consolidated into one personalized overview, three educational topics, and one next-step page
  - Duplicate covers, score treatments, strengths, actions, timelines, and CTAs are removed
  - Customer-facing confidence percentages are removed while the strongest explanation and discussion guidance is preserved
  - Letter print output uses three deterministic pages with explicit page labels


- **CONS-2.1 Privacy-Safe New Review Notification — Complete (3.20.7)**
  - New completed Home reviews can trigger one generic producer email linked to the secure Agent Workspace.
  - Email excludes homeowner, property, score, finding, review reason, report-token, campaign, and session information.
  - Idempotency and a bounded retry prevent duplicate or uncontrolled delivery attempts.
  - Provider failure does not block D1 persistence or homeowner completion.
  - Agent Workspace shows sent, failed, skipped, pending, and legacy alert states truthfully.

Next: **OPS-CF-1.2 Live Preview and Production Certification**

# CoverageFit v4.0 — Transition Experience

- **TX-1.1 Transition Route & State Management — Complete (3.19.9)**
  - Reachable `/transition/` route
  - Existing prefill/session contract preserved
  - URL-private handoff state
  - Refresh, fallback, and history-safe redirect behavior
- **TX-1.2 Premium Transition UI — Complete (3.19.10)**
  - Premium branded transition surface
  - Responsive and short-viewport layouts
  - Accessible status, focus, no-script, and reduced-motion handling
  - TX-1.1 routing and privacy contract preserved
- **TX-1.3 Intelligent Progress Timeline — Complete (3.19.11)**
  - Four timed onboarding milestones
  - Final Home Protection Dashboard preparation state
  - Accessible live announcements and reduced-motion-safe progression
  - Neutral missing-session fallback timeline
- **TX-1.4 Dynamic Transition Personalization — Complete (3.19.12)**
  - Review-reason-specific heading and supporting copy
  - Tailored milestone and final-dashboard wording
  - New-home, renewal, non-renewal, and premium-increase contexts
  - Neutral fallback for occupational and unknown contexts
- **TX-1.5 Property Confirmation — Complete (3.19.13)**
  - Runtime-validated transferred property address display
  - Pending and confirmed property card states synchronized to the timeline
  - Structured-address fallback assembly
  - Neutral no-address behavior without false home-location claims
- **TX-1.6 Personalized CoverageFit Welcome — Complete (3.19.14)**
  - Short-lived non-PII completed-onboarding receipt
  - Existing Home hero acknowledges the completed transition journey
  - Contextual welcome copy and CTA for new-home, renewal, non-renewal, and premium-increase reviews
  - Direct-visitor, stale-receipt, session-mismatch, and non-Home destination safeguards
- **TX-1.7 Session-Based Personalization Engine — Complete (3.19.15)**
  - Canonical session context for identity, contact, property, review reason, campaign, referral, entry point, assessment, and session ID
  - Profile and attribution normalization with deterministic precedence and stale-session isolation
  - Shared consumption across transition, Home welcome, assessment prefill, contact prefill, and assessment payload
  - Personalized Home completion detail using the canonical name and property context
- **TX-1.8 Hero Personalization Components — Complete (3.19.16)**
  - Reusable greeting, journey-context, reason-banner, and dynamic-CTA renderers
  - Named welcome and complete reason-specific journey heading
  - Review-reason and property context chips plus carried-forward CTA reassurance
  - Existing Home hero, canonical session context, and direct-visitor fallback preserved
- **TX-1.9 Transition Polish — Complete (3.19.17)**
  - Shared motion duration and easing tokens
  - Refined entrance, milestone, mobile, reduced-motion, and exit behavior
  - First-painted-frame focus management and 44-pixel mobile continuation target
  - Page-exit timer, focus-frame, and delayed-navigation cleanup
- **TX-2.0 Home Protection Dashboard Handoff — Complete (3.19.18)**
  - Existing personalized Home arrival converted into a dashboard-first experience
  - Contact, property, review-focus, and Coverage Review readiness summary
  - Canonical session context and completion-receipt safeguards preserved
  - Direct visitors continue receiving the existing marketing Home page
- **Transition Experience Epic — COMPLETE**

## P1.6 Professional Report Shell

- **P1.6.1 Professional Report Shell Foundation — Complete (3.19.0)**
  - Reusable report-shell service
  - Model-driven cover page
  - Shared running print header/footer
  - Renderer integration
- **P1.6.2 Shared Header/Footer Content Integration — Complete (3.19.1)**
  - Producer and agency details
  - Report reference and document label
  - Structured running header/footer content
- **P1.6.3 Page Numbering and Print Continuity — Complete (3.19.2)**
- **P1.6.4 Report Shell Certification — Complete (3.19.3)**

Next: **P1.7.1 Cross-Section Print Integration Foundation**

Current: P1.5.3 Professional Consultation Timeline Layout complete.

Next: P1.6 Professional Report Shell, beginning with report metadata and document-level header/footer composition.

Current: P1.5.2 Consultation Timeline Renderer complete.
Next: P1.5.3 Professional Consultation Timeline Layout.

## Current: P1.4.3 Professional Checklist Layout — Complete

Next: P1.5.1 Consultation Timeline Data Model.

## Completed: P1.3.6 Recommendation Print Polish
Multi-page recommendation sections now include category-heading continuity, protected cards, widow/orphan controls, and print-specific spacing.

## P1.3.4 Recommendation Ordering

- Deterministic model-level priority and category ordering is complete.
- Exact ties preserve source order; grouping remains deferred to P1.3.5.

## P1 Printable Consultation

- P1.1 Executive Summary: complete.
- P1.2 Property Summary: complete through professional layout (P1.2.3).
- Next: P1.3 Recommendations.

## Printable Consultation MVP
- P1.1.1 Executive Summary Data Model: Complete
- P1.1.2 Executive Summary Renderer: Next

## v3.16.6

AW-6A.5 completed. Automatic renderer selection, end-to-end pipeline, renderer QA, and public Print Engine APIs finalized.

## Completed

- 3.6.1: Sprint B.1.1 CoverageFit Attribution Receiver.

- 3.6.0: Fully registered shared recommendation pipeline for Home and Business.

# Roadmap
- v3.1 ✅ Report Engine Refinement
- v3.2 ✅ Dynamic Illustration Engine
- v3.3 ✅ Journey Timeline Engine
- v3.4 ✅ Trigger Library
- v3.5 ✅ Shared Recommendation Engine
- v4.0 Home 2.0

Next integration milestone: B.1.2 — 408-FARMERS Attribution Sender.

Product roadmap resumes with v4.0 Home 2.0 after the integration milestone.


## Phase B — Recommendation Intelligence
- [x] B.2A Recommendation Intelligence metadata and Home report enrichment
- [ ] B.2B Confidence calibration and rule-level overrides
- [ ] B.2C Recommendation categories and customer grouping
- [ ] B.2D Producer talking-point workspace
- [ ] B.2E Cross-product recommendation ordering

## Phase B — Property Intelligence
- [x] B.4A Property Intelligence framework and provider contract
- [x] B.4B Home assessment prefill and editable confirmation
- [ ] B.4C Score, recommendation, trigger, and report integration
- [ ] B.4D Provider resilience and end-to-end QA

- B.13A.1 complete

## Agent Workspace Rebuild

- [x] AW-1 Workspace Foundation
  - Internal `/agent/workspace/` route
  - Responsive workspace shell and header
  - Executive summary and Protection Score
  - Property snapshot
  - Top recommendation topics
  - Empty-state and refresh behavior
- [x] AW-2 Shared Data Layer
  - Versioned read-only workspace adapter
  - Normalized customer, assessment, recommendation, and property contract
  - Diagnostics and storage subscriptions
  - AW-1 renderer migrated to the shared adapter
- [x] AW-3 Conversation Planner Engine
  - Deterministic agenda generation from the AW-2 snapshot
  - Priority, confidence, and source-order topic sequencing
  - Opening, property context, review, connection, and close phases
  - Estimated timing, prompts, coaching notes, guardrails, and diagnostics
  - Workspace wiring for AW-4 timeline consumption
- [x] AW-4 Conversation Timeline UI
- [x] AW-5 Consultation Checklist
  - [x] AW-5A Checklist Engine
  - [x] AW-5B Checklist UI
    - [x] AW-5B.1 Consultation Checklist Sidebar Shell
    - [x] AW-5B.2 Checklist Rendering
    - [x] AW-5B.3 Checkbox Interaction
    - [x] AW-5B.4 Progress Display
    - [x] AW-5B.5 Timeline Synchronization
    - [x] AW-5B.6 Accessibility
    - [x] AW-5B.7 Mobile Optimization

## Workspace Production Readiness

- [x] WR-1 Workspace Production Readiness
  - [x] WR-1A Validation & Regression Hardening
  - [x] WR-1B UI, Accessibility & Performance Polish
    - [x] WR-1B.1 Design Tokens & Visual Consistency
    - [x] WR-1B.2 Loading Experience
    - [x] WR-1B.3 Empty & Error States
    - [x] WR-1B.4 Motion System
      - [x] WR-1B.4.1 Motion Foundation
      - [x] WR-1B.4.2 Checklist Motion
      - [x] WR-1B.4.3 Timeline & Progress Motion
      - [x] WR-1B.4.4 Workspace Polish Motion
      - [x] WR-1B.4.5 Motion Audit
    - [x] WR-1B.5 Component Cleanup
    - [x] WR-1B.6 Render Performance
    - [x] WR-1B.7 Memory & Event Audit
    - [x] WR-1B.8 Responsive Refinement
    - [x] WR-1B.9 Interaction Polish
    - [x] WR-1B.10 Production Candidate
  - [x] WR-1C Documentation, Production Audit & Release Candidate

WR-1B.1 completed in v3.14.1 with a semantic Workspace design-token layer and visual consistency normalization.

WR-1A completed in v3.14.0. The Workspace now has realistic complete, partial, and empty-data walkthroughs plus resilience coverage for repeated mutations, refresh restoration, storage failures, corrupt persistence, missing planner data, responsive transitions, keyboard safeguards, and event integration.

- [ ] AW-6 Printable Consultation Sheet
  - [x] AW-6A.1 Print Engine Skeleton
  - [x] AW-6A.2 Print Model Validation & Section Contracts
  - [ ] AW-6A.3 Print Model Snapshot & Serialization Boundary
  - [ ] AW-6B Printable Layout
  - [ ] AW-6C Print Styling
  - [ ] AW-6D Browser Print Integration
  - [ ] AW-6E Print QA
- [ ] AW-7 Workspace Notes
- [ ] AW-8 Workspace Polish and QA

AW-1 was rebuilt from the v3.10.0 B.4B production baseline. AW-2 now provides the active shared workspace data boundary. AW-3 provides the active conversation-plan contract. AW-5A.3 now provides persistent checklist state for the future checklist interface. Abandoned B.13A workspace experiments are not part of the active architecture.

- [x] AW-5A.1 Checklist Data Model
- [x] AW-5A.2 Planner-to-Checklist Generation
- [x] AW-5A.3 Persistent Checklist State
- [x] AW-5A.4 Progress, Reset, and Workspace Contract

AW-5A.4.1 Progress Engine implemented.


- AW-5A.4.2A: Added reset()/clear() skeleton APIs.

- AW-5A.4.2B: Added resetItem API.

AW-5A.4.2C Reset Phase implemented.

- AW-5A.4.2D Persistence Integration

- AW-5A.4.2E Planner Regeneration implemented.


## AW-5A.4.3A
- Added immutable getWorkspaceState() public contract skeleton exposing checklist, summary, diagnostics and version. No UI or persistence changes.


## AW-5A.4.3B
- [x] Expanded the immutable checklist workspace contract with progress, current phase, remaining minutes, and planner version.
- [x] AW-5A.4.3C Refactor `agent-workspace.js` to consume only `getWorkspaceState()`.

## Completed — AW-5A.4.3C Workspace Contract Integration

The Agent Workspace now reads checklist data exclusively through the immutable `getWorkspaceState()` contract. Checklist lifecycle initialization remains internal to the engine boundary.

### Completed — AW-5A.4.4A Event System Skeleton

The checklist engine now owns ready, change, and reset lifecycle events. No Workspace listeners were added.

### Completed — AW-5A.4.4B Workspace Event Integration

The Agent Workspace now consumes checklist state exclusively through ready, change, and reset event payloads. Direct checklist-state refresh reads have been removed.

### Completed — AW-5A.4.5A Diagnostics Expansion

Checklist diagnostics now expose engine and planner identity, a deterministic checklist fingerprint, storage health, generation timestamp, and integrity status through the immutable Workspace contract.

### Completed — AW-5A.4.5B Regression Suite

The Consultation Checklist engine now has end-to-end behavioral coverage for progress, resets, planner regeneration, persistence compatibility, diagnostics, and Workspace contract integrity. AW-5A engine work is complete.

### Completed — AW-5A.4.6 Release Stabilization

The AW-5A release baseline now includes portable tests, one-command regression execution, static route and asset validation, and normalized release documentation.

### Completed — AW-5B.1 Consultation Checklist Sidebar Shell

The Agent Workspace now includes a responsive, state-aware checklist sidebar shell with loading, empty, error, progress-placeholder, and phase-placeholder regions. Checklist content and mutations remain deferred.

### Completed — AW-5B.2 Checklist Rendering

The checklist sidebar now renders real phases and discussion items from the immutable Workspace contract. Rendering remains read-only and includes current, active, completed, required, optional, and estimated-time states.

### Next
### Completed — AW-5B.5 Timeline Synchronization

- Restored a visible planner-backed conversation timeline in the Agent Workspace.
- Synchronized timeline states and activation with the event-driven checklist.
- Preserved the checklist engine as the only consultation state authority.

AW-5B.6 — Accessibility. Complete in v3.13.6.


### Completed — AW-5B.3 Checklist Interaction

Added engine-backed completion, reopening, active-item selection, item reset, phase reset, and full reset controls. All rendered updates continue to arrive through checklist lifecycle events.


### Completed — AW-5B.4 Progress Display
Live percentage, counts, remaining minutes, current phase, and consultation-complete state are rendered from the workspace contract.


### Completed — AW-5B.7 Mobile Optimization
Completed in v3.13.7. AW-5B Consultation Checklist UI milestone is complete.

WR-1B.2 completed in v3.14.2 with intentional Workspace and checklist skeleton loading states.

WR-1B.4.1 completed in v3.14.4 with shared motion tokens, reusable CSS utilities, a reduced-motion-aware JavaScript helper, and no component-specific animation changes.

WR-1B.4.2 completed in v3.14.5 with reduced-motion-aware checklist state transitions.

WR-1B.4.3 completed in v3.14.6 with timeline state transitions, progress feedback, and smooth current-topic positioning.

WR-1B.5 completed in v3.14.9 with shared component classes and additive compatibility hooks across static and generated Workspace surfaces.

WR-1B.6 completed in v3.15.0 with stable render signatures, targeted progress updates, and lightweight Workspace performance diagnostics.

WR-1B.9 completed in v3.15.3 with refined control feedback, reduced-motion-safe positioning, accessible keyboard shortcuts, refresh guarding, and reset-cancellation feedback.

WR-1B.10 completed in v3.15.4 with a frozen production-candidate baseline and consolidated accessibility, performance, regression, and release-readiness documentation. WR-1B is complete; WR-1C remains the final manual production gate.


### Completed — WR-1C.2 Deployment Verification

Completed in v3.15.5. Added and validated Netlify-compatible deployment controls, route metadata, security/cache headers, web manifest, robots, sitemap, 404 handling, and automated deployment QA. Live production deployment and cross-browser certification remain separate manual gates.


### Completed — WR-1C.3 Cross-Browser Certification

Completed in v3.15.6. Added a browser support baseline, automated compatibility checks, guarded browser API fallbacks, Chromium route smoke validation, and explicit manual browser/device sign-off boundaries.

### Completed — WR-1C.6 Regression Freeze & API Baseline

Completed in v3.15.7. Froze public Workspace APIs, events, persistence schemas, diagnostics, and immutable contract fields with machine-readable documentation and automated compatibility enforcement.

### Next

### Completed — WR-1C.7 Release Notes

Completed in v3.15.8 with official release notes, release highlights, migration guidance, and automated documentation validation.

### Completed — WR-1C.8 Workspace Readiness Score & Final Production Certification

Completed in v3.15.9. WR-1 is closed and the Home-focused Agent Workspace is certified as the stable v3.15 production baseline.

### Active — AW-6 Printable Consultation Sheet

AW-6A.1 completed in v3.16.0. AW-6A.2 completed in v3.16.1 with immutable section contracts and validation. The next sprint is AW-6A.3 Print Model Snapshot & Serialization Boundary.


## AW-6A.3
Implemented print snapshot & serialization boundary.


### Completed — AW-6A.4 Print Data Adapters

Completed in v3.16.4 with a working adapter registry, registered Home adapter, Print Engine delegation, immutable adapter diagnostics, and backward-compatible direct-source fallback.

### Next

AW-6B.1 — Printable Layout Shell.
## AW-6B Printable Consultation Architecture

- **AW-6B.1A — Print Section Registry: Complete in v3.16.7.** Runtime registry, validation, ordering, metadata, diagnostics, and dependency wiring are implemented.
- AW-6B.1B — Section Definitions: Next. Register reusable section contracts without changing visible output.
- AW-6B.1C — Document Composer: Planned.
- AW-6B.1D — Visibility and Empty States: Planned.
- AW-6B.1E — Renderer Integration: Planned.
- AW-6B.1F — Composition Diagnostics: Planned.
- AW-6B.1G — Architecture Certification: Planned.


## AW-6 Printable Consultation
- [x] AW-6B.1A Section Registry
- [x] AW-6B.1B Section Definitions
- [x] AW-6B.1C Document Composer
- [ ] AW-6B.1D Visibility Engine
- [ ] AW-6B.1E Renderer Integration
- [ ] AW-6B.1F Diagnostics
- [ ] AW-6B.1G Certification

### AW-6B.1D — Visibility Engine — Complete
Runtime section visibility, missing-data handling, empty-state decisions, and composer integration are implemented. HTML renderer integration remains deferred.
## AW-6B.1E — Renderer Integration — Complete
The HTML renderer now consumes the Document Composer and invokes registered visible section renderers in deterministic order. Printable content remains deferred to AW-6B.2 and later component sprints.

### P1.1.3 — Executive Summary Professional Layout — Complete
Professional first-page composition, responsive layout, and print styling implemented.

- P1.2.2 Property Summary Renderer: Complete.
- Next: P1.2.3 Professional Property Layout.

- [x] P1.3.1 Recommendation Data Model
- [ ] P1.3.2 Recommendation Renderer
- [ ] P1.3.3 Professional Recommendation Layout

- [x] P1.3.3 Professional Recommendation Layout — completed in v3.18.0.
- [ ] P1.3.4 Recommendation Ordering.
- [ ] P1.3.5 Recommendation Groups.

- [x] P1.3.5 Recommendation Groups
- [ ] P1.3.6 Recommendation Print Polish

## P1.4 Checklist

- **P1.4.1 Checklist Data Model — Complete**
- **P1.4.2 Checklist Renderer — Complete**
- P1.4.3 Professional Checklist Layout — Next

### Completed: CF-INT-1F
Unified assessment payload is now available for Consultation and Agent Workspace propagation.

- [x] NP-1.4 — 408FARMERS Referral Bridge: clean branded token paths, full-screen trust handoff, safe generic fallback, and preserved CoverageFit referral mode


## RC-SMS-1.9 — COMPLETE
Protected SMS operations dashboard, operational status classification, retry queue, webhook health, stale detection, retention cleanup, redacted audit events, and campaign reporting. Next: RC-SMS-1.10 production port/cutover and live carrier certification.
