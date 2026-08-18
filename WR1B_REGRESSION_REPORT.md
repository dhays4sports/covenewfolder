# WR-1B Regression Report

## Scope
The release runner discovers and executes every root-level `*_QA.js` suite.

## Covered systems
- Workspace data normalization
- Conversation Planner
- Consultation Checklist generation, mutation, resets, persistence, diagnostics, and immutable contract
- Checklist lifecycle events and Workspace event integration
- Sidebar shell, rendering, interaction, progress, timeline synchronization, accessibility, and mobile behavior
- Production-readiness end-to-end and resilience scenarios
- Design tokens, loading, empty/error states, motion system, component cleanup, render performance, lifecycle management, responsive refinement, and interaction polish
- Static route, local asset, and release-version validation

## Release criterion
The production-candidate archive is acceptable only when every discovered suite passes, every JavaScript file passes syntax validation, and a fresh archive extraction passes the same runner.
