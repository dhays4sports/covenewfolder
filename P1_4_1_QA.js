'use strict';
const assert = require('assert');
const fs = require('fs');
const modelFactory = require('./assets/js/print/models/checklist-model.js');
const section = require('./assets/js/print/sections/checklist.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const fullPrintModel = {
  schemaVersion: 1,
  engineVersion: '0.3.0',
  generatedAt: '2026-07-27T12:00:00.000Z',
  consultationChecklist: {
    available: true,
    currentPhase: 'coverage',
    plannerVersion: '2.0.0',
    phases: [
      { id: 'discovery', title: 'Discovery', order: 1 },
      { id: 'coverage', title: 'Coverage Review', order: 2 }
    ],
    items: [
      { id: 'b', phaseId: 'coverage', phaseTitle: 'Coverage Review', order: 2, title: 'Review liability', status: 'active', estimatedMinutes: 5, priority: 'high', recommendationIds: ['r2'] },
      { id: 'a', phaseId: 'discovery', phaseTitle: 'Discovery', order: 1, title: 'Confirm goals', status: 'complete', estimatedMinutes: 3, required: true, evidence: ['assessment'] },
      { id: 'c', phaseId: 'coverage', phaseTitle: 'Coverage Review', order: 3, title: 'Discuss umbrella', status: 'pending', estimatedMinutes: 4, coachingNote: 'Connect to assets.' }
    ]
  }
};

test('maps checklist items and phases', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.items.length, 3);
  assert.equal(model.phases.length, 2);
  assert.equal(model.items[0].id, 'a');
  assert.equal(model.items[1].priority, 'High');
});

test('computes checklist summary', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.summary.total, 3);
  assert.equal(model.summary.completed, 1);
  assert.equal(model.summary.active, 1);
  assert.equal(model.summary.pending, 1);
  assert.equal(model.summary.remainingMinutes, 9);
});

test('computes phase progress', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.phases[0].completedCount, 1);
  assert.equal(model.phases[0].completionPercent, 100);
  assert.equal(model.phases[1].itemCount, 2);
});

test('normalizes aliases and statuses', () => {
  const model = modelFactory.create({ consultationChecklist: { available: true, items: [{ label:'Bind policy', phase:'close', status:'done', priority:'urgent' }] } });
  assert.equal(model.items[0].title, 'Bind policy');
  assert.equal(model.items[0].status, 'complete');
  assert.equal(model.items[0].priority, 'Critical');
  assert.equal(model.phases[0].id, 'close');
});

test('preserves unlimited checklist items', () => {
  const items = Array.from({length:40}, (_,i)=>({title:`Item ${i+1}`, phaseId:'general', order:i+1}));
  assert.equal(modelFactory.create({consultationChecklist:{available:true,items}}).items.length, 40);
});

test('empty checklist is safe', () => {
  const model = modelFactory.create({});
  assert.equal(model.available, false);
  assert.deepEqual(model.items, []);
  assert.equal(modelFactory.hasContent(model), false);
});

test('output is deeply immutable', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.ok(Object.isFrozen(model));
  assert.ok(Object.isFrozen(model.items));
  assert.ok(Object.isFrozen(model.items[0]));
  assert.ok(Object.isFrozen(model.phases[0]));
});

test('source checklist is not mutated', () => {
  const input = JSON.parse(JSON.stringify(fullPrintModel));
  const before = JSON.stringify(input);
  modelFactory.create(input);
  assert.equal(JSON.stringify(input), before);
});

test('diagnostics report missing content', () => {
  const diagnostics = modelFactory.getDiagnostics(modelFactory.create({}));
  assert.equal(diagnostics.valid, false);
  assert.ok(diagnostics.warningCount >= 2);
});

test('section consumes dedicated model', () => {
  const output = section.render(fullPrintModel);
  assert.equal(output.id, 'checklist');
  assert.equal(output.model.items.length, 3);
  assert.ok(output.html.includes('Consultation Checklist'));
});

test('section visibility uses dedicated model', () => {
  assert.equal(section.shouldRender(fullPrintModel), true);
  assert.equal(section.shouldRender({consultationChecklist:{available:true,items:[]}}), false);
});

test('browser dependency order is correct', () => {
  const html = fs.readFileSync('./agent/workspace/index.html','utf8');
  assert.ok(html.indexOf('/assets/js/print/models/checklist-model.js') < html.indexOf('/assets/js/print/sections/checklist.js'));
});

console.log(`P1.4.1 QA complete: ${passed} passed, 0 failed`);
