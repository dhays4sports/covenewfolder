import fs from 'node:fs';
import {
  SMS_OUTBOUND_FINGERPRINT_TTL_MS,
  SMS_OUTBOUND_GATEWAY_BUILD,
  SMS_OUTBOUND_ORIGINS,
  SMS_PROGRAMMATIC_ORIGINS,
  SMS_REPLY_ROUTES,
  SMS_OWNERSHIP_EFFECTS,
  SMS_OUTBOUND_REGISTRY_PREFIX,
  SMS_OUTBOUND_FINGERPRINT_PREFIX,
  SMS_OUTBOUND_IDEMPOTENCY_PREFIX,
  SmsGatewayError,
  handleSmsOutboundRegister,
  handleSmsSend,
  registerExternalOutbound,
  sendSmsThroughGateway,
  smsLiveConversationId
} from './server/sms-outbound-gateway.mjs';
import {
  handleRingCentralWebhook,
  LIVE_CONVERSATION_PREFIX,
  RC_SMS_CONNECTION_BUILD
} from './server/ringcentral-sms-connection-core.mjs';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import { handleSmsProducerHandoff, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';
import { handleSmsOperations, queueSmsRetry, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION } from './server/sms-conversation-core.mjs';
import { SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { SMS_PRODUCER_ALERT_BUILD } from './server/sms-producer-alert.mjs';
import { SMS_ORCHESTRATOR_BUILD, normalizeSmsOrchestration } from './server/sms-orchestrator-core.mjs';

const checks = [];
const check = (name, condition) => { if (!condition) throw new Error(`FAIL: ${name}`); checks.push(name); };

class Store {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.has(String(key)) ? structuredClone(this.values.get(String(key))) : null; }
  async setJSON(key, value, options = {}) {
    key = String(key);
    if (options.onlyIfNew && this.values.has(key)) throw new Error('D1 UNIQUE constraint');
    this.values.set(key, structuredClone(value));
  }
  async delete(key) { this.values.delete(String(key)); }
  async list({ prefix = '', limit = 500 } = {}) {
    return { blobs: [...this.values.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(key => ({ key })) };
  }
  entries(prefix = '') { return [...this.values.entries()].filter(([key]) => key.startsWith(prefix)); }
}

const version = fs.readFileSync('VERSION', 'utf8').trim();
check('release remains forward-compatible after CoverageFit 3.20.68', ['3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && JSON.parse(fs.readFileSync('package.json', 'utf8')).version === version);
check('all RC-SMS runtime surfaces remain synchronized after 1.9.3', SMS_ENGINE_VERSION === '1.7.2' && [SMS_ENGINE_BUILD, SMS_HANDOFF_BUILD, RC_SMS_CONNECTION_BUILD, SMS_PRODUCER_HANDOFF_BUILD, SMS_OPERATIONS_BUILD, SMS_PRODUCER_ALERT_BUILD, SMS_ORCHESTRATOR_BUILD, SMS_OUTBOUND_GATEWAY_BUILD].every(value => ['RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(value)));
check('canonical source taxonomy includes registered and reserved origins', ['coveragefit','producer_manual','producer_console','quote_followup','appointment','service','crm','life','commercial','campaign','system','external_unknown'].every(value => SMS_OUTBOUND_ORIGINS.includes(value)) && !SMS_PROGRAMMATIC_ORIGINS.includes('producer_manual') && !SMS_PROGRAMMATIC_ORIGINS.includes('external_unknown'));
check('reply-route and ownership-effect contracts remain bounded', SMS_REPLY_ROUTES.includes('coveragefit') && SMS_REPLY_ROUTES.includes('producer') && SMS_REPLY_ROUTES.includes('appointment') && ['preserve','producer'].every(value => SMS_OWNERSHIP_EFFECTS.includes(value)));
check('fingerprint compatibility window is ten minutes', SMS_OUTBOUND_FINGERPRINT_TTL_MS === 10 * 60 * 1000);

const env = {
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN: 'producer-access-token-1234567890',
  RINGCENTRAL_SERVER_URL: 'https://platform.ringcentral.com',
  RINGCENTRAL_CLIENT_ID: 'id', RINGCENTRAL_CLIENT_SECRET: 'secret', RINGCENTRAL_JWT_TOKEN: 'jwt',
  RINGCENTRAL_FROM_NUMBER: '+14085550123',
  RINGCENTRAL_WEBHOOK_URL: 'https://coveragefit.com/api/sms/ringcentral/webhook',
  RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-token-test-123456789',
  RINGCENTRAL_CONVERSATION_HASH_SECRET: 'conversation-hash-secret-test-123456789',
  RCSMS_PRODUCER_ALERTS_ENABLED: 'false'
};
let clock = new Date('2026-08-17T05:15:00.000Z');
const now = () => new Date(clock);
const advance = seconds => { clock = new Date(clock.getTime() + seconds * 1000); };
let providerCounter = 0;
const providerSends = [];
const fetchImpl = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return Response.json({ access_token: 'token-193', expires_in: 3600 });
  if (url.endsWith('/sms')) {
    const payload = JSON.parse(init.body);
    providerCounter += 1;
    const id = `gw-${providerCounter}`;
    providerSends.push({ id, payload, at: now().toISOString() });
    return Response.json({ id });
  }
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};
const webhookPayload = ({ id, direction, subject, contact = '+14085550177', at = now().toISOString() }) => ({
  uuid: `uuid-${id}`, event: SMS_EVENT_FILTER, timestamp: at,
  body: direction === 'Inbound'
    ? { id, to: [{ phoneNumber: env.RINGCENTRAL_FROM_NUMBER, target: true }], from: { phoneNumber: contact }, type: 'SMS', direction, creationTime: at, subject }
    : { id, to: [{ phoneNumber: contact, target: true }], from: { phoneNumber: env.RINGCENTRAL_FROM_NUMBER }, type: 'SMS', direction, creationTime: at, subject }
});
const webhookRequest = payload => new Request(env.RINGCENTRAL_WEBHOOK_URL, {
  method: 'POST', headers: { 'Validation-Token': env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
});
const authHeaders = { Authorization: `Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`, Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' };

// Protected gateway API and idempotent appointment delivery.
const gatewayStore = new Store();
clearRingCentralTokenCache();
const unauthorized = await handleSmsSend(new Request('https://coveragefit.com/api/sms/send', { method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: '{}' }), { env, store: gatewayStore, fetchImpl, now });
check('SMS gateway requires existing producer authorization', unauthorized.status === 401);
const appointmentRequestBody = { to: '+14085550177', message: 'Reminder: your appointment with Dylan is tomorrow at 2 PM.', origin: 'appointment', workflow: 'appointment_reminder', replyRoute: 'producer', ownershipEffect: 'producer' };
const appointmentRequest = () => new Request('https://coveragefit.com/api/sms/send', { method: 'POST', headers: { ...authHeaders, 'Idempotency-Key': 'appointment:test:001' }, body: JSON.stringify(appointmentRequestBody) });
const sendResponse = await handleSmsSend(appointmentRequest(), { env, store: gatewayStore, fetchImpl, now });
const sendBody = await sendResponse.json();
check('protected SMS gateway sends registered appointment traffic', sendResponse.status === 201 && sendBody.ok && sendBody.registration?.origin === 'appointment' && sendBody.registration?.replyRoute === 'producer' && providerSends.length === 1);
const appointmentProviderId = sendBody.providerMessageId;
check('provider message ID is durably registered and fingerprint/idempotency records exist', Boolean(await gatewayStore.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}${appointmentProviderId}`)) && gatewayStore.entries(SMS_OUTBOUND_FINGERPRINT_PREFIX).length === 1 && gatewayStore.entries(SMS_OUTBOUND_IDEMPOTENCY_PREFIX).length === 1);
const storedProviderRecord = await gatewayStore.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}${appointmentProviderId}`);
check('registry stores provenance without duplicating plaintext message body', storedProviderRecord.origin === 'appointment' && storedProviderRecord.workflow === 'appointment_reminder' && !Object.prototype.hasOwnProperty.call(storedProviderRecord, 'message') && !Object.prototype.hasOwnProperty.call(storedProviderRecord, 'body'));
const duplicateSendResponse = await handleSmsSend(appointmentRequest(), { env, store: gatewayStore, fetchImpl, now });
const duplicateSendBody = await duplicateSendResponse.json();
check('successful idempotency replay returns prior provider message without resending', duplicateSendResponse.status === 200 && duplicateSendBody.deduped === true && duplicateSendBody.providerMessageId === appointmentProviderId && providerSends.length === 1);
let appointmentConversation = gatewayStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('registered appointment send establishes producer-safe ownership and provenance', appointmentConversation?.state === 'human_takeover' && appointmentConversation?.orchestration?.ownership?.owner === 'producer' && appointmentConversation?.orchestration?.automationMode === 'human_only' && appointmentConversation?.outboundContext?.origin === 'appointment');
const countBeforeEcho = appointmentConversation.outboundCount;
advance(1);
const appointmentEcho = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: appointmentProviderId, direction: 'Outbound', subject: appointmentRequestBody.message })), { env, store: gatewayStore, fetchImpl, now });
const appointmentEchoBody = await appointmentEcho.json();
appointmentConversation = gatewayStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('RingCentral echo resolves registered appointment source instead of false manual takeover', appointmentEchoBody.registeredOutbound === true && appointmentEchoBody.outboundOrigin === 'appointment' && appointmentEchoBody.ownershipEffect === 'producer' && !appointmentEchoBody.manualTakeover);
check('registered provider echo does not duplicate transcript/count/ownership side effects', appointmentConversation.outboundCount === countBeforeEcho && appointmentConversation.transcript.filter(item => item.id === `rc-${appointmentProviderId}`).length === 1 && appointmentConversation.orchestration?.ownership?.reason === 'registered_outbound:appointment');
const duplicateEcho = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: appointmentProviderId, direction: 'Outbound', subject: appointmentRequestBody.message })), { env, store: gatewayStore, fetchImpl, now });
check('duplicate provider webhook is deduped', (await duplicateEcho.json()).deduped === true && gatewayStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1]?.outboundCount === countBeforeEcho);
advance(1);
const replyAfterAppointment = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'appt-reply-1', direction: 'Inbound', subject: 'Can we make it 3?', contact: '+14085550177' })), { env, store: gatewayStore, fetchImpl, now });
const replyAfterAppointmentBody = await replyAfterAppointment.json();
check('reply after appointment remains producer-owned with no CoverageFit bot send', replyAfterAppointmentBody.routedTo === 'producer' && replyAfterAppointmentBody.replied === false && providerSends.length === 1);

