'use strict';

const path = require('path');
const enginePath = path.join(__dirname, 'assets/js/consultation-checklist.js');
const failures = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function freshEngine() {
  delete require.cache[require.resolve(enginePath)];
  return require(enginePath);
}

function createStorage(initialEntries) {
  const memory = new Map(initialEntries || []);
  return {
    memory,
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); }
  };
}

const clock = {
  first: () => new Date('2026-07-26T12:00:00.000Z'),
  second: () => new Date('2026-07-26T12:05:00.000Z'),
  third: () => new Date('2026-07-26T12:10:00.000Z'),
  later: () => new Date('2026-07-27T12:00:00.000Z')
};

function makePlan(overrides) {
  const base = {
    state: 'ready',
    schemaVersion: '1.0',
    plannerVersion: 'planner-regression-1',
    customer: { name: 'Regression Customer' },
    sections: [
      {
        id: 'opening',
        title: 'Opening',
        estimatedMinutes: 5,
        items: [
          { id: 'welcome', title: 'Welcome and objectives', estimatedMinutes: 2 },
          { id: 'goals', title: 'Confirm goals', estimatedMinutes: 3 }
        ]
      },
      {
        id: 'review',
        title: 'Coverage Review',
        estimatedMinutes: 10,
        items: [
          { id: 'property', title: 'Review property', estimatedMinutes: 4, sourceIds: ['rec-property'] },
          { id: 'liability', title: 'Review liability', estimatedMinutes: 6, sourceIds: ['rec-liability'] }
        ]
      }
    ]
  };
  return Object.assign({}, base, overrides || {});
}

// 1. Progress calculations.
{
  const engine = freshEngine();
  const storage = createStorage();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.first });
  let state = engine.getWorkspaceState();
  assert(state.summary.total === 4, 'Initial summary must include all four checklist items.');
  assert(state.summary.completed === 0, 'Initial completed count must be zero.');
  assert(state.summary.pending === 4, 'Initial pending count must include all items.');
  assert(state.remainingMinutes === 15, 'Initial remaining minutes must equal all item estimates.');
  assert(state.progress.totalPhases === 2, 'Progress must include both phases.');
  assert(state.progress.completedPhases === 0, 'No phase should initially be complete.');

  const [welcome, goals, property, liability] = state.checklist.items;
  engine.complete(welcome.id, { storage, now: clock.second });
  engine.activate(goals.id, { storage, now: clock.second });
  state = engine.getWorkspaceState();
  assert(state.summary.completed === 1, 'Completing one item must increment completed count.');
  assert(state.summary.active === 1, 'Activating one item must increment active count.');
  assert(state.summary.pending === 2, 'Pending count must reflect complete and active items.');
  assert(state.remainingMinutes === 13, 'Remaining minutes must exclude completed items only.');
  assert(state.currentPhase === 'opening', 'Current phase must follow the active item.');

  engine.complete(goals.id, { storage, now: clock.third });
  state = engine.getWorkspaceState();
  assert(state.progress.completedPhases === 1, 'Completing all opening items must complete the opening phase.');
  assert(state.remainingMinutes === 10, 'Remaining minutes must equal the unfinished review phase.');
  assert(state.checklist.items.find(item => item.id === property.id).status === engine.STATUS.PENDING, 'Unchanged review items must remain pending.');
  assert(state.checklist.items.find(item => item.id === liability.id).status === engine.STATUS.PENDING, 'All untouched review items must remain pending.');
}

// 2. Reset behavior and automatic persistence.
{
  const engine = freshEngine();
  const storage = createStorage();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.first });
  const initial = engine.getWorkspaceState();
  const [welcome, goals, property, liability] = initial.checklist.items;

  engine.complete(welcome.id, { storage, now: clock.second });
  engine.complete(goals.id, { storage, now: clock.second });
  engine.complete(property.id, { storage, now: clock.second });
  let state = engine.getWorkspaceState();
  const beforeResetFingerprint = state.diagnostics.checklistFingerprint;

  engine.resetItem(property.id, { storage, now: clock.third });
  state = engine.getWorkspaceState();
  assert(state.checklist.items.find(item => item.id === property.id).status === engine.STATUS.PENDING, 'resetItem must return the selected item to pending.');
  assert(state.checklist.items.find(item => item.id === welcome.id).status === engine.STATUS.COMPLETE, 'resetItem must not alter items in other phases.');
  assert(state.diagnostics.checklistFingerprint !== beforeResetFingerprint, 'resetItem must update the checklist fingerprint.');
  assert(state.diagnostics.storageHealth.lastSavedAt === '2026-07-26T12:10:00.000Z', 'resetItem must persist automatically.');

  engine.complete(property.id, { storage, now: clock.third });
  engine.complete(liability.id, { storage, now: clock.third });
  engine.resetPhase('review', { storage, now: clock.later });
  state = engine.getWorkspaceState();
  assert(state.checklist.items.filter(item => item.phaseId === 'review').every(item => item.status === engine.STATUS.PENDING), 'resetPhase must reset every item in the selected phase.');
  assert(state.checklist.items.filter(item => item.phaseId === 'opening').every(item => item.status === engine.STATUS.COMPLETE), 'resetPhase must preserve other phases.');
  assert(state.currentPhase === 'review', 'resetPhase must make the reset phase current.');

  engine.reset({ storage, now: clock.later });
  state = engine.getWorkspaceState();
  assert(state.checklist.items.every(item => item.status === engine.STATUS.PENDING), 'reset must return all checklist items to pending.');
  assert(state.summary.completed === 0, 'reset must clear the completed count.');
  assert(state.currentPhase === 'opening', 'reset must return the checklist to its first phase.');

  const key = state.diagnostics.storageHealth.storageKey;
  assert(storage.memory.has(key), 'reset must retain a persisted reset record.');
  engine.clear({ storage });
  state = engine.getWorkspaceState();
  assert(!storage.memory.has(key), 'clear must remove the persisted checklist record.');
  assert(state.checklist.items.every(item => item.status === engine.STATUS.PENDING), 'clear must leave the in-memory checklist in a clean pending state.');
  assert(state.diagnostics.storageHealth.lastSavedAt === '', 'clear must remove the last-saved timestamp.');
}

// 3. Planner regeneration and identity compatibility.
{
  const engine = freshEngine();
  const storage = createStorage();
  const plan = makePlan();
  engine.restoreFromPlan(plan, { storage, now: clock.first });
  let state = engine.getWorkspaceState();
  const originalPlanFingerprint = state.diagnostics.plannerFingerprint;
  const originalChecklistId = state.checklist.checklistId;
  const originalItemIds = state.checklist.items.map(item => item.id);
  engine.complete(originalItemIds[0], { storage, now: clock.second });

  engine.restoreFromPlan(plan, { storage, now: clock.third });
  state = engine.getWorkspaceState();
  assert(state.diagnostics.plannerFingerprint === originalPlanFingerprint, 'Equivalent planner regeneration must preserve the planner fingerprint.');
  assert(state.checklist.checklistId === originalChecklistId, 'Equivalent planner regeneration must preserve checklist identity.');
  assert(JSON.stringify(state.checklist.items.map(item => item.id)) === JSON.stringify(originalItemIds), 'Equivalent planner regeneration must preserve deterministic item IDs.');
  assert(state.checklist.items[0].status === engine.STATUS.COMPLETE, 'Equivalent planner regeneration must restore compatible persisted statuses.');
  assert(state.diagnostics.storageHealth.restored === true, 'Equivalent planner regeneration must report restored persistence.');

  const changedPlan = makePlan({
    plannerVersion: 'planner-regression-2',
    sections: makePlan().sections.concat([{ id: 'close', title: 'Close', items: [{ id: 'next-steps', title: 'Next steps', estimatedMinutes: 2 }] }])
  });
  engine.restoreFromPlan(changedPlan, { storage, now: clock.later });
  state = engine.getWorkspaceState();
  assert(state.diagnostics.plannerFingerprint !== originalPlanFingerprint, 'Changed planner content must produce a new planner fingerprint.');
  assert(state.checklist.checklistId !== originalChecklistId, 'Changed planner content must produce a new checklist identity.');
  assert(state.summary.total === 5, 'Regenerated checklist must reflect newly added planner items.');
  assert(state.summary.completed === 0, 'A changed plan must not inherit statuses from the prior checklist identity.');
  assert(state.plannerVersion === 'planner-regression-2', 'Workspace contract must expose the regenerated planner version.');
}

