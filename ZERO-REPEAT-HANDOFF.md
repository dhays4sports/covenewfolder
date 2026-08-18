# CONV-1.1 Zero-Repeat Handoff

CoverageFit v3.20.13 removes avoidable repeat steps for a recognized 408FARMERS Home-review handoff while preserving the standard CoverageFit journey for direct and other traffic.

## Recognized handoff contract

The conversion path activates only when the stored intake profile identifies:

- source `408farmers`
- handoff contract `coveragefit-handoff-v1`
- a sender build beginning with `408-`
- Home assessment context

The current 408FARMERS production handoff already sends these markers together with lead-capture status. CoverageFit treats that contract as the sender's assertion that the required 408FARMERS contact-permission checkbox was completed. Contact-permission provenance is retained in the completed report.

This is a product contract, not a cryptographic signature. A future signed or server-issued handoff token would strengthen origin verification without changing the homeowner experience.

## Journey behavior

### Recognized 408FARMERS visitor

1. The transition page stores and removes personal fields from the visible URL.
2. A visible `408FARMERS → CoverageFit` bridge explains the cross-brand continuation.
3. The transition opens `/assessment/` directly instead of routing through CoverageFit Home.
4. A complete transferred address is presented as one confirmation question.
5. The full address editor and optional property details remain available.
6. Existing contact fields are carried forward and hidden rather than requested again.
7. Missing fields or missing permission are requested explicitly.
8. When required contact and permission are already present, the existing completion form submits automatically through the existing report, consultation, D1, notification, and Snapshot path.
9. The private Protection Snapshot opens after completion.

### Direct or unrecognized visitor

- CoverageFit Home remains the normal entry point.
- Property confirmation uses the standard editable form.
- The normal completion form remains visible.
- No zero-repeat behavior is activated by source alone.

## Safety and fallback behavior

- An incomplete assessment cannot create a finalized report.
- Missing name or valid email disables automatic completion.
- Missing contact permission shows a required confirmation checkbox.
- Missing or incomplete structured address shows the normal property editor.
- A new trusted intake address replaces a stale browser property profile only when the normalized addresses differ.
- Private-report and remote-inbox failures retain the existing local fallback behavior.
- No score, evidence classification, recommendation, D1 schema, API route, producer authentication, or notification contract is changed.

## Privacy

Personal and conversion-control query fields are removed from the visible transition URL after they are stored. Analytics events contain state and count information, not homeowner identity, email, phone, or address.
