'use strict';
const assert = require('assert');
const fs = require('fs');
const sectionRegistry = require('./assets/js/print-sections.js');
const visibility = require('./assets/js/print-visibility.js');
const rendererRegistry = require('./assets/js/print-renderers.js');
const shell = require('./assets/js/print/report-shell.js');

sectionRegistry.clearRegistry();
['executive-summary','property-summary','recommendations','checklist','timeline','metadata']
  .forEach(name => require(`./assets/js/print/sections/${name}.js`));

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach(key => freeze(value[key]));
  return Object.freeze(value);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const model = freeze({
  id: 'snapshot-certified-001',
  generatedAt: '2026-07-27T12:00:00.000Z',
  metadata: {
    title: 'CoverageFit Consultation Report', product: 'Home', consultationDate: '2026-07-27T12:00:00.000Z',
    preparedBy: 'Dylan Haysbert', producerTitle: 'Insurance Producer', producerLicense: '#4528400',
    producerPhone: '(408) 327-6377', producerEmail: 'dylan@example.com', agency: 'Virginia Tam Insurance Agency',
    agencyAddress: '833 Corporate Way, Fremont, CA 94539', reportId: 'CF-CERT-001'
  },
  customer: { name: 'Alex Client' },
  assessment: { score: 82, status: 'Strong Foundation' },
  executiveSummary: 'A structured review of the client’s current protection plan.',
  propertySummary: { available: true, address: '123 Main St, Fremont, CA 94539', yearBuilt: 1998, squareFeet: 2100 },
  recommendations: [{ id: 'r1', title: 'Review liability limits', priority: 'high', category: 'liability', whyItMatters: 'Protect assets.', suggestedReview: 'Compare current limits.' }],
  consultationChecklist: { available: true, currentPhase: 'coverage', items: [{ id: 'c1', title: 'Confirm goals', status: 'active', phase: 'coverage' }] },
  timeline: { state: 'ready', items: [{ id: 't1', title: 'Confirm goals', phase: 'coverage' }] }
});

const htmlRenderer = rendererRegistry.getRenderer('html');
const output = htmlRenderer.render(model, { sectionRegistry, visibilityEngine: visibility });

test('advances certified shell version', () => assert.equal(shell.VERSION, '1.3.0'));
test('HTML renderer version remains compatible', () => assert.ok(['1.8.0', '1.9.0', '1.10.0','1.11.0','1.12.0','1.13.0','1.14.0','1.15.0'].includes(htmlRenderer.version)));
test('certifies HTML renderer metadata for production use', () => {
  const metadata = rendererRegistry.getRendererMetadata('html');
  assert.equal(metadata.production, true);
  assert.equal(metadata.certified, true);
});
test('renders all six registered report sections', () => assert.equal(output.diagnostics.renderedSectionCount, 6));
test('preserves canonical section order', () => assert.deepStrictEqual(output.sectionOutputs.map(s => s.id), sectionRegistry.getRegisteredSections()));
test('produces complete document shell chrome', () => {
  assert.ok(output.html.includes('data-print-shell="cover"'));
  assert.ok(output.html.includes('data-print-shell="header"'));
  assert.ok(output.html.includes('data-print-shell="footer"'));
  assert.ok(output.html.includes('data-print-shell="body"'));
});
test('certifies complete report shell', () => {
  assert.equal(output.diagnostics.reportShellValid, true);
  assert.equal(output.diagnostics.reportShellCertified, true);
  assert.deepStrictEqual(output.diagnostics.reportShellWarnings, []);
});
test('propagates shell identity into renderer diagnostics', () => assert.equal(output.diagnostics.reportShellVersion, '1.3.0'));
test('propagates page-numbering mode', () => assert.equal(output.diagnostics.pageNumberingMode, 'css-paged-media'));
test('shell diagnostics are deeply immutable', () => {
  const direct = shell.compose(output.sectionOutputs, model, {});
  assert.ok(Object.isFrozen(direct.diagnostics));
  assert.ok(Object.isFrozen(direct.diagnostics.warnings));
  assert.ok(Object.isFrozen(direct.diagnostics.sectionIds));
});
test('partial reports remain valid but are not falsely certified', () => {
  const partial = shell.compose([], { metadata: {}, customer: {} }, {});
  assert.equal(partial.diagnostics.valid, true);
  assert.equal(partial.diagnostics.certified, false);
  assert.ok(partial.diagnostics.warnings.includes('REPORT_SHELL_NO_SECTIONS'));
  assert.ok(partial.diagnostics.warnings.includes('REPORT_SHELL_REFERENCE_MISSING'));
});
test('cover opt-out remains supported after certification', () => {
  const noCover = htmlRenderer.render(model, { sectionRegistry, visibilityEngine: visibility, includeCover: false });
  assert.ok(!noCover.html.includes('data-print-shell="cover"'));
  assert.equal(noCover.diagnostics.reportShellValid, true);
});
test('page numbering opt-out remains supported after certification', () => {
  const noPages = htmlRenderer.render(model, { sectionRegistry, visibilityEngine: visibility, includePageNumbers: false });
  assert.equal(noPages.diagnostics.pageNumberingMode, 'disabled');
  assert.ok(!noPages.html.includes('data-print-shell="page-number"'));
});
test('generated report remains a standalone HTML document', () => {
  assert.ok(output.html.startsWith('<!doctype html>'));
  assert.ok(output.html.includes('<meta charset="utf-8">'));
  assert.ok(output.html.endsWith('</html>'));
});
test('browser runtime preserves shell-before-renderer dependency order', () => {
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/report-shell.js') < html.indexOf('/assets/js/print-renderers.js'));
});
test('certification diagnostics expose every rendered section id', () => {
  const direct = shell.compose(output.sectionOutputs, model, {});
  assert.deepStrictEqual(direct.diagnostics.sectionIds, output.sectionOutputs.map(s => s.id));
});

console.log(`P1.6.4 QA complete: ${passed} passed, 0 failed`);
