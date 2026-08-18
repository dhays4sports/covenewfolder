'use strict';
const assert = require('assert');
const registry = require('./assets/js/print-sections.js');
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
const model = Object.freeze({
  metadata: Object.freeze({ title: 'Consultation' }),
  customer: Object.freeze({ name: 'Client' }),
  assessment: Object.freeze({ score: 80 }),
  executiveSummary: 'Summary',
  propertySummary: Object.freeze({ available: true, address: '123 Main St' }),
  recommendations: Object.freeze([Object.freeze({ id: 'r1', title: 'Review' })]),
  consultationChecklist: Object.freeze({ available: true, items: Object.freeze([Object.freeze({ id: 'c1', title: 'Checklist item', phaseId: 'general' })]), phases: Object.freeze([]) }),
  timeline: Object.freeze({ state: 'ready', items: Object.freeze([Object.freeze({ id: 't1', phase: 'general', title: 'Timeline item' })]), sections: Object.freeze([]) })
});

test('all six section definitions register at runtime', () => {
  assert.deepStrictEqual(registry.getRegisteredSections(), [
    'executive-summary', 'property-summary', 'recommendations',
    'checklist', 'timeline', 'metadata'
  ]);
});
test('composer exports public API', () => assert.strictEqual(typeof composer.compose, 'function'));
test('composer rejects mutable models', () => {
  assert.throws(() => composer.compose({}, { sectionRegistry: registry }), e => e.code === 'PRINT_MODEL_MUTABLE');
});
test('composer returns ordered structured sections without rendering HTML', () => {
  const document = composer.compose(model, { sectionRegistry: registry });
  assert.strictEqual(document.state, 'composed');
  assert.strictEqual(document.sections.length, 6);
  assert.deepStrictEqual(document.sections.map(s => s.id), registry.getRegisteredSections());
  document.sections.forEach(section => assert.strictEqual(typeof section.definition.render, 'function'));
});
test('composed document is deeply immutable', () => {
  const document = composer.compose(model, { sectionRegistry: registry });
  assert.strictEqual(Object.isFrozen(document), true);
  assert.strictEqual(Object.isFrozen(document.sections), true);
  assert.strictEqual(Object.isFrozen(document.diagnostics), true);
});
test('composer returns an empty document when registry is empty', () => {
  registry.clearRegistry();
  const document = composer.compose(model, { sectionRegistry: registry });
  assert.strictEqual(document.state, 'empty');
  assert.strictEqual(document.sections.length, 0);
});

const failed = results.filter(r => !r.ok);
console.log(JSON.stringify({ suite: 'AW-6B.1C Document Composer', passed: results.length-failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
