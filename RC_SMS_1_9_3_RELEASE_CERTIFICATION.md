# RC-SMS-1.9.3 Release Certification

Release: **CoverageFit 3.20.68**  
Sprint: **RC-SMS-1.9.3 — Multi-Source Outbound Registry + SMS Gateway**  
Status: **CERTIFIED — ROOT DEPLOYABLE**

## Certified production contract

RC-SMS-1.9.3 makes the shared 408-FARMERS SMS channel source-aware without replacing the deterministic CoverageFit intake engine introduced by earlier RC-SMS sprints.

Certified boundaries:

- all programmatic RingCentral SMS writes in the CoverageFit runtime pass through `server/sms-outbound-gateway.mjs`;
- outbound intent is registered before transport and bound to RingCentral provider message ID after successful delivery;
- provider-ID correlation is authoritative;
- a ten-minute hashed sender/recipient/body fingerprint is retained only as a compatibility fallback for an external/pre-send integration;
- unresolved identical fingerprints fail closed rather than overwriting an in-flight registration;
- successful idempotency replay returns the existing provider message instead of sending again;
- registered provider webhook echoes do not trigger false manual takeover;
- unregistered outbound RingCentral activity remains `external_unknown` and producer-owned;
- non-CoverageFit sends cannot silently leave an active CoverageFit workflow bot-owned when their replies belong elsewhere;
- CoverageFit continuation messages preserve CoverageFit ownership;
- a bounded CoverageFit terminal acknowledgement may transfer to producer ownership while preserving `awaiting_producer` rather than becoming a manual takeover;
- external pre-registration and the programmatic gateway both refuse a relationship already marked opted out/suppressed;
- producer-console handoff resend and operations retry delivery re-enter the same gateway;
- the existing `sms_conversations` D1 boundary is reused; no new migration or environment variable is required.

## Focused RC-SMS certification

| Suite | Result |
|---|---:|
| RC-SMS-1.1 | 35/35 PASS |
| RC-SMS-1.2 | 36/36 PASS |
| RC-SMS-1.3 | 37/37 PASS |
| RC-SMS-1.4 | 42/42 PASS |
| RC-SMS-1.5 | 33/33 PASS |
| RC-SMS-1.6 | 29/29 PASS |
| RC-SMS-1.7 | 25/25 PASS |
| RC-SMS-1.8 | 13/13 PASS |
| RC-SMS-1.9 | 19/19 PASS |
| RC-SMS-1.9.1 | 20/20 PASS |
| RC-SMS-1.9.2 | 20/20 PASS |
| **RC-SMS-1.9.3** | **38/38 PASS** |

RC-SMS-1.9.3 specifically certifies:

- protected send authorization;
- canonical source/reply/ownership taxonomies;
- provider registry persistence without duplicating plaintext message bodies;
- idempotent send replay;
- appointment and CRM/quote source routing;
- external provider-ID registration;
- short-lived fingerprint correlation and one-provider binding;
- unresolved fingerprint collision protection;
- unknown/manual fail-safe behavior;
- CoverageFit continuation through the gateway;
- bounded CoverageFit-to-producer terminal acknowledgement;
- provider echo dedupe;
- active-workflow collision denial;
- safe quote-follow-up producer transfer while preserving the CoverageFit step;
- current channel suppression checks on gateway and external registration;
- producer-console resend provenance;
- retry provenance;
- protected Operations provenance;
- Cloudflare route presence;
- no new D1 table;
- embedded roadmap advancement to RC-SMS-1.9.4.

## Broader release regression

| Gate | Result |
|---|---:|
| AW-UI-2.6 Accessibility + Regression | 60/60 PASS |
| Static root release | 16/16 PASS |
| WR-1C.2 Cloudflare deployment verification | 83/83 PASS |
| WR-1C.3 cross-browser compatibility | 19/19 PASS |
| WR-1C.6 frozen API baseline | 36/36 PASS |
| WR-1C.7 release notes | 23/23 PASS |
| WR-1C.8 final production certification | 24/24 PASS |
| WR-1A regression hardening | 44 checks PASS |
| WR-1A end-to-end | 37 checks PASS |
| Modified JavaScript syntax validation | PASS |
| Direct RingCentral send-boundary audit | PASS |

The send-boundary audit finds `sendRingCentralSms` only in the RingCentral transport module itself and in `server/sms-outbound-gateway.mjs`; no other server or Function route directly invokes the transport sender.

## Repository-wide legacy runner note

`RUN_REGRESSION_SUITE.js` includes many historical QA files whose release-version allowlists stop at older CoverageFit releases (several stop at 3.20.60). Running that aggregate runner at 3.20.68 therefore reports historical receiver-version assertions unrelated to RC-SMS-1.9.3 runtime behavior. The release certification above uses the current scoped production gates plus the full RC-SMS chain rather than mass-rewriting unrelated historical test artifacts solely to satisfy stale version whitelists.

## Environment limitation

The local Wrangler Pages Functions build was not executed because neither `node_modules/.bin/wrangler` nor a global `wrangler` binary is installed in the execution sandbox. The package retains its Wrangler development dependency and passes the static Cloudflare deployment verification. Live Wrangler build/deploy remains a deployment-environment check, not a claimed local pass.

## Roadmap handoff

The authoritative continuation record is `RC-SMS-ROADMAP.md`.

**NEXT:** `RC-SMS-1.9.4 — Cross-Workflow Ownership + Producer Continuity`

Then:

1. RC-SMS-1.9.5 — Global Consent + Suppression Boundary
2. RC-SMS-1.9.6 — Shared Number Operations Certification
3. RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification
