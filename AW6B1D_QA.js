'use strict';
const assert = require('assert');
const registry = require('./assets/js/print-sections.js');
const visibility = require('./assets/js/print-visibility.js');
registry.clearRegistry();
[
  'executive-summary', 'property-summary', 'recommendations',
  'checklist', 'timeline', 'metadata'
].forEach(name => require(`./assets/js/print/sections/${name}.js`));
const composer = require('./assets/js/document-composer.js');

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => freeze(value[key]));
  return Object.freeze(value);
}
const fullModel = freeze({
  metadata: { title: 'Consultation' },
  customer: { name: 'Client' },
  assessment: { score: 80 },
  executiveSummary: 'Summary',
  propertySummary: { available: true, address: '123 Main St' },
  recommendations: [{ id: 'r1', title: 'Review' }],
  consultationChecklist: { available: true, items: [{}] },
  timeline: { state: 'ready', items: [{}] }
});

test('visibility engine exports public API', () => {
  assert.strictEqual(typeof visibility.evaluateSection, 'function');
  assert.strictEqual(typeof visibility.evaluateSections, 'function');
});
test('all populated sections are visible', () => {
  const document = composer.compose(fullModel, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.strictEqual(document.sections.length, 6);
  assert.strictEqual(document.hiddenSections.length, 0);
  assert.strictEqual(document.diagnostics.visibleSectionCount, 6);
});
test('missing section data hides sections deterministically', () => {
  const model = freeze({ metadata: { title: 'Consultation' } });
  const document = composer.compose(model, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.deepStrictEqual(document.sections.map(item => item.id), ['metadata']);
  assert.strictEqual(document.hiddenSections.length, 5);
});
test('hidden sections include immutable empty-state decisions', () => {
  const model = freeze({ metadata: { title: 'Consultation' } });
  const document = composer.compose(model, { sectionRegistry: registry, visibilityEngine: visibility });
  const property = document.hiddenSections.find(item => item.id === 'property-summary');
  assert.strictEqual(property.visibility.visible, false);
  assert.ok(property.visibility.emptyState.message);
  assert.strictEqual(Object.isFrozen(property.visibility.emptyState), true);
});
test('section rule exceptions fail closed and are diagnosed', () => {
  const decision = visibility.evaluateSection({
    id: 'broken',
    shouldRender() { throw new Error('boom'); }
  }, fullModel);
  assert.strictEqual(decision.visible, false);
  assert.strictEqual(decision.reason, 'visibility-rule-error');
  assert.strictEqual(decision.error.message, 'boom');
});
test('composed visibility output is deeply immutable', () => {
  const document = composer.compose(fullModel, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.strictEqual(Object.isFrozen(document.hiddenSections), true);
  assert.strictEqual(Object.isFrozen(document.diagnostics.visibility), true);
  assert.strictEqual(Object.isFrozen(document.sections[0].visibility), true);
});
test('all-hidden model returns empty document state', () => {
  const document = composer.compose(freeze({}), { sectionRegistry: registry, visibilityEngine: visibility });
  assert.strictEqual(document.state, 'empty');
  assert.strictEqual(document.sections.length, 0);
  assert.strictEqual(document.hiddenSections.length, 6);
});

const failed = results.filter(result => !result.ok);
console.log(JSON.stringify({ suite: 'AW-6B.1D Visibility Engine', passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
