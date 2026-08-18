# Trigger personalization implemented

Single source of truth: `coveragefit_trigger` in sessionStorage and `trigger` in the report payload.

Supported pilot triggers:
- `renewal`
- `premium-increase`
- `homebuyer`

Flow:
1. Trigger landing page links to `/assessment/?trigger=<value>`.
2. `trigger-context.js` validates and stores the trigger.
3. Assessment uses the trigger for introductory copy and lead submission.
4. The report URL includes `trigger=<value>`.
5. The report reads the trigger from payload, URL, or sessionStorage and personalizes its opening narrative.
