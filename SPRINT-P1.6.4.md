# P1.6.4 — Professional Report Shell Certification

## Runtime

- Added immutable report-shell diagnostics.
- Added explicit valid and certified states.
- Added structured warning codes for incomplete report context.
- Propagated shell diagnostics into HTML renderer output.
- Marked the HTML renderer production-certified.

## Certification rules

A report is certified when it has at least one rendered section and complete client, prepared-by, and report-reference context. Partial reports remain valid and renderable but are not falsely marked certified.

## QA

`node P1_6_4_QA.js`
