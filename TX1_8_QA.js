const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const homeHtml = fs.readFileSync(`${root}/home/index.html`, 'utf8');
const pagesCss = fs.readFileSync(`${root}/assets/css/pages.css`, 'utf8');
const heroSource = fs.readFileSync(`${root}/assets/js/hero-personalization.js`, 'utf8');
const welcomeSource = fs.readFileSync(`${root}/assets/js/home-welcome.js`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('Home loads the reusable hero runtime before the welcome controller', homeHtml.indexOf('/assets/js/hero-personalization.js') > homeHtml.indexOf('/assets/js/personalization-context.js') && homeHtml.indexOf('/assets/js/hero-personalization.js') < homeHtml.indexOf('/assets/js/home-welcome.js'));
check('existing Home hero exposes a greeting component root', homeHtml.includes('data-hero-greeting'));
check('existing Home hero exposes a journey-context component root', homeHtml.includes('data-hero-journey-context'));
check('existing Home hero exposes a reason-banner component root', homeHtml.includes('data-hero-reason-banner'));
check('existing Home hero exposes a dynamic-CTA component root', homeHtml.includes('data-hero-dynamic-cta'));
check('journey context includes reason and property targets', homeHtml.includes('data-welcome-context-reason') && homeHtml.includes('data-welcome-context-property'));
check('dynamic CTA includes supporting context target', homeHtml.includes('data-welcome-cta-context'));
check('welcome controller delegates rendering to the component runtime', welcomeSource.includes('CoverageFitHeroPersonalization?.render?.'));
check('welcome controller no longer assigns hero DOM text directly', !welcomeSource.includes('.textContent =') && !welcomeSource.includes('querySelector('));
check('component runtime declares all four bounded components', ['greeting', 'journeyContext', 'reasonBanner', 'dynamicCta'].every(name => heroSource.includes(`${name}`)));
check('component runtime never uses innerHTML', !heroSource.includes('innerHTML'));
check('component runtime does not read browser storage', !heroSource.includes('sessionStorage') && !heroSource.includes('localStorage'));
check('component styling is integrated into the existing personalized Home state', pagesCss.includes('TX-1.8: reusable Home hero personalization components') && pagesCss.includes('[data-hero-greeting]') && pagesCss.includes('[data-hero-dynamic-cta]'));
check('reason and property chips have hidden-state support', pagesCss.includes('.personalized-welcome-context>span[hidden]'));
check('mobile component styling is present', pagesCss.includes('@media(max-width:520px){html[data-welcome-state="personalized"] [data-hero-greeting]'));

function node({ hidden = false, text = '' } = {}) {
  return {
    textContent: text,
    hidden,
    dataset: {},
    attributes: {},
    href: '',
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; }
  };
}

function createDocument() {
  const elements = {
    personalizedWelcome: node({ hidden: true }),
    personalizedWelcomeStatus: node(),
    personalizedWelcomeDetail: node()
  };
  const selectors = {
    '[data-hero-greeting]': node(),
    '[data-hero-journey-context]': elements.personalizedWelcome,
    '[data-hero-reason-banner]': node({ text: 'CoverageFit Home' }),
    '[data-hero-dynamic-cta]': node(),
    '[data-welcome-heading-main]': node({ text: 'Shopping for' }),
    '[data-welcome-heading-highlight]': node({ text: 'home insurance?' }),
    '[data-welcome-lead]': node(),
    '[data-welcome-copy]': node(),
    '[data-welcome-note]': node(),
    '[data-welcome-context-reason]': node(),
    '[data-welcome-context-property]': node({ hidden: true }),
    '[data-welcome-cta]': node({ text: 'Start My Home Coverage Review' }),
    '[data-welcome-cta-context]': node({ hidden: true })
  };
  const document = {
    title: 'CoverageFit Home | Homeowners Coverage Review',
    documentElement: { dataset: {} },
    getElementById: id => elements[id] || null,
    querySelector: selector => selectors[selector] || null
  };
  return { document, elements, selectors };
}

