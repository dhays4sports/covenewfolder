#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash = relative => crypto.createHash('sha256').update(read(relative)).digest('hex');
const checks = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};

const progress = require('./assets/js/consultation-progress.js');
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const workspace = read('assets/js/agent-workspace.js');
const sprint = read('SPRINT-PC-1.2.md');

function checklist(currentPhase, completed = []) {
  const phases = ['opening', 'context', 'review', 'connect', 'close'];
  return {
    currentPhase,
    checklist: {
      currentPhaseId: currentPhase,
      items: phases.map(phaseId => ({ id: `pc12-${phaseId}`, phaseId, status: completed.includes(phaseId) ? 'complete' : 'pending' }))
    }
  };
}

function recommendation(items) {
  return { items: items || [
    { id: 'rebuilding', verified: false, decision: 'undecided', producerReason: '' },
    { id: 'water', verified: false, decision: 'undecided', producerReason: '' }
  ] };
}

function model(overrides = {}) {
  return progress.build(
    { state: 'ready', consultation: { id: 'consultation-pc12-fixture' } },
    {
      checklist: checklist('opening'),
      recommendationPlan: recommendation(),
      disposition: { stage: 'review_received' },
      followUp: { state: 'none' },
      serverBacked: true,
      ...overrides
    }
  );
}

