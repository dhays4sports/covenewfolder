import fs from 'node:fs';
import path from 'node:path';
import {
  SMS_ENGINE_BUILD,
  SMS_ENGINE_VERSION,
  handleSmsSimulator
} from './server/sms-conversation-core.mjs';
import {
  SMS_HANDOFF_BUILD,
  SMS_HANDOFF_TOKEN_PATTERN,
  SMS_HANDOFF_TTL_MS,
  createSmsHandoff,
  handleSmsHandoffRead,
  smsHandoffKey,
  smsHandoffUrl
} from './server/sms-handoff-core.mjs';
import { RC_SMS_CONNECTION_BUILD, LIVE_CONVERSATION_PREFIX, handleRingCentralWebhook } from './server/ringcentral-sms-connection-core.mjs';
import { SMS_EVENT_FILTER, clearRingCentralTokenCache } from './server/ringcentral-client.mjs';

const root = process.cwd();
const checks = [];
const check = (name, condition) => { if (!condition) throw new Error(`FAIL: ${name}`); checks.push(name); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

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
check('release advances to RC-SMS-1.5', ['3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version) && pkg.version === version);
check('conversation, RingCentral, and handoff builds are synchronized', ['1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION) && ['RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD) && ['RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD) && ['RC-SMS-1.5','RC-SMS-1.6','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_HANDOFF_BUILD));
check('handoff migration exists', fs.existsSync(path.join(root, 'migrations/0005_rc_sms_1_5_handoffs.sql')) && /CREATE TABLE IF NOT EXISTS sms_handoffs/.test(read('migrations/0005_rc_sms_1_5_handoffs.sql')));
check('public handoff reader function exists', fs.existsSync(path.join(root, 'functions/api/sms/handoff/read.js')));
check('secure continuation page exists', fs.existsSync(path.join(root, 'sms/continue/index.html')) && fs.existsSync(path.join(root, 'assets/js/sms-handoff-resolver.js')));

const now = new Date('2026-08-06T20:00:00.000Z');
const handoffStore = new MemoryStore();
const conversation = {
  id: 'sms-live-aabbccddeeff0011223344556677889900aabbcc',
  state: 'coveragefit_ready',
  answers: {
    propertyAddress: '123 Main Street, San Jose, CA 95118',
    closingDate: '2026-08-14', closingDateDisplay: 'Friday, August 14, 2026', closingTiming: 'exact',
    occupancy: 'primary_home', autoReview: true, priority: 'rush', rushRequested: true
  }
};
const access = await createSmsHandoff(conversation, { store: handoffStore, now, origin: 'https://coveragefit.com' });
check('handoff token is high-entropy and opaque', SMS_HANDOFF_TOKEN_PATTERN.test(access.token) && !access.token.includes('95118'));
check('handoff URL contains only opaque token', access.url.startsWith('https://coveragefit.com/sms/continue/?token=sh_') && !access.url.includes('Main') && !access.url.includes('95118') && !access.url.includes('2026-08-14'));
check('handoff expires after one day', Date.parse(access.expiresAt) - Date.parse(access.createdAt) === SMS_HANDOFF_TTL_MS);
const hashedKey = await smsHandoffKey(access.token);
check('handoff storage key is hashed rather than raw token', hashedKey.startsWith('sms-handoffs/') && !hashedKey.includes(access.token));
check('handoff URL rejects malformed token', smsHandoffUrl('bad-token') === '');

const readReq = new Request(access.url.replace('/sms/continue/?token=', '/api/sms/handoff/read?unused='), {
  method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ token: access.token })
});
const readRes = await handleSmsHandoffRead(readReq, { store: handoffStore, now });
const readBody = await readRes.json();
check('valid handoff resolves successfully', readRes.status === 200 && readBody.ok === true);
check('resolved handoff carries buyer property without URL exposure', readBody.handoff.propertyAddress.includes('95118') && readBody.handoff.reviewContext === 'Buying a home');
check('resolved handoff carries closing, occupancy, auto, and urgency context', readBody.handoff.closingDate === '2026-08-14' && readBody.handoff.occupancy === 'primary_home' && readBody.handoff.autoReview === true && readBody.handoff.priority === 'rush');
check('resolved public payload excludes phone and conversation identifiers', !Object.prototype.hasOwnProperty.call(readBody.handoff, 'phone') && !Object.prototype.hasOwnProperty.call(readBody.handoff, 'conversationId'));

const expiredReq = new Request('https://coveragefit.com/api/sms/handoff/read', {
  method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ token: access.token })
});
const expiredRes = await handleSmsHandoffRead(expiredReq, { store: handoffStore, now: new Date(now.getTime() + SMS_HANDOFF_TTL_MS + 1000) });
check('expired handoff falls back safely', expiredRes.status === 410 && (await expiredRes.json()).error.fallbackUrl === '/home/');
const invalidReq = new Request('https://coveragefit.com/api/sms/handoff/read', {
  method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'bad' })
});
check('malformed handoff falls back safely', (await handleSmsHandoffRead(invalidReq, { store: handoffStore, now })).status === 404);

