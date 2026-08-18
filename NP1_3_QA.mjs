#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  REFERRAL_TOKEN_PATTERN,
  REFERRAL_TTL_DAYS,
  createReferralToken,
  referralKey,
  originContext,
  handleReferralLinkCreate,
  handleReferralLinkRead
} from './server/referral-link-core.mjs';
import { reportKey } from './server/prospect-report-core.mjs';

const require = createRequire(import.meta.url);
const shareApi = require('./assets/js/post-submission-share.js');
const welcomeApi = require('./assets/js/referred-homeowner-welcome.js');
const root = path.dirname(new URL(import.meta.url).pathname);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
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

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
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
check('NP-1.3 remains compatible in the current release', ['3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('client modules are advanced for NP-1.3', shareApi.VERSION === '1.4.0' && shareApi.BUILD === 'NP-1.5' && welcomeApi.VERSION === '1.3.0' && welcomeApi.BUILD === 'NP-1.5');

const tokenA = createReferralToken();
const tokenB = createReferralToken();
check('referral tokens are random, non-sequential, and pattern constrained', REFERRAL_TOKEN_PATTERN.test(tokenA) && REFERRAL_TOKEN_PATTERN.test(tokenB) && tokenA !== tokenB && tokenA.length === tokenB.length);
check('referral token storage keys are hashed', (await referralKey(tokenA)).startsWith('referrals/') && !(await referralKey(tokenA)).includes(tokenA));

const reportId = `report_${'A'.repeat(43)}`;
const originReportKey = await reportKey(reportId);
const reportStore = new MemoryJsonStore();
const referralStore = new MemoryJsonStore();
await reportStore.setJSON(originReportKey, {
  createdAt: '2026-08-06T03:00:00.000Z',
  expiresAt: '2026-09-05T03:00:00.000Z',
  report: {
    assessment: 'home',
    createdAt: '2026-08-06T02:55:00.000Z',
    consumer: {
      name: 'Private Homeowner',
      email: 'private@example.com',
      phone: '4085550100',
      propertyAddress: '123 Private Street, San Jose, CA 95118'
    },
    propertyProfile: { address: { postalCode: '95118' } },
    integration: { source: '408farmers', campaign: '95118_rate', entry: '/transition/' },
    attribution: { firstTouch: { utm_medium: 'flyer', utm_content: 'rate_a' } }
  }
});

const extracted = originContext((await reportStore.get(originReportKey)).report, '2026-08-06T03:00:00.000Z');
check('origin context keeps only bounded campaign and ZIP metadata', extracted.source === '408farmers' && extracted.campaign === 'home_flyer_95118_rate' && extracted.medium === 'flyer' && extracted.content === 'rate_a' && extracted.zip === '95118');
check('origin context excludes homeowner identity and full property address', !JSON.stringify(extracted).includes('Private Homeowner') && !JSON.stringify(extracted).includes('123 Private Street') && !JSON.stringify(extracted).includes('private@example.com'));

const createdResponse = await handleReferralLinkCreate(request('/api/referrals/create', { reportId }), {
  referralStore,
  reportStore,
  now: new Date('2026-08-06T04:00:00.000Z')
});
const created = await createdResponse.json();
check('completed durable Home report creates one anonymous referral link', createdResponse.status === 201 && created.ok === true && REFERRAL_TOKEN_PATTERN.test(created.access.token) && created.access.url === `https://408farmers.com/neighbor/r/${created.access.token}`);
check('referral access has a bounded 90-day lifetime', created.access.ttlDays === REFERRAL_TTL_DAYS && created.access.expiresAt === '2026-11-04T04:00:00.000Z');

const storedRecords = [...referralStore.values.values()];
const tokenRecord = storedRecords.find(value => value?.originSubmissionId);
check('stored referral record links internally to the origin without raw report ID', Boolean(tokenRecord) && /^[a-f0-9]{64}$/.test(tokenRecord.originSubmissionId) && !JSON.stringify(tokenRecord).includes(reportId));
check('stored referral record contains campaign source, ZIP, and creation context but no PII', tokenRecord.origin.source === '408farmers' && tokenRecord.origin.campaign === 'home_flyer_95118_rate' && tokenRecord.origin.zip === '95118' && !/Private Homeowner|private@example\.com|4085550100|123 Private Street/.test(JSON.stringify(tokenRecord)));

const reusedResponse = await handleReferralLinkCreate(request('/api/referrals/create', { reportId }), {
  referralStore,
  reportStore,
  now: new Date('2026-08-06T04:10:00.000Z')
});
const reused = await reusedResponse.json();
check('repeat creation for the same completed review reuses the original token', reusedResponse.status === 200 && reused.access.reused === true && reused.access.token === created.access.token);

const readResponse = await handleReferralLinkRead(request('/api/referrals/read', { token: created.access.token }), {
  referralStore,
  now: new Date('2026-08-06T05:00:00.000Z')
});
const readable = await readResponse.json();
check('valid tokens resolve without exposing origin metadata', readResponse.status === 200 && readable.referral.token === created.access.token && !('origin' in readable.referral) && !('originSubmissionId' in readable.referral));

const expiredResponse = await handleReferralLinkRead(request('/api/referrals/read', { token: created.access.token }), {
  referralStore,
  now: new Date('2026-11-04T04:00:01.000Z')
});
const expired = await expiredResponse.json();
check('expired tokens return a safe generic neighbor-review fallback', expiredResponse.status === 410 && expired.error.code === 'referral_expired' && expired.error.fallbackUrl === 'https://408farmers.com/neighbor/');

const storage = new MemoryStorage();
shareApi.markSuccessfulSubmission({ assessment: 'home', reportId, formSubmissionSucceeded: true, submittedAt: '2026-08-06T04:00:00.000Z' }, { storage });
let createCalls = 0;
const fetchCreate = async () => {
  createCalls += 1;
  return response({ ok: true, access: { ...created.access, expiresAt: '2026-11-04T04:00:00.000Z' } }, 201);
};
const firstAccess = await shareApi.ensureReferralLink(reportId, { storage, fetch: fetchCreate, now: new Date('2026-08-06T04:05:00.000Z') });
const secondAccess = await shareApi.ensureReferralLink(reportId, { storage, fetch: fetchCreate, now: new Date('2026-08-06T04:06:00.000Z') });
check('post-submission module caches one token rather than generating one per click', firstAccess.ok === true && secondAccess.ok === true && createCalls === 1 && firstAccess.access.token === secondAccess.access.token);
check('all share channels use the same token while identifying the channel', ['sms','native','copy'].every(channel => {
  const url = new URL(shareApi.buildChannelUrl(firstAccess.access.url, channel));
  return shareApi.tokenFromUrl(url.toString()) === firstAccess.access.token && url.searchParams.get('share') === channel;
}));
check('session receipt stores no homeowner or recipient PII', !/name|email|phone|propertyAddress|recipient/i.test(JSON.stringify(shareApi.readReceipt({ storage }))));

const explicitValid = welcomeApi.readExplicitReferral(`?ref=neighbor&rid=${created.access.token}&share=sms`);
check('referred welcome accepts one valid anonymous token and approved share channel', explicitValid.valid === true && explicitValid.tokenValid === true && explicitValid.token === created.access.token && explicitValid.shareChannel === 'sms');
const explicitInvalid = welcomeApi.readExplicitReferral('?ref=neighbor&rid=not-a-token&share=unknown');
check('malformed tokens retain a safe generic neighbor welcome', explicitInvalid.valid === true && explicitInvalid.tokenPresent === true && explicitInvalid.tokenValid === false);
const invalidState = welcomeApi.resolveState({ location: { pathname: '/home/', search: '?ref=neighbor&rid=not-a-token' }, storage: new MemoryStorage(), now: new Date('2026-08-06T05:00:00.000Z') });
check('invalid token state is active only as generic referred welcome', invalidState.active === true && invalidState.reason === 'invalid_token_fallback' && invalidState.entry.referralToken === '' && invalidState.entry.tokenStatus === 'generic');

const validation = await welcomeApi.validateReferralToken(created.access.token, {
  fetch: async () => response({ ok: true, referral: { id: `nref_${'1'.repeat(24)}`, token: created.access.token, referralType: 'neighbor', createdAt: created.access.createdAt, expiresAt: created.access.expiresAt } }),
  now: new Date('2026-08-06T05:00:00.000Z')
});
check('valid referral token can be verified without returning origin details', validation.valid === true && validation.token === created.access.token && !('origin' in validation));

const invalidTokenStorage = new MemoryStorage();
const pending = welcomeApi.writeEntry({
  storage: invalidTokenStorage,
  explicit: { tokenPresent: true, tokenValid: true, token: created.access.token, shareChannel: 'copy' },
  now: new Date('2026-08-06T05:00:00.000Z')
});
const settled = await welcomeApi.settleReferralToken(pending, {
  storage: invalidTokenStorage,
  fetch: async () => response({ ok: false, error: { code: 'referral_expired', message: 'expired' } }, 410),
  now: new Date('2026-08-06T05:01:00.000Z')
});
check('expired or unavailable tokens are removed from session attribution and fall back generically', settled.valid === false && settled.entry.referralToken === '' && settled.entry.tokenStatus === 'generic' && settled.entry.shareChannel === 'copy');

const migration = read('migrations/0002_np_1_3_referral_links.sql');
const handlers = read('server/cloudflare-pages-handlers.mjs');
const d1 = read('server/d1-json-store.mjs');
check('Cloudflare deployment includes referral create and read functions', fs.existsSync(path.join(root, 'functions/api/referrals/create.js')) && fs.existsSync(path.join(root, 'functions/api/referrals/read.js')) && handlers.includes('referralLinkCreate') && handlers.includes('referralLinkRead'));
check('D1 migration and store support anonymous referral records', migration.includes('CREATE TABLE IF NOT EXISTS referral_links') && d1.includes("createReferralLinkStore") && d1.includes("'referral_links'"));
check('sprint documentation records privacy, idempotency, expiry, and fallback contracts', ['random and non-sequential', 'same token', 'no personally identifying information', 'expired', 'generic landing'].every(value => read('SPRINT-NP-1.3.md').toLowerCase().includes(value.toLowerCase())));
check('changelog records the NP-1.3 release', read('CHANGELOG.md').includes('## 3.20.16 — NP-1.3 Anonymous Referral Links'));

console.log(JSON.stringify({ sprint: 'NP-1.3', passed: checks.length, failed: 0, checks }, null, 2));
