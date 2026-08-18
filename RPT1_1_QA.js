#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];

function check(name, pass) {
  assert(pass, name);
  checks.push(name);
}
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const version = read('VERSION').trim();
const html = read('home/report/index.html');
const css = read('assets/css/prospect-snapshot.css');
const reportEngine = read('assets/js/report-engine.js');
const snapshot = read('assets/js/interactive-snapshot.js');
const reveal = read('assets/js/snapshot-reveal.js');
const changelog = read('CHANGELOG.md');
const roadmap = read('ROADMAP.md');

check('release version remains compatible after RPT-1.1', ['3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('RPT-1.1 changelog entry exists', changelog.includes('RPT-1.1 Prospect Snapshot Composition and Print Compression'));
check('RPT-1.1 roadmap entry is complete', roadmap.includes('RPT-1.1 Prospect Snapshot Composition and Print Compression — Complete (3.19.30)'));
check('RPT-1.1 sprint document exists', fs.existsSync(path.join(root, 'SPRINT-RPT-1.1.md')));
check('RPT-1.1 print certification exists', fs.existsSync(path.join(root, 'RPT1_1_PRINT_CERTIFICATION.md')));
check('prospect report stylesheet exists', fs.existsSync(path.join(root, 'assets/css/prospect-snapshot.css')));

check('active report uses one prospect composition', html.includes('class="prospect-report"') && html.includes('prospect-report-page--overview'));
check('duplicate executive cover removed', !html.includes('cf-exec-cover') && !html.includes('CoverageFit Executive Report'));
check('duplicate executive summary removed', !html.includes('cf-exec-summary-page') && !html.includes('Executive Summary'));
check('old executive report engine removed from route', !html.includes('/assets/js/executive-report-engine.js'));
check('old executive report stylesheet removed from route', !html.includes('/assets/css/executive-report-engine.css'));
check('old reveal stylesheet removed from route', !html.includes('/assets/css/snapshot-reveal.css'));
check('old interactive snapshot stylesheet removed from route', !html.includes('/assets/css/interactive-snapshot.css'));

const pageLabels = html.match(/Page [123] of 3/g) || [];
check('exactly three deterministic page labels exist', pageLabels.length === 3 && new Set(pageLabels).size === 3);
check('exactly three report page sections exist', (html.match(/data-report-page="[123]"/g) || []).length === 3);
check('page one consolidates personalized header and overview', html.includes('data-prospect-title') && html.includes('data-cf-interactive-snapshot'));
check('page one retains positive foundation once', (html.match(/What you are already doing well/g) || []).length === 1);
check('page two retains three educational topic container', html.includes('Three focused questions for your licensed review') && html.includes('id="priorities"'));
check('page three contains one practical next-step section', (html.match(/Practical next step/g) || []).length === 1 && html.includes('id="actions"'));
check('report contains one customer conversion CTA', (html.match(/Review My Snapshot with Dylan/g) || []).length === 1);
check('report contains one booking link', (html.match(/href="\/book\//g) || []).length === 1);
check('old appended conversation transition removed', !html.includes('cf-conversation-transition'));
check('old action timeline removed from customer report', !html.includes('data-cf-action-timeline'));
check('old strengths priorities and actions report sections removed', !html.includes('report-section-strengths') && !html.includes('report-section-priorities') && !html.includes('report-section-actions'));

check('interactive overview renders score', snapshot.includes('Protection Review Readiness Score') && snapshot.includes('prospect-score__ring'));
check('interactive overview renders category breakdown', snapshot.includes('Category breakdown') && snapshot.includes('prospect-category-list'));
check('interactive overview has no customer confidence percentage', !/confidence/i.test(snapshot));
check('interactive overview has no repeated tabs', !snapshot.includes('role="tab"') && !snapshot.includes('data-snapshot-panel'));
check('interactive overview has no repeated CTA', !snapshot.includes('/book/'));

check('priority cards preserve answer explanation', reportEngine.includes('What your answers indicated') && reportEngine.includes('clientExplanation'));
check('priority cards preserve why-it-matters guidance', reportEngine.includes('Why it matters') && reportEngine.includes('whyMatters'));
check('priority cards preserve conversation question', reportEngine.includes('Question to discuss') && reportEngine.includes('conversationStarter'));
check('priority cards are limited to three', reportEngine.includes('recommendations.slice(0,3)'));
check('customer confidence labels removed from priority cards', !/confidence/.test(reportEngine));
check('practical next steps are rendered once', reportEngine.includes("const actions=[") && reportEngine.includes('Bring your current declarations page'));
check('producer print action remains reachable', html.includes('id="printReport"') && reportEngine.includes("window.print()"));

check('reveal engine personalizes existing header instead of injecting cover', reveal.includes("setText('[data-prospect-title]'" ) && !reveal.includes('injectCover'));
check('reveal engine no longer appends a second CTA', !reveal.includes('Continue to Review Together') && !reveal.includes('main.appendChild'));
check('review reason can derive from stored report', reveal.includes('report?.reviewContext') && reveal.includes('report?.consumer?.reviewContext'));

check('print declares US Letter output', css.includes('@page{size:letter'));
check('print uses three bounded page wrappers', css.includes('.prospect-report-page{display:flex;flex-direction:column') && css.includes('min-height:9.5in'));
check('print forces page breaks except after final page', css.includes('page-break-after:always') && css.includes('.prospect-report-page:last-child{break-after:auto'));
check('print preserves background colors', css.includes('print-color-adjust:exact'));
check('print hides interactive actions', css.includes('.report-header,.no-print{display:none!important}'));
check('print keeps priority cards intact', css.includes('.prospect-topic-card') && css.includes('page-break-inside:avoid'));
check('responsive layout remains present', css.includes('@media(max-width:860px)') && css.includes('@media(max-width:560px)'));
check('reduced motion behavior remains present', css.includes('@media(prefers-reduced-motion:reduce)'));

console.log(`RPT-1.1 QA: ${checks.length}/${checks.length} passed`);
