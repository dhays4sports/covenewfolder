# RPT-1.3 — Agent Workspace Customer Report Recovery

## Goal

Ensure **Open customer report** works whenever the secure Agent Workspace already has the completed consultation report, even when the older durable private-report lookup is missing, unavailable, or predates the current Cloudflare D1 configuration.

## Implemented

- Cache the active consultation report into the existing same-origin customer-report storage before navigation.
- Add `workspace_preview=1` to report links opened from the Agent Workspace.
- Attempt the durable opaque report lookup first.
- Fall back to the Workspace-prepared report only for explicit Workspace preview links.
- Preserve normal customer-link expiration, deletion, and stale-cache behavior.
- Replace current Agent Workspace references to Netlify with Cloudflare.

## Security boundary

The fallback does not create a public URL and does not place customer data in the URL. It works only in the same CoverageFit browser storage context that opened the secure Agent Workspace.
