# PC-1.4 — Print/PDF Production Certification

## Objective

Certify and harden the existing Home Protection Consultation browser-print path for repeatable US Letter printing and Save as PDF without creating another document renderer or changing the consultation story.

## Implemented capability

CoverageFit now applies one central, immutable print-readiness profile to the existing HTML Print Engine output. Before the print action becomes available, the profile confirms the complete document shell, Letter paged-media rules, running header and footer, page counters, color preservation, final-page behavior, readable text-split controls, and the browser print service.

The Consultation Document toolbar shows a calm output-check state. A compact Print setup guide tells the producer to use Letter portrait, Default or 100% scale, background graphics on, browser headers and footers off, and to inspect every page before printing or sharing. The print action is blocked if a required document or browser capability is missing.

## Production print hardening

- Keeps the existing browser HTML renderer and `window.print()` service.
- Standardizes the output at 8.5 × 11 inch Letter portrait pages.
- Preserves CoverageFit background colors where the print destination supports them.
- Protects headings from stranded page breaks and applies widows/orphans controls to paragraph-like content.
- Keeps long document content visible to the paged-media engine.
- Preserves running document context, page counters, and the no-blank-trailing-page rule.
- Suggests a privacy-safe PDF filename without homeowner identity or property address.

## Preserved boundaries

- Consultation content, chapter order, shared Producer/Consumer Story, recommendation order, producer decisions, and Consultation Completion are unchanged.
- Assessment output and Protection Score are unchanged.
- No new storage, endpoint, PDF generator, assessment fork, or campaign-specific document was created.
- Attribution, zero-repeat handoff, FLOW, and RC-SMS contracts are unchanged.
- The document remains consultation support, not an issued policy, carrier quote, underwriting decision, or coverage determination.
- 408FARMERS requires no runtime change.

## Verification

Dedicated PC-1.4 QA certifies the central profile, valid and blocked states, print-dialog guidance, safe filename, renderer pagination controls, controller integration, semantic guardrails, and preserved architecture hashes. A synthetic browser-certification fixture is included for deployed-device validation. This build environment does not contain a Chromium or Safari executable, so it does not claim an actual browser-generated PDF; that live-device boundary remains in PC-1.5. Complete regression, static, deployment, cross-browser, API, Cloudflare build, archive-integrity, and clean-room checks are required before Deployable status.

PC-1.5 Live Producer Pilot Readiness remains deferred.
