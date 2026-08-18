# AW-6A.5 Sprint 4 — Automatic Renderer Selection

## Status
Complete.

## Implemented
- Automatic renderer selection for `CoverageFitPrintEngine.render(options)`.
- Registry-default resolution when no renderer is supplied.
- Explicit renderer precedence for `render("html", options)` and renderer fields in options.
- Capability-based renderer selection through `rendererCapability` / `capability`.
- Optional strict capability enforcement with `requireCapability: true`.
- Deterministic fallback order: registry default, HTML, first registered renderer.
- Immutable renderer-selection diagnostics in pipeline provenance.
- Public `selectRendererType()` diagnostic API.

## Compatibility
Existing explicit renderer calls remain supported. Sprint 1 through Sprint 3 APIs are unchanged.

## Deferred
Renderer regression consolidation and milestone-wide documentation/version release remain in later AW-6A.5 sprints.
