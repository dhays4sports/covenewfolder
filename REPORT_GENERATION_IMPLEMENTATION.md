# CoverageFit v1.2 Report Generation Experience

Implemented in the live assessment submission flow.

## Behavior

After the homeowner submits their contact details, CoverageFit displays a full-screen branded preparation experience for approximately three seconds while the lead submission completes.

Messages rotate through:

1. Reviewing your responses…
2. Looking for meaningful patterns…
3. Preparing your Protection Snapshot…
4. Your Protection Snapshot is ready.

The active trigger is displayed when available.

## Files

- `assets/css/report-generation.css`
- `assets/js/report-generation.js`
- `assessment/index.html`
- `assets/js/assessment-engine.js`

## Accessibility

The experience uses a live status region and respects `prefers-reduced-motion`.
