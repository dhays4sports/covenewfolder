#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  flyerCampaignId,
  normalizeFlyerVariant,
  normalizeFlyerZip,
  parseFlyerCampaignId,
  resolveFlyerCampaign
} from './server/campaign-identifiers.mjs';
import {
  handleReferralLinkCreate,
  referralKey,
  referralPublicId
} from './server/referral-link-core.mjs';
import {
  REFERRAL_EVENTS,
  SHARE_CHANNELS,
  handleReferralEvent
} from './server/referral-event-core.mjs';
import { reportKey } from './server/prospect-report-core.mjs';

const require = createRequire(import.meta.url);
const campaignClient = require('./assets/js/campaign-identifiers.js');
const shareClient = require('./assets/js/post-submission-share.js');
const welcomeClient = require('./assets/js/referred-homeowner-welcome.js');
const referralClient = require('./assets/js/referral-attribution.js');
const root = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
  console.log('PASS', name);
}

class MemoryJsonStore {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.has(String(key)) ? structuredClone(this.values.get(String(key))) : null; }
  async setJSON(key, value, options = {}) {
    const id = String(key);
    if (options.onlyIfNew && this.values.has(id)) throw new Error('duplicate');
    this.values.set(id, structuredClone(value));
  }
  async delete(key) { this.values.delete(String(key)); }
}

