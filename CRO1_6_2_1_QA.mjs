#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const contract = JSON.parse(read('professional-intent-contract.json'));
const continuity = require('./assets/js/professional-intent-continuity.js');
const command = require('./assets/js/consultation-command-center.js');

check('receiver preserves CRO-1.6.2.1 after the SMS alert release', ['3.20.53', '3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('contract identifies the paired bounded sprint', contract.sprint === '408-CRO-1.6.2.1' && contract.sender.release === '408-CRO-1.6.2.1');
check('continuity module advances without changing eligibility authority', continuity.BUILD === '408-CRO-1.6.2.1' && contract.automatedEligibilityDecision === false);

const copy = continuity.customerCopy(continuity.contextFor({
  reviewContext: 'Professional eligibility and home coverage review',
  prospectProfile: { occupationSegment: 'Nurse or RN', integration: { entry: 'healthcare_eligibility_form', campaign: 'Work in Healthcare' } }
}));
check('professional checkpoint emphasizes customer payoff', copy.checkpointTitle.includes('protection—and possible professional savings'));
check('professional completion preserves the Protection Snapshot identity', copy.completionTitle.startsWith('Your Protection Snapshot is ready') && copy.reportTitle.startsWith('Your Protection Snapshot is ready'));
check('professional customer copy makes no eligibility result', !/you qualify|eligibility confirmed|guaranteed discount|discount approved/i.test(JSON.stringify(copy)));

const transition = read('assets/js/transition-route.js');
check('transition removes Dashboard terminology', !/Dashboard/.test(transition));
check('generic transition promises the five-minute Snapshot outcome', transition.includes('five-minute Protection Snapshot') && transition.includes('what looks strong'));
check('buyer transition speaks to the closing motivation', transition.includes('last-minute closing issue'));
check('non-renewal transition stays useful and non-decisional', transition.includes('productive replacement-coverage conversation') && !/will find coverage|coverage is available/i.test(transition));

const assessment = read('assessment/index.html');
const payoff = read('assets/js/intent-payoff-continuity.js');
check('assessment intro and checkpoint explain the customer outcome', assessment.replace(/\s+/g, ' ').includes('See what appears to be working') && assessment.replace(/\s+/g, ' ').includes('first discussion priorities to bring to Dylan'));
check('Home checkpoint presentation preserves the same payoff', payoff.includes('coverage questions most worth checking') && payoff.includes('first discussion priorities to bring to Dylan'));
check('assessment remains educational and non-decisional', assessment.replace(/\s+/g, ' ').includes('CoverageFit is not a quote, insurance advice, or a coverage determination'));

const snapshot = {
  customer: { name: 'Avery', propertyAddress: '123 Main St', reviewContext: 'Professional eligibility and home coverage review' },
  entryContext: { occupationSegment: 'Nurse or RN', campaign: 'Work in Healthcare', entryPoint: 'healthcare_eligibility_form', source: '408farmers' },
  assessment: {}, strengths: [], recommendations: [],
  evidenceHandoff: { summary: {}, confirmedFacts: [], verificationItems: [], unresolvedQuestions: [] }
};
const commandModel = command.build(snapshot, {});
check('producer receives a professional verification item', commandModel.verify[0]?.kind === 'professional' && commandModel.verify[0]?.detail.includes('quoting and underwriting'));
check('producer next action names professional verification', commandModel.action.title === 'Verify the professional program opportunity');

const senderRoot = process.env.FARMERS_ROOT;
check('paired sender is available when cross-project QA is requested', !senderRoot || fs.existsSync(path.join(senderRoot, 'VERSION')));
check('paired projects publish one contract when available', !senderRoot || read('professional-intent-contract.json') === fs.readFileSync(path.join(senderRoot, 'professional-intent-contract.json'), 'utf8'));
check('questions and Protection Score methodology remain in place', read('home/assessment-config.js').includes("id:'coveragefit-protection-score-v1'") && read('assets/js/protection-score.js').includes('CoverageFitProtectionScore'));

console.log(JSON.stringify({ suite: 'CRO-1.6.2.1 Intent Payoff and Promise Alignment', version: '3.20.53', passed: checks.length, failed: 0, checks }, null, 2));
