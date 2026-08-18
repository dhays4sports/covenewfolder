# RC-SMS-1.9.2 — Shared Number Conversation Orchestrator

Status: **Complete in CoverageFit 3.20.67.** Production 408-FARMERS port/carrier certification remains RC-SMS-1.10.

## Why this sprint exists

The prior RC-SMS runtime correctly protected a CoverageFit intake when Dylan manually replied: any unrecognized outbound RingCentral SMS moved the live record to `human_takeover`. That contract assumed the configured RingCentral sender existed primarily for the CoverageFit intake.

408-FARMERS is now intended to become the agency-wide customer SMS identity. The same number may carry CoverageFit intake, Dylan's manual messages, quote follow-up, appointment reminders, servicing, CRM communication, life/commercial communication, and future automations. A phone number therefore cannot be treated as a workflow.

RC-SMS-1.9.2 inserts a deterministic orchestration layer in front of the existing CoverageFit state machine. It separates:

1. channel status,
2. conversation owner,
3. automation permission,
4. business workflow type/status, and
5. the preserved CoverageFit workflow state.

The customer still sees one number. The platform now has an explicit contract for deciding who has the floor.

## Delivered architecture

### New server boundary

Added `server/sms-orchestrator-core.mjs` with build `RC-SMS-1.9.2`.

The module provides:

- backward-compatible orchestration normalization for pre-1.9.2 live records;
- bounded owner and automation-mode enums;
- workflow type/status/state projection;
- explicit CoverageFit-vs-producer inbound routing;
- producer takeover that preserves the underlying workflow step;
- producer release/resume back to CoverageFit;
- CoverageFit result synchronization into the orchestration envelope; and
- a redacted operational summary for the protected SMS Operations surface.

### Live record schema

Live RingCentral records advance from schema `1.2` to `1.3` and persist an `orchestration` envelope alongside the existing fields.

Representative shape:

```json
{
  "state": "human_takeover",
  "orchestration": {
    "schemaVersion": "1.0",
    "build": "RC-SMS-1.9.2",
    "channel": {
      "status": "active"
    },
    "ownership": {
      "owner": "producer",
      "reason": "unregistered_outbound_message"
    },
    "automationMode": "human_only",
    "workflow": {
      "type": "coveragefit_homebuyer",
      "status": "paused",
      "state": "buyer_closing_date_requested"
    }
  }
}
```

`state=human_takeover` remains as a compatibility projection for existing queue/UI/API behavior. It is no longer the only source of truth for the underlying workflow step.

### No database migration

No new D1 table or migration is required. Existing records in `sms_conversations` are normalized in place on read and persist the orchestration envelope on their next live write.

A legacy active buyer record such as:

```text
state = buyer_closing_date_requested
intent = buyer
```

normalizes to:

```text
owner = coveragefit
automationMode = automated
workflow.type = coveragefit_homebuyer
workflow.state = buyer_closing_date_requested
```

A legacy `human_takeover` record safely normalizes to producer ownership. New 1.9.2 takeovers explicitly store the pre-takeover workflow step, so future resume operations do not reconstruct progress from the takeover state.

## Shared-number routing contract

The RingCentral webhook now asks the orchestrator for a route **before** invoking `routeSmsInbound()`.

### CoverageFit route

CoverageFit may consume an inbound message when:

- an existing CoverageFit workflow owns the conversation and automation is allowed;
- the new inbound contains explicit supported CoverageFit intent such as buying a home, current-home review, or home + auto;
- an active partner-attribution code establishes a supported default CoverageFit intent;
- the prospect explicitly requests a CoverageFit restart; or
- an existing opted-out CoverageFit conversation receives the existing START behavior.

The existing buyer/home-review/bundle state machine is not duplicated or replaced.

### Producer route

The producer owns the inbound when:

- producer ownership is already active;
- automation mode is `human_only`; or
- a fresh shared-number message is ambiguous and does not establish CoverageFit intent.

