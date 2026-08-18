const assert = require('assert');
const path = require('path');
const base = __dirname;
const registry = require(path.join(base, 'assets/js/print-sections.js'));
registry.clearRegistry();
const modelFactory = require(path.join(base, 'assets/js/print/models/executive-summary-model.js'));
const section = require(path.join(base, 'assets/js/print/sections/executive-summary.js'));

const source = Object.freeze({
  schemaVersion: 1,
  engineVersion: 'test',
  generatedAt: '2026-07-27T12:00:00Z',
  customer: { name: 'Ana <script>alert(1)</script>' },
  propertySummary: { available: true, address: '123 Main St, Fremont, CA' },
  metadata: { title: 'Coverage Review', consultationDate: '2026-07-27', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency' },
  assessment: { score: 82, status: 'Strong Foundation', topPriority: 'Liability limits' },
  executiveSummary: 'A focused review of current protection.',
  strengths: ['Replacement cost review'],
  recommendations: [{ title: 'Umbrella protection' }, { title: 'Water loss planning' }]
});

const rendered = section.render(source);
assert.strictEqual(rendered.id, 'executive-summary');
assert.ok(rendered.html.includes('cf-exec-masthead'));
assert.ok(rendered.html.includes('cf-exec-score-card'));
assert.ok(rendered.html.includes('82'));
assert.ok(rendered.html.includes('Umbrella protection'));
assert.ok(rendered.html.includes('Virginia Tam Insurance Agency'));
assert.ok(!rendered.html.includes('<script>alert(1)</script>'));
assert.ok(rendered.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
assert.ok(Object.isFrozen(rendered.model));

const zero = section.render({ customer:{name:'Zero'}, assessment:{score:0}, metadata:{} });
assert.ok(zero.html.includes('>0<'));

const rendererRegistry = require(path.join(base, 'assets/js/print-renderers.js'));
const composer = {
  compose(model) {
    return Object.freeze({
      sections: Object.freeze([{ id: section.id, definition: section }]),
      hiddenSections: Object.freeze([]),
      diagnostics: Object.freeze({ valid: true })
    });
  }
};
const htmlOutput = rendererRegistry.resolveRenderer('html').renderer.render(source, { documentComposer: composer });
assert.ok(htmlOutput.html.includes('<style>'));
assert.ok(htmlOutput.html.includes('@media print'));
assert.ok(htmlOutput.html.includes('size:letter'));
assert.ok(htmlOutput.html.includes('cf-executive-summary'));
assert.strictEqual(htmlOutput.diagnostics.renderedSectionCount, 1);

console.log(JSON.stringify({ suite: 'P1.1.3 Executive Summary Professional Layout', passed: 15, failed: 0 }, null, 2));
