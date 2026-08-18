# Sprint NP-1.5 — End-to-End Referral Attribution

## Status

Implemented, verified, and deployable in CoverageFit **3.20.18**.

## User-visible and operational result

The Neighborhood Protection Pass now carries one anonymous referral identity through the complete existing journey:

`original completed review → share module view → share action → referred Home visit → assessment start → successful referred completion`

No parallel intake, quote flow, or contact-import workflow was created.

## Referral events

The Cloudflare endpoint `POST /api/referrals/event` accepts only these bounded stages:

- `neighbor_share_view`
- `neighbor_share_click`
- `neighbor_referral_visit`
- `neighbor_referral_start`
- `neighbor_referral_complete`

Share clicks use only the approved `sms`, `native`, or `copy` channel values. A completed referral requires a durable server-backed Home report whose stored anonymous referral ID matches the originating token.

## Any-ZIP A/B flyer campaign identifiers

The A/B flyer contract is no longer tied to 95118 or any other single market. Any five-digit ZIP can use:

- Version A, local-rate proof: `home_flyer_<ZIP>_rate`
- Version B, personal-fit curiosity: `home_flyer_<ZIP>_fit`

Examples:

- `home_flyer_95118_rate`
- `home_flyer_95118_fit`
- `home_flyer_10001_rate`
- `home_flyer_10001_fit`

The canonical input pair is `campaign_zip=<ZIP>` plus `campaign_variant=rate|fit`. Aliases `A` and `B` normalize to `rate` and `fit`. CoverageFit and 408FARMERS share the same identifier rules.

## Deduplication

Events are deduplicated server-side:

- share-module view once per referral token
- share click once per token and share channel
- referred visit once per token and browser session
- assessment start once per token and browser session
- completion once per token and durable completed report

Normal refreshes do not inflate the funnel. Client-side markers reduce repeat requests, while D1 is the authoritative deduplication layer.

## Privacy

Referral event URLs and stored event records contain no personally identifying information. They do not store a homeowner name, email, phone number, full property address, raw report ID, raw browser session ID, answers, Protection Score, or policy details.

Stored context is limited to:

- anonymous referral public ID
- event stage and bounded channel
- one-way session or destination-submission hashes where needed for deduplication
- origin campaign ID, variant, ZIP, source, medium, content, and entry
- destination five-digit ZIP after successful completion
- event and expiry timestamps

## Deployment

Apply the existing NP-1.3 migration first, then apply:

```text
migrations/0003_np_1_5_referral_events.sql
```

Deploy the paired 408FARMERS **408-NP-1.5** build before CoverageFit **3.20.18**, then verify both flyer variants with a non-production referral token.

## Acceptance result

- Any five-digit ZIP can produce canonical A/B identifiers.
- Original flyer campaign context survives the referral funnel.
- Direct and referred journeys remain distinguishable.
- Failed submissions do not create completion events.
- Successful completion requires a matching durable report.
- Reloads are deduplicated.
- Existing submission, report, transition, and NP-1.1 through NP-1.4 behavior remain intact.
