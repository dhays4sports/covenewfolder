# RC-SMS-1.9.6 — Shared Number Operations Certification

**Release:** CoverageFit 3.20.71  
**Status:** COMPLETE  
**Next:** RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification

## Purpose

Certify the complete pre-port shared-number SMS architecture as one operational system before the final 408-FARMERS carrier cutover. This sprint validates collisions, ownership recovery, reply-context routing, global consent, retries, legacy records, secret hygiene, and root deployment without generating synthetic production SMS traffic.

## Certified architecture

- one live sender/recipient relationship across all workflows;
- CoverageFit workflow state survives producer takeover and consent changes;
- persistent ownership remains separate from temporary reply context;
- registered automated sources retain provenance through RingCentral echoes and retries;
- unknown/manual RingCentral outbound fails producer-safe;
- STOP suppresses every programmatic source and START restores permission only;
- producer release resumes an active preserved CoverageFit workflow only when consent allows;
- completed customers can explicitly begin a new review as a new workflow episode on the same relationship.

## Hardening completed during certification

### Completed-customer re-entry

A completed conversation receiving a new explicit `buyer`, `home_review`, or `bundle` request now archives the completed workflow episode, creates a new workflow ID on the same SMS relationship, clears stale answers/handoff completion data, and routes the current message through the new workflow from `new`.

### Producer release continuity

`release_ownership` now returns an active preserved CoverageFit workflow to CoverageFit automation at its exact prior step. If global consent is suppressed, the release is denied rather than silently reactivating automation.

### Legacy opted-out normalization

Legacy rows whose top-level state is `opted_out` now recover `preTakeoverState`/`resumeState` using the same lazy-normalization rule as historical human-takeover rows. No D1 migration is required.

### Natural review intent

Natural phrases such as “I want a home coverage review” normalize to the home-review workflow instead of falling through to general routing.

## Operations certification surface

The protected SMS Operations response includes a non-destructive `certification` snapshot reporting:

- synchronized RC-SMS-1.9.6 application build;
- runtime sender/webhook/authentication/configuration presence without exposing secret values;
- shared-number conversation/storage evidence;
- webhook-health evidence when observed;
- retry pending/failed evidence;
- explicit pre-port status and the boundary that carrier certification remains RC-SMS-1.10.

The dashboard displays this snapshot as **Shared-number readiness**.

## Scenario matrix

The focused QA certifies:

1. CoverageFit send/reply continuity.
2. Manual producer texting during intake stops automation but preserves the exact step.
3. Customer replies to the producer remain human-only.
4. Appointment sends do not false-trigger manual takeover.
5. Appointment replies use declared reply context.
6. CRM quote follow-up does not launch CoverageFit.
7. CRM replies use producer/quote context.
8. Existing service requests avoid a CoverageFit menu.
9. Fresh explicit buyer requests launch CoverageFit.
10. Fresh ambiguous `Hi Dylan` routes producer-safe.
11. STOP globally suppresses programmatic outbound.
12. START restores permission without restarting an old workflow.
13. Unknown outbound becomes `external_unknown` / producer-safe.
14. Duplicate webhooks do not duplicate sends or transitions.
15. Retry delivery preserves source and ownership provenance.
16. Completed customers can explicitly open a new review episode on the same relationship.
17. Producer release resumes the correct preserved CoverageFit workflow.
18. Legacy pre-orchestrator, producer-takeover, and opted-out fixtures normalize without migration.
19. Operations readiness remains non-destructive and secret-safe.

## Storage / deployment

- live conversation schema remains `1.6`;
- orchestration schema remains `1.2`;
- outbound registry schema remains `1.2`;
- consent schema remains `1.0`;
- no new D1 table;
- no D1 migration;
- no new environment variable.

## Certification boundary

RC-SMS-1.9.6 certifies the **application/shared-number architecture before port completion**. It does not claim that the final 408-FARMERS number, authenticated RingCentral extension, carrier registration, inbound webhook subscription, or live STOP/START path has been verified on the final number. Those are exclusively RC-SMS-1.10 acceptance criteria.
