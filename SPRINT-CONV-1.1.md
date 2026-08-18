# SPRINT CONV-1.1 — Zero-Repeat Handoff

## Status

Implemented, verified, and deployable in CoverageFit v3.20.13.

## Objective

Reduce conversion loss between the completed 408FARMERS intake and the private Protection Snapshot by eliminating redundant pages and repeated data entry, without creating a parallel assessment, report, consultation, or notification workflow.

## Acceptance criteria

1. Recognized 408FARMERS Home handoffs route from the animated transition directly to `/assessment/`.
2. CoverageFit Home remains available and unchanged as the normal direct-traffic entry point.
3. The transition visibly explains the 408FARMERS-to-CoverageFit continuation.
4. Complete structured addresses receive one-click confirmation.
5. The full property editor remains available for correction and optional details.
6. Previously supplied contact fields are not requested again.
7. Only missing required contact or permission is requested.
8. Eligible completed assessments automatically use the existing report-generation and private-Snapshot path.
9. Completed reports retain contact-permission and handoff provenance.
10. Scoring, evidence, recommendation, D1, authentication, private-report, consultation, Formspree, and producer-notification contracts remain unchanged.

## Implementation notes

- Added one shared conversion-contract module rather than implementing page-specific trust logic.
- The receiver overrides the legacy `next=/home/` destination only when the full trusted handoff contract is present.
- Automatic completion calls the existing capture form's submission handler, preserving all existing durable and fallback behavior.
- Direct and incomplete handoffs fail safely into existing editable forms.

## Verification

- Dedicated CONV-1.1 contract and scenario certification
- Complete project regression suite
- Static release and local-reference validation
- Cloudflare runtime and deployment-contract validation
- JavaScript and Cloudflare Function syntax validation
- HTML and CSS structural validation
- Local route verification
- Fresh ZIP extraction, retesting, and archive integrity validation
