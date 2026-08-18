# AW-6B.1E — Renderer Integration

## Runtime implementation

The HTML renderer now uses the immutable print-model pipeline exclusively:

`Print Model → Document Composer → Visible Ordered Sections → Section render() → HTML Renderer Output`

Implemented in `assets/js/print-renderers.js`.

- Resolves the document composer at runtime.
- Composes sections through the registered section architecture.
- Invokes only visible sections in composer order.
- Accepts section-produced HTML fragments without defining section-specific HTML itself.
- Rejects invalid section render outputs.
- Returns immutable composed-document, section-output, and renderer diagnostics.
- Does not add printable consultation content or professional styling.

## Browser integration

`agent/workspace/index.html` now loads:

1. Document Composer
2. Print Renderer Registry
3. Print Engine

This ensures the Print Engine receives the composed HTML renderer in the browser runtime.

## Explicit exclusions

- No hard-coded section order in the renderer.
- No Executive Summary, Property Summary, recommendation, checklist, timeline, or metadata markup in the renderer.
- No print styling or browser print controls.
