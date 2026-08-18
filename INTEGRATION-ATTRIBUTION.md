# CoverageFit Attribution Receiver Contract v1.0

Sprint B.1.1 establishes CoverageFit as the receiving side of the 408-FARMERS → CoverageFit handoff.

## Supported entry parameters

CoverageFit accepts and safely persists these query parameters:

- `campaign`
- `source`
- `entry`
- `assessment`
- `medium`
- `ref`
- `creative`
- `adset`
- `ad`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

Example:

```text
/home/?campaign=doorhanger&source=408farmers&entry=score&assessment=home&utm_medium=offline
```

## Storage behavior

- First touch is stored in `localStorage` under `coveragefit_attribution_v1` and is not overwritten.
- Current-session attribution is stored in `sessionStorage` under `coveragefit_attribution_session_v1`.
- A browser-session identifier is stored under `coveragefit_session_id_v1`.
- A later URL with explicit campaign parameters updates the session's last touch but not its original first touch.

## Assessment and lead payloads

The completed report payload now includes an `attribution` object. Contact forms also receive hidden fields for campaign, source, entry, session ID, UTMs, and the full attribution payload.

## Analytics

Every CoverageFit analytics event includes:

- attribution object
- campaign
- source
- session ID

Events continue to be stored locally, emitted as `coveragefit:event`, and pushed to `window.dataLayer` when available.

## Public browser API

```js
CoverageFitAttribution.get()
CoverageFitAttribution.getPayload()
CoverageFitAttribution.enrichForm(formElement)
CoverageFitAttribution.decorateUrl(url, overrides)
CoverageFitAttribution.clear()
```

## Scope boundary

This sprint only modifies CoverageFit. Updating 408-FARMERS to generate and send these parameters is Sprint B.1.2.
