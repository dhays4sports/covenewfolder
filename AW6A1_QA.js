const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
let checks = 0;

const enginePath = path.join(root, 'assets/js/print-engine.js');
assert(fs.existsSync(enginePath), 'print engine must exist'); checks += 1;
const source = read('assets/js/print-engine.js');
for (const phrase of ['CoverageFitPrintEngine', 'const VERSION =', 'buildModel', 'getModel: buildModel', 'deepFreeze']) {
  assert(source.includes(phrase), `print engine must include ${phrase}`); checks += 1;
}
assert(!source.includes('innerHTML'), 'engine must not generate HTML'); checks += 1;
assert(!source.includes('window.print'), 'engine must not invoke browser print'); checks += 1;
assert(!source.includes('document.'), 'engine must not depend on the DOM'); checks += 1;

const workspaceHtml = read('agent/workspace/index.html');
assert(workspaceHtml.includes('/assets/js/print-engine.js'), 'Workspace must load print engine'); checks += 1;
assert(workspaceHtml.indexOf('/assets/js/print-engine.js') < workspaceHtml.indexOf('/assets/js/agent-workspace.js'), 'print engine must load before Workspace UI'); checks += 1;

const engine = require(enginePath);
assert(Object.isFrozen(engine), 'public engine API must be frozen'); checks += 1;
assert(/^0\.[1-9]\d*\.\d+$/.test(engine.VERSION), 'engine version must remain a compatible 0.x release'); checks += 1;
assert.strictEqual(engine.SCHEMA_VERSION, 1); checks += 1;

const workspaceSnapshot = {
  schemaVersion: 1,
  adapterVersion: '1.0.0',
  product: 'Home',
  state: 'ready',
  customer: { name: 'Alex Customer', email: 'alex@example.com' },
  assessment: { score: 82, status: 'Strong Foundation', topPriority: 'Liability limits' },
  executiveSummary: 'Review liability limits and confirm property details.',
  strengths: ['Replacement cost review completed'],
  property: { available: true, address: '123 Main St', yearBuilt: 1998, livingArea: 2100 },
  recommendations: [{ id: 'liability', title: 'Review liability limits', priority: 'High', summary: 'Confirm limits.' }],
  attribution: { source: 'test' }
};
const conversationPlan = {
  schemaVersion: 1,
  plannerVersion: '1.0.0',
  state: 'ready',
  summary: { topicCount: 1, agendaItemCount: 1, estimatedMinutes: 5, firstPriority: 'Review liability limits' },
  sections: [{ id: 'review', title: 'Review priorities', estimatedMinutes: 5, items: [{ id: 'topic-1', phase: 'review', title: 'Review liability limits', estimatedMinutes: 5, prompt: 'What limits do you carry?' }] }],
  items: [{ id: 'topic-1', phase: 'review', title: 'Review liability limits', estimatedMinutes: 5 }],
  questions: ['What limits do you carry?'],
  guardrails: ['Educational discussion only.']
};
const checklistState = {
  version: '1.0.0',
  summary: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0 },
  progress: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0, remainingMinutes: 5, completedPhases: 0, totalPhases: 1 },
  currentPhase: 'review',
  remainingMinutes: 5,
  plannerVersion: '1.0.0',
  checklist: { phases: [{ id: 'review', title: 'Review priorities' }], items: [{ id: 'topic-1', phaseId: 'review', title: 'Review liability limits', status: 'active', estimatedMinutes: 5 }] },
  diagnostics: { valid: true }
};
const model = engine.buildModel({
  workspaceSnapshot,
  conversationPlan,
  checklistState,
  generatedAt: '2026-07-27T00:00:00.000Z'
});
assert.strictEqual(model.schemaVersion, 1); checks += 1;
assert.strictEqual(model.engineVersion, engine.VERSION); checks += 1;
assert.strictEqual(model.state, 'ready'); checks += 1;
assert.strictEqual(model.customer.name, 'Alex Customer'); checks += 1;
assert.strictEqual(model.propertySummary.address, '123 Main St'); checks += 1;
assert.strictEqual(model.recommendations.length, 1); checks += 1;
assert.strictEqual(model.timeline.items.length, 1); checks += 1;
assert.strictEqual(model.consultationChecklist.items.length, 1); checks += 1;
assert.strictEqual(model.notes.available, false); checks += 1;
assert.strictEqual(model.diagnostics.valid, true); checks += 1;
assert(Object.isFrozen(model), 'print model root must be frozen'); checks += 1;
assert(Object.isFrozen(model.metadata), 'print model metadata must be frozen'); checks += 1;
assert(Object.isFrozen(model.recommendations), 'print model recommendations must be frozen'); checks += 1;
assert(Object.isFrozen(model.consultationChecklist.items[0]), 'nested checklist items must be frozen'); checks += 1;
workspaceSnapshot.customer.name = 'Changed';
assert.strictEqual(model.customer.name, 'Alex Customer', 'model must not retain mutable source references'); checks += 1;

const empty = engine.buildModel({ workspaceSnapshot: { state: 'empty' }, conversationPlan: { state: 'empty' }, checklistState: null, generatedAt: '2026-07-27T00:00:00.000Z' });
assert.strictEqual(empty.state, 'empty'); checks += 1;
assert.strictEqual(empty.diagnostics.valid, false); checks += 1;
assert(empty.diagnostics.warnings.length > 0, 'empty model must include diagnostics'); checks += 1;

{ const [major, minor] = read('VERSION').trim().split('.').map(Number); assert(major > 3 || (major === 3 && minor >= 16), 'project version must be 3.16.0 or newer'); checks += 1; }
for (const file of ['SPRINT-AW-6A.1.md', 'AW6_PRINT_ENGINE.md']) {
  assert(fs.existsSync(path.join(root, file)), `${file} must exist`); checks += 1;
}

console.log(JSON.stringify({ suite: 'AW-6A.1 Print Engine Skeleton', version: read('VERSION').trim(), checks, passed: checks }, null, 2));
