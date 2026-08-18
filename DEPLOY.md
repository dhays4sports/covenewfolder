# CoverageFit Deployment

CoverageFit deploys from the existing GitHub repository to the existing Cloudflare Pages project.

## RC-SMS-1.9.6 — Shared Number Operations Certification

CoverageFit 3.20.71 requires **no D1 migration, new table, or new environment variable**. Before the final port sprint, run `node RCSMS1_9_6_QA.mjs` plus the prior RC-SMS and deployment regressions. In the protected SMS Operations dashboard, review **Shared-number readiness** for synchronized build/configuration, webhook-health evidence, retry state, and storage evidence. A ready application snapshot means the pre-port stack is ready to enter RC-SMS-1.10; it does not certify the final carrier/sender.

Do not mark 408-FARMERS carrier-certified until RC-SMS-1.10 verifies the actual ported sender, RingCentral credentials, inbound/outbound webhook path, live shared human texting, and live STOP/START behavior.

## Required Cloudflare resources

- Pages Functions detected from `/functions`
- D1 binding named `COVERAGEFIT_DB`
- Encrypted secret named `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`
- Shared producer email alert configuration: `RESEND_API_KEY`, `COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL`, `COVERAGEFIT_NOTIFICATION_FROM`, `COVERAGEFIT_NEW_REVIEW_NOTIFICATIONS_ENABLED`, and `RCSMS_PRODUCER_ALERTS_ENABLED`
- D1 migrations through `migrations/0004_rc_sms_1_1_conversations.sql`

Follow `CLOUDFLARE-SETUP.md` for the one-time setup and preview certification process.

## RC-SMS-1.9.5 global consent + suppression boundary

RC-SMS-1.9.5 adds no database migration, new D1 table, or new environment variable. Existing `sms_conversations` rows normalize forward to live schema 1.6 / orchestration schema 1.2 / consent schema 1.0 on read/write.

Before deploying CoverageFit 3.20.70 on a temporary/test RingCentral number:

1. Run `node RCSMS1_9_5_QA.mjs` and all earlier RC-SMS suites.
2. Start an explicit CoverageFit flow, stop on a pending step, send **STOP**, and confirm the workflow step remains preserved while consent becomes `opted_out`, channel becomes suppressed, and no automated reply is sent.
3. Attempt CoverageFit, CRM, appointment, quote, service, life/commercial, campaign, system, producer-console, and external pre-registration sends; confirm all programmatic paths are denied.
4. Queue a retry while active, issue STOP before retry execution, run pending retries, and confirm the job becomes `suppressed` without provider delivery.
5. Send a manual RingCentral message after STOP and confirm it is human-classified but does not restore consent.
6. Send **START** and confirm channel permission returns without restarting the old CoverageFit workflow; the preserved workflow must remain producer-owned/human-only until **Return to CoverageFit** or another explicit resume action.
7. Reconcile a provider `blocked` state through `/api/sms/consent/` and confirm local suppression; reconcile provider `active` afterward and confirm it does not override an existing customer/application opt-out.
8. Verify `/agent/sms-operations/` shows consent status, provider status, and suppressed retry outcomes without exposing the raw customer phone number.

Do not claim final 408-FARMERS carrier behavior in this release. `RC-SMS-ROADMAP.md` identifies **RC-SMS-1.9.6 — Shared Number Operations Certification** as the next sprint; RC-SMS-1.10 remains the final port + live carrier certification.

## RC-SMS-1.9.4 cross-workflow ownership + producer continuity

RC-SMS-1.9.4 is the prior continuity baseline. See `SPRINT-RC-SMS-1.9.4.md` for its ownership/reply-context contract.

## RC-SMS-1.9.2 shared-number conversation orchestrator

RC-SMS-1.9.2 adds no database migration and no new environment variable. It upgrades live conversation records in place inside the existing `sms_conversations` D1 table by persisting an orchestration envelope on the next write.

