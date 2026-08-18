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
const questions = config.questions;
const version = read('VERSION').trim();

function question(key) {
  const match = questions.find(item => item.key === key);
  assert.ok(match, `missing question ${key}`);
  return match;
}

function answer(key, index) {
  const match = question(key).answers[index];
  assert.ok(match, `missing answer ${key}[${index}]`);
  return match;
}

function evaluate(overrides = {}) {
  const selections = Object.fromEntries(questions.map(item => [item.key, item.answers[0]]));
  Object.entries(overrides).forEach(([key, index]) => {
    selections[key] = answer(key, index);
  });
  return scoring.evaluate({
    questions,
    selections,
    methodology: config.scoreMethodology
  });
}

check('release version is ASMT-1.2', ['3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('Home methodology advances to question-validity version 1.1.0', config.scoreMethodology.version === '1.1.0');
check('Home assessment contains eleven bounded questions', questions.length === 11);
check('Home question weights remain exactly 100', questions.reduce((sum, item) => sum + Number(item.weight || 0), 0) === 100);
check('every question declares the construct it measures', questions.every(item => typeof item.construct === 'string' && item.construct.length > 3));
check('every question has neutral explanatory help text', questions.every(item => /^Why we're asking:/.test(item.help) && item.help.length > 70));
check('question titles no longer rely on unanchored confidence wording', questions.every(item => !/how confident/i.test(item.title)));
check('answer labels are unique within every question', questions.every(item => new Set(item.answers.map(option => option.label)).size === item.answers.length));
check('generic bare yes and no labels are removed', questions.every(item => item.answers.every(option => !/^(yes|no)$/i.test(option.label.trim()))));
check('all answers retain explicit normalized scoring metadata', questions.every(item => item.answers.every(option =>
  Number(option.scoreImpact) >= 0 && Number(option.scoreImpact) <= 1 &&
  Object.prototype.hasOwnProperty.call(scoring.IMPACT_LEVELS, option.impactLevel) &&
  Object.values(scoring.FINDING_TYPES).includes(option.findingType)
)));
check('strength findings require zero impact', questions.every(item => item.answers.every(option => option.findingType !== 'strength' || option.scoreImpact === 0)));
check('identified gaps require material or full impact', questions.every(item => item.answers.every(option => option.findingType !== 'identified-gap' || option.scoreImpact >= 0.75)));
check('uncertainty never uses zero impact', questions.every(item => item.answers.every(option => option.findingType !== 'uncertainty' || option.scoreImpact > 0)));
check('considerations remain nonzero but do not exceed material impact', questions.every(item => item.answers.every(option => option.findingType !== 'consideration' || (option.scoreImpact > 0 && option.scoreImpact <= 0.75))));
check('legacy point values still mirror rounded normalized penalties', questions.every(item => item.answers.every(option => {
  const expected = Math.round(item.weight * option.scoreImpact);
  return option.points === (expected ? -expected : 0);
})));

const fullText = JSON.stringify(questions);
check('sales-biased liability baseline language is removed', !/stronger baseline|potentially low for many homeowners|\$500,000 or higher/i.test(fullText));
check('assessment does not tell every homeowner to buy an umbrella', !/should carry an umbrella|need an umbrella policy/i.test(fullText));
check('positive answers use confirmed or reviewed states rather than belief alone', questions.every(item => item.answers
  .filter(option => option.findingType === 'strength')
  .every(option => /review|know|confirm|decision|unchanged|occurred|carry|included/i.test(`${option.label} ${option.sub}`))));

const liability = question('liability');
check('liability measures exposure review rather than assigning adequacy to one limit', liability.construct === 'exposure-review' && !liability.answers.some(option => option.label === '$500,000 or higher'));
check('lower stated liability without review is a consideration, not an adequacy verdict', answer('liability', 2).findingType === 'consideration' && answer('liability', 2).scoreImpact === 0.75);
check('unknown liability remains uncertainty', answer('liability', 3).findingType === 'uncertainty');

const umbrella = question('umbrella');
check('umbrella question is neutral about product ownership', /not automatically appropriate for every household/i.test(umbrella.help));
check('reviewed decision not to carry umbrella is a strength', answer('umbrella', 1).findingType === 'strength' && answer('umbrella', 1).scoreImpact === 0);
check('unreviewed umbrella need is a consideration', answer('umbrella', 2).findingType === 'consideration');
check('umbrella product uncertainty remains uncertainty', answer('umbrella', 3).findingType === 'uncertainty');

const deductible = question('deductible');
check('deductible separates knowledge from affordability', deductible.construct === 'financial-readiness' && deductible.answers.length === 5);
check('unknown deductible amounts have a truthful uncertainty path', answer('deductible', 4).findingType === 'uncertainty' && /do not know/i.test(answer('deductible', 4).label));
check('unfundable deductible is an identified gap', answer('deductible', 3).findingType === 'identified-gap' && answer('deductible', 3).scoreImpact === 1);

check('known absence of additional rebuilding protection is a consideration, not automatic inadequacy', answer('extendedReplacement', 2).findingType === 'consideration');
check('belief without amount does not earn a strength', answer('extendedReplacement', 1).findingType === 'uncertainty');
check('building-code absence and uncertainty remain distinct findings at equal impact', answer('ordinanceLaw', 2).findingType === 'identified-gap' && answer('ordinanceLaw', 3).findingType === 'uncertainty' && answer('ordinanceLaw', 2).scoreImpact === answer('ordinanceLaw', 3).scoreImpact);
check('temporary-living responses represent four distinct knowledge states', question('lossOfUse').answers.length === 4 && new Set(question('lossOfUse').answers.map(option => option.insight)).size === 4);
check('personal-property question separates settlement method from valuable-item review', question('personalProperty').answers.some(option => /settlement method/i.test(option.label)) && question('personalProperty').answers.some(option => /valuable items/i.test(option.label)));
check('life-change question includes unknown review-history state', answer('lifeEvents', 3).findingType === 'uncertainty' && /last full review/i.test(answer('lifeEvents', 3).label));

const separate = question('separatePerils');
check('missing separate-hazards domain is now included', separate.category === 'Separate Hazards' && separate.weight === 7);
check('separate-hazard wording is product-neutral', /not determining that you need a particular product/i.test(separate.help));
check('unreviewed separate hazards are uncertainty, not a presumed gap', answer('separatePerils', 2).findingType === 'uncertainty');

const confirmed = evaluate();
check('all confirmed or deliberately reviewed responses remain calibrated to 100', confirmed.score === 100 && confirmed.status === 'Well Prepared');
check('reviewed decision not to carry umbrella does not reduce the score', evaluate({ umbrella: 1 }).score === 100);
const extendedAbsent = evaluate({ extendedReplacement: 2 });
const extendedUnknown = evaluate({ extendedReplacement: 3 });
check('known additional-rebuilding absence surfaces as a consideration', extendedAbsent.score === 96 && extendedAbsent.priorities[0].findingType === 'consideration');
check('unknown additional-rebuilding term carries more uncertainty than a deliberate known condition', extendedUnknown.score === 94 && extendedUnknown.score < extendedAbsent.score && extendedUnknown.priorities[0].findingType === 'uncertainty');
const liabilityLower = evaluate({ liability: 2 });
check('lower unreviewed liability creates a focused consideration without an adequacy declaration', liabilityLower.score === 90 && liabilityLower.priorities[0].findingType === 'consideration');
const deductibleUnfundable = evaluate({ deductible: 3 });
check('unfundable deductible produces a focused identified gap', deductibleUnfundable.score === 90 && deductibleUnfundable.priorities[0].findingType === 'identified-gap');
const separateUnreviewed = evaluate({ separatePerils: 2 });
check('unreviewed separate hazards produce a bounded uncertainty', separateUnreviewed.score === 95 && separateUnreviewed.priorities[0].findingType === 'uncertainty');
const mixed = evaluate({ dwelling: 1, liability: 2 });
check('mixed considerations calibrate to Strong Foundation', mixed.score === 82 && mixed.status === 'Strong Foundation');
check('mixed priorities rank by weighted materiality', mixed.priorities[0].key === 'liability' && mixed.priorities[1].key === 'dwelling');

const maximumIndexes = Object.fromEntries(questions.map(item => {
  let index = 0;
  item.answers.forEach((option, candidate) => {
    if (scoring.impactFor(option, item) > scoring.impactFor(item.answers[index], item)) index = candidate;
  });
  return [item.key, index];
}));
const maximumConcern = evaluate(maximumIndexes);
check('maximum-concern scenario remains differentiated above zero', maximumConcern.score === 22);
const unanswered = scoring.evaluate({ questions, selections: {}, methodology: config.scoreMethodology });
check('all unanswered questions remain uncertainty rather than asserted gaps', unanswered.score === 25 && unanswered.priorities.every(item => item.findingType === 'uncertainty'));

check('question-validity audit documentation exists', exists('ASSESSMENT-QUESTION-VALIDITY-AUDIT.md'));
check('methodology documentation includes validity principles and the new domain', read('PROTECTION-SCORE-METHODOLOGY.md').includes('Question validity principles') && read('PROTECTION-SCORE-METHODOLOGY.md').includes('Separate hazard review'));
check('sprint documentation exists', exists('SPRINT-ASMT-1.2.md'));

console.log(`ASMT-1.2 QA: ${checks.length}/${checks.length} passed`);
