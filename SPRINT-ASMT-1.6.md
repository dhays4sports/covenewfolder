# ASMT-1.6 — Evidence-Aware Consultation Handoff

## Goal

Carry confirmed facts, policy-verification items, and unresolved assessment questions into the existing agent-facing consultation workflow without changing scoring, recommendation logic, or creating a parallel report path.

## Acceptance criteria

- The selected assessment report is normalized into one versioned evidence-handoff contract.
- `confirmed` responses appear as confirmed homeowner-reported facts.
- `needs-verification` responses appear as policy-verification items.
- `partial` and `missing` responses appear as unresolved questions.
- Priority-linked evidence items are ordered ahead of unrelated follow-up items.
- Agent Workspace displays all three evidence groups, summary counts, status, and policy-confirmation guardrail.
- Recommendation, timeline, and checklist items retain their evidence labels and follow-up prompts.
- Conversation Planner adds one evidence-alignment step to the existing consultation agenda.
- Consultation Checklist carries the handoff step and evidence metadata without losing state compatibility.
- Consultation Document page 3 renders the same grouped handoff and evidence-aware recommendation topics.
- Legacy reports remain accessible with a truthful manual-review state.
- Question weights, answer impacts, weighted penalties, category scores, Protection Score, property boosts, review-reason boosts, recommendation calculations, and topic ordering remain unchanged.
- Existing consultation records, private reports, Cloudflare runtime contracts, and browser-local fallbacks remain compatible.
