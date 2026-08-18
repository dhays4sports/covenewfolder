import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('.', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const transitionSource = read('./assets/js/transition-route.js');
const intakeSource = read('./assets/js/prefill-intake.js');
let passed = 0;
let failed = 0;
const check = (name, condition) => {
  try { assert.ok(condition, name); console.log('PASS', name); passed += 1; }
  catch (error) { console.error('FAIL', name); failed += 1; }
};

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

function node({ label = false, hidden = false } = {}) {
  const labelNode = { textContent: '' };
  return {
    dataset: {}, attributes: {}, textContent: '', href: '', hidden,
    focus() {}, addEventListener() {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector(selector) { return label && selector === '.transition-step-label' ? labelNode : null; },
    labelNode
  };
}

function runTransition(profile, { directAssessment = false, hasProfile = true } = {}) {
  const sessionStorage = storage({
    coveragefit_transition_v1: JSON.stringify({ destination: '/assessment/', hasProfile }),
    ...(profile ? { coveragefit_prospect_profile_v1: JSON.stringify(profile) } : {})
  });
  const localStorage = storage();
  const stepNodes = Array.from({ length: 4 }, () => node({ label: true }));
  const elements = {
    transitionKicker: node(), transitionHeading: node(), transitionMessage: node(), transitionStatus: node(),
    transitionContinue: node(), transitionFinal: node(), transitionFinalKicker: node(), transitionFinalMessage: node(),
    transitionBridge: node({ hidden: true }), transitionProperty: node({ hidden: true }), transitionPropertyLabel: node(),
    transitionPropertyAddress: node(), transitionPropertyDetail: node()
  };
  const document = {
    title: '', documentElement: { dataset: {} }, body: { setAttribute() {} },
    getElementById: id => elements[id] || null,
    querySelectorAll: selector => selector === '[data-transition-step]' ? stepNodes : []
  };
  const timers = [];
  const window = {
    location: { origin: 'https://coveragefit.com', href: '', replace() {} },
    matchMedia: () => ({ matches: false }),
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    clearTimeout() {}, addEventListener() {},
    CoverageFitConversionHandoff: directAssessment ? {
      get: () => ({ flags: { directAssessmentEligible: true }, destinationForTransition: value => value })
    } : undefined
  };
  Object.assign(window, { window, document, sessionStorage, localStorage, URL });
  vm.runInContext(transitionSource, vm.createContext({ window, document, sessionStorage, localStorage, URL, console }));
  return { window, document, elements, stepNodes };
}

function runPrefill(search) {
  const sessionStorage = storage();
  const localStorage = storage();
  let cleanedUrl = '';
  const document = { title: 'Transition' };
  const location = { origin: 'https://coveragefit.com', pathname: '/transition/', search, hash: '', href: '' };
  const history = { state: null, replaceState(_state, _title, url) { cleanedUrl = url; } };
  const window = { location, history, dispatchEvent() {} };
  Object.assign(window, { window, document, sessionStorage, localStorage, URL, URLSearchParams, CustomEvent: class {} });
  vm.runInContext(intakeSource, vm.createContext({ window, document, sessionStorage, localStorage, location, history, URL, URLSearchParams, CustomEvent: class {}, Date, console }));
  return {
    profile: JSON.parse(sessionStorage.getItem('coveragefit_prospect_profile_v1')),
    cleanedUrl
  };
}

check('CoverageFit FLOW-1.4 remains compatible', ['3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('./VERSION').trim()));
check('one centralized transition configuration includes professional and bundle variants', transitionSource.includes('const PERSONALIZATIONS = Object.freeze') && transitionSource.includes('professional: Object.freeze') && transitionSource.includes('bundle: Object.freeze'));

for (const [label, occupationSegment, entry, campaign] of [
  ['healthcare', 'Nurse or RN', 'healthcare_eligibility_form', 'Work in Healthcare'],
  ['teacher', 'Teacher or instructor', 'teachers_eligibility_form', 'Teachers and School Employees'],
  ['tech', 'Software or engineering', 'tech_eligibility_form', 'Work in Tech'],
  ['engineer', 'Electrical engineer', 'engineers_eligibility_form', 'Are You an Engineer']
]) {
  const result = runTransition({ reviewContext: 'Professional eligibility and home coverage review', occupationSegment, integration: { entry, campaign, source: '408farmers' } });
  check(`${label} uses the professional transition`, result.window.CoverageFitTransition.entryKey === 'professional');
  check(`${label} keeps eligibility conditional`, /require confirmation/i.test(result.elements.transitionMessage.textContent) && !/guaranteed|you qualify/i.test(result.elements.transitionMessage.textContent));
}

const buyer = runTransition({ reviewContext: 'Buying a home', closingDate: '2026-09-15', occupancy: 'primary_residence', integration: { entry: 'buyer_lander_form' } });
check('homebuyer transition acknowledges the purchase', buyer.window.CoverageFitTransition.entryKey === 'homebuyer' && /new home coverage review/i.test(buyer.elements.transitionHeading.textContent));

const bundle = runTransition({ reviewContext: 'Home and auto together', housingContext: 'I own my home', integration: { entry: 'auto_bundle_form', launchSurface: 'auto_bundle' } }, { directAssessment: true });
check('bundle transition acknowledges the home portion', bundle.window.CoverageFitTransition.entryKey === 'bundle' && /home portion/i.test(bundle.elements.transitionHeading.textContent));
check('bundle direct assessment remains one existing assessment', bundle.elements.transitionFinalMessage.textContent === 'Opening the home portion of your Coverage Review');
check('bundle copy makes no savings or eligibility promise', !/save|savings|discount|eligible|qualif|guarantee/i.test(bundle.elements.transitionMessage.textContent));

const homeowner = runTransition({ reviewContext: 'Premium increased', integration: { entry: 'home_lander_form' } });
check('general homeowner reason variants remain intact', homeowner.window.CoverageFitTransition.entryKey === 'premium-increase' && /price alone/i.test(homeowner.elements.transitionMessage.textContent));

const rush = runTransition({ reviewContext: 'Buying a home', closingUrgency: 'within_7_days', integration: { entry: 'buyer_lander_form' } });
check('web buyer urgency is acknowledged', rush.window.CoverageFitTransition.urgent === true && rush.document.documentElement.dataset.transitionUrgency === 'rush');
check('RUSH copy avoids unsupported timing and availability promises', /still require confirmation/i.test(rush.elements.transitionMessage.textContent) && !/guaranteed|instant|approved/i.test(rush.elements.transitionMessage.textContent));
check('RUSH keeps the base buyer journey', rush.window.CoverageFitTransition.entryKey === 'homebuyer' && /new home/i.test(rush.elements.transitionHeading.textContent));

const smsRush = runTransition({ reviewContext: 'Reviewing current home coverage', smsContext: { priority: 'rush', rushRequested: true }, integration: { entry: 'sms_handoff' } });
check('existing SMS urgency context uses the same transition component', smsRush.window.CoverageFitTransition.urgent === true && smsRush.window.CoverageFitTransition.entryKey === 'general');

const fallback = runTransition(null, { hasProfile: false });
check('missing handoff remains neutral', fallback.document.documentElement.dataset.transitionReason === 'fallback' && fallback.elements.transitionFinalMessage.textContent === 'Opening CoverageFit');

const prefill = runPrefill('?prefill=1&review_context=Buying+a+home&occupation_segment=Nurse+or+RN&housing_context=I+own+my+home&closing_date=2026-08-12&occupancy=primary_residence&closing_urgency=within_7_days&partner_id=jessica-martinez&referral_source=realtor_partner&launch_surface=buyer_lander&source=408farmers&entry=buyer_lander_form');
check('web buyer context persists for zero-repeat use', prefill.profile.closingDate === '2026-08-12' && prefill.profile.occupancy === 'primary_residence' && prefill.profile.closingUrgency === 'within_7_days');
check('web partner and launch context persist in canonical integration', prefill.profile.integration.partnerId === 'jessica-martinez' && prefill.profile.integration.referralSource === 'realtor_partner' && prefill.profile.integration.launchSurface === 'buyer_lander');
check('personal and handoff context is scrubbed from the visible URL', !/closing_|occupancy|partner_id|referral_source|launch_surface|review_context|occupation_segment|housing_context/.test(prefill.cleanedUrl));

const legacy = runPrefill('?prefill=1&segment=Policy+Renewal');
check('legacy segment fallback remains supported', legacy.profile.reviewContext === 'Policy Renewal');

console.log(`FLOW-1.4 receiver: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
