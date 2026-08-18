'use strict';
const assert = require('assert');
const fs = require('fs');
const section = require('./assets/js/print/sections/recommendations.js');
let passed=0; function test(name,fn){fn();passed++;console.log('PASS',name);}
const source={recommendations:[
 {id:'p1',title:'Dwelling Review',priority:'Critical',category:'Property',whyItMatters:'A'.repeat(80),suggestedReview:'Review dwelling limits.'},
 {id:'p2',title:'Roof Review',priority:'High',category:'Property',whyItMatters:'Roof age matters.',suggestedReview:'Confirm updates.'},
 {id:'l1',title:'Liability Limits',priority:'High',category:'Liability',whyItMatters:'Protect assets.',suggestedReview:'Compare limits.'}
]};
const output=section.render(source);
const css=fs.readFileSync('./assets/js/print-renderers.js','utf8');

test('section version remains compatible',()=>assert.ok(['1.5.0','1.6.0','1.7.0','1.7.1'].includes(section.version)));
test('release version advanced',()=>assert.ok(/^3\.(18|19|20)\./.test(fs.readFileSync('./VERSION','utf8').trim())));
test('group count metadata rendered',()=>assert.ok(output.html.includes('data-group-count="2"')));
test('first card in each group marked',()=>assert.equal((output.html.match(/cf-rec-card-first/g)||[]).length,2));
test('all recommendations still render once',()=>source.recommendations.forEach(i=>assert.equal((output.html.match(new RegExp(`data-recommendation-id="${i.id}"`,'g'))||[]).length,1)));
test('group header avoids page break after',()=>assert.ok(css.includes('.cf-rec-group-header{break-after:avoid-page;page-break-after:avoid}')));
test('first card avoids page break before',()=>assert.ok(css.includes('.cf-rec-card-first{break-before:avoid-page;page-break-before:avoid}')));
test('recommendation cards avoid internal breaks',()=>assert.ok(css.includes('.cf-rec-summary-strip,.cf-rec-group-header,.cf-rec-card,.cf-rec-card-header,.cf-rec-card-body,.cf-rec-question,.cf-rec-footer{break-inside:avoid;page-break-inside:avoid}')));
test('widow and orphan controls included',()=>{assert.ok(css.includes('.cf-rec-group-list{orphans:2;widows:2}'));assert.ok(css.includes('.cf-rec-card-body p{orphans:3;widows:3}'));});
test('footer avoids isolated page start',()=>assert.ok(css.includes('.cf-rec-footer{break-before:avoid-page;page-break-before:avoid}')));
test('print spacing tightened for multi-page sections',()=>{assert.ok(css.includes('@media print'));assert.ok(css.includes('.cf-rec-groups{gap:18px}'));assert.ok(css.includes('.cf-rec-group-list{gap:10px}'));});
test('source remains unmodified',()=>assert.equal(source.recommendations[0].title,'Dwelling Review'));
console.log(`P1.3.6 QA complete: ${passed} passed, 0 failed`);
