# PC-1.4 Print/PDF Production Certification

Release: CoverageFit v3.20.50  
Profile: PC-1.4 US Letter portrait

## Certified implementation

- One existing Consultation Document renderer and browser print action
- Complete report body with running document header and footer
- US Letter portrait page profile at 8.5 × 11 inches
- CSS paged-media page counters
- Exact print-color adjustment declarations
- Heading break protection and paragraph widows/orphans controls
- No intentional page break after the final printable section
- Output overflow available to the paged-media engine
- Producer-visible readiness status and print-dialog setup guidance
- Blocking behavior for malformed output or unavailable browser printing
- Privacy-safe suggested PDF filename

## Automated certification fixture

The PC-1.4 fixture uses synthetic homeowner, property, producer, and consultation values. It exercises the active HTML renderer and report shell, then runs the same central readiness profile used by the Consultation Document controller.

`PC1_4_BROWSER_CERTIFICATION.mjs` can record the Chromium engine version and create a synthetic PDF for page-size, page-count, text-extraction, rendered-page, and blank-page inspection when a browser executable is present. The fixture contains no production homeowner information.

## Browser boundary

The build environment contains browser automation libraries but no Chromium, Chrome, or Safari executable. Therefore PC-1.4 certifies the generated document contract, production setup gate, browser-print invocation behavior, and deployment integrity; it does not claim an actual browser-generated PDF in this environment. The producer-facing setup guide remains necessary because print destination, scale, browser chrome, background-graphics preference, installed fonts, operating system, and physical printer can change the final output. A producer must review every page before sharing it.

Safari/macOS and the deployed producer device belong to PC-1.5 Live Producer Pilot Readiness. This release does not claim a physical-printer, deployed-browser, carrier, quote, underwriting, or coverage outcome.
