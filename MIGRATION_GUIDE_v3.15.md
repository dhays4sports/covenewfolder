# CoverageFit v3.15 Migration Guide

## Audience

This guide is for future CoverageFit development that extends the Agent Workspace, checklist engine, planner, persistence, diagnostics, or product-specific Workspace adapters.

## Core rule

Extend the v3.15 baseline additively. Do not fork the Workspace architecture for Business, Landlord, Life, or future product journeys.

## Frozen compatibility surfaces

Refer to `WR1C_API_BASELINE.json` and `WR1C_API_BASELINE.md` before modifying:

- Workspace Data adapter exports
- Conversation Planner exports and schema
- Consultation Checklist methods, constants, and statuses
- Checklist lifecycle event names and payloads
- Workspace state contract
- Persistence keys and schema versions
- Motion, performance, and lifecycle diagnostic APIs

## Safe additive changes

The following changes are generally safe in a minor release:

- Optional Workspace state fields
- New optional methods
- New lifecycle events that do not replace existing events
- New diagnostics fields
- New product adapters that normalize into the shared contract
- New UI projections that consume the existing immutable state

## Changes requiring migration

A migration plan is required before:

- Renaming or removing a public method
- Renaming an existing event
- Removing or repurposing an event-payload field
- Changing a persisted record incompatibly
- Changing required Workspace state fields
- Allowing the UI to mutate checklist state directly
- Replacing the checklist engine as the state authority

## Product adapter guidance

Business, Landlord, and Life Workspaces should:

1. Normalize product data through an adapter.
2. Produce planner-compatible consultation topics.
3. Generate checklist state through the shared engine.
4. Expose immutable Workspace state.
5. Reuse shared timeline, progress, accessibility, motion, and lifecycle systems.

They should not create separate event names, persistence engines, or checklist implementations unless a major-version architecture decision explicitly replaces the shared platform.

## Persistence changes

For incompatible persistence changes, choose one of the following:

- Migrate old records before use.
- Read both old and new formats during a documented transition.
- Introduce a new schema version and storage namespace.

Never silently reinterpret an existing stored field with a new meaning.

## Testing requirements

Every future sprint must:

- Run `node RUN_REGRESSION_SUITE.js`.
- Preserve the WR-1C.6 API-baseline suite.
- Add regression coverage for new public behavior.
- Verify static routes and local assets.
- Update `CHANGELOG.md`, `ROADMAP.md`, `VERSION`, and sprint documentation.
