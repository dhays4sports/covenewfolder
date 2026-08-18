# TX-1.7 — Session-Based Personalization Engine

## Goal
Consolidate incoming identity, contact, property, review-reason, campaign, referral, entry-point, assessment, and session data into one normalized session context used consistently across the active CoverageFit homeowner journey.

## Delivered
- Added `CoverageFitPersonalization`, a versioned, session-scoped canonical context service.
- Normalized the prospect’s name, contact details, formatted and structured address, review reason, reason key, campaign, source, referral source, entry point, assessment, medium, handoff version, and shared session ID.
- Merged the existing 408FARMERS prospect profile with CoverageFit attribution while preserving profile values as the authoritative handoff source.
- Added deterministic review-reason classification with non-renewal precedence and support for homebuyer, renewal, premium increase, remodel, new-family, landlord, and neutral contexts.
- Prevented stale identity and property data from crossing into a different session.
- Persisted the canonical context in session storage only and cleared it whenever a new prefill handoff begins or the existing prefill state is cleared.
- Integrated the canonical context into the existing transition, Home welcome, assessment prefill, contact prefill, and assessment-report payload paths.
- Added first-name and property-address acknowledgement to the completed Home welcome while keeping the public welcome API free of identity and property values.
- Preserved existing prospect-profile, attribution, transition, property-confirmation, welcome-receipt, assessment, and report contracts as compatibility fallbacks.

## Verification
- Added a dedicated TX-1.7 runtime suite covering context normalization, precedence, session isolation, immutability, storage scope, event privacy, structured-address assembly, reason classification, route integration, report propagation, and the personalized Home welcome.
- All TX-1.1 through TX-1.7 dedicated suites pass.
- Static release, full regression, JavaScript syntax, HTML reference, fresh-extraction, and ZIP-integrity checks were run against the packaged release.

## Deferred
- Reusable hero personalization components remain TX-1.8.
- Final motion, focus, and timing polish remains TX-1.9.
- Dashboard-first handoff remains TX-2.0.
