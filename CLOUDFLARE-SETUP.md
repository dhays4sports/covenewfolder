# CoverageFit Cloudflare Pages + D1 Setup

CoverageFit production remains in the existing GitHub repository and existing Cloudflare Pages project. Netlify is not required.

## Runtime contract

- Static site: Cloudflare Pages
- API routes: Cloudflare Pages Functions under `/functions/api/`
- Durable storage binding: `COVERAGEFIT_DB`
- Producer secret: `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`
- Database engine: Cloudflare D1
- Database migrations: `migrations/0001_ops_cf_1_1.sql` and `migrations/0002_np_1_3_referral_links.sql`

## 1. Create the D1 databases

Create two databases in Cloudflare:

- `coveragefit-production`
- `coveragefit-preview`

A separate preview database prevents test submissions from entering the live producer inbox.

In Cloudflare, open **Workers & Pages → D1 SQL database → Create database**.

## 2. Apply the migration

Open each D1 database, choose **Console**, paste the contents of:

`migrations/0001_ops_cf_1_1.sql`

Then apply:

`migrations/0002_np_1_3_referral_links.sql`

Run both against production and preview. The migrations create:

- `consultation_records`
- `prospect_reports`
- `api_rate_limits`
- `referral_links`

The migration is idempotent and can be run again safely.

## 3. Bind D1 to the existing Pages project

Open:

**Workers & Pages → CoverageFit project → Settings → Bindings**

Add a D1 database binding named exactly:

`COVERAGEFIT_DB`

Configure:

- Production environment → `coveragefit-production`
- Preview environment → `coveragefit-preview`

Redeploy after adding or changing bindings.

## 4. Add the producer secret

Open:

**Workers & Pages → CoverageFit project → Settings → Variables and Secrets**

Add an encrypted secret named exactly:

`COVERAGEFIT_PRODUCER_ACCESS_TOKEN`

Use a unique random value of at least 24 characters. Configure it for both Production and Preview. The preview value may be different.

Never commit the secret to GitHub, place it in HTML, or add it to a public configuration file.

## 5. Configure producer email notifications

CONS-2.1 completed-review alerts and RC-SMS-1.9.1 actionable-queue alerts use the Resend Email API from Pages Functions. Cloudflare Pages Functions can read encrypted secrets and environment variables from `context.env`.

Under **Workers & Pages → CoverageFit project → Settings → Variables and Secrets**, configure both Production and Preview.

Encrypted secret:

- `RESEND_API_KEY` — use a Resend key restricted to sending access where possible

Plaintext variables:

- `COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL` — producer mailbox that receives alerts
- `COVERAGEFIT_NOTIFICATION_FROM` — verified sender, such as `CoverageFit <reviews@coveragefit.com>`
- `COVERAGEFIT_NEW_REVIEW_NOTIFICATIONS_ENABLED` — set to `true` to send or `false` to disable
- `RCSMS_PRODUCER_ALERTS_ENABLED` — set to `true` for actionable SMS alerts or `false` as their independent kill switch

Optional variables:

- `COVERAGEFIT_NOTIFICATION_REPLY_TO`
- `COVERAGEFIT_SITE_URL` — explicit site origin; when omitted, CoverageFit uses the current deployment origin so Preview alerts open the Preview Workspace

The sender domain must be verified in Resend. Notification failure does not block consultation storage, the RingCentral webhook, or the customer reply. Both email types intentionally exclude homeowner/prospect details. Before number porting, open `/agent/sms-operations/` and use **Send test alert** to verify the RC-SMS path. See `NEW-REVIEW-NOTIFICATION.md` and `SPRINT-RC-SMS-1.9.1.md`.

## 6. Preserve the GitHub deployment

Keep the existing GitHub repository connected to the existing Cloudflare Pages project.

Recommended Pages build settings:

- Production branch: existing production branch
- Build command: blank
- Build output directory: `.`
- Root directory: repository root

Cloudflare detects the root `/functions` directory and deploys the Pages Functions with the static site.

`wrangler.example.jsonc` is a reference for local development. It intentionally contains placeholder database IDs and should not replace your current Pages project settings unless you deliberately choose configuration-as-code.

## 7. Create a preview deployment

Create a branch such as:

`ops-cf-1.1-cloudflare-runtime`

Push this release to that branch. Cloudflare Pages should create a unique preview URL automatically.

Before testing, confirm the preview deployment has:

- `COVERAGEFIT_DB` bound to `coveragefit-preview`
- `COVERAGEFIT_PRODUCER_ACCESS_TOKEN` configured for Preview
- The D1 migration applied to `coveragefit-preview`

## 8. Preview certification flow

From a separate browser or phone:

1. Complete a Home Coverage Review.
2. Confirm the private report opens at `/home/report/#report_id=...`.
3. Copy the private link to another device and confirm the report opens.
4. Open `/agent/workspace/` on the producer device.
5. Enter the preview producer secret and select **Connect & sync**.
6. Confirm the new consultation appears as **New**.
7. Open it, acknowledge it, schedule a follow-up, add a note, and change its stage.
8. Open the consultation document and customer report.
9. Confirm browser-local fallback still works with the API unavailable.
10. Confirm no customer name, email, phone, address, session ID, or report token appears in normal query parameters.

