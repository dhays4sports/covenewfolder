# ASMT-1.5 — Assessment Completion and Evidence Quality

## Goal

Evaluate whether every active assessment finding contains enough clear homeowner-reported evidence to support the licensed follow-up, improve incomplete-answer handling, and preserve a low-friction questionnaire and unchanged Protection Score formula.

## Acceptance criteria

- Existing Home assessment questions, property personalization, and review-reason prioritization remain integrated.
- No new questions, uploads, or exact-policy-detail requirements are added.
- Every active finding receives one evidence state: confirmed, partial, needs verification, or missing.
- Confirmed gaps remain distinguishable from unverified assumptions.
- Required missing responses prevent Snapshot finalization and return the homeowner to the first missing question.
- Optional skipped responses do not block completion.
- The completed Snapshot displays clear, follow-up, and unanswered counts.
- Per-answer and per-priority evidence metadata persists in the report payload.
- The report includes a versioned assessment-completion summary and an explicit `scoreFormulaChanged: false` marker.
- Private prospect report creation rejects reports explicitly marked incomplete while preserving legacy-report compatibility.
- Question weights, answer impacts, weighted penalties, category scores, Protection Score, property boosts, review-reason boosts, and priority ordering remain unchanged.
- Existing Cloudflare, private-report, Agent Workspace, consultation-record, and prospect-report workflows remain compatible.
