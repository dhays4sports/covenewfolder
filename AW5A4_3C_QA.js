'use strict';

const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'assets/js/agent-workspace.js'), 'utf8');

const failures = [];
function assert(condition, message) { if (!condition) failures.push(message); }

assert(source.includes('event?.detail?.state'), 'Agent Workspace must consume the immutable workspace contract from checklist events.');
assert(!source.includes('const checklist = checklistEngine'), 'Agent Workspace must not retain a directly consumed checklist snapshot.');
assert(!source.includes('window.CoverageFitAgentWorkspaceChecklist = checklist;'), 'Agent Workspace must not expose a direct checklist snapshot.');
assert(!source.includes("new CustomEvent('coveragefit:consultation-checklist-ready'"), 'Agent Workspace must not own checklist-ready event dispatch.');
assert(source.includes('window.CoverageFitAgentWorkspaceChecklist = state'), 'Workspace global must expose the event-delivered workspace contract.');
assert(source.includes('state?.summary?.total'), 'Checklist item count must come from the workspace contract summary.');

if (failures.length) {
  console.error(JSON.stringify({ sprint: 'AW-5A.4.3C', passed: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ sprint: 'AW-5A.4.3C', passed: true, checks: 6 }, null, 2));
