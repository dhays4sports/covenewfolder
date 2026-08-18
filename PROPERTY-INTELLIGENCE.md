# CoverageFit Property Intelligence Framework

Version 1.0, introduced in CoverageFit 3.9.0 (Sprint B.4A).

## Purpose

This framework gives CoverageFit one stable property-profile contract before a live property-data vendor is selected. It does not make underwriting, eligibility, hazard, valuation, or coverage determinations.

## Public API

`window.CoverageFitPropertyIntelligence`

- `normalizeAddress(input)`
- `createProfile({ address, raw, provider, status, errors })`
- `mergeProfile(profile, updates, options)`
- `calculateConfidence(profile)`
- `registerProvider(provider)`
- `lookup(address, context)`
- `save(profile)` / `load()` / `clear()`

## Provider contract

```js
CoverageFitPropertyIntelligence.registerProvider({
  id: 'provider-name',
  name: 'Provider display name',
  defaultConfidence: 0.8,
  supports: ['yearBuilt', 'squareFeet', 'stories'],
  async lookup(normalizedAddress, context) {
    return {
      address: normalizedAddress,
      data: {
        yearBuilt: 1998,
        squareFeet: 2184,
        stories: 2
      },
      provider: {
        requestId: 'optional-request-id',
        retrievedAt: new Date().toISOString()
      }
    };
  }
});
```

## Property profile contract

The normalized profile contains:

- normalized address and a cache key
- normalized property fields
- field-level source, confidence, user-verification, and update time
- provider identity and retrieval metadata
- profile completeness and confidence
- missing fields and fallback status

## Confidence philosophy

Confidence measures the completeness and reliability of the property profile, not insurance adequacy. User-confirmed values receive full field confidence. Provider values retain provider-level confidence. Missing values do not produce false certainty.

## Persistence

The currently confirmed profile is stored under `coveragefit_property_profile_v1`. Provider lookups can be cached by normalized address for seven days. The framework falls back to `manual_required` when lookup data is unavailable.

## Current B.4A limits

- No live third-party property vendor is configured.
- No address autocomplete UI is included.
- ASMT-1.3 now uses only homeowner-confirmed fields to conditionally activate pool, detached-structure, and older-roof questions.
- Confirmed age, size, and story details may add context or bounded priority ordering, but never create underwriting, valuation, eligibility, hazard, or coverage conclusions.
- Unverified provider values do not activate assessment personalization.
