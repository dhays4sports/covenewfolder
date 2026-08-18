# CoverageFit Journey Timeline Engine — Sprint 2

Reusable files:
- `/assets/css/journey-timeline.css`
- `/assets/js/journey-timeline.js`

## Product journeys

### Home
1. Understand Your Home
2. Protection Snapshot
3. Review Together

### Business
1. Business Profile
2. Industry Review
3. Current Coverage
4. Snapshot
5. Contact Review

The engine determines product and stage from `data-journey-product`, `data-report-type`, URL parameters, routes, and the most recently completed product. Existing live Business assessment progress is preserved and not duplicated.

## Report action plans
Any container with `data-cf-action-timeline` receives a five-step, product-specific roadmap from completed assessment through licensed review and future renewal planning.

## Accessibility
- Semantic navigation and ordered lists
- `aria-current=step` for the active stage
- Text labels in addition to color
- Mobile vertical layout
- Print-safe compact layout
