'use strict';
const assert = require('assert');
const fs = require('fs');
const shell = require('./assets/js/print/report-shell.js');
const registry = require('./assets/js/print-renderers.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const model = Object.freeze({
  generatedAt: '2026-07-27T12:00:00.000Z',
  metadata: Object.freeze({
    title: 'CoverageFit Consultation Report',
    product: 'Home',
    consultationDate: '2026-07-27T12:00:00.000Z',
    preparedBy: 'Dylan Haysbert',
    agency: 'Virginia Tam Insurance Agency'
  }),
  customer: Object.freeze({ name: 'Alex & Jordan <Client>' }),
  propertySummary: Object.freeze({ address: '123 Main St & Oak Ave' })
});
const sectionOutputs = Object.freeze([
  Object.freeze({ id: 'executive-summary', html: '<section>Executive</section>' }),
  Object.freeze({ id: 'property-summary', html: '<section>Property</section>' })
]);
const output = shell.compose(sectionOutputs, model, {});

test('exposes report shell version', () => assert.ok(/^1\./.test(shell.VERSION)));
test('creates immutable shell output', () => assert.ok(Object.isFrozen(output) && Object.isFrozen(output.context)));
test('renders a professional cover by default', () => assert.ok(output.html.includes('data-print-shell="cover"')));
test('renders running header and footer chrome', () => {
  assert.ok(output.html.includes('cf-report-running-header'));
  assert.ok(output.html.includes('cf-report-running-footer'));
});
test('wraps composed sections in report body', () => {
  assert.ok(output.html.includes('data-print-shell="body"'));
  assert.ok(output.html.includes('<section>Executive</section>'));
  assert.ok(output.html.includes('<section>Property</section>'));
});
test('escapes client and property content', () => {
  assert.ok(output.html.includes('Alex &amp; Jordan &lt;Client&gt;'));
  assert.ok(output.html.includes('123 Main St &amp; Oak Ave'));
});
test('supports cover opt-out', () => assert.ok(!shell.compose(sectionOutputs, model, { includeCover: false }).html.includes('data-print-shell="cover"')));
test('reports accurate section count', () => assert.equal(output.sectionCount, 2));

test('HTML renderer consumes the report shell', () => {
  const htmlRenderer = registry.getRenderer('html');
  const fakeComposer = { compose() { return Object.freeze({ sections: Object.freeze([
    Object.freeze({ id: 'sample', definition: Object.freeze({ render() { return Object.freeze({ id: 'sample', html: '<section>Sample</section>' }); } }) })
  ]), hiddenSections: Object.freeze([]), diagnostics: Object.freeze({ valid: true }) }); } };
  const rendered = htmlRenderer.render(model, { documentComposer: fakeComposer });
  assert.ok(rendered.html.includes('cf-report-cover'));
  assert.ok(rendered.html.includes('<section>Sample</section>'));
  assert.ok(/^1\./.test(rendered.diagnostics.rendererVersion));
});
test('renderer advertises report-shell capability', () => assert.ok(registry.supports('html', 'report-shell')));

test('browser runtime loads shell before renderer', () => {
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/report-shell.js') < html.indexOf('/assets/js/print-renderers.js'));
});
test('print CSS includes cover and running chrome rules', () => {
  const source = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');
  assert.ok(source.includes('.cf-report-cover{'));
  assert.ok(source.includes('.cf-report-running-header'));
  assert.ok(source.includes('position:fixed'));
});
console.log(`P1.6.1 QA complete: ${passed} passed, 0 failed`);
