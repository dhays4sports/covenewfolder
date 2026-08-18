# TX-1.8 — Hero Personalization Components

## Goal
Replace the remaining hardcoded Home hero personalization assignments with reusable greeting, journey-context, reason-banner, and dynamic-CTA components inside the existing Home destination.

## Delivered
- Added `CoverageFitHeroPersonalization`, a frozen presentation runtime with four independently reusable renderers.
- Migrated the active Home welcome away from direct DOM assignments and into one component orchestrator.
- Added a named greeting and a complete review-reason-specific journey heading.
- Added review-reason and property context chips inside the existing onboarding-complete surface.
- Added a dynamic CTA label, accessible name, fixed assessment destination, and carried-forward-information reassurance.
- Kept direct visitors on the unchanged generic Home hero.
- Kept identity and property values out of the public `CoverageFitWelcome` and hero runtime state APIs.
- Preserved the TX-1.7 canonical personalization context and the TX-1.6 receipt-validation boundary.

## Verification
- Added TX-1.8 architecture and runtime coverage for all four components, orchestration, sanitization, neutral fallback, direct visitors, accessibility labels, and privacy boundaries.
- Updated TX-1.6 and TX-1.7 regression fixtures to execute the reusable component runtime.
- Ran all TX suites, static release checks, deployment verification, the complete inherited regression baseline, JavaScript syntax checks, HTML parsing, fresh ZIP extraction, and archive integrity verification.

## Deferred
- Final transition motion, focus, timing, and animation cleanup remains TX-1.9.
- Dashboard-first post-transition routing remains TX-2.0.
