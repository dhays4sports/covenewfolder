'use strict';
const assert = require('assert');
const modelFactory = require('./assets/js/print/models/recommendation-model.js');
const section = require('./assets/js/print/sections/recommendations.js');
let passed = 0;
function test(name, fn){ fn(); passed += 1; console.log('PASS', name); }

const ordered = modelFactory.create({ recommendations: [
  { id:'low', title:'Low misc', priority:'Low', category:'Other' },
  { id:'high-life', title:'Life review', priority:'High', category:'Life' },
  { id:'critical-liability', title:'Liability review', priority:'Critical', category:'Liability' },
  { id:'critical-property', title:'Property review', priority:'Critical', category:'Property' },
  { id:'high-property', title:'Property high', priority:'High', category:'Home Protection' },
  { id:'critical-water', title:'Water review', priority:'Critical', category:'Water Damage Prevention' },
  { id:'high-umbrella', title:'Umbrella review', priority:'High', category:'Excess Liability' }
]});

test('sorts by priority first',()=>{
  assert.deepEqual(ordered.recommendations.map(x=>x.id), [
    'critical-property','critical-liability','critical-water','high-property','high-life','high-umbrella','low'
  ]);
});
test('uses deterministic category order within a priority',()=>{
  assert.deepEqual(ordered.recommendations.slice(0,3).map(x=>x.categoryKey), ['property','liability','water']);
});
test('normalizes umbrella after life despite liability wording',()=>{
  assert.equal(ordered.recommendations.find(x=>x.id==='high-umbrella').categoryKey,'umbrella');
});
test('preserves source order when priority and category tie',()=>{
  const model=modelFactory.create({recommendations:[
    {id:'b',title:'B',priority:'High',category:'Property'},
    {id:'a',title:'A',priority:'High',category:'Property'}
  ]});
  assert.deepEqual(model.recommendations.map(x=>x.id),['b','a']);
});
test('unknown categories sort as miscellaneous',()=>{
  const item=modelFactory.create({recommendations:[{title:'Cyber',priority:'Review',category:'Cyber'}]}).recommendations[0];
  assert.equal(item.categoryKey,'miscellaneous');
});
test('priority aliases continue to normalize',()=>{
  const model=modelFactory.create({recommendations:[
    {id:'moderate',title:'Moderate',priority:'moderate'},
    {id:'urgent',title:'Urgent',priority:'urgent'}
  ]});
  assert.deepEqual(model.recommendations.map(x=>x.id),['urgent','moderate']);
});
test('ordering does not mutate source array',()=>{
  const source=[{id:'low',title:'Low',priority:'Low'},{id:'high',title:'High',priority:'High'}];
  const before=JSON.stringify(source);
  modelFactory.create({recommendations:source});
  assert.equal(JSON.stringify(source),before);
});
test('ordered output remains deeply immutable',()=>{
  assert.ok(Object.isFrozen(ordered));
  assert.ok(Object.isFrozen(ordered.recommendations));
  ordered.recommendations.forEach(item=>assert.ok(Object.isFrozen(item)));
});
test('section renderer follows model ordering',()=>{
  const output=section.render({recommendations:[
    {id:'low',title:'Low topic',priority:'Low'},
    {id:'critical',title:'Critical topic',priority:'Critical'}
  ]});
  assert.ok(output.html.indexOf('Critical topic') < output.html.indexOf('Low topic'));
});
test('unlimited recommendation support remains intact',()=>{
  const items=Array.from({length:30},(_,i)=>({id:`r${i}`,title:`Topic ${i}`,priority:i%2?'Low':'High'}));
  assert.equal(modelFactory.create({recommendations:items}).count,30);
});
console.log(`P1.3.4 QA complete: ${passed} passed, 0 failed`);
