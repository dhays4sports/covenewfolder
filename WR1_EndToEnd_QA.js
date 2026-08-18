'use strict';

const path = require('path');
const failures = [];
let checks = 0;
function assert(condition, message) { checks += 1; if (!condition) failures.push(message); }

const dataPath = path.join(__dirname, 'assets/js/workspace-data.js');
const plannerPath = path.join(__dirname, 'assets/js/conversation-planner.js');
const checklistPath = path.join(__dirname, 'assets/js/consultation-checklist.js');

function fresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function createStorage() {
  const memory = new Map();
  return {
    memory,
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); },
    clear() { memory.clear(); }
  };
}

function report(overrides) {
  return Object.assign({
    version: 'wr1a-fixture-1',
    assessment: 'home',
    createdAt: '2026-07-26T18:00:00.000Z',
    score: 72,
    status: 'Strong Foundation',
    consumer: { firstName: 'Jordan', lastName: 'Lee', email: 'jordan@example.com', phone: '4085550100' },
    strengths: ['Completed a structured protection review'],
    recommendations: [
      { id: 'liability', title: 'Liability limits', priority: 'High', confidence: 92, clientExplanation: 'Confirm that liability limits fit the household assets.', conversationStarter: 'How did you choose your current liability limits?' },
      { id: 'water', title: 'Water loss prevention', priority: 'Review', confidence: 82, clientExplanation: 'Review water-loss prevention and deductible expectations.', conversationStarter: 'What water detection or shutoff protection is installed today?' }
    ]
  }, overrides || {});
}

function propertyProfile() {
  return {
    address: { line1: '123 Main St', city: 'Fremont', state: 'CA', postalCode: '94539' },
    data: { yearBuilt: 1988, squareFeet: 2100, stories: 2, constructionType: 'Frame', roofType: 'Composition', foundationType: 'Slab' },
    fieldMeta: { yearBuilt: { verifiedByUser: true }, squareFeet: { verifiedByUser: true } }
  };
}

function runScenario(name, reportValue, propertyValue, expectedState) {
  const data = fresh(dataPath);
  const planner = fresh(plannerPath);
  const checklist = fresh(checklistPath);
  const storage = createStorage();
  const snapshot = data.getSnapshot({ report: reportValue, propertyProfile: propertyValue, storage });
  assert(snapshot.state === expectedState, `${name}: workspace snapshot state must be ${expectedState}.`);
  const plan = planner.getPlan(snapshot, { topicLimit: 5 });
  assert(plan.state === expectedState, `${name}: planner state must follow workspace snapshot state.`);
  const state = checklist.restoreFromPlan(plan, { storage, now: () => new Date('2026-07-26T18:05:00.000Z') });
  const workspace = checklist.getWorkspaceState();
  assert(Object.isFrozen(workspace), `${name}: workspace contract must be frozen.`);
  assert(workspace.checklist.state === expectedState, `${name}: checklist state must follow planner state.`);
  if (expectedState === 'ready') {
    assert(plan.items.length >= 4, `${name}: ready plan must contain a structured consultation agenda.`);
    assert(workspace.summary.total === plan.items.length, `${name}: checklist item count must equal planner item count.`);
    assert(workspace.diagnostics.integrityStatus === 'healthy', `${name}: ready checklist integrity must be healthy.`);
    assert(workspace.remainingMinutes > 0, `${name}: ready checklist must expose remaining minutes.`);
  } else {
    assert(workspace.summary.total === 0, `${name}: empty workspace must have no checklist items.`);
  }
  return { data, planner, checklist, storage, snapshot, plan, workspace, state };
}

const complete = runScenario('complete-home', report(), propertyProfile(), 'ready');
assert(complete.snapshot.customer.name === 'Jordan Lee', 'Complete Home: customer name must normalize correctly.');
assert(complete.snapshot.property.available === true, 'Complete Home: property profile must be available.');
assert(complete.snapshot.property.confirmation.verifiedCount === 2, 'Complete Home: verified property fields must be counted.');
assert(complete.plan.summary.topicCount === 2, 'Complete Home: recommendation topics must flow into planner.');

const partial = runScenario('partial-home', report({ score: null, consumer: {}, recommendations: [] }), null, 'ready');
assert(partial.snapshot.diagnostics.warnings.length >= 3, 'Partial Home: missing score, customer, recommendations, and property must produce warnings.');
assert(partial.plan.diagnostics.warnings.length >= 1, 'Partial Home: planner must warn when recommendation topics or property are missing.');
assert(partial.plan.items.some(item => item.id === 'context-property'), 'Partial Home: general property confirmation step must remain available.');

const empty = runScenario('empty-home', null, null, 'empty');
assert(empty.snapshot.diagnostics.isReady === false, 'Empty Home: diagnostics must report not ready.');
assert(empty.plan.sections.length === 0, 'Empty Home: planner must not invent sections.');

// End-to-end interaction, persistence, refresh, and reset walkthrough.
{
  const { checklist, storage, plan } = complete;
  let state = checklist.getWorkspaceState();
  const ids = state.checklist.items.map(item => item.id);
  checklist.activate(ids[0], { storage, now: () => new Date('2026-07-26T18:06:00.000Z') });
  checklist.complete(ids[0], { storage, now: () => new Date('2026-07-26T18:07:00.000Z') });
  checklist.complete(ids[1], { storage, now: () => new Date('2026-07-26T18:08:00.000Z') });
  state = checklist.getWorkspaceState();
  assert(state.summary.completed === 2, 'Walkthrough: two completed items must be reflected in summary.');
  assert(state.progress.completionPercent > 0, 'Walkthrough: progress percentage must advance.');
  assert(state.diagnostics.storageHealth.lastSavedAt === '2026-07-26T18:08:00.000Z', 'Walkthrough: latest mutation must be persisted.');

  const refreshed = fresh(checklistPath);
  refreshed.restoreFromPlan(plan, { storage, now: () => new Date('2026-07-26T18:09:00.000Z') });
  state = refreshed.getWorkspaceState();
  assert(state.summary.completed === 2, 'Refresh: persisted completion must restore in a fresh engine instance.');
  assert(state.diagnostics.storageHealth.restored === true, 'Refresh: diagnostics must report restored storage.');

  refreshed.reset({ storage, now: () => new Date('2026-07-26T18:10:00.000Z') });
  state = refreshed.getWorkspaceState();
  assert(state.summary.completed === 0, 'Reset: completion count must return to zero.');
  assert(state.summary.pending === state.summary.total, 'Reset: every item must return to pending.');
}

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'WR-1A End-to-End', passed: false, checks, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'WR-1A End-to-End', passed: true, checks, scenarios: ['complete-home', 'partial-home', 'empty-home', 'interaction-refresh-reset'] }, null, 2));
