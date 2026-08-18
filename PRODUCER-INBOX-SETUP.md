# Secure Producer Inbox Setup

The Agent Workspace receives remotely completed Home Coverage Reviews through Cloudflare Pages Functions and D1.

## Required binding

Bind the production and preview D1 databases to the Pages project using:

`COVERAGEFIT_DB`

## Required secret

Add an encrypted Cloudflare Pages secret named:

`COVERAGEFIT_PRODUCER_ACCESS_TOKEN`

Use a unique value of at least 24 characters. Configure Production and Preview separately and redeploy.

## Agent access

Open:

`/agent/workspace/`

Enter the matching producer secret and select **Connect & sync**. The secret remains in browser session storage and is not placed in consultation records or URLs.

## Storage behavior

Server-backed consultation records persist in the D1 `consultation_records` table. Browser-local consultation records remain available as a fallback when remote delivery is unavailable.

See `CLOUDFLARE-SETUP.md` for database creation, migration, preview testing, and production promotion.
