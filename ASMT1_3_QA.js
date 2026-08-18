const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const scoring = require('./assets/js/protection-score.js');
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read('home/assessment-config.js'), sandbox, { filename: 'home/assessment-config.js' });
const config = sandbox.window.COVERAGEFIT_CONFIG;
const version = read('VERSION').trim();

function profile(data = {}, verifiedFields = Object.keys(data)) {
  return {
    profileId: 'property-profile-test',
    status: 'confirmed',
    data,
    fieldMeta: Object.fromEntries(Object.keys(data).map(key => [key, {
      verifiedByUser: verifiedFields.includes(key),
      source: verifiedFields.includes(key) ? 'user' : 'provider'
    }]))
  };
}

function resolve(data = {}, verifiedFields = Object.keys(data)) {
  return config.resolveQuestions({ profile: profile(data, verifiedFields), selections: {} });
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

check('release version is ASMT-1.3', ['3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('universal Home core remains eleven questions', config.questions.length === 11);
check('universal Home core remains exactly 100 weight', config.questions.reduce((sum, item) => sum + item.weight, 0) === 100);
check('three property-aware questions are configured', config.propertyQuestions.length === 3);
check('property profile storage key uses the existing confirmed profile', config.profileStorageKey === 'coveragefit_property_profile_v1');
check('property methodology has stable identity and homeowner-confirmed source', config.propertyPersonalization.id === 'coveragefit-home-property-personalization-v1' && config.propertyPersonalization.source === 'homeowner-confirmed-property-profile');
check('question resolver is exposed through the existing config', typeof config.resolveQuestions === 'function');

const base = resolve();
check('no confirmed property characteristics preserves the eleven-question flow', base.length === 11);
check('no property-aware questions appear without applicable confirmed facts', base.every(item => !['poolLiabilityReview','detachedStructuresReview','roofTermsReview'].includes(item.key)));

const unverifiedPool = resolve({ pool: true }, []);
check('unverified provider pool data cannot activate a question', !unverifiedPool.some(item => item.key === 'poolLiabilityReview'));
const poolQuestions = resolve({ pool: true });
check('confirmed pool activates one integrated question', poolQuestions.some(item => item.key === 'poolLiabilityReview') && poolQuestions.length === 12);
check('pool question appears immediately after liability', poolQuestions.findIndex(item => item.key === 'poolLiabilityReview') === poolQuestions.findIndex(item => item.key === 'liability') + 1);
check('confirmed no-pool does not activate the pool question', !resolve({ pool: false }).some(item => item.key === 'poolLiabilityReview'));

const structuresQuestions = resolve({ detachedStructures: true });
check('confirmed detached structures activate one integrated question', structuresQuestions.some(item => item.key === 'detachedStructuresReview') && structuresQuestions.length === 12);
check('detached-structures question follows personal property', structuresQuestions.findIndex(item => item.key === 'detachedStructuresReview') === structuresQuestions.findIndex(item => item.key === 'personalProperty') + 1);
check('confirmed absence of detached structures does not activate the question', !resolve({ detachedStructures: false }).some(item => item.key === 'detachedStructuresReview'));

const currentYear = new Date().getFullYear();
const olderRoofQuestions = resolve({ roofYear: currentYear - 15, roofType: 'Tile' });
check('confirmed roof at the 15-year threshold activates roof terms', olderRoofQuestions.some(item => item.key === 'roofTermsReview'));
check('confirmed newer roof does not activate roof terms', !resolve({ roofYear: currentYear - 14 }).some(item => item.key === 'roofTermsReview'));
check('unverified older roof cannot activate roof terms', !resolve({ roofYear: currentYear - 20 }, []).some(item => item.key === 'roofTermsReview'));
check('roof question follows water-loss review', olderRoofQuestions.findIndex(item => item.key === 'roofTermsReview') === olderRoofQuestions.findIndex(item => item.key === 'water') + 1);

const olderHomeQuestions = resolve({ yearBuilt: currentYear - 40, squareFeet: 2450, stories: 2 });
const dwelling = olderHomeQuestions.find(item => item.key === 'dwelling');
const ordinance = olderHomeQuestions.find(item => item.key === 'ordinanceLaw');
check('confirmed property facts personalize the rebuilding question', dwelling.propertyAware === true && dwelling.propertyContext.includes('2,450 sq ft') && dwelling.propertyContext.includes('2 stories'));
check('property facts do not alter rebuilding score weight', dwelling.weight === 16 && Number(dwelling.priorityBoost || 0) === 0);
check('40-year confirmed home prioritizes code-term verification', ordinance.priorityBoost === 2 && ordinance.propertyContext.includes(String(currentYear - 40)));
check('39-year home does not receive older-home priority boost', Number(resolve({ yearBuilt: currentYear - 39 }).find(item => item.key === 'ordinanceLaw').priorityBoost || 0) === 0);
check('unverified year built cannot personalize or prioritize the questions', !resolve({ yearBuilt: currentYear - 70 }, []).some(item => item.propertyAware));

const allPropertyQuestions = resolve({ pool: true, detachedStructures: true, roofYear: currentYear - 20, roofType: 'Composition shingle', yearBuilt: currentYear - 50, squareFeet: 2800, stories: 2 });
check('all applicable characteristics create fourteen active questions', allPropertyQuestions.length === 14);
check('active weight expands only for applicable questions', allPropertyQuestions.reduce((sum, item) => sum + item.weight, 0) === 116);
check('all confirmed answers still normalize to 100', evaluate(allPropertyQuestions).score === 100);
check('every conditional answer retains explicit normalized scoring metadata', config.propertyQuestions.every(item => item.answers.every(option => Number(option.scoreImpact) >= 0 && Number(option.scoreImpact) <= 1 && Object.values(scoring.FINDING_TYPES).includes(option.findingType))));
check('conditional legacy points mirror rounded weighted penalty', config.propertyQuestions.every(item => item.answers.every(option => option.points === (Math.round(item.weight * option.scoreImpact) ? -Math.round(item.weight * option.scoreImpact) : 0))));

const poolUnknown = evaluate(poolQuestions, { poolLiabilityReview: 3 });
check('pool uncertainty remains bounded and normalized', poolUnknown.score === 96 && poolUnknown.priorities[0].key === 'poolLiabilityReview' && poolUnknown.priorities[0].findingType === 'uncertainty');
const poolChanged = evaluate(poolQuestions, { poolLiabilityReview: 2 });
check('reported post-review pool change is an identified review gap', poolChanged.priorities[0].findingType === 'identified-gap' && poolChanged.priorities[0].priorityScore > poolUnknown.priorities[0].priorityScore);
const roofUnknown = evaluate(olderRoofQuestions, { roofTermsReview: 3 });
check('older-roof uncertainty creates a focused property-aware priority', roofUnknown.score === 96 && roofUnknown.priorities[0].propertyAware === true && roofUnknown.priorities[0].priorityBoost === 2);
const structureChange = evaluate(structuresQuestions, { detachedStructuresReview: 2 });
check('reported detached-structure change is a bounded identified gap', structureChange.score === 96 && structureChange.priorities[0].findingType === 'identified-gap');

const prioritized = evaluate(allPropertyQuestions, { ordinanceLaw: 3, water: 1, poolLiabilityReview: 3 });
check('older-home priority boost can elevate code-term verification above a larger raw penalty', prioritized.priorities[0].key === 'ordinanceLaw' && prioritized.priorities[0].priorityBoost === 2);
check('property priority boost does not change numeric weighted penalty', prioritized.priorities.find(item => item.key === 'ordinanceLaw').weightedPenalty === 6);
check('property priority metadata is transparent in findings', prioritized.priorities.filter(item => item.propertyAware).every(item => typeof item.applicabilityReason === 'string' && item.applicabilityReason.length > 20));

const engine = read('assets/js/assessment-engine.js');
check('assessment engine resolves active questions through the property-aware config', engine.includes('config.resolveQuestions({ selections, profile: profile || {}, reviewReason: activeReviewReason() })'));
check('assessment engine listens for confirmed property profile changes', engine.includes("coveragefit:property-profile-confirmed"));
check('assessment displays a visible property context callout', engine.includes('propertyQuestionContext') && read('assets/css/coveragefit.css').includes('.property-question-context'));
check('assessment payload records property-aware counts and methodology', engine.includes('propertyPersonalization') && engine.includes('propertyAwareQuestionCount') && engine.includes('activeQuestionKeys'));
check('scoring adds priority boost without changing weighted penalty', read('assets/js/protection-score.js').includes('weightedPenalty + (FINDING_PRIORITY_BONUS[type] || 0) + priorityBoost'));
check('property priority boost applies only to nonzero-impact answers', read('assets/js/protection-score.js').includes('const priorityBoost = impact > 0 ? question.priorityBoost : 0'));
check('property confirmation disclosure rejects underwriting conclusions', read('assessment/index.html').replace(/\s+/g, ' ').includes('does not use them to make underwriting, eligibility, valuation, hazard, or coverage conclusions'));
check('no conditional question claims public-record sourcing', !/public record|zillow|parcel data/i.test(JSON.stringify(config.propertyQuestions)));
check('no conditional question declares eligibility, condition, or adequate limits', !/is eligible|is ineligible|roof is damaged|adequate limit|inadequate limit/i.test(JSON.stringify(config.propertyQuestions)));

check('property personalization documentation exists', exists('ASSESSMENT-PROPERTY-PERSONALIZATION.md'));
check('sprint documentation exists', exists('SPRINT-ASMT-1.3.md'));
check('property framework documentation no longer says questions are unused', !read('PROPERTY-INTELLIGENCE.md').includes('No assessment questions are skipped yet'));

console.log(`ASMT-1.3 QA: ${checks.length}/${checks.length} passed`);