function request(pathname, body) {
  return new Request(`https://coveragefit.com${pathname}`, {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
check('release version is NP-1.5', ['3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('client modules identify NP-1.5', shareClient.VERSION === '1.4.0' && shareClient.BUILD === 'NP-1.5' && welcomeClient.VERSION === '1.3.0' && welcomeClient.BUILD === 'NP-1.5' && referralClient.VERSION === '1.0.0' && referralClient.BUILD === 'NP-1.5');
check('the complete referral funnel event vocabulary is published', JSON.stringify(REFERRAL_EVENTS) === JSON.stringify(['neighbor_share_view','neighbor_share_click','neighbor_referral_visit','neighbor_referral_start','neighbor_referral_complete']) && JSON.stringify(SHARE_CHANNELS) === JSON.stringify(['sms','native','copy']));

for (const [zip, a, b] of [['95118','rate','fit'], ['10001','A','B'], ['90210','competitive rate','strong fit'], ['02108','rates','coverage fit']]) {
  const rateId = flyerCampaignId(zip, a);
  const fitId = flyerCampaignId(zip, b);
  check(`campaign identifiers are generic for ZIP ${zip}`, rateId === `home_flyer_${zip}_rate` && fitId === `home_flyer_${zip}_fit`);
}
check('campaign identifiers reject incomplete or malformed inputs', flyerCampaignId('9511','rate') === '' && flyerCampaignId('95118','other') === '' && normalizeFlyerZip('CA 95118-1234') === '95118' && normalizeFlyerVariant('B') === 'fit');
check('server campaign parsing recovers canonical identifiers', parseFlyerCampaignId('home_flyer_30301_rate').campaignId === 'home_flyer_30301_rate' && resolveFlyerCampaign({ campaign_zip: '60601', campaign_variant: 'fit' }).campaignId === 'home_flyer_60601_fit');
check('browser campaign parsing matches the server contract', campaignClient.campaignId('94105', 'A') === 'home_flyer_94105_rate' && campaignClient.campaignId('94105', 'B') === 'home_flyer_94105_fit' && campaignClient.resolve({ campaign_zip: '33131', campaign_variant: 'fit' }).campaignId === 'home_flyer_33131_fit');

const reportStore = new MemoryJsonStore();
const referralStore = new MemoryJsonStore();
const eventStore = new MemoryJsonStore();
const originReportId = `report_${'A'.repeat(43)}`;
const originReportKey = await reportKey(originReportId);
await reportStore.setJSON(originReportKey, {
  createdAt: '2026-08-06T04:00:00.000Z',
  expiresAt: '2026-09-05T04:00:00.000Z',
  report: {
    assessment: 'home',
    consumer: {
      name: 'Private Origin Homeowner',
      email: 'origin@example.com',
      phone: '4085550100',
      propertyAddress: '123 Private Street, New York, NY 10001'
    },
    propertyProfile: { address: { postalCode: '10001' } },
    integration: {
      source: '408farmers',
      campaign: 'home_flyer_10001_rate',
      campaignId: 'home_flyer_10001_rate',
      campaignVariant: 'rate',
      campaignZip: '10001',
      entry: 'home_lander_form'
    },
    attribution: {
      firstTouch: { utm_source: 'flyer', utm_medium: 'qr', utm_campaign: 'home_flyer', utm_content: 'home_flyer_10001_rate' }
    }
  }
});

const createResponse = await handleReferralLinkCreate(request('/api/referrals/create', { reportId: originReportId }), {
  reportStore,
  referralStore,
  now: new Date('2026-08-06T05:00:00.000Z')
});
const created = await createResponse.json();
check('a completed origin review creates a reusable referral token', createResponse.status === 201 && created.ok && /^ref_[A-Za-z0-9_-]{16}$/.test(created.access.token));
const token = created.access.token;
const publicId = await referralPublicId(token);
const referralRecord = await referralStore.get(await referralKey(token));
check('origin referral stores generic A/B identifier fields for its ZIP', referralRecord.origin.campaignId === 'home_flyer_10001_rate' && referralRecord.origin.campaignVariant === 'rate' && referralRecord.origin.campaignZip === '10001');

async function event(name, body, at) {
  const response = await handleReferralEvent(request('/api/referrals/event', { token, event: name, ...body }), {
    reportStore,
    referralStore,
    eventStore,
    now: new Date(at)
  });
  return { response, body: await response.json() };
}

const shareView = await event('neighbor_share_view', { landingSource: 'coveragefit_report' }, '2026-08-06T05:01:00.000Z');
const shareViewAgain = await event('neighbor_share_view', { landingSource: 'coveragefit_report' }, '2026-08-06T05:01:05.000Z');
const shareClick = await event('neighbor_share_click', { channel: 'sms', landingSource: 'coveragefit_report' }, '2026-08-06T05:02:00.000Z');
const visit = await event('neighbor_referral_visit', { channel: 'sms', sessionId: 'session_neighbor_10001', landingSource: 'coveragefit_home' }, '2026-08-06T05:03:00.000Z');
const start = await event('neighbor_referral_start', { channel: 'sms', sessionId: 'session_neighbor_10001', landingSource: 'coveragefit_assessment' }, '2026-08-06T05:04:00.000Z');
check('share view and click stages are accepted', shareView.response.status === 201 && shareClick.response.status === 201);
check('refreshing the same stage is deduplicated', shareViewAgain.response.status === 200 && shareViewAgain.body.deduped === true);
check('referred visit and assessment start remain distinguishable', visit.response.status === 201 && start.response.status === 201 && visit.body.event.name === 'neighbor_referral_visit' && start.body.event.name === 'neighbor_referral_start');

const destinationReportId = `report_${'B'.repeat(43)}`;
const destinationReportKey = await reportKey(destinationReportId);
await reportStore.setJSON(destinationReportKey, {
  createdAt: '2026-08-06T05:10:00.000Z',
  expiresAt: '2026-09-05T05:10:00.000Z',
  report: {
    assessment: 'home',
    consumer: {
      name: 'Private Referred Homeowner',
      email: 'referred@example.com',
      phone: '3105550100',
      propertyAddress: '456 Private Avenue, Beverly Hills, CA 90210'
    },
    propertyProfile: { address: { postalCode: '90210' } },
    integration: {
      source: '408farmers',
      referralId: publicId,
      referralSource: 'neighbor-share',
      referralChannel: 'sms'
    }
  }
});
const complete = await event('neighbor_referral_complete', { reportId: destinationReportId, sessionId: 'session_neighbor_10001', landingSource: 'coveragefit_assessment' }, '2026-08-06T05:11:00.000Z');
const completeAgain = await event('neighbor_referral_complete', { reportId: destinationReportId, sessionId: 'session_neighbor_10001', landingSource: 'coveragefit_assessment' }, '2026-08-06T05:11:05.000Z');
check('successful referred submission records completion only after a matching durable report exists', complete.response.status === 201 && complete.body.accepted === true && complete.body.event.referralId === publicId);
check('repeat completion for the same report is deduplicated', completeAgain.response.status === 200 && completeAgain.body.deduped === true);

const records = [...eventStore.values.values()];
check('the complete five-stage funnel is stored once per bounded context', records.length === 5 && REFERRAL_EVENTS.every(name => records.some(record => record.eventName === name)));
check('origin campaign identity survives every referral stage', records.every(record => record.origin.campaignId === 'home_flyer_10001_rate' && record.origin.campaignVariant === 'rate' && record.origin.campaignZip === '10001'));
const completedRecord = records.find(record => record.eventName === 'neighbor_referral_complete');
check('completion records destination ZIP without the destination address', completedRecord.destinationZip === '90210' && /^[a-f0-9]{64}$/.test(completedRecord.destinationSubmissionId));
check('stored event records contain no homeowner contact details, full address, raw report ID, or raw browser session ID', !/Private Origin|Private Referred|origin@example|referred@example|4085550100|3105550100|123 Private|456 Private|report_A|report_B|session_neighbor/i.test(JSON.stringify(records)));
check('direct traffic is not falsely labeled referred by the client context', referralClient.getContext({ storage: { getItem() { return null; } } }).active === false);

const migration = read('migrations/0003_np_1_5_referral_events.sql');
const handlers = read('server/cloudflare-pages-handlers.mjs');
const d1 = read('server/d1-json-store.mjs');
check('Cloudflare deployment includes the referral event endpoint and D1 store', fs.existsSync(path.join(root, 'functions/api/referrals/event.js')) && handlers.includes('referralEvent') && d1.includes('createReferralEventStore') && migration.includes('CREATE TABLE IF NOT EXISTS referral_events'));
check('client routes load campaign and referral attribution modules in the existing journey', ['home/index.html','assessment/index.html','home/report/index.html'].every(rel => read(rel).includes('/assets/js/referral-attribution.js')) && ['home/index.html','transition/index.html','assessment/index.html','home/report/index.html'].every(rel => read(rel).includes('/assets/js/campaign-identifiers.js')));
check('assessment completion tracking is tied to successful durable submission behavior', read('assets/js/assessment-engine.js').includes('CoverageFitReferralAttribution?.markComplete?.(completedReportId)') && read('assets/js/assessment-engine.js').includes('formSubmissionSucceeded'));
check('NP-1.5 documentation records all stages, deduplication, privacy, and any-ZIP A/B identifiers', ['neighbor_share_view','neighbor_share_click','neighbor_referral_visit','neighbor_referral_start','neighbor_referral_complete','any five-digit ZIP','home_flyer_<ZIP>_rate','home_flyer_<ZIP>_fit','deduplicated','no personally identifying information'].every(term => read('SPRINT-NP-1.5.md').toLowerCase().includes(term.toLowerCase())));
check('changelog records the NP-1.5 release', read('CHANGELOG.md').includes('## 3.20.18 — NP-1.5 End-to-End Referral Attribution'));

console.log(JSON.stringify({ sprint: 'NP-1.5', passed: checks.length, failed: 0, checks }, null, 2));
