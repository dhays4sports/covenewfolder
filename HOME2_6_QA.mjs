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
const records = require(path.join(root, 'assets/js/consultation-records.js'));
const inbox = await import(path.join(root, 'server/consultation-inbox-core.mjs'));
const contract = JSON.parse(read('HOME2_6_INTENT_RECEPTION_CONTRACT.json'));
const prefill = read('assets/js/prefill-intake.js');
const assessment = read('assessment/index.html');
const transition = read('transition/index.html');
const property = read('assets/js/property-confirmation.js');
const contact = read('assets/js/contact-prefill.js');
const engine = read('assets/js/assessment-engine.js');

check('release preserves HOME-2.6 intent reception', ['3.20.57', '3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('contract names all three bounded fields', Object.keys(contract.acceptedFields).join(',') === 'home_review_goal,housing_context,review_timing');

let combinations = 0;
for (const homeReviewGoal of Object.keys(intent.GOALS)) {
  for (const housingContext of Object.keys(intent.HOUSING)) {
    for (const reviewTiming of Object.keys(intent.TIMING)) {
      const value = intent.build({ flags: { hasProfile: true }, journey: { homeReviewGoal, housingContext, reviewTiming } });
      assert.equal(value.active, true);
      assert.ok(value.copy.opening && value.copy.assessment && value.copy.scoreBoundary);
      combinations += 1;
    }
  }
}
check('all 64 intent combinations normalize and produce opening copy', combinations === 64);
check('invalid marketing values are rejected', intent.build({ flags: { hasProfile: true }, journey: { homeReviewGoal: 'free text', housingContext: 'owner_occupied', reviewTiming: 'later' } }) === null);
check('intent-only storage contains no personal fields', !/name|email|phone|address|consent/i.test(globalThis.sessionStorage.getItem(intent.STORAGE_KEY) || ''));
check('all personal, consent, and intent parameters are scrubbed from the visible URL', ['first_name', 'last_name', 'phone', 'email', 'property_address', 'contact_consent', 'consent_at', 'home_review_goal', 'housing_context', 'review_timing'].every(field => prefill.includes(`'${field}'`)) && prefill.includes('history.replaceState'));
check('transition and assessment opening load intent reception', transition.includes('home-intent-reception.js') && transition.includes('transitionIntent') && assessment.includes('home-intent-reception.js'));
check('property is confirmed once and continues directly to the quiz', property.includes('propertyQuickConfirmBtn') && property.includes('continueToAssessment') && property.includes("quiz.style.display = ''"));
check('contact and consent remain privately reusable', contact.includes('permissionConfirmed') && contact.includes('contactConsentConfirm') && contact.includes('carried forward from the 408FARMERS request') && prefill.includes('contactPermission'));
check('assessment payload retains existing prospect and personalization contexts', engine.includes('personalizationContext: personalization') && engine.includes('prospectProfile: prospect'));

const sampleIntent = intent.forRecord({ flags: { hasProfile: true }, journey: { homeReviewGoal: 'coverage_fit', housingContext: 'owner_occupied', reviewTiming: 'renewal_60' } });
const questions = [{ key: 'limit', title: 'Limit', category: 'Structure', weight: 10, answers: [] }];
const selections = { limit: { value: 'unsure', label: 'Not sure', scoreImpact: 0.5 } };
const baseScore = scoring.evaluate({ questions, selections });
for (const homeReviewGoal of Object.keys(intent.GOALS)) {
  const candidate = scoring.evaluate({ questions, selections, entryIntent: { ...sampleIntent, homeReviewGoal } });
  assert.deepEqual({ score: candidate.score, totalPenalty: candidate.methodology.totalPenalty }, { score: baseScore.score, totalPenalty: baseScore.methodology.totalPenalty });
}
check('Protection Score is invariant across marketing intent', true);
check('score engine never reads the intent receiver', !read('assets/js/protection-score.js').includes('HomeIntent') && !read('assets/js/protection-score.js').includes('homeReviewGoal'));

const report = {
  assessment: 'home', createdAt: '2026-08-13T00:00:00.000Z', score: 72, status: 'Strong Foundation',
  topPriority: 'Dwelling limit', strongest: 'Liability',
  personalizationContext: { journey: { homeReviewGoal: 'coverage_fit', housingContext: 'owner_occupied', reviewTiming: 'renewal_60' } },
  prospectProfile: { firstName: 'Test', fullName: 'Test Person', email: 'test@example.com', homeReviewGoal: 'coverage_fit', housingContext: 'owner_occupied', reviewTiming: 'renewal_60' },
  consumer: { name: 'Test Person', firstName: 'Test', email: 'test@example.com' },
  consultationRecord: { id: 'consultation-home26test', createdAt: '2026-08-13T00:00:00.000Z' },
  integration: { source: '408farmers', entry: 'home_lander_form', sessionId: 'qa-session' }
};
const localStorage = new MemoryStorage();
const local = records.upsert(report, { storage: localStorage, now: () => new Date('2026-08-13T00:00:01.000Z'), dispatch: false });
check('local completed consultation record retains bounded intent in its report context', local.report?.personalizationContext?.journey?.homeReviewGoal === 'coverage_fit' && local.report?.prospectProfile?.reviewTiming === 'renewal_60');
const remote = inbox.normalizeRemoteRecord(report, { submittedAt: '2026-08-13T00:00:02.000Z' });
check('server-backed completed consultation record retains bounded intent in its report context', remote.report?.personalizationContext?.journey?.housingContext === 'owner_occupied');
check('intent score policy is immutable and explicit', Object.values(intent.SCORE_POLICY).every(value => value === false));
check('contract preserves the existing assessment and zero-repeat completion', contract.unchanged.assessmentQuestions && contract.unchanged.protectionScoreFormula && contract.unchanged.zeroRepeatCompletion);

console.log(`CF-HOME-2.6 QA: ${checks.length}/${checks.length} passed`);
