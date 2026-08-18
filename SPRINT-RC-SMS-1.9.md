# RC-SMS-1.9 — Operations Dashboard + Reliability

Status: Deployable code; live RingCentral carrier certification remains pending.

## Delivered
- Protected `/agent/sms-operations/` using the existing producer access token.
- Operational classifications: new, active, awaiting Dylan, human takeover, link delivered, CoverageFit started, CoverageFit completed, completed, opted out, failed, stale.
- Persisted outbound retry jobs with bounded retry attempts.
- RingCentral webhook health timestamps/counters.
- Configurable `RCSMS_STALE_HOURS`, `RCSMS_RETENTION_DAYS`, and `RCSMS_MAX_RETRIES`.
- Retention cleanup for old webhook events, audits, and retry jobs.
- Redacted audit history and aggregate campaign/partner activity.
- Handoff resolution marks CoverageFit started; completed private report creation marks CoverageFit completed when a valid originating SMS conversation is present.

## Guardrails
No PII is added to public handoff URLs. Operational logs shown in the dashboard redact phone numbers and address-like text. Retry records remain private server-side because delivery retry requires destination and message body. No new parallel SMS engine or database table was introduced.
