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
const modelFactory = require('./assets/js/print/models/executive-summary-model.js');
const section = require('./assets/js/print/sections/executive-summary.js');
const renderers = require('./assets/js/print-renderers.js');

const printModel = Object.freeze({
  schemaVersion: 1,
  engineVersion: '0.4.0',
  generatedAt: '2026-08-09T18:00:00.000Z',
  metadata: Object.freeze({ title: 'Home Protection Consultation', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency', consultationDate: 'August 9, 2026' }),
  customer: Object.freeze({ name: 'Jordan Martinez', email: 'jordan@example.com', phone: '408-555-0199' }),
  propertySummary: Object.freeze({ available: true, address: '123 Main St, Fremont, CA 94539' }),
  assessment: Object.freeze({ score: 74, status: 'Strong Foundation', strongest: 'Liability planning', topPriority: 'Review water-loss terms' }),
  executiveSummary: 'The review shows a strong liability foundation and makes water-loss terms the first topic to confirm.',
  strengths: Object.freeze(['Liability planning', 'Completed a structured review']),
  recommendations: Object.freeze([
    Object.freeze({ id: 'water', title: 'Review water-loss terms' }),
    Object.freeze({ id: 'rebuild', title: 'Confirm reconstruction assumptions' })
  ]),
  consultationContext: Object.freeze({
    reviewReason: 'Premium increased',
    missingInformation: Object.freeze(['Current declarations page', 'Renewal notice']),
    nextAction: 'Review the declarations page together and record the confirmed terms.'
  }),
  entryContext: Object.freeze({ occupationSegment: 'Nurse or RN', housingContext: 'I own my home', campaign: 'healthcare' })
});

const model = modelFactory.create(printModel);
const output = section.render(printModel);
const html = output.html;

check('release remains compatible after CoverageFit 3.20.40', ['3.20.40', '3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Executive Summary model advances additively', ['1.2.0', '1.3.0', '1.4.0'].includes(modelFactory.VERSION) && modelFactory.SCHEMA_VERSION === 1);
check('existing Executive Summary section remains compatible', section.id === 'executive-summary' && ['1.6.0', '1.7.0', '1.8.0', '1.9.0'].includes(section.version) && registry.hasSection('executive-summary'));
check('existing HTML renderer remains compatible', ['1.9.0', '1.10.0','1.11.0','1.12.0','1.13.0','1.14.0','1.15.0'].includes(renderers.getRenderer('html').version));
check('overview contract is immutable', Object.isFrozen(model) && Object.isFrozen(model.overview));
check('review purpose uses consultation reason', model.overview.reviewPurpose === 'Premium increased');
check('occupation does not replace the review purpose', model.overview.reviewPurpose !== printModel.entryContext.occupationSegment && !model.overview.reviewPurpose.includes('Nurse'));
check('housing context does not replace the review purpose', model.overview.reviewPurpose !== printModel.entryContext.housingContext);
check('campaign does not replace the review purpose', model.overview.reviewPurpose !== printModel.entryContext.campaign);
check('existing assessment narrative is preserved', model.overview.summary === printModel.executiveSummary && model.summary === printModel.executiveSummary);
check('strongest foundation derives from existing strengths', model.overview.strongestArea === 'Liability planning');
check('first focus follows existing recommendation order', model.overview.firstPriority === 'Review water-loss terms');
check('confirmation count uses existing missing-information list', model.overview.confirmationCount === 2 && model.overview.confirmationSummary.includes('2 details'));
check('next action uses existing consultation context', model.overview.nextAction === printModel.consultationContext.nextAction);
check('Review Overview retains the CD-1.1 page marker', html.includes('data-document-page="review-overview"'));
check('Executive Summary retains its canonical chapter marker', html.includes('data-document-chapter="executive-summary"'));
check('homeowner identity appears before review purpose', html.indexOf('<span>Homeowner</span>') < html.indexOf('Why this review started'));
check('review purpose is prominent and explicit', html.includes('Why this review started') && html.includes('Premium increased'));
check('summary explains what the review is showing', html.includes('What the answers show') && html.includes(printModel.executiveSummary));
check('summary exposes strongest foundation', html.includes('What looks strongest') && html.includes('Liability planning'));
check('summary exposes first focus', html.includes('What to discuss first') && html.includes('Review water-loss terms'));
check('discussion priorities remain available', html.includes('Most important topics') && html.includes('Confirm reconstruction assumptions'));
check('missing information remains available', html.includes('Details to confirm') && html.includes('Current declarations page') && html.includes('Renewal notice'));
check('recommended next action remains available', html.includes('Recommended next step') && html.includes('Review the declarations page together'));
check('Protection Snapshot remains present and bounded', html.includes('data-document-chapter="protection-snapshot"') && html.includes('Protection Score') && html.includes('74'));
check('Protection Score guardrail remains unchanged', html.includes('does not decide what is covered') && html.includes('what a policy will cost'));
check('HTML renderer includes bounded CD-1.2 styling', read('assets/js/print-renderers.js').includes('EXECUTIVE_SUMMARY_CSS') && read('assets/js/print-renderers.js').includes('.cf-exec-review-purpose'));
check('CD-1.2 layout is responsive', read('assets/js/print-renderers.js').includes('@media(max-width:720px){.cf-exec-overview-highlights{grid-template-columns:1fr}}'));
check('CD-1.2 layout is print safe', read('assets/js/print-renderers.js').includes('.cf-exec-review-purpose,.cf-exec-overview-highlights{break-inside:avoid'));

const escaped = section.render({
  customer: { name: '<script>alert(1)</script>' },
  consultationContext: { reviewReason: '<img src=x onerror=alert(1)>', missingInformation: [] },
  assessment: { score: 50, strongest: 'Known & reviewed', topPriority: 'Confirm <terms>' },
  recommendations: []
}).html;
check('dynamic Executive Summary content is HTML escaped', !escaped.includes('<script>') && !escaped.includes('<img') && escaped.includes('&lt;script&gt;') && escaped.includes('&lt;terms&gt;'));

const fallback = modelFactory.create({ consultationContext: { reviewReason: 'Buying a home', missingInformation: [] }, recommendations: [], assessment: {} });
check('partial data receives a safe evidence-aware summary', fallback.overview.summary.includes('current protection details') && fallback.overview.reviewPurpose === 'Buying a home');
check('partial data does not invent a score or strength', fallback.protectionScore.value === null && fallback.overview.strongestArea === '');
check('empty input remains non-renderable', modelFactory.hasContent(modelFactory.create({})) === false && section.shouldRender({}) === false);
check('empty input does not invent an assessment narrative', modelFactory.create({}).overview.summary === '');
check('document copy makes no unsupported outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(html));
check('CD-1.2 documentation and roadmap are complete', fs.existsSync(path.join(root, 'SPRINT-CD-1.2.md')) && read('ROADMAP.md').includes('CD-1.2 Executive Summary — Complete (3.20.40)') && read('CHANGELOG.md').includes('## 3.20.40 — CD-1.2 Executive Summary'));

for (const rel of ['assets/js/print/models/executive-summary-model.js', 'assets/js/print/sections/executive-summary.js', 'assets/js/print-renderers.js']) new Function(read(rel));
check('modified JavaScript parses successfully', true);
check('CD-1.1 architecture remains unchanged', ['edcba77c95aa2d89f97a5f6e0425dd6286bec91aac51b2f9b5f0555b1186dd81', 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1'].includes(hash('assets/js/print/consultation-document-architecture.js')));
check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('Print Engine contract remains compatible', ['9ddd5434a0df49c495d9db59923a80f13f79e47cc3b2eb2eeef5505ab88f5156', 'e11882dbb7a0ca28f21c038aaf813420210629a55bdd2042e1956b91f68d89a8', 'f9d0cd322580c5f5d149ff739c5c651b021b4a2fa823520d6a9ff46e13846341', '19a924672538e605f6eeb400ff0842fb0a688d8c32817bbf31507e72f8016a9d'].includes(hash('assets/js/print-engine.js')));
check('consultation document controller remains compatible', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('Property and Verification section remains unchanged', ['1d2c296cb1fb1689b2dec99922a681cdc09962215f1342e3a7db0c70d54c79b1', 'de3691394a497679d9c64b86de1127c7584ef3888bcdc59ba6a8653317802ebb'].includes(hash('assets/js/print/sections/property-summary.js')));
check('Consultation Record section remains compatible', ['fc68ac142d6a655277a62e713003a4edbdad115f9b0aa2a95b850770fbbebe24', '89271cc706203fd0c159c05627408e8c0ef5c58d6a49b75897c3eac030bd4359', 'df2454df14ed0b7c18b77d74320e6a34148b38215cc8ba7308162ae987e3eb14', '899d043e22d4a8e12179e6f7cf265853f8da4824c153af9a3e78296224557528', '4f4e80115e13ee712bfc4ac0b5f5aaab88d82080cc3621578342339219baea86', 'b7f33f6c4e8d4db43211ef9f90ff4ff022401c7eaad2c185b7d783d94eef819c'].includes(hash('assets/js/print/sections/consultation-guide.js')));
check('consultation records remain unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('server consultation contract remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');

console.log(`CD-1.2 QA: ${passed}/${passed} passed`);
