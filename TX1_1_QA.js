const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const root = __dirname;

const intakeSource = fs.readFileSync(`${root}/assets/js/prefill-intake.js`, 'utf8');
const transitionSource = fs.readFileSync(`${root}/assets/js/transition-route.js`, 'utf8');
const transitionHtml = fs.readFileSync(`${root}/transition/index.html`, 'utf8');
const campaignHtml = fs.readFileSync(`${root}/campaign/index.html`, 'utf8');

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function runIntake({ pathname, search }) {
  const sessionStorage = storage();
  const localStorage = storage();
  let redirected = '';
  let cleaned = '';
  let event = null;
  const location = {
    origin: 'https://coveragefit.com', pathname, search, hash: '', href: '',
    replace: value => { redirected = value; }
  };
  const window = {
    location,
    history: { state: null, replaceState: (_a, _b, value) => { cleaned = value; location.search = value.includes('?') ? `?${value.split('?')[1]}` : ''; } },
    dispatchEvent: value => { event = value; },
    sessionStorage,
    localStorage
  };
  const context = {
    window, location, history: window.history, sessionStorage, localStorage,
    document: { title: 'CoverageFit' }, URL, URLSearchParams, Date, console,
    CustomEvent: function(type, options) { this.type = type; this.detail = options.detail; }
  };
  window.window = window;
  window.document = context.document;
  window.URL = URL;
  window.URLSearchParams = URLSearchParams;
  window.CustomEvent = context.CustomEvent;
  vm.createContext(context);
  vm.runInContext(intakeSource, context);
  return { sessionStorage, localStorage, redirected, cleaned, event, window };
}

let result = runIntake({
  pathname: '/home/',
  search: '?first_name=Dylan&last_name=Haysbert&email=dylan%40example.com&phone=408-327-6377&property_address=123%20Main%20St&source=408farmers&campaign=door_hanger&prefill=1'
});
let profile = JSON.parse(result.sessionStorage.getItem('coveragefit_prospect_profile_v1'));
let transition = JSON.parse(result.sessionStorage.getItem('coveragefit_transition_v1'));
assert.equal(profile.fullName, 'Dylan Haysbert');
assert.equal(transition.destination, '/home/');
assert.equal(result.redirected, '/transition/?source=408farmers&campaign=door_hanger');
assert(!result.redirected.includes('email'));
assert(!result.redirected.includes('property_address'));
assert.equal(result.event.type, 'coveragefit:prefill-ready');

result = runIntake({
  pathname: '/transition/',
  search: '?first_name=Dylan&property_address=123%20Main%20St&source=408farmers&next=%2Fassessment%2F&prefill=1'
});
transition = JSON.parse(result.sessionStorage.getItem('coveragefit_transition_v1'));
assert.equal(transition.destination, '/assessment/');
assert.equal(result.redirected, '');
assert.equal(result.cleaned, '/transition/?source=408farmers');

function runTransition({ state, profileSeed, reducedMotion = false }) {
  const sessionStorage = storage({
    ...(state ? { coveragefit_transition_v1: JSON.stringify(state) } : {}),
    ...(profileSeed ? { coveragefit_prospect_profile_v1: JSON.stringify(profileSeed) } : {})
  });
  const localStorage = storage();
  let redirected = '';
  const timerDelays = [];
  const makeStep = () => {
    const label = { textContent: '' };
    return {
      dataset: {}, attributes: {},
      querySelector: selector => selector === '.transition-step-label' ? label : null,
      setAttribute(name, value) { this.attributes[name] = String(value); },
      removeAttribute(name) { delete this.attributes[name]; },
      label
    };
  };
  const stepNodes = Array.from({ length: 4 }, makeStep);
  const finalMessageNode = { textContent: '' };
  const elements = {};
  for (const id of ['transitionHeading', 'transitionMessage', 'transitionStatus', 'transitionContinue']) {
    elements[id] = {
      textContent: '', href: '', focused: false, listener: null,
      focus() { this.focused = true; },
      addEventListener(_type, listener) { this.listener = listener; }
    };
  }
  elements.transitionFinal = {
    dataset: {},
    querySelector: selector => selector === '.transition-final-message' ? finalMessageNode : null
  };
  const window = {
    location: { origin: 'https://coveragefit.com', href: '', replace: value => { redirected = value; } },
    matchMedia: () => ({ matches: reducedMotion }),
    setTimeout: (callback, delay) => { timerDelays.push(delay); callback(); return timerDelays.length; },
    clearTimeout() {}
  };
  const bodyAttributes = {};
  const document = {
    documentElement: { dataset: {} },
    body: { setAttribute: (name, value) => { bodyAttributes[name] = String(value); } },
    getElementById: id => elements[id] || null,
    querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
  };
  const context = { window, document, sessionStorage, localStorage, URL, console };
  window.window = window;
  window.document = document;
  window.sessionStorage = sessionStorage;
  window.localStorage = localStorage;
  window.URL = URL;
  vm.createContext(context);
  vm.runInContext(transitionSource, context);
  return { redirected, timerDelays, elements, document, bodyAttributes, sessionStorage, api: window.CoverageFitTransition };
}

let transitionRun = runTransition({ state: { destination: '/assessment/', hasProfile: true } });
assert.equal(transitionRun.redirected, '/assessment/');
assert.deepEqual(transitionRun.timerDelays, [360, 720, 1080, 1440, 2000, 160]);
assert.equal(transitionRun.document.documentElement.dataset.transitionState, 'ready');
assert.equal(transitionRun.document.documentElement.dataset.transitionPhase, 'leaving');
assert.equal(transitionRun.bodyAttributes['aria-busy'], 'false');
assert.equal(transitionRun.sessionStorage.getItem('coveragefit_transition_v1'), null);
assert.equal(transitionRun.api.hasHandoff, true);

transitionRun = runTransition({ state: { destination: 'https://evil.example/' }, reducedMotion: true });
assert.equal(transitionRun.redirected, '/home/');
assert.deepEqual(transitionRun.timerDelays, [350, 0]);
assert.equal(transitionRun.document.documentElement.dataset.transitionState, 'fallback');

assert(transitionHtml.includes('id="transitionStatus"'));
assert(transitionHtml.includes('/assets/js/prefill-intake.js'));
assert(transitionHtml.indexOf('/assets/js/prefill-intake.js') < transitionHtml.indexOf('/assets/js/transition-route.js'));
assert(campaignHtml.includes("new URL('/transition/'"));
assert(campaignHtml.includes("target.searchParams.set('next', '/assessment/')"));

console.log('TX-1.1 QA: 27/27 passed');
