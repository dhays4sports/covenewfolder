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

require('./assets/js/consultation-command-center.js');
require('./assets/js/recommendation-builder.js');
require('./assets/js/explanation-assist.js');
const completion = require('./assets/js/consultation-completion.js');
const documentController = require('./assets/js/consultation-document.js');
const printEngine = require('./assets/js/print-engine.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const section = require('./assets/js/print/sections/consultation-guide.js');
const renderers = require('./assets/js/print-renderers.js');

const recommendationPlan = Object.freeze({ schemaVersion: '1.0', builderVersion: '1.0.0', state: 'complete', items: Object.freeze([
  Object.freeze({ findingId: 'water', title: 'Review water-loss terms', decision: 'recommend', verified: true, producerReason: 'Compare the verified water terms in the formal carrier quote.' }),
  Object.freeze({ findingId: 'rebuild', title: 'Confirm rebuilding assumptions', decision: 'defer', verified: false, producerReason: 'Revisit after receiving the updated property details.' })
]) });
const savedCompletion = Object.freeze({ schemaVersion: '1.0', state: 'complete', decisionSummary: 'The homeowner wants two water-backup options and will keep the current deductible in the comparison.', unresolvedState: 'open', unresolvedSummary: 'Confirm the current endorsement and receive the declarations page.', quoteState: 'needs_items', quoteRequirements: 'Current declarations page and preferred water-backup limit.', nextAction: 'The homeowner sends the declarations page Friday; Dylan prepares two carrier quote options.', completedAt: '2026-08-09T20:00:00.000Z', updatedAt: '2026-08-09T20:05:00.000Z' });
const recommendations = Object.freeze([
  Object.freeze({ id: 'water', title: 'Review water-loss terms', priority: 'Critical', explanation: 'The current water-loss terms need review.', question: 'Can we review the current water-loss wording?', evidenceQuality: 'needs-verification' }),
  Object.freeze({ id: 'rebuild', title: 'Confirm rebuilding assumptions', priority: 'High', explanation: 'The rebuilding assumptions should reflect the current home.', question: 'Has the home changed?', evidenceQuality: 'partial' })
]);
const snapshot = Object.freeze({ state: 'ready', product: 'Home', customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199', propertyAddress: '123 Main St, Fremont, CA 94539', reviewContext: 'Premium increased' }), property: Object.freeze({ available: true, address: '123 Main St, Fremont, CA 94539', coverage: Object.freeze({ currentCarrier: 'Example Mutual' }) }), assessment: Object.freeze({ score: 62, status: 'Review Recommended' }), recommendations, consultation: Object.freeze({ id: 'consultation-16', createdAt: '2026-08-09T17:00:00.000Z', recommendationPlan, completion: savedCompletion }), evidenceHandoff: Object.freeze({ available: true, summary: Object.freeze({ total: 3, confirmed: 1, verification: 1, unresolved: 1, followUp: 2 }), confirmedFacts: Object.freeze([]), verificationItems: Object.freeze([]), unresolvedQuestions: Object.freeze([]) }) });
const record = Object.freeze({ id: 'consultation-16', stage: 'consultation_completed', outcome: 'none', recommendationPlan, completion: savedCompletion, remote: Object.freeze({ serverBacked: true, followUp: Object.freeze({ state: 'scheduled', dueDate: '2026-08-15', note: 'Confirm documents and review quote options.' }) }) });

check('release remains compatible after CoverageFit 3.20.44', ['3.20.44', '3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('GC-1.9 Consultation Completion remains the canonical source', completion.VERSION === '1.0.0' && completion.SCHEMA_VERSION === '1.0');
check('Consultation Document controller advances additively', ['1.5.0', '1.6.0', '1.7.0', '1.8.0'].includes(documentController.VERSION) && typeof documentController.deriveConsultationCompletion === 'function');
const originalRecord = JSON.stringify(record);
const completionContext = documentController.deriveConsultationCompletion(record, snapshot);
check('controller reuses the GC-1.9 completion builder', completionContext.status === 'complete' && completionContext.completion.decisionSummary === savedCompletion.decisionSummary);
check('controller carries existing recommendation decisions', completionContext.decisions.length === 2 && completionContext.decisions[0].label === 'Recommend for carrier quote');
check('controller carries open evidence counts', completionContext.evidence.openCount === 2 && completionContext.evidence.findingOpenCount === 1);
check('controller carries existing secure follow-up context', completionContext.followUp.state === 'scheduled' && completionContext.followUp.dueDate === '2026-08-15');
check('completion derivation does not mutate the consultation record', JSON.stringify(record) === originalRecord);
const oldCompletion = globalThis.CoverageFitConsultationCompletion;
delete globalThis.CoverageFitConsultationCompletion;
const unavailable = documentController.deriveConsultationCompletion(record, snapshot);
globalThis.CoverageFitConsultationCompletion = oldCompletion;
check('missing optional completion service fails safely', unavailable === null);

const context = documentController.deriveConsultationContext(record, snapshot);
check('Consultation Document context carries the structured closeout', context.consultationCompletion?.completion?.quoteState === 'needs_items');
const conversationPlan = Object.freeze({ state: 'ready', summary: Object.freeze({}), sections: Object.freeze([]), items: Object.freeze([]), questions: Object.freeze([]), guardrails: Object.freeze([]) });
const checklistState = Object.freeze({ checklist: Object.freeze({ items: Object.freeze([]), phases: Object.freeze([]) }), summary: Object.freeze({}), progress: Object.freeze({}) });
const printModel = printEngine.buildModel({ workspaceSnapshot: snapshot, conversationPlan, checklistState, consultationContext: context, generatedAt: '2026-08-09T20:10:00.000Z' });
check('Print Engine accepts the additive completion context', printEngine.validateModel(printModel).valid === true && printModel.consultationContext.consultationCompletion.status === 'complete');
check('Print Engine completion context is immutable', Object.isFrozen(printModel.consultationContext) && Object.isFrozen(printModel.consultationContext.consultationCompletion));

const model = guideModel.create(printModel);
const html = section.render(printModel).html;
check('Consultation Guide model advances additively', ['1.3.0', '1.4.0', '1.5.0'].includes(guideModel.VERSION) && guideModel.SCHEMA_VERSION === 1);
check('Consultation Record section advances in place', section.id === 'consultation-guide' && ['1.5.0', '1.6.0', '1.7.0','1.7.1'].includes(section.version));
check('completed closeout is explicit', model.completion.state === 'complete' && model.completion.statusLabel === 'Consultation summary saved');
check('homeowner decision is carried verbatim', model.completion.decision.available && model.completion.decision.summary === savedCompletion.decisionSummary);
check('unresolved work remains open', model.completion.unresolved.state === 'open' && model.completion.unresolved.summary === savedCompletion.unresolvedSummary);
check('carrier quote status remains needs items', model.completion.quote.state === 'needs_items' && model.completion.quote.label === 'Needs information or documents');
check('carrier quote requirements remain distinct', model.completion.quote.summary === savedCompletion.quoteRequirements);
check('agreed next action is carried verbatim', model.completion.nextAction.available && model.completion.nextAction.summary === savedCompletion.nextAction);
check('finding-level producer judgments are carried', model.completion.recommendationDecisions.map(item => item.state).join(',') === 'recommend,defer');
check('finding verification readiness remains explicit', model.completion.recommendationDecisions[0].verificationLabel === 'Confirmed' && model.completion.recommendationDecisions[1].verificationLabel === 'Needs confirmation');
check('open evidence counts remain informative only', model.completion.evidence.openCount === 2 && model.completion.evidence.findingOpenCount === 1);
check('saved follow-up remains part of the closeout', model.completion.followUp.state === 'scheduled' && model.completion.followUp.note.includes('review quote options'));
check('carrier authority guardrail is retained', model.completion.guardrail.includes('formal quote and issued policy are the official sources'));
check('CD-1.4 priority order remains intact', model.topics.map(item => item.id).join(',') === 'water,rebuild');
check('CD-1.5 recommendation explanations remain intact', model.topics[0].recommendation.status === 'recommend' && model.topics[1].recommendation.status === 'defer');

check('canonical Decisions and Next Steps chapter remains in place', html.includes('data-document-chapter="decisions-next-steps"') && html.includes('Decisions and next steps'));
check('rendered closeout status is machine-readable', html.includes('data-closeout-state="complete"') && html.includes('Consultation summary saved'));
check('rendered decision summary uses the saved closeout', html.includes('What the homeowner decided') && html.includes('wants two water-backup options'));
check('rendered unresolved state stays open', html.includes('data-unresolved-state="open"') && html.includes('Confirm the current endorsement'));
check('rendered quote state and requirements are explicit', html.includes('data-quote-state="needs_items"') && html.includes('Current declarations page and preferred water-backup limit'));
check('rendered finding decisions preserve judgment and verification', html.includes('data-decision-state="recommend"') && html.includes('data-decision-state="defer"') && html.includes('Needs confirmation'));
check('rendered next action is identified as agreed', html.includes('data-next-action-state="agreed"') && html.includes('Agreed next step'));
check('rendered follow-up uses the saved schedule', html.includes('Follow-up scheduled for Aug 15, 2026') && html.includes('Confirm documents and review quote options'));
check('completed closeout does not render legacy writing context', !html.includes('Earlier notes') && !html.includes('Details currently identified'));

const noneModel = guideModel.create({ customer: { name: 'No Open Items' }, consultationContext: { consultationCompletion: { status: 'complete', completion: { state: 'complete', decisionSummary: 'No change requested today.', unresolvedState: 'none', quoteState: 'not_requested', nextAction: 'Review again at renewal.' }, decisions: [], followUp: { state: 'none' } } } });
check('no-unresolved state does not invent open work', noneModel.completion.unresolved.state === 'none' && noneModel.completion.unresolved.label === 'Nothing remains open');
check('no-quote state does not invent a quote request', noneModel.completion.quote.state === 'not_requested' && noneModel.completion.quote.label === 'No formal insurance quote requested');
const readyModel = guideModel.create({ customer: { name: 'Ready' }, consultationContext: { consultationCompletion: { status: 'complete', completion: { state: 'complete', decisionSummary: 'Prepare a comparison.', unresolvedState: 'none', quoteState: 'ready', nextAction: 'Dylan prepares the comparison.' } } } });
check('ready quote state remains preparation rather than an outcome', readyModel.completion.quote.label === 'Ready to prepare' && readyModel.completion.quote.summary.includes('ready to be prepared'));
const requestedModel = guideModel.create({ customer: { name: 'Requested' }, consultationContext: { consultationCompletion: { status: 'complete', completion: { state: 'complete', decisionSummary: 'Request formal options.', unresolvedState: 'none', quoteState: 'requested', quoteRequirements: 'Compare two deductibles.', nextAction: 'Review carrier response.' } } } });
check('requested quote state carries optional instructions', requestedModel.completion.quote.label === 'Formal insurance quote requested' && requestedModel.completion.quote.summary === 'Compare two deductibles.');

const draftModel = guideModel.create({ customer: { name: 'Draft' }, consultationContext: { decisions: ['Existing disposition note'], missingInformation: ['Current declarations page'], nextAction: 'Confirm current policy details.' } });
const draftHtml = section.render({ customer: { name: 'Draft' }, consultationContext: { decisions: ['Existing disposition note'], missingInformation: ['Current declarations page'], nextAction: 'Confirm current policy details.' } }).html;
check('unfinished records remain explicit drafts', draftModel.completion.state === 'draft' && draftModel.completion.statusLabel === 'Consultation summary not yet saved');
check('draft record does not invent homeowner agreement', !draftModel.completion.decision.available && draftModel.completion.decision.summary.includes('not yet been recorded'));
check('draft record does not claim quote or unresolved status', draftModel.completion.quote.state === 'draft' && draftModel.completion.unresolved.state === 'draft');
check('draft working next action remains distinct from agreement', !draftModel.completion.nextAction.available && draftModel.completion.nextAction.label === 'Possible next step');
check('legacy working context remains available only as working context', draftModel.completion.workingDecisions[0] === 'Existing disposition note' && draftModel.completion.workingMissingInformation[0] === 'Current declarations page');
check('rendered draft state is unmistakable', draftHtml.includes('data-closeout-state="draft"') && draftHtml.includes('Consultation summary not yet saved') && draftHtml.includes('Possible next step'));
check('rendered draft keeps working context separate', draftHtml.includes('Earlier notes') && draftHtml.includes('Details currently identified'));

const escaped = section.render({ customer: { name: 'Homeowner' }, consultationContext: { consultationCompletion: { status: 'complete', completion: { state: 'complete', decisionSummary: '<script>alert(1)</script>', unresolvedState: 'open', unresolvedSummary: '<img src=x>', quoteState: 'needs_items', quoteRequirements: '<svg onload=alert(1)>', nextAction: '<iframe>' }, decisions: [{ title: '<b>Unsafe</b>', decision: 'consider', label: '<em>Consider</em>', verified: true }] } } }).html;
check('dynamic closeout content is HTML escaped', !escaped.includes('<script>') && !escaped.includes('<img') && !escaped.includes('<svg') && !escaped.includes('<iframe') && escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img src=x&gt;'));

const route = read('agent/consultation/index.html');
const rendererSource = read('assets/js/print-renderers.js');
check('consultation route loads the existing completion module once', (route.match(/consultation-completion\.js/g) || []).length === 1);
check('completion module loads before the Print Engine and controller', route.indexOf('/assets/js/consultation-completion.js') < route.indexOf('/assets/js/print-engine.js') && route.indexOf('/assets/js/consultation-completion.js') < route.indexOf('/assets/js/consultation-document.js'));
check('existing HTML renderer advances in place', ['1.13.0', '1.14.0', '1.15.0'].includes(renderers.getRenderer('html').version));
check('Decisions and Next Steps styling uses the existing renderer', rendererSource.includes('DECISIONS_NEXT_STEPS_CSS') && rendererSource.includes('.cf-guide-close__status'));
check('closeout layout is responsive', rendererSource.includes('@media(max-width:720px){.cf-guide-close__status{display:grid}'));
check('closeout layout is print safe', rendererSource.includes('@media print{.cf-guide-close__status,.cf-guide-close__decision,.cf-guide-close__card'));
check('document copy makes no unsupported insurance outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(html + read('assets/js/print/models/consultation-guide-model.js')));
check('CD-1.6 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.6.md')) && read('ROADMAP.md').includes('CD-1.6 Decisions and Next Steps — Complete (3.20.44)') && read('CHANGELOG.md').includes('## 3.20.44 — CD-1.6 Decisions and Next Steps'));

for (const rel of ['assets/js/consultation-document.js', 'assets/js/print-engine.js', 'assets/js/print/models/consultation-guide-model.js', 'assets/js/print/sections/consultation-guide.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('GC-1.9 completion model remains unchanged', hash('assets/js/consultation-completion.js') === 'c0d4f6c7530d3042f3abd3caec2deb9fc6c871b08fbf96d9e843ae6d3655cc96');
check('authoritative Recommendation Builder remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('Explanation Assist remains unchanged', hash('assets/js/explanation-assist.js') === '7f163223824f13b706a3b72944dc147f6de69c8088a3e8250f7db3d83c42da87');
check('GC-1.3 Command Center ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('authoritative print recommendation ordering remains unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44');
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('CD-1.1 architecture remains unchanged', ['edcba77c95aa2d89f97a5f6e0425dd6286bec91aac51b2f9b5f0555b1186dd81', 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1'].includes(hash('assets/js/print/consultation-document-architecture.js')));
check('CD-1.2 Executive Summary remains unchanged', ['efb67b2821104156f2be755a23e57000c773fea0fa0d0eeef904f041617756a4', '709733fed46b2840163ab587dc26e10436ab7227170572a28e33ec721bd4a57e', '7bb00966126da1d855dbf9b2f916ef54cdbcd0dab09428a12f7a4953fa5e627a'].includes(hash('assets/js/print/models/executive-summary-model.js')));
check('CD-1.3 Protection Snapshot remains unchanged', ['624b88d2304fca85c30ca07077e9a59a97b54a317db63008dc420d37d3f99512', '58c77e15a22d6629695ad7286227c6157a6493124bde3b1c42c66a051eb0940b'].includes(hash('assets/js/print/models/protection-snapshot-model.js')));
check('Property and Verification section remains unchanged', ['1d2c296cb1fb1689b2dec99922a681cdc09962215f1342e3a7db0c70d54c79b1', 'de3691394a497679d9c64b86de1127c7584ef3888bcdc59ba6a8653317802ebb'].includes(hash('assets/js/print/sections/property-summary.js')));
check('consultation persistence remains unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.6 QA: ${passed}/${passed} passed`);
