#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
const check = (name, condition) => { assert.ok(condition, name); console.log('PASS', name); passed += 1; };

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

global.localStorage = storage();
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.dispatchEvent = () => {};
const adapter = require(path.join(root, 'assets/js/workspace-data.js'));

const commandSource = read('assets/js/consultation-command-center.js');
const commandContext = { window: {} };
vm.runInNewContext(commandSource, commandContext, { filename: 'consultation-command-center.js' });
const commandCenter = commandContext.window.CoverageFitConsultationCommandCenter;
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const workspace = read('assets/js/agent-workspace.js');
const propertySummarySection = read('assets/js/print/sections/property-summary.js');

function report(overrides = {}) {
  return {
    version: 'v2.4', assessment: 'home', createdAt: '2026-08-08T12:00:00.000Z', score: 70, status: 'Strong Foundation',
    consumer: { name: 'Avery Stone', firstName: 'Avery', lastName: 'Stone', propertyAddress: '408 Main St, Fremont, CA', reviewContext: 'Buying a home' },
    personalizationContext: { journey: { reviewReason: 'Buying a home', occupationSegment: '', housingContext: '', closingDate: '2026-09-15', occupancy: 'primary_residence', closingUrgency: 'within_7_days', source: '408farmers', campaign: 'Homebuyer Coverage Concierge', campaignId: 'buyer_internal_42', referralSource: 'realtor_partner', partnerId: 'jessica-martinez', partnerName: 'Jessica Martinez', entryMethod: 'web', entryPoint: 'buyer_lander_form', launchSurface: 'buyer_lander', medium: 'referral', prefilled: true } },
    integration: { source: '408farmers', campaign: 'Homebuyer Coverage Concierge', campaignId: 'buyer_internal_42', referralSource: 'realtor_partner', partnerId: 'jessica-martinez', partnerName: 'Jessica Martinez', entryMethod: 'web', entry: 'buyer_lander_form', launchSurface: 'buyer_lander', prefilled: true },
    prospectProfile: { firstName: 'Avery', lastName: 'Stone', propertyAddress: '408 Main St, Fremont, CA', closingDate: '2026-09-15', occupancy: 'primary_residence', closingUrgency: 'within_7_days' },
    priorities: [{ tag: 'Water backup protection', insight: 'Confirm the current limit.' }], strengths: ['Assessment completed'],
    ...overrides
  };
}

