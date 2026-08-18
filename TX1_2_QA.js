const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const html = fs.readFileSync(`${root}/transition/index.html`, 'utf8');
const css = fs.readFileSync(`${root}/assets/css/transition.css`, 'utf8');
const source = fs.readFileSync(`${root}/assets/js/transition-route.js`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('premium SVG wordmark is used', html.includes('/assets/images/coveragefit-logo.svg'));
check('standalone mark is used', html.includes('/assets/images/coveragefit-mark.svg'));
check('transition shell remains the primary reachable UI', html.includes('data-transition-shell'));
check('accessible heading is present', html.includes('aria-labelledby="transitionHeading"'));
check('status is announced politely', html.includes('role="status"') && html.includes('aria-live="polite"'));
check('status announcement is atomic', html.includes('aria-atomic="true"'));
check('manual continue fallback remains present', html.includes('id="transitionContinue"'));
check('no-script continuation exists', html.includes('<noscript>') && html.includes('Continue to CoverageFit'));
check('privacy statement remains visible', html.includes('stays out of the visible URL'));
check('premium panel now hosts the integrated staged timeline', html.includes('data-transition-timeline') && html.includes('Contact information secured'));
check('premium panel treatment exists', css.includes('.transition-panel::before') && css.includes('backdrop-filter'));
check('responsive mobile treatment exists', css.includes('@media (max-width: 560px)'));
check('short viewport treatment exists', css.includes('@media (max-height: 680px)'));
check('safe-area support exists', css.includes('env(safe-area-inset-top)'));
check('keyboard focus treatment exists', css.includes(':focus-visible'));
check('reduced-motion support exists', css.includes('@media (prefers-reduced-motion: reduce)'));
check('entrance motion exists', css.includes('@keyframes transition-shell-enter'));
check('exit motion state exists', css.includes('data-transition-phase="leaving"'));
check('route controller remains versioned', ["const VERSION = '1.4'", "const VERSION = '1.5'"].some(token => source.includes(token)));
check('existing secure storage keys are unchanged', source.includes("coveragefit_transition_v1") && source.includes("coveragefit_prospect_profile_v1"));
check('same-origin destination validation remains', source.includes('parsed.origin !== window.location.origin'));
check('transition route loop protection remains', source.includes("parsed.pathname === '/transition/'"));
check('ARIA busy state is cleared before navigation', source.includes("setAttribute('aria-busy', 'false')"));
check('reduced motion skips visual exit delay', source.includes('reducedMotion ? 0 : EXIT_DELAY'));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

const sessionStorage = storage({
  coveragefit_transition_v1: JSON.stringify({ destination: '/assessment/', hasProfile: true })
});
const localStorage = storage();
const timerDelays = [];
let redirected = '';
const bodyAttributes = {};
const makeStep = () => {
  const label = { textContent: '' };
  return {
    dataset: {}, attributes: {},
    querySelector: selector => selector === '.transition-step-label' ? label : null,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; }
  };
};
const stepNodes = Array.from({ length: 4 }, makeStep);
const elements = {};
for (const id of ['transitionHeading', 'transitionMessage', 'transitionStatus', 'transitionContinue']) {
  elements[id] = {
    textContent: '', href: '',
    focus() {},
    addEventListener() {}
  };
}
elements.transitionFinal = {
  dataset: {},
  querySelector: () => ({ textContent: '' })
};
const document = {
  documentElement: { dataset: {} },
  body: { setAttribute: (name, value) => { bodyAttributes[name] = String(value); } },
  getElementById: id => elements[id] || null,
  querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
};
const window = {
  location: { origin: 'https://coveragefit.com', href: '', replace: value => { redirected = value; } },
  matchMedia: () => ({ matches: false }),
  setTimeout: (callback, delay) => { timerDelays.push(delay); callback(); return timerDelays.length; },
  clearTimeout() {}
};
Object.assign(window, { window, document, sessionStorage, localStorage, URL });
const context = { window, document, sessionStorage, localStorage, URL, console };
vm.createContext(context);
vm.runInContext(source, context);

check('personalized handoff still reaches intended destination', redirected === '/assessment/');
check('premium timing includes staged display and exit phases', JSON.stringify(timerDelays) === JSON.stringify([360, 720, 1080, 1440, 2000, 160]));
check('ready state remains exposed to presentation layer', document.documentElement.dataset.transitionState === 'ready');
check('leaving phase is exposed before redirect', document.documentElement.dataset.transitionPhase === 'leaving');
check('busy state is cleared before redirect', bodyAttributes['aria-busy'] === 'false');
check('saved transition state is removed on completion', sessionStorage.getItem('coveragefit_transition_v1') === null);

console.log(`TX-1.2 QA: ${checks.length}/${checks.length} passed`);