## 9. Promote to production

After the preview flow passes, merge the branch into the production branch. Cloudflare Pages deploys the same static site, Pages Functions, and API routes to `coveragefit.com` using the production D1 binding and production secret.

## Local development

Install dependencies from the public npm registry:

```bash
npm install
```

Copy `wrangler.example.jsonc` to `wrangler.jsonc`, replace both D1 IDs, and keep the resulting file out of Git if it contains project-specific settings you do not want committed.

Store a local producer token in `.dev.vars`:

```text
COVERAGEFIT_PRODUCER_ACCESS_TOKEN=replace-with-a-long-local-secret
```

Then run:

```bash
npm run cloudflare:dev
```

Cloudflare Wrangler serves the static site and Pages Functions together.

See `OPS_CF_1_1_VERIFICATION.md` for the completed local/D1 verification record and the remaining live preview certification boundary.


## NP-1.5 referral attribution deployment

Apply both Neighborhood Protection Pass migrations to preview and production D1:

```bash
wrangler d1 execute COVERAGEFIT_DB --file=migrations/0002_np_1_3_referral_links.sql --remote
wrangler d1 execute COVERAGEFIT_DB --file=migrations/0003_np_1_5_referral_events.sql --remote
```

Deploy the paired 408FARMERS `408-NP-1.5` build first, then CoverageFit `3.20.18`. Verify `/api/referrals/event` with share-view, share-click, visit, start, and completion events. Flyer campaign URLs use `campaign_zip=<five-digit ZIP>` and `campaign_variant=rate|fit`; the canonical identifier is generated automatically.


## RC-SMS-1.1 D1 table

Apply `migrations/0004_rc_sms_1_1_conversations.sql` to preview and production. The protected `/agent/sms-simulator/` page reuses `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`; no RingCentral secrets are used in this sprint.

## 10. Configure RC-SMS-1.2 RingCentral variables

Create a private RingCentral REST application with JWT authentication. The authenticated user extension must own the temporary SMS number or be the designated SMS user for that company number. The number must expose the `SmsSender` feature.

Under **Workers & Pages → CoverageFit project → Settings → Variables and Secrets**, add the following to Preview before Production.

Plain variables:

- `RINGCENTRAL_SERVER_URL` — normally `https://platform.ringcentral.com`
- `RINGCENTRAL_CLIENT_ID` — private RingCentral application client ID
- `RINGCENTRAL_FROM_NUMBER` — temporary SMS-enabled number in E.164 format
- `RINGCENTRAL_WEBHOOK_URL` — deployed HTTPS URL ending in `/api/sms/ringcentral/webhook`
- `RINGCENTRAL_ACCOUNT_ID` — optional, defaults to `~`
- `RINGCENTRAL_EXTENSION_ID` — optional, defaults to `~`
- `RINGCENTRAL_SUBSCRIPTION_EXPIRES_IN` — optional, defaults to `3600`

Encrypted secrets:

- `RINGCENTRAL_CLIENT_SECRET`
- `RINGCENTRAL_JWT_TOKEN`
- `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN`
- `RINGCENTRAL_CONVERSATION_HASH_SECRET`

Use different random values for the validation token and conversation hash secret. Do not place them in `wrangler.example.jsonc`, browser JavaScript, a QR URL, GitHub, or support screenshots.

After deployment, open `/agent/sms-simulator/`, enter the producer access key, check the RingCentral connection, and create or renew the webhook. RingCentral sends a validation request to the configured HTTPS endpoint; CoverageFit echoes the supplied `Validation-Token` header with a 200 response. Live event deliveries must then match the configured validation token.

RC-SMS-1.3 sends the main intent menu, handles core messaging commands, recognizes bounded natural-language intents, and permits one invalid-response retry before queuing Dylan. The detailed buyer questionnaire remains deferred to RC-SMS-1.4.


### RC-SMS-1.3 live routing check

After the RC-SMS-1.2 variables are configured, deploy v3.20.21 and test `Hello`, `1`, `HELP`, `RESTART`, `DYLAN`, `STOP`, and `START`. No additional secret or D1 binding is required.


### RC-SMS-1.4 live buyer certification

No new Cloudflare binding, secret, variable, or D1 migration is required beyond RC-SMS-1.2 and RC-SMS-1.1. Deploy v3.20.22, renew the existing RingCentral webhook when necessary, and test the complete buyer sequence using the configured temporary SMS number. RUSH is stored as operational priority only. The secure CoverageFit handoff remains disabled until RC-SMS-1.5.

## RC-SMS-1.5 migration

Before deploying CoverageFit 3.20.23, apply `migrations/0005_rc_sms_1_5_handoffs.sql` to the same preview and production D1 databases used by the SMS conversation engine. No new RingCentral environment variables are required.
