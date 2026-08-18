#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash = relative => crypto.createHash('sha256').update(read(relative)).digest('hex');
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };

const readiness = require('./assets/js/print-production-readiness.js');
const renderers = require('./assets/js/print-renderers.js');
const controller = require('./assets/js/consultation-document.js');

const model = Object.freeze({
  id: 'consultation-pc14-certification',
  generatedAt: '2026-08-09T22:00:00.000Z',
  metadata: Object.freeze({
    title: 'Home Protection Consultation', product: 'Home', consultationDate: '2026-08-09T22:00:00.000Z',
    preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency', reportId: 'PC14-CERT-001'
  }),
  customer: Object.freeze({ name: 'Print Certification Homeowner' }),
  propertySummary: Object.freeze({ address: '408 Certification Way, Fremont, CA 94539' })
});
const fakeComposer = Object.freeze({ compose() { return Object.freeze({
  sections: Object.freeze([Object.freeze({ id: 'certification-fixture', definition: Object.freeze({ render() { return Object.freeze({ id: 'certification-fixture', html: '<section class="cf-print-section"><h1>Production print fixture</h1><p>Representative consultation content.</p></section>' }); } }) })]),
  hiddenSections: Object.freeze([]), diagnostics: Object.freeze({ valid: true })
}); } });
const output = renderers.getRenderer('html').render(model, { documentComposer: fakeComposer });
const certificate = readiness.certify(output, { canPrint: true });

