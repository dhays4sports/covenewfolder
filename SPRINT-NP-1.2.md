# NP-1.2 — Referred Homeowner Welcome

## Status

Implemented in CoverageFit v3.20.15 and preserved through v3.20.16.

## Goal

Give a homeowner who follows a neighbor-shared review link a truthful, referral-specific CoverageFit Home welcome without creating a second intake flow or exposing information about the person who shared it.

## User-visible behavior

A visitor who arrives at the valid referral route:

`https://coveragefit.com/home/?ref=neighbor`

sees:

> **A Neighbor Shared This Home Coverage Review With You**
>
> Every home is rated differently. Complete the short review, and Dylan will personally evaluate your property, coverage needs, and available bundle opportunities.
>
> **Start My 5-Minute Review**

The page also explains that the visitor is not requesting an instant quote and that no policy information or obligation is required.

## Referral-state contract

- Only the exact single parameter `ref=neighbor` activates the experience; NP-1.3 may add one anonymous `rid` token and one bounded `share` channel beside it.
- Missing referral parameters retain the normal CoverageFit Home experience.
- Invalid, duplicated, or unsupported `ref` values clear any prior referral marker and fall back safely. Malformed, unavailable, or expired NP-1.3 tokens retain the generic referred welcome without attribution.
- A valid referral marker is stored only in session storage and remains available on refresh or a same-session return to CoverageFit Home for up to six hours.
- The marker stores only schema version, generic source, generic referral type, and receipt timestamp. It contains no referrer or recipient identity, contact information, property data, report ID, or assessment answers.
- Referral state is limited to the CoverageFit Home route.

## Existing behavior preserved

- The referral experience reuses the existing CoverageFit Home page, `/assessment/` route, Home assessment, report, scoring, submission, and private Snapshot flows.
- Direct visitors remain on the default Home welcome.
- Valid personalized 408FARMERS onboarding remains available when referral mode is not active.
- NP-1.1 sharing remains optional and successful-submission gated; its destination now points to the functional CoverageFit referral welcome.
- No neighbor name, referrer identity, or contact-upload workflow is introduced.

## Files

### Added

- `assets/js/referred-homeowner-welcome.js`
- `assets/css/referred-homeowner-welcome.css`
- `NP1_2_QA.js`
- `SPRINT-NP-1.2.md`

### Modified

- `home/index.html`
- `assets/js/home-welcome.js`
- `assets/js/post-submission-share.js`
- `home/report/index.html`
- `CHANGELOG.md`
- `README.md`
- `QA.md`
- `ROADMAP.md`
- `VERSION`
- `package.json`
- prior release QA compatibility lists

## Verification

Run:

```bash
node NP1_2_QA.js
npm test
node --check assets/js/referred-homeowner-welcome.js
node --check assets/js/home-welcome.js
node --check assets/js/post-submission-share.js
```

## NP-1.4 routing update

NP-1.4 now delivers referred visitors through the 408FARMERS bridge before this CoverageFit welcome renders.
