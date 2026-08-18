'use strict';
const assert = require('assert');
const fs = require('fs');
const modelFactory = require('./assets/js/print/models/timeline-model.js');
const section = require('./assets/js/print/sections/timeline.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const fullPrintModel = {
  schemaVersion: 1,
  engineVersion: '0.3.0',
  generatedAt: '2026-07-27T12:00:00.000Z',
  metadata: { sourceVersions: { planner: '2.0.0' } },
  timeline: {
    state: 'ready',
    summary: { topicCount: 3, agendaItemCount: 3, estimatedMinutes: 14, firstPriority: 'Liability' },
    sections: [
      { id: 'opening', title: 'Opening', estimatedMinutes: 3, items: [{ id: 'a', phase: 'opening', title: 'Confirm goals', estimatedMinutes: 3 }] },
      { id: 'coverage', title: 'Coverage Review', estimatedMinutes: 11, items: [{ id: 'b', phase: 'coverage', title: 'Review liability', estimatedMinutes: 5 }, { id: 'c', phase: 'coverage', title: 'Discuss umbrella', estimatedMinutes: 6 }] }
    ],
    items: [
      { id: 'a', phase: 'opening', title: 'Confirm goals', estimatedMinutes: 3, objective: 'Set the agenda.' },
      { id: 'b', phase: 'coverage', title: 'Review liability', estimatedMinutes: 5, prompt: 'Tell me about your assets.' },
      { id: 'c', phase: 'coverage', title: 'Discuss umbrella', estimatedMinutes: 6, coachingNote: 'Connect to liability.' }
    ],
    questions: ['What matters most today?'],
    guardrails: ['Do not lead with price.']
  },
  consultationChecklist: {
    available: true,
    currentPhase: 'coverage',
    items: [
      { id: 'ca', sourceItemId: 'a', phaseId: 'opening', status: 'complete' },
      { id: 'cb', sourceItemId: 'b', phaseId: 'coverage', status: 'active' },
      { id: 'cc', sourceItemId: 'c', phaseId: 'coverage', status: 'pending' }
    ]
  }
};

test('maps timeline items and sections', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.items.length, 3);
  assert.equal(model.sections.length, 2);
  assert.equal(model.items[0].title, 'Confirm goals');
  assert.equal(model.sections[1].title, 'Coverage Review');
});

test('derives timeline status from checklist', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.deepEqual(model.items.map(item => item.status), ['reviewed', 'current', 'upcoming']);
  assert.equal(model.items[1].checklistItemId, 'cb');
});

test('computes timeline summary', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.summary.total, 3);
  assert.equal(model.summary.reviewed, 1);
  assert.equal(model.summary.current, 1);
  assert.equal(model.summary.upcoming, 1);
  assert.equal(model.summary.remainingMinutes, 11);
  assert.equal(model.summary.estimatedMinutes, 14);
});

test('preserves questions and guardrails', () => {
  const model = modelFactory.create(fullPrintModel);
  assert.equal(model.questions[0], 'What matters most today?');
  assert.equal(model.guardrails[0], 'Do not lead with price.');
});

test('falls back to section items when flat items are absent', () => {
  const input = JSON.parse(JSON.stringify(fullPrintModel));
  input.timeline.items = [];
  const model = modelFactory.create(input);
  assert.equal(model.items.length, 3);
});

test('supports unlimited timeline items', () => {
  const items = Array.from({length: 40}, (_, index) => ({ id: `i${index}`, phase: 'review', title: `Topic ${index + 1}` }));
  const model = modelFactory.create({ timeline: { state: 'ready', items, sections: [] }, consultationChecklist: { items: [] } });
  assert.equal(model.items.length, 40);
});

test('empty timeline is safe', () => {
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
  assert.ok(Object.isFrozen(model.sections[0]));
});

test('source model is not mutated', () => {
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
  assert.equal(output.id, 'timeline');
  assert.equal(output.model.items.length, 3);
  assert.ok(typeof output.html === 'string');
});

test('section visibility uses dedicated model', () => {
  assert.equal(section.shouldRender(fullPrintModel), true);
  assert.equal(section.shouldRender({ timeline: { state: 'ready', items: [] } }), false);
});

test('browser dependency order is correct', () => {
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/models/timeline-model.js') < html.indexOf('/assets/js/print/sections/timeline.js'));
});

console.log(`P1.5.1 QA complete: ${passed} passed, 0 failed`);
