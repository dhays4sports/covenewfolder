#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
let passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS', name); passed += 1; };

const storyEngine = require('./assets/js/producer-consumer-story.js');
const executiveModel = require('./assets/js/print/models/executive-summary-model.js');
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const executiveSection = require('./assets/js/print/sections/executive-summary.js');
const guideSection = require('./assets/js/print/sections/consultation-guide.js');
const renderers = require('./assets/js/print-renderers.js');

const recommendations = [
  { id: 'assessment-first', title: 'Confirm rebuilding assumptions', priority: 'Review', category: 'Home', explanation: 'The rebuilding estimate should reflect the current home.', question: 'Has the home changed?', producerNotes: 'Confirm the dwelling limit and deductible.', evidenceQuality: 'needs-verification', source: { priorityScore: 9, weightedPenalty: 8, findingType: 'identified-gap', reviewReasonPriorityBoost: 2, order: 2 } },
  { id: 'label-first', title: 'Review water-loss terms', priority: 'Critical', category: 'Water', explanation: 'The current policy wording should be reviewed.', question: 'Can we compare the current policy summary and options?', producerNotes: 'Confirm the policy wording and homeowner preference.', evidenceQuality: 'partial', source: { priorityScore: 5, weightedPenalty: 5, findingType: 'uncertainty', order: 1 } },
  { id: 'third', title: 'Discuss liability preferences', priority: 'High', category: 'Liability', explanation: 'The homeowner should compare liability needs.', question: 'What assets and risks should the homeowner consider?', producerNotes: 'Discuss preferences before advising.', evidenceQuality: 'confirmed', source: { priorityScore: 2, weightedPenalty: 2, findingType: 'consideration', order: 3 } }
];

const savedPlan = {
  items: [
    { findingId: 'assessment-first', title: 'Confirm rebuilding assumptions', decision: 'recommend', verified: true, producerReason: 'Include the confirmed rebuilding option in the formal insurance quote.' },
    { findingId: 'label-first', title: 'Review water-loss terms', decision: 'consider', verified: false, producerReason: 'Compare the current policy wording first.' },
    { findingId: 'third', title: 'Discuss liability preferences', decision: 'defer', verified: true, producerReason: 'Revisit after the rebuilding review.' }
  ]
};

const snapshot = {
  state: 'ready',
  product: 'Home',
  consultation: { id: 'consultation-cd18', createdAt: '2026-08-09T16:00:00.000Z', recommendationPlan: savedPlan },
  customer: { name: 'Jordan Martinez', firstName: 'Jordan', phone: '408-555-0199', email: 'jordan@example.com', propertyAddress: '123 Main St, Fremont, CA 94539', reviewContext: 'Buying a home' },
  entryContext: { source: '408FARMERS', partnerName: 'Taylor Realty', referralSource: 'realtor', closingDate: '2026-09-15', occupancy: 'Primary residence' },
  assessment: { score: 62, status: 'Review Recommended', strongest: 'Liability planning', topPriority: 'Confirm rebuilding assumptions', completion: { state: 'complete' } },
  strengths: ['Liability planning'],
  recommendations,
  property: { available: true, address: '123 Main St, Fremont, CA 94539', confirmation: { requiresConfirmation: false, label: 'Homeowner confirmed' }, coverage: { replacementCost: 720000, deductible: 5000, currentCarrier: 'Example Mutual', currentPremium: 2860, renewalDate: '2026-10-15' } },
  evidenceHandoff: {
    available: true,
    summary: { total: 3, confirmed: 1, verification: 1, unresolved: 1, followUp: 2 },
    confirmedFacts: [{ id: 'occupancy', title: 'Occupancy', answer: 'Primary residence' }],
    verificationItems: [{ id: 'water-wording', title: 'Current water-loss wording', question: 'Confirm what the current policy says.', priorityOrder: 1 }],
    unresolvedQuestions: [{ id: 'roof-age', title: 'Roof age', question: 'When was the roof replaced?', evidenceQuality: 'missing', priorityOrder: 2 }],
    guardrail: 'Confirm reported policy details against the current policy summary and issued policy before making a recommendation.'
  }
};

const record = {
  id: 'consultation-cd18',
  recommendationPlan: savedPlan,
  disposition: { stage: 'consultation_completed', outcome: 'none', note: '' },
  followUp: { state: 'scheduled', dueDate: '2026-08-15', note: 'Review the formal insurance quote.' },
  completion: { state: 'complete', decisionSummary: 'Jordan wants to compare the confirmed rebuilding option.', unresolvedState: 'open', unresolvedSummary: 'Confirm current water-loss wording and roof age.', quoteState: 'needs_items', quoteRequirements: 'Current policy summary.', nextAction: 'Jordan sends the current policy Friday.', updatedAt: '2026-08-09T20:00:00.000Z' }
};

