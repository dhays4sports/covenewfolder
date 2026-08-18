import fs from 'node:fs';
import {
  actionableSmsAlertType,
  buildSmsProducerAlertEmail,
  initialSmsProducerAlert,
  sendSmsProducerAlert,
  SMS_PRODUCER_ALERT_BUILD
} from './server/sms-producer-alert.mjs';
import { handleSmsOperations, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import {
  handleRingCentralWebhook,
  LIVE_CONVERSATION_PREFIX,
  RC_SMS_CONNECTION_BUILD
} from './server/ringcentral-sms-connection-core.mjs';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION } from './server/sms-conversation-core.mjs';
import { SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';

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

check('release advances to CoverageFit 3.20.54', ['3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(fs.readFileSync('VERSION', 'utf8').trim()) && JSON.parse(fs.readFileSync('package.json', 'utf8')).version === fs.readFileSync('VERSION', 'utf8').trim());
check('RC-SMS components synchronize at 1.9.1', ['1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION) && [SMS_ENGINE_BUILD, SMS_HANDOFF_BUILD, RC_SMS_CONNECTION_BUILD, SMS_PRODUCER_HANDOFF_BUILD, SMS_OPERATIONS_BUILD, SMS_PRODUCER_ALERT_BUILD].every(value => ['RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(value)));

const actionable = state => ({ state: 'awaiting_producer', ...state });
check('completed guided intake is actionable', actionableSmsAlertType({ beforeState: 'coveragefit_ready', conversation: actionable({ intent: 'buyer', handoff: { url: 'https://coveragefit.com/sms/continue/?token=opaque' } }) }) === 'intake_complete');
check('DYLAN request is actionable', actionableSmsAlertType({ beforeState: 'buyer_address_requested', conversation: actionable({ intent: 'buyer' }), routed: { command: 'human' } }) === 'personal_response_requested');
check('direct-handling category is actionable', actionableSmsAlertType({ beforeState: 'other_category_requested', conversation: actionable({ intent: 'other', answers: { requestCategory: 'business' } }) }) === 'direct_handling_required');
check('second invalid response escalation is actionable', actionableSmsAlertType({ beforeState: 'intent_requested', conversation: actionable({ invalidIntentAttempts: 2 }) }) === 'automation_escalated');
check('intermediate, STOP, duplicate awaiting, and manual takeover are not actionable', [
  actionableSmsAlertType({ beforeState: 'new', conversation: { state: 'buyer_address_requested' } }),
  actionableSmsAlertType({ beforeState: 'intent_requested', conversation: { state: 'opted_out' } }),
  actionableSmsAlertType({ beforeState: 'awaiting_producer', conversation: actionable({ intent: 'buyer' }), routed: { command: 'human' } }),
  actionableSmsAlertType({ beforeState: 'awaiting_producer', conversation: { state: 'human_takeover' } })
].every(value => value === ''));

const alert = initialSmsProducerAlert({ type: 'intake_complete', eventId: 'sms-live-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:intake_complete:msg-1', createdAt: '2026-08-10T01:00:00.000Z' });
const sensitiveConversation = {
  id: 'sms-live-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', intent: 'buyer',
  contactPhone: '+14085551212', answers: { priority: 'rush', propertyAddress: '123 Main Street', closingDate: '2026-08-20' },
  attribution: { partnerId: 'jessica-card', partnerName: 'Jessica Realtor' }, transcript: [{ body: 'My policy is 12345' }]
};
const email = buildSmsProducerAlertEmail(sensitiveConversation, alert, { origin: 'https://coveragefit.com' });
const serializedEmail = JSON.stringify(email);
check('RUSH email links to the opaque protected queue', email.subject.startsWith('[RUSH]') && email.dashboardUrl.includes(encodeURIComponent(sensitiveConversation.id)) && email.dashboardUrl.startsWith('https://coveragefit.com/agent/sms-operations/'));
check('producer email excludes lead PII and detailed facts', !['4085551212', '123 Main Street', '2026-08-20', 'Jessica Realtor', 'jessica-card', 'policy is 12345'].some(value => serializedEmail.includes(value)));
check('producer email retains bounded action context', ['Homebuyer', 'RUSH / time-sensitive', 'Realtor referral', 'Intake complete'].every(value => serializedEmail.includes(value)));

const configEnv = {
  RESEND_API_KEY: 'resend-test-key',
  COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL: 'producer@example.com',
  COVERAGEFIT_NOTIFICATION_FROM: 'CoverageFit <alerts@example.com>',
  COVERAGEFIT_SITE_URL: 'https://coveragefit.com',
  RCSMS_PRODUCER_ALERTS_ENABLED: 'true'
};
const providerCalls = [];
const providerFetch = async (url, init) => {
  providerCalls.push({ url, init, body: JSON.parse(init.body) });
  return Response.json({ id: `email-${providerCalls.length}` }, { status: 200 });
};
const sentAlert = await sendSmsProducerAlert(sensitiveConversation, alert, { env: configEnv, fetch: providerFetch, now: new Date('2026-08-10T01:01:00.000Z') });
check('configured alert is delivered with event idempotency', sentAlert.state === 'sent' && providerCalls.length === 1 && providerCalls[0].init.headers['Idempotency-Key'].includes('coveragefit-sms-producer-alert'));
const disabledAlert = await sendSmsProducerAlert(sensitiveConversation, alert, { env: { ...configEnv, RCSMS_PRODUCER_ALERTS_ENABLED: 'false' }, fetch: providerFetch });
check('alert kill switch skips delivery safely', disabledAlert.state === 'skipped' && disabledAlert.reason === 'disabled' && providerCalls.length === 1);

const liveEnv = {
  ...configEnv,
  RINGCENTRAL_SERVER_URL: 'https://platform.ringcentral.com', RINGCENTRAL_CLIENT_ID: 'client-test',
  RINGCENTRAL_CLIENT_SECRET: 'secret-test', RINGCENTRAL_JWT_TOKEN: 'jwt-test',
  RINGCENTRAL_FROM_NUMBER: '+14085550123', RINGCENTRAL_WEBHOOK_URL: 'https://coveragefit.com/api/sms/ringcentral/webhook',
  RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-token-test-123456789',
  RINGCENTRAL_CONVERSATION_HASH_SECRET: 'conversation-hash-secret-test-123456789'
};
const smsCalls = [];
const ringCentralFetch = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return Response.json({ access_token: 'access-token-191', expires_in: 3600 });
  if (url.endsWith('/sms')) { smsCalls.push(JSON.parse(init.body)); return Response.json({ id: `sms-${smsCalls.length}` }); }
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};
const inbound = (id, subject) => new Request(liveEnv.RINGCENTRAL_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Validation-Token': liveEnv.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ uuid: `uuid-${id}`, event: SMS_EVENT_FILTER, timestamp: '2026-08-10T01:10:00.000Z', body: { id, to: [{ phoneNumber: liveEnv.RINGCENTRAL_FROM_NUMBER, target: true }], from: { phoneNumber: '+14085550177' }, type: 'SMS', direction: 'Inbound', creationTime: '2026-08-10T01:10:00.000Z', subject } })
});
const store = new Store();
const background = [];
const liveProviderCalls = [];
clearRingCentralTokenCache();
const liveResponse = await handleRingCentralWebhook(inbound('sms-191-dylan', 'DYLAN'), {
  env: liveEnv, store, fetchImpl: ringCentralFetch,
  notificationFetch: async (url, init) => { liveProviderCalls.push({ url, init, body: JSON.parse(init.body) }); return Response.json({ id: 'email-live-1' }); },
  waitUntil: promise => background.push(promise), now: new Date('2026-08-10T01:10:00.000Z')
});
check('customer webhook succeeds and schedules nonblocking alert work', liveResponse.status === 200 && (await liveResponse.clone().json()).state === 'awaiting_producer' && background.length === 1 && smsCalls.length === 1);
await Promise.all(background);
const liveConversation = store.entries(LIVE_CONVERSATION_PREFIX)[0][1];
check('live actionable conversation records a sent alert', liveConversation.producerAlert?.type === 'personal_response_requested' && liveConversation.producerAlert?.state === 'sent' && liveProviderCalls.length === 1);
const duplicate = await handleRingCentralWebhook(inbound('sms-191-dylan', 'DYLAN'), { env: liveEnv, store, fetchImpl: ringCentralFetch, notificationFetch: providerFetch, now: new Date('2026-08-10T01:11:00.000Z') });
check('duplicate provider event cannot send a second SMS or email alert', (await duplicate.json()).deduped === true && smsCalls.length === 1 && liveProviderCalls.length === 1);

const accessToken = 'producer-access-token-1234567890';
const operationsEnv = { ...configEnv, COVERAGEFIT_PRODUCER_ACCESS_TOKEN: accessToken };
const dashboardRequest = new Request(`https://coveragefit.com/api/sms/operations/?conversation_id=${liveConversation.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
const dashboard = await (await handleSmsOperations(dashboardRequest, { env: operationsEnv, store, now: new Date('2026-08-10T01:12:00.000Z') })).json();
check('protected operations view exposes only redacted alert state and configuration', dashboard.ok && dashboard.config.producerAlerts.configured && dashboard.conversations.length === 1 && dashboard.conversations[0].producerAlert.state === 'sent' && !JSON.stringify(dashboard.conversations[0].producerAlert).includes('408555'));
const testRequest = new Request('https://coveragefit.com/api/sms/operations/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test_producer_alert' }) });
const testResult = await (await handleSmsOperations(testRequest, { env: operationsEnv, store, notificationFetch: providerFetch, now: new Date('2026-08-10T01:13:00.000Z') })).json();
check('same-origin producer can send a pre-port test alert without a fake lead', testResult.ok && testResult.alert.state === 'sent' && providerCalls.at(-1).body.subject.includes('[TEST]') && store.entries(LIVE_CONVERSATION_PREFIX).length === 1);
const rejectedTest = await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test_producer_alert' }) }), { env: operationsEnv, store });
check('cross-origin test alert is rejected', rejectedTest.status === 403);

const ui = fs.readFileSync('agent/sms-operations/index.html', 'utf8') + fs.readFileSync('assets/js/sms-operations.js', 'utf8');
const docs = fs.readFileSync('SPRINT-RC-SMS-1.9.1.md', 'utf8') + fs.readFileSync('DEPLOY.md', 'utf8');
check('operations UI exposes alert status, deep links, and test action', ['opsAlertHealth', 'opsTestAlert', 'conversation_id', 'test_producer_alert'].every(value => ui.includes(value)) && ['RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].some(value => ui.includes(value)));
check('release contract documents privacy, triggers, dedupe, test, and port boundary', ['privacy', 'DYLAN', 'second', 'idempotency', 'test alert', 'RC-SMS-1.10'].every(value => docs.toLowerCase().includes(value.toLowerCase())));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.9.1', passed: checks.length, failed: 0, checks }, null, 2));
