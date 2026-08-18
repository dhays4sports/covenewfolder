# ASMT-1.3 — Property-Aware Assessment Personalization

## Goal

Conditionally add and prioritize Home assessment questions using property characteristics the homeowner confirmed, without presenting public-record data or underwriting conclusions.

## Implemented

- Preserved the eleven-question, 100-weight universal Home assessment.
- Added a property-question resolver to the existing assessment configuration.
- Added conditional pool, detached-structure, and older-roof questions.
- Added confirmed year-built, square-footage, and story context to the rebuilding question.
- Added a bounded older-home priority boost to the existing building-code question.
- Added a visible property-personalization callout to applicable questions.
- Added property-aware scoring and report metadata without changing the normalized score formula.
- Updated property-confirmation disclosure language.
- Added scenario-based activation, scoring, ordering, privacy, and compatibility tests.

## Definition of done

A homeowner who confirms an applicable property characteristic receives the relevant integrated question through the normal assessment workflow. A homeowner without that confirmed characteristic does not receive the question. Unconfirmed provider data cannot activate personalization.

## Deferred

Occupancy, rental use, home sharing, home-based business, animals, trampolines, solar systems, and other exposures are not collected by the current property-confirmation form and are not inferred.
