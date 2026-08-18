# P1.3.4 — Recommendation Ordering

## Status
Complete in v3.18.1.

## Runtime implementation
- Added deterministic model-level recommendation ordering.
- Recommendations sort by priority: Critical, High, Medium, Review, Low.
- Ties sort by consultation category: Property, Liability, Water, Life, Umbrella, Miscellaneous.
- Exact ties preserve original Recommendation Engine order.
- Added normalized `categoryKey` and immutable `sourceIndex` traceability fields.
- Sorting occurs before section rendering, so all consumers receive the same ordered model.

## Deferred
- Visual category grouping remains P1.3.5.

## QA
Run `node P1_3_4_QA.js` plus current print and P1 regression suites.
