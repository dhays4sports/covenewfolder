const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const html = fs.readFileSync(`${root}/transition/index.html`, 'utf8');
const source = fs.readFileSync(`${root}/assets/js/transition-route.js`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('transition kicker has a personalization target', html.includes('id="transitionKicker"'));
check('final kicker has a personalization target', html.includes('id="transitionFinalKicker"'));
check('final message has a personalization target', html.includes('id="transitionFinalMessage"'));
check('controller version remains compatible at 1.4 or 1.5', ["const VERSION = '1.4'", "const VERSION = '1.5'"].some(token => source.includes(token)));
check('homebuyer personalization is registered', source.includes("homebuyer: Object.freeze"));
check('renewal personalization is registered', source.includes("renewal: Object.freeze"));
check('non-renewal personalization is registered', source.includes("'non-renewal': Object.freeze"));
check('premium-increase personalization is registered', source.includes("'premium-increase': Object.freeze"));
check('non-renewal detection precedes renewal detection', source.indexOf("return 'non-renewal'") < source.indexOf("return 'renewal'"));
check('unknown contexts preserve neutral transition copy', source.includes("return 'general'"));
check('timeline duration remains two seconds', source.includes('const DEFAULT_DELAY = 2000'));
check('URL destination validation remains same-origin', source.includes('parsed.origin !== window.location.origin'));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function createNode({ label = false } = {}) {
  const labelNode = { textContent: '' };
  return {
    dataset: {},
    attributes: {},
    textContent: '',
    href: '',
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

function runTransition({ reviewContext, hasProfile = true, reducedMotion = false }) {
  const profile = hasProfile ? { reviewContext, propertyAddress: '123 Main Street', integration: { source: '408farmers' } } : null;
  const sessionStorage = storage({
    coveragefit_transition_v1: JSON.stringify({ destination: '/home/', hasProfile }),
    ...(profile ? { coveragefit_prospect_profile_v1: JSON.stringify(profile) } : {})
  });
  const localStorage = storage();
  const stepNodes = Array.from({ length: 4 }, () => createNode({ label: true }));
  const elements = {
    transitionKicker: createNode(),
    transitionHeading: createNode(),
    transitionMessage: createNode(),
    transitionStatus: createNode(),
    transitionContinue: createNode(),
    transitionFinal: createNode(),
    transitionFinalKicker: createNode(),
    transitionFinalMessage: createNode()
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

  return { window, document, elements, stepNodes, timers, runDelay, redirected: () => redirected };
}

const homebuyer = runTransition({ reviewContext: 'Buying a Home' });
check('homebuyer reason is normalized', homebuyer.window.CoverageFitTransition.reasonKey === 'homebuyer');
check('homebuyer transition exposes personalized state', homebuyer.window.CoverageFitTransition.personalized === true);
check('homebuyer kicker is tailored', homebuyer.elements.transitionKicker.textContent === 'New Home Coverage Review');
check('homebuyer heading is tailored', homebuyer.elements.transitionHeading.textContent === 'Preparing your new home coverage review');
check('homebuyer supporting copy is tailored', homebuyer.elements.transitionMessage.textContent.includes('last-minute closing issue for your new home'));
check('homebuyer first milestone is tailored', homebuyer.stepNodes[0].labelNode.textContent === 'Your information is secured');
check('homebuyer property milestone is tailored', homebuyer.stepNodes[1].labelNode.textContent === 'New home confirmed');
check('homebuyer final message is tailored', homebuyer.elements.transitionFinalMessage.textContent === 'Preparing your New Home Protection Snapshot');
check('homebuyer browser title is tailored', homebuyer.document.title === 'Preparing Your New Home Review | CoverageFit');
check('homebuyer reason is exposed without raw context', homebuyer.document.documentElement.dataset.transitionReason === 'homebuyer');

const renewal = runTransition({ reviewContext: 'Policy Renewal' });
check('renewal reason is normalized', renewal.window.CoverageFitTransition.reasonKey === 'renewal');
check('renewal heading is tailored', renewal.elements.transitionHeading.textContent === 'Preparing your annual coverage review');
check('renewal timeline is tailored', renewal.stepNodes[2].labelNode.textContent === 'Reviewing renewal priorities');
check('renewal final message is tailored', renewal.elements.transitionFinalMessage.textContent === 'Preparing your Annual Protection Snapshot');

const nonRenewal = runTransition({ reviewContext: 'Non-Renewal Notice' });
check('non-renewal is not misclassified as renewal', nonRenewal.window.CoverageFitTransition.reasonKey === 'non-renewal');
check('non-renewal supporting copy is tailored', nonRenewal.elements.transitionMessage.textContent.includes('productive replacement-coverage conversation'));
check('non-renewal continuity milestone is tailored', nonRenewal.stepNodes[2].labelNode.textContent === 'Identifying coverage continuity priorities');
check('non-renewal final message is tailored', nonRenewal.elements.transitionFinalMessage.textContent === 'Preparing your Coverage Review Snapshot');

const premium = runTransition({ reviewContext: 'Premium Increase' });
check('premium-increase reason is normalized', premium.window.CoverageFitTransition.reasonKey === 'premium-increase');
check('premium-increase copy reframes price', premium.elements.transitionMessage.textContent.includes('before making changes based on price alone'));
check('premium-increase timeline is tailored', premium.stepNodes[2].labelNode.textContent === 'Reviewing protection before price');
check('premium-increase final message is tailored', premium.elements.transitionFinalMessage.textContent === 'Preparing your Protection Review Snapshot');
premium.runDelay(1440);
check('personalized final message is announced accessibly', premium.elements.transitionStatus.textContent === 'Almost ready. Preparing your Protection Review Snapshot.');

const occupational = runTransition({ reviewContext: 'Occupation: Education' });
check('unrecognized occupational context remains general', occupational.window.CoverageFitTransition.reasonKey === 'general');
check('general context is not falsely marked personalized', occupational.window.CoverageFitTransition.personalized === false);
check('general heading remains intent focused', occupational.elements.transitionHeading.textContent === 'Preparing your Protection Snapshot');
check('general milestones remain intact', occupational.stepNodes[2].labelNode.textContent === 'Identifying protection priorities');

const fallback = runTransition({ hasProfile: false, reducedMotion: true });
check('missing profile remains fallback', fallback.document.documentElement.dataset.transitionReason === 'fallback');
check('fallback heading remains neutral', fallback.elements.transitionHeading.textContent === 'Preparing your Protection Snapshot');
check('fallback final message remains neutral', fallback.elements.transitionFinalMessage.textContent === 'Opening CoverageFit');
check('fallback timeline avoids personalized claims', fallback.stepNodes[0].labelNode.textContent === 'CoverageFit opened');

console.log(`TX-1.4 QA: ${checks.length}/${checks.length} passed`);
