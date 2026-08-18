import fs from 'node:fs';
import path from 'node:path';
import {
  SMS_ENGINE_VERSION,
  SMS_ENGINE_BUILD,
  SMS_STATES,
  createSimulatorConversation,
  processSimulatorInbound,
  applySimulatorAction,
  handleSmsSimulator
} from './server/sms-conversation-core.mjs';

const root = process.cwd();
const checks = [];
function check(name, condition) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  checks.push(name);
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

class MemoryStore {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) || null; }
  async setJSON(key, value) { this.values.set(key, JSON.parse(JSON.stringify(value))); }
}

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
check('release advances to RC-SMS-1.1', ['3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && pkg.version === version);
check('conversation engine remains versioned after later SMS sprints', ['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION) && ['RC-SMS-1.1','RC-SMS-1.2','RC-SMS-1.3','RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD));
check('all mapped conversation states are published', ['new','intent_requested','buyer_address_requested','buyer_closing_date_requested','buyer_occupancy_requested','buyer_bundle_requested','coveragefit_ready','awaiting_producer','human_takeover','completed','opted_out'].every(state => SMS_STATES.includes(state)));

let conversation = createSimulatorConversation({ conversationId: 'sms-sim-qa-buyer-0001', testPhone: '+14085550199', now: new Date('2026-08-06T19:00:00Z') });
check('new simulator conversation uses an opaque ID and reserved test number', conversation.state === 'new' && conversation.id === 'sms-sim-qa-buyer-0001' && conversation.testPhone === '+14085550199');

function inbound(id, body, at) {
  const result = processSimulatorInbound(conversation, { messageId: id, body }, { now: new Date(at) });
  conversation = result.conversation;
  return result;
}

check('first inbound message opens the deterministic intent menu', inbound('sim-msg-qa-000001', 'Hello', '2026-08-06T19:01:00Z').conversation.state === 'intent_requested');
check('buyer selection moves to property address', inbound('sim-msg-qa-000002', 'buyer', '2026-08-06T19:02:00Z').conversation.state === 'buyer_address_requested');
const invalidAddress = inbound('sim-msg-qa-000003', 'somewhere', '2026-08-06T19:03:00Z');
check('invalid address remains in the same valid state', invalidAddress.conversation.state === 'buyer_address_requested' && /street number/i.test(invalidAddress.reply));
check('valid fictional address advances to closing date', inbound('sim-msg-qa-000004', '123 Test Street, San Jose, CA 95118', '2026-08-06T19:04:00Z').conversation.state === 'buyer_closing_date_requested');
check('closing date advances to occupancy', inbound('sim-msg-qa-000005', '2026-09-15', '2026-08-06T19:05:00Z').conversation.state === 'buyer_occupancy_requested');
check('controlled occupancy advances to bundle interest', inbound('sim-msg-qa-000006', '1', '2026-08-06T19:06:00Z').conversation.state === 'buyer_bundle_requested');
const finished = inbound('sim-msg-qa-000007', 'YES', '2026-08-06T19:07:00Z');
check('buyer simulation reaches CoverageFit-ready state', finished.conversation.state === 'coveragefit_ready' && finished.conversation.answers.autoReview === true);
check('captured answers remain structured', finished.conversation.answers.propertyAddress.includes('123 Test Street') && finished.conversation.answers.closingDate === '2026-09-15' && finished.conversation.answers.occupancy === 'primary_home');
check('transcript includes paired inbound and automated messages', finished.conversation.transcript.length >= 14 && finished.conversation.transcript.some(item => item.direction === 'outbound'));

const beforeDuplicate = JSON.stringify(conversation);
const duplicate = processSimulatorInbound(conversation, { messageId: 'sim-msg-qa-000007', body: 'YES' }, { now: new Date('2026-08-06T19:07:05Z') });
check('duplicate message IDs are ignored without mutating state', duplicate.deduped === true && JSON.stringify(duplicate.conversation) === beforeDuplicate);

conversation = processSimulatorInbound(conversation, { messageId: 'sim-msg-qa-000008', body: 'RESTART' }, { now: new Date('2026-08-06T19:08:00Z') }).conversation;
check('inbound RESTART clears collected answers and returns to the menu', conversation.state === 'intent_requested' && Object.keys(conversation.answers).length === 0 && conversation.intent === '');
conversation = processSimulatorInbound(conversation, { messageId: 'sim-msg-qa-000009', body: 'STOP' }, { now: new Date('2026-08-06T19:09:00Z') }).conversation;
check('STOP moves the simulation into opted-out state', conversation.state === 'opted_out');
conversation = processSimulatorInbound(conversation, { messageId: 'sim-msg-qa-000010', body: 'anything', }, { now: new Date('2026-08-06T19:10:00Z') }).conversation;
check('opted-out state remains stable until START', conversation.state === 'opted_out');

let operator = applySimulatorAction(conversation, 'restart', { now: new Date('2026-08-06T19:11:00Z') }).conversation;
check('operator restart creates a clean persisted simulation', operator.state === 'intent_requested' && operator.transcript.length === 1 && Object.keys(operator.answers).length === 0);
operator = applySimulatorAction(operator, 'awaiting_producer', { now: new Date('2026-08-06T19:12:00Z') }).conversation;
check('operator can queue the simulation for Dylan', operator.state === 'awaiting_producer');
operator = applySimulatorAction(operator, 'human_takeover', { now: new Date('2026-08-06T19:13:00Z') }).conversation;
check('operator can simulate human takeover', operator.state === 'human_takeover');
operator = applySimulatorAction(operator, 'complete', { now: new Date('2026-08-06T19:14:00Z') }).conversation;
check('operator can complete the simulation', operator.state === 'completed' && operator.completedAt === '2026-08-06T19:14:00.000Z');

const token = 'producer-access-token-1234567890';
const store = new MemoryStore();
function request(method, body, query = '', auth = token, origin = 'https://coveragefit.com') {
  return new Request(`https://coveragefit.com/api/sms/simulator${query}`, {
    method,
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(origin ? { Origin: origin } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
const unauthorized = await handleSmsSimulator(request('GET', null, '?conversation_id=sms-sim-api-test-0001', ''), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('simulator API requires producer authorization', unauthorized.status === 401);
const wrongOrigin = await handleSmsSimulator(request('POST', { conversationId: 'sms-sim-api-test-0001', action: 'restart' }, '', token, 'https://example.com'), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('simulator mutation requires same-origin access', wrongOrigin.status === 403);
const createdResponse = await handleSmsSimulator(request('POST', { conversationId: 'sms-sim-api-test-0001', testPhone: '+14085550199', action: 'restart' }), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token }, now: new Date('2026-08-06T20:00:00Z') });
const createdBody = await createdResponse.json();
check('authorized API creates and persists a simulation', createdResponse.status === 201 && createdBody.ok && createdBody.conversation.state === 'intent_requested');
const loadedResponse = await handleSmsSimulator(request('GET', null, '?conversation_id=sms-sim-api-test-0001'), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
const loadedBody = await loadedResponse.json();
check('refresh-safe API loads the persisted conversation', loadedResponse.status === 200 && loadedBody.conversation.id === 'sms-sim-api-test-0001');
const messagePayload = { conversationId: 'sms-sim-api-test-0001', messageId: 'sim-msg-api-000001', body: 'buyer' };
const firstApiMessage = await handleSmsSimulator(request('POST', messagePayload), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token }, now: new Date('2026-08-06T20:01:00Z') });
const firstApiBody = await firstApiMessage.json();
check('API processes an inbound simulator message', firstApiMessage.status === 201 && firstApiBody.conversation.state === 'buyer_address_requested');
const duplicateApiMessage = await handleSmsSimulator(request('POST', messagePayload), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token }, now: new Date('2026-08-06T20:01:05Z') });
const duplicateApiBody = await duplicateApiMessage.json();
check('API deduplicates replayed webhook-style message IDs', duplicateApiMessage.status === 200 && duplicateApiBody.deduped === true);

const page = read('agent/sms-simulator/index.html');
const client = read('assets/js/sms-simulator.js');
const handlers = read('server/cloudflare-pages-handlers.mjs');
const d1 = read('server/d1-json-store.mjs');
const migration = read('migrations/0004_rc_sms_1_1_conversations.sql');
check('protected internal simulator page exists', page.includes('Protected internal tool') && page.includes('Producer access key') && page.includes('No live SMS is sent'));
check('simulator stores token and opaque conversation ID only in session storage', client.includes("coveragefit.producerInbox.token") && client.includes('coveragefit.smsSimulator.conversationId') && !client.includes('URLSearchParams'));
check('simulator page exposes complete buyer-state testing controls', ['Restart simulation','Queue for Dylan','Pause for human takeover','Mark complete'].every(term => page.includes(term)));
check('Cloudflare route and D1 store are wired', fs.existsSync(path.join(root, 'functions/api/sms/simulator.js')) && handlers.includes('smsSimulator') && d1.includes('createSmsConversationStore'));
check('migration creates the SMS conversation table', migration.includes('CREATE TABLE IF NOT EXISTS sms_conversations'));
check('public URLs contain no phone, address, or producer token fields', !/phone=|address=|token=/i.test(page + client));
check('RC-SMS-1.1 documentation records bounded behavior', ['conversation engine','simulator','duplicate','session storage','no live sms','ringcentral'].every(term => read('SPRINT-RC-SMS-1.1.md').toLowerCase().includes(term)));
check('changelog records RC-SMS-1.1', read('CHANGELOG.md').includes('## 3.20.19 — RC-SMS-1.1 Conversation Engine and Simulator'));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.1', passed: checks.length, failed: 0, checks }, null, 2));
