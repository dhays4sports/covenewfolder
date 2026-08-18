# ASMT-1.4 — Review-Reason-Aware Assessment Prioritization

## Goal

Tailor Home assessment question context and discussion-priority ordering for home purchase, annual renewal, non-renewal or cancellation, and premium-increase journeys without changing the normalized Protection Score formula.

## Acceptance criteria

- Existing Home assessment and property-aware questions remain integrated.
- Review reason is normalized consistently, with non-renewal matched before renewal.
- Relevant questions display truthful journey-specific context.
- Priority boosts are bounded and apply only to nonzero-impact findings.
- Identical answers produce identical overall and category scores across review reasons.
- Home purchase, renewal, non-renewal, and premium-increase scenarios produce deliberately different priority ordering.
- Non-renewal language does not infer carrier reasoning or predict eligibility.
- Applied reason and ranking metadata persist in the report payload.
- Existing Cloudflare, private-report, Workspace, consultation-document, and prospect-report workflows remain compatible.