// 4. Persistence compatibility, corruption recovery, and expiration.
{
  const storage = createStorage();
  let engine = freshEngine();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.first });
  let state = engine.getWorkspaceState();
  const firstId = state.checklist.items[0].id;
  const key = state.diagnostics.storageHealth.storageKey;
  engine.complete(firstId, { storage, now: clock.second });

  engine = freshEngine();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.third });
  state = engine.getWorkspaceState();
  assert(state.checklist.items[0].status === engine.STATUS.COMPLETE, 'A fresh engine instance must restore persisted item status.');
  assert(state.diagnostics.storageHealth.status === 'healthy', 'Successful restoration must report healthy storage.');
  assert(state.checklist.restoredAt === '2026-07-26T12:10:00.000Z', 'Restoration timestamp must use the supplied clock.');

  storage.memory.set(key, '{invalid-json');
  engine = freshEngine();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.third });
  state = engine.getWorkspaceState();
  assert(!storage.memory.has(key), 'Invalid JSON persistence must be removed during recovery.');
  assert(state.summary.completed === 0, 'Invalid persisted data must not affect generated checklist state.');
  assert(state.diagnostics.storageHealth.reason.includes('invalid'), 'Invalid persistence recovery must be exposed in diagnostics.');

  engine = freshEngine();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.first });
  state = engine.getWorkspaceState();
  engine.complete(state.checklist.items[0].id, { storage, now: clock.first });
  engine = freshEngine();
  engine.restoreFromPlan(makePlan(), { storage, now: () => new Date('2026-09-30T12:00:00.000Z'), maxAgeDays: 30 });
  state = engine.getWorkspaceState();
  assert(state.summary.completed === 0, 'Expired persistence must not restore item status.');
  assert(state.diagnostics.storageHealth.reason.includes('expired'), 'Expired persistence must be reported in diagnostics.');
  assert(!storage.memory.has(state.diagnostics.storageHealth.storageKey), 'Expired persistence must be removed.');
}

// 5. Workspace contract integrity and diagnostics invariants.
{
  const engine = freshEngine();
  const storage = createStorage();
  engine.restoreFromPlan(makePlan(), { storage, now: clock.first });
  const state = engine.getWorkspaceState();
  assert(Object.isFrozen(state), 'Workspace state must be immutable.');
  assert(Object.isFrozen(state.checklist), 'Workspace checklist must be immutable.');
  assert(Object.isFrozen(state.checklist.items), 'Workspace checklist items array must be immutable.');
  assert(Object.isFrozen(state.checklist.items[0]), 'Workspace checklist items must be immutable.');
  assert(Object.isFrozen(state.summary), 'Workspace summary must be immutable.');
  assert(Object.isFrozen(state.progress), 'Workspace progress must be immutable.');
  assert(Object.isFrozen(state.diagnostics), 'Workspace diagnostics must be immutable.');
  assert(Object.isFrozen(state.diagnostics.storageHealth), 'Nested storage diagnostics must be immutable.');
  assert(state.version === engine.VERSION, 'Workspace contract version must match the checklist engine version.');
  assert(state.diagnostics.engineVersion === engine.VERSION, 'Diagnostics engine version must match the public engine version.');
  assert(state.diagnostics.plannerFingerprint === state.checklist.planFingerprint, 'Workspace planner fingerprint must match checklist plan identity.');
  assert(state.diagnostics.integrityStatus === 'healthy', 'A valid generated checklist must report healthy integrity.');
  assert(state.summary.total === state.checklist.items.length, 'Workspace summary total must match checklist item count.');
  assert(state.progress.remainingMinutes === state.remainingMinutes, 'Workspace progress and top-level remaining minutes must agree.');
  assert(state.currentPhase === state.checklist.currentPhaseId, 'Workspace current phase must match checklist state.');

  const originalTitle = state.checklist.items[0].title;
  try { state.checklist.items[0].title = 'Mutated'; } catch (_) {}
  const freshState = engine.getWorkspaceState();
  assert(freshState.checklist.items[0].title === originalTitle, 'External mutation attempts must not alter engine state.');
  assert(freshState.diagnostics.checklistFingerprint === state.diagnostics.checklistFingerprint, 'Equivalent immutable snapshots must retain the same checklist fingerprint.');
}

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5A.4.5B', passed: false, checks, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  sprint: 'AW-5A.4.5B',
  passed: true,
  checks,
  coverage: [
    'progress-calculations',
    'reset-behavior',
    'planner-regeneration',
    'persistence-compatibility',
    'workspace-contract-integrity'
  ]
}, null, 2));