check('release remains compatible after CoverageFit 3.20.50', ['3.20.50', '3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('one centrally versioned print readiness service is exposed', readiness.VERSION === '1.0.0' && readiness.PROFILE_VERSION === 'PC-1.4');
check('production profile is deeply immutable', Object.isFrozen(readiness.getProfile()) && Object.isFrozen(readiness.getProfile().setupSteps));
check('production profile specifies Letter portrait dimensions', readiness.getProfile().paper === 'US Letter' && readiness.getProfile().orientation === 'Portrait' && readiness.getProfile().pageWidth === '8.5in' && readiness.getProfile().pageHeight === '11in');
check('print setup explicitly covers scale, backgrounds, browser chrome, and preview', ['100%', 'background', 'headers and footers', 'every page'].every(term => readiness.SETUP_STEPS.join(' ').includes(term)));

check('representative document renderer remains valid', output.diagnostics.valid === true && output.diagnostics.reportShellValid === true);
check('representative report shell is complete and certified', output.diagnostics.reportShellCertified === true && output.diagnostics.reportShellWarnings.length === 0);
check('production output declares zero-margin US Letter paged media', output.html.includes('@page{size:letter;margin:0}') && output.html.includes('width:8.5in') && output.html.includes('min-height:11in'));
check('production output preserves print colors', output.html.includes('-webkit-print-color-adjust:exact') && output.html.includes('print-color-adjust:exact'));
check('production output protects headings and readable text splits', output.html.includes('h1,h2,h3{break-after:avoid-page;page-break-after:avoid}') && output.html.includes('p,li,dd{orphans:3;widows:3}'));
check('production output prevents an intentional blank trailing page', output.html.includes('.cf-report-body>.cf-print-section:last-child{break-after:auto;page-break-after:auto}'));
check('production output retains running header, footer, and page counters', output.html.includes('data-print-shell="header"') && output.html.includes('data-print-shell="footer"') && output.html.includes('counter(page)') && output.html.includes('counter(pages)'));
check('production output keeps overflowing content visible for pagination', output.html.includes('.cf-report-cover,.cf-report-body,.cf-print-section{overflow:visible}'));

check('representative output passes every production readiness check', certificate.ready === true && certificate.state === 'ready' && certificate.checks.every(item => item.pass));
check('certificate is deeply immutable', Object.isFrozen(certificate) && Object.isFrozen(certificate.checks) && certificate.checks.every(Object.isFrozen));
check('certificate carries safe print settings', certificate.paper === 'US Letter' && certificate.orientation === 'Portrait' && certificate.scale.includes('100%') && certificate.backgroundGraphics === 'On' && certificate.browserHeadersAndFooters === 'Off');
check('suggested file name contains no homeowner identity or address', certificate.fileName === 'CoverageFit-Consultation-2026-08-09.pdf' && !/Homeowner|Certification Way/i.test(certificate.fileName));
check('missing browser print service blocks printing', readiness.certify(output, { canPrint: false }).blockers.includes('Browser print service'));
check('missing page profile blocks printing', readiness.certify({ ...output, html: output.html.replace('@page{size:letter;margin:0}', '') }, { canPrint: true }).blockers.includes('US Letter page profile'));
check('invalid renderer diagnostics block printing', readiness.certify({ ...output, diagnostics: { ...output.diagnostics, valid: false } }, { canPrint: true }).blockers.includes('Print renderer diagnostics'));
check('missing optional shell certification is a warning, not an invented blocker', readiness.certify({ ...output, diagnostics: { ...output.diagnostics, reportShellCertified: false } }, { canPrint: true }).warnings.length === 1);

check('Consultation Document controller advances additively', controller.VERSION === '1.8.0' && typeof controller.certifyOutput === 'function' && typeof controller.togglePrintSetup === 'function');
check('controller accepts a valid output and browser print target', controller.certifyOutput(output, { print() {} }).ready === true);
check('controller blocks an unavailable print target', controller.certifyOutput(output, {}).ready === false);
check('controller exposes the current certification without creating persistence', typeof controller.getCurrentCertification === 'function' && !/localStorage|sessionStorage|\bfetch\b/.test(read('assets/js/print-production-readiness.js')));

const route = read('agent/consultation/index.html');
const routeCss = read('agent/consultation/consultation.css');
const rendererSource = read('assets/js/print-renderers.js');
check('document route loads readiness after the Print Engine and before the controller', route.indexOf('/assets/js/print-engine.js') < route.indexOf('/assets/js/print-production-readiness.js') && route.indexOf('/assets/js/print-production-readiness.js') < route.indexOf('/assets/js/consultation-document.js'));
check('producer sees one output status and one print setup control', (route.match(/id="printProductionStatus"/g) || []).length === 1 && (route.match(/id="printSetupToggle"/g) || []).length === 1);
check('print setup gives the production dialog settings', ['US Letter', 'portrait orientation', 'Default or 100%', 'background graphics on', 'headers and footers off', 'Review every page'].every(term => route.toLowerCase().includes(term.toLowerCase())));
check('print setup preserves the consultation-document guardrail', ['not an issued policy', 'formal insurance quote', 'underwriting decision', 'coverage determination'].every(term => route.includes(term)));
check('setup UI is responsive and excluded from outer-page printing', routeCss.includes('@media (max-width: 560px)') && routeCss.includes('.document-print-setup { display: none !important; }'));
check('readiness state has distinct ready and blocked presentation', routeCss.includes('[data-state="ready"]') && routeCss.includes('[data-state="blocked"]'));
check('existing HTML renderer advances in place', renderers.getRenderer('html').version === '1.15.0' && rendererSource.includes('PRODUCTION_PRINT_CSS'));

check('PC-1.4 documentation and certification record exist', fs.existsSync(path.join(root, 'SPRINT-PC-1.4.md')) && fs.existsSync(path.join(root, 'PC1_4_PRINT_PDF_CERTIFICATION.md')));
check('roadmap and changelog complete PC-1.4', read('ROADMAP.md').includes('PC-1.4 Print/PDF Production Certification — Complete (3.20.50)') && read('CHANGELOG.md').includes('## 3.20.50 — PC-1.4 Print/PDF Production Certification'));
check('PC-1.4 preserves its bounded handoff and PC-1.5 is now complete', read('ROADMAP.md').includes('[x] PC-1.5') && read('SPRINT-PC-1.4.md').includes('PC-1.5 Live Producer Pilot Readiness remains deferred'));

for (const relative of ['assets/js/print-production-readiness.js', 'assets/js/consultation-document.js', 'assets/js/print-renderers.js']) new Function(read(relative));
check('new and modified JavaScript parses successfully', true);
check('assessment and Protection Score remain unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3' && hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('FLOW intake advances only for HOME-2.1 semantics while RC-SMS handoff remains unchanged', hash('assets/js/prefill-intake.js') === '9cca4d8bbd6d2ba6b7f72aaf569dc252762c41d6e8857111a3d7f03f5a351f48' && hash('assets/js/sms-handoff-resolver.js') === 'defea794444f829cac4f267feab32ab43ba16eefe3a25d92ca13fa01595bc262');
check('authoritative recommendation order and shared story remain unchanged', hash('assets/js/print/models/recommendation-model.js') === '605b9a189657b38a7f32a5852a7bd15366e206df592d1cd0401853223ab18c44' && hash('assets/js/producer-consumer-story.js') === '875b5e7ff003b65a8f19172410d7846e4528fd44c2473e3caede7e9af02c8eb7');
check('document information architecture remains unchanged', hash('assets/js/print/consultation-document-architecture.js') === 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1');
check('PC-1.4 makes no unsupported insurance outcome claim', !/guaranteed discount|guaranteed rate|underwriting approved|coverage approved|you qualify/i.test(`${route}\n${read('SPRINT-PC-1.4.md')}`));

console.log(JSON.stringify({ suite: 'PC-1.4 Print/PDF Production Certification', version: read('VERSION').trim(), passed: checks.length, failed: 0, checks }, null, 2));
