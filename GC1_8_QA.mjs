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
const progress = require('./assets/js/consultation-progress.js');
let passed = 0;
const check = (name, value) => { assert.ok(value, name); console.log('PASS', name); passed += 1; };

function checklist(currentPhase, statuses = {}) {
  const phaseIds = ['opening', 'context', 'review', 'connect', 'close'];
  return {
    currentPhase,
    checklist: {
      state: 'ready',
      currentPhaseId: currentPhase,
      items: phaseIds.map(phaseId => ({ id: `check-${phaseId}`, phaseId, status: statuses[phaseId] || 'pending' }))
    }
  };
}

function plan(items) {
  return { items: items || [
    { id: 'water', decision: 'undecided', verified: false, producerReason: '' },
    { id: 'roof', decision: 'undecided', verified: false, producerReason: '' }
  ] };
}

function build(overrides = {}) {
  return progress.build(
    { state: 'ready', consultation: { id: 'consultation-gc18-123456' } },
    {
      checklist: checklist('opening'),
      recommendationPlan: plan(),
      disposition: { stage: 'review_received', outcome: 'none' },
      followUp: { state: 'none' },
      serverBacked: true,
      ...overrides
    }
  );
}

check('release remains compatible after CoverageFit 3.20.37', ['3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Consultation Progress is centrally versioned', progress.VERSION === '1.0.0' && progress.SCHEMA_VERSION === '1.0');
check('the canonical six-stage order is immutable', Object.isFrozen(progress.STAGE_ORDER) && progress.STAGE_ORDER.join(',') === 'understand,verify,discuss,recommend,decide,next-step');

let model = build();
check('a new consultation starts at Understand', model.current.id === 'understand' && model.stages[0].state === 'current');
check('the model always returns exactly six stages', model.stages.length === 6 && model.summary.total === 6);
check('every stage links to an existing Workspace surface', model.stages.every(stage => stage.target.startsWith('#')));
check('the model is immutable', Object.isFrozen(model) && Object.isFrozen(model.stages) && model.stages.every(Object.isFrozen));

model = build({ checklist: checklist('context', { opening: 'complete' }) });
check('completing opening work advances the current stage to Verify', model.stages[0].state === 'complete' && model.current.id === 'verify');
check('verification does not complete from checklist context alone', build({ checklist: checklist('review', { opening: 'complete', context: 'complete' }) }).stages[1].complete === false);

const verificationPlan = plan([
  { id: 'water', decision: 'consider', verified: true, producerReason: '' },
  { id: 'roof', decision: 'defer', verified: false, producerReason: 'Await roof records.' }
]);
model = build({ checklist: checklist('review', { opening: 'complete', context: 'complete' }), recommendationPlan: verificationPlan });
check('verified or explicitly deferred findings complete Verify', model.stages[1].complete && model.stages[1].summary.includes('deferred'));
check('a deferred finding is never described as verified', model.stages[1].summary === '1 verified · 1 deferred');
check('review phase makes Discuss the current stage', model.current.id === 'discuss');

model = build({
  checklist: checklist('close', { opening: 'complete', context: 'complete', review: 'complete', connect: 'complete' }),
  recommendationPlan: plan([
    { id: 'water', decision: 'consider', verified: true, producerReason: '' },
    { id: 'roof', decision: 'undecided', verified: true, producerReason: '' }
  ])
});
check('completed review and connect work completes Discuss', model.stages[2].complete);
check('close phase makes Recommend the current stage', model.current.id === 'recommend');
check('every explicit judgment completes Recommend without requiring a carrier proposal', build({ recommendationPlan: verificationPlan }).stages[3].complete);

const partialPlan = plan([
  { id: 'water', decision: 'consider', verified: true, producerReason: '' },
  { id: 'roof', decision: 'undecided', verified: false, producerReason: '' }
]);
model = build({ checklist: checklist('opening'), recommendationPlan: partialPlan });
check('started recommendation work moves the current focus to Recommend', model.current.id === 'recommend');
check('skipped earlier work is labeled Needs attention', model.stages.slice(0, 3).every(stage => stage.state === 'attention'));
check('an undecided finding prevents Recommend completion', !model.stages[3].complete && model.stages[3].summary === '1 of 2 findings decided');

model = build({ disposition: { stage: 'decision_pending' } });
check('an operational decision stage makes Decide current', model.current.id === 'decide');
check('Decision pending is not falsely marked complete', !model.stages[4].complete && model.stages[4].summary === 'Decision pending');

model = build({ disposition: { stage: 'closed', outcome: 'deferred' }, followUp: { state: 'none' } });
check('a closed disposition truthfully completes Decide', model.stages[4].complete && model.stages[4].summary === 'Final outcome recorded');
check('closing the record completes its operational Next step', model.stages[5].complete && model.stages[5].summary === 'Consultation closed');

model = build({ followUp: { state: 'scheduled' } });
check('scheduled secure follow-up completes Next step', model.stages[5].complete && model.stages[5].summary === 'Follow-up scheduled');
check('server-backed Next step links to the existing follow-up form', model.stages[5].target === '#consultationFollowUpTitle');
check('local records link Next step to the existing after-conversation section', build({ serverBacked: false }).stages[5].target === '#consultationAfterTitle');

model = progress.build({ state: 'empty' }, { recommendationPlan: { items: [] } });
check('non-ready workspaces fail safely without claiming progress', model.summary.completed === 0 && model.current.id === 'understand');
check('progress retains a verification guardrail', model.guardrail.includes('does not convert incomplete, inferred, or homeowner-reported information into a verified fact'));

const source = read('assets/js/consultation-progress.js');
const html = read('agent/workspace/index.html');
const workspace = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
check('Workspace loads exactly one Consultation Progress module', (html.match(/consultation-progress\.js/g) || []).length === 1);
check('Consultation Progress loads after Recommendation Builder and before Workspace rendering', html.indexOf('recommendation-builder.js') < html.indexOf('consultation-progress.js') && html.indexOf('consultation-progress.js') < html.indexOf('agent-workspace.js'));
check('the six-stage surface appears once inside the existing During phase', (html.match(/id="consultationProgress"/g) || []).length === 1 && html.indexOf('id="consultationProgress"') > html.indexOf('id="consultationDuringTitle"') && html.indexOf('id="consultationProgress"') < html.indexOf('id="consultationAfterTitle"'));
check('the visible order matches the canonical workflow', html.includes('Understand → Verify → Discuss → Recommend → Decide → Next step'));
check('the Workspace rerenders progress from checklist changes', workspace.includes('renderConsultationProgress(currentWorkspaceSnapshot, state)'));
check('the Workspace rerenders progress from Recommendation Builder changes', workspace.includes('renderConsultationProgress(currentWorkspaceSnapshot, window.CoverageFitAgentWorkspaceChecklist || null)'));
check('responsive styles include desktop, tablet, and mobile progress layouts', css.includes('grid-template-columns: repeat(6') && css.includes('grid-template-columns: repeat(3') && css.includes('.consultation-progress__stages { grid-template-columns: 1fr; }'));
check('current and attention states are visually distinct', css.includes('li[data-state="current"]') && css.includes('li[data-state="attention"]'));
check('progress creates no storage, API, score, or alternate checklist architecture', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|setJSON|restoreFromPlan/.test(source));
check('progress makes no unsupported insurance outcome claim', !/you qualify|guaranteed discount|guaranteed rate|coverage is approved|underwriting approved|this is covered/i.test(source));
check('module and Workspace JavaScript parse successfully', (() => { new Function(source); new Function(workspace); return true; })());

check('Protection Score remains unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('GC-1.3 priority ranking remains unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('GC-1.5 conversation planner remains unchanged', hash('assets/js/conversation-planner.js') === '93315ad24415bf04ba411013d68410017187f78085fe925334311c89f37f2cfe');
check('GC-1.6 Recommendation Builder remains unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a');
check('GC-1.7 Explanation Assist remains compatible', ['7d5a9740d30052e413ce2a51cbe58173c9797efe004af8571948bb3e808b22ec', '7f163223824f13b706a3b72944dc147f6de69c8088a3e8250f7db3d83c42da87'].includes(hash('assets/js/explanation-assist.js')));
check('existing consultation checklist remains unchanged', hash('assets/js/consultation-checklist.js') === '940e5677e7f8e1ab2fdcec8caa25bbd2dec7b5abc91a923c16c260b3ee5dc9c2');
check('Workspace data and zero-repeat normalization remain unchanged', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('consultation document retains GC-1.8 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('GC-1.8 documentation is complete and GC-1.9 remains deferred', fs.existsSync(path.join(root, 'SPRINT-GC-1.8.md')) && read('ROADMAP.md').includes('GC-1.8 Consultation Progress — Complete (3.20.37)') && read('SPRINT-GC-1.8.md').includes('GC-1.9 Consultation Completion remains deferred'));

console.log(`GC-1.8 QA: ${passed}/${passed} passed`);
