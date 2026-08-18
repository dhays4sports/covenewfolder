# CF-INT-1F — Unified Assessment Payload

## Delivered
- Added a backward-compatible unified consumer record with first name, last name, full name, email, phone, detail, property address, and review context.
- Added a top-level integration record carrying source, campaign, entry, session ID, and prefill status.
- Preserved existing `consumer.name`, `consumer.detail`, `attribution`, `prospectProfile`, report storage, and form submission contracts.
- User-edited contact values remain authoritative.
- Imported structured address and review context remain available to Consultation Management and Agent Workspace.

## Out of scope
- Consultation document rendering of the new fields.
- Agent Workspace display and campaign funnel UI.
- Backend token exchange for cross-domain handoff.
