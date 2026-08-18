'use strict';
const assert = require('assert');
const fs = require('fs');
const modelFactory = require('./assets/js/print/models/property-summary-model.js');
const section = require('./assets/js/print/sections/property-summary.js');
let checks = 0;

const complete = {
  schemaVersion: 2,
  engineVersion: '1.0.0',
  generatedAt: '2026-07-26T12:00:00.000Z',
  propertySummary: {
    available: true,
    address: '123 Main St, Fremont, CA 94539',
    yearBuilt: '1998',
    livingArea: '2,450',
    stories: 2,
    construction: 'Frame',
    foundation: 'Slab',
    roof: 'Composition shingle',
    replacementCost: '$875,000',
    deductible: '5000',
    currentCarrier: 'Example Mutual',
    riskHighlights: ['Wildfire score should be reviewed.']
  }
};

const model = modelFactory.create(complete);
assert.strictEqual(model.property.address, '123 Main St, Fremont, CA 94539'); checks++;
assert.strictEqual(model.property.city, 'Fremont'); checks++;
assert.strictEqual(model.property.state, 'CA'); checks++;
assert.strictEqual(model.property.zip, '94539'); checks++;
assert.strictEqual(model.construction.yearBuilt, 1998); checks++;
assert.strictEqual(model.construction.squareFeet, 2450); checks++;
assert.strictEqual(model.coverage.replacementCost, 875000); checks++;
assert.strictEqual(model.coverage.deductible, 5000); checks++;
assert.strictEqual(model.coverage.currentCarrier, 'Example Mutual'); checks++;
assert.ok(model.riskHighlights.includes('Wildfire score should be reviewed.')); checks++;
assert.ok(Object.isFrozen(model) && Object.isFrozen(model.property) && Object.isFrozen(model.coverage)); checks++;
assert.strictEqual(modelFactory.hasContent(model), true); checks++;

const partial = modelFactory.create({ propertySummary: { available: true, yearBuilt: 2005 } });
assert.strictEqual(partial.property.address, null); checks++;
assert.strictEqual(partial.construction.yearBuilt, 2005); checks++;
assert.strictEqual(partial.coverage.replacementCost, null); checks++;
assert.strictEqual(modelFactory.hasContent(partial), true); checks++;

const empty = modelFactory.create({ propertySummary: { available: false } });
assert.strictEqual(modelFactory.hasContent(empty), false); checks++;
assert.ok(modelFactory.getDiagnostics(empty).warningCount >= 5); checks++;

const invalid = modelFactory.create({ propertySummary: { available: true, yearBuilt: 'unknown', livingArea: 'n/a', deductible: 'none' } });
assert.strictEqual(invalid.construction.yearBuilt, null); checks++;
assert.strictEqual(invalid.construction.squareFeet, null); checks++;
assert.strictEqual(invalid.coverage.deductible, null); checks++;

assert.strictEqual(section.shouldRender(complete), true); checks++;
const rendered = section.render(complete);
assert.strictEqual(rendered.id, 'property-summary'); checks++;
assert.ok(typeof rendered.html === 'string'); checks++;
assert.strictEqual(rendered.model.coverage.replacementCost, 875000); checks++;
assert.ok(Object.isFrozen(rendered)); checks++;

const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
assert.ok(html.includes('/assets/js/print/models/property-summary-model.js')); checks++;
assert.ok(html.indexOf('/assets/js/print/models/property-summary-model.js') < html.indexOf('/assets/js/print/sections/property-summary.js')); checks++;

console.log(`P1.2.1 QA passed: ${checks} checks`);
