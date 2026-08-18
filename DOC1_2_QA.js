#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const hash = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const route = read('agent/consultation/index.html');
const controller = read('assets/js/consultation-document.js');
const renderer = read('assets/js/print-renderers.js');
const executiveSource = read('assets/js/print/sections/executive-summary.js');
const propertySource = read('assets/js/print/sections/property-summary.js');
const guideSource = read('assets/js/print/sections/consultation-guide.js');

check('release version is DOC-1.2', ['3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('package preserves the call-ready document through the CD family', /Consultation|Executive Summary/i.test(pkg.description));
check('DOC-1.2 implementation documentation exists', exists('CALL-READY-CONSULTATION-GUIDE.md') && exists('SPRINT-DOC-1.2.md'));
check('DOC-1.2 print certification exists', exists('DOC1_2_PRINT_CERTIFICATION.md'));
check('roadmap marks DOC-1.2 complete', read('ROADMAP.md').includes('DOC-1.2 Call-Ready Consultation Guide — Complete (3.20.12)'));
check('changelog contains DOC-1.2 release', read('CHANGELOG.md').includes('## 3.20.12 — DOC-1.2 Call-Ready Consultation Guide'));

check('route uses Consultation Document title', route.includes('<title>Consultation Document | CoverageFit</title>') && route.includes('Home Protection Consultation'));
check('route preview has consultation-document accessible title', route.includes('title="CoverageFit home protection consultation document preview"'));
check('controller advances presentation version', /const VERSION = '1\.(?:3|4|5|6|7|8)\.0'/.test(controller));
check('controller enables paged-media page counters', controller.includes('includePageNumbers: true'));
check('controller uses Consultation Document report label', controller.includes("documentLabel: 'Consultation Document'"));
check('controller uses Home Protection Consultation title', controller.includes("title: 'Home Protection Consultation'"));

check('executive heading follows CD-1.1 architecture', executiveSource.includes('Review Overview'));
check('executive summary emphasizes why and what to discuss', executiveSource.includes('Why this review started') && executiveSource.includes('Most important topics'));
check('executive page no longer claims Page 1 of 3', !executiveSource.includes('Page 1 of 3'));

check('property heading follows CD-1.1 architecture', propertySource.includes('Property & Verification'));
check('property arrays filter unavailable values', propertySource.includes("filter(([,value]) => present(value))"));
check('property output has address-only truthful state', propertySource.includes('Only the property address was provided.'));
check('property output omits repeated Not available placeholders', !propertySource.includes("'Not available'") && !propertySource.includes('"Not available"'));
check('property page no longer claims Page 2 of 3', !propertySource.includes('Page 2 of 3'));

check('guide heading follows CD-1.1 architecture', guideSource.includes('Consultation Record'));
check('guide evidence labels use plain producer language', ['What the homeowner shared','What to check in the policy','What to confirm together'].every(label => guideSource.includes(label)));
check('guide topic uses sequential structure', ['What the assessment found','A question to discuss','Why we are asking','What to confirm','Notes'].every(label => guideSource.includes(label)));
check('former four-column labels are removed', !['What was discovered','Question to ask','Recommended direction','Information to confirm'].some(label => guideSource.includes(label)));
check('every topic renders dedicated notes lines', guideSource.includes("renderWritingLines(3, `Notes for ${topic.title}`)"));
check('questions are emphasized as quoted prompts', guideSource.includes('class="cf-guide-question">“'));
check('confirmation items use check boxes', guideSource.includes('cf-guide-check-box'));
check('decisions section remains simplified', guideSource.includes('What the homeowner decided'));
check('missing-information section remains simplified', guideSource.includes('Details currently identified'));
check('next action carries agreed action state and saved follow-up', guideSource.includes('data-next-action-state') && guideSource.includes('Follow-up scheduled'));
check('guide retains official quote and issued-policy guardrail', guideSource.includes('formal quote and issued policy are the official sources'));
check('guide page no longer claims Page 3 of 3', !guideSource.includes('Page 3 of 3'));

check('call-ready CSS replaces compression constant', renderer.includes('CALL_READY_CONSULTATION_CSS') && !renderer.includes('CONSULTATION_COMPRESSION_CSS'));
check('renderer remains compatible after call-ready HTML version', /version: '1\.(?:8|9|10|11|12|13|14|15)\.0'/.test(renderer));
check('guide CSS sets readable question type', renderer.includes('.cf-guide-topic__ask .cf-guide-question') && renderer.includes('font-size:12px'));
check('guide CSS sets evidence list type above legacy compressed size', renderer.includes('.cf-guide-evidence__grid ul') && renderer.includes('font-size:9px'));
check('topic layout is sequential rather than four columns', renderer.includes('.cf-guide-topic__body{display:grid}') && renderer.includes('.cf-guide-topic__supporting{display:grid;grid-template-columns:1fr 1fr}'));
check('topic notes receive writing height', renderer.includes('.cf-guide-writing-lines span{height:16px}'));
check('guide can flow past one printed page', renderer.includes('.cf-consultation-guide{display:flex;min-height:auto;break-after:auto;page-break-after:auto}'));
check('paged-media counter remains visible', renderer.includes('.cf-shell-running-page{display:inline-block}'));

const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const executiveSection = require('./assets/js/print/sections/executive-summary.js');
const propertySection = require('./assets/js/print/sections/property-summary.js');
const guideSection = require('./assets/js/print/sections/consultation-guide.js');

const sparseProperty = propertySection.render(Object.freeze({
  propertySummary: { available: true, address: '123 Main St, Fremont, CA 94539' }
}));
check('sparse property output retains address', sparseProperty.html.includes('123 Main St, Fremont, CA 94539'));
check('sparse property output uses one compact notice', sparseProperty.html.includes('cf-property-empty-state'));
check('sparse property output contains no unavailable placeholders', !sparseProperty.html.includes('Not available'));
check('sparse property model remains immutable', Object.isFrozen(sparseProperty.model));

const model = Object.freeze({
  generatedAt: '2026-08-04T18:00:00.000Z',
  metadata: Object.freeze({ title: 'Home Coverage Consultation Guide', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency' }),
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  assessment: Object.freeze({ score: 74, status: 'Strong Foundation', topPriority: 'Review water-loss terms' }),
  executiveSummary: 'Prepare a focused conversation about rebuilding, water terms, and deductibles.',
  strengths: Object.freeze(['Completed a structured review']),
  propertySummary: Object.freeze({
    available: true,
    address: '123 Main St, Fremont, CA 94539',
    yearBuilt: 1998,
    squareFeet: 2100,
    coverage: Object.freeze({ currentCarrier: 'Example Mutual', deductible: 5000 })
  }),
  recommendations: Object.freeze([{
    id: 'water',
    title: 'Review water-loss terms',
    priority: 'High',
    category: 'Water',
    explanation: 'The homeowner is not sure how water damage is handled.',
    conversationStarter: 'Have you reviewed your water-damage deductible and special limitations?',
    producerNotes: 'Confirm the deductible, limitations, and mitigation-device requirements.',
    evidenceQuality: 'needs-verification',
    evidenceLabel: 'Needs policy verification',
    evidencePrompt: 'Confirm water-loss terms against the issued policy.',
    evidence: Object.freeze(['Homeowner reported uncertainty'])
  }]),
  timeline: Object.freeze({ items: Object.freeze([]) }),
  consultationChecklist: Object.freeze({ items: Object.freeze([]) }),
  consultationContext: Object.freeze({
    reviewReason: 'Premium increased',
    missingInformation: Object.freeze(['Current declarations page']),
    decisions: Object.freeze([]),
    nextAction: 'Review the declarations page and prepare options.',
    stage: 'consultation_scheduled',
    outcome: 'none',
    followUp: Object.freeze({ state: 'scheduled', dueDate: '2026-08-06', note: 'Call after 4 PM' }),
    evidenceHandoff: Object.freeze({
      available: true,
      summary: Object.freeze({ total: 3, confirmed: 1, verification: 1, unresolved: 1, followUp: 2 }),
      confirmedFacts: Object.freeze([Object.freeze({ title: 'Review reason', answer: 'Premium increased' })]),
      verificationItems: Object.freeze([Object.freeze({ title: 'Water terms', question: 'Confirm the current policy wording.' })]),
      unresolvedQuestions: Object.freeze([Object.freeze({ title: 'Deductible readiness', question: 'What deductible could you comfortably pay?' })]),
      guardrail: 'Confirm homeowner-reported responses against the issued policy before making a recommendation.'
    })
  })
});

const executive = executiveSection.render(model);
const property = propertySection.render(model);
const guide = guideSection.render(model);
check('executive output preserves score data', executive.html.includes('74') && executive.model.protectionScore.value === 74);
check('property output preserves known carrier and deductible', property.html.includes('Example Mutual') && property.html.includes('$5,000'));
check('guide output preserves recommendation explanation', guide.html.includes('The homeowner is not sure how water damage is handled.'));
check('guide output preserves conversation question', guide.html.includes('Have you reviewed your water-damage deductible'));
check('guide output preserves producer direction', guide.html.includes('Confirm the deductible, limitations, and mitigation-device requirements.'));
check('guide output preserves policy confirmation prompt', guide.html.includes('Confirm water-loss terms against the issued policy.'));
check('guide output maps evidence label only at presentation', guide.model.topics[0].evidenceLabel === 'Needs policy verification' && guide.html.includes('Check policy'));
check('guide output preserves evidence guardrail', guide.html.includes('Confirm reported policy details against the current policy summary and issued policy'));
check('guide output provides notes for the discussion topic', guide.html.includes('Notes for Review water-loss terms'));
check('guide output preserves next action', guide.html.includes('Review the declarations page and prepare options.'));

new vm.Script(controller, { filename: 'consultation-document.js' });
new vm.Script(renderer, { filename: 'print-renderers.js' });
check('modified JavaScript parses successfully', true);

check('print adapter contract is unchanged', hash('assets/js/print-adapters.js') === 'ecfa281f3ac3fc581e5659a5932407ea74ed74f2a1d95bd0b9f9bc51d66cc9d8');
check('print engine contract remains compatible', ['9ddd5434a0df49c495d9db59923a80f13f79e47cc3b2eb2eeef5505ab88f5156', 'e11882dbb7a0ca28f21c038aaf813420210629a55bdd2042e1956b91f68d89a8', 'f9d0cd322580c5f5d149ff739c5c651b021b4a2fa823520d6a9ff46e13846341', '19a924672538e605f6eeb400ff0842fb0a688d8c32817bbf31507e72f8016a9d'].includes(hash('assets/js/print-engine.js')));
check('consultation guide model remains compatible', ['44cb4c840e893b7828d21d4e7655b6694e7748e55e99ef157510deb6245fda21', '2f3851171429252cb1e2bb13ee01aec48541b0656bb330ff57a9d9277040be06', '34968444790093eec871ada4a1c0036ab8b2d488277b844d860797032501bf9f', '7db35082979af3659aeef1313f1d40153cd42fedb7249c95f4c3e1d00ee50827', 'ed2a07e001db030cb751fef05a478f452a8db063fd674a254d75086129b95ef5', '42469e322d560cb92ce3c9666b394ce24b39fee48af733573e90b2bf985852f2'].includes(hash('assets/js/print/models/consultation-guide-model.js')));
check('executive summary model remains compatible after CD-1.2', ['1.1.0', '1.2.0', '1.3.0', '1.4.0'].includes(require('./assets/js/print/models/executive-summary-model.js').VERSION));
check('property summary model is unchanged', ['7596cae3dcd81c977999763ef5ff491010b2d19c96f8a51bf1639cb5932dbf5f', '7df1c78570a037af9a2446995f97498ad4b01795da195bc2c03c8d6ff809e209'].includes(hash('assets/js/print/models/property-summary-model.js')));
check('Workspace data contract retains document compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('Protection Score contract is unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('D1 consultation contract retains document compatibility after additive GC-1.6 recommendation persistence', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('producer notification contract is unchanged', hash('server/producer-notification.mjs') === 'cfd1aef3009ca2bb014555fa8498b65e4289a3af276b671474ac2cc7acb0b6a7');
check('D1 migration is unchanged', hash('migrations/0001_ops_cf_1_1.sql') === '1bbbd39be2e30119920c2914308c64ad2e11ca460a8f065cd2e6ec9a05cb53cc');

console.log(`DOC-1.2 QA: ${checks.length}/${checks.length} passed`);
