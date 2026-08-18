# PC-1.1 — End-to-End Consultation Workflow Audit

## Objective

Audit and harden the complete production consultation journey without creating another intake, assessment, workspace, persistence, or document system.

## Audited journey

`408FARMERS handoff → CoverageFit intake → Home assessment → saved consultation → Command Center → guided workflow → recommendations → closeout → homeowner document → later reopening`

## Defects corrected

### Full active-record hydration

The consultation inbox intentionally lists lightweight record summaries. The Workspace was also using that summary when deciding whether the selected review had a customer report. Because the summary does not carry the full assessment payload, the customer-report action could remain unavailable for a valid saved review.

The Workspace now resolves the full active record through the existing consultation-record service before deriving active-record actions. Queue and pipeline lists remain lightweight.

### Consultation-specific checklist continuity

Checklist persistence previously used the homeowner name and conversation-plan fingerprint. Two consultations with the same name and equivalent plan could therefore resolve to the same browser-local progress record.

The existing conversation plan now carries the opaque consultation ID, and the checklist derives its persistence identity from that ID. Legacy report-only journeys retain the prior deterministic fallback because they have no consultation record ID.

## Guardrails

- Checklist progress remains working state, not verified evidence or a professional recommendation.
- No assessment answer, finding, recommendation decision, completion field, or attribution value is changed.
- No personal information is added to URLs or checklist storage keys.
- The customer report and consultation document continue to use the existing saved record and print pipeline.
- No live SMS certification is claimed. RC-SMS-1.10 remains deferred until the 408-FARMERS number is ported.

## Verification

- Dedicated PC-1.1 QA covers exact-record hydration, report-action continuity, consultation-specific checklist separation, refresh/return restoration, sparse legacy fallback, and safety boundaries.
- Complete CoverageFit regression, static release, deployment, Cloudflare build, cross-project 408FARMERS contract, archive integrity, and clean-room extraction are required before Deployable status.
