# Sprint P1.2.1 — Property Summary Data Model

## Runtime
- Added `assets/js/print/models/property-summary-model.js`.
- Maps immutable print-model property data into normalized property, construction, coverage, risk-highlight, and source groups.
- Preserves missing values as `null` or empty arrays and never invents coverage information.
- Supports current print-contract fields and compatible nested coverage aliases.
- Exposes `create()`, `hasContent()`, and `getDiagnostics()`.
- Updated the Property Summary section to consume the dedicated model.

## Boundary
- No Property Summary HTML or professional styling was added.
- The renderer pipeline remains unchanged.

## QA
- Complete, partial, missing, invalid-number, immutability, section integration, and browser dependency-order checks.
