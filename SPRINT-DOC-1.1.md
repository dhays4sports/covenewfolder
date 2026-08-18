# DOC-1.1 — Consultation Document Production Audit and Compression

## Goal

Convert the existing agent-facing consultation packet into a compact, reliable working document for the producer while preserving the established Print Engine and selected-consultation workflow.

## Implemented

- Fixed current-policy data propagation for reconstruction limit, deductible, current carrier, annual premium, and renewal or expiration date.
- Preserved recommendation explanations, conversation questions, producer guidance, and supporting evidence through the immutable print-model boundary.
- Replaced number formatting for construction years with four-digit year formatting.
- Removed duplicated generated language such as “Review Review …”.
- Made the branded cover opt-in from the consultation document toolbar; the default output begins with the Consultation Brief.
- Replaced separate Recommendations, Consultation Checklist, and Consultation Timeline print sections with one Coverage Conversation Guide.
- Added customer phone and email, review reason, missing information, workflow stage, follow-up, decision space, underwriting items, and next action.
- Added deterministic Page 1 of 3, Page 2 of 3, and Page 3 of 3 labels to the normal internal document.

## Default document structure

1. Consultation Brief
2. Property and Current Coverage
3. Coverage Conversation Guide

## Verification

- Dedicated DOC-1.1 data, model, section, default-cover, optional-cover, and output-contract tests.
- Populated HTML rendered to a three-page US Letter PDF with WeasyPrint 68.0.
- PDF inspected with `pdfinfo`, the PDF inspection utility, and PDFium renders at 200 DPI.
- No clipped text, overlapping sections, broken glyphs, missing backgrounds, or incorrect page labels were observed in the reference output.

## Known limitation

The execution environment could not complete Chromium printing because its headless Chromium process stalled in the container DBus/zygote environment. Safari is unavailable on this Linux host. Chrome and Safari browser-specific print certification must therefore be completed during OPS-1.1 on the deployed site and a macOS/Safari device.
