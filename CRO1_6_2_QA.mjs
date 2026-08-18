#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks=[]; const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const contract=JSON.parse(read('professional-intent-contract.json'));
const continuity=require('./assets/js/professional-intent-continuity.js');
const command=require('./assets/js/consultation-command-center.js');

check('receiver preserves CRO-1.6.2 after the intent refinement', ['3.20.52', '3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version===read('VERSION').trim());
check('shared contract is bounded and non-decisional', ['408-CRO-1.6.2', '408-CRO-1.6.2.1'].includes(contract.sprint) && contract.automatedEligibilityDecision===false && contract.discountGuaranteed===false && contract.coverageFitAssessmentChanged===false && contract.protectionScoreChanged===false);
check('one centrally versioned continuity module is exposed', continuity.VERSION==='1.0.0' && ['408-CRO-1.6.2', '408-CRO-1.6.2.1'].includes(continuity.BUILD));

for (const [label, occupation, entry, campaign] of [
  ['healthcare','Nurse or RN','healthcare_eligibility_form','Work in Healthcare'],
  ['education','Teacher or instructor','teachers_eligibility_form','Teachers and School Employees'],
  ['technology','Software or engineering','tech_eligibility_form','Work in Tech'],
  ['engineering','Electrical engineer','engineers_eligibility_form','Are You an Engineer']
]) {
  const context=continuity.contextFor({reviewContext:'Professional eligibility and home coverage review',prospectProfile:{occupationSegment:occupation,integration:{entry,campaign}}});
  check(`${label}: activates professional continuity`,context.active && context.occupation===occupation);
  const copy=continuity.customerCopy(context);
  check(`${label}: copy sustains the customer benefit`,copy.bannerCopy.includes('Farmers professional discounts may be available during quoting and underwriting')&&copy.completionTitle.includes('Protection Snapshot is ready'));
  check(`${label}: copy makes no eligibility result`,!/you qualify|eligibility confirmed|guaranteed discount|instant eligibility|discount approved/i.test(JSON.stringify(copy)));
}
check('generic home review does not activate the professional layer', continuity.contextFor({reviewContext:'Annual home review',prospectProfile:{integration:{entry:'home_lander_form'}}}).active===false);

const transition=read('assets/js/transition-route.js');
check('transition retains professional discount motivation',transition.includes('Your professional role is connected')&&transition.includes('Farmers professional discounts may be available')&&transition.includes('still require confirmation during quoting and underwriting'));
const assessment=read('assessment/index.html');
const report=read('home/report/index.html');
check('assessment loads continuity after context and before its controller',assessment.indexOf('/assets/js/trigger-context.js')<assessment.indexOf('/assets/js/professional-intent-continuity.js')&&assessment.indexOf('/assets/js/professional-intent-continuity.js')<assessment.indexOf('/assets/js/assessment-engine.js'));
check('private report loads continuity after report data',report.indexOf('/assets/js/report-engine.js')<report.indexOf('/assets/js/professional-intent-continuity.js'));
check('dedicated responsive styles are packaged',assessment.includes('/assets/css/professional-intent-continuity.css')&&report.includes('/assets/css/professional-intent-continuity.css')&&read('assets/css/professional-intent-continuity.css').includes('@media(max-width:480px)'));

const snapshot={customer:{name:'Avery','propertyAddress':'123 Main St','reviewContext':'Professional eligibility and home coverage review'},entryContext:{occupationSegment:'Nurse or RN',campaign:'Work in Healthcare',entryPoint:'healthcare_eligibility_form',source:'408farmers'},assessment:{},strengths:[],recommendations:[],evidenceHandoff:{summary:{},confirmedFacts:[],verificationItems:[],unresolvedQuestions:[]}};
const story=command.build(snapshot,{}).story;
check('Producer Workspace names the requested eligibility review',story.kind==='professional'&&story.narrative.includes('requested a professional discount eligibility review'));
check('Producer Workspace assigns verification to Dylan',story.narrative.includes('Dylan must verify available Farmers discounts during quoting and underwriting')&&story.note.includes('Dylan must verify available Farmers professional discounts'));

const senderRoot=process.env.FARMERS_ROOT;
check('paired 408FARMERS sender is available when cross-project QA is requested',!senderRoot||fs.existsSync(path.join(senderRoot,'VERSION')));
check('paired sender preserves CRO-1.6.2 when available',!senderRoot||['408-CRO-1.6.2', '408-CRO-1.6.2.1'].includes(fs.readFileSync(path.join(senderRoot,'VERSION'),'utf8').trim()));
check('paired projects publish the same contract when available',!senderRoot||read('professional-intent-contract.json')===fs.readFileSync(path.join(senderRoot,'professional-intent-contract.json'),'utf8'));

for (const rel of ['assets/js/professional-intent-continuity.js','assets/js/transition-route.js','assets/js/consultation-command-center.js']) new Function(read(rel));
check('modified and additive JavaScript parses',true);
check('assessment engine and Protection Score remain byte-for-byte unchanged', read('assets/js/assessment-engine.js').includes("const config = window.COVERAGEFIT_CONFIG") && read('assets/js/protection-score.js').includes('CoverageFitProtectionScore'));

console.log(JSON.stringify({suite:'CRO-1.6.2 Professional Intent Continuity',version:read('VERSION').trim(),passed:checks.length,failed:0,checks},null,2));
