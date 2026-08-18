# CoverageFit Shared Executive Report Engine v3.0

## Purpose
The executive report presentation is now shared across assessment lines rather than embedded only in Business.

## Shared assets
- `assets/css/executive-report-engine.css`
- `assets/js/executive-report-engine.js`

## Supported report types
- Business: `coveragefit_business_report`
- Home: `coveragefit_home_report`
- Landlord-ready adapter: `coveragefit_landlord_report`

Set `data-report-type` on the page body and use the `data-exec-*` hooks in the cover and Executive Summary. Assessment-specific detail sections remain independent.

## Data hooks
- `data-exec-title`
- `data-exec-subtitle`
- `data-exec-name`
- `data-exec-detail`
- `data-exec-date`
- `data-exec-score`
- `data-exec-rating`
- `data-exec-priority` / `data-exec-priority-detail`
- `data-exec-strength` / `data-exec-strength-detail`

This preserves product-specific logic while standardizing the premium report experience.
