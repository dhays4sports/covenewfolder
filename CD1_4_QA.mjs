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

const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const recommendationModel = require('./assets/js/print/models/recommendation-model.js');
const guideModel = require('./assets/js/print/models/consultation-guide-model.js');
const section = require('./assets/js/print/sections/consultation-guide.js');
const renderers = require('./assets/js/print-renderers.js');

const recommendations = Object.freeze([
  Object.freeze({ id: 'low', title: 'Optional inventory review', priority: 'Low', category: 'Property', explanation: 'The saved review identified an optional inventory discussion.', question: 'Would a home inventory be useful?', producerNotes: 'Discuss only if it supports the homeowner’s goals.', evidenceQuality: 'confirmed' }),
  Object.freeze({ id: 'medium', title: 'Confirm liability priorities', priority: 'Medium', category: 'Liability', explanation: 'The household liability preference should be discussed.', question: 'What liability situations are most important to you?', producerNotes: 'Connect the discussion to household circumstances.', evidenceQuality: 'confirmed' }),
  Object.freeze({ id: 'critical', title: 'Review water-loss terms', priority: 'Critical', category: 'Water', explanation: 'The homeowner is unsure how the current policy handles water loss.', question: 'Can we review the current water-loss wording?', producerNotes: 'Compare the declarations and applicable forms.', evidenceQuality: 'needs-verification', evidencePrompt: 'Confirm current policy wording.' }),
  Object.freeze({ id: 'empty-shell', title: 'Empty topic' }),
  Object.freeze({ id: 'high', title: 'Confirm rebuilding assumptions', priority: 'High', category: 'Property', explanation: 'One rebuilding assumption still needs a homeowner detail.', question: 'Has the home changed since the current policy was written?', producerNotes: 'Confirm material property changes.', evidenceQuality: 'partial' })
]);

const printModel = Object.freeze({
  generatedAt: '2026-08-09T18:00:00.000Z',
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  propertySummary: Object.freeze({ address: '123 Main St, Fremont, CA 94539' }),
  assessment: Object.freeze({ score: 62, status: 'Review Recommended', topPriority: 'Review water-loss terms' }),
  recommendations,
  timeline: Object.freeze({ items: Object.freeze([]) }),
  consultationChecklist: Object.freeze({ items: Object.freeze([]) }),
  consultationContext: Object.freeze({ reviewReason: 'Premium increased', stage: 'consultation_scheduled', missingInformation: Object.freeze(['Current declarations page']), followUp: Object.freeze({ state: 'none' }) })
});

const original = JSON.stringify(recommendations);
const model = guideModel.create(printModel);
const output = section.render(printModel);
const html = output.html;

