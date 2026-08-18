import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_INVALID_INTENT_ATTEMPTS,
  SMS_AUTOMATION_INTRO,
  SMS_ENGINE_BUILD,
  SMS_ENGINE_VERSION,
  SMS_HELP_MESSAGE,
  SMS_INTENT_MENU,
  createSimulatorConversation,
  normalizeSmsCommand,
  normalizeSmsIntent,
  processSimulatorInbound,
  routeSmsInbound
} from './server/sms-conversation-core.mjs';
import { SMS_EVENT_FILTER, clearRingCentralTokenCache } from './server/ringcentral-client.mjs';
import {
  RC_SMS_CONNECTION_BUILD,
  LIVE_CONVERSATION_PREFIX,
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

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
check('release remains compatible after RC-SMS-1.3', ['3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && pkg.version === version);
check('conversation engine and live connection remain synchronized after later SMS sprints', ['1.1.0','1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION) && ['RC-SMS-1.3','RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD) && ['RC-SMS-1.3','RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD));
check('main menu identifies automation, agency, choices, STOP, HELP and DYLAN', [SMS_AUTOMATION_INTRO, '1. Buying a home', '2. Reviewing current home coverage', '3. Home and auto together', '4. Something else', 'STOP', 'HELP', 'DYLAN'].every(term => SMS_INTENT_MENU.includes(term)));
check('help explains automation and personal follow-up path', /automated intake/i.test(SMS_HELP_MESSAGE) && /Dylan/i.test(SMS_HELP_MESSAGE) && /STOP/i.test(SMS_HELP_MESSAGE));
check('invalid intent escalates on the second attempt', MAX_INVALID_INTENT_ATTEMPTS === 2);

check('numeric intent aliases normalize', normalizeSmsIntent('1') === 'buyer' && normalizeSmsIntent('2') === 'home_review' && normalizeSmsIntent('3') === 'bundle' && normalizeSmsIntent('4') === 'other');
check('natural buyer language normalizes', ['I am buying a home', 'My realtor sent me', 'We are in escrow', 'Closing on a new home'].every(value => normalizeSmsIntent(value) === 'buyer'));
check('natural home-review and bundle language normalize', normalizeSmsIntent('I want to review my current home coverage') === 'home_review' && normalizeSmsIntent('Can you bundle home and auto?') === 'bundle');
check('messaging commands normalize case-insensitively', normalizeSmsCommand('stop') === 'stop' && normalizeSmsCommand('HELP') === 'help' && normalizeSmsCommand('start') === 'start' && normalizeSmsCommand('restart') === 'restart' && normalizeSmsCommand('Dylan') === 'human' && normalizeSmsCommand('agent') === 'human');

let sim = createSimulatorConversation({ conversationId: 'sms-sim-rc13-menu-0001', testPhone: '+14085550199', now: new Date('2026-08-06T20:00:00Z') });
function simInbound(id, body, at) {
  const result = processSimulatorInbound(sim, { messageId: id, body }, { now: new Date(at) });
  sim = result.conversation;
  return result;
}
const firstMenu = simInbound('sim-msg-rc13-000001', 'Hello', '2026-08-06T20:01:00Z');
check('first greeting displays the main menu without counting an invalid reply', firstMenu.reply === SMS_INTENT_MENU && sim.state === 'intent_requested' && sim.invalidIntentAttempts === 0);
const firstInvalid = simInbound('sim-msg-rc13-000002', 'purple banana', '2026-08-06T20:02:00Z');
check('first invalid response gives one useful retry', sim.state === 'intent_requested' && sim.invalidIntentAttempts === 1 && /1, 2, 3, or 4/i.test(firstInvalid.reply));
const secondInvalid = simInbound('sim-msg-rc13-000003', 'still not sure', '2026-08-06T20:03:00Z');
check('second invalid response exits the loop and queues Dylan', sim.state === 'awaiting_producer' && sim.invalidIntentAttempts === 2 && /queued.*Dylan/i.test(secondInvalid.reply));
const restarted = simInbound('sim-msg-rc13-000004', 'RESTART', '2026-08-06T20:04:00Z');
check('RESTART clears intent and invalid attempts', restarted.conversation.state === 'intent_requested' && restarted.conversation.intent === '' && restarted.conversation.invalidIntentAttempts === 0 && restarted.reply === SMS_INTENT_MENU);
const human = simInbound('sim-msg-rc13-000005', 'AGENT', '2026-08-06T20:05:00Z');
check('AGENT immediately requests personal handling', human.conversation.state === 'awaiting_producer' && /paused.*Dylan/i.test(human.reply));
const stop = simInbound('sim-msg-rc13-000006', 'STOP', '2026-08-06T20:06:00Z');
check('STOP enters opted-out state', stop.conversation.state === 'opted_out');
const quiet = simInbound('sim-msg-rc13-000007', '1', '2026-08-06T20:07:00Z');
check('normal messages remain silent while opted out', quiet.conversation.state === 'opted_out' && quiet.reply === '');
const start = simInbound('sim-msg-rc13-000008', 'START', '2026-08-06T20:08:00Z');
check('START restores the menu after opt-out', start.conversation.state === 'intent_requested' && start.reply === SMS_INTENT_MENU && start.conversation.lastCommand === 'start');
const help = simInbound('sim-msg-rc13-000009', 'HELP', '2026-08-06T20:09:00Z');
check('HELP preserves the current routing state and explains the service', help.conversation.state === 'intent_requested' && help.reply === SMS_HELP_MESSAGE);
const naturalBuyer = simInbound('sim-msg-rc13-000010', 'My realtor referred me and I am buying a home', '2026-08-06T20:10:00Z');
check('simulator natural buyer language begins the existing buyer test path', naturalBuyer.conversation.state === 'buyer_address_requested' && naturalBuyer.conversation.intent === 'buyer' && /address/i.test(naturalBuyer.reply));

const directLive = routeSmsInbound({ state: 'new', invalidIntentAttempts: 0 }, 'I am buying a home', { mode: 'live', isFirstMessage: true });
check('first live buyer message is classified without forcing a menu reply', directLive.state === 'buyer_address_requested' && directLive.intent === 'buyer' && directLive.reply.startsWith(SMS_AUTOMATION_INTRO));
const firstHuman = routeSmsInbound({ state: 'new', invalidIntentAttempts: 0 }, 'DYLAN', { mode: 'live', isFirstMessage: true });
check('first direct human request still discloses the automated intake', firstHuman.state === 'awaiting_producer' && firstHuman.reply.startsWith(SMS_AUTOMATION_INTRO));

const env = {
  RINGCENTRAL_SERVER_URL: 'https://platform.ringcentral.com',
  RINGCENTRAL_CLIENT_ID: 'client-id-test',
  RINGCENTRAL_CLIENT_SECRET: 'client-secret-test',
  RINGCENTRAL_JWT_TOKEN: 'jwt-test-credential',
  RINGCENTRAL_FROM_NUMBER: '+14085550123',
  RINGCENTRAL_WEBHOOK_URL: 'https://coveragefit.com/api/sms/ringcentral/webhook',
  RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-token-test-123456789',
  RINGCENTRAL_CONVERSATION_HASH_SECRET: 'conversation-hash-secret-test-123456789'
};
function inboundPayload({ id, from = '+14085550199', subject }) {
  return {
    uuid: `uuid-${id}`,
    event: SMS_EVENT_FILTER,
    timestamp: '2026-08-06T21:00:00.000Z',
    body: {
      id,
      to: [{ phoneNumber: env.RINGCENTRAL_FROM_NUMBER, target: true }],
      from: { phoneNumber: from },
      type: 'SMS',
      direction: 'Inbound',
      creationTime: '2026-08-06T21:00:00.000Z',
      subject,
      messageStatus: 'Received'
    }
  };
}
function webhookRequest(payload) {
  return new Request(env.RINGCENTRAL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Validation-Token': env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
function makeLiveFetch(sent) {
  return async (url, init = {}) => {
    if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-live-13', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.endsWith('/sms')) {
      const body = JSON.parse(init.body);
      sent.push(body);
      return new Response(JSON.stringify({ id: `out-${sent.length}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`Unexpected URL ${url}`);
  };
}

const liveStore = new MemoryStore();
const sent = [];
const fetchImpl = makeLiveFetch(sent);
clearRingCentralTokenCache();
const greetingStore = new MemoryStore();
const helloResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '410000001', from: '+14085550198', subject: 'Hello' })), { env, store: greetingStore, fetchImpl });
const helloBody = await helloResponse.json();
check('live ambiguous greeting is producer-safe on the shared number', helloBody.routedTo === 'producer' && helloBody.replied === false && sent.length === 0);
const selectionResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '410000002', subject: '1' })), { env, store: liveStore, fetchImpl });
const selectionBody = await selectionResponse.json();
check('live numeric buyer selection is persisted and begins the buyer intake', selectionBody.state === 'buyer_address_requested' && selectionBody.intent === 'buyer' && sent.length === 1 && /address/i.test(sent[0].text));
const liveConversation = liveStore.entries(LIVE_CONVERSATION_PREFIX)[0][1];
check('live conversation stores structured intent and command controls', liveConversation.intent === 'buyer' && liveConversation.invalidIntentAttempts === 0 && liveConversation.outboundCount === 1 && liveConversation.orchestration?.ownership?.owner === 'coveragefit' && ['RC-SMS-1.3','RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(liveConversation.engineBuild));
const buyerAddress = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '410000003', subject: '123 Test Street, San Jose, CA 95118' })), { env, store: liveStore, fetchImpl });
check('later sprint continues the buyer path instead of repeating the menu', (await buyerAddress.json()).state === 'buyer_closing_date_requested' && sent.length === 2 && /scheduled to close/i.test(sent[1].text));

const invalidStore = new MemoryStore();
const invalidSent = [];
const invalidFetch = makeLiveFetch(invalidSent);
clearRingCentralTokenCache();
await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '420000001', from: '+14085550188', subject: 'RESTART' })), { env, store: invalidStore, fetchImpl: invalidFetch });
const invalidOne = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '420000002', from: '+14085550188', subject: 'not one of those' })), { env, store: invalidStore, fetchImpl: invalidFetch });
check('live first invalid response sends one retry', (await invalidOne.json()).state === 'intent_requested' && /did not recognize/i.test(invalidSent[1].text));
const invalidTwo = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '420000003', from: '+14085550188', subject: 'still confused' })), { env, store: invalidStore, fetchImpl: invalidFetch });
check('live second invalid response queues Dylan and stops looping', (await invalidTwo.json()).state === 'awaiting_producer' && /queued.*Dylan/i.test(invalidSent[2].text));

const commandStore = new MemoryStore();
const commandSent = [];
const commandFetch = makeLiveFetch(commandSent);
clearRingCentralTokenCache();
const stopResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '430000001', from: '+14085550177', subject: 'STOP' })), { env, store: commandStore, fetchImpl: commandFetch });
check('live STOP creates no application response', (await stopResponse.json()).state === 'opted_out' && commandSent.length === 0);
const silentAfterStop = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '430000002', from: '+14085550177', subject: 'Hello again' })), { env, store: commandStore, fetchImpl: commandFetch });
check('live opted-out conversation remains silent', (await silentAfterStop.json()).replied === false && commandSent.length === 0);
const startResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '430000003', from: '+14085550177', subject: 'START' })), { env, store: commandStore, fetchImpl: commandFetch });
check('live START restores channel permission without blind workflow restart after 1.9.5', (await startResponse.json()).routedTo === 'consent' && commandSent.length === 0);
const helpResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '430000004', from: '+14085550177', subject: 'HELP' })), { env, store: commandStore, fetchImpl: commandFetch });
check('live HELP returns the bounded help message', (await helpResponse.json()).command === 'help' && commandSent[0].text === SMS_HELP_MESSAGE);
const agentResponse = await handleRingCentralWebhook(webhookRequest(inboundPayload({ id: '430000005', from: '+14085550177', subject: 'AGENT' })), { env, store: commandStore, fetchImpl: commandFetch });
check('live AGENT requests personal handling', (await agentResponse.json()).state === 'awaiting_producer' && /paused.*Dylan/i.test(commandSent[1].text));

const page = read('agent/sms-simulator/index.html');
const client = read('assets/js/sms-simulator.js');
check('simulator preserves RC-SMS-1.3 commands after later SMS sprints', (page.includes('RC-SMS-1.3') || page.includes('RC-SMS-1.4') || page.includes('RC-SMS-1.5') || page.includes('RC-SMS-1.6') || page.includes('RC-SMS-1.7') || page.includes('RC-SMS-1.8') || page.includes('RC-SMS-1.9')) && ['HELP','DYLAN','START'].every(term => client.includes(`'${term}'`)));
check('simulator shows invalid-attempt and last-command context', page.includes('simInvalidAttempts') && page.includes('simLastCommand') && client.includes("$('simInvalidAttempts')") && client.includes("$('simLastCommand')"));
check('public browser code still contains no RingCentral credentials', !page.includes('RINGCENTRAL_CLIENT_SECRET') && !client.includes('RINGCENTRAL_JWT_TOKEN'));
check('sprint documentation records intents, commands, invalid escalation and live routing', ['buyer','home review','bundle','stop','help','start','restart','dylan','invalid','ringcentral'].every(term => read('SPRINT-RC-SMS-1.3.md').toLowerCase().includes(term)));
check('changelog records RC-SMS-1.3', read('CHANGELOG.md').includes('## 3.20.21 — RC-SMS-1.3 Intent Router and Messaging Controls'));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.3', passed: checks.length, failed: 0, checks }, null, 2));
