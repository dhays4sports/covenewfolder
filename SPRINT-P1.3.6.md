# Sprint P1.3.6 — Recommendation Print Polish

## Objective
Improve the reliability of multi-page recommendation printing without changing recommendation content, ordering, grouping, or the renderer architecture.

## Runtime changes
- Marks the first recommendation in every category group.
- Adds group-count metadata for QA and future document controls.
- Keeps category headings with their first recommendation when browsers honor paged-media rules.
- Prevents recommendation cards, card headers, card bodies, prompts, summary strips, and the footer from splitting internally.
- Adds widow/orphan controls for recommendation text.
- Tightens print-only group and card spacing for long reports.

## Architecture
The existing path remains unchanged:

Recommendation Engine → Recommendation Model → Grouped Recommendation Section → Document Composer → HTML Renderer

## Deferred
- Running headers and page numbers
- Global report header/footer continuity
- Browser print controls
- Cross-browser print certification

## Release
CoverageFit v3.18.3
