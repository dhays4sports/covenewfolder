'use strict';
const assert = require('assert');
const fs = require('fs');
const section = require('./assets/js/print/sections/checklist.js');
let passed=0; function test(n,f){f();passed++;console.log('PASS',n)}
const model={consultationChecklist:{available:true,currentPhase:'coverage',phases:[{id:'discovery',title:'Discovery',order:1},{id:'coverage',title:'Coverage Review',order:2}],items:[
{id:'a',phaseId:'discovery',order:1,title:'Confirm goals',status:'complete',estimatedMinutes:3},
{id:'b',phaseId:'coverage',order:2,title:'Review liability',status:'active',estimatedMinutes:5,priority:'high'},
{id:'c',phaseId:'coverage',order:3,title:'Discuss umbrella',status:'pending',estimatedMinutes:4}
]}};
const html=section.render(model).html;
const css=fs.readFileSync('./assets/js/print-renderers.js','utf8');
test('section version advanced',()=>assert.equal(section.version,'1.3.0'));
test('renders overall progress track',()=>assert.ok(html.includes('cf-check-progress-track')));
test('overall progress width is model-driven',()=>assert.ok(html.includes('width:33%')));
test('renders phase progress meters',()=>assert.equal((html.match(/cf-check-phase-meter/g)||[]).length,2));
test('current phase has professional emphasis',()=>assert.ok(html.includes('cf-check-phase-current')));
test('phase cards have executive styling',()=>assert.ok(css.includes('.cf-check-phase{padding:16px 16px 14px')));
test('current phase has border and shadow treatment',()=>assert.ok(css.includes('.cf-check-phase-current{border-color:')));
test('active items receive visual emphasis',()=>assert.ok(css.includes('.cf-check-status-active{border-color:')));
test('complete items receive subtle completion treatment',()=>assert.ok(css.includes('.cf-check-status-complete .cf-check-item-content')));
test('responsive checklist phase padding exists',()=>assert.ok(css.includes('.cf-check-phase{padding:14px 12px}')));
test('print keeps phase cards together where possible',()=>assert.ok(css.includes('.cf-check-summary,.cf-check-phase,.cf-check-phase-header')));
test('print preserves phase meters',()=>assert.ok(css.includes('.cf-check-phase-meter,.cf-check-item')));
test('unlimited items remain supported',()=>{const items=Array.from({length:60},(_,i)=>({id:`i${i}`,phaseId:'general',title:`Item ${i}`,status:'pending'}));assert.equal((section.render({consultationChecklist:{available:true,items}}).html.match(/data-checklist-item-id=/g)||[]).length,60)});
test('source content remains escaped',()=>{const h=section.render({consultationChecklist:{available:true,items:[{id:'x',phaseId:'g',title:'<script>'}]}}).html;assert.ok(h.includes('&lt;script&gt;'));assert.ok(!h.includes('<script>'))});
test('release version advanced',()=>assert.ok(/^3\.(18|19|20)\./.test(fs.readFileSync('./VERSION','utf8').trim())));
console.log(`P1.4.3 QA complete: ${passed} passed, 0 failed`);
