'use strict';
const assert = require('assert');
const fs = require('fs');
const shell = require('./assets/js/print/report-shell.js');
const registry = require('./assets/js/print-renderers.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const model = Object.freeze({
  id: 'snapshot-43',
  generatedAt: '2026-07-27T12:00:00.000Z',
  metadata: Object.freeze({ reportId: 'CF-2026-0043', agency: 'Virginia Tam Insurance Agency' }),
  customer: Object.freeze({ name: 'Alex Client' }),
  propertySummary: Object.freeze({ address: '123 Main St' })
});
const sections = Object.freeze([Object.freeze({ id: 'sample', html: '<section class="cf-print-section">Sample</section>' })]);
const output = shell.compose(sections, model, {});

test('advances report shell version', () => assert.ok(/^1\.[2-9]\./.test(shell.VERSION)));
test('page numbering is enabled by default', () => {
  assert.equal(output.includePageNumbers, true);
  assert.equal(output.pageNumberingMode, 'css-paged-media');
});
test('running footer includes page-number placeholder', () => {
  assert.ok(output.html.includes('data-print-shell="page-number"'));
  assert.ok(output.html.includes('cf-shell-running-page'));
  assert.ok(output.html.includes('>Page<'));
});
test('footer advertises CSS paged-media mode', () => assert.ok(output.html.includes('data-page-numbering="css-paged-media"')));
test('page numbering can be disabled cleanly', () => {
  const disabled = shell.compose(sections, model, { includePageNumbers: false });
  assert.equal(disabled.includePageNumbers, false);
  assert.equal(disabled.pageNumberingMode, 'disabled');
  assert.ok(!disabled.html.includes('data-print-shell="page-number"'));
  assert.ok(disabled.html.includes('data-page-numbering="disabled"'));
});
test('custom page label is escaped', () => {
  const custom = shell.compose(sections, model, { pageLabel: '<Pg>' });
  assert.ok(custom.html.includes('&lt;Pg&gt;'));
  assert.ok(!custom.html.includes('><Pg><'));
});
test('renderer version advances', () => assert.ok(/^1\.(?:[5-9]|10|11|12|13|14|15)\./.test(registry.getRenderer('html').version)));
test('renderer exposes paged-media capability', () => assert.ok(registry.getRenderer('html').capabilities.includes('paged-media-page-counters')));
test('print CSS contains current and total page counters', () => {
  const source = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');
  assert.ok(source.includes('counter(page)'));
  assert.ok(source.includes('counter(pages)'));
});
test('print CSS supports five-column paged footer', () => {
  const source = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');
  assert.ok(source.includes('cf-report-running-footer-paged'));
  assert.ok(source.includes('grid-template-columns:auto minmax(0,1fr) auto auto auto'));
});
test('last report section does not force trailing blank page', () => {
  const source = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');
  assert.ok(source.includes('.cf-report-body>.cf-print-section:last-child{break-after:auto;page-break-after:auto}'));
});
test('HTML renderer carries page-counter shell output', () => {
  const htmlRenderer = registry.getRenderer('html');
  const fakeComposer = { compose() { return Object.freeze({ sections: Object.freeze([
    Object.freeze({ id: 'sample', definition: Object.freeze({ render() { return Object.freeze({ id: 'sample', html: '<section class="cf-print-section">Sample</section>' }); } }) })
  ]), hiddenSections: Object.freeze([]), diagnostics: Object.freeze({ valid: true }) }); } };
  const rendered = htmlRenderer.render(model, { documentComposer: fakeComposer });
  assert.ok(rendered.html.includes('data-print-shell="page-number"'));
  assert.ok(/^1\.(?:[5-9]|10|11|12|13|14|15)\./.test(rendered.diagnostics.rendererVersion));
});
console.log(`P1.6.3 QA complete: ${passed} passed, 0 failed`);
