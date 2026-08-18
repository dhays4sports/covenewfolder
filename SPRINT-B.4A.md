# Sprint B.4A — Property Intelligence Framework

## Objective

Create a provider-neutral property intelligence foundation without locking CoverageFit to a vendor or changing the current Home assessment experience.

## Completed

- Normalized address model.
- Provider registry and adapter contract.
- Normalized property profile schema.
- Field-level source and confidence metadata.
- Deterministic profile confidence and completeness model.
- Seven-day lookup cache with memory fallback.
- Graceful `manual_required` profile when lookup is unavailable.
- Persistent confirmed-property profile storage.
- Home assessment payload now carries `propertyProfile` when available.
- Framework loaded on Home, Home assessment, and Home report entry points.

## Deferred

- Live provider selection and credentials.
- Address autocomplete.
- Editable property confirmation UI.
- Assessment prefill and question skipping.
- Recommendation and report triggers based on property data.

## Next

B.4B — Home assessment integration and editable prefill.
