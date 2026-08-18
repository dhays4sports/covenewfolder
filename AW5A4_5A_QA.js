'use strict';

const path = require('path');
const engine = require(path.join(__dirname, 'assets/js/consultation-checklist.js'));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const memory = new Map();
const storage = {
  getItem(key) { return memory.has(key) ? memory.get(key) : null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};
const now = () => new Date('2026-07-26T12:00:00.000Z');
const plan = {
  state: 'ready',
  schemaVersion: '1.0',
  plannerVersion: 'planner-qa-1',
  customer: { name: 'Diagnostics QA' },
  sections: [{
    id: 'opening',
    title: 'Opening',
    items: [{ id: 'welcome', title: 'Welcome', estimatedMinutes: 2 }]
  }]
};

engine.restoreFromPlan(plan, { storage, now });
const first = engine.getWorkspaceState();
const d = first.diagnostics;
assert(d.engineVersion === engine.VERSION, 'Diagnostics must expose engine version.');
assert(d.plannerFingerprint === first.checklist.planFingerprint, 'Planner fingerprint must reuse the checklist plan fingerprint.');
assert(/^checklist-[a-z0-9]+$/.test(d.checklistFingerprint), 'Checklist fingerprint must use the expected stable format.');
assert(d.storageHealth && d.storageHealth.enabled === true, 'Storage health must report storage availability.');
assert(d.storageHealth.status === 'available', 'Unsaved available storage must be reported as available.');
assert(d.generationTimestamp === '2026-07-26T12:00:00.000Z', 'Generation timestamp must come from checklist generation.');
assert(d.integrityStatus === 'healthy', 'A valid ready checklist must report healthy integrity.');
assert(Object.isFrozen(first.diagnostics), 'Diagnostics in the Workspace contract must be immutable.');
assert(Object.isFrozen(first.diagnostics.storageHealth), 'Nested storage health must be immutable.');

const same = engine.getWorkspaceState();
assert(same.diagnostics.checklistFingerprint === d.checklistFingerprint, 'Equivalent checklist state must produce the same fingerprint.');
const itemId = first.checklist.items[0].id;
engine.complete(itemId, { storage, now });
const changed = engine.getWorkspaceState();
assert(changed.diagnostics.plannerFingerprint === d.plannerFingerprint, 'Status mutation must not change planner fingerprint.');
assert(changed.diagnostics.checklistFingerprint !== d.checklistFingerprint, 'Status mutation must change checklist fingerprint.');
assert(changed.diagnostics.storageHealth.status === 'healthy', 'Successful persistence must report healthy storage.');
assert(changed.diagnostics.storageHealth.lastSavedAt === '2026-07-26T12:00:00.000Z', 'Storage health must expose last save timestamp.');
assert(changed.diagnostics.integrityStatus === 'healthy', 'Valid checklist without warnings must report healthy integrity.');

const empty = engine.createEmpty({ generatedAt: '2026-07-26T13:00:00.000Z' });
const emptyDiagnostics = engine.diagnostics(empty);
assert(emptyDiagnostics.integrityStatus === 'empty', 'Empty checklists must report empty integrity.');

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5A.4.5A', passed: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'AW-5A.4.5A', passed: true, checks: 16 }, null, 2));
