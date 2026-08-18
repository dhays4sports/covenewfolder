# CONS-1.8 — Consultation Pipeline Summary and Outcome Reporting

## Goal
Add stage totals, open-versus-closed counts, and final-outcome reporting to the existing Agent Workspace using the consultation records already synchronized into the browser.

## Implemented
- Total, open, closed, and policy-bound metric cards.
- Counts and pipeline share for every supported consultation stage.
- Final-outcome counts and share of closed consultations.
- Stage-summary controls that focus the existing queue stage filter.
- Reusable, immutable `CoverageFitConsultationPipelineSummary` aggregation module.
- Responsive and reduced-motion-safe Workspace presentation.

## Definition of done
The reporting is reachable in the normal Agent Workspace whenever saved consultation records are available. It uses the existing consultation archive and does not create a parallel analytics store or route.

## Deferred
Date-range reporting, source or campaign segmentation, conversion trends, export, and multi-user attribution remain outside this sprint.
