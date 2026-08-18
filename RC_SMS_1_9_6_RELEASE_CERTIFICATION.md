# RC-SMS-1.9.6 Release Certification

**Release:** CoverageFit 3.20.71  
**Sprint:** RC-SMS-1.9.6 — Shared Number Operations Certification  
**Certification scope:** Pre-port application/shared-number stack  
**Final carrier status:** PENDING RC-SMS-1.10

## Result

**PASS for RC-SMS-1.9.6 pre-port application certification.**

The shared-number orchestration stack is certified across CoverageFit routing, producer/manual takeover and release, temporary reply context, registered non-CoverageFit sources, global consent/suppression, retries, duplicate webhooks, completed-customer workflow re-entry, legacy-record normalization, operations visibility, secret hygiene, and root deployment structure.

This certification deliberately does **not** certify the final ported 408-FARMERS RingCentral/carrier path.

## Focused certification

- `RCSMS1_9_6_QA.mjs`: **54/54 PASS**
- all RC-SMS suites `1.1` through `1.9.6`: **PASS**
- `AW_UI_2_6_QA.mjs`: **PASS**
- `STATIC_RELEASE_QA.js`: **16/16 PASS**
- `WR1C2_DEPLOYMENT_QA.js`: **83/83 PASS**
- `WR1C3_CROSS_BROWSER_QA.js`: **19/19 PASS**
- `WR1C6_API_BASELINE_QA.js`: **36/36 PASS**
- `WR1C7_QA.js`: **23/23 PASS**
- `WR1C8_QA.js`: **24/24 PASS**
- `WR1_EndToEnd_QA.js`: **37 checks PASS**
- `WR1_Regression_QA.js`: **44 checks PASS**
- modified JavaScript syntax validation: **PASS**
- RC-SMS-1.9.6 contract JSON parse: **PASS**

## Repository-wide historical runner comparison

The global repository runner contains inherited historical version pins and remains red independently of this sprint. Direct baseline comparison establishes that RC-SMS-1.9.6 adds no failures:

| Tree | Total suites | Passed | Failed |
|---|---:|---:|---:|
| untouched CoverageFit 3.20.70 / RC-SMS-1.9.5 | 173 | 112 | 61 |
| CoverageFit 3.20.71 / RC-SMS-1.9.6 | 174 | 113 | 61 |

**Delta:** +1 suite, +1 pass, +0 failures.

## Hardening discovered by certification

1. **Completed workflow explicit re-entry:** a customer who completed a prior review can explicitly start a new buyer/home-review/bundle episode on the same SMS relationship. The prior episode is archived and stale answers are cleared.
2. **Producer release continuity:** releasing producer ownership over an active preserved CoverageFit workflow resumes the exact prior CoverageFit step; suppression blocks the release from reactivating automation.
3. **Legacy opted-out state recovery:** old rows in `opted_out` meta-state recover `preTakeoverState`/`resumeState` during lazy normalization with no D1 migration.
4. **Natural review intent:** common “home coverage review” phrasing is recognized as explicit home-review intent.

## Operations readiness snapshot

The protected Operations API/dashboard now provides a non-destructive pre-port readiness snapshot. It checks synchronized build identity, required runtime configuration presence, storage evidence, webhook-health evidence when available, and retry state. It returns booleans/status and missing binding names only; it does not return secret values, message bodies, or customer phone numbers.

A `ready_for_rc_sms_1_10` application status means the code/configuration boundary is ready to enter the final port sprint. It is **not** a carrier certification.

## D1 compatibility

Three backward-compatibility fixtures are included under `fixtures/rc-sms-1.9.6/`:

- `legacy-pre-orchestrator.json`
- `legacy-producer-takeover.json`
- `legacy-opted-out.json`

All normalize successfully under the current schema without creating a new D1 table or requiring a migration.

## Secret hygiene

Certification confirms:

- no committed `.env` / `.dev.vars` / live Wrangler secret configuration file;
- public client surfaces do not reference private RingCentral secret bindings;
- the readiness snapshot never exposes secret values;
- the outbound gateway remains the single application RingCentral delivery boundary.

## Cloudflare Functions executable build note

The package pins `wrangler` `4.114.0` as a dev dependency. During this certification environment, two attempts to install that pinned package exceeded the sandbox command execution limit, and no Wrangler binary was otherwise present. Therefore the actual `wrangler pages functions build` command is **NOT CLAIMED AS PASSING** here.

This is an environment/tooling limitation, not silently waived evidence. Root Functions structure and deployment-source checks pass via `WR1C2_DEPLOYMENT_QA.js` (83/83). RC-SMS-1.10 should execute the pinned Wrangler build in the deployment environment before live port certification.

## Frozen production boundary

RC-SMS-1.10 remains responsible for verifying on the actual final 408-FARMERS number:

- completed port;
- authenticated RingCentral sender identity;
- real outbound SMS;
- real inbound webhook delivery;
- outbound echo correlation;
- shared human RingCentral texting without bot collision;
- registered non-CoverageFit automation;
- live STOP/START behavior;
- delivery/retry/webhook health;
- correct owner/reply routing on real customer replies.

Until those tests pass, the package must not describe 408-FARMERS as carrier-certified.
