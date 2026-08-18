# RC-SMS-1.9.4 — Cross-Workflow Ownership + Producer Continuity

Status: **Complete in CoverageFit 3.20.69.** Global consent/suppression remains RC-SMS-1.9.5; shared-number operations certification remains RC-SMS-1.9.6; production 408-FARMERS port/carrier certification remains RC-SMS-1.10.

## Purpose

RC-SMS-1.9.2 separated the 408-FARMERS channel from CoverageFit workflow state. RC-SMS-1.9.3 made every programmatic outbound declare its source, workflow, reply route, and ownership effect before RingCentral delivery.

RC-SMS-1.9.4 turns those primitives into a complete continuity model so the same 408-FARMERS relationship can move safely among CoverageFit, Dylan/producer handling, servicing, appointments, life, commercial, and future workflows without losing the customer's current context or creating parallel conversation records.

The central rule is now:

> **Relationship ownership and reply routing are independent.**

A producer may continue to own the customer relationship while a bounded, expiring reply context temporarily routes a response to an approved specialized handler.

## Delivered architecture

### 1. Orchestration schema 1.1 / live conversation schema 1.5

The existing private `sms_conversations` record remains authoritative. No new D1 table or migration is required.

The orchestration envelope now includes:

```text
channel
ownership
  owner
  previousOwner
automationMode
workflow
  id
  type
  status
  state
workflowEpisodes[]
replyContext
  context
  route
  workflow
  source
  createdAt
  expiresAt
```

Legacy records normalize forward on read/write.

### 2. Formal ownership operations

The orchestrator now publishes bounded operations:

```text
acquire
transfer
pause
resume
release
close
```

Supported owners remain:

```text
none
coveragefit
producer
service
life
commercial
appointment
system
```

Ownership changes never require a second customer/channel record.

### 3. Producer continuity controls

The protected `/api/sms/producer/` surface retains its legacy actions and adds:

```text
Take ownership        -> take_ownership
Return to CoverageFit -> return_to_coveragefit
Pause automation      -> pause_automation
Resume workflow       -> resume_workflow
Close workflow        -> close_workflow
Start new workflow    -> start_workflow
Transfer ownership    -> transfer_ownership
Release ownership     -> release_ownership
Clear reply context   -> clear_reply_context
```

Legacy aliases remain valid:

```text
pause          -> pause_automation
resume         -> return_to_coveragefit
complete       -> close_workflow
not_proceeding -> close_workflow(outcome=not_proceeding)
```

Producer takeover preserves the exact underlying CoverageFit workflow step. Returning to CoverageFit restores that exact step whenever it is still actionable rather than recomputing a different state.

### 4. Expiring reply context

Programmatic outbound descriptors can now declare:

```text
replyContext
replyContextTtlSeconds
```

When a non-CoverageFit message declares a reply route, the gateway can create an expiring context such as:

```text
owner = producer
replyContext.context = quote_document_request
replyContext.route = service
expiresAt = ...
```

An inbound message inside that window routes to `service` while ownership remains `producer`.

When the context expires, normal ownership routing resumes automatically. Expired context is removed on the next persisted conversation write and is omitted from protected operations summaries immediately.

Default reply-context lifetime: **48 hours**.

Bounded lifetime: **5 minutes to 7 days**.

### 5. Owner and reply route are now truly separate

Inbound precedence after STOP/suppression and explicit restart/human commands is:

```text
active reply context
        ↓
persistent relationship owner
        ↓
explicit CoverageFit intent / attribution
        ↓
producer-safe ambiguous fallback
```

This supports cases such as:

```text
owner = producer
replyRoute = appointment
```

or:

```text
owner = producer
replyRoute = service
```

without surrendering the relationship owner.

Specialized routes currently remain human-safe: no specialized bot is allowed to answer merely because a route is `service`, `life`, `commercial`, `appointment`, or `system`. The route is persisted/visible for the approved handler or future automation.

### 6. Gateway ownership transfer extension

RC-SMS-1.9.3 gateway effects remain compatible:

```text
preserve
producer
```

RC-SMS-1.9.4 adds:

