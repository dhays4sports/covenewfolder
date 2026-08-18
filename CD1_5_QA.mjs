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
const recommendationBuilder = require('./assets/js/recommendation-builder.js');
const explanationAssist = require('./assets/js/explanation-assist.js');
const documentController = require('./assets/js/consultation-document.js');
const printEngine = require('./assets/js/print-engine.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const section = require('./assets/js/print/sections/consultation-guide.js');
const renderers = require('./assets/js/print-renderers.js');

const recommendations = Object.freeze([
  Object.freeze({ id: 'inventory', title: 'Optional inventory review', priority: 'Low', category: 'Property', explanation: 'A home inventory may be useful.', conversationStarter: 'Would an inventory be useful?', evidenceQuality: 'confirmed' }),
  Object.freeze({ id: 'liability', title: 'Confirm liability priorities', priority: 'Medium', category: 'Liability', explanation: 'The household liability preference should be discussed.', conversationStarter: 'Which liability situations concern you most?', producerNotes: 'Connect the discussion to household circumstances.', evidenceQuality: 'partial' }),
  Object.freeze({ id: 'water', title: 'Review water-loss terms', priority: 'Critical', category: 'Water', explanation: 'The homeowner is unsure how the current policy handles water loss.', conversationStarter: 'Can we review the current water-loss wording?', producerNotes: 'Compare the declarations and applicable forms.', evidenceQuality: 'needs-verification', evidencePrompt: 'Confirm the current water-loss wording.' }),
  Object.freeze({ id: 'rebuild', title: 'Confirm rebuilding assumptions', priority: 'High', category: 'Property', explanation: 'The rebuilding estimate should reflect the current home.', conversationStarter: 'Has the home changed since the current policy was written?', producerNotes: 'Confirm material property changes.', evidenceQuality: 'confirmed' })
]);

const savedRecommendationPlan = Object.freeze({
  schemaVersion: '1.0', builderVersion: '1.0.0', state: 'draft',
  items: Object.freeze([
    Object.freeze({ findingId: 'water', title: 'Review water-loss terms', decision: 'recommend', verified: true, verifiedAt: '2026-08-09T18:00:00.000Z', producerReason: 'The verified water terms should be compared in the formal carrier quote.' }),
    Object.freeze({ findingId: 'rebuild', title: 'Confirm rebuilding assumptions', decision: 'consider', verified: true, producerReason: 'Compare the updated rebuilding estimate with the homeowner’s budget and priorities.' }),
    Object.freeze({ findingId: 'liability', title: 'Confirm liability priorities', decision: 'undecided', verified: false, producerReason: '' })
  ])
});

const snapshot = Object.freeze({
  state: 'ready', product: 'Home', generatedAt: '2026-08-09T18:00:00.000Z',
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199', propertyAddress: '123 Main St, Fremont, CA 94539', reviewContext: 'Premium increased' }),
  property: Object.freeze({ available: true, address: '123 Main St, Fremont, CA 94539', yearBuilt: 1988, coverage: Object.freeze({ currentCarrier: 'Example Mutual' }) }),
  assessment: Object.freeze({ score: 62, status: 'Review Recommended', topPriority: 'Review water-loss terms', completion: Object.freeze({ state: 'complete' }) }),
  recommendations,
  consultation: Object.freeze({ id: 'consultation-15', createdAt: '2026-08-09T17:00:00.000Z', recommendationPlan: savedRecommendationPlan }),
  evidenceHandoff: Object.freeze({ available: false, summary: Object.freeze({}), confirmedFacts: Object.freeze([]), verificationItems: Object.freeze([]), unresolvedQuestions: Object.freeze([]) }),
  strengths: Object.freeze(['Completed a structured review']),
  executiveSummary: 'Prepare a focused conversation about water terms, rebuilding assumptions, and liability priorities.'
});

const originalPlan = JSON.stringify(savedRecommendationPlan);
const guidance = documentController.deriveRecommendationGuidance(snapshot);
check('release remains compatible after CoverageFit 3.20.43', ['3.20.43', '3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('existing Consultation Document controller advances additively', ['1.4.0', '1.5.0', '1.6.0', '1.7.0', '1.8.0'].includes(documentController.VERSION) && typeof documentController.deriveRecommendationGuidance === 'function');
check('GC-1.6 Recommendation Builder is reused', guidance.plan?.builderVersion === recommendationBuilder.VERSION && guidance.plan.items.length === 3);
check('GC-1.7 Explanation Assist is reused', guidance.assistance?.assistVersion === explanationAssist.VERSION && guidance.assistance.items.length === 3);
check('saved producer judgments are rehydrated by finding identity', guidance.plan.items.find(item => item.findingId === 'water')?.decision === 'recommend' && guidance.plan.items.find(item => item.findingId === 'rebuild')?.decision === 'consider');
check('saved verification state is preserved', guidance.plan.items.find(item => item.findingId === 'water')?.verified === true && guidance.plan.items.find(item => item.findingId === 'liability')?.verified === false);
check('saved producer reasoning is preserved', guidance.plan.items.find(item => item.findingId === 'water')?.producerReason.includes('formal carrier quote'));
check('guidance derivation does not mutate the saved plan', JSON.stringify(savedRecommendationPlan) === originalPlan);
check('Explanation Assist retains topic-specific education', guidance.assistance.items.find(item => item.findingId === 'water')?.topic === 'water' && guidance.assistance.items.find(item => item.findingId === 'rebuild')?.topic === 'rebuilding');
check('unverified finding remains Verify first', guidance.assistance.items.find(item => item.findingId === 'liability')?.readiness === 'verify-first');

const oldBuilder = globalThis.CoverageFitRecommendationBuilder;
const oldAssist = globalThis.CoverageFitExplanationAssist;
delete globalThis.CoverageFitRecommendationBuilder;
delete globalThis.CoverageFitExplanationAssist;
const unavailable = documentController.deriveRecommendationGuidance(snapshot);
globalThis.CoverageFitRecommendationBuilder = oldBuilder;
globalThis.CoverageFitExplanationAssist = oldAssist;
check('missing optional guidance services fail safely', unavailable.plan === null && unavailable.assistance === null);

const record = Object.freeze({ id: 'consultation-15', stage: 'consultation_scheduled', outcome: 'none', followUp: Object.freeze({ state: 'none' }) });
const context = documentController.deriveConsultationContext(record, snapshot);
check('Consultation Document context carries recommendation plan', context.recommendationPlan?.items.length === 3);
check('Consultation Document context carries explanation assistance', context.explanationAssist?.items.length === 3);

const conversationPlan = Object.freeze({ state: 'ready', summary: Object.freeze({}), sections: Object.freeze([]), items: Object.freeze([]), questions: Object.freeze([]), guardrails: Object.freeze([]) });
const checklistState = Object.freeze({ checklist: Object.freeze({ items: Object.freeze([]), phases: Object.freeze([]) }), summary: Object.freeze({}), progress: Object.freeze({}) });
const printModel = printEngine.buildModel({ workspaceSnapshot: snapshot, conversationPlan, checklistState, consultationContext: context, generatedAt: '2026-08-09T18:30:00.000Z' });
check('Print Engine contract remains valid with additive guidance', printEngine.validateModel(printModel).valid === true);
check('Print Engine retains bounded recommendation guidance', printModel.consultationContext.recommendationPlan.items.length === 3 && printModel.consultationContext.explanationAssist.items.length === 3);
check('Print Engine output is immutable', Object.isFrozen(printModel) && Object.isFrozen(printModel.consultationContext));

const model = guideModel.create(printModel);
const html = section.render(printModel).html;
check('Consultation Guide model advances additively', ['1.2.0', '1.3.0', '1.4.0', '1.5.0'].includes(guideModel.VERSION) && guideModel.SCHEMA_VERSION === 1);
check('Consultation Record section advances in place', section.id === 'consultation-guide' && ['1.4.0', '1.5.0', '1.6.0', '1.7.0','1.7.1'].includes(section.version));
check('CD-1.4 priority order remains intact', model.topics.map(item => item.id).join(',') === 'water,rebuild,liability');
check('carrier-quote recommendation is distinct from a coverage result', model.topics[0].recommendation.status === 'recommend' && model.topics[0].recommendation.statusLabel === 'Include in formal insurance quote');
check('verified status means ready for discussion', model.topics[0].recommendation.verified === true && model.topics[0].recommendation.verificationLabel === 'Confirmed for discussion');
check('recorded producer reason explains the recommendation', model.topics[0].recommendation.reason === 'The verified water terms should be compared in the formal carrier quote.');
check('topic meaning comes from existing Explanation Assist', model.topics[0].recommendation.meaning.includes('Water losses are not handled as one category'));
check('topic importance comes from existing Explanation Assist', model.topics[0].recommendation.importance.includes('specific cause, limit, deductible'));
check('consider status remains neutral', model.topics[1].recommendation.status === 'consider' && model.topics[1].recommendation.reason.includes('updated rebuilding estimate'));
check('undecided topic does not invent a recommendation', model.topics[2].recommendation.status === 'undecided' && model.topics[2].recommendation.statusLabel === 'No recommendation recorded');
check('unverified topic stays visibly unresolved', model.topics[2].recommendation.verificationLabel === 'Needs confirmation' && model.topics[2].recommendation.reason.includes('No recommendation has been recorded'));
check('topic-specific verification expands the existing checklist', model.topics[0].confirm.some(item => item.includes('covered causes')) && model.topics[0].confirm.some(item => item.includes('formal quote')));
check('explanation model does not expose internal talk tracks or coaching notes', !Object.hasOwn(model.topics[0].recommendation, 'talkTrack') && !Object.hasOwn(model.topics[0].recommendation, 'coachingNote'));

check('Recommendation chapter renders a block for each priority finding', (html.match(/class="cf-guide-recommendation"/g) || []).length === 3);
check('rendered recommendation states are machine-readable', html.includes('data-recommendation-state="recommend"') && html.includes('data-recommendation-state="consider"') && html.includes('data-recommendation-state="undecided"'));
check('rendered verification states are explicit', html.includes('data-verification-state="verified"') && html.includes('data-verification-state="needs-verification"'));
check('rendered explanation answers what and why', html.includes('What this means') && html.includes('Why it matters'));
check('rendered recommendation uses the producer reason', html.includes('Why this decision was recorded') && html.includes('verified water terms should be compared'));
check('rendered undecided state remains open', html.includes('No recommendation recorded') && html.includes('What happens before a recommendation'));
check('existing conversation support remains available', html.includes('Questions to discuss') && html.includes('Can we review the current water-loss wording?') && html.includes('Compare the current policy summary and applicable forms.'));
check('Recommendation explanation remains in the canonical chapter', html.includes('class="cf-guide-recommendation" data-document-chapter="recommendations"'));
check('document retains carrier and policy guardrails', html.includes('The formal quote and issued policy are the official sources'));

const otherStates = guideModel.create({
  customer: { name: 'State Test' },
  recommendations: [
    { id: 'defer', title: 'Deferred topic', priority: 'High', explanation: 'A topic.', question: 'Review it?' },
    { id: 'not', title: 'Not recommended topic', priority: 'Medium', explanation: 'Another topic.', question: 'Review it?' }
  ],
  consultationContext: {
    recommendationPlan: { items: [
      { findingId: 'defer', decision: 'defer', verified: true, producerReason: 'Revisit after the renovation is complete.' },
      { findingId: 'not', decision: 'not_recommended', verified: true, producerReason: 'The verified household facts do not support including this in the current carrier quote.' }
    ] },
    explanationAssist: { items: [] }
  }
});
check('deferred judgment remains explicit', otherStates.topics.find(item => item.id === 'defer')?.recommendation.statusLabel === 'Deferred');
check('not-recommended judgment remains explicit and reasoned', otherStates.topics.find(item => item.id === 'not')?.recommendation.statusLabel === 'Not recommended after review' && otherStates.topics.find(item => item.id === 'not')?.recommendation.reason.includes('verified household facts'));

const escaped = section.render({ customer: { name: 'Homeowner' }, recommendations: [{ id: 'unsafe', title: 'Unsafe topic', priority: 'High', explanation: 'Review this.', question: 'Discuss?' }], consultationContext: { recommendationPlan: { items: [{ findingId: 'unsafe', decision: 'consider', verified: true, producerReason: '<script>alert(1)</script>' }] }, explanationAssist: { items: [{ findingId: 'unsafe', whatItMeans: '<img src=x>', whyItMatters: '<svg onload=alert(1)>', verification: [] }] } } }).html;
check('dynamic recommendation explanations are HTML escaped', !escaped.includes('<script>') && !escaped.includes('<img') && !escaped.includes('<svg') && escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img src=x&gt;'));

const route = read('agent/consultation/index.html');
const rendererSource = read('assets/js/print-renderers.js');
check('consultation route loads all three existing guidance modules once', ['consultation-command-center.js', 'recommendation-builder.js', 'explanation-assist.js'].every(name => (route.match(new RegExp(name.replace('.', '\\.'), 'g')) || []).length === 1));
check('guidance modules load before the Print Engine and document controller', route.indexOf('/assets/js/recommendation-builder.js') < route.indexOf('/assets/js/print-engine.js') && route.indexOf('/assets/js/explanation-assist.js') < route.indexOf('/assets/js/consultation-document.js'));
check('existing HTML renderer advances in place', ['1.12.0', '1.13.0','1.14.0','1.15.0'].includes(renderers.getRenderer('html').version));
check('Recommendation Explanation styling uses the existing renderer', rendererSource.includes('RECOMMENDATION_EXPLANATION_CSS') && rendererSource.includes('.cf-guide-recommendation__explanation'));
check('Recommendation Explanation layout is responsive', rendererSource.includes('@media(max-width:720px){.cf-guide-recommendation__header{display:grid}.cf-guide-recommendation__explanation{grid-template-columns:1fr}'));
check('Recommendation Explanation layout is print safe', rendererSource.includes('@media print{.cf-guide-recommendation__header,.cf-guide-recommendation__explanation,.cf-guide-recommendation__reason,.cf-guide-recommendation__guardrail{break-inside:avoid'));
check('document copy makes no unsupported insurance outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(html + read('assets/js/print/models/consultation-guide-model.js')));
check('CD-1.5 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.5.md')) && read('ROADMAP.md').includes('CD-1.5 Recommendation Explanations — Complete (3.20.43)') && read('CHANGELOG.md').includes('## 3.20.43 — CD-1.5 Recommendation Explanations'));

for (const rel of ['assets/js/consultation-document.js', 'assets/js/print-engine.js', 'assets/js/print/models/consultation-guide-model.js', 'assets/js/print/sections/consultation-guide.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('authoritative Recommendation Builder remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('Explanation Assist advances only its bounded water matcher', hash('assets/js/explanation-assist.js') === '7f163223824f13b706a3b72944dc147f6de69c8088a3e8250f7db3d83c42da87' && read('assets/js/explanation-assist.js').includes('\\bsump\\b'));
check('GC-1.3 Command Center ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('authoritative print recommendation ordering remains unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44');
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('CD-1.1 architecture remains unchanged', ['edcba77c95aa2d89f97a5f6e0425dd6286bec91aac51b2f9b5f0555b1186dd81', 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1'].includes(hash('assets/js/print/consultation-document-architecture.js')));
check('CD-1.2 Executive Summary remains unchanged', ['efb67b2821104156f2be755a23e57000c773fea0fa0d0eeef904f041617756a4', '709733fed46b2840163ab587dc26e10436ab7227170572a28e33ec721bd4a57e', '7bb00966126da1d855dbf9b2f916ef54cdbcd0dab09428a12f7a4953fa5e627a'].includes(hash('assets/js/print/models/executive-summary-model.js')));
check('CD-1.3 Protection Snapshot remains unchanged', ['624b88d2304fca85c30ca07077e9a59a97b54a317db63008dc420d37d3f99512', '58c77e15a22d6629695ad7286227c6157a6493124bde3b1c42c66a051eb0940b'].includes(hash('assets/js/print/models/protection-snapshot-model.js')));
check('Property and Verification section remains unchanged', ['1d2c296cb1fb1689b2dec99922a681cdc09962215f1342e3a7db0c70d54c79b1', 'de3691394a497679d9c64b86de1127c7584ef3888bcdc59ba6a8653317802ebb'].includes(hash('assets/js/print/sections/property-summary.js')));
check('consultation records remain unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.5 QA: ${passed}/${passed} passed`);
