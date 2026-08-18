'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

[
  'workspaceLayout',
  'checklistSidebar',
  'checklistSidebarTitle',
  'checklistSidebarToggle',
  'checklistSidebarBody',
  'checklistProgressPlaceholder',
  'checklistLoadingState',
  'checklistEmptyState',
  'checklistErrorState',
  'checklistPhaseShell'
].forEach(id => assert(html.includes(`id="${id}"`), `Missing sidebar shell element: ${id}`));

assert(html.includes('aria-controls="checklistSidebarBody"'), 'Sidebar toggle must identify the controlled body.');
assert(html.includes('aria-expanded="true"'), 'Sidebar toggle must expose its initial expanded state.');
assert(html.includes('id="checklistProgressPlaceholder"'), 'Checklist overview region must remain available.');
assert(html.includes('id="checklistPhaseShell"'), 'Checklist phase region must remain available.');
const checklistMarkup = html.slice(html.indexOf('id="checklistSidebar"'), html.indexOf('id="recommendationBuilder"'));
assert(!checklistMarkup.includes('type="checkbox"'), 'AW-5B.1 must not introduce checklist checkbox interaction.');

assert(css.includes('.workspace-layout'), 'Workspace/sidebar layout styles are missing.');
assert(css.includes('.checklist-sidebar'), 'Sidebar visual shell styles are missing.');
assert(css.includes('position: sticky'), 'Desktop sidebar should use sticky positioning.');
assert(css.includes('@media (max-width: 860px)'), 'Responsive sidebar breakpoint is missing.');
assert(css.includes('.checklist-sidebar.is-collapsed .checklist-sidebar__body'), 'Mobile collapse behavior styles are missing.');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion handling must remain present.');

assert(js.includes('function setChecklistShellState'), 'Workspace must expose an internal shell-state controller.');
assert(js.includes('function setChecklistSidebarCollapsed'), 'Workspace must expose an internal collapse controller.');
assert(js.includes("setChecklistShellState('loading')"), 'Workspace must enter loading state before checklist restoration.');
assert(js.includes("setChecklistShellState(checklistState === 'ready'"), 'Checklist events must resolve the shell state.');
assert(js.includes("byId('checklistSidebarToggle')?.addEventListener('click'") || js.includes("listen(byId('checklistSidebarToggle'), 'click'"), 'Sidebar toggle listener is missing.');
assert(!js.includes('setItemStatus('), 'AW-5B.1 must not add checklist mutation controls.');

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5B.1', passed: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ sprint: 'AW-5B.1', passed: true, checks: 26 }, null, 2));
