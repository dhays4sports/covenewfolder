# RC-SMS-1.2 — RingCentral Live Connection

## Status

Implemented and repository-verified in CoverageFit v3.20.20. Live carrier certification requires deployment credentials and an SMS-enabled temporary RingCentral number.

## Bounded feature

Connect the existing deterministic SMS foundation to RingCentral without launching the later multi-step intent router. A first valid inbound SMS can receive exactly one automated welcome response. The RC-SMS-1.1 simulator remains available and does not require RingCentral.

## Runtime flow

1. RingCentral sends an inbound instant-SMS webhook to `/api/sms/ringcentral/webhook`.
2. The endpoint echoes an empty validation challenge within a small 200 response.
3. Live event requests must carry the configured webhook validation token.
4. The event is accepted only when it is an inbound SMS addressed to the configured sender.
5. A D1 event lock prevents duplicate RingCentral message IDs from creating duplicate replies.
6. The conversation receives an opaque `sms-live-*` identifier derived from a one-way hash secret.
7. The first normal inbound message receives one automated welcome through RingCentral's SMS API.
8. In v3.20.20, later inbound messages were stored without routing. RC-SMS-1.3 now routes those messages through the deterministic intent and command engine.
9. STOP is stored as opted out and receives no application-generated reply.

## Protected operator experience

The existing `/agent/sms-simulator/` page now includes a RingCentral status card. With the producer access key, Dylan can:

- Check whether required environment variables are configured.
- Verify JWT authentication against RingCentral.
- Verify that the configured temporary number is assigned to the authenticated extension.
- Verify the `SmsSender` capability.
- See whether the expected instant-SMS webhook subscription is active.
- Create or renew the subscription without exposing credentials to the browser.

## Required environment variables

Plain variables:

- `RINGCENTRAL_SERVER_URL`
- `RINGCENTRAL_CLIENT_ID`
- `RINGCENTRAL_FROM_NUMBER`
- `RINGCENTRAL_WEBHOOK_URL`
- `RINGCENTRAL_ACCOUNT_ID` (optional; defaults to `~`)
- `RINGCENTRAL_EXTENSION_ID` (optional; defaults to `~`)
- `RINGCENTRAL_SUBSCRIPTION_EXPIRES_IN` (optional; defaults to 3600 seconds)

Encrypted secrets:

- `RINGCENTRAL_CLIENT_SECRET`
- `RINGCENTRAL_JWT_TOKEN`
- `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN`
- `RINGCENTRAL_CONVERSATION_HASH_SECRET`

The webhook URL should be the deployed HTTPS route:

`https://coveragefit.com/api/sms/ringcentral/webhook`

## Welcome message

> Thanks for texting 408-FARMERS. This is the automated intake for Dylan at the Virginia Tam Insurance Agency. Dylan will personally review your message. Reply STOP to opt out or HELP for assistance.

## Security and privacy

- RingCentral credentials exist only in server environment variables.
- The browser receives only masked sender information and boolean connection status.
- Webhook validation challenges are echoed without processing a message.
- Live events require a timing-safe match against the configured validation token.
- Full phone numbers and message bodies are not written to general diagnostic output.
- Conversation IDs do not expose a phone number.
- Duplicate webhook deliveries are suppressed before an outbound reply is sent.

## Verification completed

- JWT token request construction and token caching with mocked RingCentral responses.
- Sender number and outbound SMS payload construction.
- Validation challenge echo.
- Invalid token rejection.
- First-message welcome reply.
- Duplicate message suppression.
- No repeat welcome on a later unique message.
- STOP, wrong-destination, and outbound-event handling.
- Protected health check and protected subscription creation.
- Existing simulator and full regression suite.

## Live test boundary

A real temporary-number live test could not be performed because no RingCentral client ID, client secret, JWT, account access, or SMS-enabled number was supplied. After deployment configuration, complete this live test:

1. Assign the temporary number to Dylan's RingCentral extension and confirm `SmsSender`.
2. Configure all required environment variables.
3. Deploy CoverageFit v3.20.20.
4. Open the protected simulator page and select **Check connection**.
5. Select **Create or renew webhook**.
6. Text the temporary number from a separate phone.
7. Confirm one welcome is received.
8. Send a second text and confirm the welcome is not repeated.
9. Send STOP from a separate test contact and confirm no application reply is sent.

## Deferred

- Main intent menu and HELP/START/RESTART/DYLAN command behavior: completed in RC-SMS-1.3.
- Full homebuyer branching intake: RC-SMS-1.4.
- Personalized CoverageFit continuation: RC-SMS-1.5.
- Realtor partner attribution and manual takeover: later mapped sprints.
