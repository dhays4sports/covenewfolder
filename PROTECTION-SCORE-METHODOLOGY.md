# CoverageFit Protection Score Methodology

## Methodology identity

- **Methodology ID:** `coveragefit-protection-score-v1`
- **Version:** `1.1.0`
- **Measure:** `review-readiness-and-clarity`

The Protection Score is a response-based measure of how clearly important protection topics are understood, confirmed, or identified for a licensed review.

It does **not** measure policy adequacy, carrier eligibility, underwriting quality, claim probability, or whether a particular limit is sufficient. CoverageFit does not inspect the issued policy when this score is created.

## Scoring formula

Every scored question has a weight. The universal Home assessment weights total exactly 100. ASMT-1.3 may add applicable property-aware questions after the homeowner confirms specific characteristics; the score remains normalized over the active total weight.

Each answer has a normalized impact from 0 to 1:

| Impact level | Value | Meaning |
|---|---:|---|
| None | 0.00 | Confirmed starting point |
| Limited | 0.25 | Lower-intensity consideration |
| Moderate | 0.50 | Meaningful item to review |
| Material | 0.75 | Important uncertainty or partial gap |
| Full | 1.00 | Clear identified gap within that topic |

For each question:

```text
weighted penalty = question weight × answer impact
```

Overall score:

```text
score = round(100 × (1 − total weighted penalty ÷ total question weight))
```

When only the universal Home questions are active, total weight is 100. When property-aware questions are applicable, the full normalized formula is used with the expanded active weight.

Every question is capped at its assigned weight. An answer can never deduct more than the question contributes to the assessment.

## Category normalization

Each category uses the same calculation as the overall score:

```text
category score = round(100 × (1 − category penalty ÷ category weight))
```

Every category therefore remains between 0 and 100, even when categories contain different numbers of questions or different total weights.

## Finding types

Finding type and score impact are related but separate.

### Strength

The homeowner affirmatively reports that the topic is understood, reviewed, or addressed. A strength has an impact of 0 and creates no deduction.

### Consideration

The answer does not establish a gap, but the topic may be worth comparing with the household’s circumstances. Examples include an older rebuilding review, a liability limit that has not been evaluated against current exposures, or an umbrella need that has never been reviewed.

### Uncertainty

The homeowner cannot verify a policy term, limit, calculation, or review history. Uncertainty does not claim the coverage is missing. It creates a focused verification question.

### Identified gap

The homeowner affirmatively reports a missing, low, outdated, unreviewed, or financially unworkable condition. An identified gap is still not a policy interpretation; it is a stronger reason for licensed review than uncertainty alone.

## Authoritative score bands

All assessment, report, Workspace, and consultation-document surfaces use the same bands:

| Score | Band |
|---:|---|
| 85–100 | Well Prepared |
| 70–84 | Strong Foundation |
| 50–69 | Review Recommended |
| 0–49 | Several Areas to Review |

The band describes the response-based review starting point, not whether the policy is adequate.

## Question validity principles

ASMT-1.2 adds a question-level validity contract to the normalized methodology:

- Questions prefer verifiable review history, confirmed policy terms, deliberate decisions, and practical readiness over unanchored confidence.
- A positive response must describe confirmed or reviewed information rather than belief alone.
- No fixed liability limit, deductible, or product choice automatically establishes adequacy.
- A deliberate reviewed decision may be a strength even when the homeowner chose not to purchase an optional product.
- Uncertainty never becomes a confirmed gap without an affirmative homeowner-reported condition.
- Insights restate the response and create a licensed-review question without inferring policy terms CoverageFit cannot see.

See `ASSESSMENT-QUESTION-VALIDITY-AUDIT.md` for the complete question-by-question audit.

## Home question weights

| Topic | Category | Weight | Primary construct |
|---|---|---:|---|
| Dwelling reconstruction review | Rebuilding | 16 | Review recency |
| Additional rebuilding protection | Rebuilding | 8 | Policy-term verification |
| Building-code upgrade coverage | Rebuilding | 8 | Policy-term verification |
| Water-loss terms | Water | 13 | Policy-term verification |
| Deductible knowledge and affordability | Financial Readiness | 10 | Financial readiness |
| Personal liability review | Liability | 13 | Exposure review |
| Belongings and valuable items | Property | 8 | Policy-term verification |
| Temporary living expenses | Recovery | 7 | Policy-term verification |
| Umbrella liability review | Liability | 4 | Exposure review |
| Household and property changes | Life Changes | 6 | Change alignment |
| Separate hazard review | Separate Hazards | 7 | Exposure review |
| **Total** |  | **100** |  |

