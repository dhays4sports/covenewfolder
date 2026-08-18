# ASMT-1.2 — Assessment Question Validity and Bias Audit

## Goal

Improve the Home assessment so every question measures a clear review-readiness construct, every answer supports its assigned finding, and the questionnaire avoids leading homeowners toward predetermined coverage limits or products.

## Implemented

- Rewrote confidence-based questions around verifiable review history, policy-term knowledge, exposure review, and financial readiness.
- Removed the automatic assumption that `$500,000 or higher` liability is sufficient for every household.
- Treated a deliberately reviewed decision not to carry an umbrella as a valid strength.
- Added missing deductible-knowledge paths and removed duplicate temporary-living-expense answer meanings.
- Required positive answers to describe confirmed or reviewed information rather than belief alone.
- Added a neutral Separate Hazards question for earthquake, flood, and other separately handled causes of loss.
- Preserved the ASMT-1.1 normalized methodology, 100-point Home weight total, score bands, reports, Agent Workspace, and Cloudflare runtime.

## Deferred

- Property-specific conditional questions and scoring remain ASMT-1.3.
- Live homeowner comprehension and completion testing remains part of the production pilot.
