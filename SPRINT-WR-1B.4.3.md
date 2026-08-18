# WR-1B.4.3 — Timeline & Progress Motion

## Goal
Add subtle, state-driven motion to the conversation timeline and consultation progress display using the shared Workspace motion foundation.

## Implemented
- Current, completed, and updated timeline-topic transitions.
- Smooth current-topic positioning.
- Progress feedback for percentage, count, remaining minutes, current phase, and completion state.
- Reduced-motion safeguards in JavaScript and CSS.

## Boundaries
- No checklist motion changes.
- No sidebar, card, loading, or dialog motion.
- No planner, checklist engine, persistence, event-contract, or customer-facing changes.

## Regression notes
- Existing event-driven rendering remains the source of truth.
- Motion classes are temporary and cleaned up after shared motion durations.
- Reduced-motion users receive immediate state changes without animation.
