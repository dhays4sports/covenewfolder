#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  RECORD_VERSION,
  applyChecklistProgress,
  handleConsultationChecklist,
  normalizeChecklistProgress,
  normalizeRemoteRecord
} from './server/consultation-inbox-core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash = relative => crypto.createHash('sha256').update(read(relative)).digest('hex');
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const checklist = require('./assets/js/consultation-checklist.js');
const records = require('./assets/js/consultation-records.js');
globalThis.CoverageFitConsultationRecords = records;
const workspaceData = require('./assets/js/workspace-data.js');
const remote = require('./assets/js/remote-consultations.js');

check('release remains compatible after CoverageFit 3.20.49', ['3.20.49', '3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('checklist engine exposes one additive recovery export', checklist.VERSION === '0.7.0' && typeof checklist.exportProgress === 'function');
check('consultation records expose additive checklist persistence', records.VERSION === '1.7.0' && typeof records.updateChecklistProgress === 'function');
check('Workspace adapter exposes checklist progress without a second store', workspaceData.VERSION === '1.5.0' && typeof workspaceData.updateConsultationChecklistProgress === 'function');
check('secure client exposes the bounded checklist endpoint', remote.VERSION === '1.7.0' && remote.CHECKLIST_ENDPOINT === '/api/consultations/checklist' && typeof remote.updateChecklistProgress === 'function');
check('server record contract advances additively', RECORD_VERSION === '1.8.0');

const plan = {
  state: 'ready', schemaVersion: '1.0', plannerVersion: '1.2.0', consultationId: 'consultation-pc13-recovery-123456',
  customer: { name: 'Recovery Fixture' },
  sections: [{ id: 'opening', title: 'Understand', items: [
    { id: 'why', phase: 'opening', phaseTitle: 'Understand', title: 'Confirm why the review exists', estimatedMinutes: 2 },
    { id: 'goal', phase: 'opening', phaseTitle: 'Understand', title: 'Confirm the homeowner goal', estimatedMinutes: 2 }
  ] }]
};
const device = new MemoryStorage();
checklist.restoreFromPlan(plan, { storage: device, now: () => new Date('2026-08-09T10:00:00.000Z') });
const firstId = checklist.getWorkspaceState().checklist.items[0].id;
checklist.complete(firstId, { storage: device, now: () => new Date('2026-08-09T10:01:00.000Z') });
const checkpoint = checklist.exportProgress(null, { now: () => new Date('2026-08-09T10:01:30.000Z') });
check('export contains only bounded working-state fields', checkpoint.items.length === 2 && checkpoint.items[0].status === 'complete');
check('export excludes homeowner identity and opaque consultation ID', !/Recovery Fixture|pc13-recovery-123456|email|phone|address/i.test(JSON.stringify(checkpoint)));

const cleanDevice = new MemoryStorage();
let recovered = checklist.restoreFromPlan(plan, { storage: cleanDevice, recoveryRecord: checkpoint, now: () => new Date('2026-08-09T10:02:00.000Z') });
check('consultation checkpoint recovers progress on a clean device', recovered.items[0].status === 'complete' && recovered.persistence.recoveredFrom === 'consultation-record');
check('recovery writes through to the existing device key', Boolean(cleanDevice.getItem(checklist.getStorageKey(recovered))));

const olderCheckpoint = { ...checkpoint, lastUpdatedAt: '2026-08-09T09:00:00.000Z', items: checkpoint.items.map(item => ({ ...item, status: 'pending' })) };
recovered = checklist.restoreFromPlan(plan, { storage: cleanDevice, recoveryRecord: olderCheckpoint, now: () => new Date('2026-08-09T10:03:00.000Z') });
check('newer device state wins over an older consultation checkpoint', recovered.items[0].status === 'complete' && recovered.persistence.recoveredFrom === 'device');
const newerCheckpoint = { ...checkpoint, lastUpdatedAt: '2026-08-09T10:04:00.000Z', items: checkpoint.items.map((item, index) => ({ ...item, status: index ? 'complete' : item.status })) };
recovered = checklist.restoreFromPlan(plan, { storage: cleanDevice, recoveryRecord: newerCheckpoint, now: () => new Date('2026-08-09T10:05:00.000Z') });
check('newer consultation checkpoint wins and restores all progress', recovered.items.every(item => item.status === 'complete') && recovered.persistence.recoveredFrom === 'consultation-record');
const mismatched = { ...newerCheckpoint, planFingerprint: 'plan-different' };
const emptyDevice = new MemoryStorage();
recovered = checklist.restoreFromPlan(plan, { storage: emptyDevice, recoveryRecord: mismatched, now: () => new Date('2026-08-09T10:06:00.000Z') });
check('mismatched plan checkpoints never cross into the consultation', recovered.items.every(item => item.status === 'pending') && recovered.persistence.restored === false);

const report = {
  assessment: 'home', version: '3.20.49', createdAt: '2026-08-09T10:00:00.000Z', score: 64, status: 'Review Recommended',
  consumer: { name: 'Avery Homeowner', email: 'avery@example.test', propertyAddress: '408 Main Street' },
  consultationRecord: { id: 'consultation-pc13-recovery-123456' }, recommendations: []
};
const recordStorage = new MemoryStorage();
records.upsert(report, { storage: recordStorage, id: report.consultationRecord.id, now: () => new Date('2026-08-09T10:00:00.000Z') });
let saved = records.updateChecklistProgress(report.consultationRecord.id, newerCheckpoint, { storage: recordStorage, now: () => new Date('2026-08-09T10:05:00.000Z') });
check('checkpoint persists inside the canonical consultation record', saved.checklistProgress.lastUpdatedAt === newerCheckpoint.lastUpdatedAt);
saved = records.updateChecklistProgress(report.consultationRecord.id, olderCheckpoint, { storage: recordStorage });
check('late browser writes cannot replace newer saved progress', saved.checklistProgress.lastUpdatedAt === newerCheckpoint.lastUpdatedAt);
const snapshot = workspaceData.getSnapshot({ storage: recordStorage, consultationId: report.consultationRecord.id });
check('Workspace snapshot carries the selected consultation checkpoint', snapshot.consultation.checklistProgress.lastUpdatedAt === newerCheckpoint.lastUpdatedAt);

let clientRequest = null;
const clientResult = await remote.updateChecklistProgress(report.consultationRecord.id, newerCheckpoint, {
  token: 'producer_access_token_pc13_client_123456',
  endpoint: 'https://coveragefit.example/api/consultations/checklist',
  records,
  localStorage: recordStorage,
  dispatch: false,
  keepalive: true,
  fetch: async (url, options) => {
    clientRequest = { url, options };
    return new Response(JSON.stringify({ ok: true, stale: false, record: { id: report.consultationRecord.id, product: 'home', status: 'new', updatedAt: '2026-08-09T10:05:00.000Z', checklistProgress: newerCheckpoint } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});
check('secure client sends the checkpoint with producer authorization', clientResult.ok && clientRequest.options.headers.Authorization.startsWith('Bearer ') && JSON.parse(clientRequest.options.body).checklistProgress.items.length === 2);
check('secure client uses PATCH, same-origin credentials, and keepalive', clientRequest.options.method === 'PATCH' && clientRequest.options.credentials === 'same-origin' && clientRequest.options.keepalive === true);
check('secure client reconciles the returned checkpoint into the existing record', records.get(report.consultationRecord.id, { storage: recordStorage }).remote.checklistProgress.lastUpdatedAt === newerCheckpoint.lastUpdatedAt);

const serverBase = normalizeRemoteRecord(report, { submittedAt: '2026-08-09T10:00:00.000Z' });
const serverSaved = applyChecklistProgress(serverBase, newerCheckpoint);
check('server saves the minimal checkpoint without altering queue order', serverSaved.checklistProgress.items.length === 2 && serverSaved.updatedAt === serverBase.updatedAt);
check('server normalizer keeps the newest valid checkpoint', normalizeChecklistProgress(olderCheckpoint, newerCheckpoint).lastUpdatedAt === newerCheckpoint.lastUpdatedAt);

function memoryStore(initial) {
  const rows = new Map([[`records/${initial.id}`, clone(initial)]]);
  const writes = [];
  return { rows, writes, async get(key) { return clone(rows.get(key)); }, async setJSON(key, value, options) { rows.set(key, clone(value)); writes.push({ key, value: clone(value), metadata: clone(options?.metadata) }); } };
}
const token = 'producer_access_token_pc13_123456789';
const endpoint = 'https://coveragefit.example/api/consultations/checklist';
const makeRequest = progress => new Request(endpoint, { method: 'PATCH', headers: { Origin: 'https://coveragefit.example', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ consultationId: serverBase.id, checklistProgress: progress }) });
const store = memoryStore(serverBase);
let response = await handleConsultationChecklist(makeRequest(newerCheckpoint), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
let body = await response.json();
check('secure endpoint accepts and returns valid progress', response.status === 200 && body.ok && body.record.checklistProgress.items.length === 2);
check('secure checkpoint metadata contains no homeowner data', !/Avery|avery@example|408 Main/.test(JSON.stringify(store.writes.at(-1).metadata)));
const writeCount = store.writes.length;
response = await handleConsultationChecklist(makeRequest(olderCheckpoint), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
body = await response.json();
check('secure endpoint identifies stale progress without writing it', response.status === 200 && body.stale === true && store.writes.length === writeCount);
response = await handleConsultationChecklist(makeRequest({ ...newerCheckpoint, items: [{ id: 'one', status: 'invalid' }] }), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint rejects unsupported item state', response.status === 422 && (await response.json()).error.code === 'invalid_checklist_item');

const workspace = read('assets/js/agent-workspace.js');
const html = read('agent/workspace/index.html');
check('Workspace restores through the canonical engine with record recovery', workspace.includes('recoveryRecord: snapshot?.consultation?.checklistProgress'));
check('Workspace debounces secure progress synchronization', workspace.includes('updateChecklistProgress(record.id, progress') && workspace.includes('}, 600)'));
check('Workspace attempts a keepalive flush when leaving', workspace.includes('flushChecklistProgress(true)'));
check('producer sees a calm persistence status', html.includes('id="checklistPersistenceState"') && workspace.includes('Recovered from consultation record') && workspace.includes('Saved with consultation'));
check('one deployment handler exposes the secure route', read('functions/api/consultations/checklist.js').includes('consultationChecklist'));
check('no database migration was added for JSON-record progress', !fs.readdirSync(path.join(root, 'migrations')).some(name => /pc.?1.?3|checklist/i.test(name)));
check('assessment and Protection Score remain unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3' && hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('FLOW intake advances only for HOME-2.1 semantics while RC-SMS handoff remains unchanged', hash('assets/js/prefill-intake.js') === '9cca4d8bbd6d2ba6b7f72aaf569dc252762c41d6e8857111a3d7f03f5a351f48' && hash('assets/js/sms-handoff-resolver.js') === 'defea794444f829cac4f267feab32ab43ba16eefe3a25d92ca13fa01595bc262');
check('PC-1.3 does not assert an insurance or carrier outcome', !/guaranteed discount|guaranteed rate|underwriting approved|coverage approved|you qualify/i.test(`${workspace}\n${read('SPRINT-PC-1.3.md')}`));

console.log(JSON.stringify({ suite: 'PC-1.3 Consultation Persistence and Recovery Hardening', version: read('VERSION').trim(), passed: checks.length, failed: 0, checks }, null, 2));
