#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  ACTIVITY_TYPES,
  RECORD_VERSION,
  applyConsultationCompletion,
  handleConsultationCompletion,
  normalizeConsultationCompletion,
  normalizeRemoteRecord,
  normalizeStoredRecord
} from './server/consultation-inbox-core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
const completion = require('./assets/js/consultation-completion.js');
const records = require('./assets/js/consultation-records.js');
const remote = require('./assets/js/remote-consultations.js');
let passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS', name); passed += 1; };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

const valid = {
  decisionSummary: 'Homeowner wants a formal comparison of water-backup limits and will keep the current deductible option in the comparison.',
  unresolvedState: 'open',
  unresolvedSummary: 'Confirm the current endorsement and obtain the declarations page.',
  quoteState: 'needs_items',
  quoteRequirements: 'Current declarations page and preferred water-backup limit.',
  nextAction: 'Homeowner sends the declarations page Friday; Dylan prepares two carrier quote options.'
};

check('release remains compatible after CoverageFit 3.20.38', ['3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Consultation Completion is centrally versioned', completion.VERSION === '1.0.0' && completion.SCHEMA_VERSION === '1.0');
check('bounded unresolved and quote states are immutable', Object.isFrozen(completion.UNRESOLVED_STATES) && Object.isFrozen(completion.QUOTE_STATES));
check('valid closeout prepares a complete record', completion.prepare(valid, { updatedAt: '2026-08-09T20:00:00.000Z' }).completion.state === 'complete');
check('completion timestamp is assigned once', completion.prepare(valid, { updatedAt: '2026-08-09T20:00:00.000Z' }).completion.completedAt === '2026-08-09T20:00:00.000Z');
check('decision summary is required', completion.validate({ ...valid, decisionSummary: '' }).errors.some(error => error.code === 'decision_required'));
check('open unresolved state requires a summary', completion.validate({ ...valid, unresolvedSummary: '' }).errors.some(error => error.code === 'unresolved_summary_required'));
check('explicit no-unresolved state clears stale text', completion.normalize({ ...valid, unresolvedState: 'none' }).unresolvedSummary === '');
check('needs-items quote state requires requirements', completion.validate({ ...valid, quoteRequirements: '' }).errors.some(error => error.code === 'quote_requirements_required'));
check('no-quote state clears stale requirements', completion.normalize({ ...valid, quoteState: 'not_requested' }).quoteRequirements === '');
check('next action is required', completion.validate({ ...valid, nextAction: '' }).errors.some(error => error.code === 'next_action_required'));

const snapshot = {
  state: 'ready',
  consultation: { id: 'consultation-gc19-123456' },
  evidenceHandoff: { summary: { verification: 2, unresolved: 1 } }
};
const record = {
  id: 'consultation-gc19-123456',
  recommendationPlan: { items: [
    { title: 'Water backup', decision: 'recommend', verified: true },
    { title: 'Roof terms', decision: 'defer', verified: false }
  ] },
  completion: valid
};
const model = completion.build(snapshot, record);
check('completion model uses existing recommendation judgments', model.decisions.length === 2 && model.decisions[0].label === 'Recommend for carrier quote');
check('completion model preserves deferred work as open', model.evidence.findingOpenCount === 1 && model.decisions[1].label === 'Deferred');
check('completion model counts existing evidence work without changing it', model.evidence.openCount === 3);
check('completion guardrail reserves carrier authority', /Carrier forms, eligibility, underwriting, price, and issued policy terms/.test(model.guardrail));

function memoryStorage() {
  const values = new Map();
  return { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); }, removeItem(key) { values.delete(key); }, values };
}
function report(id = 'consultation-gc19-123456') {
  return {
    version: '3.20.38', assessment: 'home', createdAt: '2026-08-09T18:00:00.000Z', score: 64, status: 'Review Recommended', topPriority: 'Water backup', strongest: 'Assessment complete',
    consumer: { name: 'Avery Homeowner', email: 'avery@example.com', propertyAddress: '408 Main St' },
    consultationRecord: { id, createdAt: '2026-08-09T18:00:00.000Z' }, recommendations: []
  };
}

