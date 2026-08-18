'use strict';

const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(html.includes('id="checklistPhaseList"'), 'Checklist phase list mount is missing.');
assert(html.includes('id="checklistOverviewText"'), 'Checklist overview text mount is missing.');
assert(!html.includes('Checklist phases and items will render here in AW-5B.2.'), 'AW-5B.1 phase placeholder must be removed.');
assert(!html.includes('Detailed progress appears when checklist rendering is added.'), 'AW-5B.1 progress placeholder copy must be removed.');

assert(js.includes('function renderChecklist(state)'), 'Read-only checklist renderer is missing.');
assert(js.includes("Array.isArray(checklist?.phases)"), 'Renderer must consume phases from the workspace contract.');
assert(js.includes("Array.isArray(checklist?.items)"), 'Renderer must consume items from the workspace contract.');
assert(js.includes('renderChecklist(state);'), 'Checklist lifecycle events must trigger rendering.');
assert(js.includes("item.required === false ? 'Optional' : 'Required'"), 'Required and optional labels are missing.');
assert(js.includes('formatMinutes(item.estimatedMinutes)'), 'Item time metadata is missing.');
assert(js.includes("phase.id === currentPhaseId"), 'Current phase detection is missing.');
assert(js.includes("item.status === 'complete'"), 'Completed item styling state is missing.');

[
  '.checklist-phase-list',
  '.checklist-phase--current',
  '.checklist-phase--complete',
  '.checklist-item--active',
  '.checklist-item--complete',
  '.checklist-item__time',
  '.checklist-item__meta'
].forEach(selector => assert(css.includes(selector), `Missing rendering style: ${selector}`));

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5B.2', passed: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'AW-5B.2', passed: true, checks: 19 }, null, 2));
