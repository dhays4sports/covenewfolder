# NP-1.3 — Anonymous Referral Links

## Status

Implemented, verified, and deployable in CoverageFit v3.20.16.

## Goal

Give each acknowledged, durable Home Coverage Review one privacy-safe referral token that can be reused across Text a Neighbor, native share, and copy-link actions without revealing homeowner data in the URL.

## User-visible behavior

After a successful Home submission opens its matching private Protection Snapshot, the existing NP-1.1 share module requests one anonymous referral link:

`https://coveragefit.com/home/?ref=neighbor&rid=ref_[random-token]`

The same token is reused for every share action. Each action adds only a bounded channel marker:

- `share=sms`
- `share=native`
- `share=copy`

The homeowner never enters another person's phone number. The approved message remains unchanged.

## Token and privacy contract

- Tokens are random and non-sequential with 96 bits of entropy.
- Tokens contain no personally identifying information: no name, email, phone number, address, report ID, score, or assessment answer.
- The raw report ID is never written to referral storage. A one-way SHA-256 origin identifier links the referral internally to the completed review.
- Stored origin context is limited to campaign source, campaign, medium, content, entry path, five-digit ZIP code, and submission creation time.
- The browser success receipt stores only the token, canonical referral URL, and creation/expiration timestamps.
- The same token is returned when the same completed review requests a referral link again.

## Server behavior

NP-1.3 adds:

- `POST /api/referrals/create`
- `POST /api/referrals/read`
- D1 table `referral_links`
- 90-day referral-link expiration
- Origin aliases that prevent unnecessary token regeneration
- Hashed token storage keys

Creation requires a valid, unexpired server-backed Home Protection Snapshot. The API never returns the stored origin context to the referred visitor.

## Referred visitor behavior

CoverageFit Home accepts one optional `rid` token and one approved `share` channel beside the existing exact `ref=neighbor` parameter.

- Valid tokens are verified against the referral API and retained in session context for future attribution work.
- Malformed, unavailable, or expired tokens are removed from referral attribution.
- The visitor still reaches the safe generic landing state and neighbor-shared welcome rather than an error page.
- A generic NP-1.2 referral link without a token remains functional.

## Existing behavior preserved

- The assessment, score, lead delivery, private report, and redirect contracts are unchanged.
- NP-1.1 remains successful-submission gated, optional, dismissible, and print excluded.
- Direct visitors and personalized 408FARMERS visitors retain their existing Home experiences.
- If referral-link storage is temporarily unavailable, the share module falls back to the existing generic neighbor-review link rather than exposing a dead control.
- Local-only report fallbacks remain usable but cannot create a durable cross-device referral token until server-backed report storage is available.

## Files

### Added

- `server/referral-link-core.mjs`
- `functions/api/referrals/create.js`
- `functions/api/referrals/read.js`
- `migrations/0002_np_1_3_referral_links.sql`
- `NP1_3_QA.mjs`
- `SPRINT-NP-1.3.md`

### Modified

- `assets/js/post-submission-share.js`
- `assets/js/referred-homeowner-welcome.js`
- `server/cloudflare-pages-handlers.mjs`
- `server/d1-json-store.mjs`
- `DEPLOY.md`
- `CLOUDFLARE-SETUP.md`
- `README.md`
- `CHANGELOG.md`
- `QA.md`
- `ROADMAP.md`
- `SPRINT-NP-1.1.md`
- `SPRINT-NP-1.2.md`
- `VERSION`
- `package.json`
- prior release QA compatibility lists

## Deployment requirement

Apply `migrations/0002_np_1_3_referral_links.sql` to both preview and production D1 databases before testing or releasing NP-1.3.

## Verification

Run:

```bash
node NP1_3_QA.mjs
npm test
node --check assets/js/post-submission-share.js
node --check assets/js/referred-homeowner-welcome.js
node --check server/referral-link-core.mjs
node --check server/cloudflare-pages-handlers.mjs
```

## NP-1.4 routing update

NP-1.4 replaces the public CoverageFit query-token URL with a clean 408FARMERS token path while preserving NP-1.3 storage and validation.