Before deploying CoverageFit 3.20.67:

1. Keep the existing RingCentral, D1, producer-access, handoff, and Resend configuration unchanged.
2. Run `node RCSMS1_9_2_QA.mjs`.
3. On the temporary/test RingCentral number, start one explicit homebuyer conversation and confirm SMS Operations shows `coveragefit` / `automated`.
4. Send one manual RingCentral text during that intake and confirm SMS Operations changes to `producer` / `human_only` while the workflow state remains the pending CoverageFit step.
5. Reply from the customer while producer ownership is active and confirm no automated CoverageFit SMS is sent.
6. Use the protected producer Resume action and confirm the preserved guided step can continue.
7. Send a fresh ambiguous `Hi Dylan` from a separate test number and confirm it is recorded for the producer without launching the CoverageFit menu.

Do not port or certify the final 408-FARMERS production number in this sprint. The embedded `RC-SMS-ROADMAP.md` keeps the outbound registry, cross-workflow ownership, global suppression, shared-number certification, and final port in RC-SMS-1.9.3 through RC-SMS-1.10.

## RC-SMS-1.9.1 immediate producer alerts

RC-SMS-1.9.1 adds no database migration and does not require a ported production number. It reuses the existing Resend sender and recipient settings. Set `RCSMS_PRODUCER_ALERTS_ENABLED=true` in Preview and Production; set it to `false` for a deliberate alert kill switch.

Before number porting:

1. Deploy CoverageFit 3.20.54 to Preview with the existing producer email variables and `RESEND_API_KEY` configured.
2. Open `/agent/sms-operations/` with the producer access key and confirm Producer alerts shows **Ready**.
3. Select **Send test alert**, confirm the `[TEST]` email arrives, and verify it contains no prospect information.
4. Complete one fictional RUSH SMS intake on the temporary number and verify one `[RUSH]` alert, an opaque dashboard link, and a `sent` alert state.
5. Confirm intermediate replies, STOP, a duplicate completion event, and producer manual takeover do not create extra alerts.

Alert delivery is best-effort and asynchronous to the inbound webhook. It never delays or gates the customer SMS reply. Existing completed CoverageFit review notifications remain a separate lead intake point.

## Build settings

- Build command: blank
- Build output directory: `.`
- Root directory: repository root

## Release process

1. Put the complete release into a Git branch.
2. Push the branch to GitHub.
3. Test the Cloudflare Pages preview deployment against the preview D1 database.
4. Merge to the production branch only after the end-to-end preview flow passes.
5. Confirm `coveragefit.com`, `/api/consultations/*`, `/api/reports/*`, and `/api/referrals/*` are served by the same Pages project.
6. Confirm the `referral_links` table exists in both preview and production D1 before enabling NP-1.3 sharing.

## Rollback

Use Cloudflare Pages deployment history to roll back the static site and Functions. D1 records persist independently across deployments. Do not delete or recreate the production D1 database during a normal application rollback.


## NP-1.5 referral attribution deployment

Apply both Neighborhood Protection Pass migrations to preview and production D1:

```bash
wrangler d1 execute COVERAGEFIT_DB --file=migrations/0002_np_1_3_referral_links.sql --remote
wrangler d1 execute COVERAGEFIT_DB --file=migrations/0003_np_1_5_referral_events.sql --remote
```

Deploy the paired 408FARMERS `408-NP-1.5` build first, then CoverageFit `3.20.18`. Verify `/api/referrals/event` with share-view, share-click, visit, start, and completion events. Flyer campaign URLs use `campaign_zip=<five-digit ZIP>` and `campaign_variant=rate|fit`; the canonical identifier is generated automatically.


## RC-SMS-1.1 simulator deployment

Apply the simulator conversation migration to preview and production D1 before opening `/agent/sms-simulator/`:

