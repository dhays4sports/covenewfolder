const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root = __dirname;
const engineSource = fs.readFileSync(`${root}/assets/js/personalization-context.js`, 'utf8');
const prefillSource = fs.readFileSync(`${root}/assets/js/prefill-intake.js`, 'utf8');
const transitionSource = fs.readFileSync(`${root}/assets/js/transition-route.js`, 'utf8');
const heroSource = fs.readFileSync(`${root}/assets/js/hero-personalization.js`, 'utf8');
const welcomeSource = fs.readFileSync(`${root}/assets/js/home-welcome.js`, 'utf8');
const assessmentPrefillSource = fs.readFileSync(`${root}/assets/js/assessment-prefill.js`, 'utf8');
const contactPrefillSource = fs.readFileSync(`${root}/assets/js/contact-prefill.js`, 'utf8');
const assessmentEngineSource = fs.readFileSync(`${root}/assets/js/assessment-engine.js`, 'utf8');
const transitionHtml = fs.readFileSync(`${root}/transition/index.html`, 'utf8');
const homeHtml = fs.readFileSync(`${root}/home/index.html`, 'utf8');
const assessmentHtml = fs.readFileSync(`${root}/assessment/index.html`, 'utf8');

const checks = [];
const check = (name, pass) => {
  assert(pass, name);
  checks.push(name);
};

check('personalization engine uses a versioned session key', engineSource.includes("coveragefit_personalization_context_v1"));
check('personalization context remains session-scoped', engineSource.includes('writeJson(sessionStorage, STORAGE_KEY, normalized)') && !engineSource.includes('writeJson(localStorage, STORAGE_KEY, normalized)'));
check('canonical context includes identity, contact, property, journey, flags, and provenance', ['identity:', 'contact:', 'property:', 'journey:', 'flags:', 'provenance:'].every(token => engineSource.includes(token)));
check('canonical journey includes campaign, referral source, entry point, review reason, and assessment', ['campaign,', 'referralSource,', 'entryPoint,', 'reviewReason,', 'assessment,'].every(token => engineSource.includes(token)));
check('non-renewal classification precedes renewal classification', engineSource.indexOf("return 'non-renewal'") < engineSource.indexOf("return 'renewal'"));
check('new handoffs clear stale canonical context', prefillSource.includes('sessionStorage.removeItem(PERSONALIZATION_STORAGE_KEY)'));
check('transition loads engine before its controller', transitionHtml.indexOf('/assets/js/personalization-context.js') < transitionHtml.indexOf('/assets/js/transition-route.js'));
check('home loads attribution, engine, and hero components before welcome consumer', homeHtml.indexOf('/assets/js/attribution.js') < homeHtml.indexOf('/assets/js/personalization-context.js') && homeHtml.indexOf('/assets/js/personalization-context.js') < homeHtml.indexOf('/assets/js/hero-personalization.js') && homeHtml.indexOf('/assets/js/hero-personalization.js') < homeHtml.indexOf('/assets/js/home-welcome.js'));
check('assessment loads engine before prefill consumers', assessmentHtml.indexOf('/assets/js/personalization-context.js') < assessmentHtml.indexOf('/assets/js/assessment-prefill.js') && assessmentHtml.indexOf('/assets/js/personalization-context.js') < assessmentHtml.indexOf('/assets/js/contact-prefill.js'));
check('transition consumes canonical reason, address, name, and session', ['personalizationContext?.journey?.reasonKey', 'personalizationContext?.property?.displayAddress', 'personalizationContext?.identity?.givenName', 'personalizationContext?.sessionId'].every(token => transitionSource.includes(token)));
check('home welcome and hero components consume canonical reason, identity, property, and session', ['personalizationContext?.journey?.reasonKey', 'personalizationContext?.sessionId'].every(token => welcomeSource.includes(token)) && ['context?.identity?.givenName', 'context?.property?.displayAddress'].every(token => heroSource.includes(token)));
check('assessment and contact prefill prefer canonical context', assessmentPrefillSource.includes('CoverageFitPersonalization?.get?.()') && contactPrefillSource.includes('CoverageFitPersonalization?.get?.()'));
check('assessment report payload carries canonical context and integration', /personalizationContext:\s*personalization/.test(assessmentEngineSource) && /referralSource:\s*(?:report\.integration\?\.referralSource\s*\|\|\s*referral\.referralSource\s*\|\|\s*journey\.referralSource|referral\.active\s*\?\s*referral\.referralSource)/.test(assessmentEngineSource));

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    dump: key => map.get(key)
  };
}

