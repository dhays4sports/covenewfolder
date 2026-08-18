# AW-6B.1D — Visibility Engine

## Runtime implementation
- Added `assets/js/print-visibility.js` as a standalone visibility service.
- Added deterministic section visibility decisions, required-path checks, empty-state descriptors, and fail-closed rule handling.
- Updated the Document Composer to consume visibility decisions and return separate immutable `sections` and `hiddenSections` collections.
- Updated all six section definitions with real data requirements, conditional visibility rules, and empty-state messages.
- Loaded the visibility engine before section definitions and the composer in the Agent Workspace.

## Architectural boundary
- No HTML is rendered.
- No renderer integration was added.
- No hard-coded print order or print markup was introduced.
- The immutable print model remains the only input to composition.

## Deferred
HTML renderer integration, expanded diagnostics UI, and final section renderers remain future micro sprints.
