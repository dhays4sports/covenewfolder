# RC-SMS-1.6 — Realtor Partner Attribution

Status: Implemented and verified in code. Live carrier delivery remains pending RingCentral production certification.

## Behavior

- Text-first partner cards may include `Ref: CODE` inside a normal prefilled buyer message.
- CoverageFit resolves the code against the server-side partner registry, case-insensitively.
- Active records normalize to `partnerId`, `partnerName`, `referralSource`, and `entryMethod=sms`.
- Inactive records are ignored safely. Unknown codes do not throw or block normal intake.
- The recognized referral marker is removed before command/intent interpretation so STOP, HELP, RUSH, DYLAN and buyer intent continue to work.
- Attribution is persisted on the SMS conversation and carried inside the hashed, opaque RC-SMS-1.5 handoff record. No partner identity is placed in the public continuation URL.
- CoverageFit stores partner attribution in the existing prospect profile/integration context; no parallel assessment or referral system was introduced.
- Direct SMS traffic remains unchanged.

## Registry configuration

Production partner records are deployment configuration, not browser data or secrets. Set `RCSMS_PARTNER_REGISTRY_JSON` to a JSON array of records such as:

```json
[{"code":"AB12","partnerId":"agent-name","partnerName":"Agent Name","status":"active","source":"realtor_partner","defaultIntent":"buyer"}]
```

Codes and partner IDs must be unique. Invalid or duplicate registry configuration fails closed rather than silently misattributing a buyer. No production realtor records are embedded in this source build because none were supplied for this sprint.

## 408FARMERS contract

The `/buyer/` entry now accepts `partner_code` (aliases `sms_code` and `ref_code`). When present, Text Dylan generates a normal buyer message ending in `Ref: CODE`. Website-first attribution continues to use the existing `partner_id` / `partner_name` contract. Partner materials should use the same canonical partner ID in the website URL and the corresponding code configured in CoverageFit.
