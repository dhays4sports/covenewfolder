# RC-SMS-1.3 — Intent Router and Messaging Controls

## Status

Implemented and repository-verified in CoverageFit v3.20.21. Live carrier certification still requires deployed RingCentral credentials and an SMS-enabled temporary or production number.

## Bounded feature

Advance the RC-SMS-1.2 one-response connection into a deterministic intent router. The live RingCentral webhook now recognizes the prospect’s top-level need, handles core messaging commands, permits one useful retry after an unclear response, and then exits the automation loop by queuing the conversation for Dylan.

This sprint does not yet run the full buyer questionnaire. The detailed property, closing-date, occupancy, and bundle sequence remains RC-SMS-1.4.

## Main menu

> Thanks for texting 408-FARMERS. This is the automated intake for Dylan at the Virginia Tam Insurance Agency. Dylan will personally review your information.
>
> What can we help with?
> 1. Buying a home
> 2. Reviewing current home coverage
> 3. Home and auto together
> 4. Something else
>
> Reply STOP to opt out, HELP for assistance, or DYLAN to request a personal reply.

## Intent recognition

The deterministic router accepts both numeric and bounded natural-language responses.

- Buyer: `1`, `buyer`, `buying a home`, `in escrow`, `my realtor sent me`, and similar purchase language.
- Home review: `2`, `home review`, `current home coverage`, and similar review language.
- Bundle: `3`, `bundle`, `home and auto`, and similar combined-policy language.
- Other: `4`, `other`, or `something else`.

A recognized live intent is stored structurally and moved to `awaiting_producer`. RC-SMS-1.4 will replace the buyer acknowledgement with the full buyer intake sequence.

## Messaging controls

- `STOP`, plus standard equivalent opt-out commands, moves the application record to `opted_out` and sends no application-generated response.
- `START` restores an opted-out application conversation and sends the main menu.
- `RESTART` or `RESET` clears the selected intent and retry count, then returns to the main menu.
- `HELP` explains the automated intake, available choices, Dylan handoff, and opt-out option.
- `DYLAN`, `AGENT`, `HUMAN`, or `PERSON` pauses automated routing and queues the conversation for personal handling.

Outbound RingCentral events continue to be ignored, so Dylan’s manual RingCentral messages are not interpreted as prospect replies.

## Invalid-response handling

The router permits one helpful retry while the conversation is in the intent menu.

1. First unclear response: asks the prospect to reply 1, 2, 3, 4, or DYLAN.
2. Second unclear response: changes the state to `awaiting_producer` and stops the automated loop.

Greetings such as `Hello` open the menu without counting as an invalid response.

## First-message optimization

A first message that already contains a recognizable intent does not force the prospect to repeat it. The first automated reply still identifies the automated intake and the Virginia Tam Insurance Agency, then acknowledges the detected need.

## Stored conversation fields

Live and simulated conversation records now include:

- State
- Structured intent
- Invalid-intent attempt count
- Last recognized command
- Inbound and outbound counts
- Opt-out and resume timestamps
- Bounded transcript
- Engine and connection build identifiers

Phone numbers remain inside the protected server record. D1 keys use the existing opaque, one-way hashed live conversation identifier.

## Protected simulator updates

The internal `/agent/sms-simulator/` experience now displays:

- Invalid retry count
- Last recognized command
- Suggested HELP, DYLAN, and START tests
- Updated RC-SMS-1.3 live-connection guidance

The simulator still sends no real SMS and continues to preserve the existing fictional buyer path for future-sprint testing.

## Database and deployment

No new migration is required. RC-SMS-1.3 reuses:

`migrations/0004_rc_sms_1_1_conversations.sql`

Required RingCentral environment variables are unchanged from RC-SMS-1.2.

## Verification completed

- Numeric and natural-language intent classification.
- First-message direct intent recognition.
- STOP, START, RESTART, HELP, DYLAN, and AGENT behavior.
- One-retry invalid-response handling and automatic escalation.
- Live RingCentral multi-message routing with mocked production-shaped events.
- Duplicate event suppression.
- Silence after personal queue and opt-out.
- Existing JWT, webhook-validation, sender-capability, and subscription behavior.
- Protected simulator UI and persistence.
- Full CoverageFit regression suite.

## Live certification steps

1. Deploy CoverageFit v3.20.21.
2. Confirm the existing D1 SMS migration is applied.
3. Configure the RingCentral secrets and sender.
4. Verify the sender and webhook in the protected Connection Lab.
5. Text `Hello` and confirm the main menu.
6. Reply `1` and confirm the buyer acknowledgement and stored intent.
7. Test two invalid replies and confirm the second queues Dylan.
8. Test HELP, RESTART, DYLAN, STOP, and START.
9. Confirm a manual outbound RingCentral message does not trigger automation.

## Deferred

- Full buyer address, closing-date, occupancy, urgency, and bundle intake: RC-SMS-1.4.
- Personalized CoverageFit continuation: RC-SMS-1.5.
- Realtor partner code attribution: RC-SMS-1.6.
- Producer alerts and true manual-takeover controls: RC-SMS-1.7.
