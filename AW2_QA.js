const assert = require('assert');
const path = require('path');

function storage(seed = {}) {
  const values = { ...seed };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; }
  };
}

global.localStorage = storage();
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.dispatchEvent = () => {};
const adapter = require(path.resolve(__dirname, 'assets/js/workspace-data.js'));

assert(['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0','1.5.0'].includes(adapter.VERSION));
assert.equal(adapter.SCHEMA_VERSION, '1.0');
assert.equal(adapter.getSnapshot({ storage: storage() }).state, 'empty');

const report = {
  version: 'v2.4',
  assessment: 'home',
  createdAt: '2026-07-25T12:00:00.000Z',
  score: 74,
  status: 'Strong Foundation',
  consumer: { firstName: 'Avery', lastName: 'Stone', email: 'avery@example.com' },
  strengths: ['Structured review completed'],
  priorities: [{ tag: 'Water Damage', insight: 'Confirm water protection.', confidence: 88, priority: 'High' }],
  personalizationContext: { journey: { occupationSegment: 'Electrical engineer', housingContext: 'I own my home', source: '408farmers', campaign: 'Are You an Engineer', entryPoint: 'engineers_eligibility_form' } },
  propertyProfile: {
    address: { line1: '123 Main St', city: 'Fremont', state: 'CA', postalCode: '94539' },
    data: { yearBuilt: 1998, squareFeet: 2100, pool: false },
    fieldMeta: { yearBuilt: { verifiedByUser: true }, squareFeet: { verifiedByUser: true } },
    quality: { confidence: 92 }
  }
};
const snapshot = adapter.getSnapshot({ report });
assert.equal(snapshot.state, 'ready');
assert.equal(snapshot.customer.name, 'Avery Stone');
assert.equal(snapshot.assessment.score, 74);
assert.equal(snapshot.assessment.topPriority, 'Water Damage');
assert.equal(snapshot.recommendations[0].title, 'Water Damage');
assert.equal(snapshot.property.address, '123 Main St, Fremont, CA 94539');
assert.equal(snapshot.property.livingArea, 2100);
assert.equal(snapshot.property.confirmation.verifiedCount, 2);
assert.equal(snapshot.entryContext.occupationSegment, 'Electrical engineer');
assert.equal(snapshot.entryContext.housingContext, 'I own my home');
assert.equal(snapshot.entryContext.source, '408farmers');
assert.equal(snapshot.diagnostics.isReady, true);

const malformedScore = adapter.getSnapshot({ report: { assessment: 'home', score: 'not-a-number', priorities: [] } });
assert.equal(malformedScore.assessment.score, null);
assert(malformedScore.diagnostics.warnings.some(w => w.includes('numeric Protection Score')));

const original = { assessment: 'home', score: 90, priorities: [{ tag: 'Umbrella' }] };
const immutable = adapter.getSnapshot({ report: original });
immutable.recommendations[0].source.tag = 'Changed';
assert.equal(original.priorities[0].tag, 'Umbrella');

console.log('AW-2 adapter QA passed');
