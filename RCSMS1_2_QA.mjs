import fs from 'node:fs';
import path from 'node:path';
import {
  SMS_EVENT_FILTER,
  clearRingCentralTokenCache,
  createOrRenewRingCentralSmsWebhook,
  getRingCentralAccessToken,
  ringCentralConfig,
  sendRingCentralSms
} from './server/ringcentral-client.mjs';
import {
  RC_SMS_CONNECTION_BUILD,
  RC_SMS_WELCOME_MESSAGE,
  handleRingCentralStatus,
  handleRingCentralSubscription,
  handleRingCentralWebhook
} from './server/ringcentral-sms-connection-core.mjs';

const root = process.cwd();
const checks = [];
function check(name, condition) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  checks.push(name);
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

class MemoryStore {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(String(key)) || null; }
  async setJSON(key, value, options = {}) {
    key = String(key);
    if (options.onlyIfNew && this.values.has(key)) throw new Error('UNIQUE constraint failed');
    this.values.set(key, JSON.parse(JSON.stringify(value)));
  }
  async delete(key) { this.values.delete(String(key)); }
  entries(prefix = '') { return [...this.values.entries()].filter(([key]) => key.startsWith(prefix)); }
}

const producerToken = 'producer-access-token-1234567890';
const env = {
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN: producerToken,
  RINGCENTRAL_SERVER_URL: 'https://platform.ringcentral.com',
  RINGCENTRAL_CLIENT_ID: 'client-id-test',
  RINGCENTRAL_CLIENT_SECRET: 'client-secret-test',
  RINGCENTRAL_JWT_TOKEN: 'jwt-test-credential',
  RINGCENTRAL_FROM_NUMBER: '+14085550123',
  RINGCENTRAL_WEBHOOK_URL: 'https://coveragefit.com/api/sms/ringcentral/webhook',
  RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-token-test-123456789',
  RINGCENTRAL_CONVERSATION_HASH_SECRET: 'conversation-hash-secret-test-123456789',
  RINGCENTRAL_SUBSCRIPTION_EXPIRES_IN: '3600'
};

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
check('release remains compatible after RC-SMS-1.2', ['3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && pkg.version === version);
check('live connection remains versioned after later SMS sprints', ['RC-SMS-1.2','RC-SMS-1.3','RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD));
check('welcome clearly identifies the automated intake and agency', /automated intake/i.test(RC_SMS_WELCOME_MESSAGE) && /Virginia Tam Insurance Agency/i.test(RC_SMS_WELCOME_MESSAGE) && /STOP/i.test(RC_SMS_WELCOME_MESSAGE) && /HELP/i.test(RC_SMS_WELCOME_MESSAGE));
check('RingCentral event filter is the instant inbound SMS filter', SMS_EVENT_FILTER === '/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS');
check('configuration normalizes the sender and secure webhook', ringCentralConfig(env).fromNumber === '+14085550123' && ringCentralConfig(env).webhookUrl.startsWith('https://coveragefit.com/'));

let authCalls = 0;
const authFetch = async (url, init = {}) => {
  authCalls += 1;
  check('JWT token exchange uses the RingCentral OAuth endpoint', url === 'https://platform.ringcentral.com/restapi/oauth/token');
  check('JWT token exchange uses form encoding and basic app auth', init.method === 'POST' && /application\/x-www-form-urlencoded/i.test(init.headers['Content-Type']) && /^Basic /.test(init.headers.Authorization));
  check('JWT token exchange sends the JWT bearer grant', String(init.body).includes('urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer') && String(init.body).includes('jwt-test-credential'));
  return new Response(JSON.stringify({ access_token: 'access-token-test', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
clearRingCentralTokenCache();
const firstToken = await getRingCentralAccessToken(env, { fetchImpl: authFetch, now: new Date('2026-08-06T20:00:00Z') });
const secondToken = await getRingCentralAccessToken(env, { fetchImpl: authFetch, now: new Date('2026-08-06T20:01:00Z') });
check('JWT obtains and reuses a bounded access token', firstToken === 'access-token-test' && secondToken === firstToken && authCalls === 1);

let sentPayload = null;
clearRingCentralTokenCache();
const sendFetch = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-send', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/restapi/v1.0/account/~/extension/~/sms')) {
    sentPayload = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'rc-outbound-1', messageStatus: 'Queued' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  throw new Error(`Unexpected URL ${url}`);
};
await sendRingCentralSms({ to: '+14085550199', textBody: 'Test message' }, env, { fetchImpl: sendFetch });
check('outbound SMS uses the configured extension endpoint and sender', sentPayload?.from?.phoneNumber === '+14085550123' && sentPayload?.to?.[0]?.phoneNumber === '+14085550199' && sentPayload?.text === 'Test message');

const challenge = await handleRingCentralWebhook(new Request(env.RINGCENTRAL_WEBHOOK_URL, {
  method: 'POST', headers: { 'Validation-Token': 'ringcentral-challenge-token' }
}), { env, store: new MemoryStore() });
check('webhook validation echoes the RingCentral challenge with a small 200 response', challenge.status === 200 && challenge.headers.get('validation-token') === 'ringcentral-challenge-token' && (await challenge.text()) === '');

const invalidToken = await handleRingCentralWebhook(new Request(env.RINGCENTRAL_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Validation-Token': 'wrong-token', 'Content-Type': 'application/json' },
  body: JSON.stringify({ body: {} })
}), { env, store: new MemoryStore() });
check('live event rejects an invalid webhook validation token', invalidToken.status === 401);

function inboundPayload({ id = '300000001', from = '+14085550199', to = '+14085550123', subject = 'Hello', direction = 'Inbound', type = 'SMS' } = {}) {
  return {
    uuid: `uuid-${id}`,
    event: SMS_EVENT_FILTER,
    timestamp: '2026-08-06T20:05:00.000Z',
    subscriptionId: 'subscription-test',
    body: {
      id,
      to: [{ phoneNumber: to, target: true }],
      from: { phoneNumber: from },
      type,
      direction,
      creationTime: '2026-08-06T20:05:00.000Z',
      subject,
      messageStatus: 'Received'
    }
  };
}
function webhookRequest(payload, token = env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN) {
  return new Request(env.RINGCENTRAL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Validation-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

const liveStore = new MemoryStore();
let smsSendCount = 0;
const sentMessages = [];
const liveFetch = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-live', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/sms')) {
    smsSendCount += 1;
    const body = JSON.parse(init.body);
    check('live welcome is sent only to the inbound prospect', body.to?.[0]?.phoneNumber === '+14085550199' && body.from?.phoneNumber === '+14085550123');
    sentMessages.push(body.text);
    if (smsSendCount === 1) check('first explicit live intake response is bounded to the buyer prompt', /address/i.test(body.text));
    return new Response(JSON.stringify({ id: `outbound-${smsSendCount}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  throw new Error(`Unexpected live URL ${url}`);
};
clearRingCentralTokenCache();
const ambiguousStore = new MemoryStore();
const ambiguousLive = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '300000000', from: '+14085550198', subject: 'Hello' })), { env, store: ambiguousStore, fetchImpl: liveFetch, now: new Date('2026-08-06T20:05:00Z') });
const ambiguousLiveBody = await ambiguousLive.json();
check('fresh ambiguous shared-number inbound is producer-safe and silent', ambiguousLive.status === 200 && ambiguousLiveBody.replied === false && ambiguousLiveBody.routedTo === 'producer' && smsSendCount === 0);

const firstLive = await handleRingCentralWebhook(webhookRequest(inboundPayload({ subject: '1' })), { env, store: liveStore, fetchImpl: liveFetch, now: new Date('2026-08-06T20:05:01Z') });
const firstLiveBody = await firstLive.json();
check('first explicit live CoverageFit inbound produces one automated prompt', firstLive.status === 200 && firstLiveBody.replied === true && firstLiveBody.state === 'buyer_address_requested' && smsSendCount === 1);
const liveConversations = liveStore.entries('sms-live-conversations/');
check('live conversation is stored under an opaque hashed identifier', liveConversations.length === 1 && /^sms-live-conversations\/sms-live-[a-f0-9]{40}$/.test(liveConversations[0][0]));
check('live conversation records explicit CoverageFit ownership and buyer state', liveConversations[0][1].state === 'buyer_address_requested' && liveConversations[0][1].welcomeSentAt && liveConversations[0][1].transcript.length === 2 && liveConversations[0][1].orchestration?.ownership?.owner === 'coveragefit');

const duplicateLive = await handleRingCentralWebhook(webhookRequest(inboundPayload({ subject: '1' })), { env, store: liveStore, fetchImpl: liveFetch });
check('duplicate RingCentral message ID is suppressed without a second text', (await duplicateLive.json()).deduped === true && smsSendCount === 1);
const secondLive = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '300000002', subject: '123 Test Street, San Jose, CA 95118' })), { env, store: liveStore, fetchImpl: liveFetch, now: new Date('2026-08-06T20:06:00Z') });
check('a second unique inbound continues the explicit buyer workflow', (await secondLive.json()).replied === true && smsSendCount === 2 && /scheduled to close/i.test(sentMessages[1]));

const stopStore = new MemoryStore();
const stopResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '300000003', from: '+14085550188', subject: 'STOP' })), { env, store: stopStore, fetchImpl: liveFetch });
check('STOP is recorded without an application reply', (await stopResponse.json()).replied === false && smsSendCount === 2 && stopStore.entries('sms-live-conversations/')[0][1].state === 'opted_out');
const wrongTarget = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '300000004', to: '+14085550999' })), { env, store: liveStore, fetchImpl: liveFetch });
check('messages for a different destination are safely ignored', (await wrongTarget.json()).ignored === true && smsSendCount === 2);
const outboundEvent = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '300000005', direction: 'Outbound' })), { env, store: liveStore, fetchImpl: liveFetch });
check('outbound RingCentral events are safely ignored', (await outboundEvent.json()).ignored === true && smsSendCount === 2);

function producerRequest(url, method = 'GET', origin = 'https://coveragefit.com', token = producerToken) {
  return new Request(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {})
    },
    ...(method === 'POST' ? { body: '{}' } : {})
  });
}
const unauthorizedStatus = await handleRingCentralStatus(producerRequest('https://coveragefit.com/api/sms/ringcentral/status', 'GET', '', ''), { env });
check('connection status requires producer authorization', unauthorizedStatus.status === 401);

const statusCalls = [];
clearRingCentralTokenCache();
const statusFetch = async (url, init = {}) => {
  statusCalls.push({ url, method: init.method || 'GET', body: init.body });
  if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-status', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/phone-number')) return new Response(JSON.stringify({ records: [{ phoneNumber: '+14085550123', features: ['Voice', 'SmsSender'] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/restapi/v1.0/subscription') && (init.method || 'GET') === 'GET') return new Response(JSON.stringify({ records: [{ id: 'sub-active', status: 'Active', expirationTime: '2026-08-06T22:00:00Z', expiresIn: 3600, eventFilters: [SMS_EVENT_FILTER], deliveryMode: { transportType: 'WebHook', address: env.RINGCENTRAL_WEBHOOK_URL } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  throw new Error(`Unexpected status URL ${url}`);
};
const statusResponse = await handleRingCentralStatus(producerRequest('https://coveragefit.com/api/sms/ringcentral/status'), { env, fetchImpl: statusFetch });
const statusBody = await statusResponse.json();
check('protected health check verifies sender capability and active webhook', statusResponse.status === 200 && statusBody.status.connected === true && statusBody.status.phoneNumber.smsSender === true && statusBody.status.subscription.id === 'sub-active');
check('health response masks the sender and excludes credentials', statusBody.status.fromNumber.endsWith('0123') && !JSON.stringify(statusBody).includes(env.RINGCENTRAL_CLIENT_SECRET) && !JSON.stringify(statusBody).includes(env.RINGCENTRAL_JWT_TOKEN));

clearRingCentralTokenCache();
let subscriptionRequestBody = null;
const createSubscriptionFetch = async (url, init = {}) => {
  if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-sub', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/phone-number')) return new Response(JSON.stringify({ records: [{ phoneNumber: '+14085550123', features: ['SmsSender'] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/restapi/v1.0/subscription') && (init.method || 'GET') === 'GET') return new Response(JSON.stringify({ records: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.endsWith('/restapi/v1.0/subscription') && init.method === 'POST') {
    subscriptionRequestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: 'sub-created', status: 'Active', expiresIn: 3600, expirationTime: '2026-08-06T22:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  throw new Error(`Unexpected subscription URL ${url}`);
};
const createdSubscription = await handleRingCentralSubscription(producerRequest('https://coveragefit.com/api/sms/ringcentral/subscription', 'POST'), { env, fetchImpl: createSubscriptionFetch });
const createdSubscriptionBody = await createdSubscription.json();
check('protected setup action creates the SMS webhook subscription', createdSubscription.status === 201 && createdSubscriptionBody.created === true && createdSubscriptionBody.subscription.id === 'sub-created');
check('subscription request includes the secure URL, validation token, and instant SMS filter', subscriptionRequestBody.deliveryMode.address === env.RINGCENTRAL_WEBHOOK_URL && subscriptionRequestBody.deliveryMode.validationToken === env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN && subscriptionRequestBody.eventFilters.includes(SMS_EVENT_FILTER));
const wrongOriginSubscription = await handleRingCentralSubscription(producerRequest('https://coveragefit.com/api/sms/ringcentral/subscription', 'POST', 'https://example.com'), { env, fetchImpl: createSubscriptionFetch });
check('subscription mutation is restricted to the CoverageFit origin', wrongOriginSubscription.status === 403);

check('all three RingCentral Pages Function routes exist', ['functions/api/sms/ringcentral/webhook.js','functions/api/sms/ringcentral/status.js','functions/api/sms/ringcentral/subscription.js'].every(rel => fs.existsSync(path.join(root, rel))));
const simulatorHtml = read('agent/sms-simulator/index.html');
const simulatorJs = read('assets/js/sms-simulator.js');
check('protected simulator exposes connection health and subscription controls', ['rcConnectionState','rcCheckConnection','rcCreateSubscription'].every(id => simulatorHtml.includes(id)) && simulatorJs.includes('/api/sms/ringcentral/status') && simulatorJs.includes('/api/sms/ringcentral/subscription'));
check('public browser source contains no RingCentral secrets', !simulatorHtml.includes(env.RINGCENTRAL_CLIENT_SECRET) && !simulatorJs.includes(env.RINGCENTRAL_CLIENT_SECRET) && !simulatorJs.includes(env.RINGCENTRAL_JWT_TOKEN));
check('deployment documentation lists server-only RingCentral variables', ['RINGCENTRAL_CLIENT_ID','RINGCENTRAL_CLIENT_SECRET','RINGCENTRAL_JWT_TOKEN','RINGCENTRAL_FROM_NUMBER','RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN','RINGCENTRAL_CONVERSATION_HASH_SECRET'].every(term => read('CLOUDFLARE-SETUP.md').includes(term)));
check('sprint documentation records the bounded one-reply live connection', ['jwt','webhook','temporary','one automated welcome','duplicate','environment variable','live test'].every(term => read('SPRINT-RC-SMS-1.2.md').toLowerCase().includes(term)));
check('changelog records RC-SMS-1.2', read('CHANGELOG.md').includes('## 3.20.20 — RC-SMS-1.2 RingCentral Live Connection'));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.2', passed: checks.length, failed: 0, checks }, null, 2));