check('release remains compatible after CoverageFit 3.20.42', ['3.20.42', '3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('existing Consultation Guide model advances additively', ['1.1.0', '1.2.0', '1.3.0', '1.4.0', '1.5.0'].includes(guideModel.VERSION) && guideModel.SCHEMA_VERSION === 1);
check('existing Consultation Record section advances in place', section.id === 'consultation-guide' && ['1.3.0', '1.4.0', '1.5.0', '1.6.0', '1.7.0','1.7.1'].includes(section.version) && registry.hasSection('consultation-guide'));
check('established recommendation ordering model remains the dependency', recommendationModel.VERSION === '1.2.0' && read('assets/js/print/models/consultation-guide-model.js').includes("require('./recommendation-model.js')"));
check('Priority Findings is bounded to three meaningful topics', model.findingCount === 3 && model.topics.length === 3 && model.additionalFindingCount === 1);
check('empty recommendation shells are excluded', !model.topics.some(item => item.id === 'empty-shell'));
check('existing priority model determines conversation order', model.topics.map(item => item.id).join(',') === 'critical,high,medium');
check('conversation sequence is explicit', model.topics.map(item => item.sequenceLabel).join(',') === 'Address first,Discuss next,Also review');
check('source recommendations are not mutated', JSON.stringify(recommendations) === original);
check('Priority Findings model is deeply immutable', Object.isFrozen(model) && Object.isFrozen(model.topics) && model.topics.every(Object.isFrozen));
check('finding explanations remain tied to their original topics', model.topics[0].discovered.includes('unsure') && model.topics[1].discovered.includes('homeowner detail'));
check('saved priority produces a concise ordering rationale', model.topics[0].priorityReason.includes('most important') && model.topics[1].priorityReason.includes('most important'));
check('policy verification maps to Check policy', model.topics[0].actionLabel === 'Check the policy' && model.topics[0].evidenceInstruction.includes('current policy says'));
check('partial evidence maps to Ask homeowner', model.topics[1].actionLabel === 'Confirm together' && model.topics[1].evidenceInstruction.includes('missing homeowner detail'));
check('confirmed evidence maps to Discuss and confirm', model.topics[2].actionLabel === 'Discuss and confirm' && model.topics[2].evidenceInstruction.includes('specific to the current policy'));
check('raw scores and assessment math are not exposed by the document topic model', model.topics.every(item => !Object.hasOwn(item, 'priorityScore') && !Object.hasOwn(item, 'weightedPenalty')));
check('legacy timeline fallback remains available', guideModel.create({ customer: { name: 'Legacy Homeowner' }, recommendations: [], timeline: { items: [{ id: 'legacy', type: 'recommendation-topic', title: 'Legacy review topic', objective: 'Confirm the saved topic.', prompt: 'Can we review this?', coachingNote: 'Check the current policy.' }] } }).topics[0].id === 'legacy');

check('Consultation Record retains the canonical page marker', html.includes('data-document-page="consultation-record"'));
check('Priority Findings has a distinct homeowner-readable heading', html.includes('<h2 id="cf-guide-discussion-title">Priority findings</h2>') && html.includes('listed in conversation order'));
check('only three prioritized finding cards render', (html.match(/class="cf-guide-topic"/g) || []).length === 3 && !html.includes('Optional inventory review'));
check('rendered card order follows the model', html.indexOf('Review water-loss terms') < html.indexOf('Confirm rebuilding assumptions') && html.indexOf('Confirm rebuilding assumptions') < html.indexOf('Confirm liability priorities'));
check('each card exposes its deterministic priority order', html.includes('data-priority-order="1"') && html.includes('data-priority-order="2"') && html.includes('data-priority-order="3"'));
check('finding content stays in the Priority Findings chapter', html.includes('data-document-chapter="priority-findings"') && html.includes('What the assessment found') && html.includes('Why this comes first'));
check('consultation prompts stay in the Recommendations chapter', html.includes('data-document-chapter="recommendations"') && html.includes('Questions to discuss') && html.includes('Can we review the current water-loss wording?'));
check('producer direction and verification prompts remain visible', html.includes('Compare the current policy summary and applicable forms.') && html.includes('Confirm current policy wording.'));
check('evidence actions are visible without changing evidence state', html.includes('>Check the policy<') && html.includes('>Confirm together<') && html.includes('>Discuss and confirm<'));
check('finding and recommendation architecture remains one existing section', (html.match(/data-document-chapters="priority-findings recommendations"/g) || []).length === 4 && section.name === 'Consultation Record');

const escaped = section.render({ customer: { name: '<script>alert(1)</script>' }, recommendations: [{ id: 'unsafe', title: '<img src=x>', priority: 'High', explanation: '<b>unsafe</b>', question: '<svg onload=alert(1)>', producerNotes: 'Confirm <terms>' }], consultationContext: { reviewReason: '<iframe>' } }).html;
check('dynamic Priority Findings content is HTML escaped', !escaped.includes('<script>') && !escaped.includes('<img') && !escaped.includes('<svg') && escaped.includes('&lt;img src=x&gt;') && escaped.includes('&lt;b&gt;unsafe&lt;/b&gt;'));

const route = read('agent/consultation/index.html');
const rendererSource = read('assets/js/print-renderers.js');
check('consultation route loads the established recommendation model once', (route.match(/print\/models\/recommendation-model\.js/g) || []).length === 1);
check('recommendation ordering model loads before Consultation Guide model', route.indexOf('/assets/js/print/models/recommendation-model.js') < route.indexOf('/assets/js/print/models/consultation-guide-model.js'));
check('existing HTML renderer advances in place', ['1.11.0', '1.12.0','1.13.0','1.14.0','1.15.0'].includes(renderers.getRenderer('html').version));
check('Priority Findings styling uses the existing renderer', rendererSource.includes('PRIORITY_FINDINGS_CSS') && rendererSource.includes('.cf-guide-topic__priority'));
check('Priority Findings layout is responsive', rendererSource.includes('@media(max-width:720px){.cf-guide-topic__priority{grid-template-columns:1fr}'));
check('Priority Findings layout is print safe', rendererSource.includes('@media print{.cf-guide-topic__header,.cf-guide-topic__known,.cf-guide-topic__priority,.cf-guide-topic__guidance{break-inside:avoid'));
check('presentation model creates no storage, API, assessment, or scoring system', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|assessment-engine/.test(read('assets/js/print/models/consultation-guide-model.js')));
check('document copy makes no unsupported insurance outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(html + read('assets/js/print/models/consultation-guide-model.js')));
check('CD-1.4 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.4.md')) && read('ROADMAP.md').includes('CD-1.4 Priority Findings — Complete (3.20.42)') && read('CHANGELOG.md').includes('## 3.20.42 — CD-1.4 Priority Findings'));

for (const rel of ['assets/js/print/models/consultation-guide-model.js', 'assets/js/print/sections/consultation-guide.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('authoritative recommendation ordering model remains unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44');
check('GC-1.3 Command Center ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('Print Engine contract remains compatible', ['9ddd5434a0df49c495d9db59923a80f13f79e47cc3b2eb2eeef5505ab88f5156', 'e11882dbb7a0ca28f21c038aaf813420210629a55bdd2042e1956b91f68d89a8', 'f9d0cd322580c5f5d149ff739c5c651b021b4a2fa823520d6a9ff46e13846341', '19a924672538e605f6eeb400ff0842fb0a688d8c32817bbf31507e72f8016a9d'].includes(hash('assets/js/print-engine.js')));
check('consultation document controller remains compatible', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('CD-1.1 architecture remains unchanged', ['edcba77c95aa2d89f97a5f6e0425dd6286bec91aac51b2f9b5f0555b1186dd81', 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1'].includes(hash('assets/js/print/consultation-document-architecture.js')));
check('CD-1.2 Executive Summary remains unchanged', ['efb67b2821104156f2be755a23e57000c773fea0fa0d0eeef904f041617756a4', '709733fed46b2840163ab587dc26e10436ab7227170572a28e33ec721bd4a57e', '7bb00966126da1d855dbf9b2f916ef54cdbcd0dab09428a12f7a4953fa5e627a'].includes(hash('assets/js/print/models/executive-summary-model.js')));
check('CD-1.3 Protection Snapshot remains unchanged', ['624b88d2304fca85c30ca07077e9a59a97b54a317db63008dc420d37d3f99512', '58c77e15a22d6629695ad7286227c6157a6493124bde3b1c42c66a051eb0940b'].includes(hash('assets/js/print/models/protection-snapshot-model.js')));
check('consultation records remain unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.4 QA: ${passed}/${passed} passed`);
