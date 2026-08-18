#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
let passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS', name); passed += 1; };
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

globalThis.CoverageFitConsultationCommandCenter = require('./assets/js/consultation-command-center.js');
const builder = require('./assets/js/recommendation-builder.js');
const assist = require('./assets/js/explanation-assist.js');

function snapshot(recommendations) {
  return {
    state: 'ready',
    consultation: { id: 'consultation-gc17-123456' },
    customer: { name: 'Avery Homeowner' },
    recommendations: recommendations || [{
      id: 'water', questionKey: 'water', title: 'Water-Loss Terms', category: 'Water', priority: 'High',
      explanation: 'The policy treatment of common water losses has not been confirmed.',
      conversationStarter: 'Can we review sudden water damage, backup, hidden leaks, seepage, deductibles, and mitigation requirements?',
      evidenceQuality: 'needs-verification', evidenceLabel: 'Needs policy verification',
      source: { priorityScore: 8, findingType: 'uncertainty' }
    }]
  };
}

function oneTopic(key, title, category) {
  const report = snapshot([{ id: key, questionKey: key, title, category: category || 'Home', explanation: `Assessment issue for ${title}.`, evidenceQuality: 'confirmed' }]);
  const plan = {
    state: 'not-started',
    items: [{ id: `recommendation-${key}`, findingId: key, rank: 1, title, detail: `Assessment issue for ${title}.`, assessmentRationale: 'Ranked finding.', evidenceQuality: 'confirmed', verified: false, decision: 'undecided', producerReason: '' }]
  };
  return assist.build(report, plan).items[0];
}

