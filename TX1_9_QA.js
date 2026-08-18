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

check('transition heading remains the stable programmatic focus target', html.includes('id="transitionHeading" tabindex="-1" data-transition-focus-target'));
check('shared motion easing tokens are scoped to the transition page', css.includes('--transition-ease-standard:') && css.includes('--transition-ease-emphasized:'));
check('shared motion duration tokens are present', css.includes('--transition-duration-fast: 160ms') && css.includes('--transition-duration-standard: 240ms') && css.includes('--transition-duration-enter: 520ms'));
check('transition CSS avoids broad transition-all declarations', !/transition\s*:\s*all\b/.test(css));
check('desktop entrance uses the emphasized easing token', css.includes('transition-shell-enter var(--transition-duration-enter) var(--transition-ease-emphasized)'));
check('desktop exit fades both shell and ambient layer', css.includes('html[data-transition-phase="leaving"] .transition-shell') && css.includes('html[data-transition-phase="leaving"] .transition-ambient'));
check('active milestone pulse was softened', css.includes('scale(.985)') && css.includes('scale(1.018)'));
check('brand-ring motion was softened', css.includes('scale(.975)') && css.includes('scale(1.025)'));
check('mobile transition uses a dedicated translation-only entrance', css.includes('@keyframes transition-shell-enter-mobile') && css.includes('animation-name: transition-shell-enter-mobile'));
check('mobile transition disables backdrop blur', css.includes('backdrop-filter: none') && css.includes('-webkit-backdrop-filter: none'));
check('mobile manual-continue target meets 44px touch guidance', css.includes('min-height: 44px'));
check('mobile exit removes scaling', css.includes('html[data-transition-phase="leaving"] .transition-shell {\n    transform: translateY(-2px);'));
check('reduced motion removes decorative ambient content', css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('.transition-ambient {\n    display: none;'));
check('reduced motion disables animated transforms during exit', css.includes('html[data-transition-phase="leaving"] .transition-shell {\n    opacity: 1;\n    transform: none;'));
check('reduced motion resets scroll behavior', css.includes('scroll-behavior: auto'));
check('programmatic focus is deferred through requestAnimationFrame', source.includes("typeof window.requestAnimationFrame === 'function'") && source.includes('window.requestAnimationFrame(focusTransition)'));
check('focus falls back safely when requestAnimationFrame is unavailable', source.includes('focusTransition();'));
check('focus uses preventScroll', source.includes("heading.focus({ preventScroll: true })"));
check('motion preference is exposed only as a non-PII document state', source.includes("dataset.transitionMotion = reducedMotion ? 'reduced' : 'full'"));
check('scheduled timers are removed from the registry when cleaned', source.includes('while (scheduledTimers.length) window.clearTimeout(scheduledTimers.pop())'));
check('focus frame cleanup is implemented', source.includes('const cancelFocusFrame'));
check('page-exit cleanup is registered once', source.includes("window.addEventListener('pagehide', cleanupRuntime, { once: true })"));
check('existing two-second onboarding duration remains unchanged', source.includes('const DEFAULT_DELAY = 2000'));
check('existing 160ms exit duration remains unchanged', source.includes('const EXIT_DELAY = 160'));
check('no new transition messages or routes were introduced', !html.includes('dashboard-first') && !source.includes("'/dashboard/'"));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  };
}

