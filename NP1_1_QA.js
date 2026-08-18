#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

const api = require('./assets/js/post-submission-share.js');
const assessmentHtml = read('assessment/index.html');
const reportHtml = read('home/report/index.html');
const assessmentEngine = read('assets/js/assessment-engine.js');
const css = read('assets/css/post-submission-share.css');
const sprint = read('SPRINT-NP-1.1.md');
const changelog = read('CHANGELOG.md');
const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));

check('release remains compatible after NP-1.1', ['3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('share module is versioned', ['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0'].includes(api.VERSION) && ['NP-1.1','NP-1.3','NP-1.4','NP-1.5'].includes(api.BUILD));
check('canonical share destination remains an approved 408FARMERS or CoverageFit route', ['https://408farmers.com/','https://408farmers.com/neighbor/','https://coveragefit.com/home/?ref=neighbor'].includes(api.DEFAULT_SHARE_URL));
check('prefilled message matches approved copy', api.buildMessage(api.DEFAULT_SHARE_URL) === `Hey, I just used this local five-minute home coverage review. It’s personally reviewed by Dylan at the Virginia Tam Insurance Agency, not an instant quote. Sharing in case it helps: ${api.DEFAULT_SHARE_URL}`);
check('iPhone SMS fallback uses an iOS-compatible body separator', api.buildSmsHref(api.DEFAULT_SHARE_URL, 'Mozilla/5.0 (iPhone)', 5).startsWith('sms:&body='));
check('Android SMS fallback uses a query body', api.buildSmsHref(api.DEFAULT_SHARE_URL, 'Mozilla/5.0 (Linux; Android 15; Mobile)', 5).startsWith('sms:?body='));
check('mobile-device detection includes touch iPad desktop mode', api.isMobileDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5) === true);
check('desktop user agents are not forced into an SMS scheme', api.isMobileDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0) === false);

const storage = new MemoryStorage();
check('failed lead delivery cannot create a share receipt', api.markSuccessfulSubmission({ assessment: 'home', reportId: 'report_example', success: false }, { storage }) === false && storage.getItem(api.RECEIPT_KEY) === null);
check('a confirmed Formspree delivery creates a privacy-safe receipt', api.markSuccessfulSubmission({ assessment: 'home', reportId: 'report_example', submittedAt: '2026-08-06T02:00:00.000Z', formSubmissionSucceeded: true }, { storage }) === true);
const receipt = api.readReceipt({ storage });
check('receipt excludes homeowner identity and contact data', receipt.reportId === 'report_example' && !('name' in receipt) && !('email' in receipt) && !('phone' in receipt) && !('property' in receipt));
check('matching successful report is eligible within the bounded window', api.isEligible(receipt, { reportId: 'report_example', reportReady: true }, { now: new Date('2026-08-06T03:00:00.000Z') }) === true);
check('different reports cannot reuse a prior share receipt', api.isEligible(receipt, { reportId: 'report_other', reportReady: true }, { now: new Date('2026-08-06T03:00:00.000Z') }) === false);
check('unavailable reports cannot show the module', api.isEligible(receipt, { reportId: 'report_example', reportReady: false }, { now: new Date('2026-08-06T03:00:00.000Z') }) === false);
check('expired receipts cannot show the module', api.isEligible(receipt, { reportId: 'report_example', reportReady: true }, { now: new Date('2026-08-06T05:00:01.000Z') }) === false);
check('dismissal persists for the current session', api.dismiss({ storage, now: new Date('2026-08-06T03:00:00.000Z') }) === true && api.readReceipt({ storage }).dismissed === true);

check('share UI is hidden by default and bound to the canonical link', reportHtml.includes(`data-neighbor-share data-share-url="${api.DEFAULT_SHARE_URL}"`) && reportHtml.includes('aria-labelledby="neighborShareTitle" hidden'));
check('approved homeowner-facing copy is present', reportHtml.includes('Know a homeowner who may benefit from the same review?') && reportHtml.includes('Share this five-minute home coverage review with a neighbor or friend.') && reportHtml.includes('No pressure. They can decide whether they want to complete it.'));
check('required share controls are present', ['data-neighbor-text', 'data-neighbor-native-share', 'data-neighbor-copy', 'data-neighbor-dismiss'].every(token => reportHtml.includes(token)));
check('share module appears only on the completed private Home report', !assessmentHtml.includes('data-neighbor-share') && reportHtml.includes('data-neighbor-share'));
check('assessment loads receipt API before submission controller', assessmentHtml.indexOf('/assets/js/post-submission-share.js') > -1 && assessmentHtml.indexOf('/assets/js/post-submission-share.js') < assessmentHtml.indexOf('/assets/js/assessment-engine.js'));
check('report loads sharing module after private report controller', reportHtml.indexOf('/assets/js/post-submission-share.js') > reportHtml.indexOf('/assets/js/report-engine.js'));
check('submission controller requires an acknowledged delivery result', assessmentEngine.includes('formSubmissionSucceeded || remoteSubmissionResult?.ok') && assessmentEngine.includes('formSubmissionSucceeded = Boolean(formResponse?.ok)'));
check('existing redirect remains in place after receipt creation', assessmentEngine.indexOf('markSuccessfulSubmission') < assessmentEngine.indexOf('location.href = reportUrl'));
check('native share, SMS, and clipboard fallbacks are implemented', ['navigatorRef.share', 'buildSmsHref', 'navigatorRef.clipboard?.writeText', "execCommand?.('copy')"].every(token => read('assets/js/post-submission-share.js').includes(token)));
check('responsive and print-safe styles are included', css.includes('@media(max-width:560px)') && css.includes('@media print') && css.includes('.neighbor-share[hidden]'));
check('sprint documentation records the acceptance contract', sprint.includes('NP-1.1') && sprint.includes('genuinely successful submission') && sprint.includes('iPhone') && sprint.includes('Android') && sprint.includes('desktop'));
check('changelog records the NP-1.1 release', changelog.includes('## 3.20.14 — NP-1.1 Post-Submission Share Module'));

console.log(JSON.stringify({ sprint: 'NP-1.1', passed: checks.length, failed: 0, checks }, null, 2));
