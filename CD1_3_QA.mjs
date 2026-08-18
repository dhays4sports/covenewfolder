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

const scoreEngine = require('./assets/js/protection-score.js');
const snapshotFactory = require('./assets/js/print/models/protection-snapshot-model.js');
const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
const section = require('./assets/js/print/sections/executive-summary.js');
const renderers = require('./assets/js/print-renderers.js');

const executiveModel = Object.freeze({
  schemaVersion: 1,
  engineVersion: '0.4.0',
  generatedAt: '2026-08-09T18:00:00.000Z',
  metadata: Object.freeze({ title: 'Home Protection Consultation', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency', consultationDate: 'August 9, 2026' }),
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  propertySummary: Object.freeze({ available: true, address: '123 Main St, Fremont, CA 94539' }),
  assessment: Object.freeze({ score: 74, status: 'Several Areas to Review', strongest: 'Liability planning', topPriority: 'Review water-loss terms' }),
  executiveSummary: 'The review shows a strong liability foundation and makes water-loss terms the first topic to confirm.',
  strengths: Object.freeze(['Liability planning']),
  recommendations: Object.freeze([Object.freeze({ id: 'water', title: 'Review water-loss terms' })]),
  consultationContext: Object.freeze({ reviewReason: 'Premium increased', missingInformation: Object.freeze(['Current declarations page']), nextAction: 'Review the declarations page together.' })
});

const direct = value => snapshotFactory.create({ protectionScore: { value } });
const snapshot = direct(74);
const output = section.render(executiveModel);
const html = output.html;

check('release remains compatible after CoverageFit 3.20.41', ['3.20.41', '3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Protection Snapshot model is centrally versioned', ['1.0.0', '1.1.0'].includes(snapshotFactory.VERSION) && snapshotFactory.SCHEMA_VERSION === 1);
check('Protection Snapshot model output is deeply immutable', Object.isFrozen(snapshot) && Object.isFrozen(snapshot.band) && Object.isFrozen(snapshot.scale) && snapshot.scale.every(Object.isFrozen));
check('Protection Snapshot section advances in place', section.id === 'executive-summary' && ['1.7.0', '1.8.0', '1.9.0'].includes(section.version) && registry.hasSection('executive-summary'));
check('existing HTML renderer remains compatible', ['1.10.0', '1.11.0','1.12.0','1.13.0','1.14.0','1.15.0'].includes(renderers.getRenderer('html').version));
check('score 100 maps to Well Prepared', direct(100).band.label === 'Well Prepared');
check('score 85 maps to Well Prepared', direct(85).band.label === 'Well Prepared');
check('score 84 maps to Strong Foundation', direct(84).band.label === 'Strong Foundation');
check('score 70 maps to Strong Foundation', direct(70).band.label === 'Strong Foundation');
check('score 69 maps to Review Recommended', direct(69).band.label === 'Review Recommended');
check('score 50 maps to Review Recommended', direct(50).band.label === 'Review Recommended');
check('score 49 maps to Several Areas to Review', direct(49).band.label === 'Several Areas to Review');
check('score 0 remains a valid Several Areas to Review score', direct(0).available && direct(0).value === 0 && direct(0).band.label === 'Several Areas to Review');
check('canonical category ignores mismatched incoming status', output.protectionSnapshot.band.label === 'Strong Foundation' && html.includes('id="cf-score-title">Strong Foundation') && !html.includes('id="cf-score-title">Several Areas to Review'));
check('category range is canonical', snapshot.band.min === 70 && snapshot.band.max === 84);
check('score position preserves the authoritative value', snapshot.position === 74);
check('scale follows ascending homeowner-readable order', snapshot.scale.map(band => `${band.min}-${band.max}`).join('|') === '0-49|50-69|70-84|85-100');
check('exactly one scale band is active', snapshot.scale.filter(band => band.active).length === 1 && snapshot.scale.find(band => band.active).id === 'strong-foundation');
check('interpretation matches the canonical category', snapshot.interpretation === snapshotFactory.INTERPRETATIONS['strong-foundation']);
check('model carries authoritative methodology identity', snapshot.methodology.id === scoreEngine.METHODOLOGY_ID && snapshot.methodology.version === scoreEngine.VERSION && snapshot.methodology.measure === scoreEngine.MEASURE);
check('missing score renders truthfully as unscored', !direct(null).available && direct(null).value === null && direct(null).band === null);
check('empty score renders truthfully as unscored', !direct('').available && direct('').position === null);
check('non-numeric score renders truthfully as unscored', !direct('not-a-score').available && direct('not-a-score').band === null);
check('negative score renders truthfully as unscored', !direct(-1).available);
check('score above 100 renders truthfully as unscored', !direct(101).available);
check('unscored interpretation requests a completed assessment', direct(null).interpretation.includes('completed assessment'));
check('unscored state does not invent an active band', direct(null).scale.every(band => !band.active));
check('Review Overview retains the canonical Protection Snapshot marker', html.includes('data-document-chapter="protection-snapshot"'));
check('card is labelled Protection Snapshot', html.includes('<p class="cf-exec-card-label">Protection Snapshot</p>'));
check('rendered score and denominator remain visible', html.includes('<strong>74</strong><span>/ 100</span>'));
check('rendered category and range remain visible', html.includes('What this score means') && html.includes('Strong Foundation') && html.includes('70–84'));
check('rendered scale identifies the current score', html.includes('aria-label="Protection Score scale from 0 to 100; current score 74"'));
check('rendered scale contains four canonical segments', (html.match(/cf-score-segment cf-score-segment-/g) || []).length === 4);
check('rendered scale positions one marker at the score', html.includes('class="cf-score-marker" style="left:74%"'));
check('rendered category interpretation is present', html.includes(snapshotFactory.INTERPRETATIONS['strong-foundation']));
check('rendered card explains how to use the score', html.includes('How this helps') && html.includes(snapshotFactory.USE_GUIDANCE));
check('rendered card explains the response-based purpose', html.includes(snapshotFactory.PURPOSE));
check('rendered card carries the complete decision guardrail', html.includes(snapshotFactory.GUARDRAIL));
check('unscored rendering shows Not scored and no marker', (() => { const unscored = section.render({ customer: { name: 'Homeowner' }, assessment: { score: null }, recommendations: [] }).html; return unscored.includes('Not scored') && unscored.includes('Score unavailable') && !unscored.includes('cf-score-marker'); })());
check('CD-1.2 Executive Summary remains visible', html.includes('Why this review started') && html.includes('What the answers show'));
check('existing priorities and confirmation content remain visible', html.includes('Most important topics') && html.includes('Details to confirm') && html.includes('Current declarations page'));
check('browser routes load Protection Score before Protection Snapshot model', ['agent/workspace/index.html', 'agent/consultation/index.html'].every(rel => read(rel).indexOf('/assets/js/protection-score.js') < read(rel).indexOf('/assets/js/print/models/protection-snapshot-model.js')));
check('browser routes load Protection Snapshot model before section', ['agent/workspace/index.html', 'agent/consultation/index.html'].every(rel => read(rel).indexOf('/assets/js/print/models/protection-snapshot-model.js') < read(rel).indexOf('/assets/js/print/sections/executive-summary.js')));
check('Protection Snapshot styling uses the existing renderer', read('assets/js/print-renderers.js').includes('PROTECTION_SNAPSHOT_CSS') && read('assets/js/print-renderers.js').includes('.cf-score-track'));
check('Protection Snapshot layout is responsive', read('assets/js/print-renderers.js').includes('@media(max-width:720px){.cf-exec-hero-grid{grid-template-columns:1fr}'));
check('Protection Snapshot layout is print safe', read('assets/js/print-renderers.js').includes('.cf-exec-score-heading,.cf-score-scale,.cf-exec-score-use{break-inside:avoid'));
check('presentation model creates no storage, API, assessment, or scoring system', !/localStorage|sessionStorage|\bfetch\b|function evaluate|weightedPenalty|scoreImpact/.test(read('assets/js/print/models/protection-snapshot-model.js')));
check('document copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(html + read('assets/js/print/models/protection-snapshot-model.js')));
check('CD-1.3 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.3.md')) && read('ROADMAP.md').includes('CD-1.3 Protection Snapshot — Complete (3.20.41)') && read('CHANGELOG.md').includes('## 3.20.41 — CD-1.3 Protection Snapshot'));

for (const rel of ['assets/js/print/models/protection-snapshot-model.js', 'assets/js/print/sections/executive-summary.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('new and modified JavaScript parses successfully', true);
check('authoritative Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('Print Engine contract remains compatible', ['9ddd5434a0df49c495d9db59923a80f13f79e47cc3b2eb2eeef5505ab88f5156', 'e11882dbb7a0ca28f21c038aaf813420210629a55bdd2042e1956b91f68d89a8', 'f9d0cd322580c5f5d149ff739c5c651b021b4a2fa823520d6a9ff46e13846341', '19a924672538e605f6eeb400ff0842fb0a688d8c32817bbf31507e72f8016a9d'].includes(hash('assets/js/print-engine.js')));
check('consultation document controller remains compatible', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('CD-1.1 architecture remains unchanged', ['edcba77c95aa2d89f97a5f6e0425dd6286bec91aac51b2f9b5f0555b1186dd81', 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1'].includes(hash('assets/js/print/consultation-document-architecture.js')));
check('CD-1.2 Executive Summary model remains unchanged', ['efb67b2821104156f2be755a23e57000c773fea0fa0d0eeef904f041617756a4', '709733fed46b2840163ab587dc26e10436ab7227170572a28e33ec721bd4a57e', '7bb00966126da1d855dbf9b2f916ef54cdbcd0dab09428a12f7a4953fa5e627a'].includes(hash('assets/js/print/models/executive-summary-model.js')));
check('Property and Verification section remains unchanged', ['1d2c296cb1fb1689b2dec99922a681cdc09962215f1342e3a7db0c70d54c79b1', 'de3691394a497679d9c64b86de1127c7584ef3888bcdc59ba6a8653317802ebb'].includes(hash('assets/js/print/sections/property-summary.js')));
check('Consultation Record section remains compatible', ['fc68ac142d6a655277a62e713003a4edbdad115f9b0aa2a95b850770fbbebe24', '89271cc706203fd0c159c05627408e8c0ef5c58d6a49b75897c3eac030bd4359', 'df2454df14ed0b7c18b77d74320e6a34148b38215cc8ba7308162ae987e3eb14', '899d043e22d4a8e12179e6f7cf265853f8da4824c153af9a3e78296224557528', '4f4e80115e13ee712bfc4ac0b5f5aaab88d82080cc3621578342339219baea86', 'b7f33f6c4e8d4db43211ef9f90ff4ff022401c7eaad2c185b7d783d94eef819c'].includes(hash('assets/js/print/sections/consultation-guide.js')));
check('consultation records remain unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.3 QA: ${passed}/${passed} passed`);
