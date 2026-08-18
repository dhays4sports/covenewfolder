'use strict';
const assert = require('assert');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const modelFactory = require('./assets/js/print/models/executive-summary-model.js');
const section = require('./assets/js/print/sections/executive-summary.js');

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => freeze(value[key]));
  return Object.freeze(value);
}

const fullPrintModel = freeze({
  schemaVersion: 1,
  engineVersion: '0.3.0',
  generatedAt: '2026-07-27T00:00:00.000Z',
  metadata: {
    title: 'CoverageFit Consultation Sheet',
    product: 'Home',
    consultationDate: 'July 27, 2026',
    preparedBy: 'Dylan Haysbert',
    agency: 'Virginia Tam Insurance Agency'
  },
  customer: { name: 'Jordan Client', email: 'jordan@example.com', phone: '555-0100' },
  assessment: { score: 74, status: 'Review Recommended', strongest: 'Liability', topPriority: 'Water protection' },
  executiveSummary: 'The consultation identified a strong liability foundation and several property items to review.',
  strengths: ['Liability limits', 'Bundle readiness', 'Liability limits'],
  propertySummary: { available: true, address: '123 Main Street' },
  recommendations: [
    { id: 'r1', title: 'Water loss prevention' },
    { id: 'r2', title: 'Replacement cost review' },
    { id: 'r3', title: 'Umbrella discussion' },
    { id: 'r4', title: 'Additional item' }
  ],
  consultationChecklist: { available: true },
  timeline: { state: 'ready' }
});

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}

test('creates immutable executive summary model from real print-model fields', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.strictEqual(Object.isFrozen(model), true);
  assert.strictEqual(Object.isFrozen(model.client), true);
  assert.strictEqual(model.client.name, 'Jordan Client');
  assert.strictEqual(model.property.address, '123 Main Street');
  assert.strictEqual(model.protectionScore.value, 74);
  assert.strictEqual(model.consultation.preparedBy, 'Dylan Haysbert');
});

test('limits strengths and priorities to three unique items', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.deepStrictEqual(model.strengths, ['Liability limits', 'Bundle readiness']);
  assert.deepStrictEqual(model.priorities, ['Water loss prevention', 'Replacement cost review', 'Umbrella discussion']);
});

test('derives next steps from actual priorities and workflow state', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.strictEqual(model.nextSteps.length, 3);
  assert.strictEqual(model.nextSteps[0], 'Discuss Water loss prevention and confirm what the current policy says.');
});

test('partial data produces a stable model without invented client values', () => {
  const model = modelFactory.create(freeze({ metadata: { preparedBy: 'Dylan Haysbert' }, assessment: { score: 0 } }));
  assert.strictEqual(model.client.name, '');
  assert.strictEqual(model.property.address, '');
  assert.strictEqual(model.protectionScore.value, 0);
  assert.strictEqual(model.consultation.preparedBy, 'Dylan Haysbert');
});

test('empty input is valid but has no renderable content', () => {
  const model = modelFactory.create(freeze({}));
  assert.strictEqual(modelFactory.hasContent(model), false);
  assert.strictEqual(section.shouldRender(freeze({})), false);
});

test('section render returns the mapped model and diagnostics without HTML', () => {
  const output = section.render(fullPrintModel);
  assert.strictEqual(output.id, 'executive-summary');
  assert.ok(typeof output.html === 'string');
  assert.strictEqual(output.model.client.name, 'Jordan Client');
  assert.strictEqual(output.diagnostics.valid, true);
  assert.strictEqual(Object.isFrozen(output.model), true);
});

test('section remains registered through the real registry', () => {
  assert.strictEqual(registry.hasSection('executive-summary'), true);
  assert.ok(registry.getSection('executive-summary').version);
});

test('browser loads executive-summary model before section definition', () => {
  const fs = require('fs');
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/models/executive-summary-model.js') < html.indexOf('/assets/js/print/sections/executive-summary.js'));
});

const failed = results.filter(item => !item.ok);
console.log(JSON.stringify({ suite: 'P1.1.1 Executive Summary Data Model', passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
