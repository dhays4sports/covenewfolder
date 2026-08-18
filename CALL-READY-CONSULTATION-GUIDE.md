# DOC-1.2 — Call-Ready Consultation Guide

## Purpose

DOC-1.2 converts the internal CoverageFit consultation document from a tightly compressed three-page export into a readable working guide for a live homeowner conversation.

The sprint changes presentation and print pacing only. It does not change assessment answers, Protection Score calculations, recommendation ordering, evidence classification, consultation records, D1 storage, private reports, producer notifications, or carrier and policy guardrails.

## User-visible changes

- The document is now titled **Home Coverage Consultation Guide**.
- The first section is **Consultation at a Glance**.
- The property section is **Home and Policy Details**.
- Evidence handoff language is simplified to:
  - What they told us
  - Check the policy
  - Ask the homeowner
- Each discussion topic now follows one vertical call-ready sequence:
  - What we know
  - Ask
  - What to explore
  - Check
  - Notes
- Each topic includes dedicated writing space.
- Unavailable property and policy fields are omitted rather than printed as repeated “Not available” values.
- When only the address is known, the property section displays one truthful compact notice.
- The closing section captures:
  - Decisions and proposal plan
  - Information still needed
  - Next-action owner
  - Due date
  - Follow-up method
  - Additional notes
- The fixed “Page 1 of 3” labels and three-page compression are removed.
- Browser print page counters are enabled so the guide can grow naturally beyond three pages.

## Data and compliance preservation

The following remain unchanged:

- Immutable print-adapter output
- Immutable print-model construction
- Protection Score and category scoring
- Recommendation content and order
- Evidence-quality values
- Confirmed facts, verification items, and unresolved questions
- Conversation Planner and Consultation Checklist data
- Consultation records and Workspace data
- Cloudflare D1 schema and API routes
- Producer notification behavior
- Private customer reports
- The requirement to verify homeowner-reported information against the issued policy and carrier underwriting

## Print behavior

The executive overview and property summary remain deliberate front sections. The discussion guide can continue across as many pages as needed. Individual topic cards and the final decision area avoid splitting when practical, while the guide itself is no longer forced into a single page.

## Deployment

No new Cloudflare binding, variable, secret, or D1 migration is required.
