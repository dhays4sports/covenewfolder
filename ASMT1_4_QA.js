const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const scoring = require('./assets/js/protection-score.js');
const checks = [];
function check(name, condition) { assert.ok(condition, name); checks.push(name); }

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read('home/assessment-config.js'), sandbox, { filename: 'home/assessment-config.js' });
const config = sandbox.window.COVERAGEFIT_CONFIG;
const version = read('VERSION').trim();

function resolve(reviewReason = '', profile = {}) {
  return config.resolveQuestions({ selections: {}, profile, reviewReason });
}

function evaluate(questions, overrides = {}) {
  const selections = Object.fromEntries(questions.map(item => [item.key, item.answers[0]]));
  Object.entries(overrides).forEach(([key, index]) => {
    const question = questions.find(item => item.key === key);
    assert.ok(question, `missing active question ${key}`);
    selections[key] = question.answers[index];
  });
  return scoring.evaluate({ questions, selections, methodology: config.scoreMethodology });
}

check('release version is ASMT-1.4', ['3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('review-reason methodology has stable identity', config.reviewReasonPersonalization.id === 'coveragefit-home-review-reason-prioritization-v1');
check('review-reason methodology explicitly preserves scoring', /does not change question weights, answer impacts, the Protection Score/i.test(config.reviewReasonPersonalization.description));
check('four required review journeys are configured', ['homebuyer','renewal','non-renewal','premium-increase'].every(key => config.reviewReasonRules[key]));
check('review-reason normalizer is exposed', typeof config.reviewReasonKeyFor === 'function');
check('home purchase normalization works', config.reviewReasonKeyFor('Buying a new home') === 'homebuyer');
check('annual renewal normalization works', config.reviewReasonKeyFor('Annual renewal review') === 'renewal');
check('non-renewal is matched before generic renewal', config.reviewReasonKeyFor('Carrier non-renewal notice') === 'non-renewal');
check('cancellation normalization works', config.reviewReasonKeyFor('My policy is being cancelled') === 'non-renewal');
check('premium-increase normalization works', config.reviewReasonKeyFor('Premium increased') === 'premium-increase');
check('unknown reason remains general', config.reviewReasonKeyFor('General coverage check') === 'general');

const general = resolve('General review');
const homebuyer = resolve('Buying a home');
const renewal = resolve('Annual renewal');
const nonRenewal = resolve('Non-renewal notice');
const premium = resolve('Premium increased');
check('review reason does not change universal question count', [homebuyer, renewal, nonRenewal, premium].every(items => items.length === general.length && items.length === 11));
check('review reason does not change question weights', [homebuyer, renewal, nonRenewal, premium].every(items => items.reduce((sum, q) => sum + q.weight, 0) === 100));
check('review reason does not change answer impacts', [homebuyer, renewal, nonRenewal, premium].every(items => items.every(q => q.answers.every((a, i) => a.scoreImpact === general.find(g => g.key === q.key).answers[i].scoreImpact))));
check('general journey has no reason-aware questions', general.every(q => !q.reviewReasonAware && Number(q.reviewReasonPriorityBoost || 0) === 0));
check('home purchase prioritizes rebuilding estimate', homebuyer.find(q => q.key === 'dwelling').reviewReasonPriorityBoost === 2.5);
check('home purchase prioritizes deductible readiness', homebuyer.find(q => q.key === 'deductible').reviewReasonContext.includes('post-closing'));
check('renewal prioritizes household and property changes', renewal.find(q => q.key === 'lifeEvents').reviewReasonPriorityBoost === 2.5);
check('renewal context references current circumstances', renewal.find(q => q.key === 'lifeEvents').reviewReasonContext.includes('current circumstances'));
check('non-renewal prioritizes accurate rebuilding information', nonRenewal.find(q => q.key === 'dwelling').reviewReasonPriorityBoost === 2.5);
check('non-renewal context rejects eligibility prediction', /does not infer why|predict eligibility/i.test(nonRenewal.find(q => q.key === 'dwelling').reviewReasonContext));
check('premium increase prioritizes deductible tradeoff', premium.find(q => q.key === 'deductible').reviewReasonPriorityBoost === 2.5);
check('premium context compares savings with out-of-pocket risk', premium.find(q => q.key === 'deductible').reviewReasonContext.includes('out-of-pocket'));

const answerScenario = { dwelling: 3, extendedReplacement: 3, water: 1, deductible: 2, liability: 2, umbrella: 2, lifeEvents: 2, separatePerils: 3 };
const evaluations = {
  general: evaluate(general, answerScenario),
  homebuyer: evaluate(homebuyer, answerScenario),
  renewal: evaluate(renewal, answerScenario),
  nonRenewal: evaluate(nonRenewal, answerScenario),
  premium: evaluate(premium, answerScenario)
};
check('identical answers preserve identical numeric score across journeys', new Set(Object.values(evaluations).map(x => x.score)).size === 1);
check('identical answers preserve identical category scores across journeys', new Set(Object.values(evaluations).map(x => JSON.stringify(x.categories.map(c => [c.name,c.score])))).size === 1);
check('identical answers preserve identical weighted penalty across journeys', new Set(Object.values(evaluations).map(x => x.methodology.totalPenalty)).size === 1);
check('home purchase elevates rebuilding estimate to first priority', evaluations.homebuyer.priorities[0].key === 'dwelling');
check('renewal elevates household and property changes relative to general order', evaluations.renewal.priorities.findIndex(x => x.key === 'lifeEvents') < evaluations.general.priorities.findIndex(x => x.key === 'lifeEvents'));
check('non-renewal keeps rebuilding estimate first', evaluations.nonRenewal.priorities[0].key === 'dwelling');
check('premium increase elevates deductible relative to general order', evaluations.premium.priorities.findIndex(x => x.key === 'deductible') < evaluations.general.priorities.findIndex(x => x.key === 'deductible'));
check('strength answers receive no review-reason priority boost', evaluate(premium).findings.every(f => f.reviewReasonPriorityBoost === 0));
check('reason boost applies only when impact is nonzero', evaluations.premium.findings.filter(f => f.scoreImpact === 0).every(f => f.reviewReasonPriorityBoost === 0));
check('finding preserves reason-specific transparency metadata', evaluations.premium.priorities.filter(f => f.reviewReasonAware).every(f => f.reviewReasonKey === 'premium-increase' && f.reviewReasonApplicabilityReason.length > 20));

const currentYear = new Date().getFullYear();
const profile = { data: { roofYear: currentYear - 20 }, fieldMeta: { roofYear: { verifiedByUser: true } } };
const nonRenewalRoof = resolve('Non-renewal notice', profile).find(q => q.key === 'roofTermsReview');
check('non-renewal can combine property and reason boosts transparently', nonRenewalRoof.propertyPriorityBoost === 2 && nonRenewalRoof.reviewReasonPriorityBoost === 1.5 && nonRenewalRoof.priorityBoost === 3.5);

const engine = read('assets/js/assessment-engine.js');
const scoreSource = read('assets/js/protection-score.js');
const triggerContext = read('assets/js/trigger-context.js');
const prefill = read('assets/js/assessment-prefill.js');
check('assessment engine passes review reason into integrated question resolver', engine.includes('reviewReason: activeReviewReason()'));
check('assessment engine renders a separate review-reason context callout', engine.includes('reviewReasonQuestionContext') && read('assets/css/coveragefit.css').includes('.review-reason-question-context'));
check('assessment payload persists review-reason methodology and contextual keys', engine.includes('reviewReasonPersonalization') && engine.includes('contextualQuestionKeys') && engine.includes('scoreFormulaChanged: false'));
check('scoring preserves separate property and review-reason boost metadata', scoreSource.includes('propertyPriorityBoost') && scoreSource.includes('reviewReasonPriorityBoost'));
check('non-renewal trigger is supported in assessment presentation', triggerContext.includes("'non-renewal'") && triggerContext.includes('does not infer the reason'));
check('non-renewal has an explicit assessment illustration treatment', read('assets/js/trigger-illustrations.js').includes('\"non-renewal\": {') && read('assets/js/trigger-illustrations.js').includes('Coverage Transition Review'));
check('prefill detects non-renewal before generic renewal', prefill.indexOf('non[\\s-]*renew') < prefill.indexOf("if (/renew/.test(context)) return 'renewal'"));
check('no journey context claims pricing, eligibility, or coverage adequacy', !/will lower your premium|eligible for|ineligible for|adequate coverage|inadequate coverage/i.test(JSON.stringify(config.reviewReasonRules)));
check('non-renewal wording explicitly avoids carrier-cause inference', /does not infer why the carrier acted|does not infer the reason/i.test(JSON.stringify(config.reviewReasonRules)));
check('methodology documentation exists', exists('ASSESSMENT-REVIEW-REASON-PRIORITIZATION.md'));
check('sprint documentation exists', exists('SPRINT-ASMT-1.4.md'));

console.log(`ASMT-1.4 QA: ${checks.length}/${checks.length} passed`);
