'use strict';
const assert = require('assert');
const fs = require('fs');
const modelFactory = require('./assets/js/print/models/recommendation-model.js');
const section = require('./assets/js/print/sections/recommendations.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

test('maps recommendation fields', () => {
  const model = modelFactory.create({ recommendations: [{ id:'r1', title:'Umbrella', priority:'high', category:'Liability', summary:'Protect assets', question:'Review limits?', sourceIds:['a','a','b'] }] });
  assert.equal(model.count, 1);
  assert.equal(model.recommendations[0].title, 'Umbrella');
  assert.equal(model.recommendations[0].priority, 'High');
  assert.equal(model.recommendations[0].whyItMatters, 'Protect assets');
  assert.deepEqual(model.recommendations[0].sourceIds, ['a','b']);
});

test('supports aliases', () => {
  const item = modelFactory.create({ recommendations:[{ name:'Water Shutoff', severity:'urgent', rationale:'Reduce water loss', action:'Review device requirement' }] }).recommendations[0];
  assert.equal(item.priority, 'Critical');
  assert.equal(item.whyItMatters, 'Reduce water loss');
  assert.equal(item.suggestedReview, 'Review device requirement');
});

test('preserves unlimited recommendations', () => {
  const items = Array.from({length:25}, (_,i)=>({title:`Topic ${i+1}`}));
  assert.equal(modelFactory.create({recommendations:items}).count, 25);
});

test('empty input is safe', () => {
  const model = modelFactory.create({});
  assert.equal(model.count, 0);
  assert.deepEqual(model.recommendations, []);
  assert.equal(modelFactory.hasContent(model), false);
});

test('output is deeply immutable', () => {
  const model = modelFactory.create({recommendations:[{title:'A', metadata:{x:1}}]});
  assert.ok(Object.isFrozen(model));
  assert.ok(Object.isFrozen(model.recommendations));
  assert.ok(Object.isFrozen(model.recommendations[0]));
  assert.ok(Object.isFrozen(model.recommendations[0].metadata));
});

test('diagnostics identify incomplete items', () => {
  const diagnostics = modelFactory.getDiagnostics(modelFactory.create({recommendations:[{title:'A'}]}));
  assert.equal(diagnostics.valid, true);
  assert.ok(diagnostics.warningCount >= 2);
});

test('section consumes dedicated model', () => {
  const output = section.render({recommendations:[{title:'A'}]});
  assert.equal(output.id, 'recommendations');
  assert.equal(output.model.count, 1);
  assert.ok(typeof output.html === 'string');
});

test('section visibility uses dedicated model', () => {
  assert.equal(section.shouldRender({recommendations:[{title:'A'}]}), true);
  assert.equal(section.shouldRender({recommendations:[]}), false);
});

test('browser dependency order is correct', () => {
  const html = fs.readFileSync('./agent/workspace/index.html','utf8');
  assert.ok(html.indexOf('/assets/js/print/models/recommendation-model.js') < html.indexOf('/assets/js/print/sections/recommendations.js'));
});
console.log(`P1.3.1 QA complete: ${passed} passed, 0 failed`);
