# RC-SMS-1.9.5 — Release Certification

Status: **CERTIFIED FOR PRE-PORT SHARED-NUMBER OPERATIONS**  
Release: **CoverageFit 3.20.70**  
Sprint: **RC-SMS-1.9.5 — Global Consent + Suppression Boundary**  
Baseline: **CoverageFit 3.20.69 / RC-SMS-1.9.4**

## Certification scope

This release certifies the application-level consent and suppression boundary for the shared 408-FARMERS SMS architecture before the final number port/carrier certification.

It does **not** claim that the final ported 408-FARMERS number, RingCentral account assignment, carrier registration, or live carrier STOP/START behavior has been certified. Those remain RC-SMS-1.10.

## Certified behavior

- Consent is channel-level for the 408-FARMERS sender/recipient relationship, not tied to a CoverageFit workflow.
- STOP suppresses every programmatic source behind the SMS gateway while preserving the underlying workflow state.
- START restores channel permission only and never blindly restarts or resumes an old CoverageFit intake.
- An existing workflow remains producer-owned/human-only after START until an explicit producer continuity action restores it.
- Programmatic permission is checked when a send is prepared and again immediately before RingCentral delivery.
- Retry/scheduled work therefore cannot send after a STOP that arrives between scheduling and execution.
- External outbound pre-registration obeys the same suppression boundary.
- Manual/unregistered RingCentral outbound cannot clear the application consent record or re-enable automation.
- Provider `blocked` or `opted_out` state forces local suppression.
- Provider `active` evidence by itself cannot override a customer/application STOP.
- Producer continuity controls cannot resume CoverageFit while the relationship is suppressed.
- SMS Operations exposes only bounded/redacted consent and provider state.
- Consent remains stored inside the existing `sms_conversations` relationship; no new D1 table or migration is required.

## Focused RC-SMS certification

`RCSMS1_9_5_QA.mjs`: **36/36 PASS**

The focused suite covers:

- release/build/schema synchronization;
- STOP behavior and workflow preservation;
- suppression of CoverageFit, CRM, appointment, quote follow-up, service, life, commercial, campaign, system, and producer-console programmatic sends;
- external registration suppression;
- queued/retry execution-time re-check;
- manual RingCentral non-override;
- START permission recovery without workflow restart;
- explicit producer restoration of preserved CoverageFit state;
- provider block/active reconciliation precedence;
- protected consent endpoint read/reconciliation;
- redacted Operations state;
- producer-continuity suppression guard;
- single application SMS delivery boundary;
- root-deployable consent route; and
- roadmap handoff to RC-SMS-1.9.6.

## RC-SMS backward compatibility

All focused RC-SMS suites from **RC-SMS-1.1 through RC-SMS-1.9.5 PASS** against CoverageFit 3.20.70.

The historical RC-SMS-1.3 START assertion was intentionally advanced to the new consent contract: live START restores channel permission but does not automatically resend/restart the intake menu. The simulator's deterministic test behavior remains preserved.

## Broader release gates

- AW-UI-2.6 accessibility/regression: **60/60 PASS**
- Static root release: **16/16 PASS**
- Cloudflare deployment structure: **83/83 PASS**
- Cross-browser source checks: **19/19 PASS**
- Frozen API baseline: **36/36 PASS**
- WR-1C.7 release notes: **23/23 PASS**
- WR-1C.8 final production certification: **24/24 PASS**
- WR end-to-end: **37 checks PASS**
- WR regression hardening: **44 checks PASS**

## Repository-wide historical runner comparison

The repository-wide runner contains older suites that are intentionally pinned to historical release versions and includes pre-existing harness failures. A direct untouched-baseline comparison was therefore performed.

| Build | Total suites | Passing | Failing |
|---|---:|---:|---:|
| untouched 3.20.69 baseline | 172 | 111 | 61 |
| RC-SMS-1.9.5 / 3.20.70 | 173 | 112 | 61 |

**Net result: one new passing suite and zero new repository-wide failures.**

The 61 remaining failures are inherited from the certified baseline and are not introduced by RC-SMS-1.9.5.

## Storage and migration certification

- Existing D1 `sms_conversations` boundary retained.
- No new table.
- No migration required.
- Old records normalize consent lazily/backward-compatibly.
- No new environment variable required.

## Send-boundary certification

Application code contains no direct `sendRingCentralSms()` delivery call outside `server/sms-outbound-gateway.mjs`. The gateway is therefore the single programmatic delivery boundary for CoverageFit-controlled sending.

Manual sending performed directly inside RingCentral remains outside the CoverageFit application transport boundary and cannot mutate local consent to active.

## Cloudflare executable-build limitation

The source/deployment structure gates pass, but an executable local Wrangler Functions build could not be run in this sandbox because neither a global Wrangler binary nor `node_modules/.bin/wrangler` is installed.

This is recorded as an environment limitation. It is **not** represented as a passed executable build.

## Frozen boundary for the next sprint

RC-SMS-1.9.6 may certify the completed shared-number system but should not weaken or bypass:

1. channel-level consent precedence;
2. the gateway's double permission check;
3. START-without-blind-workflow-restart;
4. provider suppression precedence;
5. preserved workflow state under STOP;
6. producer ownership/reply-context separation; or
7. the one-live-SMS-relationship rule.

## Next sprint

**RC-SMS-1.9.6 — Shared Number Operations Certification**

That sprint should exercise the full collision/recovery matrix across CoverageFit, Dylan/manual RingCentral use, CRM/quote follow-up, appointment/service contexts, duplicate webhooks, retries, workflow episodes, STOP/START, provider reconciliation, D1 backward compatibility, secret hygiene, Cloudflare packaging, and root-deployable archive validation.

Final real-number/carrier certification remains **RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification**.
