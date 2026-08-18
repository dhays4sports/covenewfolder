# RC-SMS-1.9.3 — Multi-Source Outbound Registry + SMS Gateway

Status: **Complete in CoverageFit 3.20.68.** Cross-workflow ownership UX remains RC-SMS-1.9.4; global consent/suppression remains RC-SMS-1.9.5; production 408-FARMERS port/carrier certification remains RC-SMS-1.10.

## Purpose

RC-SMS-1.9.2 made 408-FARMERS a shared agency SMS identity and separated conversation ownership from CoverageFit workflow state. RC-SMS-1.9.3 closes the next collision boundary: every programmatic outbound message now declares who generated it, the business workflow it belongs to, where replies belong, and whether delivery should preserve or transfer ownership **before RingCentral sends the SMS**.

The result is one programmatic SMS write boundary with provider-message correlation, a compatibility registration path for external integrations, and a human-safe fallback for anything that remains unregistered.

## Delivered architecture

### 1. Durable/private outbound registry

Added `server/sms-outbound-gateway.mjs` with build `RC-SMS-1.9.3`.

Registry records live inside the existing private `sms_conversations` D1 JSON store. No new D1 table or migration is required.

Primary provider lookup:

```text
sms-outbound-registry/provider/{ringcentral_message_id}
```

Short-lived compatibility lookup:

```text
sms-outbound-registry/fingerprint/{sha256(sender|recipient|normalized_body)}
```

Idempotency lock/result:

```text
sms-outbound-idempotency/{sha256(sender|recipient|idempotency_key)}
```

Provider message IDs are authoritative. Fingerprints expire after ten minutes and are only a compatibility fallback for a pre-send race or an external integration that cannot supply the provider ID before delivery. Once a fingerprint is bound to a provider ID, it cannot classify a different provider message with the same body.

### 2. Canonical outbound source taxonomy

The registry publishes:

```text
coveragefit
producer_manual
producer_console
quote_followup
appointment
service
crm
life
commercial
campaign
system
external_unknown
```

`producer_manual` and `external_unknown` are reserved classifications. They cannot be submitted as programmatic gateway origins.

Programmatic origins currently accepted:

```text
coveragefit
producer_console
quote_followup
appointment
service
crm
life
commercial
campaign
system
```

### 3. Required outbound descriptor

Every programmatic send declares:

```text
to
message
origin
workflow
replyRoute
ownershipEffect
idempotencyKey
```

Current reply-route vocabulary:

```text
coveragefit
producer
service
life
commercial
appointment
system
none
```

Specialized reply routes are persisted now so RC-SMS-1.9.4 can consume them. Until then, the existing owner-first orchestrator remains authoritative and uncertain routing still fails producer-safe.

Current ownership effects are intentionally bounded to:

```text
preserve
producer
```

More complete acquire/transfer/pause/resume/release/close semantics remain RC-SMS-1.9.4.

### 4. Single programmatic send gateway

Added protected endpoint:

```text
POST /api/sms/send
```

Cloudflare route:

```text
functions/api/sms/send.js
```

The endpoint requires the existing producer authorization boundary, same-origin requests, bounded JSON, and a stable 8–120 character idempotency key supplied either through `Idempotency-Key` or the JSON body.

Gateway order:

1. validate recipient/message/source/workflow/reply route/ownership effect;
2. resolve the deterministic 408-FARMERS/contact live-conversation relationship;
3. enforce the current channel/orchestration permission boundary;
4. acquire an idempotency lock before provider delivery;
5. pre-register a short-lived outbound fingerprint before RingCentral delivery;
6. send through the existing RingCentral client;
7. bind the declared outbound context to the returned RingCentral provider message ID;
8. apply the declared ownership effect to the shared conversation only after successful delivery;
9. append the outbound transcript exactly once;
10. persist the last outbound context and idempotent send result.

### 5. Compatibility registration endpoint

Added protected endpoint:

```text
POST /api/sms/outbound/register
```

Cloudflare route:

```text
functions/api/sms/outbound/register.js
```

This supports an integration that must still send through RingCentral outside CoverageFit. It can register the same required descriptor with an optional RingCentral `providerMessageId`.

If a provider ID is available, it is stored directly. If it is not, the ten-minute fingerprint provides a bounded compatibility correlation path until the outbound webhook identifies the provider message.

The registration endpoint **does not send an SMS**.

### 6. RingCentral outbound webhook resolution

`server/ringcentral-sms-connection-core.mjs` now resolves outbound events in this order:

```text
provider message registry
        ↓
short-lived fingerprint fallback
        ↓
legacy known CoverageFit/operator transcript echo
        ↓
unregistered / unknown outbound
```

Registered events:

- retain their declared `origin`;
- retain `workflow`, `replyRoute`, and `ownershipEffect`;
- never trigger the old false manual-takeover classification merely because RingCentral echoes the send;
- append/increment only if the gateway or external integration has not already recorded the outbound;
- mark the registry record as observed by the provider webhook.

Unregistered events still become:

```text
origin = external_unknown
owner = producer
automationMode = human_only
```

This preserves the RC-SMS-1.9.2 human-safe invariant.

