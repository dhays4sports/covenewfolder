# Home Assessment Property-Aware Personalization

## Purpose

ASMT-1.3 uses only property details the homeowner confirms in the CoverageFit property-confirmation step to determine whether a small number of additional educational questions are relevant.

The feature does not use property details to make underwriting, eligibility, valuation, hazard, condition, claim, or coverage conclusions. It does not rely on unconfirmed public-record values.

## Source-of-truth rule

A property value may affect the assessment only when its field metadata contains:

```text
verifiedByUser: true
```

Provider-supplied or previously cached values that the homeowner has not confirmed do not activate questions or priority adjustments.

## Universal core

The eleven-question ASMT-1.2 Home assessment remains the universal core and retains a total weight of 100.

Property-aware questions are added only when applicable. The score is normalized across the active question weight, so the output remains between 0 and 100 even when the applicable question count changes.

## Conditional questions

### Swimming pool liability review

Activated only when the homeowner confirms `pool: true`.

The question asks whether the pool, current household use, safeguards, and liability structure were reviewed together. It does not declare any liability limit adequate or inadequate.

### Detached structures review

Activated only when the homeowner confirms `detachedStructures: true`.

The question asks whether each structure and its current use were included in the policy review. It does not estimate structure value or determine how the policy responds.

### Roof policy terms

Activated only when the homeowner confirms a roof year at least 15 years before the current year.

The question asks whether settlement method, deductible, age-related terms, and major conditions were reviewed. The age threshold is a neutral review trigger, not an underwriting or condition conclusion.

## Existing-question personalization

### Rebuilding estimate

When year built, square footage, or story count is confirmed, the rebuilding-estimate question displays those facts as context. The facts do not change the score by themselves.

### Building-code upgrade coverage

When the confirmed construction year is at least 40 years before the current year, the building-code question receives a small priority-ranking boost. The boost affects ordering only when the answer identifies a consideration, uncertainty, or gap. It does not change the numeric score.

## Priority ranking

The normalized score remains:

```text
weighted penalty = active question weight × answer impact
```

Property-aware priority ordering adds a bounded question-specific boost:

```text
priority score = weighted penalty + finding-type bonus + property priority boost
```

Current boosts:

- Older-home building-code verification: +2
- Swimming pool liability review: +2
- Older-roof policy-term review: +2
- Detached-structures review: +1

A boost never creates a finding. It applies only after the homeowner selects a nonzero-impact answer.

## Report contract

Completed Home reports now include:

- Property-personalization methodology ID and version
- Confirmed property profile ID when available
- Active property-aware question keys
- Prioritized property-aware question keys
- Active question count
- Property-aware question count
- Property context and applicability reason on applicable answers and priorities

## Deferred characteristics

The current confirmation form does not establish occupancy, short-term rental use, home sharing, home-based business activity, solar systems, animals, trampolines, or other household exposures. ASMT-1.3 does not infer them.

Foundation, construction type, story count, and square footage are retained as rebuilding context but do not independently activate risk or coverage conclusions.

## Limitations

- All property details are homeowner-confirmed and may still be incomplete or inaccurate.
- The 15-year roof and 40-year home thresholds are educational review triggers, not carrier rules.
- Conditional questions improve relevance but have not yet undergone live homeowner comprehension testing.
- CoverageFit still does not inspect the policy or make a recommendation automatically.
