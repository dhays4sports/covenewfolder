# PC-1.2 — Producer Usability Polish

## Objective

Reduce producer disorientation in the existing long-form Consultation view by keeping one current task and one next action visible, without creating another workflow, navigation, or persistence system.

## Implemented capability

### Current Focus guide

The selected consultation now places a compact Current Focus guide immediately below the homeowner identity and contact actions. It displays:

- the current step number in the six-stage consultation sequence;
- the current stage and concise task summary;
- completion progress;
- a truthful notice when earlier steps still need attention; and
- one action linking to the existing Workspace surface for that stage.

On larger screens the guide stays in view below the existing header and view tabs while the producer moves through the consultation. On tablet and phone layouts it becomes a static, full-width guide with touch-friendly controls.

## Canonical derivation

The guide is rendered from `CoverageFitConsultationProgress.build()`, the same GC-1.8 model used by the detailed six-stage progress card. Checklist changes, recommendation judgments, consultation disposition, and secure follow-up therefore update both views from one model.

No alternate stage model, persistence key, API route, recommendation source, or assessment interpretation was added.

## Accessibility and safety

- The current guidance is announced politely when it changes.
- Completion uses native progressbar semantics and a visible text equivalent.
- Anchor offsets keep target headings visible below sticky Workspace controls.
- Earlier incomplete work is labeled as needing attention; it is never represented as complete or verified.
- The guide does not make a coverage, eligibility, discount, rate, underwriting, timing, or carrier outcome claim.

## Preserved boundaries

- PC-1.1 full-record hydration and consultation-specific checklist continuity remain intact.
- Checklist progress remains browser-local working state; PC-1.3 persistence and recovery hardening remains deferred.
- Protection Score math, assessment output, evidence classifications, producer recommendation control, closeout records, Consultation Document, attribution, FLOW, and RC-SMS architecture remain unchanged.
- 408FARMERS requires no runtime change for this producer-only Workspace sprint.

## Verification

Dedicated PC-1.2 QA covers one-source derivation, placement, current/attention/complete presentation, accessible progress semantics, responsive behavior, anchor visibility, safety boundaries, and architecture preservation. Complete CoverageFit regression, static, deployment, Cloudflare build, 408FARMERS cross-project, archive-integrity, and clean-room extraction checks are required before Deployable status.
