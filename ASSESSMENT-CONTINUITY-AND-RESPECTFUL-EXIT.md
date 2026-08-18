# Assessment Continuity and Respectful Exit

CoverageFit ASMT-1.7 adds a browser-local draft layer to the Home assessment. The purpose is to preserve homeowner autonomy and reduce completion loss without treating an unfinished assessment as a completed review.

## Draft contract

- Storage: browser `localStorage` only
- Key: `coveragefit_assessment_draft_v1:home`
- Expiration: seven days after the most recent save
- Saved state: current question index and stable key, exact answer selections, active-question count, early-insight state, property-confirmation state, assessment start time, pause state, and timestamps
- Context isolation: a draft with a different active intake session is removed rather than applied to a new prospect

## Homeowner experience

A visible **Save & Exit** control opens a confirmation dialog. Confirming the exit saves the current draft, records a paused state, and returns the homeowner to CoverageFit Home. CoverageFit Home displays a review-saved notice with a **Continue My Review** action.

When the homeowner returns to `/assessment/`, CoverageFit offers:

- **Continue My Review**, restoring the exact saved question and selections
- **Start Over**, deleting the draft and beginning a new assessment

A confirmed property profile is not unnecessarily repeated during resume. Drafts that expire are removed automatically.

## Completion and privacy boundary

An incomplete draft is not a report and does not invoke any submission path. It cannot create:

- A Protection Score
- A private prospect report
- A consultation record
- A Cloudflare D1 record
- A Formspree submission
- A producer email notification

The draft is cleared after the assessment is successfully completed. The existing required-answer guards remain authoritative before score generation and again before contact submission.

## Analytics

ASMT-1.7 records operational state events without sending partial answer content:

- `assessment_paused`
- `assessment_resumed`
- `assessment_draft_expired`
- `assessment_restarted`
- `assessment_continuity_completed`

## Unchanged logic

ASMT-1.7 does not change assessment questions, weights, answer impacts, evidence classifications, weighted penalties, category scores, the Protection Score formula, property-aware ordering, review-reason ordering, recommendation generation, consultation records, private reports, or producer notifications.