function runEngine({ profile = null, attribution = null, attributionPayload = null, sessionSeed = {}, localSeed = {}, referrer = '' } = {}) {
  const sessionStorage = storage(sessionSeed);
  const localStorage = storage(localSeed);
  if (profile) sessionStorage.setItem('coveragefit_prospect_profile_v1', JSON.stringify(profile));
  const events = [];
  const document = { referrer };
  const window = {
    location: { origin: 'https://coveragefit.com', pathname: '/home/' },
    CoverageFitAttribution: attribution || attributionPayload ? {
      get: () => attribution,
      getPayload: () => attributionPayload
    } : undefined,
    dispatchEvent: event => events.push(event)
  };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options?.detail; }
  }
  Object.assign(window, { window, document, sessionStorage, localStorage, URL, CustomEvent });
  const context = { window, document, sessionStorage, localStorage, URL, CustomEvent, Date, Object, console };
  vm.createContext(context);
  vm.runInContext(engineSource, context);
  return { window, document, sessionStorage, localStorage, events, context: window.CoverageFitPersonalization.get() };
}

const profile = {
  firstName: ' Dylan ',
  lastName: ' Haysbert ',
  fullName: 'Dylan Haysbert',
  email: 'DYLAN@example.com',
  phone: '(408) 327-6377',
  propertyAddress: '123 Main Street, Fremont, CA 94539',
  reviewContext: 'Non-Renewal Notice',
  address: {
    street: '123 Main Street', city: 'Fremont', county: 'Alameda', state: 'CA', postalCode: '94539', country: 'US', placeId: 'place-123', selectionMethod: 'autocomplete'
  },
  integration: {
    source: '408farmers', campaign: 'door_hanger_home', entry: 'home_lander_form', assessment: 'home', sessionId: 'shared-session-123', handoffVersion: '1', prefilled: true
  },
  receivedAt: '2026-08-02T07:00:00.000Z'
};
const attribution = {
  sessionId: 'coveragefit-generated-session',
  source: 'meta',
  campaign: 'fallback-campaign',
  entry: 'fallback-entry',
  assessment: 'home',
  medium: 'paid-social'
};
const attributionPayload = {
  sessionId: 'coveragefit-generated-session',
  firstTouch: { ref: 'door-hanger-qr', path: '/home/' },
  lastTouch: { ref: 'realtor-partner', utm_medium: 'qr' }
};
const normalized = runEngine({ profile, attribution, attributionPayload });
const value = normalized.context;
check('profile session ID takes precedence over generated attribution session', value.sessionId === 'shared-session-123');
check('identity is normalized into one canonical shape', value.identity.givenName === 'Dylan' && value.identity.familyName === 'Haysbert' && value.identity.displayName === 'Dylan Haysbert');
check('contact details are normalized', value.contact.email === 'dylan@example.com' && value.contact.phone === '(408) 327-6377');
check('property details are normalized', value.property.displayAddress === '123 Main Street, Fremont, CA 94539' && value.property.postalCode === '94539');
check('review reason is normalized with non-renewal precedence', value.journey.reviewReason === 'Non-Renewal Notice' && value.journey.reasonKey === 'non-renewal');
check('profile campaign, source, and entry take precedence', value.journey.source === '408farmers' && value.journey.campaign === 'door_hanger_home' && value.journey.entryPoint === 'home_lander_form');
check('referral source is recovered from attribution payload', value.journey.referralSource === 'realtor-partner');
check('canonical context records expected readiness flags', value.flags.hasProfile && value.flags.hasName && value.flags.hasAddress && value.flags.hasAttribution);
check('canonical context is persisted in session storage', JSON.parse(normalized.sessionStorage.dump('coveragefit_personalization_context_v1')).journey.campaign === 'door_hanger_home');
check('canonical context is deeply immutable', Object.isFrozen(value) && Object.isFrozen(value.identity) && Object.isFrozen(value.journey));
check('readiness event omits contact and property values', normalized.events[0].detail.hasName === true && normalized.events[0].detail.hasAddress === true && !('email' in normalized.events[0].detail) && !('displayAddress' in normalized.events[0].detail));

const structuredOnly = runEngine({
  profile: {
    firstName: 'Avery', reviewContext: 'Buying a Home',
    address: { street: '77 Oak Avenue', city: 'San Jose', state: 'CA', postalCode: '95124' },
    integration: { sessionId: 'structured-session', source: '408farmers' }
  }
});
check('structured address fields assemble a display address', structuredOnly.context.property.displayAddress === '77 Oak Avenue, San Jose, CA 95124');
check('home purchase context normalizes to homebuyer', structuredOnly.context.journey.reasonKey === 'homebuyer');

