# AW-6A.4 — Print Data Adapters

## Status

Implemented in CoverageFit v3.16.4.

## Scope

- Added a working print-adapter registry.
- Added and registered the Home print adapter.
- Routed Print Engine source resolution through the selected adapter.
- Added adapter identity to immutable print diagnostics and source-version metadata.
- Added Print Engine delegation methods for adapter registration and discovery.
- Preserved the legacy direct-source path for backward compatibility.

## Exclusions

- No printable HTML.
- No print CSS.
- No print button.
- No browser print invocation.
- No PDF generation.
- No Business, Landlord, or Life adapter implementation yet.