check('release remains compatible after GC-1.2', ['3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('workspace adapter advances additively', ['1.2.0','1.3.0','1.4.0','1.5.0'].includes(adapter.VERSION) && adapter.SCHEMA_VERSION === '1.0');
check('command-center model remains Prospect Story compatible', ['1.1.0','1.2.0','1.3.0','1.3.1'].includes(commandCenter.VERSION) && typeof commandCenter.build === 'function');

const buyerSnapshot = adapter.getSnapshot({ report: report() });
check('workspace snapshot exposes normalized buyer context', buyerSnapshot.entryContext.closingDate === '2026-09-15' && buyerSnapshot.entryContext.occupancy === 'primary_residence');
check('workspace snapshot exposes partner attribution without replacing review reason', buyerSnapshot.entryContext.partnerName === 'Jessica Martinez' && buyerSnapshot.customer.reviewContext === 'Buying a home');
check('workspace snapshot recognizes bounded urgency', buyerSnapshot.entryContext.rush === true && buyerSnapshot.entryContext.closingUrgency === 'within_7_days');

const buyer = commandCenter.build(buyerSnapshot, {});
check('homebuyer story explains purchase closing and occupancy', buyer.story.kind === 'homebuyer' && /buying the home/i.test(buyer.story.narrative) && /September 15, 2026/.test(buyer.story.narrative) && /primary residence/i.test(buyer.story.narrative));
check('homebuyer story explains the referral and 408FARMERS continuation', /Jessica Martinez referred them/.test(buyer.story.narrative) && /408FARMERS/.test(buyer.story.narrative));
check('homebuyer urgency stays conditional', /timing and coverage availability still require confirmation/i.test(buyer.story.narrative));
check('internal partner and campaign identifiers are not displayed', !buyer.story.narrative.includes('jessica-martinez') && !JSON.stringify(buyer.story.facts).includes('buyer_internal_42'));

const professionalSnapshot = adapter.getSnapshot({ report: report({
  consumer: { name: 'Morgan Lee', firstName: 'Morgan', propertyAddress: '22 Oak Ave', reviewContext: 'Professional eligibility and home coverage review' },
  personalizationContext: { journey: { reviewReason: 'Professional eligibility and home coverage review', occupationSegment: 'Nurse or RN', source: '408farmers', campaign: 'Work in Healthcare', entryPoint: 'healthcare_eligibility_form', prefilled: true } },
  integration: { source: '408farmers', campaign: 'Work in Healthcare', entry: 'healthcare_eligibility_form', prefilled: true }, prospectProfile: { occupationSegment: 'Nurse or RN' }
}) });
const professional = commandCenter.build(professionalSnapshot, {});
check('professional story keeps occupation as context', professional.story.kind === 'professional' && /professional context as Nurse or RN/i.test(professional.story.narrative));
check('professional story makes no eligibility or discount promise', /have not been determined/i.test(professional.story.narrative) && /still require confirmation/i.test(professional.story.note));

const renewalSnapshot = adapter.getSnapshot({ report: report({
  consumer: { name: 'Jamie Chen', firstName: 'Jamie', propertyAddress: '90 Pine St', reviewContext: 'Premium increased' },
  personalizationContext: { journey: { reviewReason: 'Premium increased', occupationSegment: 'Nurse or RN', source: '408farmers', campaign: 'Work in Healthcare', entryPoint: 'healthcare_eligibility_form' } },
  prospectProfile: { occupationSegment: 'Nurse or RN' }
}) });
const renewal = commandCenter.build(renewalSnapshot, {});
check('actual review reason remains primary when occupation also exists', renewal.story.kind === 'homeowner' && /Premium increased/.test(renewal.story.narrative));
check('occupation remains a visible fact without becoming the reason', renewal.story.facts.some(item => item.label === 'Professional context' && item.value === 'Nurse or RN'));

const bundleSnapshot = adapter.getSnapshot({ report: report({
  consumer: { name: 'Riley Jones', firstName: 'Riley', propertyAddress: '55 Cedar Ct', reviewContext: 'Home and auto together' },
  personalizationContext: { journey: { reviewReason: 'Home and auto together', housingContext: 'I own my home', source: '408farmers', campaign: 'Home and Auto', entryPoint: 'auto_bundle_form' } },
  prospectProfile: { housingContext: 'I own my home' }
}) });
const bundle = commandCenter.build(bundleSnapshot, {});
check('bundle story stays focused on the home portion', bundle.story.kind === 'bundle' && /home protection portion/i.test(bundle.story.narrative));
check('housing status remains context rather than review reason', bundle.story.facts.some(item => item.label === 'Housing context' && item.value === 'Owns current home'));

const smsSnapshot = adapter.getSnapshot({ report: report({ prospectProfile: { smsContext: { priority: 'standard', autoReview: true } }, integration: { source: '408farmers_sms', entry: 'sms_handoff', entryMethod: 'sms', prefilled: true } }) });
const sms = commandCenter.build(smsSnapshot, {});
check('SMS continuation is explained without exposing raw transport fields', smsSnapshot.entryContext.sms === true && /408-FARMERS text intake/.test(sms.story.narrative));

check('Prospect Story is integrated inside the existing command center', html.includes('id="consultationProspectStory"') && html.indexOf('id="consultationProspectStory"') > html.indexOf('id="consultationCommandCenter"'));
check('Prospect Story has narrative facts and guardrail regions', ['consultationProspectStoryNarrative','consultationProspectStoryFacts','consultationProspectStoryNote'].every(id => html.includes(`id="${id}"`)));
check('Workspace renders the centralized story model', workspace.includes("storyRegion.dataset.storyKind = model.story.kind") && workspace.includes("model.story.facts.map"));
check('responsive Prospect Story presentation is included', css.includes('GC-1.2 — Prospect Story') && css.includes('.consultation-prospect-story__facts'));
check('story engine does not read storage or create a second intake', !commandSource.includes('localStorage') && !commandSource.includes('sessionStorage') && !commandSource.includes('prospect-profile'));
check('story copy contains no unsupported insurance outcome', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(commandSource));
check('date-only renewal values are stabilized against timezone rollback', propertySummarySection.includes("/^\\d{4}-\\d{2}-\\d{2}$/.test(raw) ? `${raw}T12:00:00`"));

new vm.Script(read('assets/js/workspace-data.js'), { filename: 'workspace-data.js' });
new vm.Script(commandSource, { filename: 'consultation-command-center.js' });
new vm.Script(workspace, { filename: 'agent-workspace.js' });
check('modified JavaScript parses successfully', true);

console.log(`GC-1.2 QA: ${passed}/${passed} passed`);
