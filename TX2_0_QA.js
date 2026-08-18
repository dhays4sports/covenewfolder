const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const homeHtml = fs.readFileSync(`${root}/home/index.html`, 'utf8');
const pagesCss = fs.readFileSync(`${root}/assets/css/pages.css`, 'utf8');
const dashboardSource = fs.readFileSync(`${root}/assets/js/home-dashboard.js`, 'utf8');
const welcomeSource = fs.readFileSync(`${root}/assets/js/home-welcome.js`, 'utf8');
const version = fs.readFileSync(`${root}/VERSION`, 'utf8').trim();
const changelog = fs.readFileSync(`${root}/CHANGELOG.md`, 'utf8');
const roadmap = fs.readFileSync(`${root}/ROADMAP.md`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('release retains the TX-2.0 baseline or later', (() => { const parts = version.split('.').map(Number); return parts[0] > 3 || (parts[0] === 3 && (parts[1] > 19 || (parts[1] === 19 && parts[2] >= 18))); })());
check('Home retains the existing route rather than adding a dashboard route', !fs.existsSync(`${root}/dashboard/index.html`) && !fs.existsSync(`${root}/home/dashboard/index.html`));
check('Home contains the integrated dashboard root', homeHtml.includes('data-home-dashboard'));
check('Home retains the default marketing artwork', homeHtml.includes('data-home-default-art'));
check('review exposes a labeled Home Protection Review heading', homeHtml.includes('aria-labelledby="homeDashboardTitle"') && homeHtml.includes('Home Protection Review'));
check('dashboard contains four truthful readiness items', (homeHtml.match(/data-dashboard-item=/g) || []).length === 4);
check('dashboard CTA continues to the existing assessment route', homeHtml.includes('data-dashboard-cta="" href="/assessment/"'));
check('dashboard runtime loads before the welcome controller', homeHtml.indexOf('/assets/js/home-dashboard.js') > homeHtml.indexOf('/assets/js/hero-personalization.js') && homeHtml.indexOf('/assets/js/home-dashboard.js') < homeHtml.indexOf('/assets/js/home-welcome.js'));
check('welcome controller delegates dashboard rendering', welcomeSource.includes('CoverageFitHomeDashboard?.render?.'));
check('dashboard runtime does not read browser storage', !dashboardSource.includes('sessionStorage') && !dashboardSource.includes('localStorage'));
check('dashboard runtime never uses innerHTML', !dashboardSource.includes('innerHTML'));
check('dashboard runtime preserves assessment destination', dashboardSource.includes("cta.href = '/assessment/'"));
check('dashboard styling is scoped to TX-2.0', pagesCss.includes('TX-2.0: personalized Home Protection Dashboard handoff'));
check('dashboard includes mobile layout treatment', pagesCss.includes('@media(max-width:520px){.home-protection-dashboard'));
check('dashboard includes reduced-motion treatment', pagesCss.includes('@media(prefers-reduced-motion:reduce){.home-protection-dashboard'));
check('roadmap marks the Transition Experience epic complete', roadmap.includes('Transition Experience Epic — COMPLETE'));
check('changelog contains TX-2.0 release', changelog.includes('3.19.18 — TX-2.0 Home Protection Dashboard Handoff'));

function node({ hidden = false, text = '' } = {}) {
  return {
    textContent: text,
    hidden,
    href: '',
    dataset: {},
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); }
  };
}

function dashboardDom() {
  const elements = {
    homeDashboardTitle: node()
  };
  const selectors = {
    '[data-home-dashboard]': node({ hidden: true }),
    '[data-home-default-art]': node({ hidden: false }),
    '[data-dashboard-summary]': node(),
    '[data-dashboard-property]': node({ hidden: true }),
    '[data-dashboard-address]': node(),
    '[data-dashboard-contact-detail]': node(),
    '[data-dashboard-property-title]': node(),
    '[data-dashboard-property-detail]': node(),
    '[data-dashboard-reason]': node(),
    '[data-dashboard-cta]': node()
  };
  const document = {
    documentElement: { dataset: {} },
    getElementById(id) { return elements[id] || null; },
    querySelector(selector) { return selectors[selector] || null; }
  };
  return { document, elements, selectors };
}

function loadDashboard() {
  const window = {};
  const context = { window, document: {}, console };
  vm.createContext(context);
  vm.runInContext(dashboardSource, context);
  return window.CoverageFitHomeDashboard;
}

const dashboard = loadDashboard();
check('dashboard public API is frozen', Object.isFrozen(dashboard));
check('dashboard public API exposes only version and render', Object.keys(dashboard).join(',') === 'version,render');

