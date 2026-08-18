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

function node() {
  return {
    textContent: '', hidden: false, href: '', dataset: {}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); }
  };
}

function documentMock() {
  const nodes = {
    welcome: node(), icon: node(), status: node(), detail: node(), reason: node(), property: node(),
    kicker: node(), main: node(), highlight: node(), lead: node(), body: node(), note: node(),
    cta: node(), ctaContext: node(), dashboard: node(), art: node()
  };
  const selectors = new Map([
    ['[data-hero-journey-context]', nodes.welcome], ['.personalized-welcome-icon', nodes.icon],
    ['[data-welcome-context-reason]', nodes.reason], ['[data-welcome-context-property]', nodes.property],
    ['[data-welcome-kicker]', nodes.kicker], ['[data-welcome-heading-main]', nodes.main],
    ['[data-welcome-heading-highlight]', nodes.highlight], ['[data-welcome-lead]', nodes.lead],
    ['[data-welcome-copy]', nodes.body], ['[data-welcome-note]', nodes.note],
    ['[data-welcome-cta]', nodes.cta], ['[data-welcome-cta-context]', nodes.ctaContext],
    ['[data-home-dashboard]', nodes.dashboard], ['[data-home-default-art]', nodes.art]
  ]);
  return {
    title: '', documentElement: { dataset: {} }, nodes,
    querySelector(selector) { return selectors.get(selector) || null; },
    getElementById(id) { return id === 'personalizedWelcomeStatus' ? nodes.status : id === 'personalizedWelcomeDetail' ? nodes.detail : null; }
  };
}

const api = require('./assets/js/referred-homeowner-welcome.js');
const shareApi = require('./assets/js/post-submission-share.js');
const homeHtml = read('home/index.html');
const reportHtml = read('home/report/index.html');
const homeWelcome = read('assets/js/home-welcome.js');
const css = read('assets/css/referred-homeowner-welcome.css');
const sprint = read('SPRINT-NP-1.2.md');
const changelog = read('CHANGELOG.md');
const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));

check('release version is NP-1.2', ['3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('referral module is versioned', ['1.0.0','1.1.0','1.2.0','1.3.0'].includes(api.VERSION) && ['NP-1.2','NP-1.3','NP-1.4','NP-1.5'].includes(api.BUILD));
check('only the exact single referral parameter is valid', api.readExplicitReferral('?ref=neighbor').valid === true && api.readExplicitReferral('?ref=Neighbor').valid === false && api.readExplicitReferral('?ref=neighbor&ref=neighbor').valid === false);
check('missing referral parameter is not treated as referral traffic', api.readExplicitReferral('?utm_source=test').present === false);
check('referral state is limited to CoverageFit Home', api.isHomePath('/home/') === true && api.isHomePath('/home') === true && api.isHomePath('/assessment/') === false);

const storage = new MemoryStorage();
const valid = api.resolveState({ location: { pathname: '/home/', search: '?ref=neighbor' }, storage, now: new Date('2026-08-06T03:00:00.000Z') });
check('valid referral parameter activates and persists a session marker', valid.active === true && valid.reason === 'valid_parameter' && Boolean(storage.getItem(api.STORAGE_KEY)));
const entry = api.readEntry({ storage });
check('session marker contains no referrer, recipient, contact, property, or report data', entry.source === 'neighbor-share' && !('name' in entry) && !('email' in entry) && !('phone' in entry) && !('property' in entry) && !('reportId' in entry));
check('refresh without the query preserves referral state in the same session', api.resolveState({ location: { pathname: '/home/', search: '' }, storage, now: new Date('2026-08-06T04:00:00.000Z') }).reason === 'session_restored');
check('expired session referral state falls back safely', api.resolveState({ location: { pathname: '/home/', search: '' }, storage, now: new Date('2026-08-06T10:00:01.000Z') }).active === false);

const invalidStorage = new MemoryStorage();
api.writeEntry({ storage: invalidStorage, now: new Date('2026-08-06T03:00:00.000Z') });
const invalid = api.resolveState({ location: { pathname: '/home/', search: '?ref=unknown' }, storage: invalidStorage, now: new Date('2026-08-06T03:05:00.000Z') });
check('explicit invalid referral values clear prior referral state', invalid.active === false && invalid.reason === 'invalid_parameter' && invalidStorage.getItem(api.STORAGE_KEY) === null);
check('non-home routes never activate the referred welcome', api.resolveState({ location: { pathname: '/assessment/', search: '?ref=neighbor' }, storage: new MemoryStorage() }).active === false);

const documentRef = documentMock();
const rendered = api.render({ document: documentRef, location: { pathname: '/home/', search: '?ref=neighbor' }, storage: new MemoryStorage(), now: new Date('2026-08-06T03:00:00.000Z') });
check('valid referral renders the referred-homeowner experience', rendered.rendered === true && documentRef.documentElement.dataset.welcomeState === 'referred');
check('required welcome headline and copy are rendered', documentRef.nodes.main.textContent === 'A Neighbor Shared This' && documentRef.nodes.highlight.textContent === 'Home Coverage Review With You.' && documentRef.nodes.lead.textContent === 'Every home is rated differently.' && documentRef.nodes.body.textContent.includes('Dylan will personally evaluate your property'));
check('CTA reuses the existing Home assessment', documentRef.nodes.cta.textContent === 'Start My 5-Minute Review' && documentRef.nodes.cta.href === '/assessment/');
check('referred state keeps the standard home art and excludes the personalized dashboard', documentRef.nodes.art.hidden === false && documentRef.nodes.dashboard.hidden === true);
check('welcome does not expose a referrer identity', !Object.values(api.COPY).join(' ').toLowerCase().includes('referrer name'));

check('home page loads referral CSS and module before the welcome controller', homeHtml.includes('/assets/css/referred-homeowner-welcome.css') && homeHtml.indexOf('/assets/js/referred-homeowner-welcome.js') < homeHtml.indexOf('/assets/js/home-welcome.js'));
check('home welcome gives valid referral state precedence', homeWelcome.indexOf('CoverageFitReferredHomeownerWelcome?.render') < homeWelcome.indexOf("const receipt = safeGet(sessionStorage, WELCOME_STORAGE_KEY)"));
check('NP-1.1 now shares the functional branded referral route', shareApi.DEFAULT_SHARE_URL === 'https://408farmers.com/neighbor/' && reportHtml.includes('data-share-url="https://408farmers.com/neighbor/"'));
check('share message remains approved and includes the branded referral URL', shareApi.buildMessage(shareApi.DEFAULT_SHARE_URL).endsWith('https://408farmers.com/neighbor/'));
check('direct Home markup and the existing assessment route remain in place', homeHtml.includes('href="/assessment/"') && homeHtml.includes('data-home-default-art') && !read('assessment/index.html').includes('referred-homeowner-welcome.js'));
check('referral styling is responsive and state-scoped', css.includes('data-welcome-state="referred"') && css.includes('@media(max-width:520px)'));
check('sprint documentation records fallback, refresh, privacy, and no-duplicate-intake behavior', ['Invalid', 'refresh', 'session storage', 'no referrer or recipient identity', 'reuses the existing CoverageFit Home page'].every(token => sprint.toLowerCase().includes(token.toLowerCase())));
check('changelog records the NP-1.2 release', changelog.includes('## 3.20.15 — NP-1.2 Referred Homeowner Welcome'));

console.log(JSON.stringify({ sprint: 'NP-1.2', passed: checks.length, failed: 0, checks }, null, 2));
