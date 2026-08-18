# CF-INT-1E — Contact Capture Prefill

## Delivered
- Reads the persisted `coveragefit_prospect_profile_v1` profile.
- Prefills the editable final contact fields for full name, email, phone, and property ZIP.
- Does not overwrite any value already entered in CoverageFit.
- Adds a confirmation message only when at least one value is carried over.
- Marks imported fields for subtle visual confirmation.
- Dispatches `coveragefit:contact-prefill-ready` without personal information in the event detail.
- Direct visitors with no transferred profile retain the standard blank form.

## Privacy
The script reads the profile already captured and cleaned by CF-INT-1C. It does not add personal information back to the URL or analytics events.
