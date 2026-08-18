'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fullSource = fs.readFileSync(path.join(__dirname, 'assets/js/consultation-checklist.js'), 'utf8');
const source = fullSource.split('// AW-5A.4.2A Reset API Skeleton')[0];
const context = {
  console,
  Date,
  JSON,
  Math,
  Object,
  Array,
  Set,
  Map,
  Number,
  String,
  Boolean,
  window: {
    dispatchEvent() {},
    CustomEvent: function CustomEvent() {}
  }
};
context.window.window = context.window;
context.globalThis = context.window;
vm.createContext(context);
vm.runInContext(source, context);
const checklist = context.window.CoverageFitConsultationChecklist;

const plan = {
  state: 'ready',
  schemaVersion: '1.0',
  plannerVersion: '0.1.0',
  customer: { name: 'Workspace Contract Test' },
  sections: [
    { id: 'opening', title: 'Opening', items: [
      { id: 'goals', phase: 'opening', title: 'Confirm goals', estimatedMinutes: 2 }
    ]},
    { id: 'review', title: 'Review', items: [
      { id: 'coverage', phase: 'review', title: 'Review coverage', estimatedMinutes: 5 }
    ]}
  ]
};

const generated = checklist.generateFromPlan(plan, { generatedAt: '2026-07-26T00:00:00.000Z' });
const state = checklist.getWorkspaceState(generated);

assert.deepStrictEqual(Object.keys(state), [
  'checklist',
  'summary',
  'diagnostics',
  'progress',
  'currentPhase',
  'remainingMinutes',
  'plannerVersion',
  'version'
]);
assert.equal(state.currentPhase, 'opening');
assert.equal(state.remainingMinutes, 7);
assert.equal(state.plannerVersion, '0.1.0');
assert.equal(state.progress.total, 2);
assert.equal(state.progress.remainingMinutes, 7);
assert.equal(state.version, checklist.VERSION);
assert.ok(Object.isFrozen(state));
assert.ok(Object.isFrozen(state.checklist));
assert.ok(Object.isFrozen(state.checklist.items));
assert.ok(Object.isFrozen(state.checklist.items[0]));
assert.ok(Object.isFrozen(state.summary));
assert.ok(Object.isFrozen(state.diagnostics));
assert.ok(Object.isFrozen(state.progress));

console.log('PASS AW-5A.4.3B expanded workspace contract');
