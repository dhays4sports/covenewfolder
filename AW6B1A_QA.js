'use strict';

const assert = require('assert');
const registry = require('./assets/js/print-sections.js');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
  }
}

registry.clearRegistry();

test('exports the public registry API', () => {
  ['registerSection', 'getSection', 'getRegisteredSections', 'clearRegistry'].forEach(name => {
    assert.strictEqual(typeof registry[name], 'function', `${name} is missing`);
  });
});

test('registers and retrieves a section definition', () => {
  const section = Object.freeze({ id: 'executive-summary', order: 20 });
  registry.registerSection('executive-summary', section);
  assert.strictEqual(registry.getSection('executive-summary'), section);
});

test('normalizes ids and rejects duplicates', () => {
  assert.strictEqual(registry.hasSection(' EXECUTIVE-SUMMARY '), true);
  assert.throws(
    () => registry.registerSection('executive-summary', { id: 'executive-summary' }),
    error => error.code === 'PRINT_SECTION_DUPLICATE'
  );
});

test('supports explicit replacement', () => {
  const replacement = Object.freeze({ id: 'executive-summary', order: 10 });
  registry.registerSection('executive-summary', replacement, { replace: true });
  assert.strictEqual(registry.getSection('executive-summary'), replacement);
});

test('returns deterministic order', () => {
  registry.registerSection('footer', { id: 'footer', order: 900 });
  registry.registerSection('header', { id: 'header', order: 0 });
  assert.deepStrictEqual(registry.getRegisteredSections(), ['header', 'executive-summary', 'footer']);
});

test('returns immutable metadata', () => {
  const metadata = registry.getSectionMetadata('header');
  assert.strictEqual(Object.isFrozen(metadata), true);
});

test('unregisters a section', () => {
  assert.strictEqual(registry.unregisterSection('footer'), true);
  assert.strictEqual(registry.getSection('footer'), null);
});

test('reports registry diagnostics', () => {
  const diagnostics = registry.getDiagnostics();
  assert.strictEqual(diagnostics.valid, true);
  assert.strictEqual(diagnostics.sectionCount, 2);
  assert.strictEqual(Object.isFrozen(diagnostics), true);
});

test('clears the registry and reports removed count', () => {
  assert.strictEqual(registry.clearRegistry(), 2);
  assert.deepStrictEqual(registry.getRegisteredSections(), []);
});

const failed = results.filter(result => !result.ok);
console.log(JSON.stringify({ suite: 'AW-6B.1A Section Registry', passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
