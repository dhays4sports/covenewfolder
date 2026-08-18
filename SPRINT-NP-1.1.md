# NP-1.1 — Post-Submission Share Module

## Status

Implemented in CoverageFit v3.20.14 and preserved through v3.20.16.

## Goal

Give a homeowner who has completed a Home Coverage Review a voluntary way to pass the same five-minute review to a neighbor or friend without collecting the recipient's phone number or changing the existing report-opening flow.

## User-visible behavior

After a genuinely successful submission opens its matching private Home Protection Snapshot, a new sharing section appears on page three:

- **Text a Neighbor** opens the device messaging app on iPhone, iPad, and Android with the approved message prefilled.
- **Share the Review** uses the native device share sheet when supported.
- **Copy link** provides an explicit clipboard fallback.
- Desktop browsers copy either the prepared neighbor message or canonical review link when a mobile or native share action is unavailable.
- A homeowner can dismiss the section. The dismissal remains in effect for that browser session.

The module is optional, excludes financial incentives, and does not request or store a neighbor's contact information.

## Approved message

> Hey, I just used this local five-minute home coverage review. It’s personally reviewed by Dylan at the Virginia Tam Insurance Agency, not an instant quote. Sharing in case it helps: https://coveragefit.com/home/?ref=neighbor

## Success gate

The assessment records a privacy-safe session receipt only when at least one existing delivery channel acknowledges success:

- the configured form endpoint returns an HTTP success status, or
- the existing secure remote consultation submission returns `ok: true`.

The receipt contains only the report ID, assessment type, delivery-channel success flags, timestamp, and dismissal state. It contains no homeowner name, email, phone, property address, assessment answers, score, or referral-recipient data.

The sharing section remains hidden unless:

1. the private Home report loaded successfully,
2. its opaque report ID matches the successful-submission receipt,
3. the receipt is no more than two hours old, and
4. the homeowner has not dismissed the module.

Direct report visits, old reports, failed submissions, unavailable reports, and mismatched report links do not display the module.

## Existing behavior preserved

- Home assessment questions, scoring, evidence handling, report creation, Formspree payload, secure consultation submission, producer notifications, and private report retrieval are unchanged.
- Submission failures still follow the pre-existing report-opening behavior; NP-1.1 only withholds the share module when delivery success cannot be confirmed.
- The existing private Protection Snapshot remains the post-completion destination.
- The share module is excluded from printed or saved report output.

## Cross-platform behavior

- iPhone and touch-mode iPad: `sms:&body=` fallback.
- Android: `sms:?body=` fallback.
- Browsers supporting Web Share: native share sheet.
- Desktop and browsers without Web Share: Clipboard API, followed by a hidden-textarea copy fallback.
- When clipboard access is denied, the current canonical review link remains visibly selectable. NP-1.2 updates that destination to the functional CoverageFit neighbor-welcome route. NP-1.3 now upgrades acknowledged durable reviews to one anonymous reusable token, while NP-1.4 will add the dedicated 408FARMERS referral bridge.

## Files

### Added

- `assets/js/post-submission-share.js`
- `assets/css/post-submission-share.css`
- `NP1_1_QA.js`
- `SPRINT-NP-1.1.md`

### Modified

- `assessment/index.html`
- `assets/js/assessment-engine.js`
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
node NP1_1_QA.js
npm test
node --check assets/js/post-submission-share.js
node --check assets/js/assessment-engine.js
```

NP-1.1 automated QA covers approved copy, canonical URL, iPhone and Android SMS formats, desktop fallback detection, success-receipt gating, privacy-safe receipt content, report-ID matching, expiry, dismissal, hidden-by-default markup, script order, native sharing, clipboard fallbacks, responsive CSS, and preservation of the existing redirect.

## NP-1.4 routing update

NP-1.4 now routes the generic and unique share destinations through the branded 408FARMERS neighbor bridge.