function createNode({ label = false, final = false, hidden = false } = {}) {
  const labelNode = { textContent: '' };
  const finalMessageNode = { textContent: 'Preparing your Home Protection Snapshot' };
  return {
    dataset: {},
    attributes: {},
    textContent: '',
    href: '',
    hidden,
    focused: false,
    listener: null,
    focusOptions: null,
    focus(options) { this.focused = true; this.focusOptions = options; },
    addEventListener(_type, callback) { this.listener = callback; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector(selector) {
      if (label && selector === '.transition-step-label') return labelNode;
      if (final && selector === '.transition-final-message') return finalMessageNode;
      return null;
    },
    labelNode,
    finalMessageNode
  };
}

function runTransition({ reducedMotion = false, withAnimationFrame = true } = {}) {
  const sessionId = 'session-tx19';
  const sessionStorage = storage({
    coveragefit_transition_v1: JSON.stringify({ destination: '/home/', hasProfile: true }),
    coveragefit_prospect_profile_v1: JSON.stringify({
      firstName: 'Dylan',
      propertyAddress: '123 Main Street, Fremont, CA 94539',
      reviewContext: 'Buying a Home',
      integration: { sessionId }
    })
  });
  const localStorage = storage();
  const stepNodes = Array.from({ length: 4 }, () => createNode({ label: true }));
  const elements = {
    transitionKicker: createNode(),
    transitionHeading: createNode(),
    transitionMessage: createNode(),
    transitionStatus: createNode(),
    transitionContinue: createNode(),
    transitionFinal: createNode({ final: true }),
    transitionFinalKicker: createNode(),
    transitionFinalMessage: createNode(),
    transitionProperty: createNode({ hidden: true }),
    transitionPropertyLabel: createNode(),
    transitionPropertyAddress: createNode(),
    transitionPropertyDetail: createNode()
  };
  const timers = [];
  const frames = [];
  const listeners = {};
  let nextTimerId = 1;
  let nextFrameId = 1;
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
    },
    addEventListener(type, callback, options) { listeners[type] = { callback, options }; }
  };
  if (withAnimationFrame) {
    window.requestAnimationFrame = callback => {
      const frame = { id: nextFrameId++, callback, cancelled: false, ran: false };
      frames.push(frame);
      return frame.id;
    };
    window.cancelAnimationFrame = id => {
      const frame = frames.find(item => item.id === id);
      if (frame) frame.cancelled = true;
    };
  }
  Object.assign(window, {
    window,
    document,
    sessionStorage,
    localStorage,
    URL,
    CoverageFitPersonalization: {
      get: () => ({
        sessionId,
        identity: { givenName: 'Dylan' },
        property: { displayAddress: '123 Main Street, Fremont, CA 94539' },
        journey: { reasonKey: 'homebuyer' },
        flags: { hasProfile: true }
      })
    }
  });
  const context = { window, document, sessionStorage, localStorage, URL, Date, Number, Object, console };
  vm.createContext(context);
  vm.runInContext(source, context);

  const runFrame = () => {
    const frame = frames.find(item => !item.ran && !item.cancelled);
    assert(frame, 'Missing active animation frame');
    frame.ran = true;
    frame.callback();
  };
  return { window, document, elements, stepNodes, timers, frames, listeners, bodyAttributes, runFrame, redirected: () => redirected };
}

const fullMotion = runTransition();
check('full-motion mode is recorded in document state', fullMotion.document.documentElement.dataset.transitionMotion === 'full');
check('heading focus waits for the first painted frame', fullMotion.elements.transitionHeading.focused === false && fullMotion.frames.length === 1);
fullMotion.runFrame();
check('heading receives focus after the first painted frame', fullMotion.elements.transitionHeading.focused === true);
check('deferred focus prevents scrolling', fullMotion.elements.transitionHeading.focusOptions.preventScroll === true);
check('focus readiness is recorded after focus succeeds', fullMotion.document.documentElement.dataset.transitionFocus === 'ready');
check('pagehide listener is registered once', fullMotion.listeners.pagehide.options.once === true);
check('polish preserves existing timeline schedule', JSON.stringify(fullMotion.timers.map(timer => timer.delay)) === JSON.stringify([360, 720, 1080, 1440, 2000]));

const fallbackFocus = runTransition({ withAnimationFrame: false });
check('browsers without requestAnimationFrame receive immediate safe focus', fallbackFocus.elements.transitionHeading.focused === true);

const manual = runTransition();
manual.elements.transitionContinue.listener({ preventDefault() {} });
check('manual continuation cancels the pending focus frame', manual.frames[0].cancelled === true);
check('manual continuation cancels staged timeline timers', manual.timers.filter(timer => [360, 720, 1080, 1440, 2000].includes(timer.delay)).every(timer => timer.cancelled));
check('manual continuation still schedules the existing exit delay', manual.timers.some(timer => timer.delay === 160 && !timer.cancelled));

const abandoned = runTransition();
abandoned.listeners.pagehide.callback();
check('pagehide cleanup cancels every pending timeline timer', abandoned.timers.every(timer => timer.cancelled));
check('pagehide cleanup cancels the pending focus frame', abandoned.frames[0].cancelled === true);

const reduced = runTransition({ reducedMotion: true });
check('reduced-motion mode is recorded in document state', reduced.document.documentElement.dataset.transitionMotion === 'reduced');
check('reduced motion preserves the existing bounded 350ms continuation', reduced.timers.length === 1 && reduced.timers[0].delay === 350);
check('reduced motion immediately completes the visible timeline', reduced.stepNodes.every(node => node.dataset.state === 'complete'));
check('public transition API remains free of name and address values', !Object.prototype.hasOwnProperty.call(reduced.window.CoverageFitTransition, 'propertyAddress') && !Object.prototype.hasOwnProperty.call(reduced.window.CoverageFitTransition, 'givenName'));

console.log(`TX-1.9 QA: ${checks.length}/${checks.length} passed`);
