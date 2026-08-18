#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, condition) => { assert(condition, name); checks.push(name); };

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const continuitySource = read('assets/js/intent-payoff-continuity.js');
const conversionSource = read('assets/js/conversion-handoff.js');
const propertySource = read('assets/js/property-confirmation.js');

check('release preserves FLOW-1.5 after HOME-2.1', ['3.20.55', '3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('question-two checkpoint writes are idempotent', continuitySource.includes('titleNode.textContent !== title') && continuitySource.includes('copyNode.textContent !== copy'));
check('checkpoint observer watches only the reveal state', continuitySource.includes("attributeFilter: ['hidden']") && !continuitySource.includes('childList: true'));
check('confirmed 408FARMERS handoffs remain direct-assessment eligible', conversionSource.includes('directAssessmentEligible: isHomeHandoff'));
check('structured 408FARMERS addresses remain quick-confirm eligible', conversionSource.includes('quickPropertyConfirmationEligible: isHomeHandoff && hasStructuredAddress'));
check('quick confirmation enters the existing assessment', propertySource.includes("continueToAssessment(nextProfile, 'handoff_address_confirmed')"));

let observerCallback = null;
let writes = 0;
const titleNode = { _text: 'engine checkpoint', get textContent() { return this._text; }, set textContent(value) { writes += 1; this._text = value; } };
const copyNode = { _text: 'engine copy', get textContent() { return this._text; }, set textContent(value) { writes += 1; this._text = value; } };
const earlyNode = { hidden: true };
class FakeMutationObserver {
  constructor(callback) { observerCallback = callback; }
  observe(_node, options) {
    check('runtime observer excludes recursive child mutations', options.attributes === true && options.attributeFilter.length === 1 && options.attributeFilter[0] === 'hidden' && !options.childList && !options.subtree);
  }
}
const sandbox = {
  document: {
    documentElement: { dataset: {} },
    getElementById(id) { return { earlyInsight: earlyNode, earlyInsightTitle: titleNode, earlyInsightCopy: copyNode }[id] || null; }
  },
  MutationObserver: FakeMutationObserver,
  window: {}
};
vm.createContext(sandbox);
vm.runInContext(continuitySource, sandbox, { filename: 'intent-payoff-continuity.js' });
writes = 0;
earlyNode.hidden = false;
observerCallback?.([]);
observerCallback?.([]);
check('revealing the checkpoint settles after one bounded update', writes === 2);
check('subsequent observer delivery performs no writes', titleNode.textContent.includes('narrowing') && copyNode.textContent.includes('Finish your Snapshot'));

console.log(`FLOW-1.5 QA: ${checks.length}/${checks.length} passed`);
