# GC-1.3 — Priority Findings

Release: CoverageFit 3.20.32

## Outcome

The existing Consultation Command Center now converts normalized assessment findings into a bounded, explainable consultation sequence:

1. Discuss first
2. Discuss next
3. Then review

The sequence is derived centrally from assessment metadata already present in the saved report. It does not create a second assessment or recalculate the Protection Score.

## Ranking contract

The ranker uses existing signals in this order:

1. Assessment `priorityScore` when available
2. Weighted penalty
3. Finding type
4. Review-reason and property priority relevance
5. Evidence action for otherwise comparable findings
6. Existing priority label and stable source order for legacy reports

The user-visible model does not expose raw priority scores or weighted penalties.

## Agent guidance

Each ranked finding includes:

- a sequence label;
- a concise explanation of why it belongs in that position; and
- an evidence-derived cue: `Check policy`, `Ask homeowner`, or `Discuss finding`.

These cues organize the conversation. They do not verify a fact, establish eligibility, replace producer judgment, or represent a carrier recommendation.

## Preserved architecture

- Protection Score formula and assessment evaluation
- Assessment output and complete recommendation list
- Evidence classifications and verification guardrails
- Zero-repeat handoff and semantic entry context
- Attribution and consultation records
- Consultation document and reporting pipelines
- Deterministic RC-SMS architecture

## Deferred

GC-1.4 will provide the broader known, inferred, missing, and needs-confirmation separation. GC-1.3 only uses evidence state as a concise per-finding action cue.
