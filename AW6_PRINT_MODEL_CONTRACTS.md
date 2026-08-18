# AW-6 Print Model Section Contracts

## Purpose

AW-6A.2 formalizes the print-model boundary introduced in AW-6A.1. The engine continues to emit schema version 1, while contract version 1 defines the required shape of each printable section.

## Public API

```js
CoverageFitPrintEngine.CONTRACT_VERSION
CoverageFitPrintEngine.getSectionContracts()
CoverageFitPrintEngine.validateSection(name, value)
CoverageFitPrintEngine.validateModel(model)
```

All returned contracts and validation results are deeply immutable.

## Contracted Sections

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

## Validation Rules

Validation distinguishes structural errors from printable-content warnings. Errors mean a model violates the schema or section contract. Warnings mean the model remains renderable but may be incomplete, such as a ready model without recommendations.

`buildModel()` normalizes source values before validation and adds a compact immutable validation summary under `model.diagnostics.validation`. No HTML, print CSS, browser print, or PDF behavior is introduced.

## Compatibility

- Print-model schema remains version 1.
- Contract version begins at 1.
- Existing AW-6A.1 fields remain present.
- Future optional fields may be additive.
- Breaking required-field changes require a schema or contract version change.