const localStorage = memoryStorage();
records.upsert(report(), { storage: localStorage, now: () => new Date('2026-08-09T18:00:00.000Z') });
const localSaved = records.updateCompletion('consultation-gc19-123456', valid, { storage: localStorage, now: () => new Date('2026-08-09T20:00:00.000Z') });
check('browser-local completion persists in the existing consultation record', localSaved.completion.state === 'complete' && records.get(localSaved.id, { storage: localStorage }).completion.nextAction.includes('Dylan'));
check('local completion advances an early record to Consultation completed', localSaved.disposition.stage === 'consultation_completed');
check('local completion does not overwrite a later closed disposition', (() => {
  records.updateDisposition(localSaved.id, { stage: 'closed', outcome: 'deferred' }, { storage: localStorage, now: () => new Date('2026-08-09T20:10:00.000Z') });
  return records.updateCompletion(localSaved.id, { ...valid, nextAction: 'Revisit next renewal.' }, { storage: localStorage, now: () => new Date('2026-08-09T20:20:00.000Z') }).disposition.stage === 'closed';
})());
check('local persistence rejects ambiguous unresolved state', records.updateCompletion(localSaved.id, { ...valid, unresolvedSummary: '' }, { storage: localStorage }) === null);
check('legacy records normalize with a safe draft completion', records.get(localSaved.id, { storage: localStorage }).completion.schemaVersion === '1.0');
check('browser consultation record contract advances additively', ['1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && typeof records.updateCompletion === 'function');

const serverBase = normalizeRemoteRecord(report(), { submittedAt: '2026-08-09T18:00:00.000Z' });
const serverSaved = applyConsultationCompletion(serverBase, valid, '2026-08-09T20:00:00.000Z');
check('server completion persists the structured closeout', serverSaved.completion.state === 'complete' && serverSaved.completion.quoteState === 'needs_items');
check('server completion advances early disposition without closing the record', serverSaved.disposition.stage === 'consultation_completed' && serverSaved.disposition.outcome === 'none');
check('server completion records one redacted operational activity', serverSaved.activity.at(-1).type === 'consultation_completion_saved' && !serverSaved.activity.at(-1).detail.includes('declarations page'));
check('server record contract advances additively', ['1.7.0','1.8.0'].includes(RECORD_VERSION) && ACTIVITY_TYPES.includes('consultation_completion_saved'));
check('server legacy normalization supplies a safe draft closeout', normalizeStoredRecord({ ...serverBase, completion: undefined }).completion.state === 'draft');
check('server normalizer clears quote text when no quote is requested', normalizeConsultationCompletion({ completion: { ...valid, quoteState: 'not_requested' } }).quoteRequirements === '');

function store(initial) {
  const rows = new Map(initial ? [[`records/${initial.id}`, clone(initial)]] : []);
  const writes = [];
  return { rows, writes, async get(key) { return clone(rows.get(key) || null); }, async setJSON(key, value, options = {}) { rows.set(key, clone(value)); writes.push({ key, value: clone(value), metadata: clone(options.metadata) }); } };
}
const token = 'producer_access_token_1234567890';
const endpoint = 'https://coveragefit.example/api/consultations/completion';
function request(body, options = {}) {
  return new Request(endpoint, { method: options.method || 'PATCH', headers: { Origin: options.origin || 'https://coveragefit.example', Authorization: `Bearer ${options.token || token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
const serverStore = store(serverBase);
let response = await handleConsultationCompletion(request({ consultationId: serverBase.id, completion: valid }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
let body = await response.json();
check('secure completion endpoint persists a valid closeout', response.status === 200 && body.ok && serverStore.rows.get(`records/${serverBase.id}`).completion.state === 'complete');
check('secure response returns normalized completion and disposition', body.record.completion.quoteState === 'needs_items' && body.record.disposition.stage === 'consultation_completed');
check('D1 metadata exposes state and timestamps without closeout narrative', serverStore.writes.at(-1).metadata.consultationCompletionState === 'complete' && !JSON.stringify(serverStore.writes.at(-1).metadata).includes('declarations page'));
response = await handleConsultationCompletion(request({ consultationId: serverBase.id, completion: { ...valid, decisionSummary: '' } }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint rejects missing decision summary', response.status === 422 && (await response.json()).error.code === 'decision_required');
response = await handleConsultationCompletion(request({ consultationId: serverBase.id, completion: valid }, { token: 'wrong_token_123456789012345678' }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint requires producer authorization', response.status === 401);
response = await handleConsultationCompletion(request({ consultationId: serverBase.id, completion: valid }, { origin: 'https://attacker.example' }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint enforces same origin', response.status === 403);

let remoteCall = null;
let remoteUpdated = null;
const remoteResult = await remote.updateCompletion(serverBase.id, valid, {
  token,
  fetch: async (url, init) => { remoteCall = { url, init }; return Response.json({ ok: true, record: serverSaved }); },
  records: { updateRemote(id, value) { remoteUpdated = { id, value }; } },
  localStorage: memoryStorage()
});
check('remote client advances additively for consultation completion', ['1.6.0','1.7.0','1.7.1'].includes(remote.VERSION) && typeof remote.updateCompletion === 'function');
check('remote client uses the existing consultation API family', remoteCall.url === '/api/consultations/completion' && remoteCall.init.method === 'PATCH');
check('remote client sends only consultation ID and structured closeout', JSON.parse(remoteCall.init.body).consultationId === serverBase.id && JSON.parse(remoteCall.init.body).completion.nextAction === valid.nextAction);
check('remote response updates the existing local consultation cache', remoteUpdated.id === serverBase.id && remoteResult.completion.state === 'complete');

const source = read('assets/js/consultation-completion.js');
const html = read('agent/workspace/index.html');
const workspace = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
const handlers = read('server/cloudflare-pages-handlers.mjs');
check('Workspace loads exactly one Consultation Completion module', (html.match(/consultation-completion\.js/g) || []).length === 1);
check('closeout appears once inside the existing After phase', (html.match(/id="consultationCompletion"/g) || []).length === 1 && html.indexOf('id="consultationCompletion"') > html.indexOf('id="consultationAfterTitle"'));
check('closeout explicitly captures all four required completion areas', ['consultationCompletionDecision','consultationCompletionUnresolved','consultationCompletionQuoteRequirements','consultationCompletionNextAction'].every(id => html.includes(`id="${id}"`)));
check('Workspace displays existing judgments, open evidence, and follow-up context', ['consultationCompletionDecisionList','consultationCompletionOpenCount','consultationCompletionFollowUpState'].every(id => html.includes(id)));
check('Workspace persists local and server-backed completion through existing consultation records', workspace.includes('remoteInbox.updateCompletion') && workspace.includes('data?.updateConsultationCompletion'));
check('secure completion endpoint is wired through the existing Cloudflare handler family', fs.existsSync(path.join(root, 'functions/api/consultations/completion.js')) && handlers.includes('handleConsultationCompletion'));
check('responsive beginner-friendly closeout styling is present', css.includes('GC-1.9 — Consultation Completion') && css.includes('.consultation-completion__context') && css.includes('grid-template-columns: 1fr'));
check('completion model creates no storage, API, score, or assessment architecture', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|setJSON|assessment-engine/.test(source));
check('closeout copy makes no unsupported insurance outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(source + html));
check('module and modified JavaScript parse successfully', (() => { new Function(source); new Function(workspace); return true; })());

check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('GC-1.3 priority ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('GC-1.8 progress model remains unchanged', hash('assets/js/consultation-progress.js') === 'f0ebe864f6fd0c8c6d3bbe465999d4e65ba0f465835f0fd602d8239987bfe2da');
check('consultation document retains GC-1.9 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('GC-1.9 documentation remains complete as Consultation Document work begins', fs.existsSync(path.join(root, 'SPRINT-GC-1.9.md')) && read('ROADMAP.md').includes('GC-1.9 Consultation Completion — Complete (3.20.38)') && read('ROADMAP.md').includes('CD-1.1 Document Information Architecture — Complete (3.20.39)'));

console.log(`GC-1.9 QA: ${passed}/${passed} passed`);
