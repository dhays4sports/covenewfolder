# CD-1.7 — Consumer Language Pass

## Objective

Make the existing Home Protection Consultation understandable without producer narration while preserving professional usefulness, recorded decisions, confirmation states, and insurance-company authority.

## Implemented

- Added one bounded consumer-language helper to the existing print pipeline for CoverageFit-generated copy.
- Reworked the Executive Summary and Protection Snapshot around direct explanations of what the answers show, what the score means, and what should happen next.
- Renamed reader-facing policy facts to estimated rebuilding amount, home deductible, current insurance company, annual policy cost, and next policy date.
- Explained the current policy summary while retaining the industry term `declarations page` in parentheses.
- Reframed evidence and consultation prompts as what the homeowner shared, what to check in the policy, what to confirm together, and questions to discuss.
- Replaced internal closeout and carrier-quote wording with consultation summary and formal insurance quote language.
- Added one consistent final-terms explanation identifying the formal quote and issued policy as the official sources.

## Guardrails

- Only CoverageFit-generated presentation copy is simplified. Homeowner decisions and producer-entered reasoning remain verbatim.
- Protection Score values, bands, weights, and methodology are unchanged.
- Recommendation order, judgment state, confirmation state, evidence classification, and consultation completion state are unchanged.
- The document does not promise coverage, price, eligibility, discount, timing, insurance-company approval, or issued-policy terms.
- No second document, assessment, recommendation, persistence, attribution, or SMS system was created.

## Deferred

- CD-1.8 — Producer/Consumer Consistency.
- RC-SMS-1.10 live certification remains blocked until the 408-FARMERS number is ported.
