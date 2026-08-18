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

const architecture = require('./assets/js/print/consultation-document-architecture.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const executiveSection = require('./assets/js/print/sections/executive-summary.js');
const propertySection = require('./assets/js/print/sections/property-summary.js');
const guideSection = require('./assets/js/print/sections/consultation-guide.js');

check('release remains compatible after CoverageFit 3.20.39', ['3.20.39', '3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('document architecture is centrally versioned', ['1.0.0', '1.1.0'].includes(architecture.VERSION) && architecture.SCHEMA_VERSION === '1.0');
check('document pages and chapters are immutable', Object.isFrozen(architecture.PAGES) && Object.isFrozen(architecture.CHAPTERS) && Object.isFrozen(architecture.PAGES[0]));
check('architecture defines three ordered parts', architecture.PAGES.length === 3 && architecture.PAGES.map(page => page.title).join('|') === 'Review Overview|Property & Verification|Consultation Record');
check('architecture defines seven canonical chapters', architecture.CHAPTERS.length === 7);
check('canonical chapter order is homeowner-comprehensible', architecture.CHAPTERS.map(chapter => chapter.title).join('|') === 'Executive Summary|Protection Snapshot|Property Snapshot|Items to Verify|Priority Findings|Recommendations|Decisions and Next Steps');
check('every chapter belongs to exactly one part', architecture.diagnostics().valid && architecture.diagnostics().chapterCount === 7);
check('part order preserves the current three-section Print Engine', architecture.PAGES.map(page => page.order).join(',') === '10,20,30');
check('unknown architecture keys fail safely', architecture.getPage('missing') === null && architecture.getChapter('missing') === null);

for (const page of architecture.PAGES) {
  const map = architecture.renderDocumentMap(page.id);
  check(`${page.title} map includes all parts`, architecture.PAGES.every(candidate => map.includes(candidate.title)));
  check(`${page.title} map identifies one active part`, (map.match(/aria-current="step"/g) || []).length === 1 && map.includes(`data-document-page="${page.id}"`));
}

const model = Object.freeze({
  generatedAt: '2026-08-09T18:00:00.000Z',
  metadata: Object.freeze({ title: 'Home Protection Consultation', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency' }),
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  assessment: Object.freeze({ score: 74, status: 'Strong Foundation', topPriority: 'Review water-loss terms' }),
  executiveSummary: 'Prepare a focused conversation about rebuilding, water terms, and deductibles.',
  strengths: Object.freeze(['Completed a structured review']),
  propertySummary: Object.freeze({
    available: true,
    address: '123 Main St, Fremont, CA 94539',
    yearBuilt: 1988,
    livingArea: 1950,
    stories: 2,
    construction: 'Frame',
    roof: 'Composition',
    foundation: 'Slab',
    coverage: Object.freeze({ replacementCost: 850000, deductible: 5000, currentCarrier: 'Example Mutual', currentPremium: 2450, renewalDate: '2026-09-15' }),
    riskHighlights: Object.freeze(['Older roof details should be confirmed.'])
  }),
  recommendations: Object.freeze([Object.freeze({
    id: 'water-review', title: 'Review water-loss terms', priority: 'High', category: 'Property',
    summary: 'The homeowner is not sure how water damage is handled.', explanation: 'The homeowner is not sure how water damage is handled.',
    question: 'Have you reviewed your water-damage deductible and limitations?', conversationStarter: 'Have you reviewed your water-damage deductible and limitations?',
    producerNotes: 'Confirm the deductible, limitations, and mitigation-device requirements.', evidenceQuality: 'needs-verification',
    evidenceLabel: 'Needs policy verification', evidencePrompt: 'Confirm water-loss terms against the issued policy.', evidence: Object.freeze(['Homeowner reported uncertainty'])
  })]),
  timeline: Object.freeze({ items: Object.freeze([]) }),
  consultationChecklist: Object.freeze({ items: Object.freeze([]) }),
  consultationContext: Object.freeze({
    reviewReason: 'Premium increased', missingInformation: Object.freeze(['Current declarations page']), decisions: Object.freeze([]),
    nextAction: 'Review the declarations page and prepare options.', stage: 'consultation_scheduled', outcome: 'none',
    followUp: Object.freeze({ state: 'scheduled', dueDate: '2026-08-12', note: 'Call after 4 PM' }),
    evidenceHandoff: Object.freeze({
      available: true, summary: Object.freeze({ total: 3, confirmed: 1, verification: 1, unresolved: 1, followUp: 2 }),
      confirmedFacts: Object.freeze([Object.freeze({ title: 'Review reason', answer: 'Premium increased' })]),
      verificationItems: Object.freeze([Object.freeze({ title: 'Water terms', question: 'Confirm current wording.' })]),
      unresolvedQuestions: Object.freeze([Object.freeze({ title: 'Deductible readiness', question: 'What deductible is manageable?' })]),
      guardrail: 'Confirm homeowner-reported responses against the issued policy before making a recommendation.'
    })
  })
});

const executive = executiveSection.render(model);
const property = propertySection.render(model);
const guide = guideSection.render(model);
const combined = executive.html + property.html + guide.html;

check('registered sections follow the centralized part order', registry.getRegisteredSections({ entries: true }).map(entry => entry.id).join('|') === 'executive-summary|property-summary|consultation-guide');
check('Review Overview renders as the first document part', executiveSection.order === 10 && executiveSection.name === 'Review Overview' && executive.html.includes('data-document-page="review-overview"'));
check('Review Overview identifies Executive Summary content', executive.html.includes('data-document-chapter="executive-summary"') && executive.html.includes('Executive Summary'));
check('Review Overview identifies the Protection Snapshot', executive.html.includes('data-document-chapter="protection-snapshot"') && executive.html.includes('Protection Score'));
check('Protection Score value and guardrail remain intact', executive.html.includes('74') && executive.html.includes('does not decide what is covered') && executive.html.includes('what a policy will cost'));
check('Property and Verification renders second', propertySection.order === 20 && propertySection.name === 'Property & Verification' && property.html.includes('data-document-page="property-verification"'));
check('Property Snapshot chapter preserves known home details', property.html.includes('data-document-chapter="property-snapshot"') && property.html.includes('123 Main St') && property.html.includes('1988'));
check('Items to Verify chapter preserves recorded policy facts', property.html.includes('data-document-chapter="items-to-verify"') && property.html.includes('Example Mutual') && property.html.includes('$5,000'));
check('Consultation Record renders third', guideSection.order === 30 && guideSection.name === 'Consultation Record' && guide.html.includes('data-document-page="consultation-record"'));
check('Consultation Record identifies finding and recommendation chapters', guide.html.includes('data-document-chapters="priority-findings recommendations"') && guide.html.includes('Priority findings'));
check('Consultation Record preserves finding explanation', guide.html.includes('The homeowner is not sure how water damage is handled.'));
check('Consultation Record preserves consultation question', guide.html.includes('Have you reviewed your water-damage deductible'));
check('Consultation Record preserves producer direction and verification prompt', guide.html.includes('Confirm the deductible, limitations, and mitigation-device requirements.') && guide.html.includes('Confirm water-loss terms against the issued policy.'));
check('Decisions and Next Steps remains explicit', guide.html.includes('data-document-chapter="decisions-next-steps"') && guide.html.includes('Decisions and next steps'));
check('existing next action remains available', guide.html.includes('Review the declarations page and prepare options.'));
check('every rendered part uses one shared document map', (combined.match(/class="cf-document-map"/g) || []).length === 3);
check('every rendered part identifies exactly one active map item', (combined.match(/aria-current="step"/g) || []).length === 3);

const route = read('agent/consultation/index.html');
const workspaceRoute = read('agent/workspace/index.html');
const controller = read('assets/js/consultation-document.js');
const renderer = read('assets/js/print-renderers.js');
const architectureSource = read('assets/js/print/consultation-document-architecture.js');
check('consultation route loads exactly one architecture module', (route.match(/consultation-document-architecture\.js/g) || []).length === 1);
check('architecture loads before all three existing section renderers', route.indexOf('consultation-document-architecture.js') < route.indexOf('sections/executive-summary.js'));
check('route labels the artifact Home Protection Consultation', route.includes('<title>Consultation Document | CoverageFit</title>') && route.includes('Home Protection Consultation'));
check('Workspace action uses the same Consultation Document identity', workspaceRoute.includes('id="openConsultationDocument"') && workspaceRoute.includes('>Consultation Document</a>'));
check('controller advances additively', /const VERSION = '1\.(?:3|4|5|6|7|8)\.0'/.test(controller));
check('controller uses the consultation document shell identity', controller.includes("title: 'Home Protection Consultation'") && controller.includes("documentLabel: 'Consultation Document'"));
check('renderer remains compatible and includes centralized map styling', /version: '1\.(?:8|9|10|11|12|13|14|15)\.0'/.test(renderer) && renderer.includes('DOCUMENT_INFORMATION_ARCHITECTURE_CSS'));
check('document map is responsive and print-safe', renderer.includes('.cf-document-map__item:not(.is-active){display:none}') && renderer.includes('@media print{.cf-document-map__item'));
check('architecture creates no storage, API, score, or assessment system', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|assessment-engine|setJSON/.test(architectureSource));
check('document copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(combined + route + controller));
check('CD-1.1 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.1.md')) && read('ROADMAP.md').includes('CD-1.1 Document Information Architecture — Complete (3.20.39)') && read('CHANGELOG.md').includes('## 3.20.39 — CD-1.1 Document Information Architecture'));

for (const rel of [
  'assets/js/print/consultation-document-architecture.js',
  'assets/js/print/sections/executive-summary.js',
  'assets/js/print/sections/property-summary.js',
  'assets/js/print/sections/consultation-guide.js',
  'assets/js/consultation-document.js',
  'assets/js/print-renderers.js'
]) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);

check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('Print Engine model contract remains compatible', ['9ddd5434a0df49c495d9db59923a80f13f79e47cc3b2eb2eeef5505ab88f5156', 'e11882dbb7a0ca28f21c038aaf813420210629a55bdd2042e1956b91f68d89a8', 'f9d0cd322580c5f5d149ff739c5c651b021b4a2fa823520d6a9ff46e13846341', '19a924672538e605f6eeb400ff0842fb0a688d8c32817bbf31507e72f8016a9d'].includes(hash('assets/js/print-engine.js')));
check('consultation records remain unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.1 QA: ${passed}/${passed} passed`);
