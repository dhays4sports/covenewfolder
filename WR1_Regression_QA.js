'use strict';

const fs = require('fs');
const path = require('path');
const failures = [];
let checks = 0;
function assert(condition, message) { checks += 1; if (!condition) failures.push(message); }

const enginePath = path.join(__dirname, 'assets/js/consultation-checklist.js');
function freshEngine() { delete require.cache[require.resolve(enginePath)]; return require(enginePath); }
function storage(initial) {
  const memory = new Map(initial || []);
  return {
    memory,
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); }
  };
}
function plan() {
  return {
    state: 'ready', schemaVersion: '1.0', plannerVersion: 'wr1a-planner', customer: { name: 'Hardening Test' },
    sections: [
      { id: 'opening', title: 'Opening', items: [{ id: 'a', title: 'A', estimatedMinutes: 1 }, { id: 'b', title: 'B', estimatedMinutes: 2 }] },
      { id: 'review', title: 'Review', items: [{ id: 'c', title: 'C', estimatedMinutes: 3 }, { id: 'd', title: 'D', estimatedMinutes: 4 }] }
    ]
  };
}

// Repeated reset cycles must remain deterministic and persistable.
{
  const engine = freshEngine();
  const store = storage();
  engine.restoreFromPlan(plan(), { storage: store });
  const ids = engine.getWorkspaceState().checklist.items.map(item => item.id);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    ids.forEach((id, index) => index % 2 ? engine.activate(id, { storage: store }) : engine.complete(id, { storage: store }));
    engine.reset({ storage: store });
    const state = engine.getWorkspaceState();
    assert(state.summary.completed === 0 && state.summary.active === 0, `Reset cycle ${cycle + 1}: no completed or active state may leak.`);
    assert(state.summary.pending === state.summary.total, `Reset cycle ${cycle + 1}: all items must be pending.`);
    assert(state.diagnostics.integrityStatus === 'healthy', `Reset cycle ${cycle + 1}: integrity must remain healthy.`);
  }
}

// Rapid toggling should always settle on the latest requested state.
{
  const engine = freshEngine();
  const store = storage();
  engine.restoreFromPlan(plan(), { storage: store });
  const id = engine.getWorkspaceState().checklist.items[0].id;
  for (let i = 0; i < 50; i += 1) {
    if (i % 3 === 0) engine.complete(id, { storage: store });
    else if (i % 3 === 1) engine.reopen(id, { storage: store });
    else engine.activate(id, { storage: store });
  }
  const state = engine.getWorkspaceState();
  assert(state.checklist.items.find(item => item.id === id).status === engine.STATUS.PENDING, 'Rapid toggling: final reopen state must win.');
  assert(state.summary.pending + state.summary.active + state.summary.completed === state.summary.total, 'Rapid toggling: summary counts must remain internally consistent.');
}

// Storage failure modes must degrade without crashing.
{
  const throwingStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('blocked'); }
  };
  const engine = freshEngine();
  let threw = false;
  try {
    engine.restoreFromPlan(plan(), { storage: throwingStorage });
    const id = engine.getWorkspaceState().checklist.items[0].id;
    engine.complete(id, { storage: throwingStorage });
    engine.reset({ storage: throwingStorage });
  } catch (_) { threw = true; }
  assert(!threw, 'Storage failure: blocked or quota-limited storage must not crash the checklist engine.');
  assert(['warning', 'healthy'].includes(engine.getWorkspaceState().diagnostics.integrityStatus), 'Storage failure: checklist integrity must remain usable.');
}

// Corrupt and incompatible records must be ignored and removed.
{
  const engine = freshEngine();
  const store = storage();
  engine.restoreFromPlan(plan(), { storage: store });
  let state = engine.getWorkspaceState();
  const key = state.diagnostics.storageHealth.storageKey;
  store.memory.set(key, JSON.stringify({ schemaVersion: '999', checklistId: state.checklist.checklistId, items: [] }));
  const next = freshEngine();
  next.restoreFromPlan(plan(), { storage: store });
  state = next.getWorkspaceState();
  assert(state.summary.completed === 0, 'Incompatible storage: no status may be restored.');
  assert(!store.memory.has(key), 'Incompatible storage: invalid record must be removed.');
}

// Missing planner shape and empty planner must remain safe.
{
  const engine = freshEngine();
  let threw = false;
  try { engine.restoreFromPlan(null, {}); } catch (_) { threw = true; }
  assert(!threw, 'Missing planner: null planner input must not crash the engine.');
  assert(engine.getWorkspaceState().summary.total === 0, 'Missing planner: checklist must be empty.');
  engine.restoreFromPlan({ state: 'empty', plannerVersion: 'wr1a-empty', sections: [], items: [] }, {});
  assert(engine.getWorkspaceState().diagnostics.integrityStatus === 'empty', 'Empty planner: diagnostics must report empty integrity.');
}

// Source-level browser resilience checks for responsive and navigation behavior.
{
  const source = fs.readFileSync(path.join(__dirname, 'assets/js/agent-workspace.js'), 'utf8');
  assert(source.includes("window.addEventListener('resize', syncChecklistSidebarForViewport)") || source.includes("listen(window, 'resize', syncChecklistSidebarForViewport)"), 'Responsive hardening: resize listener must remain installed.');
  assert(source.includes('mobileSidebarPreference'), 'Responsive hardening: manual mobile preference must be preserved.');
  assert(source.includes("event.key !== 'Escape'") || source.includes("event.key === 'Escape'"), 'Keyboard hardening: Escape collapse behavior must remain available.');
  assert(source.includes("event.key === 'ArrowRight'") && source.includes("event.key === 'ArrowLeft'"), 'Keyboard hardening: timeline arrow navigation must remain available.');
  assert(source.includes('coveragefit:consultation-checklist-change') && source.includes('coveragefit:consultation-checklist-reset'), 'Event hardening: workspace must continue listening for checklist updates and resets.');
}

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'WR-1A Regression Hardening', passed: false, checks, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'WR-1A Regression Hardening', passed: true, checks, coverage: ['reset-cycles', 'rapid-toggle', 'storage-failure', 'corrupt-storage', 'missing-planner', 'responsive-keyboard-events'] }, null, 2));
