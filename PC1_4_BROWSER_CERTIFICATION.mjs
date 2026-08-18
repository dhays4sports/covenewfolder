#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const renderers = require('./assets/js/print-renderers.js');
const readiness = require('./assets/js/print-production-readiness.js');
const outputDirectory = path.resolve(process.argv[2] || path.join(root, '.pc1-4-certification'));
fs.mkdirSync(outputDirectory, { recursive: true });

const model = Object.freeze({
  id: 'consultation-pc14-browser-fixture',
  generatedAt: '2026-08-09T22:30:00.000Z',
  metadata: Object.freeze({ title: 'Home Protection Consultation', product: 'Home', consultationDate: '2026-08-09T22:30:00.000Z', preparedBy: 'Dylan Haysbert', agency: 'Virginia Tam Insurance Agency', reportId: 'PC14-BROWSER-CERT-001' }),
  customer: Object.freeze({ name: 'Synthetic Certification Homeowner' }),
  propertySummary: Object.freeze({ address: '408 Certification Way, Fremont, CA 94539' })
});

const lorem = 'This synthetic paragraph verifies readable consultation content, predictable page flow, and homeowner-friendly language without using production homeowner information.';
function repeatedCards(prefix, count) {
  return Array.from({ length: count }, (_, index) => `<article class="cf-guide-topic"><div class="cf-guide-topic__header"><span class="cf-guide-topic__number">${index + 1}</span><div><p>Certification item</p><h2>${prefix} ${index + 1}</h2></div></div><div class="cf-guide-topic__body"><section class="cf-guide-topic__known"><span>What the review shows</span><p>${lorem}</p></section><section class="cf-guide-topic__guidance"><span>Confirm before advising</span><p>${lorem}</p></section></div></article>`).join('');
}

const sections = Object.freeze([
  Object.freeze({ id: 'executive-summary', html: `<section class="cf-executive-summary cf-print-section"><header class="cf-exec-masthead"><div><p class="cf-exec-eyebrow">Review overview</p><h1>Home Protection Consultation</h1><p class="cf-exec-client">Prepared for Synthetic Certification Homeowner</p></div><strong class="cf-exec-brand">CoverageFit</strong></header><div class="cf-exec-hero-grid"><article class="cf-exec-score-card"><span class="cf-exec-card-label">Protection Score</span><p class="cf-exec-score-value"><strong>64</strong><span>/ 100</span></p><p class="cf-exec-score-band">Review Recommended</p></article><article class="cf-exec-summary-card"><span class="cf-exec-card-label">What the answers show</span><h2>Start with the priority details</h2><p>${lorem}</p></article></div><footer class="cf-exec-footer-note"><strong>Consultation guide:</strong> verify current policy details before final advice.</footer></section>` }),
  Object.freeze({ id: 'property-summary', html: `<section class="cf-property-summary cf-print-section"><header class="cf-property-header"><div class="cf-property-heading-copy"><p class="cf-property-eyebrow">Property and verification</p><h1>Property snapshot</h1><p class="cf-property-address">408 Certification Way, Fremont, CA 94539</p></div><strong class="cf-property-brand">CoverageFit</strong></header><div class="cf-property-main-grid"><article class="cf-property-panel"><div class="cf-property-section-heading"><p>01</p><div><span>Home details</span><h2>Reported property facts</h2></div></div><dl class="cf-property-grid">${Array.from({ length: 10 }, (_, index) => `<div class="cf-property-fact"><dt>Property fact ${index + 1}</dt><dd>Synthetic value</dd></div>`).join('')}</dl></article><article class="cf-property-panel"><div class="cf-property-section-heading"><p>02</p><div><span>Current policy</span><h2>Details to confirm</h2></div></div><p>${lorem}</p><p>${lorem}</p></article></div><footer class="cf-property-footer"><p>Homeowner-reported details remain subject to confirmation.</p><p><strong>CoverageFit</strong> consultation document</p></footer></section>` }),
  Object.freeze({ id: 'consultation-guide', html: `<section class="cf-consultation-guide cf-print-section"><header class="cf-guide-header"><p>Consultation record</p><h1>Priority findings and next steps</h1><p>${lorem}</p></header><div class="cf-guide-topics">${repeatedCards('Protection discussion', 8)}</div><footer class="cf-guide-footer"><p>${lorem}</p><p>End of synthetic certification document</p></footer></section>` })
]);

const composer = Object.freeze({ compose() { return Object.freeze({ sections: Object.freeze(sections.map(section => Object.freeze({ id: section.id, definition: Object.freeze({ render() { return section; } }) }))), hiddenSections: Object.freeze([]), diagnostics: Object.freeze({ valid: true }) }); } });
const rendered = renderers.getRenderer('html').render(model, { documentComposer: composer, reportShellOptions: { includeCover: false, includePageNumbers: true } });
const certificate = readiness.certify(rendered, { canPrint: true });
if (!certificate.ready) throw new Error(`Print readiness failed: ${certificate.blockers.join(', ')}`);

const htmlPath = path.join(outputDirectory, 'pc1-4-consultation-fixture.html');
const pdfPath = path.join(outputDirectory, 'pc1-4-consultation-fixture.pdf');
fs.writeFileSync(htmlPath, rendered.html);

const executablePath = process.env.COVERAGEFIT_CHROMIUM_PATH || chromium.executablePath();
if (!fs.existsSync(executablePath)) throw new Error('Chromium executable unavailable. Set COVERAGEFIT_CHROMIUM_PATH to run the PC-1.4 browser certification fixture.');
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.setContent(rendered.html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: pdfPath, format: 'Letter', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  console.log(JSON.stringify({
    suite: 'PC-1.4 Chromium Print/PDF Certification',
    engine: `Chromium ${browser.version()}`,
    readiness: certificate.state,
    checks: certificate.checks.length,
    htmlPath,
    pdfPath
  }, null, 2));
} finally {
  await browser.close();
}
