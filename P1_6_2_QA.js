'use strict';
const assert = require('assert');
const fs = require('fs');
const shell = require('./assets/js/print/report-shell.js');
const registry = require('./assets/js/print-renderers.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const model = Object.freeze({
  id: 'snapshot-42',
  generatedAt: '2026-07-27T12:00:00.000Z',
  metadata: Object.freeze({
    title: 'CoverageFit Consultation Report',
    product: 'Home',
    consultationDate: '2026-07-27T12:00:00.000Z',
    preparedBy: 'Dylan Haysbert',
    producerTitle: 'Insurance Producer',
    producerLicense: '#4528400',
    producerPhone: '(408) 327-6377',
    producerEmail: 'dylan@example.com',
    agency: 'Virginia Tam Insurance Agency',
    agencyAddress: '833 Corporate Way, Fremont, CA 94539',
    reportId: 'CF-2026-0042'
  }),
  customer: Object.freeze({ name: 'Alex & Jordan <Client>' }),
  propertySummary: Object.freeze({ address: '123 Main St & Oak Ave' })
});
const sections = Object.freeze([Object.freeze({ id: 'sample', html: '<section>Sample</section>' })]);
const output = shell.compose(sections, model, {});

test('advances report shell version', () => assert.ok(/^1\./.test(shell.VERSION)));
test('maps producer and agency metadata into immutable context', () => {
  assert.ok(Object.isFrozen(output.context));
  assert.equal(output.context.producerPhone, '(408) 327-6377');
  assert.equal(output.context.producerEmail, 'dylan@example.com');
  assert.equal(output.context.agencyAddress, '833 Corporate Way, Fremont, CA 94539');
});
test('maps stable report reference', () => assert.equal(output.context.reportId, 'CF-2026-0042'));
test('cover includes producer role and license', () => {
  assert.ok(output.html.includes('Insurance Producer'));
  assert.ok(output.html.includes('License #4528400'));
});
test('cover includes contact and agency address', () => {
  assert.ok(output.html.includes('(408) 327-6377'));
  assert.ok(output.html.includes('dylan@example.com'));
  assert.ok(output.html.includes('833 Corporate Way, Fremont, CA 94539'));
});
test('cover includes report reference', () => assert.ok(output.html.includes('CF-2026-0042')));
test('running header includes document and subject context', () => {
  assert.ok(output.html.includes('cf-shell-running-document'));
  assert.ok(output.html.includes('Consultation Report'));
  assert.ok(output.html.includes('123 Main St &amp; Oak Ave'));
});
test('running footer includes owner, contact, reference, and confidentiality', () => {
  assert.ok(output.html.includes('cf-shell-running-owner'));
  assert.ok(output.html.includes('cf-shell-running-contact'));
  assert.ok(output.html.includes('Ref CF-2026-0042'));
  assert.ok(output.html.includes('cf-shell-running-confidential'));
});
test('shell escapes all shared metadata', () => {
  const unsafe = shell.compose(sections, { metadata: { producerPhone: '<phone>', agency: 'A&B', reportId: '<id>' }, customer: { name: '<name>' } }, {});
  assert.ok(unsafe.html.includes('&lt;phone&gt;'));
  assert.ok(unsafe.html.includes('A&amp;B'));
  assert.ok(unsafe.html.includes('Ref &lt;id&gt;'));
});
test('missing optional contact metadata renders without placeholders', () => {
  const sparse = shell.compose(sections, { metadata: {}, customer: { name: 'Client' } }, {});
  assert.ok(!sparse.html.includes('cf-shell-cover-contact'));
  assert.ok(sparse.html.includes('Consultation Report'));
});
test('shell preserves cover opt-out', () => assert.ok(!shell.compose(sections, model, { includeCover: false }).html.includes('data-print-shell="cover"')));
test('HTML renderer consumes enhanced shared shell', () => {
  const htmlRenderer = registry.getRenderer('html');
  const fakeComposer = { compose() { return Object.freeze({ sections: Object.freeze([
    Object.freeze({ id: 'sample', definition: Object.freeze({ render() { return Object.freeze({ id: 'sample', html: '<section>Sample</section>' }); } }) })
  ]), hiddenSections: Object.freeze([]), diagnostics: Object.freeze({ valid: true }) }); } };
  const rendered = htmlRenderer.render(model, { documentComposer: fakeComposer });
  assert.ok(rendered.html.includes('Ref CF-2026-0042'));
  assert.ok(/^1\./.test(rendered.diagnostics.rendererVersion));
});
test('print CSS supports structured shared chrome', () => {
  const source = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');
  assert.ok(source.includes('grid-template-columns:auto 1fr auto'));
  assert.ok(source.includes('cf-shell-running-contact'));
  assert.ok(source.includes('cf-shell-cover-contact'));
});
test('browser runtime still loads shell before renderer', () => {
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/report-shell.js') < html.indexOf('/assets/js/print-renderers.js'));
});
console.log(`P1.6.2 QA complete: ${passed} passed, 0 failed`);
