# AW-6A.1 — Print Engine Skeleton

## Status

Complete in CoverageFit v3.16.0.

## Goal

Establish a reusable, framework-free print-model engine before any printable HTML, browser-print controls, or PDF behavior is introduced.

## Added

- `assets/js/print-engine.js`
- Global frozen API: `CoverageFitPrintEngine`
- Immutable print-model schema version 1
- Workspace Data, Conversation Planner, and Consultation Checklist normalization
- Explicit dependency and source-state injection for testing and future adapters
- Diagnostics for unavailable or incomplete source contracts
- `AW6_PRINT_ENGINE.md`
- `AW6A1_QA.js`

## Public API

```js
CoverageFitPrintEngine.VERSION
CoverageFitPrintEngine.SCHEMA_VERSION
CoverageFitPrintEngine.buildModel(options)
CoverageFitPrintEngine.getModel(options)
```

## Initial model sections

- `metadata`
- `customer`
- `assessment`
- `executiveSummary`
- `strengths`
- `propertySummary`
- `recommendations`
- `consultationChecklist`
- `timeline`
- `notes`
- `attribution`
- `diagnostics`

## Guardrails

- No HTML generation
- No DOM dependency
- No print button
- No `window.print()` call
- No print CSS
- No PDF generation
- No mutation of Workspace, Planner, or Checklist state
- No customer-facing changes

## Regression notes

The Print Engine is additive. Existing frozen Workspace APIs, events, persistence schemas, diagnostics, and runtime behavior remain unchanged.
