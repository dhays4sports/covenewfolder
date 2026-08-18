'use strict';
const assert = require('assert');
const checklist = require('./assets/js/consultation-checklist.js');

function readyPlan() {
  return {
    schemaVersion: '1.0',
    plannerVersion: '1.0.0',
    state: 'ready',
    customer: { name: 'Test Customer' },
    sections: [
      { id: 'opening', title: 'Open and align', estimatedMinutes: 2, items: [] },
      { id: 'review', title: 'Review priority topics', estimatedMinutes: 9, items: [] }
    ],
    items: [
      {
        id: 'opening-alignment', phase: 'opening', type: 'alignment',
        title: 'Set the agenda', estimatedMinutes: 2,
        objective: 'Confirm the customer goal.', prompt: 'What matters most?', sourceIds: []
      },
      {
        id: 'review-water', phase: 'review', type: 'recommendation-topic',
        title: 'Water damage planning', estimatedMinutes: 5,
        objective: 'Review water-loss controls.', prompt: 'How is water damage addressed?',
        sourceIds: ['water-loss'], priority: 'High', confidence: 92,
        evidence: ['Older plumbing']
      },
      {
        id: 'review-liability', phase: 'review', type: 'recommendation-topic',
        title: 'Liability protection', estimatedMinutes: 4,
        objective: 'Review liability limits.', prompt: 'What assets should be protected?',
        sourceIds: ['liability'], priority: 'Review', confidence: 80
      }
    ]
  };
}

const generatedAt = '2026-07-25T12:00:00.000Z';
const result = checklist.generateFromPlan(readyPlan(), { generatedAt });
assert.match(checklist.VERSION, /^0\.[5-9]\.\d+$|^[1-9]\d*\.\d+\.\d+$/, 'engine version should be current and semver-compatible');
assert.strictEqual(result.state, 'ready');
assert.strictEqual(result.items.length, 3);
assert.strictEqual(result.phases.length, 2);
assert.strictEqual(result.items[0].id, 'check-opening-opening-alignment');
assert.strictEqual(result.items[1].phaseTitle, 'Review priority topics');
assert.deepStrictEqual(result.items[1].recommendationIds, ['water-loss']);
assert.strictEqual(result.items[1].estimatedMinutes, 5);
assert.strictEqual(result.items[1].status, checklist.STATUS.PENDING);
assert.strictEqual(result.phases[1].itemCount, 2);
assert.strictEqual(result.phases[1].estimatedMinutes, 9);
assert.strictEqual(checklist.validateChecklist(result).valid, true);
assert.strictEqual(checklist.diagnostics(result).itemCount, 3);

const repeat = checklist.generateFromPlan(readyPlan(), { generatedAt });
assert.strictEqual(repeat.planFingerprint, result.planFingerprint);
assert.strictEqual(repeat.checklistId, result.checklistId);
assert.deepStrictEqual(repeat.items.map(item => item.id), result.items.map(item => item.id));

const empty = checklist.generateFromPlan(null, { generatedAt });
assert.strictEqual(empty.state, 'empty');
assert.strictEqual(empty.items.length, 0);
assert.ok(empty.diagnostics.warnings.length > 0);

const notReady = checklist.generateFromPlan({ state: 'empty', plannerVersion: '1.0.0' }, { generatedAt });
assert.strictEqual(notReady.state, 'empty');

const duplicatePlan = readyPlan();
duplicatePlan.items[2].id = duplicatePlan.items[1].id;
const duplicate = checklist.generateFromPlan(duplicatePlan, { generatedAt });
assert.strictEqual(new Set(duplicate.items.map(item => item.id)).size, duplicate.items.length);
assert.ok(duplicate.diagnostics.warnings.some(warning => warning.includes('Duplicate planner item id')));

const sectionsOnly = readyPlan();
sectionsOnly.sections = [
  { id: 'opening', title: 'Open and align', items: [sectionsOnly.items[0]] },
  { id: 'review', title: 'Review priority topics', items: sectionsOnly.items.slice(1) }
];
delete sectionsOnly.items;
const fromSections = checklist.generateFromPlan(sectionsOnly, { generatedAt });
assert.strictEqual(fromSections.items.length, 3);
assert.strictEqual(fromSections.items[2].phaseId, 'review');

const snapshot = checklist.getSnapshot(result);
snapshot.items[0].title = 'Changed externally';
assert.notStrictEqual(snapshot.items[0].title, result.items[0].title);

console.log(JSON.stringify({
  passed: true,
  tests: 25,
  engineVersion: checklist.VERSION,
  checklistId: result.checklistId,
  itemCount: result.items.length,
  phaseCount: result.phases.length
}, null, 2));
