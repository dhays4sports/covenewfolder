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

const source = read('assets/js/consultation-command-center.js');
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const workspace = read('assets/js/agent-workspace.js');
const context = { window: {} };
vm.runInNewContext(source, context, { filename: 'consultation-command-center.js' });
const engine = context.window.CoverageFitConsultationCommandCenter;

function snapshot(overrides = {}) {
  return {
    state: 'ready',
    customer: { name: 'Avery Homeowner', propertyAddress: '408 Main St', reviewContext: 'Buying a home' },
    assessment: { topPriority: 'Water backup protection', completion: { state: 'complete' } },
    recommendations: [
      { id: 'water', title: 'Water backup protection', explanation: 'Confirm the current limit.', priority: 'High' },
      { id: 'roof', title: 'Roof settlement', explanation: 'Review settlement terms.', priority: 'Medium' },
      { id: 'liability', title: 'Liability limit', explanation: 'Discuss household exposure.', priority: 'Medium' },
      { id: 'extra', title: 'Extra topic', explanation: 'Should remain below the command-center limit.' }
    ],
    evidenceHandoff: {
      guardrail: 'Confirm policy language before making a recommendation.',
      verificationItems: [{ id: 'roof-check', title: 'Roof settlement', question: 'Compare settlement terms.', priorityOrder: 2 }],
      unresolvedQuestions: [{ id: 'water-question', title: 'Water backup limit', question: 'Ask what limit is currently carried.', priorityOrder: 1 }]
    },
    property: { address: '408 Main St' },
    ...overrides
  };
}

check('release remains compatible after GC-1.1', ['3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('one centralized command-center engine is available', engine && ['1.0.0','1.1.0','1.2.0','1.3.0','1.3.1'].includes(engine.VERSION) && typeof engine.build === 'function');

const model = engine.build(snapshot(), { stage: 'review_received', checklist: { summary: { completed: 0, total: 8 } } });
check('WHO uses normalized customer and property data', model.who.name === 'Avery Homeowner' && model.who.property === '408 Main St');
check('WHY uses review context rather than acquisition context', model.why.reason === 'Buying a home');
check('STATUS combines journey stage and guided progress', model.status.label === 'Review received' && /0 of 8 guided steps complete/.test(model.status.detail));
check('TOP PRIORITIES preserves existing recommendation order and stays bounded', model.priorities.length === 3 && model.priorities.map(item => item.id).join(',') === 'water,roof,liability');
check('VERIFY preserves evidence classification and existing priority order', model.verify.length === 2 && model.verify[0].kind === 'homeowner' && model.verify[1].kind === 'policy');
check('NEXT ACTION points to confirmation work when evidence remains open', model.action.target === '#consultationCommandVerify' && /confirmed/i.test(model.action.title));
check('command center preserves the evidence guardrail', model.guardrail === 'Confirm policy language before making a recommendation.');

const missingReason = engine.build(snapshot({ customer: { name: 'Avery Homeowner', propertyAddress: '408 Main St', reviewContext: '', occupationSegment: 'Nurse or RN' } }), {});
check('missing review reason is not replaced with occupation context', missingReason.why.reason === 'Review reason not provided' && !/nurse/i.test(missingReason.why.reason));

const completed = engine.build(snapshot({ evidenceHandoff: { verificationItems: [], unresolvedQuestions: [] } }), { stage: 'consultation_completed', checklist: { summary: { completed: 8, total: 8 } } });
check('completed consultation moves next action to recording decisions', completed.action.target === '#consultationAfterTitle' && /next commitment/i.test(completed.action.title));

const closed = engine.build(snapshot(), { stage: 'closed' });
check('closed consultation uses a truthful completion action', closed.status.label === 'Closed' && closed.action.target === '#consultationDispositionTitle');

check('Workspace renders all six command-center answers', ['consultationCommandWhoName','consultationCommandWhyReason','consultationCommandStatus','consultationCommandPriorityList','consultationCommandVerifyList','consultationCommandAction'].every(id => html.includes(`id="${id}"`)));
check('command-center engine loads before the Workspace controller', html.indexOf('/assets/js/consultation-command-center.js') < html.indexOf('/assets/js/agent-workspace.js'));
check('Workspace refreshes the command center when checklist progress changes', workspace.includes('renderConsultationCommandCenter(currentWorkspaceSnapshot, state)'));
check('Workspace exposes the derived command-center model for diagnostics', workspace.includes('window.CoverageFitAgentWorkspaceCommandCenter = model'));
check('command center uses existing evidence and recommendation data without a parallel intake', workspace.includes('commandCenter.build(snapshot') && !source.includes('localStorage') && !source.includes('sessionStorage'));
check('responsive command-center presentation is included', css.includes('GC-1.1 — Consultation Command Center') && css.includes('.consultation-command-center__orientation') && css.includes('@media (max-width: 640px)'));
check('no eligibility discount rate underwriting or coverage result is asserted', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(source));

new vm.Script(workspace, { filename: 'agent-workspace.js' });
check('Agent Workspace JavaScript parses successfully', true);

console.log(`GC-1.1 QA: ${passed}/${passed} passed`);
