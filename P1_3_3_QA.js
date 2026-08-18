'use strict';
const assert = require('assert');
const fs = require('fs');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const section = require('./assets/js/print/sections/recommendations.js');
let passed = 0;
function test(name, fn){ fn(); passed += 1; console.log('PASS', name); }
const source = Object.freeze({ recommendations: [
  { id:'water', title:'Water Loss Prevention', priority:'Critical', category:'Property', whyItMatters:'Water losses can create major disruption.', suggestedReview:'Review automatic shutoff requirements.' },
  { id:'umbrella', title:'Umbrella Liability', priority:'High', category:'Liability', whyItMatters:'Adds protection above underlying limits.', suggestedReview:'Compare $1M and $2M limits.', question:'Which assets are most important to protect?' },
  { id:'limits', title:'Liability Limits', priority:'Medium', category:'Auto', whyItMatters:'Current limits may not reflect present assets.', suggestedReview:'Compare available limit options.' },
  { id:'documents', title:'Document Current Coverage', priority:'Review', category:'Process', suggestedReview:'Confirm policy documents and renewal dates.' },
  { id:'discount', title:'Available Discounts', priority:'Low', category:'Savings', whyItMatters:'Eligible discounts may improve value.' }
]});
const output = section.render(source);
test('uses professional section version',()=>assert.ok(Number(section.version.split('.')[1]) >= 3));
test('renders CoverageFit masthead',()=>{assert.ok(output.html.includes('cf-rec-brand'));assert.ok(output.html.includes('Protection Review'));});
test('renders priority summary strip',()=>{assert.ok(output.html.includes('cf-rec-summary-strip'));assert.ok(output.html.includes('Recommendation priority overview'));});
test('renders every populated priority bucket',()=>{['critical','high','medium','review','low'].forEach(k=>assert.ok(output.html.includes(`cf-rec-overview-${k}`)));});
test('renders professional numbered rails',()=>{assert.equal((output.html.match(/cf-rec-card-rail/g)||[]).length,5);assert.ok(output.html.includes('01'));assert.ok(output.html.includes('05'));});
test('keeps unlimited recommendation support',()=>{const many=section.render({recommendations:Array.from({length:30},(_,i)=>({title:`Topic ${i+1}`,priority:'Review'}))});assert.equal(many.model.count,30);assert.equal((many.html.match(/cf-rec-card-rail/g)||[]).length,30);});
test('keeps content model driven',()=>{assert.ok(output.html.includes('Water Loss Prevention'));assert.ok(output.html.includes('Compare $1M and $2M limits.'));});
test('keeps consultation framing',()=>{assert.ok(output.html.includes('not underwriting decisions'));assert.ok(output.html.includes('Consultation next step'));});
test('escapes client-derived content',()=>{const escaped=section.render({recommendations:[{title:'<script>alert(1)</script>',whyItMatters:'A&B'}]});assert.ok(escaped.html.includes('&lt;script&gt;'));assert.ok(escaped.html.includes('A&amp;B'));assert.ok(!escaped.html.includes('<script>'));});
test('stylesheet contains professional recommendation layout',()=>{const css=fs.readFileSync('./assets/js/print-renderers.js','utf8');['.cf-rec-summary-strip','.cf-rec-overview','.cf-rec-card-rail','.cf-rec-brand'].forEach(token=>assert.ok(css.includes(token)));});
test('stylesheet preserves print page controls',()=>{const css=fs.readFileSync('./assets/js/print-renderers.js','utf8');assert.ok(css.includes('.cf-recommendations{width:8.5in'));assert.ok(css.includes('page-break-inside:avoid'));});
test('output remains immutable',()=>{assert.ok(Object.isFrozen(output));assert.ok(Object.isFrozen(output.model));assert.ok(Object.isFrozen(output.diagnostics));});
test('empty recommendations remain hidden',()=>assert.equal(section.shouldRender({recommendations:[]}),false));
test('release version advanced',()=>assert.ok(/^3\.(18|19|20)\./.test(fs.readFileSync('./VERSION','utf8').trim())));
test('browser dependency order remains valid',()=>{const html=fs.readFileSync('./agent/workspace/index.html','utf8');assert.ok(html.indexOf('/assets/js/print/models/recommendation-model.js') < html.indexOf('/assets/js/print/sections/recommendations.js'));});
console.log(`P1.3.3 QA complete: ${passed} passed, 0 failed`);
