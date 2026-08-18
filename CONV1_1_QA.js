#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

class FakeCustomEvent {
  constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
}

function runHandoff(query) {
  const sessionStorage = new MemoryStorage();
  const localStorage = new MemoryStorage();
  const replaced = [];
  const dispatched = [];
  const location = {
    origin: 'https://coveragefit.com',
    pathname: '/transition/',
    search: query.startsWith('?') ? query : `?${query}`,
    hash: '',
    href: '',
    replace(value) { replaced.push(value); }
  };
  const history = {
    state: null,
    replaceState(state, title, value) {
      this.state = state;
      replaced.push(value);
    }
  };
  const document = {
    title: 'Preparing Your CoverageFit Review',
    referrer: 'https://408farmers.com/home/'
  };
  const window = {
    location,
    history,
    dispatchEvent(event) { dispatched.push(event); },
    CoverageFitAttribution: {
      get() { return null; },
      getPayload() { return null; }
    }
  };
  const sandbox = {
    window,
    document,
    location,
    history,
    sessionStorage,
    localStorage,
    CustomEvent: FakeCustomEvent,
    URL,
    URLSearchParams,
    Date,
    Object,
    String,
    Boolean,
    Array,
    RegExp,
    JSON,
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(read('assets/js/prefill-intake.js'), sandbox, { filename: 'prefill-intake.js' });
  vm.runInContext(read('assets/js/personalization-context.js'), sandbox, { filename: 'personalization-context.js' });
  vm.runInContext(read('assets/js/conversion-handoff.js'), sandbox, { filename: 'conversion-handoff.js' });
  return {
    sandbox,
    profile: sandbox.window.CoverageFitPrefill.get(),
    context: sandbox.window.CoverageFitPersonalization.get(),
    conversion: sandbox.window.CoverageFitConversionHandoff.get(),
    transition: JSON.parse(sessionStorage.getItem('coveragefit_transition_v1') || 'null'),
    replaced,
    dispatched
  };
}

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const transitionHtml = read('transition/index.html');
const transitionCss = read('assets/css/transition.css');
const transitionRoute = read('assets/js/transition-route.js');
const assessmentHtml = read('assessment/index.html');
const assessmentPrefill = read('assets/js/assessment-prefill.js');
const propertyController = read('assets/js/property-confirmation.js');
const contactPrefill = read('assets/js/contact-prefill.js');
const assessmentEngine = read('assets/js/assessment-engine.js');
const pilotCss = read('assets/css/pilot.css');
const propertyCss = read('assets/css/property-confirmation.css');
const conversionSource = read('assets/js/conversion-handoff.js');

check('release version remains compatible with CONV-1.1', ['3.20.12', '3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('conversion handoff module exists', fs.existsSync(path.join(root, 'assets/js/conversion-handoff.js')));
check('conversion handoff module is versioned', conversionSource.includes("const VERSION = '1.0.0'") && conversionSource.includes("const BUILD = 'CONV-1.1'"));
check('conversion handoff recognizes only the documented source and contract', conversionSource.includes("const TRUSTED_SOURCE = '408farmers'") && conversionSource.includes("const TRUSTED_CONTRACT = 'coveragefit-handoff-v1'"));
check('direct assessment route is explicit', conversionSource.includes("const ASSESSMENT_ROUTE = '/assessment/'"));
check('required zero-repeat contact remains bounded to name and valid email', conversionSource.includes('const hasRequiredContact = Boolean(contact.name && validEmail(contact.email))'));
check('quick property confirmation requires structured address fields', conversionSource.includes('isHomeHandoff && hasStructuredAddress'));
check('zero-repeat requires trusted handoff, permission, and required contact', conversionSource.includes('isHomeHandoff && permissionConfirmed && hasRequiredContact'));

const trustedQuery = new URLSearchParams({
  prefill: '1',
  first_name: 'Jordan',
  last_name: 'Martinez',
  phone: '(408) 555-0199',
  email: 'Jordan@Example.com',
  property_address: '123 Main St, Fremont, CA 94539',
  property_street: '123 Main St',
  property_city: 'Fremont',
  property_state: 'CA',
  property_zip: '94539',
  property_country: 'US',
  segment: 'Premium increased',
  source: '408farmers',
  campaign: 'door_flyer_warm_springs_01',
  entry: 'home_lander_form',
  assessment: 'home',
  next: '/home/',
  lead_captured: 'pending',
  lead_capture_status: 'pending',
  sender_build: '408-HO-1G',
  handoff_contract: 'coveragefit-handoff-v1'
}).toString();
const trusted = runHandoff(trustedQuery);

check('trusted profile retains normalized identity', trusted.profile.fullName === 'Jordan Martinez' && trusted.profile.email === 'jordan@example.com');
check('trusted profile retains contact details', trusted.profile.phone === '(408) 555-0199');
check('trusted profile retains structured property data', trusted.profile.address.street === '123 Main St' && trusted.profile.address.city === 'Fremont' && trusted.profile.address.postalCode === '94539');
check('trusted profile retains review reason', trusted.profile.reviewContext === 'Premium increased');
check('trusted profile retains campaign attribution', trusted.profile.integration.campaign === 'door_flyer_warm_springs_01');
check('trusted profile retains sender build and handoff contract', trusted.profile.integration.senderBuild === '408-HO-1G' && trusted.profile.integration.handoffContract === 'coveragefit-handoff-v1');
check('trusted profile retains lead-delivery status separately', trusted.profile.integration.leadCaptureStatus === 'pending');
check('required 408 form contract confirms contact permission independently of delivery timing', trusted.profile.contactPermission.confirmed === true && trusted.profile.contactPermission.status === 'contract-confirmed');
check('permission provenance identifies the required 408FARMERS form contract', trusted.profile.contactPermission.basis === '408farmers_required_form_contract');
check('transition storage preserves the sender-requested fallback destination', trusted.transition.destination === '/home/' && trusted.transition.hasProfile === true);
check('visible transition URL removes contact and property fields', trusted.replaced.some(value => !String(value).includes('Jordan') && !String(value).includes('property_address') && !String(value).includes('email=')));
check('visible transition URL removes conversion control markers', trusted.replaced.some(value => !String(value).includes('lead_capture_status') && !String(value).includes('handoff_contract') && !String(value).includes('sender_build')));
check('personalization context preserves the review reason', trusted.context.journey.reasonKey === 'premium-increase');
check('personalization context preserves structured property data', trusted.context.property.street === '123 Main St' && trusted.context.property.postalCode === '94539');
check('personalization context preserves contact permission', trusted.context.contactPermission.confirmed === true && trusted.context.flags.contactPermissionConfirmed === true);
check('personalization context identifies the trusted 408 handoff', trusted.context.flags.trusted408Handoff === true);
check('conversion state trusts the documented handoff', trusted.conversion.flags.trustedContract === true && trusted.conversion.flags.isHomeHandoff === true);
check('conversion state sends transferred visitors directly to assessment', trusted.conversion.flags.directAssessmentEligible === true && trusted.conversion.destinationForTransition('/home/') === '/assessment/');
check('conversion state enables one-click property confirmation', trusted.conversion.flags.quickPropertyConfirmationEligible === true);
check('conversion state enables zero-repeat completion', trusted.conversion.flags.zeroRepeatEligible === true);
check('conversion state reports no missing required contact fields', trusted.conversion.missingContactFields().length === 0);

const missingEmail = runHandoff(new URLSearchParams({
  prefill: '1', first_name: 'Jordan', property_address: '123 Main St, Fremont, CA 94539',
  property_street: '123 Main St', property_city: 'Fremont', property_state: 'CA', property_zip: '94539',
  source: '408farmers', assessment: 'home', lead_capture_status: 'confirmed', sender_build: '408-HO-1G',
  handoff_contract: 'coveragefit-handoff-v1'
}).toString());
check('trusted handoff still bypasses Home when one contact field is missing', missingEmail.conversion.flags.directAssessmentEligible === true);
check('missing contact data disables automatic report opening', missingEmail.conversion.flags.zeroRepeatEligible === false);
check('missing contact contract identifies only the missing field', missingEmail.conversion.missingContactFields().join(',') === 'email');

const untrusted = runHandoff(new URLSearchParams({
  prefill: '1', first_name: 'Jordan', email: 'jordan@example.com', property_address: '123 Main St, Fremont, CA 94539',
  property_street: '123 Main St', property_city: 'Fremont', property_state: 'CA', property_zip: '94539',
  source: 'partner', assessment: 'home', lead_capture_status: 'confirmed', sender_build: '408-HO-1G',
  handoff_contract: 'coveragefit-handoff-v1'
}).toString());
check('untrusted source cannot activate the 408 contract', untrusted.conversion.flags.trustedContract === false);
check('untrusted source retains normal CoverageFit Home destination', untrusted.conversion.destinationForTransition('/home/') === '/home/');
check('untrusted source cannot activate quick confirmation or zero-repeat', untrusted.conversion.flags.quickPropertyConfirmationEligible === false && untrusted.conversion.flags.zeroRepeatEligible === false);

check('transition loads conversion module after context and before routing', transitionHtml.indexOf('/assets/js/personalization-context.js') < transitionHtml.indexOf('/assets/js/conversion-handoff.js') && transitionHtml.indexOf('/assets/js/conversion-handoff.js') < transitionHtml.indexOf('/assets/js/transition-route.js'));
check('transition presents explicit 408FARMERS to CoverageFit bridge', transitionHtml.includes('id="transitionBridge"') && transitionHtml.includes('408FARMERS') && /continuing securely through\s+CoverageFit/.test(transitionHtml));
check('transition bridge has dedicated responsive styling', transitionCss.includes('.transition-bridge') && transitionCss.includes('.transition-bridge small'));
check('transition controller reads conversion state', transitionRoute.includes('CoverageFitConversionHandoff?.get?.()'));
check('transition controller overrides legacy next-home destination only for eligible handoffs', transitionRoute.includes('directAssessment') && transitionRoute.includes('destinationForTransition?.(state?.destination || FALLBACK_DESTINATION)'));
check('transition controller keeps a normal fallback destination', transitionRoute.includes("const FALLBACK_DESTINATION = '/home/'"));
check('transition final copy accurately opens the five-minute review', transitionRoute.includes('Opening your five-minute Coverage Review'));
check('transition public state exposes direct-assessment diagnostics', transitionRoute.includes('directAssessment'));

check('assessment loads conversion module before assessment prefill and contact prefill', assessmentHtml.indexOf('/assets/js/conversion-handoff.js') < assessmentHtml.indexOf('/assets/js/assessment-prefill.js') && assessmentHtml.indexOf('/assets/js/conversion-handoff.js') < assessmentHtml.indexOf('/assets/js/contact-prefill.js'));
check('assessment contains one-click transferred-address confirmation', ['propertyQuickConfirm','propertyQuickAddress','propertyQuickConfirmBtn','propertyQuickEditBtn'].every(id => assessmentHtml.includes(`id="${id}"`)));
check('one-click address copy names the connected 408FARMERS source', assessmentHtml.includes('408FARMERS information connected') && assessmentHtml.includes('Is this the home you want to review?'));
check('full property editor remains available when needed', assessmentHtml.includes('id="propertyEditPanel"') && assessmentHtml.includes('Edit address or add details'));
check('quick property controller requires conversion eligibility and a complete saved profile', propertyController.includes('quickPropertyConfirmationEligible') && propertyController.includes('profile?.address?.isComplete'));
check('quick confirmation starts the assessment with the transferred address', propertyController.includes("continueToAssessment(nextProfile, 'handoff_address_confirmed')"));
check('property edit action preserves optional details', propertyController.includes('openPropertyEditor') && propertyController.includes('add optional home details'));
check('quick confirmation has production styling', propertyCss.includes('.property-quick-confirm') && propertyCss.includes('.property-quick-actions'));
check('assessment prefill replaces mismatched stale property data for a trusted incoming handoff', assessmentPrefill.includes('replaceStaleProperty') && assessmentPrefill.includes('existingKey !== incomingKey'));
check('assessment prefill does not generally discard saved property profiles', assessmentPrefill.includes('conversionHandoff?.flags?.isHomeHandoff') && assessmentPrefill.includes('propertySeeded'));

check('assessment contains a zero-repeat completion status', assessmentHtml.includes('id="zeroRepeatCapture"') && assessmentHtml.includes('Your information is connected.'));
check('assessment contains a missing-consent fallback', assessmentHtml.includes('id="contactConsentConfirm"') && assessmentHtml.includes('Consent is not a condition of purchase'));
check('contact prefill hides only fields already carried forward', contactPrefill.includes("label.hidden = hasValue") && contactPrefill.includes("field.dataset.confirmedFromHandoff = 'true'"));
check('contact prefill leaves missing fields visible', contactPrefill.includes('Complete only the missing information below'));
check('contact prefill requires completion consent only when permission is not already confirmed', contactPrefill.includes('consentInput.required = !permissionConfirmed') && contactPrefill.includes('consentWrap.hidden = permissionConfirmed'));
check('contact prefill publishes zero-repeat eligibility', contactPrefill.includes('zeroRepeatEligible') && contactPrefill.includes('contact_handoff_prepared'));
check('zero-repeat panel has dedicated styling', pilotCss.includes('.zero-repeat-capture') && pilotCss.includes('.contact-confirmation-consent'));

check('assessment engine starts automatic completion only for eligible Home handoffs', assessmentEngine.includes("if (zeroRepeatStarted || config.slug !== 'home') return false") && assessmentEngine.includes('if (!state?.flags?.zeroRepeatEligible) return false'));
check('assessment engine submits the existing capture form rather than creating a parallel report path', assessmentEngine.includes("typeof form.requestSubmit === 'function'") && assessmentEngine.includes('form.requestSubmit()') && assessmentEngine.includes("form.dataset.zeroRepeatAuto = 'true'"));
check('assessment engine preserves required-answer guards before completion', assessmentEngine.includes('const firstMissing = questions.findIndex(question => question.required !== false && !selections[question.key])'));
check('automatic completion starts the existing report-generation experience', assessmentEngine.includes('CoverageFitReportGeneration?.start?.({ minDuration: 2400 })'));
check('automatic completion preserves private report creation', assessmentEngine.includes('CoverageFitProspectReports.create(report'));
check('automatic completion preserves local consultation record creation', assessmentEngine.includes('CoverageFitConsultationRecords'));
check('automatic completion preserves remote D1 consultation submission', assessmentEngine.includes('CoverageFitRemoteConsultations.submit(report'));
check('automatic completion preserves producer form notification attempt', assessmentEngine.includes("await fetch(this.action, { method: 'POST', body: new FormData(this)"));
check('automatic completion opens the existing private Snapshot route', assessmentEngine.includes('CoverageFitProspectReports?.buildUrl?.(report.prospectReport?.id, config.reportPath)'));
check('completed report retains consent provenance and handoff metadata', assessmentEngine.includes('contactPermission: {') && assessmentEngine.includes('handoffContract:') && assessmentEngine.includes('senderBuild:') && assessmentEngine.includes('leadCaptureStatus:'));
check('completed report marks zero-repeat without changing assessment answers', assessmentEngine.includes('zeroRepeat: autoSubmission') && assessmentEngine.includes('const report = payload()'));
check('Snapshot opening is measured without including PII', assessmentEngine.includes("track('snapshot_opened_after_completion'") && assessmentEngine.includes('durableReport') && assessmentEngine.includes('localFallback'));

new vm.Script(conversionSource, { filename: 'conversion-handoff.js' });
new vm.Script(read('assets/js/prefill-intake.js'), { filename: 'prefill-intake.js' });
new vm.Script(read('assets/js/personalization-context.js'), { filename: 'personalization-context.js' });
new vm.Script(transitionRoute, { filename: 'transition-route.js' });
new vm.Script(assessmentPrefill, { filename: 'assessment-prefill.js' });
new vm.Script(contactPrefill, { filename: 'contact-prefill.js' });
new vm.Script(propertyController, { filename: 'property-confirmation.js' });
new vm.Script(assessmentEngine, { filename: 'assessment-engine.js' });
check('all CONV-1.1 JavaScript parses successfully', true);

check('Protection Score implementation is unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('Home assessment questions and scoring configuration are unchanged', hash('home/assessment-config.js') === 'f4f39337871c7ce6952b77607470dcef963a039b2e467eaedfe5e35b6348553b');
check('Agent Workspace normalization retains zero-repeat compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('local consultation-record contract retains conversion compatibility after additive recommendation persistence', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('remote consultation client retains conversion compatibility after the additive recommendation endpoint', hash('assets/js/remote-consultations.js') === '779d00356ee151c09a884f2af6d76dfb82265608dc92583739892f8e2c3f6ecf');
check('private report access client is unchanged', hash('assets/js/prospect-report-access.js') === '89173d5b218e9b7d8d78c106e427c3edb2faf894fac64ccbdd3a52babd3eed70');
check('D1 consultation core retains conversion compatibility after additive recommendation persistence', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('producer notification contract is unchanged', hash('server/producer-notification.mjs') === 'cfd1aef3009ca2bb014555fa8498b65e4289a3af276b671474ac2cc7acb0b6a7');
check('D1 consultation submit route is unchanged', hash('functions/api/consultations/submit.js') === '9601e298661dfcc08d8e8d367fdb056e33816d4946ba9816c9cdda6c881dc8c7');
check('private report create route is unchanged', hash('functions/api/reports/create.js') === '3dbaa51d4e0f058a684da0cec0ab95c5eb4ff822f729cc5d1be56aba376c27a5');
check('D1 migration is unchanged', hash('migrations/0001_ops_cf_1_1.sql') === '1bbbd39be2e30119920c2914308c64ad2e11ca460a8f065cd2e6ec9a05cb53cc');

console.log(`CONV-1.1 QA: ${checks.length}/${checks.length} passed`);
