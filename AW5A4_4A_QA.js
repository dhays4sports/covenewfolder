'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const engineSource = fs.readFileSync(path.join(__dirname, 'assets/js/consultation-checklist.js'), 'utf8');
const workspaceSource = fs.readFileSync(path.join(__dirname, 'assets/js/agent-workspace.js'), 'utf8');
const events = [];
const memory = new Map();

class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init?.detail; }
}

const window = {
  CustomEvent,
  dispatchEvent(event) { events.push(event); return true; },
  localStorage: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, String(value)); },
    removeItem(key) { memory.delete(key); }
  }
};
window.window = window;
window.globalThis = window;

vm.runInNewContext(engineSource, window, { filename: 'consultation-checklist.js' });
const api = window.CoverageFitConsultationChecklist;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(api.EVENTS.READY === 'coveragefit:consultation-checklist-ready', 'READY event name is incorrect.');
assert(api.EVENTS.CHANGE === 'coveragefit:consultation-checklist-change', 'CHANGE event name is incorrect.');
assert(api.EVENTS.RESET === 'coveragefit:consultation-checklist-reset', 'RESET event name is incorrect.');
assert(Object.isFrozen(api.EVENTS), 'EVENTS registry must be frozen.');

const plan = {
  state: 'ready',
  plannerVersion: 'test-planner-1',
  customer: { name: 'Test Customer' },
  sections: [{ id: 'opening', title: 'Opening', items: [
    { id: 'welcome', title: 'Welcome', phase: 'opening', phaseTitle: 'Opening', estimatedMinutes: 2 }
  ] }]
};

api.restoreFromPlan(plan);
const ready = events.find(event => event.type === api.EVENTS.READY);
assert(Boolean(ready), 'restoreFromPlan must emit the ready event.');
assert(ready?.detail?.state?.checklist?.state === 'ready', 'Ready event must carry workspace state.');
assert(Object.isFrozen(ready?.detail), 'Event detail must be immutable.');
assert(Object.isFrozen(ready?.detail?.state), 'Event workspace state must be immutable.');

const itemId = api.getWorkspaceState().checklist.items[0].id;
api.complete(itemId);
const change = events.find(event => event.type === api.EVENTS.CHANGE);
assert(Boolean(change), 'Status mutation must emit the change event.');
assert(change?.detail?.reason === 'status-change', 'Change event reason is incorrect.');
assert(change?.detail?.state?.summary?.completed === 1, 'Change event must expose updated state.');

api.resetItem(itemId);
const reset = events.find(event => event.type === api.EVENTS.RESET && event.detail?.reason === 'reset-item');
assert(Boolean(reset), 'resetItem must emit the reset event.');
assert(reset?.detail?.state?.summary?.pending === 1, 'Reset event must expose reset state.');

assert(workspaceSource.includes("addEventListener('coveragefit:consultation-checklist") || workspaceSource.includes("listen(window, 'coveragefit:consultation-checklist"), 'Workspace lifecycle listeners should remain integrated after AW-5A.4.4B.');
assert(!workspaceSource.includes("new CustomEvent('coveragefit:consultation-checklist-ready'"), 'Workspace must not duplicate checklist-ready dispatch.');

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5A.4.4A', passed: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'AW-5A.4.4A+', passed: true, checks: 14 }, null, 2));
