import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const records = require('./assets/js/consultation-records.js');
globalThis.CoverageFitConsultationRecords = records;
const workspaceData = require('./assets/js/workspace-data.js');
const planner = require('./assets/js/conversation-planner.js');
const checklist = require('./assets/js/consultation-checklist.js');

check('release remains compatible after CoverageFit 3.20.47', ['3.20.47', '3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Workspace data exposes exact-record hydration', ['1.4.0','1.5.0'].includes(workspaceData.VERSION) && typeof workspaceData.getConsultation === 'function');
check('Conversation Planner carries consultation identity additively', planner.VERSION === '1.2.0');
check('Checklist engine advances with record-specific persistence', ['0.6.0','0.7.0'].includes(checklist.VERSION));

const report = {
  assessment: 'home',
  version: 'pc-1.1-fixture',
  createdAt: '2026-08-09T10:00:00.000Z',
  status: 'Review Recommended',
  score: 64,
  strongest: 'Liability information was provided',
  topPriority: 'Confirm the rebuilding amount',
  consumer: {
    name: 'Alex Homeowner',
    email: 'alex@example.test',
    phone: '4085550100',
    propertyAddress: '100 Example Street, Fremont, CA 94539',
    reviewContext: 'Current policy renewal'
  },
  prospectReport: { id: 'report_pc11_fixture' },
  recommendations: [{
    ruleId: 'rebuild-amount',
    title: 'Rebuilding amount',
    priority: 'High priority',
    clientExplanation: 'Confirm the amount against current property details.',
    conversationStarter: 'Can we compare the current rebuilding amount with the home details?'
  }],
  answers: [{
    key: 'rebuild-amount',
    title: 'Rebuilding amount',
    answer: 'Not sure',
    evidenceQuality: 'needs-verification',
    evidencePrompt: 'Compare the current declarations page with current property details.'
  }],
  propertyProfile: { address: '100 Example Street, Fremont, CA 94539' }
};

const recordStorage = new MemoryStorage();
const saved = records.upsert(report, {
  storage: recordStorage,
  id: 'consultation-pc11-alex-homeowner',
  now: () => new Date('2026-08-09T10:00:00.000Z')
});
check('fixture saves through the canonical consultation store', saved?.id === 'consultation-pc11-alex-homeowner');
const summaries = workspaceData.listConsultations({ storage: recordStorage });
check('queue records remain intentionally lightweight', summaries.length === 1 && !Object.prototype.hasOwnProperty.call(summaries[0], 'report'));
const hydrated = workspaceData.getConsultation(saved.id, { storage: recordStorage });
check('exact-record hydration restores the full saved assessment', hydrated?.report?.prospectReport?.id === 'report_pc11_fixture');
check('unknown record hydration fails safely', workspaceData.getConsultation('consultation-missing-record', { storage: recordStorage }) === null);

function snapshot(consultationId) {
  return {
    state: 'ready',
    consultation: consultationId ? { id: consultationId } : null,
    customer: { name: 'Alex Homeowner', propertyAddress: '100 Example Street, Fremont, CA 94539', reviewContext: 'Current policy renewal' },
    assessment: { score: 64, status: 'Review Recommended', strongest: 'Liability information was provided', topPriority: 'Confirm the rebuilding amount' },
    property: { available: true, address: '100 Example Street, Fremont, CA 94539', confirmation: { requiresConfirmation: true } },
    recommendations: [{ id: 'rebuild-amount', title: 'Rebuilding amount', priority: 'High priority', explanation: 'Confirm the amount.', conversationStarter: 'Can we confirm the rebuilding amount?', evidenceQuality: 'needs-verification' }],
    evidenceHandoff: { summary: { confirmed: 0, verification: 1, unresolved: 0 }, confirmedFacts: [], verificationItems: [], unresolvedQuestions: [] }
  };
}

const planA = planner.getPlan(snapshot('consultation-pc11-alex-a'));
const planB = planner.getPlan(snapshot('consultation-pc11-alex-b'));
check('planner preserves the opaque consultation ID', planA.consultationId === 'consultation-pc11-alex-a' && planB.consultationId === 'consultation-pc11-alex-b');
const generatedA = checklist.generateFromPlan(planA, { now: () => new Date('2026-08-09T10:01:00.000Z') });
const generatedB = checklist.generateFromPlan(planB, { now: () => new Date('2026-08-09T10:01:00.000Z') });
check('similar consultations receive different checklist identities', generatedA.checklistId !== generatedB.checklistId);
check('checklist identity does not expose the consultation ID', !generatedA.checklistId.includes('pc11-alex-a'));

const checklistStorage = new MemoryStorage();
checklist.restoreFromPlan(planA, { storage: checklistStorage, now: () => new Date('2026-08-09T10:02:00.000Z') });
const firstItem = checklist.getWorkspaceState().checklist.items[0];
checklist.complete(firstItem.id, { storage: checklistStorage, now: () => new Date('2026-08-09T10:03:00.000Z') });
check('consultation A saves working progress', checklist.getWorkspaceState().summary.completed === 1);
checklist.restoreFromPlan(planB, { storage: checklistStorage, now: () => new Date('2026-08-09T10:04:00.000Z') });
check('consultation B does not inherit consultation A progress', checklist.getWorkspaceState().summary.completed === 0);
checklist.restoreFromPlan(planA, { storage: checklistStorage, now: () => new Date('2026-08-09T10:05:00.000Z') });
check('consultation A progress restores after returning', checklist.getWorkspaceState().summary.completed === 1 && checklist.getWorkspaceState().checklist.persistence.restored === true);

const legacyPlanA = planner.getPlan(snapshot(''));
const legacyPlanB = planner.getPlan(snapshot(''));
check('legacy report-only checklist fallback remains deterministic', checklist.generateFromPlan(legacyPlanA).checklistId === checklist.generateFromPlan(legacyPlanB).checklistId);

const workspaceSource = read('assets/js/agent-workspace.js');
check('Workspace hydrates an active summary before report actions', /data\.getConsultation\(activeId\) \|\| summary/.test(workspaceSource));
check('customer report action still requires a real saved report', /const enabled = snapshot\?\.state === 'ready' && Boolean\(record\?\.report\)/.test(workspaceSource));
check('customer report preview still uses the selected record payload', /cacheCustomerReportPreview\(record\)/.test(workspaceSource) && /JSON\.stringify\(report\)/.test(workspaceSource));
check('consultation document still resolves the requested canonical record', /records\.get\(requested, \{ storage: root\.localStorage \}\)/.test(read('assets/js/consultation-document.js')));
check('no unsupported insurance outcome was introduced', !/guaranteed discount|guaranteed rate|underwriting approved|coverage approved|you qualify/i.test(read('SPRINT-PC-1.1.md')));
check('PC-1.1 documentation is complete', read('CHANGELOG.md').includes('## 3.20.47 — PC-1.1 End-to-End Consultation Workflow Audit') && read('ROADMAP.md').includes('PC-1.1 End-to-End Consultation Workflow Audit — Complete (3.20.47)'));

for (const relative of ['assets/js/conversation-planner.js', 'assets/js/consultation-checklist.js', 'assets/js/workspace-data.js', 'assets/js/agent-workspace.js']) {
  new Function(read(relative));
}
check('modified browser modules pass syntax validation', true);

console.log(JSON.stringify({
  suite: 'PC-1.1 End-to-End Consultation Workflow Audit',
  version: read('VERSION').trim(),
  passed: checks.length,
  failed: 0,
  checks
}, null, 2));
