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
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
globalThis.sessionStorage = new MemoryStorage();

const intent = require(path.join(root, 'assets/js/home-intent-reception.js'));
const scoring = require(path.join(root, 'assets/js/protection-score.js'));
const contract = JSON.parse(read('HOME2_7_CAMPAIGN_RECEPTION_CONTRACT.json'));

check('receiver preserves HOME-2.7 campaign reception', ['3.20.58', '3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim() && ['408-HOME-2.7', '408-HOME-2.8', '408-HOME-2.9'].includes(intent.BUILD));
check('valid canonical campaigns normalize', intent.campaignFor({ campaignId: 'home_flyer_95118_rate', campaignZip: '95118', campaignVariant: 'rate' })?.campaignId === 'home_flyer_95118_rate');
check('mismatched and malformed campaigns are rejected', !intent.campaignFor({ campaignId: 'home_flyer_10001_rate', campaignZip: '95118', campaignVariant: 'rate' }) && !intent.campaignFor({ campaignZip: '9511', campaignVariant: 'fit' }));

let combinations = 0;
for (const homeReviewGoal of Object.keys(intent.GOALS)) {
  for (const housingContext of Object.keys(intent.HOUSING)) {
    for (const reviewTiming of Object.keys(intent.TIMING)) {
      for (const campaignVariant of ['rate', 'fit']) {
        const value = intent.build({ flags: { hasProfile: true }, journey: { homeReviewGoal, housingContext, reviewTiming, campaignId: `home_flyer_95118_${campaignVariant}`, campaignZip: '95118', campaignVariant } });
        assert.equal(value.campaign.campaignZip, '95118');
        assert.ok(value.copy.transition.includes('neighborhood flyer context is connected'));
        combinations += 1;
      }
    }
  }
}
check('all 128 intent and flyer combinations preserve bounded continuity', combinations === 128);

const base = intent.build({ flags: { hasProfile: true }, journey: { homeReviewGoal: 'coverage_fit', housingContext: 'owner_occupied', reviewTiming: 'renewal_60' } });
check('generic Home arrivals remain generic', base.campaign === null && !base.copy.transition.includes('flyer context'));
const stored = globalThis.sessionStorage.getItem(intent.STORAGE_KEY) || '';
check('stored campaign context is bounded and contains no PII fields', !/firstName|lastName|email|phone|propertyAddress|consent/i.test(stored));

const questions = [{ key: 'limit', title: 'Limit', category: 'Structure', weight: 10, answers: [] }];
const selections = { limit: { value: 'unsure', label: 'Not sure', scoreImpact: 0.5 } };
const baseline = scoring.evaluate({ questions, selections });
const rate = scoring.evaluate({ questions, selections, campaign: { campaignZip: '95118', campaignVariant: 'rate' } });
const fit = scoring.evaluate({ questions, selections, campaign: { campaignZip: '95118', campaignVariant: 'fit' } });
check('Protection Score is invariant across campaign variants', rate.score === baseline.score && fit.score === baseline.score && rate.methodology.totalPenalty === baseline.methodology.totalPenalty && fit.methodology.totalPenalty === baseline.methodology.totalPenalty);
check('score engine does not read campaign routing fields', !/campaignZip|campaignVariant|campaignId|home_flyer/.test(read('assets/js/protection-score.js')));
check('receiver contract preserves assessment and zero-repeat behavior', contract.unchanged.assessmentQuestions && contract.unchanged.protectionScoreFormula && contract.unchanged.zeroRepeatCompletion && contract.unchanged.contactAndConsentReuse);
check('existing assessment payload retains campaign context for Dylan', ['campaignId', 'campaignVariant', 'campaignZip'].every(field => read('assets/js/assessment-engine.js').includes(field)));
check('campaign reception stylesheet is present', read('assets/css/home-intent-reception.css').includes('.home-intent-reception__campaign'));

console.log(`CF-HOME-2.7 QA: ${checks.length}/${checks.length} passed`);