```text
transfer
release
```

A `transfer` send must declare a bounded `ownershipTarget`.

Example:

```json
{
  "origin": "service",
  "workflow": "service",
  "replyRoute": "service",
  "ownershipEffect": "transfer",
  "ownershipTarget": "service",
  "replyContext": "service"
}
```

The legacy `producer` effect remains a backward-compatible alias for transfer-to-producer.

A non-CoverageFit message still cannot leave an active CoverageFit bot owning the conversation when replies are declared for another route.

### 7. Manual RingCentral texting clears stale reply context

An unregistered/manual RingCentral outbound remains human-safe:

```text
origin = external_unknown
owner = producer
automationMode = human_only
```

RC-SMS-1.9.4 additionally clears any stale specialized reply context when this occurs so a later customer response cannot accidentally route back to an older appointment/service context after Dylan has personally taken the floor.

### 8. Workflow episodes/history

The active workflow now has a stable `workflow.id`.

Closing or superseding a workflow appends a bounded episode summary:

```text
id
type
status
state
startedAt
endedAt
outcome
ownerAtEnd
```

Only the most recent 20 episodes are retained in the orchestration envelope.

Episode history intentionally does **not** duplicate transcript text, phone numbers, property addresses, insurance answers, or other lead PII.

A completed old workflow therefore does not block a new deliberate workflow under the same 408-FARMERS relationship.

Supported protected workflow starts currently include:

```text
coveragefit_homebuyer
coveragefit_home_review
coveragefit_bundle
coveragefit_other
quote_followup
service
appointment
life
commercial
system
```

Starting a new CoverageFit workflow resets the workflow answers/handoff for the new episode while preserving the same channel relationship and historical episode summaries.

### 9. Retry provenance remains intact

SMS retry jobs now preserve the added ownership/reply-context fields:

```text
ownershipTarget
replyContext
replyContextTtlSeconds
```

Retry delivery still re-enters the RC-SMS-1.9.3 gateway and cannot bypass current channel suppression.

### 10. Protected operations visibility and controls

SMS Operations now exposes redacted continuity state:

```text
Owner
Previous owner
Workflow
Workflow state
Workflow episode count
Reply context + route + expiry
Last outbound source / reply route / ownership effect
```

The dashboard also exposes the bounded continuity buttons listed above plus a supported new-workflow selector.

No new prospect PII is added to unprotected output or operational audit logs.

## Current safety rules

- Human/producer ownership still beats bot automation when context is uncertain.
- Active reply context may route a reply independently from the persistent owner.
- Specialized reply routes do not automatically create specialized bot responses.
- Manual/unregistered RingCentral outbound clears stale reply context and takes producer ownership.
- Return-to-CoverageFit restores the exact preserved actionable workflow state.
- A new workflow archives/supersedes the prior workflow episode instead of creating another live SMS relationship.
- Existing channel suppression still blocks programmatic sends.
- No workflow operation can create an arbitrary owner or arbitrary workflow type through the protected producer API.

## Preserved boundaries

RC-SMS-1.9.4 does not change:

- CoverageFit assessment questions or scoring;
- recommendation/protection-score semantics;
- secure handoff token model;
- RingCentral OAuth/JWT contract;
- existing `sms_conversations` D1 table;
- producer authorization boundary;
- privacy-safe producer alerts;
- 408-FARMERS port status.

No new environment variable is required.

## Explicitly deferred

### RC-SMS-1.9.5 — Global Consent + Suppression Boundary — NEXT

Make sender/recipient permission authoritative above every immediate and scheduled automation, reconcile server/provider consent state, and ensure STOP/START applies across CoverageFit, CRM, appointment, service, life, commercial, and future senders.

### RC-SMS-1.9.6 — Shared Number Operations Certification

Run the complete pre-port collision/recovery matrix across ownership, reply contexts, workflow episodes, retries, consent, manual RingCentral handling, and cross-workflow transitions.

### RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification

Only after the port completes: certify the final RingCentral sender assignment, inbound/outbound carrier path, shared human texting, registry correlation, suppression behavior, and live carrier delivery.
