# RC-SMS-1.4 — Complete Homebuyer SMS Intake

## Status

Implemented and verified in CoverageFit 3.20.22.

## Objective

Extend the deterministic RingCentral SMS router from buyer-intent recognition into a complete, bounded home-purchase intake. The live and simulated paths now collect the same minimum useful information before the personalized CoverageFit continuation planned for RC-SMS-1.5.

## Buyer sequence

1. Property street address
2. Closing date or bounded natural-language timing
3. Occupancy: primary home, rental property, second home, or not sure
4. Whether Dylan should also review auto coverage
5. Completion confirmation and time-sensitive priority state

The system does not generate a quote, provide coverage advice, or promise eligibility. The final message states that the request is not an instant quote and remains subject to eligibility and underwriting.

## Address handling

The engine accepts ordinary street-address formats containing a street number and name, including unit markers, city, state, and ZIP when supplied. Address fragments and PO boxes are rejected with a useful correction prompt.

## Closing-date handling

Accepted formats include:

- `YYYY-MM-DD`
- `MM/DD/YYYY`
- Month-name dates
- `today` and `tomorrow`
- `in 5 days` or `in 2 weeks`
- Weekday language such as `next Friday`
- Approximate timing such as `this week`, `next week`, or `end of month`

Past dates are flagged for clarification. Invalid calendar dates and unrecognized descriptions remain in the closing-date state with a bounded correction prompt.

## RUSH behavior

`RUSH`, `URGENT`, `ASAP`, `CLOSING SOON`, and equivalent bounded signals mark the request as time-sensitive. A first-message RUSH starts the buyer flow directly. Closings within seven days are also marked time-sensitive automatically.

RUSH is an operational priority only. The response explicitly states that it does not guarantee coverage, eligibility, or turnaround time. An explicit prospect-requested RUSH remains attached even if the supplied closing date is more than seven days away.

## Messaging controls and continuity

STOP, START, RESTART, HELP, DYLAN, and AGENT remain available throughout the buyer sequence.

- HELP preserves the current state and all collected answers.
- DYLAN or AGENT moves the conversation to `awaiting_producer` without deleting the captured address, closing date, occupancy, or auto interest.
- RESTART intentionally clears the active intake.
- Duplicate RingCentral message IDs remain deduplicated.

## Stored buyer context

The protected conversation record may contain:

- `propertyAddress`
- `closingDate`
- `closingDateRaw`
- `closingDateDisplay`
- `closingTiming`
- `closingApproximate`
- `daysUntilClosing`
- `occupancy`
- `autoReview`
- `priority`
- `rushRequested`
- `rushReason`

No personal information is added to public URLs. The secure CoverageFit handoff token remains deferred to RC-SMS-1.5.

## Database and deployment

No new migration is required. RC-SMS-1.4 reuses `migrations/0004_rc_sms_1_1_conversations.sql` and the RingCentral environment variables introduced in RC-SMS-1.2.

## Verification

- Complete simulator buyer path
- Complete mocked live RingCentral buyer path
- Address validation
- Exact, relative, weekday, and approximate closing timing
- Past and invalid date correction
- Occupancy normalization
- Auto-review YES/NO handling
- RUSH persistence and automatic urgency
- HELP and DYLAN mid-flow continuity
- Duplicate completion suppression
- Full repository regression suite

## Deferred

- Secure personalized CoverageFit continuation and zero-repeat preload: RC-SMS-1.5
- Realtor SMS partner-code attribution: RC-SMS-1.6
- Producer alerts and true manual takeover: RC-SMS-1.7
- Detailed homeowner, bundle, other, and expanded RUSH paths: RC-SMS-1.8