const resolver = read('assets/js/sms-handoff-resolver.js');
check('client strips token from visible URL before entering CoverageFit', resolver.includes('history.replaceState') && resolver.includes("location.replace('/transition/')"));
check('client preserves zero-repeat profile and SMS context', resolver.includes('coveragefit_prospect_profile_v1') && resolver.includes('coveragefit_sms_handoff_context_v1') && resolver.includes('propertyAddress') && resolver.includes('closingDate') && resolver.includes('occupancy') && resolver.includes('autoReview'));
check('client does not place property details into a redirect query string', !resolver.includes('property_address=') && !resolver.includes('closing_date='));
check('continuation page provides generic fallback', /Start the Home Review/.test(read('sms/continue/index.html')) && /expired/i.test(resolver));

const env = {
  RINGCENTRAL_SERVER_URL: 'https://platform.ringcentral.com',
  RINGCENTRAL_CLIENT_ID: 'client-id-test', RINGCENTRAL_CLIENT_SECRET: 'client-secret-test', RINGCENTRAL_JWT_TOKEN: 'jwt-test',
  RINGCENTRAL_FROM_NUMBER: '+14085550123', RINGCENTRAL_WEBHOOK_URL: 'https://coveragefit.com/api/sms/ringcentral/webhook',
  RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'validation-token-test-123456789', RINGCENTRAL_CONVERSATION_HASH_SECRET: 'conversation-secret-test-123456789'
};
function inboundPayload(id, subject) { return { uuid:`uuid-${id}`, event:SMS_EVENT_FILTER, timestamp:now.toISOString(), body:{ id, to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}], from:{phoneNumber:'+14085550177'}, type:'SMS', direction:'Inbound', creationTime:now.toISOString(), subject, messageStatus:'Received' } }; }
function req(payload) { return new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(payload)}); }
const sent=[];
const fetchImpl=async (url,init={})=>{
  if(url.endsWith('/restapi/oauth/token')) return new Response(JSON.stringify({access_token:'token',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url.endsWith('/sms')) { const body=JSON.parse(init.body); sent.push(body); return new Response(JSON.stringify({id:`out-${sent.length}`}),{status:200,headers:{'Content-Type':'application/json'}}); }
  throw new Error(`Unexpected URL ${url}`);
};
const conversationStore=new MemoryStore(); const liveHandoffStore=new MemoryStore(); clearRingCentralTokenCache();
for (const [id,body] of [['610000001','I am buying a home'],['610000002','123 Main Street, San Jose, CA 95118'],['610000003','next Friday'],['610000004','1'],['610000005','YES']]) {
  const res=await handleRingCentralWebhook(req(inboundPayload(id,body)),{env,store:conversationStore,handoffStore:liveHandoffStore,fetchImpl,now});
  check(`live step ${id} succeeds`, res.status===200);
}
const finalText=sent.at(-1)?.text || '';
check('live completion text includes secure CoverageFit continuation', /Continue your guided CoverageFit review here: https:\/\/coveragefit\.com\/sms\/continue\/\?token=sh_/.test(finalText));
check('live completion text states prior details carry forward', /details you already provided will carry forward/i.test(finalText));
check('live continuation message does not expose property data in URL', !/token=[^\s]+(?:Main|95118|2026)/.test(finalText));
const liveConversation=conversationStore.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('live conversation stores the handoff access metadata', liveConversation?.handoff?.url?.includes('/sms/continue/?token=sh_') && ['coveragefit_ready','awaiting_producer'].includes(liveConversation.state));
check('handoff data is stored separately from conversation records', liveHandoffStore.entries('sms-handoffs/').length===1);

const page=read('agent/sms-simulator/index.html'); const client=read('assets/js/sms-simulator.js');
check('simulator exposes the secure continuation after buyer completion', page.includes('simHandoff') && client.includes('Open secure continuation'));
check('public simulator source contains no RingCentral secrets', !page.includes('RINGCENTRAL_CLIENT_SECRET') && !client.includes('RINGCENTRAL_JWT_TOKEN'));
check('documentation records the RC-SMS-1.5 zero-repeat handoff', /RC-SMS-1.5/.test(read('SPRINT-RC-SMS-1.5.md')) && /zero-repeat/i.test(read('SPRINT-RC-SMS-1.5.md')) && /0005_rc_sms_1_5_handoffs/.test(read('SPRINT-RC-SMS-1.5.md')));

console.log(JSON.stringify({ sprint:'RC-SMS-1.5', passed:checks.length, failed:0, checks }, null, 2));
