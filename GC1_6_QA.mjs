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
  RECOMMENDATION_DECISIONS,
  applyRecommendationPlan,
  handleConsultationRecommendations,
  normalizeRemoteRecord,
  normalizeStoredRecord
} from './server/consultation-inbox-core.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
globalThis.CoverageFitConsultationCommandCenter = require('./assets/js/consultation-command-center.js');
const builder = require('./assets/js/recommendation-builder.js');
const records = require('./assets/js/consultation-records.js');
const remote = require('./assets/js/remote-consultations.js');
let passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS', name); passed += 1; };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function snapshot(overrides = {}) {
  return {
    state: 'ready',
    consultation: { id: 'consultation-gc16-123456', recommendationPlan: null },
    customer: { name: 'Avery Homeowner' },
    assessment: { score: 61, topPriority: 'Water protection' },
    recommendations: [
      { id: 'water', order: 2, title: 'Water backup protection', explanation: 'Confirm an appropriate limit.', priority: 'High', evidenceQuality: 'needs-verification', evidenceLabel: 'Needs policy verification', evidencePrompt: 'Compare the declarations page and endorsement.', source: { priorityScore: 8, findingType: 'identified-gap' } },
      { id: 'liability', order: 1, title: 'Liability foundation', explanation: 'Review the household liability need.', priority: 'High', evidenceQuality: 'confirmed', evidenceLabel: 'Clear homeowner response', source: { priorityScore: 7, findingType: 'identified-gap' } },
      { id: 'roof', order: 3, title: 'Roof settlement terms', explanation: 'Confirm the settlement basis.', priority: 'Medium', evidenceQuality: 'partial', evidenceLabel: 'Open detail', evidencePrompt: 'Confirm the roof age and policy settlement provision.', source: { priorityScore: 5, findingType: 'uncertainty' } }
    ],
    ...overrides
  };
}

check('release remains compatible after GC-1.6', ['3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Recommendation Builder is centrally versioned', builder.VERSION === '1.0.0' && builder.SCHEMA_VERSION === '1.0');
check('five bounded producer judgments are exposed', builder.DECISIONS.map(item => item.value).join(',') === 'undecided,consider,recommend,defer,not_recommended');
check('decision definitions are immutable', Object.isFrozen(builder.DECISIONS) && builder.DECISIONS.every(Object.isFrozen));

const input = snapshot();
const original = JSON.stringify(input);
let plan = builder.build(input);
check('builder consumes the existing three ranked findings', plan.items.length === 3 && plan.items[0].findingId === 'water' && plan.items[1].findingId === 'liability');
check('nothing is recommended automatically', plan.state === 'not-started' && plan.summary.recommend === 0 && plan.items.every(item => item.decision === 'undecided'));
check('producer verification defaults false even for clear homeowner answers', plan.items.every(item => item.verified === false));
check('existing evidence state remains visible', plan.items[0].evidenceQuality === 'needs-verification' && plan.items[0].evidencePrompt.includes('declarations'));
check('CoverageFit assessment rationale stays separate from producer reasoning', plan.items[0].assessmentRationale && plan.items[0].producerReason === '');
check('builder does not mutate the Workspace snapshot', JSON.stringify(input) === original);

const waterId = plan.items[0].id;
plan = builder.update(plan, waterId, { decision: 'recommend' }, { updatedAt: '2026-08-09T01:00:00.000Z' });
check('unverified recommendation attempts fail closed to undecided', plan.items[0].decision === 'undecided' && plan.summary.recommend === 0);
plan = builder.update(plan, waterId, { verified: true, decision: 'recommend' }, { updatedAt: '2026-08-09T01:01:00.000Z' });
check('explicit verification unlocks producer recommendation judgment', plan.items[0].verified === true && plan.items[0].decision === 'recommend');
check('recommended finding requires producer reasoning', builder.validate(plan).errors.some(error => error.code === 'reason_required' && error.itemId === waterId));
plan = builder.update(plan, waterId, { producerReason: 'Verified the current endorsement and homeowner recovery preference.' }, { updatedAt: '2026-08-09T01:02:00.000Z' });
check('verified recommendation with reasoning validates', !builder.validate(plan).errors.some(error => error.itemId === waterId));
plan = builder.update(plan, waterId, { verified: false }, { updatedAt: '2026-08-09T01:03:00.000Z' });
check('removing verification clears a prior recommendation', plan.items[0].decision === 'undecided' && plan.items[0].verifiedAt === '');
plan = builder.update(plan, waterId, { verified: true, decision: 'recommend', producerReason: 'Verified policy provision and homeowner preference.' }, { updatedAt: '2026-08-09T01:04:00.000Z' });
const liabilityId = plan.items[1].id;
plan = builder.update(plan, liabilityId, { decision: 'consider' }, { updatedAt: '2026-08-09T01:05:00.000Z' });
const roofId = plan.items[2].id;
plan = builder.update(plan, roofId, { decision: 'defer' }, { updatedAt: '2026-08-09T01:06:00.000Z' });
const prepared = builder.prepareForSave(plan, { updatedAt: '2026-08-09T01:07:00.000Z' });
check('structured plan prepares a minimal persistence payload', prepared.valid && prepared.plan.items.length === 3 && !('detail' in prepared.plan.items[0]));
check('prepared summary records each producer judgment', prepared.plan.summary.recommend === 1 && prepared.plan.summary.consider === 1 && prepared.plan.summary.defer === 1);
check('prepared payload retains verification attestation and reasoning', prepared.plan.items[0].verified && prepared.plan.items[0].producerReason.includes('policy provision'));
const restored = builder.build(snapshot({ consultation: { id: 'consultation-gc16-123456', recommendationPlan: prepared.plan } }), prepared.plan);
check('saved judgments reconcile to current ranked findings', restored.items[0].decision === 'recommend' && restored.items[1].decision === 'consider' && restored.items[2].decision === 'defer');
check('non-ready Workspace fails safely', builder.build({ state: 'empty' }).state === 'empty' && builder.build({ state: 'empty' }).items.length === 0);

function memoryStorage() {
  const values = new Map();
  return { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); }, removeItem(key) { values.delete(key); }, values };
}
function report(id = 'consultation-gc16-123456') {
  return { version: '3.20.35', assessment: 'home', createdAt: '2026-08-09T00:00:00.000Z', score: 61, status: 'Review Recommended', topPriority: 'Water protection', strongest: 'Review complete', consumer: { name: 'Avery Homeowner', email: 'avery@example.com', propertyAddress: '408 Main St' }, consultationRecord: { id, createdAt: '2026-08-09T00:00:00.000Z' }, recommendations: input.recommendations };
}

