'use strict';
const assert = require('assert');
const fs = require('fs');
const section = require('./assets/js/print/sections/checklist.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }
const model = { consultationChecklist: { available: true, currentPhase: 'coverage', phases: [{id:'discovery',title:'Discovery',order:1},{id:'coverage',title:'Coverage Review',order:2}], items: [
  {id:'a',phaseId:'discovery',order:1,title:'Confirm <goals>',description:'Client & family',status:'complete',estimatedMinutes:3,required:true},
  {id:'b',phaseId:'coverage',order:2,title:'Review liability',prompt:'Tell me about assets.',status:'active',estimatedMinutes:5,priority:'high'},
  {id:'c',phaseId:'coverage',order:3,title:'Discuss umbrella',coachingNote:'Connect to assets.',status:'pending',estimatedMinutes:4,required:false}
] } };

test('renders semantic checklist section',()=>{ const o=section.render(model); assert.ok(o.html.includes('Consultation Checklist')); assert.ok(o.html.includes('cf-checklist')); });
test('renders every checklist item once',()=>{ const h=section.render(model).html; ['a','b','c'].forEach(id=>assert.equal((h.match(new RegExp(`data-checklist-item-id="${id}"`,'g'))||[]).length,1)); });
test('renders phase headings',()=>{ const h=section.render(model).html; assert.ok(h.includes('Discovery')); assert.ok(h.includes('Coverage Review')); });
test('renders dynamic progress',()=>{ const h=section.render(model).html; assert.ok(h.includes('33%')); assert.ok(h.includes('9')); });
test('renders status labels and current phase',()=>{ const h=section.render(model).html; assert.ok(h.includes('Complete')); assert.ok(h.includes('In progress')); assert.ok(h.includes('Current phase')); });
test('renders prompts and producer notes',()=>{ const h=section.render(model).html; assert.ok(h.includes('Consultation prompt')); assert.ok(h.includes('Producer note')); });
test('escapes client-derived content',()=>{ const h=section.render(model).html; assert.ok(h.includes('Confirm &lt;goals&gt;')); assert.ok(h.includes('Client &amp; family')); assert.ok(!h.includes('Confirm <goals>')); });
test('supports optional fields',()=>{ const h=section.render(model).html; assert.ok(h.includes('Required')); assert.ok(h.includes('Optional')); assert.ok(h.includes('High priority')); });
test('output contains immutable model and diagnostics',()=>{ const o=section.render(model); assert.ok(Object.isFrozen(o)); assert.ok(Object.isFrozen(o.model)); assert.equal(o.diagnostics.valid,true); });
test('unlimited checklist items remain supported',()=>{ const items=Array.from({length:45},(_,i)=>({id:`i${i}`,phaseId:'general',title:`Item ${i}`,order:i,status:'pending'})); const o=section.render({consultationChecklist:{available:true,items}}); assert.equal((o.html.match(/data-checklist-item-id=/g)||[]).length,45); });
test('print stylesheet includes checklist rules',()=>{ const js=fs.readFileSync('./assets/js/print-renderers.js','utf8'); ['.cf-checklist{','.cf-check-item{','.cf-check-phase-header{','.cf-check-summary{'].forEach(token=>assert.ok(js.includes(token),token)); });
test('browser dependency order remains valid',()=>{ const html=fs.readFileSync('./agent/workspace/index.html','utf8'); assert.ok(html.indexOf('/assets/js/print/models/checklist-model.js') < html.indexOf('/assets/js/print/sections/checklist.js')); });
test('release version advanced',()=>assert.ok(/^3\.(18|19|20)\./.test(fs.readFileSync('./VERSION','utf8').trim())));
console.log(`P1.4.2 QA complete: ${passed} passed, 0 failed`);
