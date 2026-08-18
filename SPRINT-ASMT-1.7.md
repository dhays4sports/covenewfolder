# ASMT-1.7 — Assessment Continuity and Respectful Exit

## Goal

Allow a homeowner to pause an unfinished Home assessment and return within seven days without losing the exact question or prior selections, while keeping incomplete work outside all completed-report and producer-notification paths.

## Implemented

1. Continuous local draft saving after each answer and question navigation.
2. Visible Save & Exit control in the assessment header.
3. Pause-confirmation dialog with clear consequences.
4. Exact question-key, index, selection, property, and early-insight restoration.
5. Continue My Review and Start Over choices on return.
6. Seven-day rolling draft expiration.
7. Draft deletion after successful assessment completion.
8. Local-only incomplete drafts with no score, report, consultation, remote submission, or notification creation.
9. Paused, resumed, expired, restarted, and completed continuity analytics.
10. No changes to scoring, evidence, questions, or recommendation logic.

## Files

- Added `assets/js/assessment-continuity.js`
- Modified `assessment/index.html`
- Modified `assets/js/assessment-engine.js`
- Modified `assets/js/property-confirmation.js`
- Added `assets/js/assessment-pause-notice.js`
- Modified `home/index.html`
- Modified `assets/css/pilot.css`
- Added `ASMT1_7_QA.js`
- Added `ASSESSMENT-CONTINUITY-AND-RESPECTFUL-EXIT.md`

## Deferred

- Cross-device draft synchronization
- Server-side partial-assessment storage
- Email or SMS resume links
- Producer visibility into abandoned or paused draft answers
- Consumer-language simplification and optional-property-section compression
