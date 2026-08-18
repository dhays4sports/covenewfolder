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

check('property confirmation card exists in the transition route', html.includes('id="transitionProperty"'));
check('property card is hidden before runtime validation', /id="transitionProperty"[\s\S]{0,180}data-state="pending"[\s\S]{0,80}hidden|id="transitionProperty"[\s\S]{0,180}hidden[\s\S]{0,80}data-state="pending"/.test(html));
check('property label has a dedicated target', html.includes('id="transitionPropertyLabel"'));
check('property address has a dedicated target', html.includes('id="transitionPropertyAddress"'));
check('property detail has a dedicated target', html.includes('id="transitionPropertyDetail"'));
check('property card is labelled by visible confirmation content', html.includes('aria-labelledby="transitionPropertyLabel transitionPropertyAddress"'));
check('property presentation is responsive', css.includes('.transition-property') && css.includes('.transition-property-address'));
check('hidden property cards cannot occupy layout space', css.includes('.transition-property[hidden]'));
check('confirmed property state has distinct treatment', css.includes('.transition-property[data-state="confirmed"]'));
check('controller version remains compatible at 1.4 or 1.5', ["const VERSION = '1.4'", "const VERSION = '1.5'"].some(token => source.includes(token)));
check('address display uses textContent rather than innerHTML', source.includes('propertyAddressText.textContent = propertyAddress') && !source.includes('propertyAddressText.innerHTML'));
check('address is not written into a dataset attribute', !source.includes('dataset.propertyAddress'));
check('address credibility validation exists', source.includes('const isUsableAddress'));
check('structured address fallback exists', source.includes('value.address?.street'));
check('property availability is exposed without raw address', source.includes('propertyConfirmed: hasPropertyAddress'));
check('privacy statement remains visible', html.includes('stays out of the visible URL'));
check('same-origin destination validation remains intact', source.includes('parsed.origin !== window.location.origin'));
check('two-second transition timing remains intact', source.includes('const DEFAULT_DELAY = 2000'));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function node({ label = false, hidden = false } = {}) {
  const labelNode = { textContent: '' };
  return {
    dataset: {},
    attributes: {},
    textContent: '',
    href: '',
    hidden,
    listener: null,
    focused: false,
    focus() { this.focused = true; },
    addEventListener(_type, callback) { this.listener = callback; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector(selector) {
      if (label && selector === '.transition-step-label') return labelNode;
      return null;
    },
    labelNode
  };
}

function runTransition({ profile, profileStorage = 'session', hasProfile = true, reducedMotion = false }) {
  const sessionSeed = {
    coveragefit_transition_v1: JSON.stringify({ destination: '/home/', hasProfile })
  };
  const localSeed = {};
  if (profile) {
    const target = profileStorage === 'local' ? localSeed : sessionSeed;
    target.coveragefit_prospect_profile_v1 = JSON.stringify(profile);
  }
  const sessionStorage = storage(sessionSeed);
  const localStorage = storage(localSeed);
  const stepNodes = Array.from({ length: 4 }, () => node({ label: true }));
  const elements = {
    transitionKicker: node(),
    transitionHeading: node(),
    transitionMessage: node(),
    transitionStatus: node(),
    transitionContinue: node(),
    transitionFinal: node(),
    transitionFinalKicker: node(),
    transitionFinalMessage: node(),
    transitionProperty: node({ hidden: true }),
    transitionPropertyLabel: node(),
    transitionPropertyAddress: node(),
    transitionPropertyDetail: node()
  };
  const timers = [];
  let nextTimerId = 1;
  let redirected = '';
  const bodyAttributes = {};
  const document = {
    title: 'Preparing Your CoverageFit Review',
    documentElement: { dataset: {} },
    body: { setAttribute: (name, value) => { bodyAttributes[name] = String(value); } },
    getElementById: id => elements[id] || null,
    querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
  };
  const window = {
    location: { origin: 'https://coveragefit.com', href: '', replace: value => { redirected = value; } },
    matchMedia: () => ({ matches: reducedMotion }),
    setTimeout(callback, delay) {
      const timer = { id: nextTimerId++, callback, delay, cancelled: false, ran: false };
      timers.push(timer);
      return timer.id;
    },
    clearTimeout(id) {
      const timer = timers.find(item => item.id === id);
      if (timer) timer.cancelled = true;
    }
  };
  Object.assign(window, { window, document, sessionStorage, localStorage, URL });
  const context = { window, document, sessionStorage, localStorage, URL, console };
  vm.createContext(context);
  vm.runInContext(source, context);

  const runDelay = (delay) => {
    const timer = timers.find(item => item.delay === delay && !item.ran && !item.cancelled);
    assert(timer, `Missing active timer at ${delay}ms`);
    timer.ran = true;
    timer.callback();
  };

  return { window, document, elements, stepNodes, timers, runDelay, bodyAttributes, redirected: () => redirected };
}

const direct = runTransition({
  profile: {
    reviewContext: 'Buying a Home',
    propertyAddress: '123 Main Street, Fremont, CA 94539',
    integration: { source: '408farmers' }
  }
});
check('valid transferred address reveals the confirmation card', direct.elements.transitionProperty.hidden === false);
check('valid transferred address is displayed exactly', direct.elements.transitionPropertyAddress.textContent === '123 Main Street, Fremont, CA 94539');
check('homebuyer confirmation begins in a truthful pending state', direct.elements.transitionPropertyLabel.textContent === 'Confirming new home');
check('pending property explanation is visible', direct.elements.transitionPropertyDetail.textContent.includes('address you provided'));
check('property card begins pending before the timeline reaches it', direct.elements.transitionProperty.dataset.state === 'pending');
check('document exposes only pending property state', direct.document.documentElement.dataset.transitionProperty === 'pending');
check('homebuyer property milestone becomes confirmation language', direct.stepNodes[1].labelNode.textContent === 'New home confirmed');
check('public transition API confirms availability without exposing address', direct.window.CoverageFitTransition.propertyConfirmed === true && !Object.prototype.hasOwnProperty.call(direct.window.CoverageFitTransition, 'propertyAddress'));

direct.runDelay(360);
check('property card confirms when the property milestone activates', direct.elements.transitionProperty.dataset.state === 'confirmed');
check('property label updates to confirmed state', direct.elements.transitionPropertyLabel.textContent === 'New home confirmed');
check('confirmed card explains the next step', direct.elements.transitionPropertyDetail.textContent === 'Preparing your personalized review…');
check('document exposes confirmed state without exposing the address', direct.document.documentElement.dataset.transitionProperty === 'confirmed');
check('assistive announcement includes the visible confirmed address', direct.elements.transitionStatus.textContent === 'New home confirmed for 123 Main Street, Fremont, CA 94539');

const structured = runTransition({
  profile: {
    reviewContext: 'Policy Renewal',
    address: { street: '1455 Willow Rd', city: 'Nipomo', state: 'CA', postalCode: '93444' }
  },
  profileStorage: 'local'
});
check('structured address components are assembled when formatted address is absent', structured.elements.transitionPropertyAddress.textContent === '1455 Willow Rd, Nipomo, CA 93444');
check('local-storage profile recovery supports property confirmation', structured.elements.transitionProperty.hidden === false);
check('renewal confirmation uses current-home language', structured.stepNodes[1].labelNode.textContent === 'Current home confirmed');

const invalid = runTransition({
  profile: { reviewContext: 'Premium Increase', propertyAddress: 'Unknown' }
});
check('placeholder address keeps the property card hidden', invalid.elements.transitionProperty.hidden === true);
check('placeholder address uses neutral timeline language', invalid.stepNodes[1].labelNode.textContent === 'Preparing home details');
check('placeholder address is not marked confirmed', invalid.window.CoverageFitTransition.propertyConfirmed === false);
check('unavailable state is exposed without false confirmation', invalid.document.documentElement.dataset.transitionProperty === 'unavailable');
invalid.runDelay(360);
check('neutral property milestone is announced without an address claim', invalid.elements.transitionStatus.textContent === 'Preparing home details');

const sanitized = runTransition({
  profile: { propertyAddress: '  500 <b>Market</b> Street\nSan Francisco, CA 94105  ' }
});
check('address markup is removed before display', sanitized.elements.transitionPropertyAddress.textContent === '500 Market Street San Francisco, CA 94105');
check('sanitized address contains no angle brackets', !/[<>]/.test(sanitized.elements.transitionPropertyAddress.textContent));

const reduced = runTransition({
  profile: { reviewContext: 'Non-Renewal Notice', propertyAddress: '77 Oak Avenue, San Jose, CA 95124' },
  reducedMotion: true
});
check('reduced-motion path confirms the property immediately', reduced.elements.transitionProperty.dataset.state === 'confirmed');
check('reduced-motion path preserves property display', reduced.elements.transitionPropertyAddress.textContent === '77 Oak Avenue, San Jose, CA 95124');
check('reduced-motion completion timing remains bounded', reduced.timers[0].delay === 350);

const fallback = runTransition({ profile: null, hasProfile: false, reducedMotion: true });
check('missing profile keeps the property card hidden', fallback.elements.transitionProperty.hidden === true);
check('missing profile cannot be marked property-confirmed', fallback.window.CoverageFitTransition.propertyConfirmed === false);
check('missing profile preserves the neutral fallback timeline', fallback.stepNodes[1].labelNode.textContent === 'Review tools ready');

console.log(`TX-1.5 QA: ${checks.length}/${checks.length} passed`);