function loadHero() {
  const window = {};
  const context = { window, document: {}, Object, console };
  Object.assign(window, { window });
  vm.createContext(context);
  vm.runInContext(heroSource, context);
  return window.CoverageFitHeroPersonalization;
}

const hero = loadHero();
check('hero personalization API is frozen', Object.isFrozen(hero));
check('hero personalization API exposes version, render, and components only', Object.keys(hero).join(',') === 'version,render,components');
check('component registry is frozen', Object.isFrozen(hero.components));
check('all four component definitions are independently reusable', Object.values(hero.components).every(component => typeof component.render === 'function' && Object.isFrozen(component)));

const homebuyerExperience = {
  kicker: 'Your New Home Review Is Ready',
  reasonLabel: 'New home purchase',
  heading: 'Welcome. Let’s review the protection',
  highlight: 'your new home may need.',
  status: 'New home review ready',
  statusDetail: 'Your onboarding is complete. Your new home review is ready to begin.',
  lead: 'Review the protection decisions for your new home.',
  copy: 'Organize the questions worth answering.',
  note: 'Your information has been carried forward securely.',
  cta: 'Begin My New Home Review'
};
const personalizedContext = {
  identity: { givenName: 'Dylan' },
  property: { displayAddress: '123 Main Street, Fremont, CA 94539' },
  journey: { reasonKey: 'homebuyer' },
  sessionId: 'session-123'
};
const personalizedDom = createDocument();
const result = hero.render({ document: personalizedDom.document, experience: homebuyerExperience, context: personalizedContext, reasonKey: 'homebuyer' });
check('orchestrator renders all four components', result.rendered === true && result.components.length === 4);
check('greeting component acknowledges the prospect by first name', personalizedDom.selectors['[data-welcome-heading-main]'].textContent === 'Welcome, Dylan.');
check('greeting component composes the complete journey heading', personalizedDom.selectors['[data-welcome-heading-highlight]'].textContent === 'Let’s review the protection your new home may need.');
check('greeting component records its personalized state', personalizedDom.selectors['[data-hero-greeting]'].dataset.componentState === 'personalized');
check('reason banner displays the journey-specific kicker', personalizedDom.selectors['[data-hero-reason-banner]'].textContent === 'Your New Home Review Is Ready');
check('reason banner exposes a non-PII reason classification', personalizedDom.selectors['[data-hero-reason-banner]'].dataset.reason === 'homebuyer');
check('reason banner has an accessible reason label', personalizedDom.selectors['[data-hero-reason-banner]'].attributes['aria-label'] === 'Review reason: New home purchase');
check('journey context reveals the existing readiness surface', personalizedDom.elements.personalizedWelcome.hidden === false);
check('journey context carries the completion status', personalizedDom.elements.personalizedWelcomeStatus.textContent === 'New home review ready');
check('journey context acknowledges the name and address', personalizedDom.elements.personalizedWelcomeDetail.textContent.startsWith('Dylan, your onboarding is complete for 123 Main Street, Fremont, CA 94539.'));
check('journey context displays a reason chip', personalizedDom.selectors['[data-welcome-context-reason]'].textContent === 'New home purchase');
check('journey context displays the property chip', personalizedDom.selectors['[data-welcome-context-property]'].hidden === false && personalizedDom.selectors['[data-welcome-context-property]'].textContent === '123 Main Street, Fremont, CA 94539');
check('journey context owns the supporting hero copy', personalizedDom.selectors['[data-welcome-lead]'].textContent === homebuyerExperience.lead && personalizedDom.selectors['[data-welcome-copy]'].textContent === homebuyerExperience.copy && personalizedDom.selectors['[data-welcome-note]'].textContent === homebuyerExperience.note);
check('dynamic CTA uses the journey-specific action', personalizedDom.selectors['[data-welcome-cta]'].textContent === 'Begin My New Home Review');
check('dynamic CTA keeps the production assessment destination', personalizedDom.selectors['[data-welcome-cta]'].href === '/assessment/');
check('dynamic CTA provides a personalized accessible label', personalizedDom.selectors['[data-welcome-cta]'].attributes['aria-label'] === 'Begin My New Home Review, Dylan');
check('dynamic CTA displays carried-forward context', personalizedDom.selectors['[data-welcome-cta-context]'].hidden === false && personalizedDom.selectors['[data-welcome-cta-context]'].textContent.includes('123 Main Street'));