// External provider-ID registration for CRM/quote traffic.
const externalStore = new Store();
advance(2);
const beforeExternalProviderSends = providerSends.length;
const externalRegistration = await registerExternalOutbound({
  to: '+14085550188', message: 'Checking in on the home and auto options we reviewed.', origin: 'quote_followup', workflow: 'home_auto_quote', replyRoute: 'producer', ownershipEffect: 'producer', providerMessageId: 'external-quote-1'
}, { env, store: externalStore, now });
check('external registration binds provider ID without sending an SMS', externalRegistration.providerMessageId === 'external-quote-1' && externalRegistration.origin === 'quote_followup' && providerSends.length === beforeExternalProviderSends);
const externalEcho = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'external-quote-1', direction: 'Outbound', subject: 'Checking in on the home and auto options we reviewed.', contact: '+14085550188' })), { env, store: externalStore, fetchImpl, now });
const externalEchoBody = await externalEcho.json();
const externalConversation = externalStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('registered CRM/quote outbound is source-aware and does not launch CoverageFit', externalEchoBody.registeredOutbound === true && externalEchoBody.outboundOrigin === 'quote_followup' && externalConversation?.orchestration?.ownership?.owner === 'producer' && externalConversation?.state === 'human_takeover');

// Fingerprint-only compatibility registration and one-provider binding.
const fingerprintStore = new Store();
advance(2);
const fpMessage = 'Your requested document reminder is ready.';
const fpRegistration = await registerExternalOutbound({ to: '+14085550199', message: fpMessage, origin: 'crm', workflow: 'document_reminder', replyRoute: 'producer', ownershipEffect: 'producer' }, { env, store: fingerprintStore, now });
check('external integration may pre-register a bounded fingerprint when provider ID is unavailable', !fpRegistration.providerMessageId && fingerprintStore.entries(SMS_OUTBOUND_FINGERPRINT_PREFIX).length === 1);
let unresolvedFingerprintCollision = null;
try { await registerExternalOutbound({ to: '+14085550199', message: fpMessage, origin: 'crm', workflow: 'document_reminder', replyRoute: 'producer', ownershipEffect: 'producer' }, { env, store: fingerprintStore, now }); } catch (cause) { unresolvedFingerprintCollision = cause; }
check('unresolved identical fingerprint cannot be overwritten before provider correlation', unresolvedFingerprintCollision instanceof SmsGatewayError && unresolvedFingerprintCollision.code === 'outbound_fingerprint_in_use');
const fpEcho = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'fingerprint-provider-1', direction: 'Outbound', subject: fpMessage, contact: '+14085550199' })), { env, store: fingerprintStore, fetchImpl, now });
check('short-lived fingerprint correlates the first matching provider echo', (await fpEcho.json()).matchedBy === 'fingerprint' && Boolean(await fingerprintStore.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}fingerprint-provider-1`)));
advance(1);
const secondSameBody = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'fingerprint-provider-2', direction: 'Outbound', subject: fpMessage, contact: '+14085550199' })), { env, store: fingerprintStore, fetchImpl, now });
const secondSameBodyResult = await secondSameBody.json();
check('bound fingerprint cannot misclassify a second provider message with the same body', secondSameBodyResult.manualTakeover === true && secondSameBodyResult.outboundOrigin === 'external_unknown');

// Unknown/manual RingCentral outbound still fails human-safe.
const manualStore = new Store();
advance(2);
const manual = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'manual-direct-1', direction: 'Outbound', subject: 'Hi, Dylan here.', contact: '+14085550211' })), { env, store: manualStore, fetchImpl, now });
const manualBody = await manual.json();
const manualConversation = manualStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('unregistered RingCentral outbound remains external_unknown and producer-owned', manualBody.manualTakeover === true && manualBody.outboundOrigin === 'external_unknown' && manualConversation?.orchestration?.ownership?.owner === 'producer' && manualConversation?.outboundContext?.origin === 'external_unknown');

// CoverageFit may send one bounded acknowledgement while transitioning the thread to producer ownership.
const coverageHandoffStore = new Store();
advance(2);
const sendsBeforeCoverageHandoff = providerSends.length;
const coverageHandoffResponse = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'cf-handoff-1', direction: 'Inbound', subject: 'DYLAN', contact: '+14085550210' })), { env, store: coverageHandoffStore, fetchImpl, now });
const coverageHandoffBody = await coverageHandoffResponse.json();
const coverageHandoffConversation = coverageHandoffStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('CoverageFit terminal producer-handoff acknowledgement is registered without converting workflow state to manual takeover', coverageHandoffBody.replied === true && providerSends.length === sendsBeforeCoverageHandoff + 1 && coverageHandoffConversation?.state === 'awaiting_producer' && coverageHandoffConversation?.orchestration?.ownership?.owner === 'producer' && coverageHandoffConversation?.outboundContext?.origin === 'coveragefit' && coverageHandoffConversation?.outboundContext?.replyRoute === 'producer' && coverageHandoffConversation?.outboundContext?.ownershipEffect === 'producer');

// CoverageFit automated path now uses gateway and preserves active workflow on provider echo.
const coverageStore = new Store();
const handoffStore = new Store();
advance(2);
const sendsBeforeCoverage = providerSends.length;
const cfInbound1 = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: 'cf-in-1', direction: 'Inbound', subject: "I'm buying a home and need insurance", contact: '+14085550222' })), { env, store: coverageStore, handoffStore, fetchImpl, now });
check('explicit CoverageFit inbound still receives automated response through new gateway', (await cfInbound1.json()).replied === true && providerSends.length === sendsBeforeCoverage + 1);
let coverageConversation = coverageStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
const firstCfProvider = providerSends.at(-1);
const firstCfRegistry = await coverageStore.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}${firstCfProvider.id}`);
check('CoverageFit reply is registered with CoverageFit provenance before provider echo', firstCfRegistry?.origin === 'coveragefit' && firstCfRegistry?.replyRoute === 'coveragefit' && firstCfRegistry?.ownershipEffect === 'preserve' && coverageConversation?.orchestration?.ownership?.owner === 'coveragefit');
const cfCountBeforeEcho = coverageConversation.outboundCount;
advance(1);
const cfEcho = await handleRingCentralWebhook(webhookRequest(webhookPayload({ id: firstCfProvider.id, direction: 'Outbound', subject: firstCfProvider.payload.text, contact: '+14085550222' })), { env, store: coverageStore, handoffStore, fetchImpl, now });
const cfEchoBody = await cfEcho.json();
coverageConversation = coverageStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('CoverageFit provider echo remains CoverageFit-owned and does not duplicate outbound count', cfEchoBody.registeredOutbound === true && cfEchoBody.outboundOrigin === 'coveragefit' && coverageConversation?.orchestration?.ownership?.owner === 'coveragefit' && coverageConversation?.outboundCount === cfCountBeforeEcho);

