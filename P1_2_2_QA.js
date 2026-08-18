'use strict';
const assert=require('assert'); const registry=require('./assets/js/print-sections.js'); registry.clearRegistry();
const section=require('./assets/js/print/sections/property-summary.js');
const source=Object.freeze({propertySummary:{available:true,address:'123 <Main> St, Fremont, CA 94539',yearBuilt:1998,squareFeet:2100,stories:2,constructionType:'Frame',foundationType:'Slab',roof:'Composition',coverage:{replacementCost:850000,deductible:5000,currentCarrier:'Farmers'},riskHighlights:['Pool <review>']}});
const out=section.render(source);
assert.strictEqual(out.id,'property-summary'); assert.ok(out.html.includes('cf-property-summary')); assert.ok(out.html.includes('$850,000')); assert.ok(out.html.includes('$5,000')); assert.ok(out.html.includes('2,100')); assert.ok(out.html.includes('&lt;Main&gt;')); assert.ok(!out.html.includes('<Main>')); assert.ok(out.html.includes('Pool &lt;review&gt;')); assert.ok(Object.isFrozen(out.model)); assert.strictEqual(out.diagnostics.valid,true);
const partial=section.render({propertySummary:{available:true,address:'1 Test St'}}); assert.ok(partial.html.includes('Only the property address was provided.')); assert.ok(!partial.html.includes('Not available'));
console.log(JSON.stringify({suite:'P1.2.2 Property Summary Renderer',passed:12,failed:0},null,2));
