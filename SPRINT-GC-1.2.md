# GC-1.2 — Prospect Story

Release: CoverageFit 3.20.31

GC-1.2 turns preserved intake and attribution data into one concise, human-readable explanation inside the existing Consultation Command Center. It helps a producer understand who the homeowner is, why the review exists, how the journey began, and which acquisition details are relevant before opening raw intake fields.

## Supported story context

- Home purchase, provided closing date, intended occupancy, and time-sensitive state.
- Professional context for healthcare, education, technology, engineering, and related entries without implying eligibility or a discount.
- Home and auto entries while keeping the story focused on the home protection portion.
- General homeowner review reasons, including renewal, premium increase, non-renewal, comparison, and new-policy needs.
- Realtor or partner referral, neighbor referral, campaign, direct CoverageFit, 408FARMERS web, and 408-FARMERS SMS continuation context.

## Data boundaries

- `customer.reviewContext` remains the only canonical reason for the review.
- The additive `entryContext` workspace projection keeps occupation, housing, purchase, urgency, referral, campaign, and entry information separate.
- Internal partner IDs, campaign IDs, session IDs, and transport details are not shown in the story.
- Homeowner-reported context is not promoted to a verified policy, eligibility, underwriting, discount, rate, or coverage fact.
- Existing assessment, Protection Score, recommendation, evidence, attribution, consultation-record, reporting, and RC-SMS contracts remain intact.
- Regression stabilization preserves date-only policy renewal values as the reported calendar date across U.S. time zones.

## Deferred

GC-1.3 remains responsible for ranking findings by consultation importance. GC-1.4 remains responsible for the broader known, inferred, missing, and needs-confirmation experience.

## QA

Run `node GC1_2_QA.js` for sprint-specific coverage and `npm test` for complete regression.
