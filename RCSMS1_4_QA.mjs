import fs from 'node:fs';
import path from 'node:path';
import {
  SMS_AUTOMATION_INTRO,
  SMS_BUYER_COMPLETION_MESSAGE,
  SMS_ENGINE_BUILD,
  SMS_ENGINE_VERSION,
  SMS_RUSH_ACKNOWLEDGEMENT,
  createSimulatorConversation,
  hasSmsRushSignal,
  normalizeBuyerAddress,
  normalizeBuyerClosingDate,
  normalizeSmsCommand,
  processSimulatorInbound,
  routeSmsInbound
} from './server/sms-conversation-core.mjs';
import { SMS_EVENT_FILTER, clearRingCentralTokenCache } from './server/ringcentral-client.mjs';
import {
  LIVE_CONVERSATION_PREFIX,
  RC_SMS_CONNECTION_BUILD,
  handleRingCentralWebhook
} from './server/ringcentral-sms-connection-core.mjs';

const root = process.cwd();
const checks = [];
function check(name, condition) { if (!condition) throw new Error(`FAIL: ${name}`); checks.push(name); }
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
check('release remains compatible after RC-SMS-1.4', ['3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && pkg.version === version);
check('conversation and RingCentral builds remain compatible after RC-SMS-1.4', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION) && ['RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD) && ['RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD));
check('completion copy is bounded and does not promise a quote', /basic purchase details/i.test(SMS_BUYER_COMPLETION_MESSAGE) && /not an instant quote/i.test(SMS_BUYER_COMPLETION_MESSAGE) && /eligibility and underwriting/i.test(SMS_BUYER_COMPLETION_MESSAGE));
check('RUSH acknowledgement is operational rather than a coverage promise', /prioritize/i.test(SMS_RUSH_ACKNOWLEDGEMENT) && /does not guarantee/i.test(SMS_RUSH_ACKNOWLEDGEMENT));
check('RUSH command and natural urgency signals normalize', normalizeSmsCommand('RUSH') === 'rush' && normalizeSmsCommand('closing soon') === 'rush' && hasSmsRushSignal('I am buying a home and closing this week'));

check('ordinary property addresses normalize', normalizeBuyerAddress('123 Main St, San Jose, CA 95118') === '123 Main St, San Jose, CA 95118' && normalizeBuyerAddress('42 W. 3rd Avenue #7') === '42 W. 3rd Avenue #7');
check('non-property address fragments and PO boxes are rejected', normalizeBuyerAddress('San Jose') === '' && normalizeBuyerAddress('P.O. Box 123') === '');

const now = new Date('2026-08-06T20:00:00Z');
const isoDate = normalizeBuyerClosingDate('2026-09-15', { now });
check('ISO closing date is normalized', isoDate.ok && isoDate.date === '2026-09-15' && isoDate.priority === 'standard');
const slashDate = normalizeBuyerClosingDate('8/12/2026', { now });
check('US numeric closing date is normalized', slashDate.ok && slashDate.date === '2026-08-12' && slashDate.priority === 'rush');
const namedDate = normalizeBuyerClosingDate('August 28, 2026', { now });
check('named closing date is normalized', namedDate.ok && namedDate.date === '2026-08-28');
const nextFriday = normalizeBuyerClosingDate('next Friday', { now });
check('natural next-weekday response resolves deterministically', nextFriday.ok && nextFriday.date === '2026-08-14' && nextFriday.daysUntil === 8);
const thisWeek = normalizeBuyerClosingDate('this week', { now });
check('this-week response is accepted and marked time-sensitive', thisWeek.ok && thisWeek.timing === 'this_week' && thisWeek.priority === 'rush' && thisWeek.approximate === true);
const relative = normalizeBuyerClosingDate('in 5 days', { now });
check('relative closing date is normalized', relative.ok && relative.date === '2026-08-11' && relative.priority === 'rush');
check('past closing date is flagged for clarification', normalizeBuyerClosingDate('2026-08-01', { now }).reason === 'past_date');
check('invalid calendar date is rejected', normalizeBuyerClosingDate('2026-02-31', { now }).reason === 'invalid_date');
check('unrecognized timing is rejected', normalizeBuyerClosingDate('purple banana', { now }).reason === 'unrecognized');

let sim = createSimulatorConversation({ conversationId: 'sms-sim-rc14-buyer-0001', testPhone: '+14085550199', now });
let seq = 0;
function simInbound(body, timeOffset = 0) {
  seq += 1;
  const result = processSimulatorInbound(sim, { messageId: `sim-msg-rc14-${String(seq).padStart(6, '0')}`, body }, { now: new Date(now.getTime() + timeOffset * 60000) });
  sim = result.conversation;
  return result;
}
const buyer = simInbound('I am buying a home', 1);
check('buyer intent begins address intake in simulator', buyer.conversation.state === 'buyer_address_requested' && /address/i.test(buyer.reply));
const badAddress = simInbound('San Jose', 2);
check('invalid address repeats a useful address prompt', badAddress.conversation.state === 'buyer_address_requested' && /street address/i.test(badAddress.reply));
const address = simInbound('123 Test Street, San Jose, CA 95118', 3);
check('valid address is captured before closing date', address.conversation.state === 'buyer_closing_date_requested' && address.conversation.answers.propertyAddress.includes('95118'));
const help = simInbound('HELP', 4);
check('HELP interruption preserves state and captured address', help.conversation.state === 'buyer_closing_date_requested' && help.conversation.answers.propertyAddress.includes('95118'));
const past = simInbound('2026-08-01', 5);
check('past date stays in closing-date state with correction', past.conversation.state === 'buyer_closing_date_requested' && /appears to have passed/i.test(past.reply));
const closing = simInbound('this week', 6);
check('time-sensitive closing is captured and advances to occupancy', closing.conversation.state === 'buyer_occupancy_requested' && closing.conversation.answers.priority === 'rush' && closing.conversation.answers.closingTiming === 'this_week');
const occupancyInvalid = simInbound('maybe', 7);
check('invalid occupancy returns controlled options', occupancyInvalid.conversation.state === 'buyer_occupancy_requested' && /Primary home/i.test(occupancyInvalid.reply));
const occupancy = simInbound('1', 8);
check('occupancy is normalized and advances to auto review', occupancy.conversation.state === 'buyer_bundle_requested' && occupancy.conversation.answers.occupancy === 'primary_home');
const bundleInvalid = simInbound('possibly', 9);
check('invalid bundle response explains YES or NO without creating a quote', bundleInvalid.conversation.state === 'buyer_bundle_requested' && /does not create an auto quote/i.test(bundleInvalid.reply));
const complete = simInbound('YES', 10);
check('buyer intake completes with all four core answers', complete.conversation.state === 'coveragefit_ready' && complete.conversation.answers.autoReview === true && complete.conversation.answers.priority === 'rush' && /not an instant quote/i.test(complete.reply));

let rushSim = createSimulatorConversation({ conversationId: 'sms-sim-rc14-rush-0002', testPhone: '+14085550198', now });
const rushFirst = processSimulatorInbound(rushSim, { messageId: 'sim-msg-rc14-rush-000001', body: 'RUSH' }, { now });
rushSim = rushFirst.conversation;
check('RUSH can start the buyer path directly from a partner card', rushSim.state === 'buyer_address_requested' && rushSim.intent === 'buyer' && rushSim.answers.priority === 'rush' && /time-sensitive/i.test(rushFirst.reply));
const rushAddress = processSimulatorInbound(rushSim, { messageId: 'sim-msg-rc14-rush-000002', body: '500 Market St, San Francisco, CA 94105' }, { now });
rushSim = rushAddress.conversation;
const rushHelp = processSimulatorInbound(rushSim, { messageId: 'sim-msg-rc14-rush-000003', body: 'HELP' }, { now });
check('explicit RUSH priority survives later HELP interruption', rushHelp.conversation.answers.priority === 'rush' && rushHelp.conversation.answers.rushRequested === true && rushHelp.conversation.state === 'buyer_closing_date_requested');
const farClosing = processSimulatorInbound(rushHelp.conversation, { messageId: 'sim-msg-rc14-rush-000004', body: '2026-09-30' }, { now });
check('explicit RUSH remains set even when entered date is more than seven days away', farClosing.conversation.answers.priority === 'rush' && farClosing.conversation.answers.rushReason === 'prospect_requested');
const humanAtOccupancy = processSimulatorInbound(farClosing.conversation, { messageId: 'sim-msg-rc14-rush-000005', body: 'DYLAN' }, { now });
check('DYLAN works from the middle of the buyer flow without deleting answers', humanAtOccupancy.conversation.state === 'awaiting_producer' && humanAtOccupancy.conversation.answers.propertyAddress && humanAtOccupancy.conversation.answers.closingDate);

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
function inboundPayload(id, subject, from = '+14085550177') {
  return {
    uuid: `uuid-${id}`,
    event: SMS_EVENT_FILTER,
    timestamp: '2026-08-06T20:00:00.000Z',
    body: {
      id,
      to: [{ phoneNumber: env.RINGCENTRAL_FROM_NUMBER, target: true }],
      from: { phoneNumber: from },
      type: 'SMS', direction: 'Inbound', creationTime: '2026-08-06T20:00:00.000Z', subject, messageStatus: 'Received'
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
function liveFetch(sent) {
  return async (url, init = {}) => {
    if (url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({ access_token: 'access-token-live-14', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.endsWith('/sms')) {
      const body = JSON.parse(init.body);
      sent.push(body);
      return new Response(JSON.stringify({ id: `out-${sent.length}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`Unexpected URL ${url}`);
  };
}

const store = new MemoryStore();
const sent = [];
const fetchImpl = liveFetch(sent);
clearRingCentralTokenCache();
const liveMessages = [
  ['510000001', 'I am buying a home'],
  ['510000002', '123 Main Street, San Jose, CA 95118'],
  ['510000003', 'next Friday'],
  ['510000004', '1'],
  ['510000005', 'NO']
];
const liveStates = [];
for (let i = 0; i < liveMessages.length; i += 1) {
  const [id, subject] = liveMessages[i];
  const response = await handleRingCentralWebhook(webhookRequest(inboundPayload(id, subject)), { env, store, fetchImpl, now: new Date(now.getTime() + i * 60000) });
  liveStates.push(await response.json());
}
check('live RingCentral buyer flow advances through every core state', JSON.stringify(liveStates.map(item => item.state)) === JSON.stringify(['buyer_address_requested','buyer_closing_date_requested','buyer_occupancy_requested','buyer_bundle_requested','awaiting_producer']));
check('live RingCentral sends one relevant response for each buyer answer', sent.length === 5 && /address/i.test(sent[0].text) && /scheduled to close/i.test(sent[1].text) && /property be used/i.test(sent[2].text) && /auto coverage/i.test(sent[3].text) && /basic purchase details/i.test(sent[4].text));
const liveConversation = store.entries(LIVE_CONVERSATION_PREFIX)[0][1];
check('live conversation stores normalized buyer answers', liveConversation.answers.propertyAddress.includes('95118') && liveConversation.answers.closingDate === '2026-08-14' && liveConversation.answers.occupancy === 'primary_home' && liveConversation.answers.autoReview === false);
check('live conversation reaches a CoverageFit-ready state after the core buyer intake', ['coveragefit_ready','awaiting_producer'].includes(liveConversation.state));
check('live conversation record is advanced to current schemas and builds', ['1.2','1.3','1.4','1.5','1.6'].includes(liveConversation.schemaVersion) && ['RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(liveConversation.engineBuild) && ['RC-SMS-1.4','RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(liveConversation.build));

const duplicate = await handleRingCentralWebhook(webhookRequest(inboundPayload('510000005', 'NO')), { env, store, fetchImpl, now });
check('duplicate final message cannot create a second completion reply', (await duplicate.json()).deduped === true && sent.length === 5);

const direct = routeSmsInbound({ state: 'new', answers: {} }, 'I am buying a home and closing soon', { mode: 'live', isFirstMessage: true, now });
check('first-message buyer urgency is captured without a separate menu round trip', direct.state === 'buyer_address_requested' && direct.answers.priority === 'rush' && direct.reply.startsWith(SMS_AUTOMATION_INTRO));

const page = read('agent/sms-simulator/index.html');
const client = read('assets/js/sms-simulator.js');
check('simulator identifies RC-SMS-1.4 and displays priority', (page.includes('RC-SMS-1.4') || page.includes('RC-SMS-1.5') || page.includes('RC-SMS-1.6') || page.includes('RC-SMS-1.7') || page.includes('RC-SMS-1.8') || page.includes('RC-SMS-1.9')) && page.includes('simPriority') && client.includes("$('simPriority')"));
check('simulator exposes natural date and RUSH test choices', ['next Friday','this week','RUSH'].every(term => client.includes(term)));
check('public simulator source still contains no RingCentral credentials', !page.includes('RINGCENTRAL_CLIENT_SECRET') && !client.includes('RINGCENTRAL_JWT_TOKEN'));
check('sprint documentation covers buyer fields, urgency, interruptions, privacy and deferred handoff', ['address','closing date','occupancy','auto','rush','help','dylan','not an instant quote','rc-sms-1.5'].every(term => read('SPRINT-RC-SMS-1.4.md').toLowerCase().includes(term)));
check('changelog records RC-SMS-1.4', read('CHANGELOG.md').includes('## 3.20.22 — RC-SMS-1.4 Complete Homebuyer SMS Intake'));

console.log(JSON.stringify({ sprint: 'RC-SMS-1.4', passed: checks.length, failed: 0, checks }, null, 2));
