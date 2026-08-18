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

function selectionsFor(answerIndexes) {
  return Object.fromEntries(config.questions.map((question, index) => [
    question.key,
    question.answers[answerIndexes[index] ?? 0]
  ]));
}

function evaluate(answerIndexes) {
  return scoring.evaluate({
    questions: config.questions,
    selections: selectionsFor(answerIndexes),
    methodology: config.scoreMethodology
  });
}

function maxImpactIndexes() {
  return config.questions.map(question => {
    let bestIndex = 0;
    let bestImpact = -1;
    question.answers.forEach((answer, index) => {
      const impact = scoring.impactFor(answer, question);
      if (impact > bestImpact) {
        bestImpact = impact;
        bestIndex = index;
      }
    });
    return bestIndex;
  });
}

check('release version remains compatible after ASMT-1.1', ['3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('authoritative Protection Score module exists', exists('assets/js/protection-score.js'));
check('methodology has a stable identifier', scoring.METHODOLOGY_ID === 'coveragefit-protection-score-v1');
check('methodology defines review readiness and clarity', scoring.MEASURE === 'review-readiness-and-clarity');
check('authoritative score bands are ordered and exhaustive', JSON.stringify(scoring.BANDS.map(band => [band.min, band.max, band.label])) === JSON.stringify([
  [85, 100, 'Well Prepared'],
  [70, 84, 'Strong Foundation'],
  [50, 69, 'Review Recommended'],
  [0, 49, 'Several Areas to Review']
]));
check('band boundaries resolve from the single authority', [
  [100, 'Well Prepared'], [85, 'Well Prepared'], [84, 'Strong Foundation'], [70, 'Strong Foundation'],
  [69, 'Review Recommended'], [50, 'Review Recommended'], [49, 'Several Areas to Review'], [0, 'Several Areas to Review']
].every(([score, label]) => scoring.bandFor(score).label === label));

const totalWeight = config.questions.reduce((sum, question) => sum + Number(question.weight || 0), 0);
check('Home question weights total exactly 100', totalWeight === 100);
check('every scored Home answer has an explicit finding type', config.questions.every(question => question.answers.every(answer => Object.values(scoring.FINDING_TYPES).includes(answer.findingType))));
check('every scored Home answer has a bounded explicit impact', config.questions.every(question => question.answers.every(answer => Number(answer.scoreImpact) >= 0 && Number(answer.scoreImpact) <= 1)));
check('every answer uses a published impact level', config.questions.every(question => question.answers.every(answer => Object.prototype.hasOwnProperty.call(scoring.IMPACT_LEVELS, answer.impactLevel))));
check('legacy points mirror the rounded weighted penalty', config.questions.every(question => question.answers.every(answer => {
  const expected = Math.round(Number(question.weight) * Number(answer.scoreImpact));
  return Number(answer.points) === (expected > 0 ? -expected : 0);
})));
check('no answer can deduct more than its question weight', config.questions.every(question => question.answers.every(answer => Number(question.weight) * Number(answer.scoreImpact) <= Number(question.weight))));

const confirmed = evaluate(Array(config.questions.length).fill(0));
check('all confirmed answers calibrate to 100', confirmed.score === 100);
check('all confirmed answers calibrate to Well Prepared', confirmed.status === 'Well Prepared');
check('all confirmed category scores are 100', confirmed.categories.every(category => category.score === 100));
check('confirmed scenario has no priorities', confirmed.priorities.length === 0);
check('strengths are ranked by importance and stable question order', confirmed.strengths.slice(0, 3).map(item => item.key).join(',') === 'dwelling,water,liability');

const maximumConcern = evaluate(maxImpactIndexes());
check('maximum-concern scenario remains above zero instead of collapsing to the floor', maximumConcern.score === 22);
check('maximum-concern scenario remains in the lowest authoritative band', maximumConcern.status === 'Several Areas to Review');
check('maximum-concern categories remain normalized to 0–100', maximumConcern.categories.every(category => Number.isInteger(category.score) && category.score >= 0 && category.score <= 100));
check('overall weighted penalty cannot exceed total weight', maximumConcern.methodology.totalPenalty <= maximumConcern.methodology.totalWeight);

const ordinanceGap = evaluate([0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]);
const ordinanceUnknown = evaluate([0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0]);
check('identified gap and uncertainty remain distinct findings', ordinanceGap.priorities[0].findingType === 'identified-gap' && ordinanceUnknown.priorities[0].findingType === 'uncertainty');
check('finding-type priority distinguishes a confirmed absence from uncertainty at equal materiality', ordinanceGap.priorities[0].priorityScore > ordinanceUnknown.priorities[0].priorityScore);
check('same-category normalization uses the same weighted penalties as the overall score', ordinanceGap.categories.find(category => category.name === 'Rebuilding').weightedPenalty === 6);

const mixed = evaluate([3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0]);
check('mixed scenario produces a calibrated Strong Foundation score', mixed.score === 78 && mixed.status === 'Strong Foundation');
check('priority ranking balances materiality with finding type', mixed.priorities[0].key === 'dwelling' && mixed.priorities[1].key === 'deductible');
check('priority output includes transparent weight and penalty values', mixed.priorities.every(item => Number.isFinite(item.weight) && Number.isFinite(item.weightedPenalty) && Number.isFinite(item.priorityScore)));

const unanswered = scoring.evaluate({ questions: config.questions, selections: {}, methodology: config.scoreMethodology });
check('an unanswered scored question is treated as uncertainty rather than an identified gap', unanswered.priorities.every(item => item.findingType === 'uncertainty'));
check('unanswered scenario remains normalized and non-negative', unanswered.score === 25);

const legacy = scoring.evaluate({
  questions: [{ key: 'legacy', category: 'Legacy', weight: 10, title: 'Legacy question' }],
  selections: { legacy: { label: 'Legacy negative answer', points: -18, insight: 'Legacy', question: 'Confirm legacy.' } }
});
check('legacy penalties are capped at their assigned weight', legacy.score === 0 && legacy.methodology.totalPenalty === 10);

const assessmentSource = read('assets/js/assessment-engine.js');
check('assessment engine uses the authoritative scoring module', assessmentSource.includes('scoring.evaluate') && assessmentSource.includes('scoreMethodology'));
check('assessment payload carries finding classification, weighted penalty, and priority score', assessmentSource.includes('findingType') && assessmentSource.includes('weightedPenalty') && assessmentSource.includes('priorityScore'));
check('assessment payload carries score diagnostics', assessmentSource.includes('identifiedGapCount') && assessmentSource.includes('uncertaintyCount'));
check('old raw 100 plus point-sum formula is removed', !assessmentSource.includes('100+Object.values(selections)') && !assessmentSource.includes('100 + Object.values(selections)'));
check('hardcoded score-band comparisons are removed from runtime source', ![
  'assets/js/assessment-engine.js',
  'assets/js/interactive-snapshot.js',
  'assets/js/workspace-data.js',
  'assets/js/executive-report-engine.js',
  'assets/js/print/sections/executive-summary.js'
].some(rel => /score\s*>=\s*(85|70|50)|value\s*>=\s*(85|70|50)/.test(read(rel))));
check('Home and Business assessments load the shared methodology before the engine', ['assessment/index.html', 'business/assessment/index.html'].every(rel => {
  const html = read(rel);
  return html.indexOf('/assets/js/protection-score.js') < html.indexOf('/assets/js/assessment-engine.js');
}));
check('prospect report explains the score measure truthfully', read('assets/js/interactive-snapshot.js').includes('review readiness and clarity'));
check('transparent scoring documentation exists', exists('PROTECTION-SCORE-METHODOLOGY.md'));
check('sprint documentation exists', exists('SPRINT-ASMT-1.1.md'));

console.log(`ASMT-1.1 QA: ${checks.length}/${checks.length} passed`);
