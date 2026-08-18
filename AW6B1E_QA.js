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
const rendererRegistry = require('./assets/js/print-renderers.js');

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => freeze(value[key]));
  return Object.freeze(value);
}
const fullModel = freeze({
  metadata: { title: 'Consultation' }, customer: { name: 'Client' }, assessment: { score: 80 },
  executiveSummary: 'Summary', propertySummary: { available: true, address: '123 Main St' },
  recommendations: [{ id: 'r1', title: 'Review' }],
  consultationChecklist: { available: true, items: [{}] }, timeline: { state: 'ready', items: [{}] }
});

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
}

test('HTML renderer advertises composed-section capability', () => {
  assert.strictEqual(rendererRegistry.supports('html', 'composed-sections'), true);
});
test('HTML renderer composes all visible sections in registry order', () => {
  const renderer = rendererRegistry.getRenderer('html');
  const output = renderer.render(fullModel, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.deepStrictEqual(output.sectionOutputs.map(item => item.id), registry.getRegisteredSections());
  assert.deepStrictEqual(output.document.sections.map(item => item.id), registry.getRegisteredSections());
  assert.strictEqual(output.diagnostics.renderedSectionCount, 6);
});
test('HTML renderer excludes hidden sections before section rendering', () => {
  const model = freeze({ metadata: { title: 'Consultation' } });
  const output = rendererRegistry.getRenderer('html').render(model, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.deepStrictEqual(output.sectionOutputs.map(item => item.id), ['metadata']);
  assert.strictEqual(output.diagnostics.hiddenSectionCount, 5);
});
test('HTML output is produced only from section render outputs', () => {
  const calls = [];
  const testRegistry = {
    getRegisteredSections(options) {
      if (options && options.entries) return [
        { id: 'alpha', metadata: { id: 'alpha', order: 1, name: 'Alpha', version: '1.0.0' }, definition: { id: 'alpha', order: 1, shouldRender: () => true, render() { calls.push('alpha'); return { id: 'alpha', html: '<section>A</section>' }; } } },
        { id: 'beta', metadata: { id: 'beta', order: 2, name: 'Beta', version: '1.0.0' }, definition: { id: 'beta', order: 2, shouldRender: () => true, render() { calls.push('beta'); return '<section>B</section>'; } } }
      ];
      return ['alpha', 'beta'];
    },
    getSection() { return null; }, getSectionMetadata() { return null; }
  };
  const output = rendererRegistry.getRenderer('html').render(freeze({}), { sectionRegistry: testRegistry, visibilityEngine: visibility });
  assert.deepStrictEqual(calls, ['alpha', 'beta']);
  assert.ok(output.html.includes('<section>A</section>'));
  assert.ok(output.html.includes('<section>B</section>'));
  assert.ok(output.html.indexOf('<section>A</section>') < output.html.indexOf('<section>B</section>'));
});
test('renderer rejects invalid section output', () => {
  const testRegistry = {
    getRegisteredSections(options) {
      if (options && options.entries) return [{ id: 'bad', metadata: { id: 'bad', order: 1 }, definition: { id: 'bad', order: 1, shouldRender: () => true, render: () => null } }];
      return ['bad'];
    }, getSection() { return null; }, getSectionMetadata() { return null; }
  };
  assert.throws(() => rendererRegistry.getRenderer('html').render(freeze({}), { sectionRegistry: testRegistry, visibilityEngine: visibility }), e => e.code === 'PRINT_SECTION_OUTPUT_INVALID');
});
test('renderer output and diagnostics are immutable', () => {
  const output = rendererRegistry.getRenderer('html').render(fullModel, { sectionRegistry: registry, visibilityEngine: visibility });
  assert.strictEqual(Object.isFrozen(output), true);
  assert.strictEqual(Object.isFrozen(output.sectionOutputs), true);
  assert.strictEqual(Object.isFrozen(output.diagnostics), true);
});
test('browser workspace loads composer before renderer and renderer before engine', () => {
  const fs = require('fs');
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/document-composer.js') < html.indexOf('/assets/js/print-renderers.js'));
  assert.ok(html.indexOf('/assets/js/print-renderers.js') < html.indexOf('/assets/js/print-engine.js'));
});

const failed = results.filter(item => !item.ok);
console.log(JSON.stringify({ suite: 'AW-6B.1E Renderer Integration', passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
