# DOC-1.1 Print Certification

## Scope

This certification covers the default internal agent consultation document generated from a populated homeowner consultation record.

## Reference fixture

The fixture included:

- Customer name, phone, email, property address, and review reason
- Protection Score and strengths
- Three recommendation topics with explanation, conversation question, producer guidance, and evidence
- Construction details and risk highlights
- Current carrier, reconstruction limit, deductible, annual premium, and renewal date
- Missing information, workflow stage, follow-up, decisions area, and next action

## Verified output

- Renderer: WeasyPrint 68.0
- Page format: US Letter, 612 x 792 points
- Page count: 3
- PDF version: 1.7
- PDF inspection: passed
- PDFium render verification: 3 pages rendered at 200 DPI
- Fonts: embedded Inter family subsets
- Background colors: present
- Running headers and footers: present
- Deterministic page labels: Page 1 of 3, Page 2 of 3, Page 3 of 3
- Clipping or overlap: none observed
- Broken glyphs or black boxes: none observed
- Default cover: omitted
- Optional cover: output contract verified

## Page structure

1. Consultation Brief
2. Property Summary and Current Coverage
3. Coverage Conversation Guide and Decisions

## Browser-specific certification status

### Chrome

Chromium 144 was invoked with headless printing flags, no-sandbox mode, disabled GPU, and a local DBus session. The process stalled in the container’s DBus/zygote environment before a PDF could be produced. Chrome-specific pagination and print-dialog behavior are therefore not certified in this environment.

### Safari

Safari and the macOS WebKit print pipeline are unavailable on this Linux execution host. Safari-specific PDF output is not certified here.

## Required deployment follow-up

OPS-1.1 must print the deployed consultation document from:

- Current desktop Chrome
- Current macOS Safari

The production check must verify Letter sizing, exact three-page default output for the reference fixture, background graphics, page breaks, static page labels, running headers and footers, and the optional-cover four-page variant.

## Certification result

**Verified with the available standards-based PDF renderer and PDFium inspection. Browser-specific Chrome and Safari certification remains open.**