// Active CoverageFit collision rules and safe producer transfer.
let deniedCoverageFit = null;
try {
  const producerOwned = gatewayStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
  await sendSmsThroughGateway({ to: producerOwned.contactPhone, message: 'Bot should not speak here.', origin: 'coveragefit', workflow: 'coveragefit_homebuyer', replyRoute: 'coveragefit', ownershipEffect: 'preserve', idempotencyKey: 'coveragefit:blocked:001' }, { env, store: gatewayStore, fetchImpl, now });
} catch (cause) { deniedCoverageFit = cause; }
check('CoverageFit send is denied while producer owns the conversation', deniedCoverageFit instanceof SmsGatewayError && deniedCoverageFit.code === 'coveragefit_automation_not_permitted');
let collisionDenied = null;
try {
  await sendSmsThroughGateway({ to: '+14085550222', message: 'Quote reminder.', origin: 'quote_followup', workflow: 'quote', replyRoute: 'producer', ownershipEffect: 'preserve', idempotencyKey: 'quote:unsafe:001' }, { env, store: coverageStore, fetchImpl, now });
} catch (cause) { collisionDenied = cause; }
check('non-CoverageFit automation cannot leave active CoverageFit bot-owned when replies belong to producer', collisionDenied instanceof SmsGatewayError && collisionDenied.code === 'unsafe_active_workflow_collision');
const preservedWorkflowState = coverageStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1]?.orchestration?.workflow?.state;
const quoteTransfer = await sendSmsThroughGateway({ to: '+14085550222', message: 'Quote follow-up from Dylan.', origin: 'quote_followup', workflow: 'quote', replyRoute: 'producer', ownershipEffect: 'producer', idempotencyKey: 'quote:safe:001' }, { env, store: coverageStore, fetchImpl, now });
coverageConversation = coverageStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('registered quote follow-up can safely transfer active thread to producer without erasing CoverageFit step', quoteTransfer.ok && coverageConversation?.state === 'human_takeover' && coverageConversation?.orchestration?.ownership?.owner === 'producer' && coverageConversation?.orchestration?.workflow?.state === preservedWorkflowState && coverageConversation?.outboundContext?.origin === 'quote_followup');