check('release advances to CoverageFit 3.20.48', ['3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('PC-1.2 reuses the existing Consultation Progress model', progress.VERSION === '1.0.0' && progress.STAGE_ORDER.join(',') === 'understand,verify,discuss,recommend,decide,next-step');

let state = model();
check('a new review presents Understand as the single current focus', state.current.id === 'understand' && state.summary.completed === 0 && state.summary.attention === 0);
state = model({
  checklist: checklist('close', ['opening', 'context', 'review', 'connect']),
  recommendationPlan: recommendation([
    { id: 'rebuilding', verified: true, decision: 'consider', producerReason: '' },
    { id: 'water', verified: false, decision: 'undecided', producerReason: '' }
  ])
});
check('moving ahead leaves earlier incomplete work visibly needing attention', state.current.id === 'recommend' && state.summary.attention > 0 && state.stages.some(stage => stage.state === 'attention'));
state = model({
  checklist: checklist('close', ['opening', 'context', 'review', 'connect', 'close']),
  recommendationPlan: recommendation([
    { id: 'rebuilding', verified: true, decision: 'consider', producerReason: '' },
    { id: 'water', verified: true, decision: 'defer', producerReason: 'Await policy documents.' }
  ]),
  disposition: { stage: 'closed' },
  followUp: { state: 'completed' }
});
check('a fully closed consultation reaches a truthful complete state', state.state === 'complete' && state.summary.completed === 6 && state.summary.percent === 100);

check('the Workspace contains exactly one Current Focus guide', (html.match(/id="consultationFocus"/g) || []).length === 1);
check('Current Focus appears after the selected homeowner and before the Command Center', html.indexOf('id="activeCustomerHeader"') < html.indexOf('id="consultationFocus"') && html.indexOf('id="consultationFocus"') < html.indexOf('id="consultationCommandCenter"'));
check('Current Focus exposes one explicit action', (html.match(/id="consultationFocusAction"/g) || []).length === 1 && html.includes('href="#consultationCommandCenter" id="consultationFocusAction"'));
check('completion exposes native progressbar semantics and text', html.includes('role="progressbar"') && html.includes('aria-valuenow="0"') && html.includes('id="consultationFocusMeta"'));
check('changing current guidance uses a polite live region', html.includes('aria-live="polite" class="consultation-focus__copy"'));

const progressRenderer = workspace.slice(workspace.indexOf('function renderConsultationProgress'), workspace.indexOf('function setRemoteInboxExpanded'));
check('one renderer updates detailed progress and Current Focus from the same model', progressRenderer.includes('const model = consultationProgress.build') && progressRenderer.includes("byId('consultationProgressCurrentTitle')") && progressRenderer.includes("byId('consultationFocusTitle')"));
check('Current Focus copies the canonical current summary, detail, action, and target', progressRenderer.includes("updateText(byId('consultationFocusTitle'), model.current.summary)") && progressRenderer.includes("updateText(byId('consultationFocusDetail'), model.current.detail)") && progressRenderer.includes('focusAction.textContent = model.current.actionLabel') && progressRenderer.includes('focusAction.href = model.current.target'));
check('attention copy is explicit and grammatically bounded', progressRenderer.includes("earlier ${model.summary.attention === 1 ? 'step needs' : 'steps need'} attention"));
check('the visual progress value uses the canonical model percentage', progressRenderer.includes("String(model.summary.percent)") && progressRenderer.includes("`${model.summary.percent}%`"));
check('the focus renderer adds no persistence, network, score, or recommendation engine', !/localStorage|sessionStorage|\bfetch\b|CoverageFitProtectionScore|recommendationBuilder\.build|setJSON/.test(progressRenderer));

check('Current Focus is sticky only on larger screens', css.includes('@media (min-width: 901px)') && css.includes('.consultation-focus { position: sticky; top: 126px; z-index: 16; }'));
check('tablet and phone layouts remove the sticky rail and preserve touch-friendly actions', css.includes('@media (max-width: 900px)') && css.includes('@media (max-width: 640px)') && css.includes('.consultation-focus .button { min-width: 0; min-height: 44px; }'));
check('guided targets reserve room below sticky controls', css.includes('#guidedQuestionsPanel') && css.includes('#recommendationBuilder') && css.includes('scroll-margin-top: 228px'));
check('active, attention, and complete states are visually distinct', css.includes('.consultation-focus[data-state="attention"]') && css.includes('.consultation-focus[data-state="complete"]'));
check('reduced-motion coverage applies to the progress transition', css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('transition: none !important'));

check('PC-1.2 leaves the central progress engine unchanged', hash('assets/js/consultation-progress.js') === 'f0ebe864f6fd0c8c6d3bbe465999d4e65ba0f465835f0fd602d8239987bfe2da');
check('PC-1.2 leaves checklist persistence unchanged', hash('assets/js/consultation-checklist.js') === '940e5677e7f8e1ab2fdcec8caa25bbd2dec7b5abc91a923c16c260b3ee5dc9c2');
check('PC-1.2 leaves Recommendation Builder and Completion unchanged', hash('assets/js/recommendation-builder.js') === '0cef67b4249773526c5f69dbdb6cd2c40c954129e15efa4ffbd7ad2f58c6591a' && hash('assets/js/consultation-completion.js') === 'c0d4f6c7530d3042f3abd3caec2deb9fc6c871b08fbf96d9e843ae6d3655cc96');
check('PC-1.2 leaves zero-repeat Workspace normalization unchanged', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('PC-1.2 leaves assessment and Protection Score engines unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3' && hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('FLOW prefill advances only for HOME-2.1 semantics while RC-SMS handoff remains unchanged', hash('assets/js/prefill-intake.js') === '9cca4d8bbd6d2ba6b7f72aaf569dc252762c41d6e8857111a3d7f03f5a351f48' && hash('assets/js/sms-handoff-resolver.js') === 'defea794444f829cac4f267feab32ab43ba16eefe3a25d92ca13fa01595bc262');
check('no unsupported insurance outcome is claimed', !/you qualify|guaranteed discount|guaranteed rate|coverage (?:is|was) approved|underwriting approved|carrier approved/i.test(`${html}\n${workspace}\n${sprint}`));
check('PC-1.2 records its bounded handoff to PC-1.3', sprint.includes('PC-1.3 persistence and recovery hardening remains deferred') && read('ROADMAP.md').includes('[x] PC-1.3 — Consultation Persistence and Recovery Hardening'));
check('PC-1.2 release documentation remains present', read('CHANGELOG.md').includes('## 3.20.48 — PC-1.2 Producer Usability Polish') && read('ROADMAP.md').includes('PC-1.2 Producer Usability Polish — Complete (3.20.48)'));
check('modified Workspace JavaScript parses successfully', (() => { new Function(workspace); return true; })());

console.log(JSON.stringify({
  suite: 'PC-1.2 Producer Usability Polish',
  version: read('VERSION').trim(),
  passed: checks.length,
  failed: 0,
  checks
}, null, 2));
