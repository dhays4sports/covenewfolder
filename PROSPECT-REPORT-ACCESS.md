# Private Prospect Report Access

CoverageFit stores prospect-facing Home Protection Snapshots in the Cloudflare D1 `prospect_reports` table.

## Routes

- `POST /api/reports/create` creates a private report.
- `POST /api/reports/read` retrieves a private report using the opaque ID in the JSON request body.
- Customer links use `/home/report/#report_id=<opaque-id>`.

## Privacy boundary

- The report ID is a 256-bit bearer token.
- The token is placed in the URL fragment, which is not sent in the page request or normal referrer headers.
- Retrieval sends the token in a same-origin POST body rather than an API URL.
- D1 record keys are derived from a SHA-256 hash of the token; raw tokens are not stored in report rows or metadata.
- Server-delivered report payloads remove email, phone, prospect profile, personalization context, consultation identifiers, report identifiers, and session IDs.
- Responses use `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer`.

## Retention

Private prospect reports expire 30 days after creation. Expired records return HTTP 410 and are deleted when accessed. Missing or deleted reports return HTTP 404.

## Fallback

When server creation is unavailable, the submitting browser receives a random device-only report ID retained for one day. The report clearly labels this state. A valid cached copy may be used during a temporary read outage, but a server 404 or 410 removes the cache and fails closed.

See `CLOUDFLARE-SETUP.md` for D1 binding, migration, preview, and production setup.
