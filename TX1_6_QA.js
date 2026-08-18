const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const homeHtml = fs.readFileSync(`${root}/home/index.html`, 'utf8');
const pagesCss = fs.readFileSync(`${root}/assets/css/pages.css`, 'utf8');
const heroSource = fs.readFileSync(`${root}/assets/js/hero-personalization.js`, 'utf8');
const welcomeSource = fs.readFileSync(`${root}/assets/js/home-welcome.js`, 'utf8');
const transitionSource = fs.readFileSync(`${root}/assets/js/transition-route.js`, 'utf8');
const prefillSource = fs.readFileSync(`${root}/assets/js/prefill-intake.js`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('existing home hero is the personalized destination surface', homeHtml.includes('data-coveragefit-welcome'));
check('welcome readiness status is integrated into the existing hero', homeHtml.includes('id="personalizedWelcome"'));
check('welcome status begins hidden for ordinary visitors', /id="personalizedWelcome"[^>]*hidden/.test(homeHtml) || /hidden[^>]*id="personalizedWelcome"/.test(homeHtml));
check('existing hero heading has safe text targets', homeHtml.includes('data-welcome-heading-main') && homeHtml.includes('data-welcome-heading-highlight'));
check('existing hero copy and CTA have personalization targets', homeHtml.includes('data-welcome-lead') && homeHtml.includes('data-welcome-copy') && homeHtml.includes('data-welcome-note') && homeHtml.includes('data-welcome-cta'));
check('hero component runtime loads before welcome controller', homeHtml.indexOf('/assets/js/hero-personalization.js') > homeHtml.indexOf('/assets/js/personalization-context.js') && homeHtml.indexOf('/assets/js/hero-personalization.js') < homeHtml.indexOf('/assets/js/home-welcome.js'));
check('welcome presentation is responsive and hidden-state safe', pagesCss.includes('.personalized-welcome[hidden]') && pagesCss.includes('@media(max-width:520px){.personalized-welcome'));
check('personalized hero state has integrated visual treatment', pagesCss.includes('data-welcome-state="personalized"'));
check('transition writes a dedicated non-URL welcome receipt', transitionSource.includes("const WELCOME_STORAGE_KEY = 'coveragefit_transition_welcome_v1'") && transitionSource.includes('sessionStorage.setItem(WELCOME_STORAGE_KEY'));
check('new handoffs clear stale welcome receipts', prefillSource.includes('sessionStorage.removeItem(WELCOME_STORAGE_KEY)'));
check('hero components use textContent only', !heroSource.includes('innerHTML') && heroSource.includes('node.textContent ='));
check('welcome receipt is time bounded', welcomeSource.includes('const MAX_RECEIPT_AGE = 30 * 60 * 1000'));
check('welcome requires the home destination', welcomeSource.includes("parsed.pathname === '/home/'") && welcomeSource.includes("parsed.pathname === '/home'"));
check('public welcome API remains limited to version, active, and reason key', welcomeSource.includes('window.CoverageFitWelcome = Object.freeze') && welcomeSource.includes('active: true,\n    reasonKey')) ;

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    dump: key => map.get(key)
  };
}

