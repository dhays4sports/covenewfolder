# ASMT-1.1 — Protection Score Methodology and Normalization

## Goal

Define exactly what the Protection Score measures and replace raw point subtraction with one normalized, transparent, and testable scoring methodology.

## Implemented

- Added the authoritative `CoverageFitProtectionScore` module.
- Defined the score as review readiness and clarity, not policy adequacy.
- Standardized answer impact levels from 0 to 1.
- Set Home question weights to exactly 100.
- Applied the same weighted formula to overall and category scores.
- Distinguished strengths, considerations, uncertainty, and identified gaps.
- Added deliberate priority and strength ranking.
- Centralized score bands across assessment, prospect report, Workspace, business report, and consultation print output.
- Added score methodology, diagnostics, finding type, weight, and weighted penalty to the completed assessment payload.
- Added transparent methodology documentation and scenario-based calibration tests.

## Acceptance criteria

- Existing Home and Business assessment flows remain reachable.
- Every category score remains between 0 and 100.
- No answer can deduct more than its question weight.
- Home question weights total 100.
- Overall and category scores use the same formula.
- One authoritative band source is used throughout the runtime.
- Uncertainty is not represented as an identified gap.
- Strengths and priorities are ranked deterministically.
- Maximum-concern scenarios do not collapse prematurely to zero.
- Existing downstream reports and Workspace workflows remain compatible.
- Full regression and deployment checks pass.

## Deferred

- Real-world calibration against completed licensed consultations.
- Question wording, response-option validity, and behavioral-bias audit.
- Carrier- or state-specific assessment variants.
- Separate calibrated methodology for the Business assessment; Business currently uses the normalized compatibility path for its existing point definitions.
