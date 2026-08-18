'use strict';
const assert = require('assert');
const checklist = require('./assets/js/consultation-checklist.js');

function fakeStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    dump() { return Object.fromEntries(map); }
  };
}

const plan = {
  state: 'ready', schemaVersion: '1.0', plannerVersion: '0.1.0',
  customer: { name: 'Test Customer' },
  sections: [
    { id: 'open', title: 'Open and align', items: [
      { id: 'goals', phase: 'open', title: 'Confirm goals', estimatedMinutes: 2, sourceIds: [] }
    ]},
    { id: 'review', title: 'Review priorities', items: [
      { id: 'dwelling', phase: 'review', title: 'Review dwelling', estimatedMinutes: 5, sourceIds: ['rec-1'] },
      { id: 'liability', phase: 'review', title: 'Review liability', estimatedMinutes: 4, sourceIds: ['rec-2'] }
    ]}
  ]
};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('engine version remains semver-compatible after AW-5A.3', () => assert.match(checklist.VERSION, /^0\.[5-9]\.\d+$|^[1-9]\d*\.\d+\.\d+$/));
test('restore creates a ready checklist without saved state', () => {
  const restored = checklist.restoreFromPlan(plan, { storage: fakeStorage() });
  assert.equal(restored.state, 'ready');
  assert.equal(restored.persistence.enabled, true);
  assert.equal(restored.persistence.restored, false);
});
test('complete persists an item', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  const updated = checklist.complete(initial.items[0].id, { storage });
  assert.equal(updated.items[0].status, checklist.STATUS.COMPLETE);
  assert.ok(storage.getItem(checklist.getStorageKey(updated)));
});
test('saved status restores after reload', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  checklist.complete(initial.items[1].id, { storage });
  const restored = checklist.restoreFromPlan(plan, { storage });
  assert.equal(restored.items[1].status, checklist.STATUS.COMPLETE);
  assert.equal(restored.persistence.restored, true);
});
test('activate permits only one active item', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  checklist.activate(initial.items[0].id, { storage });
  const second = checklist.activate(initial.items[1].id, { storage });
  assert.equal(second.items.filter(item => item.status === checklist.STATUS.ACTIVE).length, 1);
  assert.equal(second.items[1].status, checklist.STATUS.ACTIVE);
});
test('reopen returns a completed item to pending', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  checklist.complete(initial.items[0].id, { storage });
  const reopened = checklist.reopen(initial.items[0].id, { storage });
  assert.equal(reopened.items[0].status, checklist.STATUS.PENDING);
});
test('invalid status throws', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  assert.throws(() => checklist.setStatus(initial.items[0].id, 'invalid', { storage }), /Unsupported/);
});
test('unknown item leaves state unchanged', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  const result = checklist.complete('missing-id', { storage });
  assert.deepEqual(result.items, initial.items);
});
test('corrupt JSON is removed and recovered', () => {
  const generated = checklist.generateFromPlan(plan);
  const key = checklist.getStorageKey(generated);
  const storage = fakeStorage({ [key]: '{broken' });
  const restored = checklist.restoreFromPlan(plan, { storage });
  assert.equal(restored.persistence.restored, false);
  assert.equal(storage.getItem(key), null);
});
test('incompatible schema is removed and recovered', () => {
  const generated = checklist.generateFromPlan(plan);
  const key = checklist.getStorageKey(generated);
  const storage = fakeStorage({ [key]: JSON.stringify({ storageSchemaVersion: '0.1', checklistId: generated.checklistId }) });
  const restored = checklist.restoreFromPlan(plan, { storage });
  assert.equal(restored.persistence.restored, false);
  assert.equal(storage.getItem(key), null);
});
test('expired state is removed and recovered', () => {
  const storage = fakeStorage();
  const oldNow = () => new Date('2026-01-01T00:00:00Z');
  const initial = checklist.restoreFromPlan(plan, { storage, now: oldNow });
  checklist.complete(initial.items[0].id, { storage, now: oldNow });
  const restored = checklist.restoreFromPlan(plan, { storage, now: () => new Date('2026-03-15T00:00:00Z'), maxAgeDays: 30 });
  assert.equal(restored.persistence.restored, false);
  assert.equal(restored.items[0].status, checklist.STATUS.PENDING);
});
test('storage unavailable falls back safely', () => {
  const restored = checklist.restoreFromPlan(plan, { storage: null });
  assert.equal(restored.state, 'ready');
  assert.equal(restored.persistence.enabled, false);
});
test('clear removes storage and resets statuses', () => {
  const storage = fakeStorage();
  const initial = checklist.restoreFromPlan(plan, { storage });
  const completed = checklist.complete(initial.items[0].id, { storage });
  const key = checklist.getStorageKey(completed);
  const cleared = checklist.clear({ storage });
  assert.equal(storage.getItem(key), null);
  assert.ok(cleared.items.every(item => item.status === checklist.STATUS.PENDING));
});
test('returned snapshots are isolated clones', () => {
  const storage = fakeStorage();
  const restored = checklist.restoreFromPlan(plan, { storage });
  restored.items[0].title = 'Mutated outside engine';
  assert.notEqual(checklist.getSnapshot().items[0].title, 'Mutated outside engine');
});

let passed = 0;
for (const entry of tests) {
  try { entry.fn(); passed += 1; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}\n${error.stack}`); process.exitCode = 1; }
}
console.log(`\n${passed}/${tests.length} tests passed`);
