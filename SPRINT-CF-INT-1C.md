# CF-INT-1C — CoverageFit Prefill Intake

## Goal
Receive the 408FARMERS prospect handoff on `/home/`, store a normalized prospect profile on CoverageFit, and remove personal information from the visible URL without reloading the page.

## Implemented
- Added `/assets/js/prefill-intake.js`.
- Reads approved handoff fields from the query string.
- Normalizes contact, property, structured-address, and integration metadata.
- Stores the profile in both `sessionStorage` and `localStorage` using `coveragefit_prospect_profile_v1`.
- Removes contact and property information plus handoff markers using `history.replaceState()`.
- Preserves campaign, source, UTM, entry, assessment, and session attribution parameters.
- Exposes `window.CoverageFitPrefill.get()` and `.clear()`.
- Emits `coveragefit:prefill-ready` without including personal information in event detail.
- Leaves direct visitors and malformed/partial handoffs functional.

## Deferred
- Assessment/contact-field prefilling is CF-INT-1D and CF-INT-1E.
- Unified assessment/report payload propagation is CF-INT-1F.
