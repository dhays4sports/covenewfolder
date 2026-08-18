# 408-FARMERS Shared-Number SMS Roadmap

Last updated: CoverageFit **3.20.70** / **RC-SMS-1.9.5**.

## North star

**408-FARMERS is the agency-wide customer communication identity.** It is not synonymous with any one automation.

RingCentral remains the transport/shared inbox. CoverageFit and future systems operate behind a server-side conversation orchestrator that determines business context, conversation ownership, automation permission, and reply routing.

The target is one coherent customer thread in which only the correct human or workflow has permission to speak at a given moment.

## Program invariants

- Keep one customer-facing 408-FARMERS SMS identity unless a future regulatory/operational requirement independently justifies another number.
- Do not create parallel customer or SMS conversation records when the existing `sms_conversations` relationship can be extended safely.
- CoverageFit remains a workflow/intelligence layer, not the owner of the telephone number.
- Human/producer ownership beats automation whenever context is uncertain.
- Unknown outbound activity must fail human-safe, never bot-aggressive.
- Existing CoverageFit assessment questions, scoring, recommendation semantics, handoff security, producer authorization, and privacy boundaries remain unchanged unless a sprint explicitly names them.
- Keep PII out of public URLs, audit logs, roadmap fixtures, and email alerts.
- Preserve RingCentral provider message IDs whenever available; provider-ID correlation is preferred over body/timestamp heuristics.
- STOP/suppression must ultimately apply above every workflow before any automated send.
- RC-SMS-1.10 remains the only sprint allowed to certify the final ported 408-FARMERS production carrier path.

---

## RC-SMS-1.9.2 — Shared Number Conversation Orchestrator — COMPLETE

Release: CoverageFit 3.20.67.

Delivered:

- `server/sms-orchestrator-core.mjs`;
- schema 1.3 live conversation orchestration envelope;
- channel status separated from workflow state;
- explicit conversation owner;
- explicit automation mode;
- workflow type/status/state preservation;
- producer-safe ambiguous inbound routing;
- manual/unregistered outbound takeover without losing the underlying CoverageFit step;
- producer pause/resume synchronization;
- protected operations visibility;
- no D1 migration and no new environment variable.

Acceptance boundary: 1.9.2 identifies and preserves ownership/context. It does not yet know the formal source of every non-CoverageFit automated outbound message.

---

## RC-SMS-1.9.3 — Multi-Source Outbound Registry + SMS Gateway — COMPLETE

Release: CoverageFit 3.20.68.

Delivered:

- durable/private provider-message outbound registry in the existing SMS store;
- ten-minute hashed fingerprint compatibility registration for pre-send/external correlation;
- protected `POST /api/sms/send` gateway with required outbound source/workflow/reply/ownership metadata;
- protected `POST /api/sms/outbound/register` compatibility endpoint;
- stable idempotency keys that prevent duplicate programmatic sends;
- unresolved identical sender/recipient/message fingerprints fail closed instead of overwriting an in-flight external registration;
- CoverageFit continuation and bounded producer-handoff acknowledgements routed through the gateway;
- producer-console handoff resend routed through the gateway;
- retry sends preserve source metadata through the gateway;
- RingCentral outbound webhook registry resolution before unknown/manual classification;
- registered appointment/CRM/quote/system traffic can declare producer-safe ownership without false manual takeover;
- unregistered outbound remains `external_unknown` and producer-owned;
- live conversation schema 1.4 last-outbound provenance;
- no D1 migration and no new environment variable.

Acceptance boundary: 1.9.3 establishes source provenance and one programmatic send boundary. Complete cross-workflow transfer/reply-context semantics remain 1.9.4.

### Goal

Make every programmatic outbound message declare **who sent it, why it was sent, and where a reply belongs** before RingCentral delivery.

### Build

Add a durable/private outbound registry in the existing SMS storage boundary, keyed primarily by RingCentral provider message ID.

Canonical source taxonomy should begin with:

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

Add the programmatic send boundary:

```text
POST /api/sms/send
```

