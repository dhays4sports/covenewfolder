'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'assets/js/agent-workspace.js'), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(source.includes("addEventListener('coveragefit:consultation-checklist-ready'") || source.includes("listen(window, 'coveragefit:consultation-checklist-ready'"), 'Workspace must listen for checklist-ready.');
assert(source.includes("addEventListener('coveragefit:consultation-checklist-change'") || source.includes("listen(window, 'coveragefit:consultation-checklist-change'"), 'Workspace must listen for checklist-change.');
assert(source.includes("addEventListener('coveragefit:consultation-checklist-reset'") || source.includes("listen(window, 'coveragefit:consultation-checklist-reset'"), 'Workspace must listen for checklist-reset.');
assert(!source.includes('checklistEngine.getWorkspaceState()'), 'Workspace must not pull checklist state directly after event integration.');
assert(source.includes('event?.detail?.state'), 'Workspace must consume the event workspace-state contract.');
assert(source.includes('window.CoverageFitAgentWorkspaceChecklist = state'), 'Workspace global must be updated from event state.');

const listeners = new Map();
const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    const lastChild = { textContent: '' };
    elements.set(id, {
      id,
      hidden: false,
      className: '',
      textContent: '',
      innerHTML: '',
      querySelector() { return lastChild; },
      addEventListener() {},
      _lastChild: lastChild
    });
  }
  return elements.get(id);
}

class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init?.detail; }
}

const readyState = Object.freeze({
  checklist: Object.freeze({ state: 'ready', items: Object.freeze([{ id: 'item-1' }]) }),
  summary: Object.freeze({ total: 1, completed: 0, active: 0, pending: 1 }),
  diagnostics: Object.freeze({ valid: true }),
  progress: Object.freeze({ total: 1, completed: 0 }),
  currentPhase: 'opening',
  remainingMinutes: 2,
  plannerVersion: 'qa-planner',
  version: 'qa-engine'
});

const window = {
  CustomEvent,
  CoverageFitWorkspaceData: {
    getSnapshot() {
      return {
        state: 'ready',
        customer: { name: 'QA Customer' },
        assessment: { score: 82, status: 'Strong Foundation', createdAt: '2026-07-26T00:00:00.000Z', topPriority: 'Water', strongest: 'Liability' },
        executiveSummary: 'QA summary',
        property: { address: '1 Main St', yearBuilt: 2000, livingArea: 1500, stories: 1, construction: 'Frame', roof: 'Composition', foundation: 'Slab', pool: false, detachedStructures: false, available: true, confirmation: { label: 'Confirmed' } },
        recommendations: []
      };
    },
    subscribe() {}
  },
  CoverageFitConversationPlanner: {
    getPlan() {
      return { state: 'ready', plannerVersion: 'qa-planner', summary: { topicCount: 1, estimatedMinutes: 12 } };
    }
  },
  CoverageFitConsultationChecklist: {
    restoreFromPlan() {
      window.dispatchEvent(new CustomEvent('coveragefit:consultation-checklist-ready', { detail: { state: readyState, reason: 'plan-restored' } }));
    }
  },
  addEventListener(type, listener) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(listener);
  },
  dispatchEvent(event) {
    (listeners.get(event.type) || []).forEach(listener => listener(event));
    return true;
  }
};
window.window = window;
window.globalThis = window;

const document = { getElementById: element };
const context = { window, document, CustomEvent, Intl, Date, console };
vm.runInNewContext(source, context, { filename: 'agent-workspace.js' });

assert(window.CoverageFitAgentWorkspaceChecklist === readyState, 'Ready event must populate the Workspace checklist contract.');
assert(element('workspaceStatus')._lastChild.textContent.includes('1 checklist item prepared'), 'Ready event must refresh the Workspace status.');

const changedState = Object.freeze({ ...readyState, summary: Object.freeze({ total: 1, completed: 1, active: 0, pending: 0 }) });
window.dispatchEvent(new CustomEvent('coveragefit:consultation-checklist-change', { detail: { state: changedState, reason: 'status-change' } }));
assert(window.CoverageFitAgentWorkspaceChecklist === changedState, 'Change event must replace the Workspace checklist contract.');
assert(element('workspaceStatus')._lastChild.textContent.includes('1/1 complete'), 'Change event must refresh progress status.');

const resetState = Object.freeze({ ...readyState, summary: Object.freeze({ total: 1, completed: 0, active: 0, pending: 1 }) });
window.dispatchEvent(new CustomEvent('coveragefit:consultation-checklist-reset', { detail: { state: resetState, reason: 'reset' } }));
assert(window.CoverageFitAgentWorkspaceChecklist === resetState, 'Reset event must replace the Workspace checklist contract.');
assert(element('workspaceStatus')._lastChild.textContent.includes('0/1 complete'), 'Reset event must refresh progress status.');

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5A.4.4B', passed: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'AW-5A.4.4B', passed: true, checks: 12 }, null, 2));