const localStorage = memoryStorage();
records.upsert(report(), { storage: localStorage, now: () => new Date('2026-08-09T01:00:00.000Z') });
const localSaved = records.updateRecommendationPlan('consultation-gc16-123456', prepared.plan, { storage: localStorage, now: () => new Date('2026-08-09T01:08:00.000Z') });
check('browser-local plan persists inside the existing consultation record', localSaved.recommendationPlan.summary.recommend === 1 && records.get('consultation-gc16-123456', { storage: localStorage }).recommendationPlan.items.length === 3);
check('local consultation record module advances additively', ['1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && typeof records.updateRecommendationPlan === 'function');
const invalidLocal = records.updateRecommendationPlan('consultation-gc16-123456', { items: [{ findingId: 'water', title: 'Water', verified: false, decision: 'recommend', producerReason: '' }] }, { storage: localStorage });
check('local persistence rejects unsupported unverified recommendation', invalidLocal === null);

check('server consultation record advances for structured plans', ['1.6.0','1.7.0','1.8.0'].includes(RECORD_VERSION) && RECOMMENDATION_DECISIONS.join(',') === 'undecided,consider,recommend,defer,not_recommended');
check('server activity contract includes recommendation-plan updates', ACTIVITY_TYPES.includes('recommendation_plan_updated'));
const serverBase = normalizeRemoteRecord(report(), { submittedAt: '2026-08-09T01:00:00.000Z' });
const applied = applyRecommendationPlan(serverBase, prepared.plan, '2026-08-09T01:09:00.000Z');
check('server applies the plan without changing assessment or report', applied.recommendationPlan.summary.recommend === 1 && applied.assessment.score === serverBase.assessment.score && JSON.stringify(applied.report) === JSON.stringify(serverBase.report));
check('server records one redacted operational activity', applied.activity.at(-1).type === 'recommendation_plan_updated' && !applied.activity.at(-1).detail.includes('policy provision'));
check('legacy records normalize with a safe empty plan', normalizeStoredRecord({ ...serverBase, recommendationPlan: undefined }).recommendationPlan.state === 'empty');

function store(initial) {
  const rows = new Map(initial ? [[`records/${initial.id}`, clone(initial)]] : []);
  const writes = [];
  return { rows, writes, async get(key) { return clone(rows.get(key) || null); }, async setJSON(key, value, options = {}) { rows.set(key, clone(value)); writes.push({ key, value: clone(value), metadata: clone(options.metadata) }); } };
}
const token = 'producer_access_token_1234567890';
const endpoint = 'https://coveragefit.example/api/consultations/recommendations';
function request(body, options = {}) {
  return new Request(endpoint, { method: options.method || 'PATCH', headers: { Origin: options.origin || 'https://coveragefit.example', Authorization: `Bearer ${options.token || token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
const serverStore = store(serverBase);
const response = await handleConsultationRecommendations(request({ consultationId: serverBase.id, recommendationPlan: prepared.plan }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
const responseBody = await response.json();
check('secure recommendation endpoint persists a valid plan', response.status === 200 && responseBody.ok && serverStore.rows.get(`records/${serverBase.id}`).recommendationPlan.summary.recommend === 1);
check('secure response returns normalized recommendation state', responseBody.record.recommendationPlan.state === 'structured');
check('D1 metadata carries counts without recommendation content', serverStore.writes.at(-1).metadata.recommendationCount === 1 && !JSON.stringify(serverStore.writes.at(-1).metadata).includes('Verified policy'));
const unverifiedResponse = await handleConsultationRecommendations(request({ consultationId: serverBase.id, recommendationPlan: { items: [{ findingId: 'water', title: 'Water', decision: 'recommend', verified: false, producerReason: 'No verification.' }] } }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint rejects an unverified recommendation', unverifiedResponse.status === 422 && (await unverifiedResponse.json()).error.code === 'recommendation_verification_required');
const noReasonResponse = await handleConsultationRecommendations(request({ consultationId: serverBase.id, recommendationPlan: { items: [{ findingId: 'water', title: 'Water', decision: 'recommend', verified: true, producerReason: '' }] } }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint requires producer reasoning', noReasonResponse.status === 422 && (await noReasonResponse.json()).error.code === 'recommendation_reason_required');
const unauthorized = await handleConsultationRecommendations(request({ consultationId: serverBase.id, recommendationPlan: prepared.plan }, { token: 'wrong_token_123456789012345678' }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint requires producer authorization', unauthorized.status === 401);
const crossOrigin = await handleConsultationRecommendations(request({ consultationId: serverBase.id, recommendationPlan: prepared.plan }, { origin: 'https://attacker.example' }), { store: serverStore, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: token } });
check('secure endpoint enforces same origin', crossOrigin.status === 403);

let remoteCall = null;
let remoteUpdated = null;
const remoteResult = await remote.updateRecommendationPlan(serverBase.id, prepared.plan, {
  token,
  fetch: async (url, init) => {
    remoteCall = { url, init };
    return Response.json({ ok: true, record: { ...serverBase, recommendationPlan: prepared.plan } });
  },
  records: { updateRemote(id, recordValue) { remoteUpdated = { id, recordValue }; } },
  localStorage: memoryStorage()
});
check('remote consultation client advances additively', ['1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION) && typeof remote.updateRecommendationPlan === 'function');
check('remote client uses the existing consultation API family', remoteCall.url === '/api/consultations/recommendations' && remoteCall.init.method === 'PATCH');
check('remote client sends only consultation ID and structured plan', JSON.parse(remoteCall.init.body).consultationId === serverBase.id && JSON.parse(remoteCall.init.body).recommendationPlan.items.length === 3);
check('remote response updates the existing local consultation cache', remoteUpdated.id === serverBase.id && remoteResult.recommendationPlan.summary.recommend === 1);

const html = read('agent/workspace/index.html');
const workspace = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
const serverHandlers = read('server/cloudflare-pages-handlers.mjs');
check('Workspace loads one centralized Recommendation Builder module', (html.match(/recommendation-builder\.js/g) || []).length === 1 && html.includes('id="recommendationBuilder"'));
check('Recommendation Builder is part of the existing During phase', html.indexOf('id="recommendationBuilder"') > html.indexOf('id="consultationDuringTitle"') && html.indexOf('id="recommendationBuilder"') < html.indexOf('id="consultationAfterTitle"'));
check('Workspace exposes verification, judgment, reasoning, save, and guardrail controls', ['data-recommendation-field="verified"','data-recommendation-field="decision"','data-recommendation-field="producerReason"','saveRecommendationPlan','licensed producer verifies'].every(value => workspace.includes(value) || html.includes(value)));
check('Workspace never unlocks recommend before verification', workspace.includes("option.value === 'recommend' && !item.verified ? 'disabled'") && workspace.includes('Verified for advising'));
check('Workspace persists local and server-backed plans through existing consultation records', workspace.includes('remoteInbox.updateRecommendationPlan') && workspace.includes('data?.updateConsultationRecommendationPlan'));
check('secure endpoint is wired through the existing Cloudflare handler family', fs.existsSync(path.join(root, 'functions/api/consultations/recommendations.js')) && serverHandlers.includes('handleConsultationRecommendations'));
check('responsive beginner-friendly builder styling is present', css.includes('GC-1.6 — Recommendation Builder') && css.includes('.recommendation-builder-item__controls') && css.includes('grid-template-columns: 1fr'));
check('builder copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(read('assets/js/recommendation-builder.js') + html));
check('builder does not create another score or assessment engine', !read('assets/js/recommendation-builder.js').includes('CoverageFitProtectionScore') && !read('assets/js/recommendation-builder.js').includes('localStorage'));

check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('conversation planner remains unchanged from GC-1.5', hash('assets/js/conversation-planner.js') === '93315ad24415bf04ba411013d68410017187f78085fe925334311c89f37f2cfe');
check('consultation document retains GC-1.6 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));

console.log(`GC-1.6 QA: ${passed}/${passed} passed`);
