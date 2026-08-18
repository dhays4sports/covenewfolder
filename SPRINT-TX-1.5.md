# TX-1.5 — Property Confirmation

## Goal
Display the transferred property address during the completed transition experience and truthfully confirm the home only when CoverageFit has a credible saved address, without changing the existing handoff, URL privacy, timing, personalization, or destination contracts.

## Delivered
- Added an integrated property confirmation card to the existing `/transition/` route.
- Read the address from the canonical CoverageFit prospect profile in session or local storage.
- Preferred the transferred formatted address and assembled a fallback from street, city, state, and postal code when needed.
- Added runtime validation that rejects missing, placeholder, ZIP-only, URL-like, and otherwise unusable address values.
- Added pending and confirmed card states synchronized with the second timeline milestone.
- Added context-aware labels for new-home, current-home renewal, and general home confirmations.
- Replaced false home-location language with `Preparing home details` when no usable address is available.
- Added an accessible live announcement that confirms the same address shown visually.
- Used text-only DOM assignment and exposed only a boolean property-confirmation state, not the raw address, through presentation metadata.
- Preserved same-origin destination validation, URL cleanup, session recovery, manual continuation, reduced-motion behavior, and the approximately two-second transition.

## Verification
- TX-1.1 route and state-management regression contract passed.
- TX-1.2 premium presentation and accessibility contract passed.
- TX-1.3 timeline sequencing, fallback, reduced-motion, and manual-continuation contract passed.
- TX-1.4 review-reason personalization contract passed.
- TX-1.5 formatted-address, structured-address, local-storage recovery, sanitization, truthful fallback, accessible announcement, and reduced-motion behavior passed.
- Static release, deployment, complete regression, fresh-extraction, JavaScript syntax, HTML parsing, local-reference, and ZIP-integrity checks completed for the release package.

## Deferred
- Personalized destination-page welcome copy remains TX-1.6.
- Broader session personalization consumption remains TX-1.7.
- Reusable hero personalization components remain TX-1.8.