```bash
wrangler d1 execute COVERAGEFIT_DB --file=migrations/0004_rc_sms_1_1_conversations.sql --remote
```

Confirm `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` remains configured. No RingCentral credentials are required for RC-SMS-1.1.

## RC-SMS-1.2 RingCentral live connection

RC-SMS-1.2 reuses the existing `sms_conversations` D1 table. No new database migration is required beyond `migrations/0004_rc_sms_1_1_conversations.sql`.

Configure these Cloudflare Pages variables for Preview first:

Plain variables:

```text
RINGCENTRAL_SERVER_URL=https://platform.ringcentral.com
RINGCENTRAL_CLIENT_ID=<private app client id>
RINGCENTRAL_FROM_NUMBER=<temporary SMS-enabled E.164 number>
RINGCENTRAL_WEBHOOK_URL=https://<preview-or-production-host>/api/sms/ringcentral/webhook
RINGCENTRAL_ACCOUNT_ID=~
RINGCENTRAL_EXTENSION_ID=~
RINGCENTRAL_SUBSCRIPTION_EXPIRES_IN=3600
```

Encrypted secrets:

```text
RINGCENTRAL_CLIENT_SECRET=<private app client secret>
RINGCENTRAL_JWT_TOKEN=<user JWT credential>
RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN=<random secret at least 24 characters>
RINGCENTRAL_CONVERSATION_HASH_SECRET=<different random secret at least 32 characters>
```

Deployment and certification:

1. Deploy CoverageFit v3.20.20 to Preview.
2. Open `/agent/sms-simulator/` and authenticate with the producer access key.
3. Select **Check connection**.
4. Confirm the configured sender is found and reports `SmsSender`.
5. Select **Create or renew webhook**.
6. Confirm the status becomes **Connected and subscribed**.
7. Text the temporary number from a separate phone and verify one welcome response.
8. Send a second text and confirm the welcome is not repeated.
9. Complete STOP and duplicate-event tests before promoting to Production.

The production `RINGCENTRAL_WEBHOOK_URL` must use the production CoverageFit hostname. Preview and Production should use separate validation and conversation-hash secrets.


## RC-SMS-1.3 intent router

RC-SMS-1.3 uses the same RingCentral environment variables and the existing `sms_conversations` table introduced by `migrations/0004_rc_sms_1_1_conversations.sql`. No new migration is required.

After deploying CoverageFit v3.20.21:

1. Open `/agent/sms-simulator/` and verify the RingCentral connection.
2. Create or renew the webhook if needed.
3. Test the main menu with `Hello`.
4. Test Buyer, Home Review, Home and Auto, and Other selections.
5. Test HELP, RESTART, DYLAN, STOP, and START.
6. Send two unclear menu responses and verify the second moves the conversation to Dylan.

The complete buyer questionnaire remains disabled in the live path until RC-SMS-1.4.


## RC-SMS-1.4 complete homebuyer intake

RC-SMS-1.4 requires no new database migration or environment variable. Confirm `migrations/0004_rc_sms_1_1_conversations.sql` is already applied and the RC-SMS-1.2 RingCentral configuration remains active.

After deploying CoverageFit v3.20.22:

1. Open `/agent/sms-simulator/` and complete a fictional buyer path.
2. Test an exact date, `next Friday`, `this week`, and a past date.
3. Test RUSH before and during the buyer flow.
4. Verify HELP preserves the current question and prior answers.
5. Verify DYLAN pauses automation without deleting captured information.
6. On the temporary RingCentral number, complete address, closing, occupancy, and auto-review responses.
7. Confirm the final response states that this is not an instant quote.
8. Confirm no CoverageFit link is sent yet; that remains RC-SMS-1.5.

## RC-SMS-1.5 migration

Before deploying CoverageFit 3.20.23, apply `migrations/0005_rc_sms_1_5_handoffs.sql` to the same preview and production D1 databases used by the SMS conversation engine. No new RingCentral environment variables are required.
