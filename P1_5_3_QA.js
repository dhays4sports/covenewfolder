'use strict';
const assert = require('assert');
const fs = require('fs');
const section = require('./assets/js/print/sections/timeline.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('PASS', name); }

const printModel = {
  timeline: {
    state: 'ready',
    sections: [
      { id: 'opening', title: 'Opening', estimatedMinutes: 3 },
      { id: 'coverage', title: 'Coverage Review', estimatedMinutes: 11 },
      { id: 'close', title: 'Next Steps', estimatedMinutes: 4 }
    ],
    items: [
      { id: 'a', phase: 'opening', sectionId: 'opening', title: 'Confirm goals', estimatedMinutes: 3 },
      { id: 'b', phase: 'coverage', sectionId: 'coverage', title: 'Review liability', estimatedMinutes: 5, prompt: 'Tell me about your assets.' },
      { id: 'c', phase: 'coverage', sectionId: 'coverage', title: 'Discuss umbrella', estimatedMinutes: 6, coachingNote: 'Connect to liability.' },
      { id: 'd', phase: 'close', sectionId: 'close', title: 'Confirm next step', estimatedMinutes: 4 }
    ],
    questions: ['What matters most today?'],
    guardrails: ['Do not lead with price.']
  },
  consultationChecklist: {
    currentPhase: 'coverage',
    items: [
      { id: 'ca', sourceItemId: 'a', status: 'complete' },
      { id: 'cb', sourceItemId: 'b', status: 'active' },
      { id: 'cc', sourceItemId: 'c', status: 'pending' },
      { id: 'cd', sourceItemId: 'd', status: 'pending' }
    ]
  }
};

const output = section.render(printModel);
const css = fs.readFileSync('./assets/js/print-renderers.js', 'utf8');

test('advances timeline section version', () => assert.equal(section.version, '1.3.0'));
test('renders status legend', () => {
  assert.ok(output.html.includes('cf-time-legend'));
  assert.ok(output.html.includes('Reviewed'));
  assert.ok(output.html.includes('Current'));
  assert.ok(output.html.includes('Upcoming'));
});
test('marks current section', () => assert.ok(output.html.includes('data-section-state="current"')));
test('marks reviewed section', () => assert.ok(output.html.includes('data-section-state="reviewed"')));
test('marks upcoming section', () => assert.ok(output.html.includes('data-section-state="upcoming"')));
test('renders section topic counts', () => assert.ok(output.html.includes('data-section-count="2"')));
test('renders discussing now label only for current item', () => {
  assert.equal((output.html.match(/Discussing now/g) || []).length, 1);
});
test('adds first-item print continuity markers', () => {
  assert.equal((output.html.match(/cf-time-item-first/g) || []).length, 3);
});
test('adds sequence traceability', () => assert.ok(output.html.includes('data-timeline-sequence="2"')));
test('adds professional current-state styling', () => {
  assert.ok(css.includes('.cf-time-group-current'));
  assert.ok(css.includes('.cf-time-now'));
});
test('adds legend styling', () => assert.ok(css.includes('.cf-time-legend-reviewed')));
test('adds print continuity for group headers', () => assert.ok(css.includes('.cf-time-group-header{break-after:avoid-page')));
test('adds print continuity for first timeline item', () => assert.ok(css.includes('.cf-time-item-first{break-before:avoid-page')));
test('preserves immutable output', () => assert.ok(Object.isFrozen(output)));
test('preserves model-driven unlimited rendering', () => {
  const many = { timeline: { state: 'ready', items: Array.from({length: 30}, (_, i) => ({ id:`x${i}`, phase:'review', title:`Topic ${i}` })) }, consultationChecklist: { items: [] } };
  assert.equal((section.render(many).html.match(/data-timeline-item-id=/g) || []).length, 30);
});

console.log(`P1.5.3 QA complete: ${passed} passed, 0 failed`);