check('release remains compatible after CoverageFit 3.20.36', ['3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Explanation Assist is centrally versioned', assist.VERSION === '1.0.0' && assist.SCHEMA_VERSION === '1.0');
check('topic guidance is immutable', Object.isFrozen(assist.TOPIC_GUIDES) && assist.TOPIC_GUIDES.every(guide => Object.isFrozen(guide) && Object.isFrozen(guide.checks)));
check('major homeowner topics and a safe fallback are centrally configured', assist.TOPIC_GUIDES.length === 14 && assist.TOPIC_GUIDES.at(-1).id === 'general');

const input = snapshot();
const plan = builder.build(input, null, { limit: 3 });
const originalSnapshot = JSON.stringify(input);
const originalPlan = JSON.stringify(plan);
let model = assist.build(input, plan);
let water = model.items[0];
check('assist consumes the existing ranked Recommendation Builder finding', model.items.length === plan.items.length && water.findingId === plan.items[0].findingId);
check('assist keeps the specific assessment issue visible', water.issue === input.recommendations[0].explanation);
check('assist explains what the topic means separately', water.whatItMeans.includes('Water losses are not handled as one category'));
check('assist explains why the topic may matter', water.whyItMatters.includes('specific cause, limit, deductible'));
check('assist creates a natural homeowner-facing talk track', water.talkTrack.startsWith('I want to pause on Water-Loss Terms.') && water.talkTrack.includes('before we decide whether anything should change'));
check('assist carries the existing assessment prompt into verification work', water.verification[0].includes(input.recommendations[0].conversationStarter));
check('assist adds bounded carrier verification', water.verification.some(item => item.includes('declarations, endorsements, carrier forms')));
check('unverified findings are labeled Verify first', model.state === 'verification-needed' && water.readiness === 'verify-first' && water.readinessLabel === 'Verify first');
check('unverified coaching prevents a finding from becoming a confirmed gap', water.coachingNote.includes('assessment question, not a confirmed coverage gap'));
check('assist does not mutate the Workspace snapshot', JSON.stringify(input) === originalSnapshot);
check('assist does not mutate or choose a Recommendation Builder judgment', JSON.stringify(plan) === originalPlan && plan.items[0].decision === 'undecided');

let verifiedPlan = builder.update(plan, plan.items[0].id, { verified: true }, { updatedAt: '2026-08-09T02:00:00.000Z' });
model = assist.build(input, verifiedPlan);
water = model.items[0];
check('verification changes explanation readiness without selecting judgment', model.state === 'ready' && water.readiness === 'ready-to-discuss' && water.decision === 'undecided');
check('verified talk track still reserves final terms for the carrier quote', water.talkTrack.includes('formal carrier quote') && water.talkTrack.includes('before we decide'));

verifiedPlan = builder.update(verifiedPlan, verifiedPlan.items[0].id, { decision: 'recommend', producerReason: 'Verified current policy terms and homeowner preference.' }, { updatedAt: '2026-08-09T02:01:00.000Z' });
water = assist.build(input, verifiedPlan).items[0];
check('recorded recommendation receives a quote-and-carrier coaching cue', water.readiness === 'judgment-recorded' && water.coachingNote.includes('carrier-quote request'));
const consider = assist.build(input, { items: [{ ...verifiedPlan.items[0], decision: 'consider' }] }).items[0];
check('consider judgment receives a neutral tradeoff cue', consider.coachingNote.includes('tradeoff neutrally'));
const deferred = assist.build(input, { items: [{ ...verifiedPlan.items[0], decision: 'defer' }] }).items[0];
check('deferred judgment receives a revisit cue', deferred.coachingNote.includes('when the topic should be revisited'));
const declined = assist.build(input, { items: [{ ...verifiedPlan.items[0], decision: 'not_recommended' }] }).items[0];
check('not-recommended judgment receives a future-review cue', declined.coachingNote.includes('future change'));

const topicCases = [
  ['roofSettlement', 'Roof Settlement Terms', 'Roof', 'roof'],
  ['water', 'Water-Loss Terms', 'Water', 'water'],
  ['deductible', 'Deductible Readiness', 'Financial Readiness', 'deductible'],
  ['ordinanceLaw', 'Building Code Protection', 'Rebuilding', 'ordinance-law'],
  ['dwelling', 'Rebuilding Estimate', 'Rebuilding', 'rebuilding'],
  ['personalProperty', 'Personal Property Valuation', 'Property', 'personal-property'],
  ['lossOfUse', 'Temporary Housing Protection', 'Recovery', 'loss-of-use'],
  ['poolLiabilityReview', 'Swimming Pool Liability Review', 'Liability', 'pool-liability'],
  ['umbrella', 'Umbrella Liability Review', 'Liability', 'umbrella'],
  ['liability', 'Personal Liability Review', 'Liability', 'liability'],
  ['separatePerils', 'Separate Hazard Review', 'Separate Hazards', 'separate-hazards'],
  ['lifeEvents', 'Household and Property Changes', 'Life Changes', 'property-use'],
  ['detachedStructures', 'Detached Structure Review', 'Property', 'other-structures']
];
topicCases.forEach(([key, title, category, expected]) => {
  check(`${title} receives topic-aware coaching`, oneTopic(key, title, category).topic === expected);
});
check('uncommon legacy findings use the safe general fallback', oneTopic('legacySpecialty', 'Uncommon Legacy Topic', 'Miscellaneous').topic === 'general');
check('empty or non-ready workspaces fail safely', assist.build({ state: 'empty' }, plan).state === 'empty' && assist.build(input, { items: [] }).items.length === 0);
check('assist returns exactly one coaching item per builder finding', assist.build(input, { items: [plan.items[0], { ...plan.items[0], id: 'second', findingId: 'second', title: 'Second' }] }).items.length === 2);

const source = read('assets/js/explanation-assist.js');
const html = read('agent/workspace/index.html');
const workspace = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
check('Workspace loads exactly one Explanation Assist module', (html.match(/explanation-assist\.js/g) || []).length === 1);
check('Explanation Assist loads after Recommendation Builder and before Workspace rendering', html.indexOf('recommendation-builder.js') < html.indexOf('explanation-assist.js') && html.indexOf('explanation-assist.js') < html.indexOf('agent-workspace.js'));
check('coaching renders inside the existing Recommendation Builder finding', workspace.includes('renderExplanationAssist(item, assistanceByFinding.get(item.findingId), consultationId)'));
check('UI answers all four beginner questions', ['What the issue is', 'Why it matters', 'Say it naturally', 'Verify before final advice'].every(label => workspace.includes(label)));
check('UI uses native progressive disclosure', workspace.includes('<details class="explanation-assist"') && workspace.includes('<summary>'));
check('first ranked finding opens by default', workspace.includes("Number(item.rank) === 1"));
check('disclosure choices survive Recommendation Builder rerenders', workspace.includes('explanationDisclosureState.set') && workspace.includes("'toggle', handleExplanationDisclosure, true"));
check('readiness labels remain visible in the coaching disclosure', css.includes('[data-readiness="ready-to-discuss"]') && css.includes('[data-readiness="judgment-recorded"]'));
check('beginner-friendly coaching collapses to one column on small screens', css.includes('.explanation-assist__grid { grid-template-columns: 1fr; }'));
check('assist creates no storage, API, score, or persistence architecture', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|updateRecommendationPlan|setJSON/.test(source));
check('assist makes no unsupported consumer outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(source));
check('module and Workspace JavaScript parse successfully', (() => { new Function(source); new Function(workspace); return true; })());

check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('GC-1.3 priority ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('GC-1.5 conversation planner remains unchanged', hash('assets/js/conversation-planner.js') === '93315ad24415bf04ba411013d68410017187f78085fe925334311c89f37f2cfe');
check('GC-1.6 Recommendation Builder model remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('Workspace data and zero-repeat normalization remain unchanged', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('local recommendation persistence remains unchanged', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('secure remote client remains unchanged', hash('assets/js/remote-consultations.js') === '779d00356ee151c09a884f2af6d76dfb82265608dc92583739892f8e2c3f6ecf');
check('secure D1 consultation core remains unchanged', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('consultation document retains GC-1.7 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('GC-1.7 documentation is complete and GC-1.8 remains deferred', fs.existsSync(path.join(root, 'SPRINT-GC-1.7.md')) && read('ROADMAP.md').includes('GC-1.7 Explanation Assist — Complete (3.20.36)') && read('SPRINT-GC-1.7.md').includes('GC-1.8 Consultation Progress remains deferred'));

console.log(`GC-1.7 QA: ${passed}/${passed} passed`);
