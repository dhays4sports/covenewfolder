'use strict';
const assert = require('assert');
const fs = require('fs');
const modelFactory = require('./assets/js/print/models/recommendation-model.js');
const section = require('./assets/js/print/sections/recommendations.js');
let passed=0; function test(name,fn){fn();passed++;console.log('PASS',name);}
const source={recommendations:[
 {id:'u',title:'Umbrella',priority:'High',category:'Umbrella'},
 {id:'p1',title:'Dwelling',priority:'Critical',category:'Property'},
 {id:'w',title:'Water Shutoff',priority:'High',category:'Water'},
 {id:'p2',title:'Roof',priority:'Low',category:'Home'},
 {id:'l',title:'Liability Limits',priority:'Critical',category:'Liability'},
 {id:'x',title:'Documentation',priority:'Review',category:'Process'}
]};
const model=modelFactory.create(source); const output=section.render(source);
test('model version advanced',()=>assert.equal(modelFactory.VERSION,'1.2.0'));
test('creates category groups',()=>assert.equal(model.groupCount,5));
test('groups follow canonical category order',()=>assert.deepEqual(model.groups.map(g=>g.key),['property','liability','water','umbrella','miscellaneous']));
test('group labels are client friendly',()=>assert.deepEqual(model.groups.map(g=>g.title),['Property Protection','Liability Protection','Water Damage Prevention','Umbrella Protection','Additional Review Topics']));
test('keeps recommendation ordering inside groups',()=>assert.deepEqual(model.groups[0].recommendations.map(x=>x.id),['p1','p2']));
test('group counts are correct',()=>assert.equal(model.groups[0].count,2));
test('group model is deeply immutable',()=>{assert.ok(Object.isFrozen(model.groups));model.groups.forEach(g=>{assert.ok(Object.isFrozen(g));assert.ok(Object.isFrozen(g.recommendations));});});
test('source remains unmodified',()=>assert.equal(source.recommendations[0].category,'Umbrella'));
test('renderer emits group headings',()=>{assert.ok(output.html.includes('cf-rec-group-header'));assert.ok(output.html.includes('Property Protection'));});
test('renderer emits every recommendation once',()=>source.recommendations.forEach(i=>assert.equal((output.html.match(new RegExp(`data-recommendation-id=\"${i.id}\"`,'g'))||[]).length,1)));
test('numbering remains continuous across groups',()=>{assert.ok(output.html.includes('01'));assert.ok(output.html.includes('06'));});
test('unlimited groups and items remain supported',()=>{const many=modelFactory.create({recommendations:Array.from({length:40},(_,i)=>({title:`T${i}`,category:i%2?'Property':'Liability'}))});assert.equal(many.count,40);assert.equal(many.groupCount,2);});
test('stylesheet includes grouped layout',()=>{const css=fs.readFileSync('./assets/js/print-renderers.js','utf8');['.cf-rec-groups','.cf-rec-group-header','.cf-rec-group-list'].forEach(t=>assert.ok(css.includes(t)));});
test('section version remains compatible',()=>assert.ok(/^1\.[4567]\.0$/.test(section.version)));
test('release version advanced',()=>assert.ok(/^3\.(18|19|20)\./.test(fs.readFileSync('./VERSION','utf8').trim())));
console.log(`P1.3.5 QA complete: ${passed} passed, 0 failed`);