Weights represent the relative importance of each topic to the educational review. They are not pricing, underwriting, or actuarial weights.

## Priority ranking

Priority ranking is deliberate and separate from the numeric score.

Each finding receives:

```text
priority score = weighted penalty + finding-type bonus + applicable property-priority boost
```

Finding-type bonus:

- Identified gap: +2
- Uncertainty: +1
- Consideration: +0

Property-priority boosts are bounded, transparent, and apply only to nonzero-impact findings. They affect ordering, not the numeric score. Priorities are sorted by priority score, then weighted penalty, finding type, question weight, and original question order. This allows a material uncertainty in a heavily weighted topic to outrank a minor identified gap while still giving identified gaps a modest preference when materiality is similar.

Only the top three priorities are shown in the standard prospect report. The full record remains available to the Agent Workspace.

## Strength ranking

Strengths are ranked by question weight, then original question order. This prevents incidental or low-weight confirmations from displacing more important positive foundations.

## Unanswered questions

A missing answer to an active scored question is treated as **uncertainty** with a material impact of 0.75. It is never treated as an identified gap.

The normal user flow requires scored questions to be answered. This fallback protects imported, legacy, or interrupted records from receiving falsely optimistic scores.

## Calibration scenarios

| Scenario | Score | Band | Interpretation |
|---|---:|---|---|
| Every topic confirmed or deliberately reviewed | 100 | Well Prepared | Strong response-based starting point |
| Additional rebuilding protection confirmed absent | 96 | Well Prepared | Known condition presented as a consideration, not an automatic adequacy verdict |
| Additional rebuilding protection unknown | 94 | Well Prepared | Uncertainty is distinguished from a deliberate known condition |
| Umbrella reviewed and deliberately declined | 100 | Well Prepared | A reviewed decision is not penalized merely because no product was purchased |
| Older rebuilding review + lower liability limit not recently evaluated | 82 | Strong Foundation | Two material considerations without declaring either policy inadequate |
| Deductible cannot reasonably be funded | 90 | Well Prepared | One clear financial-readiness gap surfaces without dominating the entire score |
| Separate hazards not reviewed | 95 | Well Prepared | A missing exposure review creates a focused uncertainty |
| Every topic answered at its maximum configured concern | 22 | Several Areas to Review | Broadly weak starting point without artificial zero-floor compression |
| All active questions unanswered | 25 | Several Areas to Review | Material uncertainty, not eleven asserted gaps |

## Data carried into reports

Each answer now records:

- Question weight
- Score impact
- Weighted penalty
- Finding type
- Severity label
- Legacy rounded point value for backward compatibility

Each completed report records:

- Methodology ID and version
- Authoritative band table
- Total weight
- Total weighted penalty
- Identified-gap count
- Uncertainty count
- Consideration count
- Normalized category scores

## Limitations

- The score depends on self-reported answers.
- CoverageFit does not read the issued policy when calculating the score.
- A high score does not prove that limits, endorsements, deductibles, or exclusions are appropriate.
- A low score does not prove that coverage is missing.
- The score should be used to organize a licensed review, not to replace one.
- Home question weights and answer impacts require continued calibration against real consultation outcomes and user comprehension.

## Property-aware extension

ASMT-1.3 preserves the eleven-question universal core and conditionally activates three questions using only homeowner-confirmed property fields:

| Confirmed characteristic | Added topic | Weight | Priority boost |
|---|---|---:|---:|
| Swimming pool | Pool liability review | 6 | 2 |
| Detached structures | Structure use and policy review | 5 | 1 |
| Roof year at least 15 years ago | Roof settlement, deductible, and age-term review | 5 | 2 |

A confirmed construction year at least 40 years ago gives the existing building-code question a priority boost of 2. Confirmed year built, square footage, and stories may appear as context in the rebuilding-estimate question. These facts do not create deductions by themselves.

Unverified provider data cannot activate questions or priority changes. See `ASSESSMENT-PROPERTY-PERSONALIZATION.md`.