const originalSnapshot = JSON.stringify(snapshot);
const originalRecord = JSON.stringify(record);
const story = storyEngine.build(snapshot, record, { stage: 'consultation_completed' });

const printModel = {
  schemaVersion: 2,
  engineVersion: '0.4.0',
  generatedAt: '2026-08-09T20:10:00.000Z',
  metadata: { title: 'Home Protection Consultation', consultationDate: '2026-08-09', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency' },
  customer: snapshot.customer,
  propertySummary: { ...snapshot.property, yearBuilt: 1998, squareFeet: 1840 },
  assessment: snapshot.assessment,
  strengths: snapshot.strengths,
  recommendations,
  evidenceHandoff: snapshot.evidenceHandoff,
  consultationContext: {
    reviewReason: snapshot.customer.reviewContext,
    stage: 'consultation_completed',
    recommendationPlan: savedPlan,
    consultationCompletion: story.completion,
    producerConsumerStory: story,
    missingInformation: story.verification.detailsToConfirm.map(item => item.title),
    nextAction: story.nextAction.title,
    followUp: record.followUp
  }
};

const executive = executiveModel.create(printModel);
const guide = guideModel.create(printModel);
const executiveHtml = executiveSection.render(printModel).html;
const guideHtml = guideSection.render(printModel).html;

check('release remains compatible after CoverageFit 3.20.46', ['3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('shared Producer/Consumer Story is centrally versioned', storyEngine.VERSION === '1.0.0' && storyEngine.SCHEMA_VERSION === '1.0');
check('shared story diagnostics pass', storyEngine.getDiagnostics(story).valid && storyEngine.getDiagnostics(story).warningCount === 0);
check('shared story is deeply immutable', Object.isFrozen(story) && Object.isFrozen(story.review) && Object.isFrozen(story.priorities) && story.priorities.every(Object.isFrozen));
check('shared projection does not mutate the Workspace snapshot', JSON.stringify(snapshot) === originalSnapshot);
check('shared projection does not mutate the consultation record', JSON.stringify(record) === originalRecord);

check('homeowner identity is shared from the selected consultation', story.identity.name === 'Jordan Martinez' && story.identity.property === '123 Main St, Fremont, CA 94539');
check('actual review reason remains separate from acquisition context', story.review.reason === 'Buying a home' && story.review.reason !== snapshot.entryContext.partnerName);
check('prospect narrative carries buyer and referral context', story.review.kind === 'homebuyer' && story.review.narrative.includes('buying the home') && story.review.narrative.includes('Taylor Realty referred them'));
check('acquisition note preserves the semantic separation guardrail', story.review.note.includes('does not replace') && story.review.note.includes('stated review reason'));
check('journey stage matches the saved producer record', story.status.stage === 'consultation_completed' && story.status.label === 'Consultation completed');

check('Command Center priority scoring is the shared story order', story.priorities.map(item => item.id).join(',') === 'assessment-first,label-first,third');
check('display labels cannot override authoritative assessment priority scores', story.priorities[0].priority === 'Review' && story.priorities[1].priority === 'Critical');
check('shared story carries beginner-friendly sequence labels', story.priorities.map(item => item.sequenceLabel).join(',') === 'Discuss first,Discuss next,Then review');
check('shared story carries the Command Center rationale', story.priorities[0].rationale.includes('stated review reason'));
check('shared story carries evidence-aware actions', story.priorities.map(item => item.actionLabel).join(',') === 'Check policy,Ask homeowner,Discuss finding');

check('priority confirmation details are carried once', story.verification.detailsToConfirm.map(item => item.id).join(',') === 'water-wording,roof-age');
check('verification counts preserve known, inferred, missing, and confirmation states', story.verification.knownCount === 2 && story.verification.inferredCount === 3 && story.verification.missingCount === 1 && story.verification.confirmationCount === 1);
check('verification guardrail remains authoritative', story.verification.guardrail.includes('current policy summary') && story.verification.guardrail.includes('before making a recommendation'));

check('saved recommendation judgments remain producer controlled', story.recommendations.items.map(item => item.decision).join(',') === 'recommend,consider,defer');
check('recommendation verification remains distinct from decision state', story.recommendations.items.map(item => item.verified).join(',') === 'true,false,true');
check('producer reasoning remains verbatim', story.recommendations.items[0].producerReason === savedPlan.items[0].producerReason);
check('shared completion remains complete only from saved closeout', story.completion.status === 'complete' && story.completion.completion.decisionSummary === record.completion.decisionSummary);
check('agreed next step comes from the completed closeout', story.nextAction.state === 'agreed' && story.nextAction.title === record.completion.nextAction);
check('shared story identifies its authoritative existing sources', story.consistency.prioritySource === 'consultation-command-center' && story.consistency.recommendationSource === 'recommendation-builder' && story.consistency.completionSource === 'consultation-completion');

check('Executive Summary model advances additively', executiveModel.VERSION === '1.4.0' && executiveModel.SCHEMA_VERSION === 1);
check('Executive Summary uses the same review reason', executive.overview.reviewPurpose === story.review.reason);
check('Executive Summary uses the same prospect narrative', executive.overview.storyNarrative === story.review.narrative && executive.overview.storyKind === story.review.kind);
check('Executive Summary uses the same priority titles and order', executive.priorities.join(',') === story.priorities.map(item => item.title).join(','));
check('Executive Summary uses the same confirmation details', executive.missingInformation.join(',') === story.verification.detailsToConfirm.map(item => item.title).join(','));
check('Executive Summary uses the same next action', executive.overview.nextAction === story.nextAction.title);
check('Executive Summary retains the immutable shared source', Object.isFrozen(executive) && executive.producerConsumerStory.consistency.source === story.consistency.source);

check('Consultation Guide model advances additively', guideModel.VERSION === '1.5.0' && guideModel.SCHEMA_VERSION === 1);
check('Consultation Guide uses the same review reason and stage', guide.reviewReason === story.review.reason && guide.stage === story.status.label);
check('Consultation Guide uses the exact Command Center topic IDs and order', guide.topics.map(item => item.id).join(',') === story.priorities.map(item => item.id).join(','));
check('Consultation Guide uses the exact shared sequence labels', guide.topics.map(item => item.sequenceLabel).join(',') === story.priorities.map(item => item.sequenceLabel).join(','));
check('Consultation Guide uses the exact shared priority rationale', guide.topics.map(item => item.priorityReason).join('|') === story.priorities.map(item => item.rationale).join('|'));
check('Consultation Guide uses the exact shared evidence actions', guide.topics.map(item => item.actionLabel).join(',') === story.priorities.map(item => item.actionLabel).join(','));
check('Consultation Guide recommendation states match saved judgments', guide.topics.map(item => item.recommendation.status).join(',') === 'recommend,consider,defer');
check('Consultation Guide completion matches the shared completion', guide.completion.state === 'complete' && guide.completion.decision.summary === record.completion.decisionSummary && guide.completion.nextAction.summary === record.completion.nextAction);
check('Consultation Guide remains deeply immutable', Object.isFrozen(guide) && Object.isFrozen(guide.producerConsumerStory) && Object.isFrozen(guide.completion));

check('Review Overview displays the shared prospect narrative', executiveHtml.includes('How this review began') && executiveHtml.includes('Taylor Realty referred them'));
check('Review Overview exposes the consistency source marker', executiveHtml.includes('data-consistency-source="coveragefit-producer-consumer-story"'));
check('Consultation Record displays the same shared narrative', guideHtml.includes('How this review began') && guideHtml.includes('Taylor Realty referred them'));
check('Consultation Record exposes the consistency source marker', guideHtml.includes('data-consistency-source="coveragefit-producer-consumer-story"'));
check('Consultation Record preserves shared topic machine IDs', story.priorities.every(item => guideHtml.includes(`data-topic-id="${item.id}"`)));
check('Consultation Record preserves shared priority positions', story.priorities.every(item => guideHtml.includes(`data-priority-order="${item.rank}"`)));
check('Consultation Record preserves saved recommendation states', ['recommend', 'consider', 'defer'].every(state => guideHtml.includes(`data-recommendation-state="${state}"`)));
check('Consultation Record preserves completed closeout markers', guideHtml.includes('data-closeout-state="complete"') && guideHtml.includes('data-next-action-state="agreed"'));

const draftRecord = { id: record.id, recommendationPlan: savedPlan, disposition: { stage: 'review_received' }, completion: { state: 'draft', decisionSummary: '', unresolvedState: 'open', unresolvedSummary: '', quoteState: 'not_requested', nextAction: '' } };
const draftStory = storyEngine.build(snapshot, draftRecord, {});
const draftGuide = guideModel.create({ ...printModel, consultationContext: { ...printModel.consultationContext, producerConsumerStory: draftStory, consultationCompletion: draftStory.completion, nextAction: draftStory.nextAction.title } });
check('unfinished work remains a working next action', draftStory.nextAction.state === 'working' && draftStory.nextAction.title !== record.completion.nextAction);
check('unfinished closeout remains draft', draftStory.completion.status === 'draft' && draftGuide.completion.state === 'draft');
check('draft story does not invent a homeowner agreement', !draftGuide.completion.decision.available && draftGuide.completion.nextAction.label === 'Possible next step');

const workspaceHtml = read('agent/workspace/index.html');
const workspaceJs = read('assets/js/agent-workspace.js');
const workspaceCss = read('agent/workspace/workspace.css');
const consultationHtml = read('agent/consultation/index.html');
const controller = read('assets/js/consultation-document.js');
const printEngine = read('assets/js/print-engine.js');
const rendererSource = read('assets/js/print-renderers.js');

check('Workspace includes one progressive-disclosure document-story preview', (workspaceHtml.match(/id="consultationDocumentStory"/g) || []).length === 1 && workspaceHtml.includes('<details class="consultation-shared-story"'));
check('Workspace preview names the shared consultation fields', ['Why this review started', 'Priority order', 'Details to confirm', 'Recommendation record', 'Current next step'].every(label => workspaceHtml.includes(label)));
check('Workspace preview explains the draft boundary', workspaceHtml.includes('Only saved producer judgments') && workspaceHtml.includes('Draft work remains clearly labeled'));
check('Workspace renders the central story rather than re-deriving document fields', workspaceJs.includes('producerConsumerStory.build(snapshot, record') && workspaceJs.includes('model.verification.detailsToConfirm'));
check('Workspace preview preserves exact shared priority IDs', workspaceJs.includes('data-story-priority-id') && workspaceJs.includes('item.id'));
check('Workspace preview is responsive and progressively disclosed', workspaceCss.includes('CD-1.8 — Producer/Consumer Consistency') && workspaceCss.includes('.consultation-shared-story[open]') && workspaceCss.includes('@media (max-width: 640px)'));

check('Workspace loads the shared story exactly once', (workspaceHtml.match(/producer-consumer-story\.js/g) || []).length === 1);
check('Consultation route loads the shared story exactly once', (consultationHtml.match(/producer-consumer-story\.js/g) || []).length === 1);
check('Workspace loads completion before the shared story and controller after it', workspaceHtml.indexOf('/assets/js/consultation-completion.js') < workspaceHtml.indexOf('/assets/js/producer-consumer-story.js') && workspaceHtml.indexOf('/assets/js/producer-consumer-story.js') < workspaceHtml.indexOf('/assets/js/agent-workspace.js'));
check('Document route loads completion before the shared story and print models after it', consultationHtml.indexOf('/assets/js/consultation-completion.js') < consultationHtml.indexOf('/assets/js/producer-consumer-story.js') && consultationHtml.indexOf('/assets/js/producer-consumer-story.js') < consultationHtml.indexOf('/assets/js/print/models/executive-summary-model.js'));
check('Consultation controller derives one shared story', controller.includes('deriveProducerConsumerStory') && controller.includes('producerConsumerStory?.nextAction?.title'));
check('Print Engine carries the shared story through its existing context', printEngine.includes("optionalFields: ['recommendationPlan', 'explanationAssist', 'consultationCompletion', 'producerConsumerStory']") && printEngine.includes('producerConsumerStory: isPlainObject'));
check('existing HTML renderer advances in place', ['1.14.0', '1.15.0'].includes(renderers.getRenderer('html').version));
check('shared-story print presentation is responsive and print safe', rendererSource.includes('PRODUCER_CONSUMER_CONSISTENCY_CSS') && rendererSource.includes('@media print{.cf-exec-shared-story,.cf-guide-shared-story'));

check('shared story creates no storage, API, assessment, or scoring system', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|assessment-engine/.test(read('assets/js/producer-consumer-story.js')));
check('consumer copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|insurance company approved|this is covered/i.test(executiveHtml + guideHtml + workspaceHtml));
check('CD-1.8 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.8.md')) && read('ROADMAP.md').includes('CD-1.8 Producer/Consumer Consistency — Complete (3.20.46)') && read('CHANGELOG.md').includes('## 3.20.46 — CD-1.8 Producer/Consumer Consistency'));

for (const rel of ['assets/js/producer-consumer-story.js', 'assets/js/consultation-command-center.js', 'assets/js/agent-workspace.js', 'assets/js/consultation-document.js', 'assets/js/print-engine.js', 'assets/js/print/models/executive-summary-model.js', 'assets/js/print/models/consultation-guide-model.js', 'assets/js/print/sections/executive-summary.js', 'assets/js/print/sections/consultation-guide.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('authoritative Recommendation Builder remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('Explanation Assist remains unchanged', hash('assets/js/explanation-assist.js') === '7f163223824f13b706a3b72944dc147f6de69c8088a3e8250f7db3d83c42da87');
check('GC-1.9 completion model remains unchanged', hash('assets/js/consultation-completion.js') === 'c0d4f6c7530d3042f3abd3caec2deb9fc6c871b08fbf96d9e843ae6d3655cc96');
check('authoritative print recommendation model remains unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44');
check('consultation persistence remains unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('workspace normalization and attribution remain unchanged', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.8 QA: ${passed}/${passed} passed`);
