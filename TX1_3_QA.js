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

check('timeline contains exactly four staged milestones', (html.match(/data-transition-step=/g) || []).length === 4);
check('contact milestone is present', html.includes('Contact information secured'));
check('property milestone is present', html.includes('Home located'));
check('priority milestone is present', html.includes('Identifying protection priorities'));
check('review-building milestone is present', html.includes('Building your personalized review'));
check('almost-ready message is present', html.includes('Almost Ready…'));
check('Snapshot preparation message is present', html.includes('Preparing your Home Protection Snapshot'));
check('continuous progress bar was removed', !html.includes('transition-progress-block') && !html.includes('transition-progress-labels'));
check('semantic ordered progress list is used', html.includes('<ol class="transition-steps"'));
check('live status remains available to assistive technology', html.includes('id="transitionStatus"') && html.includes('aria-live="polite"'));
check('timeline exposes pending active and complete visual states', css.includes('[data-state="active"]') && css.includes('[data-state="complete"]'));
check('timeline connector is styled', css.includes('.transition-step:not(:last-child)::after'));
check('active step pulse is motion-safe', css.includes('@keyframes transition-step-pulse') && css.includes('prefers-reduced-motion'));
check('final dashboard message has a distinct active state', css.includes('.transition-final[data-state="active"]'));
check('mobile timeline treatment exists', css.includes('.transition-step-label,') && css.includes('margin-left: 37px'));
check('controller version remains compatible at 1.4 or 1.5', ["const VERSION = '1.4'", "const VERSION = '1.5'"].some(token => source.includes(token)));
check('timeline uses bounded 360ms intervals', source.includes('const STEP_INTERVAL = 360'));
check('timeline completes in approximately two seconds', source.includes('const DEFAULT_DELAY = 2000'));
check('ready and fallback milestone sets are distinct', source.includes('PERSONALIZATIONS') && source.includes('FALLBACK_STEPS'));
check('manual completion cancels remaining timeline timers', source.includes('cancelScheduledTimers()'));
check('existing destination validation remains intact', source.includes('parsed.origin !== window.location.origin'));
check('existing transition storage key remains intact', source.includes("coveragefit_transition_v1"));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function createNode({ label = false, final = false } = {}) {
  const labelNode = { textContent: '' };
  const finalMessageNode = { textContent: 'Preparing your Home Protection Snapshot' };
  return {
    dataset: {},
    attributes: {},
    textContent: '',
    href: '',
    listener: null,
    focused: false,
    labelNode,
    finalMessageNode,
    focus() { this.focused = true; },
    addEventListener(_type, callback) { this.listener = callback; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector(selector) {
      if (label && selector === '.transition-step-label') return labelNode;
      if (final && selector === '.transition-final-message') return finalMessageNode;
      return null;
    }
  };
}

function runTransition({ state, profileSeed, reducedMotion = false }) {
  const sessionStorage = storage({
    ...(state ? { coveragefit_transition_v1: JSON.stringify(state) } : {}),
    ...(profileSeed ? { coveragefit_prospect_profile_v1: JSON.stringify(profileSeed) } : {})
  });
  const localStorage = storage();
  const stepNodes = Array.from({ length: 4 }, () => createNode({ label: true }));
  const elements = {
    transitionHeading: createNode(),
    transitionMessage: createNode(),
    transitionStatus: createNode(),
    transitionContinue: createNode(),
    transitionFinal: createNode({ final: true })
  };
  const bodyAttributes = {};
  const timers = [];
  let nextTimerId = 1;
  let redirected = '';

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
  const document = {
    documentElement: { dataset: {} },
    body: { setAttribute: (name, value) => { bodyAttributes[name] = String(value); } },
    getElementById: id => elements[id] || null,
    querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
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

  return {
    window, document, sessionStorage, stepNodes, elements, bodyAttributes, timers,
    runDelay,
    redirected: () => redirected
  };
}

const ready = runTransition({ state: { destination: '/assessment/', hasProfile: true }, profileSeed: { propertyAddress: '123 Main Street' } });
check('first milestone is active immediately', ready.stepNodes[0].dataset.state === 'active');
check('remaining milestones begin pending', ready.stepNodes.slice(1).every(node => node.dataset.state === 'pending'));
check('first milestone is announced immediately', ready.elements.transitionStatus.textContent === 'Contact information secured');
check('timeline schedules four advances and completion', JSON.stringify(ready.timers.map(timer => timer.delay)) === JSON.stringify([360, 720, 1080, 1440, 2000]));

ready.runDelay(360);
check('first milestone completes at 360ms', ready.stepNodes[0].dataset.state === 'complete');
check('home milestone activates at 360ms', ready.stepNodes[1].dataset.state === 'active');
check('home milestone updates live status with confirmed address', ready.elements.transitionStatus.textContent === 'Home confirmed for 123 Main Street');

ready.runDelay(720);
check('priority milestone activates at 720ms', ready.stepNodes[2].dataset.state === 'active');
ready.runDelay(1080);
check('review-building milestone activates at 1080ms', ready.stepNodes[3].dataset.state === 'active');
ready.runDelay(1440);
check('all milestones complete before final hold', ready.stepNodes.every(node => node.dataset.state === 'complete'));
check('final Snapshot message activates at 1440ms', ready.elements.transitionFinal.dataset.state === 'active');
check('final Snapshot message is announced', ready.elements.transitionStatus.textContent === 'Almost ready. Preparing your Home Protection Snapshot.');
check('timeline exposes final presentation state', ready.document.documentElement.dataset.transitionStep === 'final');

ready.runDelay(2000);
check('busy state clears only when timeline completes', ready.bodyAttributes['aria-busy'] === 'false');
check('transition session is cleared only at completion', ready.sessionStorage.getItem('coveragefit_transition_v1') === null);
check('exit navigation is scheduled after the two-second sequence', ready.timers.some(timer => timer.delay === 160 && !timer.cancelled));
ready.runDelay(160);
check('ready timeline preserves original destination', ready.redirected() === '/assessment/');

const fallback = runTransition({ state: { destination: 'https://evil.example/' }, reducedMotion: true });
check('fallback timeline avoids false contact claims', fallback.stepNodes[0].labelNode.textContent === 'CoverageFit opened');
check('fallback timeline avoids false property claims', fallback.stepNodes[1].labelNode.textContent === 'Review tools ready');
check('reduced motion completes visual milestones immediately', fallback.stepNodes.every(node => node.dataset.state === 'complete'));
check('fallback final message becomes neutral', fallback.elements.transitionFinal.finalMessageNode.textContent === 'Opening CoverageFit');
check('reduced motion preserves bounded continuation timing', fallback.timers[0].delay === 350);
fallback.runDelay(350);
fallback.runDelay(0);
check('unsafe fallback destination resolves to CoverageFit home', fallback.redirected() === '/home/');

const manual = runTransition({ state: { destination: '/home/', hasProfile: true } });
manual.elements.transitionContinue.listener({ preventDefault() {} });
check('manual continuation cancels staged timers', manual.timers.filter(timer => [360, 720, 1080, 1440, 2000].includes(timer.delay)).every(timer => timer.cancelled));
manual.runDelay(160);
check('manual continuation still reaches the intended destination', manual.redirected() === '/home/');

console.log(`TX-1.3 QA: ${checks.length}/${checks.length} passed`);
