# RPT-1.1 Print Certification

## Reference case

A populated Home Protection Snapshot was rendered with:

- Four category scores
- Three positive observations
- Three full educational priority topics
- Producer and agency contact details
- Premium-increase review context

## Chromium result

Chromium 144 generated a US Letter PDF from the active report markup, JavaScript, and print CSS.

- Page count: 3
- Page labels: Page 1 of 3, Page 2 of 3, Page 3 of 3
- Background graphics: preserved
- Topic cards: remained intact
- Clipping or overlap: not observed
- Blank trailing pages: none
- Visible customer confidence percentages: none
- Duplicate cover or duplicate CTA: none

The Chromium PDF was rendered through PDFium at 170 DPI and visually inspected page by page.

## Google Chrome and Safari status

Actual Google Chrome and Safari are not available on this Linux execution host. Chromium 144 provides the Blink print-engine verification; Chrome-branded and Safari/macOS Save as PDF certification must be completed during OPS-1.1. Safari and the macOS Save as PDF pipeline must be certified during OPS-1.1 on the deployed route. The print implementation uses standard Letter `@page`, explicit page wrappers, print color adjustment, and deterministic in-document page labels to reduce browser variance.