const neutralDom = createDocument();
const neutralResult = hero.render({
  document: neutralDom.document,
  experience: { ...homebuyerExperience, kicker: 'Your Coverage Review Is Ready', reasonLabel: 'Personalized home review', heading: 'Welcome. Let’s understand', highlight: 'your home protection.', cta: 'Begin My Home Coverage Review' },
  context: { identity: { givenName: '' }, property: { displayAddress: '' }, journey: { reasonKey: 'general' } },
  reasonKey: 'general'
});
check('neutral context still renders the same component architecture', neutralResult.rendered === true);
check('missing name produces a truthful generic greeting', neutralDom.selectors['[data-welcome-heading-main]'].textContent === 'Welcome.');
check('missing address keeps the property chip hidden', neutralDom.selectors['[data-welcome-context-property]'].hidden === true);
check('missing address produces a neutral CTA context', neutralDom.selectors['[data-welcome-cta-context]'].textContent === 'Your saved details will carry into the review.');

const hostileDom = createDocument();
hero.render({
  document: hostileDom.document,
  experience: homebuyerExperience,
  context: { identity: { givenName: '<img src=x onerror=alert(1)>Dylan' }, property: { displayAddress: '<script>alert(1)</script> 9 Oak Street' } },
  reasonKey: 'homebuyer'
});
check('component output strips markup from the greeting', !hostileDom.selectors['[data-welcome-heading-main]'].textContent.includes('<'));
check('component output strips markup from the property context', !hostileDom.selectors['[data-welcome-context-property]'].textContent.includes('<script>'));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function runWelcome({ receipt = true } = {}) {
  const dom = createDocument();
  const sessionId = 'session-123';
  const sessionSeed = {
    coveragefit_prospect_profile_v1: JSON.stringify({ firstName: 'Dylan', propertyAddress: '123 Main Street', integration: { sessionId } })
  };
  if (receipt) sessionSeed.coveragefit_transition_welcome_v1 = JSON.stringify({ version: '1.0', hasProfile: true, reasonKey: 'homebuyer', destination: '/home/', sessionId, completedAt: new Date().toISOString() });
  const sessionStorage = storage(sessionSeed);
  const localStorage = storage();
  const contextValue = {
    sessionId,
    identity: { givenName: 'Dylan' },
    property: { displayAddress: '123 Main Street' },
    journey: { reasonKey: 'homebuyer' },
    flags: { hasProfile: true }
  };
  const window = {
    location: { origin: 'https://coveragefit.com', pathname: '/home/' },
    CoverageFitPersonalization: { get: () => contextValue }
  };
  Object.assign(window, { window, document: dom.document, sessionStorage, localStorage, URL });
  const context = { window, document: dom.document, sessionStorage, localStorage, URL, Date, Number, Object, console };
  vm.createContext(context);
  vm.runInContext(heroSource, context);
  vm.runInContext(welcomeSource, context);
  return { window, dom };
}

const integrated = runWelcome();
check('welcome controller activates the reusable components after a valid receipt', integrated.window.CoverageFitWelcome.active === true && integrated.dom.selectors['[data-hero-greeting]'].dataset.componentState === 'personalized');
check('integrated public welcome API remains free of name and address data', Object.keys(integrated.window.CoverageFitWelcome).join(',') === 'version,active,reasonKey');
const direct = runWelcome({ receipt: false });
check('direct visitors keep the original generic hero untouched', direct.window.CoverageFitWelcome.active === false && direct.dom.selectors['[data-welcome-heading-main]'].textContent === 'Shopping for' && direct.dom.elements.personalizedWelcome.hidden === true);

console.log(`TX-1.8 QA: ${checks.length}/${checks.length} passed`);
