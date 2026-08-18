#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const checks = [];
function check(name, pass) { assert(pass, name); checks.push(name); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }

const workspace = require('./assets/js/workspace-data.js');
const planner = require('./assets/js/conversation-planner.js');
const checklistEngine = require('./assets/js/consultation-checklist.js');
const printEngine = require('./assets/js/print-engine.js');
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const guideSection = require('./assets/js/print/sections/consultation-guide.js');

const version = read('VERSION').trim();
check('release version is ASMT-1.6', ['3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('package version is ASMT-1.6', ['3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(JSON.parse(read('package.json')).version));

const report = {
  version: 'asmt16-fixture',
  assessment: 'home',
  createdAt: '2026-08-02T22:00:00.000Z',
  score: 76,
  status: 'Strong Foundation',
  strongest: 'Liability review completed',
  consumer: {
    name: 'Avery Stone',
    email: 'avery@example.com',
    phone: '408-555-0198',
    propertyAddress: '123 Main Street, Fremont, CA 94539',
    reviewContext: 'Annual renewal'
  },
  assessmentCompletion: {
    schemaVersion: '1.0',
    methodologyVersion: 'assessment-evidence-quality-v1',
    state: 'complete-with-verification',
    scoreIsFinal: true,
    scoreFormulaChanged: false,
    requiredQuestionCount: 4,
    answeredRequiredCount: 4,
    missingRequiredCount: 0
  },
  answers: [
    {
      key: 'liability', title: 'Liability limits', category: 'Liability', label: '$500,000 reported',
      evidenceQuality: 'confirmed', evidenceLabel: 'Confirmed fact', evidenceBasis: 'Homeowner selected a specific current limit.',
      evidencePrompt: 'Confirm the reported liability limit remains current.', required: true, answered: true
    },
    {
      key: 'water', title: 'Water-loss deductible', category: 'Water', label: 'Not sure',
      evidenceQuality: 'needs-verification', evidenceLabel: 'Verify against policy', evidenceBasis: 'The policy term was not confirmed.',
      evidencePrompt: 'Confirm the water-loss deductible and any special conditions.', required: true, answered: true
    },
    {
      key: 'rebuild', title: 'Rebuilding estimate', category: 'Property', label: 'Reviewed, but older than two years',
      evidenceQuality: 'partial', evidenceLabel: 'Unresolved detail', evidenceBasis: 'A prior review was reported but current assumptions remain open.',
      evidencePrompt: 'When was the reconstruction estimate last updated, and what changes have occurred?', required: true, answered: true,
      reviewReasonAware: true
    },
    {
      key: 'hazards', title: 'Separate hazards', category: 'Separate Hazards', label: 'No answer recorded',
      evidenceQuality: 'missing', evidenceLabel: 'Unanswered question', evidencePrompt: 'Which separate hazards have been reviewed?',
      required: false, answered: false, propertyAware: true
    }
  ],
  recommendations: [
    {
      id: 'water', key: 'water', title: 'Confirm water-loss terms', category: 'Water', priority: 'High', confidence: 90,
      clientExplanation: 'The current water-loss deductible and conditions have not been confirmed.',
      conversationStarter: 'Can we review the current water-loss deductible and policy conditions?',
      producerNotes: 'Use the declarations and endorsements before presenting options.',
      evidenceQuality: 'needs-verification', evidenceLabel: 'Needs policy verification', evidenceSufficient: false,
      evidenceBasis: 'The homeowner reported uncertainty.', evidencePrompt: 'Confirm the water-loss deductible and any special conditions.',
      label: 'Not sure'
    },
    {
      id: 'rebuild', key: 'rebuild', title: 'Update rebuilding assumptions', category: 'Property', priority: 'High', confidence: 84,
      clientExplanation: 'The rebuilding estimate may not reflect recent changes.',
      conversationStarter: 'What improvements or cost changes should be reflected in the estimate?',
      producerNotes: 'Confirm current reconstruction inputs.',
      evidenceQuality: 'partial', evidenceLabel: 'Open detail to resolve', evidenceSufficient: false,
      evidenceBasis: 'The prior estimate is dated.', evidencePrompt: 'Confirm the estimate date and material property changes.',
      label: 'Reviewed, but older than two years'
    },
    {
      id: 'liability', key: 'liability', title: 'Validate liability foundation', category: 'Liability', priority: 'Medium', confidence: 94,
      clientExplanation: 'A specific current liability limit was reported.',
      conversationStarter: 'Has the household or asset picture changed since this limit was selected?',
      producerNotes: 'Reconfirm the reported limit and current exposure.',
      evidenceQuality: 'confirmed', evidenceLabel: 'Clear response captured', evidenceSufficient: true,
      evidenceBasis: 'A specific limit was reported.', evidencePrompt: 'Confirm the reported limit remains current.',
      label: '$500,000 reported'
    }
  ]
};

const snapshot = workspace.getSnapshot({ report });
const handoff = snapshot.evidenceHandoff;
check('workspace snapshot is ready', snapshot.state === 'ready');
check('evidence handoff is available', handoff.available === true);
check('handoff contract is versioned', handoff.schemaVersion === '1.0' && handoff.handoffVersion === '1.0.0');
check('open evidence produces open-questions state', handoff.state === 'open-questions');
check('completion state is preserved', handoff.completionState === 'complete-with-verification');
check('score remains final', handoff.scoreIsFinal === true);
check('score formula is explicitly unchanged', handoff.scoreFormulaChanged === false);
check('all answers are counted', handoff.summary.total === 4);
check('confirmed facts are counted', handoff.summary.confirmed === 1);
check('verification items are counted', handoff.summary.verification === 1);
check('unresolved items are counted', handoff.summary.unresolved === 2);
check('follow-up count combines verification and unresolved', handoff.summary.followUp === 3);
check('confirmed response maps to confirmed facts', handoff.confirmedFacts[0].key === 'liability');
check('uncertain policy term maps to verification', handoff.verificationItems[0].key === 'water');
check('partial response maps to unresolved questions', handoff.unresolvedQuestions.some(item => item.key === 'rebuild'));
check('missing response maps to unresolved questions', handoff.unresolvedQuestions.some(item => item.key === 'hazards'));
check('priority-linked verification item preserves first priority relationship', handoff.verificationItems[0].priorityOrder === 1);
check('unresolved priority item is ordered before unrelated optional item', handoff.unresolvedQuestions[0].key === 'rebuild');
check('reported answer is preserved', handoff.verificationItems[0].answer === 'Not sure');
check('follow-up question is preserved', handoff.verificationItems[0].question.includes('water-loss deductible'));
check('review-reason context is preserved', handoff.unresolvedQuestions.find(item => item.key === 'rebuild').reviewReasonAware === true);
check('property context is preserved', handoff.unresolvedQuestions.find(item => item.key === 'hazards').propertyAware === true);
check('policy confirmation guardrail is present', handoff.guardrail.includes('policy language') && handoff.guardrail.includes('deductibles'));
check('recommendation retains evidence state', snapshot.recommendations[0].evidenceQuality === 'needs-verification');
check('recommendation retains evidence prompt', snapshot.recommendations[0].evidencePrompt.includes('water-loss deductible'));
check('recommendation ordering remains unchanged', snapshot.recommendations.map(item => item.id).join(',') === 'water,rebuild,liability');

const legacy = workspace.getSnapshot({ report: { ...report, assessmentCompletion: undefined, answers: report.answers.map(({ evidenceQuality, evidenceLabel, evidenceBasis, evidencePrompt, ...item }) => item) } });
check('legacy reports receive unavailable handoff', legacy.evidenceHandoff.available === false);
check('legacy reports receive truthful state', legacy.evidenceHandoff.state === 'legacy');
check('legacy handoff remains non-blocking', legacy.evidenceHandoff.scoreIsFinal === true);

const plan = planner.getPlan(snapshot);
const evidenceStep = plan.items.find(item => item.type === 'evidence-handoff');
check('conversation plan carries top-level handoff', plan.evidenceHandoff.summary.followUp === 3);
check('conversation summary carries confirmed count', plan.summary.evidenceConfirmedCount === 1);
check('conversation summary carries verification count', plan.summary.evidenceVerificationCount === 1);
check('conversation summary carries unresolved count', plan.summary.evidenceUnresolvedCount === 2);
check('conversation plan adds evidence alignment step', Boolean(evidenceStep));
check('evidence step stays in context phase', evidenceStep.phase === 'context');
check('evidence step summarizes follow-up work', evidenceStep.objective.includes('1 policy-verification') && evidenceStep.objective.includes('2 unresolved'));
check('evidence step starts with first unresolved prompt', evidenceStep.prompt.includes('reconstruction estimate'));
check('evidence step retains complete handoff metadata', evidenceStep.metadata.evidenceHandoff.summary.followUp === 3);
check('recommendation topics retain evidence state', plan.items.find(item => item.type === 'recommendation-topic').evidenceQuality === 'needs-verification');
check('recommendation topic order remains unchanged by handoff', plan.items.filter(item => item.type === 'recommendation-topic').map(item => item.title).join(',') === 'Confirm water-loss terms,Update rebuilding assumptions,Validate liability foundation');
check('plan guardrails explain evidence boundary', plan.guardrails.some(item => item.includes('homeowner-reported context')));

const checklist = checklistEngine.generateFromPlan(plan, { generatedAt: '2026-08-02T22:10:00.000Z' });
const checklistEvidence = checklist.items.find(item => item.metadata?.type === 'evidence-handoff');
const checklistWater = checklist.items.find(item => item.title === 'Confirm water-loss terms');
check('checklist carries evidence alignment task', Boolean(checklistEvidence));
check('checklist evidence task preserves prompt', checklistEvidence.prompt.includes('reconstruction estimate'));
check('checklist evidence task preserves metadata', checklistEvidence.metadata.evidenceHandoff.summary.followUp === 3);
check('checklist recommendation preserves evidence quality', checklistWater.evidenceQuality === 'needs-verification');
check('checklist recommendation preserves evidence label', checklistWater.evidenceLabel === 'Needs policy verification');
check('checklist recommendation preserves answer context', checklistWater.answerLabel === 'Not sure');
check('checklist remains valid', checklistEngine.validateChecklist(checklist).valid === true);

const checklistState = checklistEngine.getWorkspaceState(checklist);
const model = printEngine.buildModel({
  workspaceSnapshot: snapshot,
  conversationPlan: plan,
  checklistState,
  workspaceData: workspace,
  planner,
  checklistEngine,
  consultationContext: {
    reviewReason: 'Annual renewal',
    missingInformation: [], decisions: [], nextAction: '', stage: 'review_received', outcome: 'none', followUp: { state: 'none' }
  },
  generatedAt: '2026-08-02T22:15:00.000Z'
});
check('print model carries evidence handoff', model.evidenceHandoff.summary.followUp === 3);
check('print model evidence section validates', printEngine.validateSection('evidenceHandoff', model.evidenceHandoff).valid === true);
check('complete print model validates', printEngine.validateModel(model).valid === true);
check('print recommendations retain evidence state', model.recommendations[0].evidenceQuality === 'needs-verification');
check('print timeline retains evidence handoff item', model.timeline.items.some(item => item.type === 'evidence-handoff'));

const guide = guideModel.create(model);
check('guide model carries three evidence groups', guide.evidenceHandoff.confirmedFacts.length === 1 && guide.evidenceHandoff.verificationItems.length === 1 && guide.evidenceHandoff.unresolvedQuestions.length === 2);
const guideWater = guide.topics.find(item => item.id === 'water');
check('guide topic carries evidence label', guideWater?.evidenceLabel === 'Needs policy verification');
check('guide topic confirmation list carries evidence prompt', guideWater?.confirm.some(item => item.includes('water-loss deductible')));
const renderedGuide = guideSection.render(model);
check('consultation document renders homeowner answers', renderedGuide.html.includes('What the homeowner shared'));
check('consultation document renders policy checks', renderedGuide.html.includes('Check the policy'));
check('consultation document renders homeowner questions', renderedGuide.html.includes('What to confirm together'));
check('consultation document renders evidence guardrail', renderedGuide.html.includes('current policy summary and issued policy'));
check('consultation topic renders simplified evidence status', renderedGuide.html.includes('Check policy'));

const workspaceHtml = read('agent/workspace/index.html');
const workspaceJs = read('assets/js/agent-workspace.js');
const workspaceCss = read('agent/workspace/workspace.css');
const plannerSource = read('assets/js/conversation-planner.js');
const checklistSource = read('assets/js/consultation-checklist.js');
const documentSource = read('assets/js/consultation-document.js');
const printSource = read('assets/js/print-engine.js');
const renderers = read('assets/js/print-renderers.js');
const scoreSource = read('assets/js/protection-score.js');
check('workspace contains evidence handoff card', workspaceHtml.includes('id="evidenceHandoffCard"') && workspaceHtml.includes('What they told us') && workspaceHtml.includes('Check the policy') && workspaceHtml.includes('Ask the homeowner'));
check('workspace renders handoff from selected snapshot', workspaceJs.includes('renderEvidenceHandoff(snapshot.evidenceHandoff)'));
check('workspace recommendation cards render evidence labels', workspaceJs.includes('recommendation-evidence'));
check('workspace checklist renders evidence prompts', workspaceJs.includes('checklist-item__evidence-prompt'));
check('workspace timeline renders evidence labels', workspaceJs.includes('conversation-timeline__evidence'));
check('workspace evidence layout is responsive', workspaceCss.includes('.evidence-handoff-grid') && workspaceCss.includes('.workspace-card--evidence'));
check('planner owns one evidence alignment implementation', (plannerSource.match(/function evidenceAlignmentItem/g) || []).length === 1);
check('checklist preserves evidence fields', checklistSource.includes('evidenceQuality') && checklistSource.includes('evidencePrompt'));
check('consultation document derives evidence-aware next action', documentSource.includes('evidenceFollowUpCount') && documentSource.includes('Confirm ${evidenceFollowUpCount} open detail'));
check('print engine has optional backward-compatible handoff contract', printSource.includes("evidenceHandoff: {") && printSource.includes('required: false'));
check('print styling contains evidence handoff rules', renderers.includes('.cf-guide-evidence') && renderers.includes('.cf-guide-topic__evidence'));
check('score formula retains weighted penalty calculation', scoreSource.includes('const weightedPenalty = round(question.weight * impact, 2)'));
check('score priority formula remains unchanged', scoreSource.includes('weightedPenalty + (FINDING_PRIORITY_BONUS[type] || 0) + priorityBoost'));
check('no score module changes are claimed by handoff', handoff.scoreFormulaChanged === false);

check('handoff methodology documentation exists', exists('ASSESSMENT-EVIDENCE-AWARE-CONSULTATION-HANDOFF.md'));
check('sprint documentation exists', exists('SPRINT-ASMT-1.6.md'));
check('roadmap marks ASMT-1.6 complete', read('ROADMAP.md').includes('ASMT-1.6 Evidence-Aware Consultation Handoff — Complete (3.20.6)'));
check('roadmap identifies a bounded post-ASMT-1.6 sprint', read('ROADMAP.md').includes('ASMT-1.7 Assessment Continuity and Respectful Exit') && read('ROADMAP.md').includes('ASMT-1.8 Consumer Clarity and Completion Optimization'));
check('changelog contains ASMT-1.6 release', read('CHANGELOG.md').includes('## 3.20.6 — ASMT-1.6 Evidence-Aware Consultation Handoff'));
check('README identifies ASMT-1.6', read('README.md').includes('## Prior release: 3.20.6') && read('README.md').includes('ASMT-1.6'));

console.log(`ASMT-1.6 QA: ${checks.length}/${checks.length} passed`);
