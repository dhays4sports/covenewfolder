# WR-1B.5 — Component Cleanup

## Objective

Normalize the Agent Workspace around a small shared component vocabulary while preserving all legacy class hooks and runtime behavior.

## Implemented

- Shared component dimensions for controls, cards, gaps, and badges.
- Reusable component classes for cards, inset surfaces, buttons, badges, section headings, states, lists, and progress tracks.
- Static Workspace markup now opts into shared component classes.
- JavaScript-generated recommendation, checklist, timeline, and recovery-state markup now opts into the same shared components.
- Existing Workspace selectors remain in place as compatibility hooks.

## Non-goals

- No component framework.
- No JavaScript component registry.
- No planner, checklist, persistence, event, motion, or customer-facing behavior changes.
- No visual redesign.

## Regression notes

The shared classes are additive. Existing classes remain authoritative compatibility selectors, allowing later cleanup to migrate incrementally without breaking current styling or tests.