Required internal send contract:

```text
to
message
origin
workflow
replyRoute
ownershipEffect
```

The gateway must:

1. validate authorization and bounded source metadata;
2. check the current channel/conversation permission boundary available at that sprint;
3. send through the existing RingCentral client;
4. persist the provider message ID and source metadata;
5. ensure the outbound webhook echo resolves to its declared source instead of producer takeover;
6. retain idempotency/dedupe behavior; and
7. fail unknown/unregistered outbound activity to producer-safe ownership.

Also provide a bounded registration path for integrations that must send through RingCentral outside the gateway, if needed:

```text
POST /api/sms/outbound/register
```

Prefer provider message IDs. Only use short-lived sender/recipient/time/body fingerprints as a compatibility fallback.

### Must not do yet

- Do not build complete cross-workflow human transfer UX; that is 1.9.4.
- Do not claim global consent/suppression is complete; that is 1.9.5.
- Do not port or certify 408-FARMERS; that is 1.10.

### Acceptance tests

- CoverageFit outbound echo remains CoverageFit-owned.
- Registered appointment outbound does not trigger takeover.
- Registered CRM/quote outbound does not trigger CoverageFit.
- Manual RingCentral outbound still becomes producer ownership.
- Unknown outbound still fails human-safe.
- Duplicate provider webhooks cannot duplicate ownership changes or sends.

---

## RC-SMS-1.9.4 — Cross-Workflow Ownership + Producer Continuity — COMPLETE

Release: CoverageFit 3.20.69.

Delivered:

- orchestration schema 1.1 and live conversation schema 1.5;
- formal `acquire / transfer / pause / resume / release / close` ownership operations;
- owner and reply route separated as independent concepts;
- expiring reply context with a 48-hour default and 5-minute to 7-day bounded lifetime;
- registered service/appointment/life/commercial/system replies can route without surrendering producer relationship ownership;
- manual/unregistered RingCentral outbound clears stale reply context and remains producer-owned/human-only;
- exact CoverageFit workflow state survives producer takeover and can be restored directly;
- stable workflow IDs and bounded workflow episode history under the same SMS relationship;
- protected producer continuity controls for take/return/pause/resume/close/start/transfer/release/clear-context;
- gateway support for `transfer` and `release` plus `ownershipTarget`;
- retry records preserve reply-context/ownership-target provenance;
- protected SMS Operations exposes reply context, episode count, and continuity controls;
- no new D1 table, migration, or environment variable.

Acceptance boundary: 1.9.4 completes cross-workflow ownership and continuity semantics. It does **not** make consent/suppression authoritative across every sender; that remains 1.9.5.

---

## RC-SMS-1.9.5 — Global Consent + Suppression Boundary — COMPLETE

Release: CoverageFit 3.20.70.

Delivered:

- authoritative channel-level `smsConsent` contract inside the existing SMS relationship;
- backward-compatible projection for old rows with no D1 migration;
- STOP suppresses every programmatic origin while preserving the paused workflow state;
- START restores channel permission only and never blindly restarts/resumes a prior intake;
- centralized permission snapshot enforced at send preparation and immediately before RingCentral delivery;
- retry/scheduled sends re-check current permission at execution and become `suppressed` when denied;
- external outbound pre-registration obeys the same suppression boundary;
- manual/unregistered RingCentral outbound remains human-safe and cannot re-enable consent;
- explicit `human_initiated` provenance for producer-console sends without treating them as automated campaigns;
- provider status (`unknown / active / opted_out / blocked`) preserved and reconcilable through a protected consent route;
- provider suppression forces local suppression, while provider-active evidence alone cannot override a customer/application STOP;
- producer continuity controls cannot resume CoverageFit automation while suppressed;
- protected Operations exposes redacted consent/provider status and suppressed retry outcomes;
- live conversation schema 1.6, orchestration schema 1.2, outbound registry schema 1.2, consent schema 1.0;
- no new D1 table, migration, or environment variable.

