import fs from 'node:fs';
import {
  SMS_AUTOMATION_MODES,
  SMS_CONVERSATION_OWNERS,
  SMS_ORCHESTRATOR_BUILD,
  normalizeSmsOrchestration,
  resolveSmsInboundRoute,
  takeProducerOwnership
} from './server/sms-orchestrator-core.mjs';
import {
  handleRingCentralWebhook,
  LIVE_CONVERSATION_PREFIX,
  RC_SMS_CONNECTION_BUILD
} from './server/ringcentral-sms-connection-core.mjs';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import { handleSmsProducerHandoff, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';
import { handleSmsOperations, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION } from './server/sms-conversation-core.mjs';
import { SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { SMS_PRODUCER_ALERT_BUILD } from './server/sms-producer-alert.mjs';

const checks = [];
const check = (name, condition) => { if (!condition) throw new Error(`FAIL: ${name}`); checks.push(name); };

class Store {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(String(key)) || null; }
  async setJSON(key, value, options = {}) {
    key = String(key);
    if (options.onlyIfNew && this.values.has(key)) throw new Error('UNIQUE');
    this.values.set(key, JSON.parse(JSON.stringify(value)));
  }
  async delete(key) { this.values.delete(String(key)); }
  async list({ prefix = '', limit = 500 } = {}) {
    return { blobs: [...this.values.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(key => ({ key })) };
  }
  entries(prefix = '') { return [...this.values.entries()].filter(([key]) => key.startsWith(prefix)); }
}

const version = fs.readFileSync('VERSION', 'utf8').trim();
check('release remains forward compatible after 3.20.67', ['3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && JSON.parse(fs.readFileSync('package.json', 'utf8')).version === version);
check('all RC-SMS runtime surfaces identify 1.9.2', SMS_ENGINE_VERSION === '1.7.2' && [SMS_ENGINE_BUILD, SMS_HANDOFF_BUILD, RC_SMS_CONNECTION_BUILD, SMS_PRODUCER_HANDOFF_BUILD, SMS_OPERATIONS_BUILD, SMS_PRODUCER_ALERT_BUILD, SMS_ORCHESTRATOR_BUILD].every(value => ['RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(value)));
check('orchestrator publishes bounded owner and automation contracts', SMS_CONVERSATION_OWNERS.includes('coveragefit') && SMS_CONVERSATION_OWNERS.includes('producer') && SMS_AUTOMATION_MODES.includes('automated') && SMS_AUTOMATION_MODES.includes('human_only'));

const legacyActive = {
  id: 'sms-live-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  state: 'buyer_closing_date_requested', intent: 'buyer', answers: { propertyAddress: '123 Main Street' },
  createdAt: '2026-08-16T20:00:00.000Z', updatedAt: '2026-08-16T20:01:00.000Z'
};
const normalizedLegacy = normalizeSmsOrchestration(legacyActive);
check('legacy active records migrate in place without a D1 migration', normalizedLegacy.ownership.owner === 'coveragefit' && normalizedLegacy.automationMode === 'automated' && normalizedLegacy.workflow.type === 'coveragefit_homebuyer' && normalizedLegacy.workflow.state === 'buyer_closing_date_requested');
const takeover = takeProducerOwnership(legacyActive, { occurredAt: '2026-08-16T20:02:00.000Z' });
check('producer takeover preserves the underlying CoverageFit workflow step', takeover.ownership.owner === 'producer' && takeover.automationMode === 'human_only' && takeover.workflow.state === 'buyer_closing_date_requested' && takeover.workflow.status === 'paused');
check('fresh explicit insurance intent enters CoverageFit', resolveSmsInboundRoute({ state: 'new' }, "I'm buying a home and need insurance", {}).route === 'coveragefit');
check('fresh ambiguous shared-number inbound defaults to producer', resolveSmsInboundRoute({ state: 'new' }, 'Hi Dylan', {}).route === 'producer');
check('active producer ownership blocks CoverageFit consumption', resolveSmsInboundRoute({ ...legacyActive, orchestration: takeover }, 'September 1', {}).route === 'producer');

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
const now = new Date('2026-08-16T21:00:00.000Z');
const inboundPayload = (id, subject, contact = '+14085550177') => ({
  uuid: `uuid-${id}`, event: SMS_EVENT_FILTER, timestamp: now.toISOString(),
  body: { id, to: [{ phoneNumber: env.RINGCENTRAL_FROM_NUMBER, target: true }], from: { phoneNumber: contact }, type: 'SMS', direction: 'Inbound', creationTime: now.toISOString(), subject }
});
const outboundPayload = (id, subject, contact = '+14085550177') => ({
  uuid: `uuid-${id}`, event: SMS_EVENT_FILTER, timestamp: now.toISOString(),
  body: { id, to: [{ phoneNumber: contact, target: true }], from: { phoneNumber: env.RINGCENTRAL_FROM_NUMBER }, type: 'SMS', direction: 'Outbound', creationTime: now.toISOString(), subject }
});
const request = payload => new Request(env.RINGCENTRAL_WEBHOOK_URL, {
  method: 'POST', headers: { 'Validation-Token': env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
});
const sent = [];
const fetchImpl = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return Response.json({ access_token: 'token-192', expires_in: 3600 });
  if (url.endsWith('/sms')) { const body = JSON.parse(init.body); sent.push(body); return Response.json({ id: `auto-${sent.length}` }); }
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};

const store = new Store();
const handoffStore = new Store();
clearRingCentralTokenCache();
for (const [id, message] of [
  ['920000001', "I'm buying a home and need insurance"],
  ['920000002', '123 Main Street, San Jose, CA 95118']
]) {
  const response = await handleRingCentralWebhook(request(inboundPayload(id, message)), { env, store, handoffStore, fetchImpl, now });
  check(`explicit CoverageFit step ${id} succeeds`, response.status === 200);
}
let live = store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('explicit intake is owned by CoverageFit before takeover', live?.state === 'buyer_closing_date_requested' && live?.orchestration?.ownership?.owner === 'coveragefit' && live?.orchestration?.automationMode === 'automated');
const sendsBeforeTakeover = sent.length;

const manualResponse = await handleRingCentralWebhook(request(outboundPayload('manual-192-1', 'Hi, this is Dylan. I have your info.')), { env, store, handoffStore, fetchImpl, now });
const manualBody = await manualResponse.json();
live = store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('unregistered outbound safely transfers ownership to producer', manualBody.manualTakeover === true && live?.state === 'human_takeover' && live?.orchestration?.ownership?.owner === 'producer' && live?.orchestration?.automationMode === 'human_only');
check('manual takeover does not erase the pending closing-date step', live?.orchestration?.workflow?.state === 'buyer_closing_date_requested');

const producerReply = await handleRingCentralWebhook(request(inboundPayload('920000003', 'September 1')), { env, store, handoffStore, fetchImpl, now });
const producerReplyBody = await producerReply.json();
live = store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('customer reply during producer ownership stays human-only', producerReplyBody.replied === false && producerReplyBody.routedTo === 'producer' && sent.length === sendsBeforeTakeover && live?.orchestration?.workflow?.state === 'buyer_closing_date_requested');

const authHeaders = { Authorization: `Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`, Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' };
const resumeRequest = new Request('https://coveragefit.com/api/sms/producer', { method: 'POST', headers: authHeaders, body: JSON.stringify({ conversationId: live.id, action: 'resume' }) });
const resumeResponse = await handleSmsProducerHandoff(resumeRequest, { env, store, fetchImpl, now });
const resumed = (await resumeResponse.json()).conversation;
check('producer resume releases the preserved workflow back to CoverageFit', resumeResponse.status === 200 && resumed.state === 'buyer_closing_date_requested' && resumed.orchestration?.ownership?.owner === 'coveragefit' && resumed.orchestration?.automationMode === 'automated');

const resumedReply = await handleRingCentralWebhook(request(inboundPayload('920000004', '9/1/2026')), { env, store, handoffStore, fetchImpl, now });
const resumedReplyBody = await resumedReply.json();
live = store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('resumed customer reply continues the preserved CoverageFit state', resumedReplyBody.replied === true && resumedReplyBody.routedTo === 'coveragefit' && live?.state === 'buyer_occupancy_requested' && live?.orchestration?.workflow?.state === 'buyer_occupancy_requested');

const ambiguousStore = new Store();
const ambiguousContact = '+14085550188';
const sentBeforeAmbiguous = sent.length;
const ambiguousResponse = await handleRingCentralWebhook(request(inboundPayload('920000010', 'Hi Dylan', ambiguousContact)), { env, store: ambiguousStore, handoffStore, fetchImpl, now });
const ambiguousBody = await ambiguousResponse.json();
const ambiguousConversation = ambiguousStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('fresh ambiguous live inbound does not launch chatbot menu', ambiguousBody.routedTo === 'producer' && ambiguousBody.replied === false && sent.length === sentBeforeAmbiguous && ambiguousConversation?.orchestration?.ownership?.owner === 'producer');

const operationsRequest = new Request('https://coveragefit.com/api/sms/operations/', { headers: { Authorization: `Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}` } });
const operationsBody = await (await handleSmsOperations(operationsRequest, { env, store, now })).json();
const opsConversation = operationsBody.conversations?.find(item => item.id === live.id);
check('protected operations API exposes redacted orchestration state', operationsBody.ok && opsConversation?.orchestration?.owner === 'coveragefit' && opsConversation?.orchestration?.workflowState === 'buyer_occupancy_requested' && !JSON.stringify(opsConversation).includes('+14085550177'));

const docs = fs.readFileSync('SPRINT-RC-SMS-1.9.2.md', 'utf8') + fs.readFileSync('RC-SMS-ROADMAP.md', 'utf8');
check('package embeds shared-number contract and proceeding roadmap', ['Shared Number Conversation Orchestrator', 'RC-SMS-1.9.3', 'RC-SMS-1.9.4', 'RC-SMS-1.9.5', 'RC-SMS-1.9.6', 'RC-SMS-1.10'].every(term => docs.includes(term)));
const ui = fs.readFileSync('agent/sms-operations/index.html', 'utf8') + fs.readFileSync('assets/js/sms-operations.js', 'utf8');
check('operations UI surfaces owner workflow and automation mode', [['RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].some(term => ui.includes(term)), ['Owner:', 'Workflow:', 'Automation:'].every(term => ui.includes(term))].every(Boolean));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.9.2', version, passed: checks.length, failed: 0, checks }, null, 2));
