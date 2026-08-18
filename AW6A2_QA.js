const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
let checks = 0;

const engine = require(path.join(root, 'assets/js/print-engine.js'));
assert(/^0\.[2-9]\d*\.\d+$/.test(engine.VERSION)); checks += 1;
assert.strictEqual(engine.SCHEMA_VERSION, 1); checks += 1;
assert.strictEqual(engine.CONTRACT_VERSION, 1); checks += 1;
for (const method of ['buildModel', 'getModel', 'getSectionContracts', 'validateSection', 'validateModel']) {
  assert.strictEqual(typeof engine[method], 'function', `${method} must be public`); checks += 1;
}
assert(Object.isFrozen(engine), 'engine API must remain frozen'); checks += 1;

const contracts = engine.getSectionContracts();
assert(Object.isFrozen(contracts), 'contracts must be frozen'); checks += 1;
for (const name of ['metadata','customer','assessment','executiveSummary','strengths','propertySummary','recommendations','consultationChecklist','timeline','notes','attribution','diagnostics']) {
  assert(contracts[name], `${name} contract must exist`); checks += 1;
  assert(Object.isFrozen(contracts[name]), `${name} contract must be frozen`); checks += 1;
}
assert(contracts.metadata.requiredFields.includes('sourceVersions')); checks += 1;
assert(contracts.recommendations.itemRequiredFields.includes('sourceIds')); checks += 1;

const unknown = engine.validateSection('not-real', {});
assert.strictEqual(unknown.valid, false); checks += 1;
assert(unknown.errors[0].includes('Unknown')); checks += 1;
assert(Object.isFrozen(unknown)); checks += 1;

const badProperty = engine.validateSection('propertySummary', { available: 'yes', address: '123 Main' });
assert.strictEqual(badProperty.valid, false); checks += 1;
assert(badProperty.errors.some(error => error.includes('boolean'))); checks += 1;

const emptyRecommendations = engine.validateSection('recommendations', []);
assert.strictEqual(emptyRecommendations.valid, true); checks += 1;
assert.strictEqual(emptyRecommendations.warnings.length, 1); checks += 1;

const workspaceSnapshot = {
  schemaVersion: 1, adapterVersion: '1.0.0', product: 'Home', state: 'ready',
  customer: { name: 'Jordan Client' },
  assessment: { createdAt: null, score: 76, status: 'Strong Foundation', strongest: 'Dwelling review', topPriority: 'Liability' },
  executiveSummary: 'Review liability and property details.', strengths: ['Dwelling review complete'],
  property: { available: true, address: '45 Oak Ave' },
  recommendations: [{ title: 'Review liability', priority: 'High' }], attribution: null
};
const conversationPlan = {
  schemaVersion: 1, plannerVersion: '1.0.0', state: 'ready',
  summary: { topicCount: 1, agendaItemCount: 1, estimatedMinutes: 4, firstPriority: 'Review liability' },
  sections: [{ id: 'review', title: 'Review', estimatedMinutes: 4, items: [{ id: 'item-1', title: 'Review liability' }] }],
  items: [{ id: 'item-1', title: 'Review liability' }], questions: [], guardrails: []
};
const checklistState = {
  version: '1.0.0', summary: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0 },
  progress: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0, remainingMinutes: 4, completedPhases: 0, totalPhases: 1 },
  currentPhase: 'review', remainingMinutes: 4, plannerVersion: '1.0.0',
  checklist: { phases: [{ id: 'review', title: 'Review' }], items: [{ id: 'item-1', title: 'Review liability' }] }, diagnostics: { valid: true }
};
const model = engine.buildModel({ workspaceSnapshot, conversationPlan, checklistState, generatedAt: '2026-07-27T00:00:00.000Z' });
assert.strictEqual(model.engineVersion, engine.VERSION); checks += 1;
assert.strictEqual(model.schemaVersion, 1); checks += 1;
assert.strictEqual(model.diagnostics.validation.valid, true); checks += 1;
assert.strictEqual(model.diagnostics.validation.contractVersion, 1); checks += 1;
assert.strictEqual(model.diagnostics.validation.errorCount, 0); checks += 1;
assert(Object.isFrozen(model.diagnostics.validation)); checks += 1;
assert.strictEqual(model.recommendations[0].id, 'recommendation-1'); checks += 1;
assert.strictEqual(model.recommendations[0].category, ''); checks += 1;
assert(Array.isArray(model.recommendations[0].sourceIds)); checks += 1;

const validation = engine.validateModel(model);
assert.strictEqual(validation.valid, true); checks += 1;
assert.strictEqual(validation.errors.length, 0); checks += 1;
assert(Object.isFrozen(validation)); checks += 1;
assert(Object.isFrozen(validation.sections)); checks += 1;
assert(Object.isFrozen(validation.sections.metadata)); checks += 1;

const mutable = JSON.parse(JSON.stringify(model));
delete mutable.customer.name;
const invalid = engine.validateModel(mutable);
assert.strictEqual(invalid.valid, false); checks += 1;
assert(invalid.errors.some(error => error.includes('customer.name'))); checks += 1;

const wrongSchema = JSON.parse(JSON.stringify(model));
wrongSchema.schemaVersion = 99;
assert(engine.validateModel(wrongSchema).errors.some(error => error.includes('Unsupported'))); checks += 1;

{ const [major, minor, patch] = read('VERSION').trim().split('.').map(Number); assert(major > 3 || (major === 3 && (minor > 16 || (minor === 16 && patch >= 1)))); checks += 1; }
for (const file of ['SPRINT-AW-6A.2.md', 'AW6_PRINT_MODEL_CONTRACTS.md']) {
  assert(fs.existsSync(path.join(root, file)), `${file} must exist`); checks += 1;
}
const roadmap = read('ROADMAP.md');
assert(roadmap.includes('[x] AW-6A.2 Print Model Validation & Section Contracts')); checks += 1;
assert(roadmap.includes('AW-6A.3')); checks += 1;

console.log(JSON.stringify({ suite: 'AW-6A.2 Print Model Validation & Section Contracts', version: read('VERSION').trim(), checks, passed: checks }, null, 2));