Acceptance boundary: 1.9.5 completes the pre-port global application consent/suppression contract. It does **not** claim final carrier behavior on the ported 408-FARMERS number; live carrier certification remains 1.10.

---

## RC-SMS-1.9.6 — Shared Number Operations Certification — COMPLETE

**Release:** CoverageFit 3.20.71

### Delivered

- deterministic certification of the complete shared-number collision/recovery matrix;
- non-destructive protected Operations readiness snapshot with configuration, storage, webhook-health, retry, and build evidence;
- completed-customer explicit re-entry creates a new workflow episode on the same SMS relationship and clears stale answers;
- producer release resumes an active preserved CoverageFit workflow at the exact prior step, subject to global consent;
- legacy `opted_out` rows recover preserved pre-takeover workflow state through lazy normalization;
- natural home-coverage-review phrasing enters the home-review workflow;
- D1 backward-compatibility fixtures for pre-orchestrator, producer-takeover, and opted-out records;
- secret-hygiene and single-send-boundary certification;
- no new D1 table, migration, or environment variable.

Acceptance boundary: RC-SMS-1.9.6 certifies the application/shared-number stack **before** the final number is live. The final RingCentral sender, carrier path, live inbound/outbound webhook behavior, and real STOP/START delivery remain RC-SMS-1.10.

---

## RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification — NEXT

### Goal

Move the certified shared-number architecture onto the final ported 408-FARMERS RingCentral identity and verify the real provider/carrier path.

### Production checks

- port fully completed;
- configured RingCentral sender resolves to the final number;
- authenticated extension/app can send SMS from the final number;
- inbound SMS webhook subscription receives final-number events;
- outbound webhook echoes correlate correctly;
- shared human RingCentral texting works without bot collision;
- programmatic CoverageFit send works;
- registered non-CoverageFit automated send works;
- STOP/START behavior matches the certified suppression contract;
- delivery/retry/webhook health is observable;
- customer replies reach the correct owner/reply route;
- production secrets and preview secrets remain separated;
- no temporary-number assumptions remain in configuration or runbooks.

### Release definition

RC-SMS-1.10 is complete only when **408-FARMERS is certified as the unified agency SMS channel**, not merely when a CoverageFit bot can send a text.

---

## Resumption instructions

Authoritative baseline after 1.9.6:

```text
CoverageFit 3.20.71
RC-SMS-1.9.6
```

Expected archive name:

```text
CoverageFit_v3.20.71_RCSMS1.9.6_Shared_Number_Operations_Certification_ROOT_DEPLOYABLE.zip
```

Before beginning RC-SMS-1.10:

1. Read `SPRINT-RC-SMS-1.9.6.md`.
2. Read `RC_SMS_1_9_6_CONTRACT.json`.
3. Read `RC_SMS_1_9_6_RELEASE_CERTIFICATION.md`.
4. Read this roadmap completely.
5. Preserve provider-message-ID-first correlation and the single programmatic SMS gateway.
6. Preserve one live sender/recipient relationship with bounded workflow episodes.
7. Preserve exact workflow state across producer takeover, release, STOP, and START.
8. Preserve channel-level consent as authoritative for every programmatic source and retry.
9. Preserve producer-safe handling for unknown/manual outbound messages.
10. Treat the Operations certification snapshot as pre-port evidence only; RC-SMS-1.10 must verify the actual final 408-FARMERS sender/carrier path.

Minimum regression sequence:

```bash
node RCSMS1_9_6_QA.mjs
node RCSMS1_9_5_QA.mjs
node RCSMS1_9_4_QA.mjs
node RCSMS1_9_3_QA.mjs
node RCSMS1_9_2_QA.mjs
node RCSMS1_9_1_QA.mjs
node RCSMS1_9_QA.mjs
node AW_UI_2_6_QA.mjs
node STATIC_RELEASE_QA.js
node WR1C2_DEPLOYMENT_QA.js
```

Where historical QA contains an exact prior release/build pin, update only the forward-compatible build/version allowance; never weaken the functional behavior being certified.