function node({ label = false, hidden = false, text = '' } = {}) {
  const labelNode = { textContent: '' };
  return {
    dataset: {},
    attributes: {},
    textContent: text,
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

function runTransitionToReceipt({ reason = 'Buying a Home', destination = '/home/', sessionId = 'cf-session-123' } = {}) {
  const profile = {
    firstName: 'Test',
    lastName: 'Prospect',
    propertyAddress: '123 Main Street, Fremont, CA 94539',
    reviewContext: reason,
    integration: { source: '408farmers', sessionId }
  };
  const sessionStorage = storage({
    coveragefit_transition_v1: JSON.stringify({ destination, hasProfile: true }),
    coveragefit_prospect_profile_v1: JSON.stringify(profile)
  });
  const localStorage = storage();
  const stepNodes = Array.from({ length: 4 }, () => node({ label: true }));
  const elements = {
    transitionKicker: node(), transitionHeading: node(), transitionMessage: node(), transitionStatus: node(),
    transitionContinue: node(), transitionFinal: node(), transitionFinalKicker: node(), transitionFinalMessage: node(),
    transitionProperty: node({ hidden: true }), transitionPropertyLabel: node(), transitionPropertyAddress: node(), transitionPropertyDetail: node()
  };
  const timers = [];
  let nextTimerId = 1;
  const document = {
    title: 'Preparing Your CoverageFit Review',
    documentElement: { dataset: {} },
    body: { setAttribute() {} },
    getElementById: id => elements[id] || null,
    querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
  };
  const window = {
    location: { origin: 'https://coveragefit.com', href: '', replace() {} },
    matchMedia: () => ({ matches: true }),
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
  vm.runInContext(transitionSource, context);
  const completion = timers.find(item => item.delay === 350 && !item.cancelled);
  assert(completion, 'Reduced-motion completion timer missing');
  completion.callback();
  return { sessionStorage, localStorage, profile, receipt: JSON.parse(sessionStorage.getItem('coveragefit_transition_welcome_v1')) };
}

function runWelcome({ receipt, profile, localProfile = false } = {}) {
  const sessionSeed = {};
  const localSeed = {};
  if (receipt) sessionSeed.coveragefit_transition_welcome_v1 = JSON.stringify(receipt);
  if (profile) (localProfile ? localSeed : sessionSeed).coveragefit_prospect_profile_v1 = JSON.stringify(profile);
  const sessionStorage = storage(sessionSeed);
  const localStorage = storage(localSeed);
  const elements = {
    personalizedWelcome: node({ hidden: true }),
    personalizedWelcomeStatus: node({ text: 'Personalized review ready' }),
    personalizedWelcomeDetail: node({ text: 'Your onboarding is complete.' })
  };
  const selectors = {
    '[data-hero-reason-banner]': node({ text: 'CoverageFit Home' }),
    '[data-welcome-kicker]': node({ text: 'CoverageFit Home' }),
    '[data-hero-greeting]': node(),
    '[data-hero-journey-context]': elements.personalizedWelcome,
    '[data-hero-dynamic-cta]': node(),
    '[data-welcome-heading-main]': node({ text: 'Shopping for' }),
    '[data-welcome-heading-highlight]': node({ text: 'home insurance?' }),
    '[data-welcome-lead]': node({ text: 'Most homeowners need better questions.' }),
    '[data-welcome-copy]': node({ text: 'Review your protection.' }),
    '[data-welcome-note]': node({ text: 'You are starting with a Coverage Review.' }),
    '[data-welcome-context-reason]': node({ text: 'Personalized home review' }),
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
  const window = { location: { origin: 'https://coveragefit.com', pathname: '/home/' } };
  Object.assign(window, { window, document, sessionStorage, localStorage, URL });
  const context = { window, document, sessionStorage, localStorage, URL, Date, Number, Object, console };
  vm.createContext(context);
  vm.runInContext(heroSource, context);
  vm.runInContext(welcomeSource, context);
  return { window, document, elements, selectors, sessionStorage, localStorage };
}

const transition = runTransitionToReceipt();
check('completed transition stores a welcome receipt', Boolean(transition.receipt));
check('welcome receipt identifies completed handoff without contact or address data', transition.receipt.hasProfile === true && !('firstName' in transition.receipt) && !('propertyAddress' in transition.receipt));
check('welcome receipt preserves normalized homebuyer context', transition.receipt.reasonKey === 'homebuyer');
check('welcome receipt preserves the safe destination', transition.receipt.destination === '/home/');
check('transition state is still removed at completion', transition.sessionStorage.getItem('coveragefit_transition_v1') === null);

const homebuyer = runWelcome({ receipt: transition.receipt, profile: transition.profile });
check('fresh matching receipt activates personalized welcome', homebuyer.window.CoverageFitWelcome.active === true);
check('homebuyer context is exposed without PII', homebuyer.window.CoverageFitWelcome.reasonKey === 'homebuyer' && Object.keys(homebuyer.window.CoverageFitWelcome).length === 3);
check('personalized welcome status is revealed', homebuyer.elements.personalizedWelcome.hidden === false);
check('homebuyer hero acknowledges the prospect and new home journey', homebuyer.selectors['[data-welcome-heading-main]'].textContent === 'Welcome, Test.' && homebuyer.selectors['[data-welcome-heading-highlight]'].textContent === 'Let’s review the protection your new home may need.');
check('homebuyer CTA is contextual', homebuyer.selectors['[data-welcome-cta]'].textContent === 'Begin My New Home Review');
check('homebuyer title is contextual', homebuyer.document.title === 'Your New Home Coverage Review Is Ready | CoverageFit');
check('document records personalized state without profile data', homebuyer.document.documentElement.dataset.welcomeState === 'personalized' && homebuyer.document.documentElement.dataset.welcomeReason === 'homebuyer');

const reasonExpectations = {
  renewal: ['Let’s review what still fits before your renewal.', 'Begin My Annual Review'],
  'non-renewal': ['Let’s build clarity before your next coverage decision.', 'Begin My Coverage Review'],
  'premium-increase': ['Review your protection before changing it for price.', 'Begin My Protection Review'],
  general: ['Let’s understand your home protection.', 'Begin My Home Coverage Review']
};
for (const [reasonKey, [highlight, cta]] of Object.entries(reasonExpectations)) {
  const receipt = { ...transition.receipt, reasonKey, completedAt: new Date().toISOString() };
  const result = runWelcome({ receipt, profile: transition.profile, localProfile: reasonKey === 'renewal' });
  check(`${reasonKey} welcome uses its intended hero emphasis`, result.selectors['[data-welcome-heading-highlight]'].textContent === highlight);
  check(`${reasonKey} welcome uses its intended CTA`, result.selectors['[data-welcome-cta]'].textContent === cta);
}

const direct = runWelcome({ profile: transition.profile });
check('ordinary visitor with no completion receipt keeps the generic hero', direct.window.CoverageFitWelcome.active === false && direct.elements.personalizedWelcome.hidden === true);
check('ordinary visitor generic heading remains unchanged', direct.selectors['[data-welcome-heading-main]'].textContent === 'Shopping for');
check('ordinary visitor document state remains default', direct.document.documentElement.dataset.welcomeState === 'default');

const stale = runWelcome({
  receipt: { ...transition.receipt, completedAt: new Date(Date.now() - (31 * 60 * 1000)).toISOString() },
  profile: transition.profile
});
check('stale receipt cannot personalize the destination', stale.window.CoverageFitWelcome.active === false);

const wrongDestination = runWelcome({
  receipt: { ...transition.receipt, destination: '/assessment/', completedAt: new Date().toISOString() },
  profile: transition.profile
});
check('receipt for a different destination cannot personalize home', wrongDestination.window.CoverageFitWelcome.active === false);

const mismatched = runWelcome({
  receipt: { ...transition.receipt, sessionId: 'other-session', completedAt: new Date().toISOString() },
  profile: transition.profile
});
check('mismatched integration session cannot personalize home', mismatched.window.CoverageFitWelcome.active === false);

const unknown = runWelcome({
  receipt: { ...transition.receipt, reasonKey: 'occupation-education', completedAt: new Date().toISOString() },
  profile: transition.profile
});
check('unknown context receives neutral welcome instead of incorrect reason copy', unknown.window.CoverageFitWelcome.active === true && unknown.window.CoverageFitWelcome.reasonKey === 'general');
check('neutral unknown context retains a truthful CTA', unknown.selectors['[data-welcome-cta]'].textContent === 'Begin My Home Coverage Review');

console.log(`TX-1.6 QA: ${checks.length}/${checks.length} passed`);
