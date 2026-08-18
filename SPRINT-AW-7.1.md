# AW-7.1 — Consultation-First Agent Workspace

**Release:** CoverageFit v3.20.11  
**Status:** Deployable

## Objective

Make the active homeowner consultation the default Workspace experience while keeping Inbox and Pipeline capabilities available as focused secondary views.

## Implemented scope

1. Made the selected consultation the default primary view.
2. Moved pipeline reporting into its own view.
3. Consolidated visible record discovery and selection into Inbox while retaining the legacy select as a hidden compatibility control.
4. Collapsed secure inbox setup automatically after connection.
5. Added a compact customer header with call, text, email, and record-switching actions.
6. Combined the existing conversation timeline and checklist into one During-the-conversation working flow.
7. Organized the selected consultation into Before, During, and After phases.
8. Simplified producer-facing evidence and document labels.
9. Improved mobile consultation pacing, touch targets, and nested-scroll behavior.
10. Preserved D1, authentication, scoring, reporting, follow-up, disposition, notes, activity, private-report, and notification contracts.

## Acceptance criteria

- Consultation is the default tab and active record is displayed before reporting surfaces.
- Inbox and Pipeline are separate accessible tab panels.
- Record selection returns to the active Consultation view.
- Pipeline stage actions focus the filtered Inbox.
- Secure inbox setup collapses after successful connection and remains available through a disclosure control.
- Before, During, and After phases are visible and semantically grouped.
- Timeline and checklist continue to use their existing controllers and persistence contracts.
- Customer action links fail closed when contact information is absent.
- Existing workflow IDs and remote API contracts remain compatible.
- Full project regression and release certification pass.

## Deployment

Deploy the complete static project to the existing Cloudflare Pages project. No new database migration, binding, variable, or secret is required.