### 7. CoverageFit now uses the gateway internally

The live deterministic CoverageFit SMS reply path no longer calls RingCentral directly.

CoverageFit continuation messages register as:

```text
origin = coveragefit
workflow = current CoverageFit workflow type
replyRoute = coveragefit
ownershipEffect = preserve
```

When the same deterministic inbound step itself transitions the customer to producer handling (for example `DYLAN`, the second invalid intent response, or a direct non-CoverageFit category), CoverageFit may send exactly that bounded handoff acknowledgement as:

```text
origin = coveragefit
replyRoute = producer
ownershipEffect = producer
```

That terminal acknowledgement preserves the workflow's `awaiting_producer` state; it is not reclassified as a manual takeover. The gateway otherwise refuses a CoverageFit send unless CoverageFit currently owns the conversation in automated mode, except for a previously queued registered retry that is explicitly executed through the protected retry system.

A non-CoverageFit programmatic send also cannot leave an active CoverageFit workflow bot-owned while declaring replies belong somewhere else; it must transfer producer ownership or explicitly keep replies with CoverageFit.

### 8. Producer-console resend uses the gateway

The existing secure `resend_handoff` producer action now sends through the same gateway:

```text
origin = producer_console
replyRoute = producer
ownershipEffect = producer
```

There is no hidden direct RingCentral write path for this producer action.

### 9. Retry delivery uses the gateway

Queued automated SMS retry records now preserve:

```text
origin
workflow
replyRoute
ownershipEffect
```

Retry delivery re-enters the same gateway with a per-attempt idempotency key. This preserves outbound source/ownership metadata across a delivery failure instead of turning a retry echo into an unknown/manual message.

A registered retry may bypass the current CoverageFit-owner check because the message was authorized before the delivery failure, but it **does not bypass channel suppression**.

### 10. Shared conversation outbound context

Live conversation schema advances to `1.4` and retains:

```json
{
  "outboundContext": {
    "providerMessageId": "...",
    "origin": "appointment",
    "workflow": "appointment_reminder",
    "replyRoute": "producer",
    "ownershipEffect": "producer",
    "registrationId": "...",
    "registeredAt": "...",
    "sentAt": "..."
  }
}
```

This is **last-outbound provenance**, not the expiring cross-workflow reply-context model. Expiring reply-context and owner/reply-route separation remain RC-SMS-1.9.4.

### 11. Operations visibility

The protected SMS Operations API now returns redacted outbound provenance for each conversation, and the producer UI surfaces:

```text
Last outbound: {origin} → {replyRoute} · {ownershipEffect}
```

No recipient phone, message body, or address is added to public logs or unprotected output.

## Current safety rules

- `opted_out` / `suppressed` relationships cannot send through the programmatic gateway.
- CoverageFit cannot send when producer ownership has paused automation.
- A non-CoverageFit message cannot silently preserve bot ownership when its declared reply route belongs elsewhere.
- Unknown/unregistered RingCentral outbound remains producer-safe.
- Provider IDs beat fingerprints.
- Fingerprints are bounded to ten minutes, cannot overwrite an unresolved identical registration, and cannot be reused for a different bound provider ID.
- Duplicate gateway requests with the same successful idempotency key return the prior provider message instead of sending again.
- Duplicate provider webhooks remain protected by the existing live-event lock.

## Preserved boundaries

RC-SMS-1.9.3 does not change:

- CoverageFit buyer/home-review/bundle questions or state-machine semantics;
- Protection Score/recommendation behavior;
- secure SMS handoff token model;
- producer inbox authorization token;
- RingCentral OAuth/JWT client contract;
- existing `sms_conversations` D1 table;
- privacy-safe producer email alerts;
- 408-FARMERS port status.

No new environment variable is required.

## Explicitly deferred

### RC-SMS-1.9.4 — Cross-Workflow Ownership + Producer Continuity

Next sprint. Formalize acquire/transfer/pause/resume/release/close; separate owner from reply route; add expiring reply context; maintain workflow episodes/history; extend producer controls.

### RC-SMS-1.9.5 — Global Consent + Suppression Boundary

Make channel-level permission authoritative across every scheduled/immediate automation and reconcile provider-side consent state.

### RC-SMS-1.9.6 — Shared Number Operations Certification

Run the full pre-port collision/recovery matrix across all workflow types.

### RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification

Only after the port is complete: certify the final assigned RingCentral sender, real inbound/outbound provider path, shared human texting, registry correlation, suppression behavior, and final carrier delivery.

## Release artifacts

- `server/sms-outbound-gateway.mjs`
- `functions/api/sms/send.js`
- `functions/api/sms/outbound/register.js`
- updated `server/cloudflare-pages-handlers.mjs`
- updated `server/ringcentral-sms-connection-core.mjs`
- updated `server/sms-operations-core.mjs`
- updated `server/sms-producer-handoff-core.mjs`
- updated shared RC-SMS build identifiers
- `RC_SMS_1_9_3_CONTRACT.json`
- `RCSMS1_9_3_QA.mjs`
- `RC_SMS_1_9_3_RELEASE_CERTIFICATION.md`
- updated `RC-SMS-ROADMAP.md`
