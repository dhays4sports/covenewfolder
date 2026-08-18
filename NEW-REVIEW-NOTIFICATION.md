# CoverageFit New Review Notification

CONS-2.1 adds one privacy-safe transactional email when a newly completed Home Coverage Review reaches the secure producer inbox.

## Alert contents

The email contains only a generic new-review message, a link to the same deployment's `/agent/workspace/` route, and a privacy reminder. It excludes the homeowner's name, email, phone, property address, Protection Score, review reason, findings, consultation ID, private report token, campaign, and session identifier.

## Runtime behavior

1. The completed review is written to the existing D1 consultation record.
2. The Pages Function returns the successful homeowner response after storage, then uses Cloudflare request-lifecycle background work for notification delivery.
3. CoverageFit attempts delivery through the Resend Email API with a consultation-scoped idempotency key.
4. Temporary provider failures receive one bounded retry.
5. Notification failure never blocks the homeowner's completed review or removes it from the producer inbox.
6. Sent, failed, skipped, pending, and legacy states are retained without storing the configured sender or recipient in the consultation record.
7. Agent Workspace shows the truthful notification state and a sent activity event only after provider acceptance.

No D1 migration is required because notification state is stored inside the existing consultation JSON record and its metadata.

## Cloudflare configuration

Configure these for Preview and Production under **Workers & Pages → CoverageFit → Settings → Variables and Secrets**.

Secret:

- `RESEND_API_KEY`

Variables:

- `COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL`
- `COVERAGEFIT_NOTIFICATION_FROM`
- `COVERAGEFIT_NEW_REVIEW_NOTIFICATIONS_ENABLED`

Optional:

- `COVERAGEFIT_NOTIFICATION_REPLY_TO`
- `COVERAGEFIT_SITE_URL` — when omitted, the current Pages deployment origin is used, keeping preview emails linked to the preview Workspace.

The sending domain used by `COVERAGEFIT_NOTIFICATION_FROM` must be verified with the email provider before production delivery.

## States

- **Sent:** provider accepted the alert.
- **Failed:** provider could not accept the alert after the bounded attempt policy; the review remains saved.
- **Skipped / not configured:** required configuration is missing.
- **Skipped / disabled:** notifications are explicitly disabled.
- **Pending:** a new record is stored and delivery is being attempted.
- **Legacy:** the consultation predates CONS-2.1 and has no notification history.

A consultation already marked Sent is not emailed again. Failed or Skipped delivery can be retried safely if the same consultation is resubmitted after configuration is corrected.
