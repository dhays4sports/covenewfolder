# RPT-1.2 — Private Durable Prospect Report Access

## Goal
Replace URL-exposed personal information and browser-only report retrieval with an opaque, cross-device private report link while preserving the completed three-page Home Protection Snapshot.

## Implemented
- Dedicated private prospect report store and Netlify Functions with body-based token retrieval.
- 256-bit opaque bearer identifiers stored as SHA-256-derived Blob keys.
- 30-day logical expiration with deletion on expired access.
- URL-fragment report access with no customer information in query parameters.
- Prospect-safe public report payload minimization.
- Loading, expired, unavailable, temporary-service, cached, and device-only states.
- Agent Workspace linking to the active consultation's private report.
- Legacy local report compatibility.

## Acceptance
- Normal report links work across devices after deployment.
- No name, property address, campaign, referral, or session ID appears in the report URL.
- Deleted and missing reports do not use stale cached copies.
- Expired reports return a truthful expiration state.
- Server outages may use a still-valid local cache; report creation falls back to a clearly labeled one-day device-only copy.