Producer-routed inbound messages are persisted in the same transcript and counters but **do not call the CoverageFit state machine and do not emit an automated SMS**.

This means a fresh message such as `Hi Dylan` no longer automatically launches the CoverageFit menu on the production RingCentral path. The simulator remains an explicit CoverageFit test surface and retains its deterministic menu behavior.

### Conservative unknown behavior

If a live outbound RingCentral event is not already recognized as one of CoverageFit's own persisted automation/operator messages, 1.9.2 still treats it conservatively as producer/external communication.

The difference is that the orchestrator now records:

```text
owner = producer
automationMode = human_only
workflow.status = paused
workflow.state = <preserved current CoverageFit step>
```

instead of allowing `human_takeover` to erase workflow meaning.

This is intentionally conservative until RC-SMS-1.9.3 adds a formal multi-source outbound registry.

## Producer continuity

The existing protected producer handoff API now synchronizes orchestration state.

### Pause

`pause`:

- transfers ownership to producer;
- sets automation to `human_only`;
- preserves the current CoverageFit workflow step;
- keeps legacy `state=human_takeover` for compatibility.

### Resume

`resume`:

- derives the correct guided step using the existing captured answers;
- returns ownership to CoverageFit when an automated step remains;
- restores `automationMode=automated`;
- updates the preserved workflow state.

If the derived state is already `awaiting_producer`, ownership remains producer-safe rather than pretending automation has work to perform.

### Complete / not proceeding

Existing completion/disposition behavior remains, with the orchestration workflow marked completed and automation left human-only.

Full cross-workflow transfer semantics remain intentionally deferred to RC-SMS-1.9.4.

## Operations visibility

The protected `/agent/sms-operations/` surface now exposes the redacted orchestration view for each live conversation:

- owner;
- workflow type;
- workflow state;
- automation mode.

No additional customer PII is added to the operations API or logs.

## Preserved boundaries

RC-SMS-1.9.2 does **not**:

- create a second phone number;
- add a parallel SMS conversation store;
- replace the CoverageFit buyer/home-review/bundle engine;
- add an outbound message registry;
- add `/api/sms/send`;
- classify CRM/appointment/service outbound messages by source yet;
- complete global marketing/transactional consent policy;
- change RingCentral credentials or carrier registration;
- port 408-FARMERS;
- claim live carrier certification.

Those boundaries are assigned to proceeding sprints in `RC-SMS-ROADMAP.md`.

## Deployment notes

- No D1 migration.
- No new environment variable is required.
- Existing RingCentral, D1, producer-access, Resend, and handoff settings remain authoritative.
- Deploy the root package normally.
- Before production activation, run `node RCSMS1_9_2_QA.mjs` and the focused regression commands documented in `RC-SMS-ROADMAP.md`.
- The current temporary/test RingCentral number may be used for controlled functional validation. The final 408-FARMERS number remains gated by RC-SMS-1.10.

## Acceptance criteria satisfied

- One RingCentral number can now represent more than one business context without making CoverageFit the implicit owner of every inbound.
- Manual/unregistered outbound activity transfers ownership to the producer safely.
- Producer takeover preserves the exact CoverageFit workflow step.
- Customer replies during producer ownership cannot trigger a CoverageFit automated reply.
- Producer resume can return the preserved workflow to CoverageFit.
- Explicit CoverageFit intent continues through the unchanged deterministic intake engine.
- Fresh ambiguous shared-number inbound defaults to producer-safe handling.
- Existing records require no D1 migration.
- Protected operations exposes the new orchestration state without exposing new PII.
- The proceeding RC-SMS roadmap is embedded in the deployable package.

## Next sprint

Proceed with **RC-SMS-1.9.3 — Multi-Source Outbound Registry + SMS Gateway** using `RC-SMS-ROADMAP.md` as the authoritative resumption record.
