'use strict';
const assert = require('assert');
const fs = require('fs');
const section = require('./assets/js/print/sections/timeline.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const printModel = {
  timeline: {
    state: 'ready',
    summary: { estimatedMinutes: 14 },
    sections: [
      { id: 'opening', title: 'Opening', estimatedMinutes: 3 },
      { id: 'coverage', title: 'Coverage Review', estimatedMinutes: 11 }
    ],
    items: [
      { id: 'a', phase: 'opening', sectionId: 'opening', title: 'Confirm goals', estimatedMinutes: 3, objective: 'Set the agenda.' },
      { id: 'b', phase: 'coverage', sectionId: 'coverage', title: 'Review liability', estimatedMinutes: 5, prompt: 'Tell me about your assets.' },
      { id: 'c', phase: 'coverage', sectionId: 'coverage', title: 'Discuss umbrella', estimatedMinutes: 6, coachingNote: 'Connect to liability.' }
    ],
    questions: ['What matters most today?'],
    guardrails: ['Do not lead with price.']
  },
  consultationChecklist: {
    currentPhase: 'coverage',
    items: [
      { id: 'ca', sourceItemId: 'a', status: 'complete' },
      { id: 'cb', sourceItemId: 'b', status: 'active' },
      { id: 'cc', sourceItemId: 'c', status: 'pending' }
    ]
  }
};

const output = section.render(printModel);

test('renders semantic timeline section', () => {
  assert.ok(output.html.includes('Consultation Timeline'));
  assert.ok(output.html.includes('aria-labelledby="cf-time-title"'));
});

test('renders all timeline items once', () => {
  ['a','b','c'].forEach(id => assert.equal((output.html.match(new RegExp(`data-timeline-item-id="${id}"`, 'g')) || []).length, 1));
});

test('renders reviewed current and upcoming states', () => {
  assert.ok(output.html.includes('cf-time-status-reviewed'));
  assert.ok(output.html.includes('cf-time-status-current'));
  assert.ok(output.html.includes('cf-time-status-upcoming'));
});

test('renders section groups and progress', () => {
  assert.ok(output.html.includes('data-timeline-section-id="opening"'));
  assert.ok(output.html.includes('data-timeline-section-id="coverage"'));
  assert.ok(output.html.includes('0/2'));
});

test('renders objectives prompts and producer notes', () => {
  assert.ok(output.html.includes('Set the agenda.'));
  assert.ok(output.html.includes('Tell me about your assets.'));
  assert.ok(output.html.includes('Connect to liability.'));
});

test('renders questions and guardrails', () => {
  assert.ok(output.html.includes('Questions to Keep in View'));
  assert.ok(output.html.includes('Consultation Guardrails'));
});

test('renders summary counts and remaining time', () => {
  assert.ok(output.html.includes('estimated minutes remaining'));
  assert.ok(output.html.includes('11'));
});

test('escapes timeline content', () => {
  const hostile = JSON.parse(JSON.stringify(printModel));
  hostile.timeline.items[0].title = '<script>alert(1)</script>';
  const html = section.render(hostile).html;
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('supports unlimited timeline items', () => {
  const many = { timeline: { state: 'ready', items: Array.from({length: 35}, (_, i) => ({ id:`x${i}`, phase:'review', title:`Topic ${i}` })) }, consultationChecklist: { items: [] } };
  const html = section.render(many).html;
  assert.equal((html.match(/data-timeline-item-id=/g) || []).length, 35);
});

test('returns immutable output and diagnostics', () => {
  assert.ok(Object.isFrozen(output));
  assert.ok(output.diagnostics.valid);
});

test('section remains model driven', () => {
  assert.equal(output.model.items.length, 3);
  assert.equal(section.shouldRender(printModel), true);
});

test('empty timeline remains hidden', () => {
  assert.equal(section.shouldRender({ timeline: { state: 'ready', items: [] } }), false);
});

test('browser dependency order remains correct', () => {
  const html = fs.readFileSync('./agent/workspace/index.html', 'utf8');
  assert.ok(html.indexOf('/assets/js/print/models/timeline-model.js') < html.indexOf('/assets/js/print/sections/timeline.js'));
});

console.log(`P1.5.2 QA complete: ${passed} passed, 0 failed`);
