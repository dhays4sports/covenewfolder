# CF-INT-1D — Assessment Prefill Integration

## Implemented

- Loads the stored 408FARMERS prospect profile when the home assessment opens.
- Maps the 408FARMERS review context into CoverageFit trigger context.
- Seeds the existing editable property-confirmation profile from the transferred address.
- Preserves an existing property profile rather than overwriting homeowner-confirmed data.
- Adds `reviewContext` and the prospect profile to the assessment payload for downstream consultation use.
- Leaves scoring and recommendation rules unchanged.
- Direct visitors without a transferred profile continue through the existing blank flow.

## Context mappings

- Buying or purchasing a home → `homebuyer`
- Policy renewal → `renewal`
- Premium or rate increase → `premium-increase`
- Remodel or renovation → `remodel`
- Growing family → `new-family`
- Rental or landlord → `landlord`

## Privacy

The assessment reads the profile from CoverageFit storage after CF-INT-1C has removed personal data from the visible URL.
