const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

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

function selectionsFor(questions, indexByKey = {}) {
  return Object.fromEntries(questions.map(question => [
    question.key,
    question.answers[Object.prototype.hasOwnProperty.call(indexByKey, question.key) ? indexByKey[question.key] : 0]
  ]));
}

function evaluate(questions, indexByKey = {}, selected = null) {
  return scoring.evaluate({
    questions,
    selections: selected || selectionsFor(questions, indexByKey),
    methodology: config.scoreMethodology
  });
}

(async () => {
  check('release version remains compatible after ASMT-1.5', ['3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('evidence methodology is configured', config.evidenceQualityMethodology.id === 'coveragefit-assessment-evidence-quality-v1');
  check('evidence methodology adds no questions and preserves scoring', /adds no questions/i.test(config.evidenceQualityMethodology.description) && /does not change question weights, answer impacts, category scores, or the Protection Score formula/i.test(config.evidenceQualityMethodology.description));
  check('four evidence states are exposed', ['confirmed','partial','needs-verification','missing'].every(value => Object.values(scoring.EVIDENCE_QUALITY).includes(value)));
  check('human-readable evidence labels are exposed', Object.values(scoring.EVIDENCE_LABELS).length === 4);
  check('evidence classifier is public', typeof scoring.evidenceQualityFor === 'function');
  check('evidence summary is public', typeof scoring.evidenceSummary === 'function');

  const questions = resolve('General review');
  const complete = evaluate(questions);
  check('baseline Home review still has eleven universal questions', questions.length === 11);
  check('baseline Home weights remain 100', questions.reduce((sum, question) => sum + question.weight, 0) === 100);
  check('all strongest answers are classified as confirmed', complete.findings.every(finding => finding.evidenceQuality === 'confirmed'));
  check('all strongest answers are sufficient evidence', complete.findings.every(finding => finding.evidenceSufficient === true));
  check('fully confirmed review is complete', complete.completion.state === 'complete');
  check('fully confirmed review has no follow-up items', complete.completion.followUpCount === 0);
  check('fully confirmed review is final', complete.completion.scoreIsFinal === true && complete.completion.completionRate === 100);
  check('evidence contract explicitly preserves score formula', complete.completion.scoreFormulaChanged === false);

  const mixed = evaluate(questions, {
    extendedReplacement: 1,
    separatePerils: 1,
    ordinanceLaw: 2,
    deductible: 3
  });
  const extension = mixed.findings.find(finding => finding.key === 'extendedReplacement');
  const separate = mixed.findings.find(finding => finding.key === 'separatePerils');
  const ordinance = mixed.findings.find(finding => finding.key === 'ordinanceLaw');
  const deductible = mixed.findings.find(finding => finding.key === 'deductible');
  check('uncertain policy assumption needs verification', extension.evidenceQuality === 'needs-verification' && extension.evidenceSufficient === false);
  check('open decision can be classified as partial', separate.evidenceQuality === 'partial' && separate.evidenceSufficient === false);
  check('a clearly reported identified gap remains confirmed evidence', ordinance.findingType === 'identified-gap' && ordinance.evidenceQuality === 'confirmed' && ordinance.evidenceSufficient === true);
  check('financial strain answer is confirmed evidence despite adverse impact', deductible.scoreImpact > 0 && deductible.evidenceQuality === 'confirmed');
  check('mixed complete review is complete with verification items', mixed.completion.state === 'complete-with-verification');
  check('mixed review separates partial and verification counts', mixed.completion.partialCount === 1 && mixed.completion.needsVerificationCount === 1);
  check('mixed review remains final because all required questions were answered', mixed.completion.scoreIsFinal === true && mixed.completion.missingRequiredCount === 0);
  check('follow-up keys include both non-confirmed evidence findings', ['extendedReplacement','separatePerils'].every(key => mixed.completion.followUpQuestionKeys.includes(key)));

  const incomplete = evaluate(questions, {}, {});
  check('missing required answers create incomplete state', incomplete.completion.state === 'incomplete');
  check('all eleven required questions are identified as missing', incomplete.completion.missingRequiredCount === 11 && incomplete.completion.missingQuestionKeys.length === 11);
  check('incomplete assessment score is explicitly non-final', incomplete.completion.scoreIsFinal === false && incomplete.completion.completionRate === 0);
  check('missing findings are distinct from answered uncertainty', incomplete.findings.every(finding => finding.evidenceQuality === 'missing' && finding.answered === false));

  const optionalQuestion = {
    key: 'optional-note', title: 'Optional note', category: 'Test', weight: 1, required: false,
    answers: [{ label: 'Provided', scoreImpact: 0, findingType: 'strength' }]
  };
  const optional = scoring.evaluate({ questions: [optionalQuestion], selections: {} });
  check('optional skipped response does not block completion', optional.completion.state === 'complete' && optional.completion.missingRequiredCount === 0);
  check('optional skipped response is counted separately', optional.completion.optionalSkippedCount === 1);

  const priorScenario = { dwelling: 3, extendedReplacement: 3, water: 1, deductible: 2, liability: 2, umbrella: 2, lifeEvents: 2, separatePerils: 3 };
  const journeys = ['General review','Buying a home','Annual renewal','Non-renewal notice','Premium increased'].map(reason => evaluate(resolve(reason), priorScenario));
  check('evidence layer preserves identical numeric scores across review journeys', new Set(journeys.map(item => item.score)).size === 1);
  check('evidence layer preserves identical category scores across review journeys', new Set(journeys.map(item => JSON.stringify(item.categories.map(category => [category.name, category.score])))).size === 1);
  check('evidence layer preserves identical weighted penalties across review journeys', new Set(journeys.map(item => item.methodology.totalPenalty)).size === 1);
  check('evidence layer preserves reason-aware priority ordering behavior', journeys[1].priorities[0].key === 'dwelling' && journeys[3].priorities[0].key === 'dwelling');

  const currentYear = new Date().getFullYear();
  const propertyProfile = {
    data: { pool: true, detachedStructures: true, roofYear: currentYear - 20 },
    fieldMeta: {
      pool: { verifiedByUser: true },
      detachedStructures: { verifiedByUser: true },
      roofYear: { verifiedByUser: true }
    }
  };
  const propertyQuestions = resolve('Annual renewal', propertyProfile);
  const propertyComplete = evaluate(propertyQuestions);
  check('property-aware questions participate in evidence completion', propertyQuestions.length === 14 && propertyComplete.completion.requiredQuestionCount === 14);
  check('property-aware complete review remains final', propertyComplete.completion.state === 'complete' && propertyComplete.completion.scoreIsFinal === true);

  const engine = read('assets/js/assessment-engine.js');
  const scoreSource = read('assets/js/protection-score.js');
  const reportSource = read('assets/js/report-engine.js');
  const workspaceSource = read('assets/js/workspace-data.js');
  const clientReportSource = read('assets/js/prospect-report-access.js');
  const serverReportSource = read('server/prospect-report-core.mjs');
  const css = read('assets/css/coveragefit.css');
  check('answer feedback preserves evidence classification without adding a question', engine.includes('renderAnswerFeedback') && engine.includes('evidenceStateFor') && engine.includes('feedback.dataset.evidenceQuality'));
  check('completion redirects to first missing required question', engine.includes("findIndex(question => question.required !== false && !selections[question.key])") && engine.includes('showIncompleteFeedback'));
  check('contact submission repeats the completion guard', (engine.match(/firstMissing/g) || []).length >= 4);
  check('completed Snapshot renders evidence summary metrics', engine.includes('renderEvidencePreview') && engine.includes('Clear responses') && engine.includes('Need confirmation'));
  check('report payload preserves assessment completion', engine.includes('assessmentCompletion') && engine.includes('unansweredQuestionKeys'));
  check('answer and priority rows preserve per-finding evidence metadata', engine.includes('evidenceBasis') && engine.includes('evidencePrompt') && engine.includes('evidenceSufficient'));
  check('score diagnostics preserve evidence counts and finality', engine.includes('confirmedEvidenceCount') && engine.includes('missingRequiredCount') && engine.includes('scoreIsFinal'));
  check('evidence source does not alter impact or priority formulas', scoreSource.includes('const weightedPenalty = round(question.weight * impact, 2)') && scoreSource.includes('weightedPenalty + (FINDING_PRIORITY_BONUS[type] || 0) + priorityBoost'));
  check('prospect report surfaces evidence state on priority cards', reportSource.includes('evidenceMeta.dataset.evidenceQuality') && reportSource.includes('evidenceLabel'));
  check('Agent Workspace normalization preserves completion summary', workspaceSource.includes('completion: clone(report.assessmentCompletion) || null'));
  check('private report client rejects explicitly incomplete reports', clientReportSource.includes('completion.scoreIsFinal !== false') && clientReportSource.includes('missingRequiredCount'));
  check('private report server rejects explicitly incomplete reports', serverReportSource.includes('completion.scoreIsFinal !== false') && serverReportSource.includes('missingRequiredCount'));
  check('evidence UI styles exist', css.includes('.evidence-quality-preview') && css.includes('.evidence-quality--needs-verification'));

  const reportModule = await import(`${pathToFileURL(path.join(root, 'server/prospect-report-core.mjs')).href}?asmt15=${Date.now()}`);
  const legacyReport = { assessment: 'home', consumer: { name: 'Test Homeowner', email: 'test@example.com' }, score: 80 };
  const completedReport = { ...legacyReport, assessmentCompletion: { scoreIsFinal: true, missingRequiredCount: 0 } };
  const incompleteReport = { ...legacyReport, assessmentCompletion: { scoreIsFinal: false, missingRequiredCount: 1 } };
  check('legacy reports remain accepted by server readiness contract', reportModule.reportIsReady(legacyReport) === true);
  check('completed ASMT-1.5 reports are accepted by server readiness contract', reportModule.reportIsReady(completedReport) === true);
  check('explicitly incomplete ASMT-1.5 reports are rejected by server readiness contract', reportModule.reportIsReady(incompleteReport) === false);

  check('methodology documentation exists', exists('ASSESSMENT-COMPLETION-AND-EVIDENCE-QUALITY.md'));
  check('sprint documentation exists', exists('SPRINT-ASMT-1.5.md'));
  check('roadmap marks ASMT-1.5 complete', read('ROADMAP.md').includes('ASMT-1.5 Assessment Completion and Evidence Quality — Complete (3.20.5)'));
  check('changelog contains ASMT-1.5 release', read('CHANGELOG.md').includes('## 3.20.5 — ASMT-1.5'));

  console.log(`ASMT-1.5 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
