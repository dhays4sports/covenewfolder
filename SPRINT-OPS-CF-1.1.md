# OPS-CF-1.1 — Cloudflare Runtime Migration

## Goal

Preserve CoverageFit's existing GitHub and Cloudflare Pages deployment while moving the server-backed producer inbox and private prospect report runtime from Netlify Functions and Netlify Blobs to Cloudflare Pages Functions and D1.

## Implemented

- Eight Cloudflare Pages Functions under `/functions/api/`
- D1-backed consultation and prospect-report storage adapter
- D1 migration for consultation records, prospect reports, and rate limits
- Cloudflare-native Web Crypto usage for opaque report IDs, hashed report keys, secret comparison, UUIDs, and payload sizing
- Production and preview binding contract for `COVERAGEFIT_DB`
- Encrypted producer secret contract for `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`
- Existing `/api/...` browser routes preserved
- Existing producer inbox, report links, 30-day expiration, report states, consultation workflow, and browser-local fallbacks preserved
- Netlify runtime files and dependency removed

## Verification

The Cloudflare handler layer was exercised end to end against the real D1 migration using a SQLite-backed D1 API harness. The flow covered private report creation and retrieval, consultation submission, authenticated inbox sync, opened state, follow-up scheduling, producer notes, final disposition, 30-day expiration, deletion, and local fallback contracts.

A live Cloudflare branch preview still requires the user's connected Cloudflare account, D1 bindings, secret, and GitHub preview branch.
