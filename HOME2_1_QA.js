#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, condition) => { assert(condition, name); checks.push(name); };

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const receiver = JSON.parse(read('HOME2_1_RECEIVER_CONTRACT.json'));
const assessment = read('assessment/index.html');
const prefill = read('assets/js/prefill-intake.js');
const personalization = read('assets/js/personalization-context.js');
const baseline = read('assets/js/home-journey-baseline.js');
const engine = read('assets/js/assessment-engine.js');

check('release preserves HOME-2.1 after HOME-2.6', ['3.20.56', '3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('receiver aligns to home-review-journey-v1', receiver.journeyContract === 'home-review-journey-v1' && receiver.build === 'CF-HOME-2.1');
check('all three semantic fields are accepted', ['home_review_goal', 'housing_context', 'review_timing'].every(field => receiver.acceptedSemanticFields.includes(field) && prefill.includes(`params.get('${field}')`)));
check('all semantic fields are removed from the visible URL', ['home_review_goal', 'housing_context', 'review_timing'].every(field => prefill.slice(prefill.indexOf('const PII_KEYS'), prefill.indexOf('const MARKER_KEYS')).includes(`'${field}'`)));
check('semantic fields survive normalization', ['homeReviewGoal', 'housingContext', 'reviewTiming'].every(field => personalization.includes(field)));
check('baseline adapter only forwards the existing start and completion events', baseline.includes('assessment_started') && baseline.includes('assessment_completed') && Object.keys(receiver.receiverEvents).length === 2);
check('shared event names align with sender contract', baseline.includes('home_assessment_started') && baseline.includes('home_assessment_completed'));
check('baseline adapter requires a trusted Home handoff', baseline.includes('trustedContract') && baseline.includes('isHomeHandoff') && baseline.includes("assessment === 'home'"));
check('journey adapter does not inspect homeowner identity, contact, property, or score', !['.identity', '.contact', '.property', 'score:'].some(token => baseline.includes(token)));
check('receiver event allowlist contains no personal fields', !receiver.eventProperties.some(field => /name|email|phone|address|property|score/i.test(field)));
check('adapter loads after analytics and before assessment engine', assessment.indexOf('/assets/js/analytics.js') < assessment.indexOf('/assets/js/home-journey-baseline.js') && assessment.indexOf('/assets/js/home-journey-baseline.js') < assessment.indexOf('/assets/js/assessment-engine.js'));
check('existing assessment events remain intact', engine.includes("track('assessment_started'") && engine.includes("track('assessment_completed'"));
check('receiver contract explicitly protects scoring and assessment content', receiver.unchanged.assessmentQuestions === true && receiver.unchanged.protectionScore === true && receiver.unchanged.zeroRepeatCompletion === true);

console.log(`CF-HOME-2.1 QA: ${checks.length}/${checks.length} passed`);