// Current channel suppression gate exists without claiming full RC-SMS-1.9.5 consent reconciliation.
const suppressedStore = new Store();
const suppressedId = await smsLiveConversationId('+14085550233', env.RINGCENTRAL_FROM_NUMBER, env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const suppressedAt = now().toISOString();
const suppressedConversation = { id: suppressedId, contactPhone: '+14085550233', businessPhone: env.RINGCENTRAL_FROM_NUMBER, channel: 'ringcentral_sms', state: 'opted_out', intent: '', answers: {}, transcript: [], inboundCount: 1, outboundCount: 0, createdAt: suppressedAt, updatedAt: suppressedAt };
suppressedConversation.orchestration = normalizeSmsOrchestration(suppressedConversation, { occurredAt: suppressedAt });
await suppressedStore.setJSON(`${LIVE_CONVERSATION_PREFIX}${suppressedId}`, suppressedConversation);
let suppressedError = null;
try { await sendSmsThroughGateway({ to: '+14085550233', message: 'Should not send.', origin: 'crm', workflow: 'followup', replyRoute: 'producer', ownershipEffect: 'producer', idempotencyKey: 'suppressed:test:001' }, { env, store: suppressedStore, fetchImpl, now }); } catch (cause) { suppressedError = cause; }
check('current programmatic gateway refuses channel already marked opted out/suppressed', suppressedError instanceof SmsGatewayError && suppressedError.code === 'sms_channel_suppressed');
let suppressedExternalError = null;
try { await registerExternalOutbound({ to: '+14085550233', message: 'External system should not send.', origin: 'crm', workflow: 'followup', replyRoute: 'producer', ownershipEffect: 'producer' }, { env, store: suppressedStore, now }); } catch (cause) { suppressedExternalError = cause; }
check('external pre-registration also refuses a relationship already marked opted out/suppressed', suppressedExternalError instanceof SmsGatewayError && suppressedExternalError.code === 'sms_channel_suppressed');

// Producer-console resend path is also registered through gateway.
const producerStore = new Store();
const producerContact = '+14085550244';
const producerId = await smsLiveConversationId(producerContact, env.RINGCENTRAL_FROM_NUMBER, env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const producerAt = now().toISOString();
const producerConversation = {
  id: producerId, schemaVersion: '1.4', build: 'RC-SMS-1.9.3', engineBuild: 'RC-SMS-1.9.3', channel: 'ringcentral_sms', contactPhone: producerContact, businessPhone: env.RINGCENTRAL_FROM_NUMBER,
  state: 'awaiting_producer', intent: 'buyer', answers: { propertyAddress: '123 Main Street' }, transcript: [], inboundCount: 1, outboundCount: 1,
  handoff: { url: 'https://coveragefit.com/sms/continue/?token=example', createdAt: producerAt, expiresAt: producerAt }, createdAt: producerAt, updatedAt: producerAt
};
producerConversation.orchestration = normalizeSmsOrchestration(producerConversation, { occurredAt: producerAt });
await producerStore.setJSON(`${LIVE_CONVERSATION_PREFIX}${producerId}`, producerConversation);
const resendRequest = new Request('https://coveragefit.com/api/sms/producer/', { method: 'POST', headers: authHeaders, body: JSON.stringify({ conversationId: producerId, action: 'resend_handoff' }) });
const resendResponse = await handleSmsProducerHandoff(resendRequest, { env, store: producerStore, fetchImpl, now });
const resendBody = await resendResponse.json();
const producerLatest = await producerStore.get(`${LIVE_CONVERSATION_PREFIX}${producerId}`);
check('producer-console handoff resend uses registered gateway source', resendResponse.status === 200 && resendBody.ok && producerLatest?.outboundContext?.origin === 'producer_console' && producerLatest?.outboundContext?.replyRoute === 'producer' && Boolean(await producerStore.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}${producerLatest.outboundContext.providerMessageId}`)));

// Retry record preserves source descriptor and retry delivery re-enters gateway.
const retryStore = new Store();
const retryContact = '+14085550255';
const retryId = await smsLiveConversationId(retryContact, env.RINGCENTRAL_FROM_NUMBER, env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const retryAt = now().toISOString();
const retryConversation = { id: retryId, schemaVersion: '1.4', channel: 'ringcentral_sms', contactPhone: retryContact, businessPhone: env.RINGCENTRAL_FROM_NUMBER, state: 'awaiting_producer', intent: 'buyer', answers: {}, transcript: [], inboundCount: 1, outboundCount: 0, createdAt: retryAt, updatedAt: retryAt };
retryConversation.orchestration = normalizeSmsOrchestration(retryConversation, { occurredAt: retryAt });
await retryStore.setJSON(`${LIVE_CONVERSATION_PREFIX}${retryId}`, retryConversation);
await queueSmsRetry(retryStore, { conversationId: retryId, to: retryContact, body: 'Previously authorized CoverageFit continuation.', sourceMessageId: 'source-retry-1', origin: 'coveragefit', workflow: 'coveragefit_homebuyer', replyRoute: 'coveragefit', ownershipEffect: 'preserve', error: 'temporary failure' }, { now });
const retryAction = new Request('https://coveragefit.com/api/sms/operations/', { method: 'POST', headers: authHeaders, body: JSON.stringify({ action: 'retry_pending' }) });
const retryResponse = await handleSmsOperations(retryAction, { env, store: retryStore, fetchImpl, now });
const retryBody = await retryResponse.json();
const retryLatest = await retryStore.get(`${LIVE_CONVERSATION_PREFIX}${retryId}`);
check('registered retry preserves outbound source metadata through gateway', retryResponse.status === 200 && retryBody.sent === 1 && retryLatest?.outboundContext?.origin === 'coveragefit' && retryLatest?.outboundContext?.replyRoute === 'coveragefit');

// Operations surface and package/static route checks.
const opsRequest = new Request('https://coveragefit.com/api/sms/operations/', { headers: { Authorization: `Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}` } });
const opsBody = await (await handleSmsOperations(opsRequest, { env, store: coverageStore, now })).json();
const opsConversation = opsBody.conversations?.find(item => item.id === coverageConversation.id);
check('protected operations API exposes redacted last-outbound provenance', opsBody.ok && opsConversation?.outboundContext?.origin === 'quote_followup' && opsConversation?.outboundContext?.replyRoute === 'producer' && !JSON.stringify(opsConversation).includes('+14085550222'));

const routeSource = fs.readFileSync('server/cloudflare-pages-handlers.mjs', 'utf8') + fs.readFileSync('functions/api/sms/send.js', 'utf8') + fs.readFileSync('functions/api/sms/outbound/register.js', 'utf8');
check('Cloudflare Pages exposes protected send and outbound-registration routes', ['smsSend','smsOutboundRegister','handleSmsSend','handleSmsOutboundRegister'].every(term => routeSource.includes(term)));
const d1Source = fs.readFileSync('server/d1-json-store.mjs', 'utf8');
check('1.9.3 stays inside existing sms_conversations table with no new D1 table', d1Source.includes("'sms_conversations'") && !d1Source.includes('sms_outbound_registry'));
const docs = fs.readFileSync('SPRINT-RC-SMS-1.9.3.md', 'utf8') + fs.readFileSync('RC-SMS-ROADMAP.md', 'utf8') + fs.readFileSync('RC_SMS_1_9_3_CONTRACT.json', 'utf8');
check('package retains 1.9.3 contract and later shared-number roadmap', ['Multi-Source Outbound Registry + SMS Gateway','RC-SMS-1.9.4 — Cross-Workflow Ownership + Producer Continuity','RC-SMS-1.9.5','RC-SMS-1.9.6','RC-SMS-1.10'].every(term => docs.includes(term)));
const ui = fs.readFileSync('agent/sms-operations/index.html', 'utf8') + fs.readFileSync('assets/js/sms-operations.js', 'utf8');
check('operations UI remains forward-compatible and shows last outbound source/route', [['RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].some(term => ui.includes(term)), ['Last outbound:','outboundContext?.origin','outboundContext?.replyRoute'].every(term => ui.includes(term))].every(Boolean));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.9.3', version, passed: checks.length, failed: 0, checks }, null, 2));
