# Sprint B.2A — Recommendation Intelligence

## Objective
Enrich existing CoverageFit recommendations without replacing the current rule, trigger, scoring, or report engines.

## Added metadata
Every normalized recommendation now includes:
- `confidence` (deterministic 0–97)
- `impact` and `impactLabel`
- `clientExplanation`
- `conversationStarter`
- `agentNotes`
- `supportingAnswers`
- `intelligenceVersion`

## Confidence model
Confidence is explainable and based on:
- priority level
- number of supporting answers
- number of matching rules
- number of trigger sources

Explicit rule confidence values remain supported.

## Sorting
Recommendations are ordered by:
1. priority
2. confidence
3. supporting-answer count
4. rule count
5. topic name

## Customer report changes
Home report cards now show:
- impact label
- confidence percentage
- client-friendly explanation
- supporting assessment answers
- a conversation starter

## Internal notes
`agentNotes` are available in the recommendation payload for future producer-only views. They are not displayed in the customer report.

## Out of scope
- new recommendation rules
- changes to Protection Score calculations
- changes to underwriting, eligibility, pricing, or coverage logic
