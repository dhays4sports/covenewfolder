'use strict';
const assert = require('assert');
const fs = require('fs');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const section = require('./assets/js/print/sections/recommendations.js');
const renderer = require('./assets/js/print-renderers.js');
let passed = 0;
function test(name, fn){ fn(); passed += 1; console.log('PASS', name); }
const source = Object.freeze({ recommendations: [
  { id:'umbrella', title:'Umbrella Liability', priority:'High', category:'Liability', whyItMatters:'Protect <assets> beyond home and auto limits.', suggestedReview:'Review a $1M umbrella option.', question:'Would you like to compare $1M and $2M limits?' },
  { id:'water', title:'Water Loss Prevention', priority:'Critical', category:'Property', summary:'Reduce severity of water claims.', action:'Discuss automatic shutoff requirements.' }
]});
const output = section.render(source);
test('returns semantic recommendation section',()=>{ assert.equal(output.id,'recommendations'); assert.ok(output.html.includes('cf-recommendations')); assert.ok(output.html.includes('What We Recommend Reviewing')); });
test('renders every recommendation',()=>{ assert.equal((output.html.match(/cf-rec-card /g)||[]).length,2); assert.ok(output.html.includes('Umbrella Liability')); assert.ok(output.html.includes('Water Loss Prevention')); });
test('renders priority and category labels',()=>{ assert.ok(output.html.includes('cf-rec-priority-high')); assert.ok(output.html.includes('cf-rec-priority-critical')); assert.ok(output.html.includes('Liability')); });
test('renders explanation and review topic',()=>{ assert.ok(output.html.includes('Why this matters')); assert.ok(output.html.includes('Suggested review')); assert.ok(output.html.includes('Review a $1M umbrella option.')); });
test('renders optional conversation question',()=>{ assert.ok(output.html.includes('Conversation prompt')); assert.ok(output.html.includes('compare $1M and $2M')); });
test('escapes model-derived HTML',()=>{ assert.ok(output.html.includes('&lt;assets&gt;')); assert.ok(!output.html.includes('<assets>')); });
test('supports unlimited recommendations',()=>{ const many=section.render({recommendations:Array.from({length:25},(_,i)=>({title:`Topic ${i+1}`}))}); assert.equal(many.model.count,25); assert.equal((many.html.match(/cf-rec-card /g)||[]).length,25); });
test('returns immutable model and diagnostics',()=>{ assert.ok(Object.isFrozen(output.model)); assert.ok(Object.isFrozen(output.diagnostics)); assert.equal(output.diagnostics.valid,true); });
test('section visibility remains model-driven',()=>{ assert.equal(section.shouldRender(source),true); assert.equal(section.shouldRender({recommendations:[]}),false); });
test('print stylesheet includes recommendation classes',()=>{ const text=fs.readFileSync('./assets/js/print-renderers.js','utf8'); assert.ok(text.includes('.cf-recommendations')); assert.ok(text.includes('.cf-rec-card')); assert.ok(text.includes('width:8.5in')); });
test('browser dependency order remains valid',()=>{ const html=fs.readFileSync('./agent/workspace/index.html','utf8'); assert.ok(html.indexOf('/assets/js/print/models/recommendation-model.js') < html.indexOf('/assets/js/print/sections/recommendations.js')); });
console.log(`P1.3.2 QA complete: ${passed} passed, 0 failed`);