const staleContext = {
  version: '1.0', sessionId: 'old-session',
  identity: { givenName: 'Old', familyName: 'Visitor', displayName: 'Old Visitor' },
  contact: { email: 'old@example.com', phone: '' },
  property: { displayAddress: '1 Old Street' },
  journey: { reviewReason: 'Policy Renewal', reasonKey: 'renewal', source: 'old-source', campaign: 'old-campaign', referralSource: '', entryPoint: 'old-entry', assessment: 'home', medium: '', handoffVersion: '1', prefilled: true },
  flags: { hasProfile: true }, provenance: {}
};
const newSession = runEngine({
  attribution: { sessionId: 'new-session', source: 'direct', campaign: '', entry: '/home/', assessment: 'home', medium: '' },
  attributionPayload: { sessionId: 'new-session', firstTouch: { path: '/home/' }, lastTouch: {} },
  sessionSeed: { coveragefit_personalization_context_v1: JSON.stringify(staleContext) }
});
check('a new session does not inherit stale identity or property data', newSession.context.sessionId === 'new-session' && newSession.context.identity.displayName === '' && newSession.context.property.displayAddress === '');

const staleLocalProfile = runEngine({
  attribution: { sessionId: 'current-browser-session', source: 'direct', campaign: '', entry: '/home/', assessment: 'home', medium: '' },
  attributionPayload: { sessionId: 'current-browser-session', firstTouch: { path: '/home/' }, lastTouch: {} },
  localSeed: { coveragefit_prospect_profile_v1: JSON.stringify(profile) }
});
check('a local profile from another session is not reused as active personalization', staleLocalProfile.context.sessionId === 'current-browser-session' && staleLocalProfile.context.flags.hasProfile === false && staleLocalProfile.context.identity.displayName === '');

function node({ hidden = false, text = '' } = {}) {
  return { textContent: text, hidden, dataset: {}, setAttribute() {}, removeAttribute() {} };
}
function runWelcomeWithContext() {
  const receipt = { version: '1.0', hasProfile: true, reasonKey: 'non-renewal', destination: '/home/', sessionId: 'shared-session-123', completedAt: new Date().toISOString() };
  const sessionStorage = storage({
    coveragefit_prospect_profile_v1: JSON.stringify(profile),
    coveragefit_transition_welcome_v1: JSON.stringify(receipt)
  });
  const localStorage = storage();
  const elements = {
    personalizedWelcome: node({ hidden: true }),
    personalizedWelcomeStatus: node(),
    personalizedWelcomeDetail: node()
  };
  const selectors = {
    '[data-hero-reason-banner]': node(), '[data-welcome-kicker]': node(), '[data-hero-greeting]': node(),
    '[data-hero-journey-context]': elements.personalizedWelcome, '[data-hero-dynamic-cta]': node(),
    '[data-welcome-heading-main]': node(), '[data-welcome-heading-highlight]': node(),
    '[data-welcome-lead]': node(), '[data-welcome-copy]': node(), '[data-welcome-note]': node(),
    '[data-welcome-context-reason]': node(), '[data-welcome-context-property]': node({ hidden: true }),
    '[data-welcome-cta]': node(), '[data-welcome-cta-context]': node({ hidden: true })
  };
  const document = {
    referrer: '', title: 'CoverageFit Home', documentElement: { dataset: {} },
    getElementById: id => elements[id] || null,
    querySelector: selector => selectors[selector] || null
  };
  const attr = { sessionId: 'shared-session-123', source: 'direct', campaign: '', entry: '/home/', assessment: 'home', medium: '' };
  const window = {
    location: { origin: 'https://coveragefit.com', pathname: '/home/' },
    CoverageFitAttribution: { get: () => attr, getPayload: () => ({ sessionId: 'shared-session-123', firstTouch: { path: '/home/' }, lastTouch: {} }) },
    dispatchEvent() {}
  };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } }
  Object.assign(window, { window, document, sessionStorage, localStorage, URL, CustomEvent });
  const context = { window, document, sessionStorage, localStorage, URL, CustomEvent, Date, Number, Object, console };
  vm.createContext(context);
  vm.runInContext(engineSource, context);
  vm.runInContext(heroSource, context);
  vm.runInContext(welcomeSource, context);
  return { window, elements };
}
const welcome = runWelcomeWithContext();
check('destination welcome uses canonical first name and property address', welcome.elements.personalizedWelcomeDetail.textContent.startsWith('Dylan, your onboarding is complete for 123 Main Street, Fremont, CA 94539.'));
check('destination welcome public API remains free of identity and address values', Object.keys(welcome.window.CoverageFitWelcome).join(',') === 'version,active,reasonKey');

console.log(`TX-1.7 QA: ${checks.length}/${checks.length} passed`);