const experience = {
  reasonLabel: 'Premium increase',
  kicker: 'Your Protection Review Is Ready',
  cta: 'Begin My Protection Review'
};
const context = {
  identity: { givenName: 'Dylan', displayName: 'Dylan Haysbert' },
  contact: { email: 'dylan@example.com', phone: '4085550100' },
  property: { displayAddress: '123 Main Street, Fremont, CA 94539' },
  journey: { reasonKey: 'premium-increase' }
};
const full = dashboardDom();
const fullResult = dashboard.render({ document: full.document, experience, context });
check('valid personalized context renders the dashboard', fullResult.rendered === true);
check('dashboard replaces the default artwork in the personalized state', full.selectors['[data-home-dashboard]'].hidden === false && full.selectors['[data-home-default-art]'].hidden === true);
check('dashboard identifies itself as ready', full.selectors['[data-home-dashboard]'].dataset.dashboardState === 'ready');
check('document records dashboard-first arrival without PII', full.document.documentElement.dataset.homeArrival === 'dashboard' && !JSON.stringify(full.document.documentElement.dataset).includes('Dylan'));
check('review heading acknowledges the prospect by first name', full.elements.homeDashboardTitle.textContent === 'Dylan, your Home Protection Review is ready to begin.');
check('dashboard displays the transferred property address', full.selectors['[data-dashboard-property]'].hidden === false && full.selectors['[data-dashboard-address]'].textContent.includes('123 Main Street'));
check('dashboard displays the review focus', full.selectors['[data-dashboard-reason]'].textContent === 'Premium increase');
check('dashboard confirms secured intake without exposing email or phone', full.selectors['[data-dashboard-contact-detail]'].textContent.includes('saved intake details') && !full.selectors['[data-dashboard-contact-detail]'].textContent.includes('@'));
check('dashboard CTA uses the reason-specific label', full.selectors['[data-dashboard-cta]'].textContent === 'Begin My Protection Review');
check('dashboard CTA has a personalized accessible name', full.selectors['[data-dashboard-cta]'].attributes['aria-label'] === 'Begin My Protection Review, Dylan');
check('dashboard CTA destination remains assessment', full.selectors['[data-dashboard-cta]'].href === '/assessment/');

const missingAddress = dashboardDom();
dashboard.render({
  document: missingAddress.document,
  experience: { reasonLabel: 'Personalized home review', cta: 'Begin My Home Coverage Review' },
  context: { identity: {}, contact: {}, property: {}, journey: {} }
});
check('missing address does not display a false property card', missingAddress.selectors['[data-dashboard-property]'].hidden === true);
check('missing address receives truthful home-details wording', missingAddress.selectors['[data-dashboard-property-title]'].textContent === 'Home details ready' && missingAddress.selectors['[data-dashboard-property-detail]'].textContent.includes('confirm'));
check('missing contact receives truthful confirmation wording', missingAddress.selectors['[data-dashboard-contact-detail]'].textContent.includes('confirm your contact details'));

const unsafe = dashboardDom();
dashboard.render({
  document: unsafe.document,
  experience: { reasonLabel: '<img src=x> Renewal', cta: '<b>Begin Review</b>' },
  context: {
    identity: { givenName: '<script>Dylan</script>' },
    contact: {},
    property: { displayAddress: '<img src=x> 123 Main Street' }
  }
});
check('dashboard sanitizes display values before rendering', !JSON.stringify(unsafe).includes('<script>') && !unsafe.selectors['[data-dashboard-address]'].textContent.includes('<'));

function storage(values = {}) {
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; }
  };
}

function runWelcome({ withReceipt = true } = {}) {
  const now = Date.now();
  const sessionId = 'tx20-session';
  const profile = { firstName: 'Dylan', integration: { sessionId } };
  const receipt = {
    version: '1.0',
    hasProfile: true,
    sessionId,
    destination: '/home/',
    reasonKey: 'renewal',
    completedAt: new Date(now).toISOString()
  };
  const sessionValues = {
    coveragefit_prospect_profile_v1: JSON.stringify(profile)
  };
  if (withReceipt) sessionValues.coveragefit_transition_welcome_v1 = JSON.stringify(receipt);
  let heroCalls = 0;
  let dashboardCalls = 0;
  const window = {
    location: { origin: 'https://coveragefit.com' },
    CoverageFitPersonalization: { get: () => ({ sessionId, flags: { hasProfile: true }, identity: { givenName: 'Dylan' }, contact: {}, property: {}, journey: { reasonKey: 'renewal' } }) },
    CoverageFitHeroPersonalization: { render: () => { heroCalls += 1; return { rendered: true }; } },
    CoverageFitHomeDashboard: { render: () => { dashboardCalls += 1; return { rendered: true }; } }
  };
  const document = { title: '', documentElement: { dataset: {} } };
  const sandbox = {
    window,
    document,
    sessionStorage: storage(sessionValues),
    localStorage: storage(),
    URL,
    Date,
    Object,
    JSON,
    String,
    Boolean
  };
  vm.createContext(sandbox);
  vm.runInContext(welcomeSource, sandbox);
  return { window, document, heroCalls, dashboardCalls };
}

const integrated = runWelcome({ withReceipt: true });
check('valid completed transition activates both hero and dashboard renderers', integrated.window.CoverageFitWelcome.active === true && integrated.heroCalls === 1 && integrated.dashboardCalls === 1);
check('welcome public API remains free of PII and dashboard details', Object.keys(integrated.window.CoverageFitWelcome).join(',') === 'version,active,reasonKey');
const direct = runWelcome({ withReceipt: false });
check('direct visitors do not activate the dashboard', direct.window.CoverageFitWelcome.active === false && direct.dashboardCalls === 0);

console.log(`TX-2.0 QA: ${checks.length}/${checks.length} passed`);
