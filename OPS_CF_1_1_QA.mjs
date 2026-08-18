import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { D1DatabaseHarness } from './qa/cloudflare/d1-sqlite-harness.mjs';
import {
  consultationActivity,
  consultationDisposition,
  consultationFollowUp,
  consultationInbox,
  consultationStatus,
  consultationSubmit,
  prospectReportCreate,
  prospectReportRead
} from './server/cloudflare-pages-handlers.mjs';
import { createProspectReportStore } from './server/d1-json-store.mjs';
import { handleProspectReportCreate, handleProspectReportRead } from './server/prospect-report-core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
}
function context(request, db, token = 'coveragefit-producer-token-1234567890') {
  return {
    request,
    env: { COVERAGEFIT_DB: db, COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token },
    waitUntil() {}
  };
}
function request(pathname, method, body, headers = {}) {
  return new Request(`https://preview.coveragefit.pages.dev${pathname}`, {
    method,
    headers: {
      Origin: 'https://preview.coveragefit.pages.dev',
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
}
function sampleReport() {
  return {
    version: 'v2.4',
    assessment: 'home',
    createdAt: '2026-08-02T20:00:00.000Z',
    score: 74,
    status: 'Strong Foundation',
    strongest: 'Liability limits reviewed',
    topPriority: 'Confirm dwelling reconstruction estimate',
    reviewContext: 'Premium increased',
    consumer: {
      name: 'Cloudflare Preview Homeowner',
      firstName: 'Cloudflare',
      lastName: 'Homeowner',
      email: 'preview@example.com',
      phone: '4085550100',
      propertyAddress: '123 Preview Avenue, Fremont, CA 94539',
      reviewContext: 'Premium increased'
    },
    integration: {
      source: '408farmers',
      campaign: 'home-review',
      referralSource: 'realtor',
      entry: 'home_lander_form',
      sessionId: 'session-cloudflare-preview'
    },
    attribution: { source: '408farmers', campaign: 'home-review', sessionId: 'session-cloudflare-preview' },
    consultationRecord: {
      id: 'consultation-cloudflare-preview-123',
      schemaVersion: '1.0',
      status: 'ready',
      createdAt: '2026-08-02T20:00:00.000Z'
    },
    categories: [{ name: 'Dwelling', score: 70 }],
    priorities: [{ name: 'Dwelling limit' }],
    strengths: ['Completed the protection review'],
    recommendations: [{ id: 'dwelling', name: 'Confirm dwelling reconstruction estimate', priority: 'High' }]
  };
}

const migration = read('migrations/0001_ops_cf_1_1.sql');
const db = new D1DatabaseHarness(migration);
const secret = 'coveragefit-producer-token-1234567890';
const report = sampleReport();

check('Cloudflare Pages function routes exist', [
  'functions/api/consultations/submit.js',
  'functions/api/consultations/inbox.js',
  'functions/api/consultations/status.js',
  'functions/api/consultations/follow-up.js',
  'functions/api/consultations/activity.js',
  'functions/api/consultations/disposition.js',
  'functions/api/reports/create.js',
  'functions/api/reports/read.js'
].every(exists));
check('Netlify runtime files were removed', !exists('netlify') && !exists('netlify.toml'));
check('Pages routes are bounded to API paths', JSON.parse(read('_routes.json')).include.includes('/api/*'));
check('D1 migration creates both durable record tables', migration.includes('consultation_records') && migration.includes('prospect_reports'));
check('D1 migration creates rate limit storage', migration.includes('api_rate_limits'));
check('browser clients use Cloudflare-neutral same-origin API paths', !read('assets/js/remote-consultations.js').includes('.netlify/functions') && !read('assets/js/prospect-report-access.js').includes('.netlify/functions'));
check('Cloudflare secret is referenced only by server logic', read('server/consultation-inbox-core.mjs').includes('COVERAGEFIT_PRODUCER_ACCESS_TOKEN'));
check('Netlify Blobs dependency is removed', !JSON.stringify(JSON.parse(read('package.json'))).includes('@netlify/blobs'));

const reportCreateResponse = await prospectReportCreate(context(request('/api/reports/create', 'POST', { report }), db, secret));
const reportCreateBody = await reportCreateResponse.json();
check('Pages report create route stores a private report', reportCreateResponse.status === 201 && /^report_[A-Za-z0-9_-]{43}$/.test(reportCreateBody.access.id));
check('private report retains 30-day expiration', reportCreateBody.access.ttlDays === 30 && reportCreateBody.access.expiresAt);
const reportId = reportCreateBody.access.id;

const reportReadResponse = await prospectReportRead(context(request('/api/reports/read', 'POST', { reportId }), db, secret));
const reportReadBody = await reportReadResponse.json();
check('Pages report read route supports cross-device retrieval', reportReadResponse.status === 200 && reportReadBody.report.consumer.name === report.consumer.name);
check('public report payload removes prospect email and phone', !reportReadBody.report.consumer.email && !reportReadBody.report.consumer.phone);
check('report access remains opaque and fragment-compatible', `/home/report/#report_id=${reportId}`.includes('#report_id=report_'));

const submitResponse = await consultationSubmit(context(request('/api/consultations/submit', 'POST', { schemaVersion: '1.0', website: '', record: { ...report, prospectReport: { id: reportId, expiresAt: reportCreateBody.access.expiresAt, durable: true } } }), db, secret));
const submitBody = await submitResponse.json();
check('Pages consultation submit route stores the remote record', submitResponse.status === 201 && submitBody.record.id === report.consultationRecord.id);

const unauthorizedResponse = await consultationInbox(context(request('/api/consultations/inbox?limit=50', 'GET', undefined, { Authorization: 'Bearer wrong-token-value-1234567890' }), db, secret));
check('producer inbox rejects the wrong Cloudflare secret', unauthorizedResponse.status === 401);

const inboxResponse = await consultationInbox(context(request('/api/consultations/inbox?limit=50', 'GET', undefined, { Authorization: `Bearer ${secret}` }), db, secret));
const inboxBody = await inboxResponse.json();
check('producer inbox returns the remotely submitted consultation', inboxResponse.status === 200 && inboxBody.count === 1 && inboxBody.records[0].id === report.consultationRecord.id);

const openedResponse = await consultationStatus(context(request('/api/consultations/status', 'PATCH', { consultationId: report.consultationRecord.id, status: 'opened' }, { Authorization: `Bearer ${secret}` }), db, secret));
check('producer can advance the delivered record to Opened', openedResponse.status === 200 && (await openedResponse.clone().json()).record.status === 'opened');

const followUpResponse = await consultationFollowUp(context(request('/api/consultations/follow-up', 'PATCH', { consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-05', note: 'Call after 3 PM.' }, { Authorization: `Bearer ${secret}` }), db, secret));
check('producer follow-up persists through D1', followUpResponse.status === 200 && (await followUpResponse.clone().json()).record.followUp.state === 'scheduled');

const activityResponse = await consultationActivity(context(request('/api/consultations/activity', 'POST', { consultationId: report.consultationRecord.id, type: 'producer_note', note: 'Homeowner prefers a bundled review.' }, { Authorization: `Bearer ${secret}` }), db, secret));
check('producer notes and activity persist through D1', activityResponse.status === 200 && (await activityResponse.clone().json()).record.notes.length === 1);

const dispositionResponse = await consultationDisposition(context(request('/api/consultations/disposition', 'PATCH', { consultationId: report.consultationRecord.id, stage: 'closed', outcome: 'policy_bound', note: 'Home and auto bundle bound.' }, { Authorization: `Bearer ${secret}` }), db, secret));
const dispositionBody = await dispositionResponse.json();
check('consultation disposition persists through D1', dispositionResponse.status === 200 && dispositionBody.record.disposition.stage === 'closed' && dispositionBody.record.disposition.outcome === 'policy_bound');

const countConsultations = db.prepare('SELECT COUNT(*) AS count FROM consultation_records').first();
const countReports = db.prepare('SELECT COUNT(*) AS count FROM prospect_reports').first();
check('D1 contains one consultation and one private report', Number(countConsultations.count) === 1 && Number(countReports.count) === 1);

const expiryDb = new D1DatabaseHarness(migration);
const expiryStore = createProspectReportStore(expiryDb);
const fixedCreate = await handleProspectReportCreate(request('/api/reports/create', 'POST', { report }), { store: expiryStore, now: new Date('2026-08-02T20:00:00.000Z') });
const fixedAccess = (await fixedCreate.json()).access;
const expired = await handleProspectReportRead(request('/api/reports/read', 'POST', { reportId: fixedAccess.id }), { store: expiryStore, now: new Date('2026-09-02T20:00:00.000Z') });
check('D1 private reports return truthful expiration after 30 days', expired.status === 410 && (await expired.json()).error.code === 'report_expired');
check('expired D1 private reports are deleted on access', Number(expiryDb.prepare('SELECT COUNT(*) AS count FROM prospect_reports').first().count) === 0);

check('browser-local consultation fallback remains present', read('assets/js/assessment-engine.js').includes('CoverageFitConsultationRecords') && read('assets/js/remote-consultations.js').includes('submission_failed'));
check('device-only prospect fallback remains present', read('assets/js/prospect-report-access.js').includes('localOnly: true') && read('assets/js/prospect-report-access.js').includes('LOCAL_TTL_MS'));
check('Cloudflare setup guide documents D1, preview and secret steps', ['COVERAGEFIT_DB', 'COVERAGEFIT_PRODUCER_ACCESS_TOKEN', 'preview'].every(value => read('CLOUDFLARE-SETUP.md').includes(value)));

expiryDb.close();
db.close();
console.log(`OPS-CF-1.1 QA: ${checks.length}/${checks.length} passed`);
