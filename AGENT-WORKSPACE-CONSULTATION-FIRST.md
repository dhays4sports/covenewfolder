# Consultation-First Agent Workspace

AW-7.1 reorganizes the existing Agent Workspace around the producer's immediate job: understand the active homeowner review, conduct a clear consultation, and record the outcome.

## Primary information architecture

The Workspace now has three explicit views:

1. **Consultation** — the default selected-record experience.
2. **Inbox** — consultation search, filtering, and record selection.
3. **Pipeline** — aggregate performance, source, trend, and export reporting.

Selecting a record from Inbox returns the producer to Consultation. Selecting a stage from Pipeline opens Inbox with that stage applied.

## Consultation workflow

The selected consultation is organized into:

- **Before the conversation** — active customer actions, review summary, top discussion topics, homeowner-reported information, policy checks, open questions, and optional supporting details.
- **During the conversation** — one combined working flow containing the existing conversation timeline and consultation checklist.
- **After the conversation** — delivery state, disposition, follow-up, producer notes, and activity history.

## Producer language

The presentation layer uses faster working labels:

- Confirmed facts → **What they told us**
- Verify against policy → **Check the policy**
- Unresolved questions → **Ask the homeowner**
- Consultation document → **Agent Guide**
- Customer report → **Client Snapshot**

Underlying evidence-quality values and report contracts are unchanged.

## Secure inbox behavior

The producer inbox setup remains available, but collapses automatically after a successful connection. A compact status line shows the connection and last synchronization time. The producer access key remains session-only and is not written into customer records or URLs.

## Compatibility

AW-7.1 is an information-architecture and presentation release. It does not change:

- D1 schema or migrations
- producer authentication
- consultation record schemas
- assessment or Protection Score logic
- evidence or recommendation calculations
- pipeline calculations or CSV contracts
- follow-up, disposition, notes, or activity persistence
- consultation document generation
- private Client Snapshot access
- producer email notifications

No new Cloudflare binding, variable, secret, or migration is required.
