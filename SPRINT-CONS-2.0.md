# CONS-2.0 — Consultation Pipeline Trend and Export

## Goal

Add date-bucketed consultation and policy-bound conversion trends plus a downloadable pipeline CSV to the existing Agent Workspace reporting data.

## Implemented

- Adaptive daily, weekly, monthly, quarterly, and yearly received-date buckets.
- Consultation volume, closed-record count, policy-bound count, close rate, and policy-bound conversion per bucket.
- Responsive visual trend chart and accessible detail table in the existing pipeline summary.
- UTF-8 CSV export scoped to the selected reporting date range.
- Formula-injection protection, CSV quoting, deterministic non-PII filenames, and truthful invalid/empty states.

## Preserved

- CONS-1.1 through CONS-1.9 consultation records, inbox synchronization, lifecycle, follow-ups, notes, activity, disposition, reporting, source segmentation, documents, and browser-local fallback.

## Known limitation

Trend and CSV data cover consultation records already synchronized into the active browser. Server-side aggregation and pagination remain deferred.
