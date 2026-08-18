# NP-1.4 — 408FARMERS Referral Bridge

## Status

Implemented, verified, and deployable in CoverageFit v3.20.17 together with the 408FARMERS `408-NP-1.4` sender package.

## Goal

Move anonymous neighbor-share links onto a concise, trusted 408FARMERS public route while preserving the existing CoverageFit referred-homeowner welcome, token verification, intake, and privacy contracts.

## Public link contract

Unique referral links now use:

`https://408farmers.com/neighbor/r/ref_[anonymous-token]`

The generic fallback is:

`https://408farmers.com/neighbor/`

The anonymous token lives in the clean path rather than a visible `rid` query parameter. Share-channel markers remain bounded to `sms`, `native`, or `copy`.

## 408FARMERS bridge behavior

The matching 408FARMERS release provides a full-screen handoff that says `Preparing your personalized CoverageFit review`, presents the 408FARMERS → CoverageFit relationship, advances through three short progress states, and then continues into CoverageFit Home referral mode.

The bridge uses `location.replace`, so it does not become a back-button loop. It never redirects to itself or to a second transition route. It contains no form and creates no duplicate intake.

## CoverageFit receiver behavior

The bridge destination is the existing CoverageFit Home route with exact `ref=neighbor`. For valid links, the token survives the bridge as `rid`, and the approved share channel plus bounded campaign/UTM fields are retained.

After attribution and referral state are captured, CoverageFit cleans the referral and bridge parameters from the visible CoverageFit URL.

CoverageFit then:

- renders the NP-1.2 referred-homeowner welcome,
- verifies the token through `/api/referrals/read`,
- stores only privacy-safe referral context in session,
- and uses the existing Home assessment.

Malformed, unavailable, or expired links reach the safe generic neighbor welcome without a token rather than an error page.

## Privacy

The branded URL and public API reveal no homeowner name, address, phone number, email, report ID, score, answers, or coverage details. The path contains only the random 96-bit token.

## Existing behavior preserved

- NP-1.1 share controls remain successful-submission gated, optional, dismissible, and cross-device compatible.
- NP-1.2 referred-homeowner messaging remains the destination experience.
- NP-1.3 token generation, idempotency, storage, and 90-day expiration remain unchanged.
- Existing 408FARMERS form handoffs and CoverageFit direct visitors are unaffected.

## Files

### Added

- `NP1_4_QA.mjs`
- `SPRINT-NP-1.4.md`

### Modified

- `server/referral-link-core.mjs`
- `assets/js/post-submission-share.js`
- `home/report/index.html`
- `VERSION`
- `package.json`
- `README.md`
- `CHANGELOG.md`
- `QA.md`
- `ROADMAP.md`
- prior NP sprint documentation and current-release QA compatibility checks

## Verification

Run:

```bash
node NP1_4_QA.mjs
npm test
node --check assets/js/post-submission-share.js
node --check server/referral-link-core.mjs
```

Then run the 408FARMERS cross-repository bridge test against this project root.
