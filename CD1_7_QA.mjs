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

const language = require('./assets/js/print/consumer-language.js');
const architecture = require('./assets/js/print/consultation-document-architecture.js');
const executiveModel = require('./assets/js/print/models/executive-summary-model.js');
const protectionModel = require('./assets/js/print/models/protection-snapshot-model.js');
const propertyModel = require('./assets/js/print/models/property-summary-model.js');
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const executiveSection = require('./assets/js/print/sections/executive-summary.js');
const propertySection = require('./assets/js/print/sections/property-summary.js');
const guideSection = require('./assets/js/print/sections/consultation-guide.js');
const documentController = require('./assets/js/consultation-document.js');

const recommendations = Object.freeze([
  Object.freeze({ id: 'water', title: 'Review water-loss terms', priority: 'Critical', category: 'Water', explanation: 'Review endorsements, exclusions, and carrier wording.', question: 'Can we compare the current declarations and available options?', producerNotes: 'Confirm current declarations, carrier forms, underwriting guidance, and homeowner preference.', evidenceQuality: 'needs-verification' }),
  Object.freeze({ id: 'rebuild', title: 'Confirm rebuilding assumptions', priority: 'High', category: 'Home', explanation: 'The replacement estimate should reflect the current home.', question: 'Has the home changed?', producerNotes: 'Confirm the dwelling limit and deductible.', evidenceQuality: 'partial' })
]);
const plan = Object.freeze({ items: Object.freeze([
  Object.freeze({ findingId: 'water', decision: 'recommend', verified: true, producerReason: 'Producer note: keep “carrier quote” wording verbatim.' }),
  Object.freeze({ findingId: 'rebuild', decision: 'defer', verified: false, producerReason: 'Revisit when the home details are available.' })
]) });
const assistance = Object.freeze({ items: Object.freeze([
  Object.freeze({ findingId: 'water', whatItMeans: 'Underwriting eligibility and endorsements can affect the available terms.', whyItMatters: 'Carrier availability and exclusions can change the claim outcome.', verification: Object.freeze(['Review current declarations, endorsements, exclusions, and the formal carrier quote.']), guardrail: 'Old technical guardrail.' })
]) });
const completion = Object.freeze({
  status: 'complete',
  completion: Object.freeze({ state: 'complete', decisionSummary: 'Homeowner note: review the declarations page before deciding.', unresolvedState: 'open', unresolvedSummary: 'Confirm the current water details.', quoteState: 'needs_items', quoteRequirements: 'Current policy summary and preferred limit.', nextAction: 'Homeowner sends the policy Friday.', updatedAt: '2026-08-09T20:00:00.000Z' }),
  decisions: Object.freeze([
    Object.freeze({ id: 'water', title: 'Review water-loss terms', decision: 'recommend', label: 'Recommend for carrier quote', verified: true }),
    Object.freeze({ id: 'rebuild', title: 'Confirm rebuilding assumptions', decision: 'defer', label: 'Deferred', verified: false })
  ]),
  followUp: Object.freeze({ state: 'scheduled', dueDate: '2026-08-15', note: 'Review the formal quote.' })
});
const printModel = Object.freeze({
  schemaVersion: 2,
  engineVersion: '0.4.0',
  generatedAt: '2026-08-09T20:10:00.000Z',
  metadata: Object.freeze({ title: 'Home Protection Consultation', consultationDate: '2026-08-09', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency' }),
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  propertySummary: Object.freeze({ available: true, address: '123 Main St, Fremont, CA 94539', yearBuilt: 1998, squareFeet: 1840, stories: 2, constructionType: 'Single-family home', roof: 'Composition shingle', pool: true, coverage: Object.freeze({ replacementCost: 720000, deductible: 5000, currentCarrier: 'Example Mutual', currentPremium: 2860, renewalDate: '2026-10-15' }) }),
  assessment: Object.freeze({ score: 62, status: 'Review Recommended', strongest: 'Liability planning', topPriority: 'Review water-loss terms' }),
  strengths: Object.freeze(['Liability planning']),
  recommendations,
  evidenceHandoff: Object.freeze({ available: true, summary: Object.freeze({ total: 3, confirmed: 1, verification: 1, unresolved: 1, followUp: 2 }), confirmedFacts: Object.freeze([Object.freeze({ title: 'Occupancy', answer: 'Primary home' })]), verificationItems: Object.freeze([Object.freeze({ title: 'Water terms', question: 'Confirm current wording.' })]), unresolvedQuestions: Object.freeze([Object.freeze({ title: 'Roof age', question: 'When was the roof replaced?' })]), guardrail: 'Old technical handoff guardrail.' }),
  consultationContext: Object.freeze({ reviewReason: 'Premium increased', stage: 'consultation_completed', recommendationPlan: plan, explanationAssist: assistance, consultationCompletion: completion, missingInformation: Object.freeze(['Current roof age']), nextAction: 'Review the priority topics.' })
});

check('release remains compatible after CoverageFit 3.20.45', ['3.20.45', '3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('consumer language helper is centrally versioned', language.VERSION === '1.0.0' && language.SCHEMA_VERSION === 1);
check('consumer language helper diagnostics pass', language.diagnostics().valid === true && language.diagnostics().errors.length === 0);
check('language configuration is immutable', Object.isFrozen(language) && Object.isFrozen(language.REPLACEMENTS) && language.REPLACEMENTS.every(Object.isFrozen));
const simplified = language.simplifySystemText('Confirm current declarations, endorsements, exclusions, underwriting guidance, carrier forms, and the formal carrier quote.');
check('declarations are explained as the policy summary', simplified.includes('current policy summary'));
check('endorsements are explained as added policy options', simplified.includes('added policy options'));
check('exclusions are explained directly', simplified.includes('what the policy does not cover'));
check('underwriting is explained as insurance company review', simplified.includes('insurance company review guidance'));
check('carrier forms are explained as insurance company forms', simplified.includes('insurance company forms'));
check('formal carrier quote becomes formal insurance quote', simplified.includes('formal insurance quote'));
check('sentence capitalization is preserved during simplification', language.simplifySystemText('Underwriting eligibility matters.').startsWith('Insurance company eligibility review'));
check('plain text without mapped jargon is unchanged', language.simplifySystemText('The homeowner prefers a lower deductible.') === 'The homeowner prefers a lower deductible.');
check('final-terms copy identifies the official sources', language.FINAL_TERMS.includes('formal quote and issued policy are the official sources'));
check('policy-check copy preserves confirmation before recommendation', language.POLICY_CHECK.includes('before making a recommendation'));

check('canonical architecture advances in place', architecture.VERSION === '1.1.0' && architecture.SCHEMA_VERSION === '1.0');
check('three-part document architecture is preserved', architecture.PAGES.length === 3 && architecture.PAGES.map(page => page.id).join(',') === 'review-overview,property-verification,consultation-record');
check('seven canonical chapter IDs are preserved', architecture.CHAPTERS.length === 7 && architecture.CHAPTERS.map(chapter => chapter.id).join(',') === 'executive-summary,protection-snapshot,property-snapshot,items-to-verify,priority-findings,recommendations,decisions-next-steps');
check('chapter order remains unchanged', architecture.CHAPTERS.map(chapter => chapter.number).join(',') === '01,02,03,04,05,06,07');
check('chapter purposes now use direct language', architecture.getChapter('protection-snapshot').purpose === 'What the score means and how to use it.' && architecture.getChapter('items-to-verify').purpose.includes('Details to confirm'));
check('document map uses a homeowner-readable label', architecture.renderDocumentMap('review-overview').includes('aria-label="Home protection consultation sections"'));
check('architecture diagnostics remain valid', architecture.diagnostics().valid === true);

const executive = executiveModel.create(printModel);
const protection = protectionModel.create(executive);
check('Executive Summary model advances additively', ['1.3.0', '1.4.0'].includes(executiveModel.VERSION) && executiveModel.SCHEMA_VERSION === 1);
check('Executive Summary remains immutable', Object.isFrozen(executive) && Object.isFrozen(executive.overview));
check('Executive Summary keeps homeowner identity and purpose', executive.client.name === 'Jordan Martinez' && executive.overview.reviewPurpose === 'Premium increased');
check('Executive Summary default explanation uses recommendation language', executive.overview.summary.includes('before a recommendation is made'));
check('Executive Summary next step uses direct policy language', executive.nextSteps.some(step => step.includes('confirm what the current policy says')));
check('Protection Snapshot advances presentation only', protectionModel.VERSION === '1.1.0' && protectionModel.SCHEMA_VERSION === 1);
check('Protection Score value and band are unchanged', protection.value === 62 && protection.band.id === 'review-recommended' && protection.band.min === 50 && protection.band.max === 69);
check('Protection Snapshot explains what the score summarizes', protection.purpose.includes('assessment answers'));
check('Protection Snapshot explains what the score does not decide', protection.guardrail.includes('does not decide what is covered') && protection.guardrail.includes('what a policy will cost'));
check('Protection Snapshot remains immutable', Object.isFrozen(protection) && Object.isFrozen(protection.scale));

const property = propertyModel.create(printModel);
check('Property Summary model advances additively', propertyModel.VERSION === '1.2.0' && propertyModel.SCHEMA_VERSION === 1);
check('Property Summary preserves source facts', property.coverage.replacementCost === 720000 && property.coverage.deductible === 5000 && property.coverage.currentCarrier === 'Example Mutual');
check('Property risk copy avoids exposure jargon', property.riskHighlights.includes('Swimming pool details should be reviewed.') && !property.riskHighlights.join(' ').includes('exposure'));
check('Property Summary remains immutable', Object.isFrozen(property) && Object.isFrozen(property.coverage));

const guide = guideModel.create(printModel);
check('Consultation Guide model advances additively', ['1.4.0', '1.5.0'].includes(guideModel.VERSION) && guideModel.SCHEMA_VERSION === 1);
check('finding order remains unchanged', guide.topics.map(topic => topic.id).join(',') === 'water,rebuild');
check('finding evidence classifications remain unchanged', guide.topics.map(topic => topic.evidenceQuality).join(',') === 'needs-verification,partial');
check('recommendation judgment states remain unchanged', guide.topics.map(topic => topic.recommendation.status).join(',') === 'recommend,defer');
check('confirmed recommendation receives direct status language', guide.topics[0].recommendation.statusLabel === 'Include in formal insurance quote' && guide.topics[0].recommendation.verificationLabel === 'Confirmed for discussion');
check('unconfirmed recommendation remains explicit', guide.topics[1].recommendation.verificationLabel === 'Needs confirmation');
check('system-generated meaning is simplified', guide.topics[0].recommendation.meaning.includes('Insurance company eligibility review') && guide.topics[0].recommendation.meaning.includes('added policy options'));
check('system-generated importance is simplified', guide.topics[0].recommendation.importance.includes('Insurance company availability') && guide.topics[0].recommendation.importance.includes('what the policy does not cover'));
check('system-generated confirmation list is simplified', guide.topics[0].confirm.some(item => item.includes('current policy summary')) && guide.topics[0].confirm.some(item => item.includes('added policy options')));
check('system-generated producer direction is simplified', guide.topics[0].direction.includes('current policy summary') && guide.topics[0].direction.includes('insurance company forms'));
check('producer-entered reasoning remains verbatim', guide.topics[0].recommendation.reason === 'Producer note: keep “carrier quote” wording verbatim.');
check('homeowner decision summary remains verbatim', guide.completion.decision.summary === 'Homeowner note: review the declarations page before deciding.');
check('completion state remains complete', guide.completion.state === 'complete' && guide.completion.statusLabel === 'Consultation summary saved');
check('unresolved state remains open', guide.completion.unresolved.state === 'open' && guide.completion.unresolved.summary === 'Confirm the current water details.');
check('quote state remains needs items', guide.completion.quote.state === 'needs_items' && guide.completion.quote.summary === 'Current policy summary and preferred limit.');
check('finding decisions preserve machine states', guide.completion.recommendationDecisions.map(item => item.state).join(',') === 'recommend,defer');
check('finding decision confirmation labels are direct', guide.completion.recommendationDecisions.map(item => item.verificationLabel).join(',') === 'Confirmed,Needs confirmation');
check('agreed next step remains verbatim', guide.completion.nextAction.available && guide.completion.nextAction.summary === 'Homeowner sends the policy Friday.');
check('plain guardrail replaces technical generated guardrail', guide.completion.guardrail === language.FINAL_TERMS && guide.topics[0].recommendation.guardrail === language.FINAL_TERMS);
check('Guide model remains immutable', Object.isFrozen(guide) && Object.isFrozen(guide.topics) && Object.isFrozen(guide.completion));

const executiveHtml = executiveSection.render(printModel).html;
const propertyHtml = propertySection.render(printModel).html;
const guideHtml = guideSection.render(printModel).html;
check('Executive Summary section advances in place', executiveSection.id === 'executive-summary' && ['1.8.0', '1.9.0'].includes(executiveSection.version));
check('Executive Summary uses direct scan labels', executiveHtml.includes('What this score means') && executiveHtml.includes('What the answers show') && executiveHtml.includes('Most important topics') && executiveHtml.includes('Details to confirm'));
check('Executive Summary explains insurance-company authority', executiveHtml.includes('The formal quote and issued policy are the official sources.'));
check('Property section advances in place', propertySection.id === 'property-summary' && propertySection.version === '1.6.0');
check('Property facts use homeowner-readable labels', propertyHtml.includes('Estimated rebuilding amount') && propertyHtml.includes('Home deductible') && propertyHtml.includes('Current insurance company') && propertyHtml.includes('Current annual policy cost') && propertyHtml.includes('Next policy date'));
check('Property section explains declarations page inline', propertyHtml.includes('current policy summary (declarations page)'));
check('Property footer is suitable for a private shared document', propertyHtml.includes('Private consultation document') && !propertyHtml.includes('Confidential agent material'));
check('Consultation Record advances in place', guideSection.id === 'consultation-guide' && ['1.6.0', '1.7.0','1.7.1'].includes(guideSection.version));
check('evidence handoff uses shared-review language', guideHtml.includes('What was shared and what still needs confirmation') && guideHtml.includes('What the homeowner shared') && guideHtml.includes('What to confirm together'));
check('recommendation prompts use shared-conversation language', guideHtml.includes('Questions to discuss') && guideHtml.includes('A question to discuss') && guideHtml.includes('Why we are asking') && guideHtml.includes('What to confirm'));
check('completion uses consultation-summary language', guideHtml.includes('Consultation status') && guideHtml.includes('Consultation summary saved') && guideHtml.includes('Saved consultation summary'));
check('quote card uses formal insurance quote language', guideHtml.includes('Formal insurance quote') && !guideHtml.includes('Formal carrier quote'));
check('finding decisions use topic language', guideHtml.includes('Topic decisions') && !guideHtml.includes('Finding decisions'));
check('machine-readable completion markers are preserved', guideHtml.includes('data-closeout-state="complete"') && guideHtml.includes('data-unresolved-state="open"') && guideHtml.includes('data-quote-state="needs_items"') && guideHtml.includes('data-next-action-state="agreed"'));
check('machine-readable recommendation markers are preserved', guideHtml.includes('data-recommendation-state="recommend"') && guideHtml.includes('data-verification-state="verified"') && guideHtml.includes('data-decision-state="defer"'));
check('consultation footer explains official sources', guideHtml.includes('The formal quote and issued policy are the official sources.'));
check('consultation footer identifies a private document', guideHtml.includes('Private consultation document'));

const draft = guideModel.create({ customer: { name: 'Draft' }, consultationContext: { decisions: ['Earlier note'], missingInformation: ['Current policy'], nextAction: 'Confirm details.' } });
const draftHtml = guideSection.render({ customer: { name: 'Draft' }, consultationContext: { decisions: ['Earlier note'], missingInformation: ['Current policy'], nextAction: 'Confirm details.' } }).html;
check('unfinished record remains draft', draft.completion.state === 'draft' && draft.completion.statusLabel === 'Consultation summary not yet saved');
check('draft does not invent agreement', !draft.completion.decision.available && draft.completion.decision.summary.includes('not yet been recorded'));
check('draft next step remains non-authoritative', !draft.completion.nextAction.available && draft.completion.nextAction.label === 'Possible next step');
check('rendered draft is unmistakable', draftHtml.includes('data-closeout-state="draft"') && draftHtml.includes('Draft document · decisions and next steps are not final'));
check('legacy working context remains separate', draftHtml.includes('Earlier notes') && draftHtml.includes('Details currently identified'));

const unsafeHtml = guideSection.render({ customer: { name: '<script>' }, recommendations: [{ id: 'unsafe', title: '<img src=x>', priority: 'High', explanation: '<svg onload=x>', question: '<iframe>' }], consultationContext: { consultationCompletion: { status: 'complete', completion: { state: 'complete', decisionSummary: '<script>alert(1)</script>', unresolvedState: 'open', unresolvedSummary: '<img src=x>', quoteState: 'needs_items', quoteRequirements: '<svg>', nextAction: '<iframe>' } } } }).html;
check('dynamic content remains HTML escaped', !unsafeHtml.includes('<script>') && !unsafeHtml.includes('<img') && !unsafeHtml.includes('<svg') && !unsafeHtml.includes('<iframe') && unsafeHtml.includes('&lt;script&gt;'));
check('consumer copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|insurance company approved|this is covered/i.test(executiveHtml + propertyHtml + guideHtml));

const consultationRoute = read('agent/consultation/index.html');
const workspaceRoute = read('agent/workspace/index.html');
check('consultation route loads consumer language exactly once', (consultationRoute.match(/print\/consumer-language\.js/g) || []).length === 1);
check('workspace route loads consumer language exactly once', (workspaceRoute.match(/print\/consumer-language\.js/g) || []).length === 1);
check('consumer language loads before dependent consultation models', consultationRoute.indexOf('/assets/js/print/consumer-language.js') < consultationRoute.indexOf('/assets/js/print/models/executive-summary-model.js') && consultationRoute.indexOf('/assets/js/print/consumer-language.js') < consultationRoute.indexOf('/assets/js/print/models/consultation-guide-model.js'));
check('consumer language loads before dependent workspace models', workspaceRoute.indexOf('/assets/js/print/consumer-language.js') < workspaceRoute.indexOf('/assets/js/print/models/executive-summary-model.js') && workspaceRoute.indexOf('/assets/js/print/consumer-language.js') < workspaceRoute.indexOf('/assets/js/print/models/property-summary-model.js'));
check('Consultation Document controller advances additively', ['1.6.0', '1.7.0', '1.8.0'].includes(documentController.VERSION));
check('controller uses homeowner-readable missing-detail labels', ['Homeowner phone number', 'Homeowner email address', 'Current estimated rebuilding amount', 'Current insurance company', 'Current annual policy cost', 'Next policy date'].every(value => read('assets/js/consultation-document.js').includes(value)));
check('CD-1.7 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.7.md')) && read('ROADMAP.md').includes('CD-1.7 Consumer Language Pass — Complete (3.20.45)') && read('CHANGELOG.md').includes('## 3.20.45 — CD-1.7 Consumer Language Pass'));

for (const rel of ['assets/js/consultation-document.js', 'assets/js/print/consumer-language.js', 'assets/js/print/consultation-document-architecture.js', 'assets/js/print/models/executive-summary-model.js', 'assets/js/print/models/protection-snapshot-model.js', 'assets/js/print/models/property-summary-model.js', 'assets/js/print/models/consultation-guide-model.js', 'assets/js/print/sections/executive-summary.js', 'assets/js/print/sections/property-summary.js', 'assets/js/print/sections/consultation-guide.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('authoritative Recommendation Builder remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('Explanation Assist remains unchanged', hash('assets/js/explanation-assist.js') === '7f163223824f13b706a3b72944dc147f6de69c8088a3e8250f7db3d83c42da87');
check('GC-1.9 completion model remains unchanged', hash('assets/js/consultation-completion.js') === 'c0d4f6c7530d3042f3abd3caec2deb9fc6c871b08fbf96d9e843ae6d3655cc96');
check('authoritative print recommendation ordering remains unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44');
check('Print Engine advances only by carrying the shared story', read('assets/js/print-engine.js').includes('producerConsumerStory') && read('assets/js/print-engine.js').includes('consultationCompletion'));
check('consultation persistence remains unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.7 QA: ${passed}/${passed} passed`);
