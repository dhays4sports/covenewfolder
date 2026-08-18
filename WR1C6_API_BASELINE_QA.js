const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'WR1C_API_BASELINE.json'), 'utf8'));
const checks = [];
function check(name, condition) {
  checks.push({ name, pass: Boolean(condition) });
  if (!condition) console.error(`FAIL: ${name}`);
}
function includesAll(actual, expected) {
  return expected.every((name) => actual.includes(name));
}
function source(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

check('baseline status is frozen', baseline.status === 'frozen');
function semverParts(value) { return String(value).split('.').map(part => Number.parseInt(part, 10) || 0); }
function semverGte(actual, minimum) {
  const a = semverParts(actual);
  const b = semverParts(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return true;
}
const projectVersion = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
check('project version is at or above frozen baseline', semverGte(projectVersion, baseline.baselineVersion));

const data = require(path.join(root, 'assets/js/workspace-data.js'));
const planner = require(path.join(root, 'assets/js/conversation-planner.js'));
const checklist = require(path.join(root, 'assets/js/consultation-checklist.js'));

for (const [name, api] of [
  ['CoverageFitWorkspaceData', data],
  ['CoverageFitConversationPlanner', planner],
  ['CoverageFitConsultationChecklist', checklist]
]) {
  const expected = baseline.modules[name];
  check(`${name} is frozen`, Object.isFrozen(api));
  check(`${name} public members remain available`, includesAll(Object.keys(api), expected.publicMembers));
  check(`${name} version remains compatible`, semverGte(api.VERSION, expected.version));
  if (expected.schemaVersion) check(`${name} schema remains compatible`, api.SCHEMA_VERSION === expected.schemaVersion);
}

const checklistBaseline = baseline.modules.CoverageFitConsultationChecklist;
check('checklist storage schema remains compatible', checklist.STORAGE_SCHEMA_VERSION === checklistBaseline.storageSchemaVersion);
check('checklist storage prefix remains compatible', checklist.STORAGE_PREFIX === checklistBaseline.storagePrefix);
check('checklist status values remain compatible', JSON.stringify(Object.values(checklist.STATUS).sort()) === JSON.stringify(checklistBaseline.statuses.slice().sort()));
check('checklist lifecycle events remain compatible', checklist.EVENTS.READY === checklistBaseline.events.ready && checklist.EVENTS.CHANGE === checklistBaseline.events.change && checklist.EVENTS.RESET === checklistBaseline.events.reset);

const emptyState = checklist.getWorkspaceState();
check('workspace state remains deeply frozen', Object.isFrozen(emptyState) && Object.isFrozen(emptyState.checklist) && Object.isFrozen(emptyState.summary) && Object.isFrozen(emptyState.diagnostics) && Object.isFrozen(emptyState.progress));
check('workspace state fields remain compatible', includesAll(Object.keys(emptyState), checklistBaseline.workspaceStateFields));
check('workspace storage key remains prefixed', checklist.getStorageKey({ checklistId: 'baseline' }) === `${checklistBaseline.storagePrefix}.baseline`);

const dataBaseline = baseline.modules.CoverageFitWorkspaceData;
check('workspace report key remains compatible', data.REPORT_KEY === dataBaseline.storageKeys[0]);
check('workspace property key remains compatible', data.PROPERTY_KEY === dataBaseline.storageKeys[1]);
check('workspace subscribe returns unsubscribe', typeof data.subscribe(() => {}) === 'function');

const motionSource = source('assets/js/workspace-motion.js');
const motionBaseline = baseline.modules.CoverageFitWorkspaceMotion;
check('motion global remains exported', motionSource.includes('global.CoverageFitWorkspaceMotion = Object.freeze'));
check('motion version remains compatible', motionSource.includes(`var VERSION = '${motionBaseline.version}'`));
check('motion public members remain available', motionBaseline.publicMembers.every(name => motionSource.includes(`${name}:`) || motionSource.includes(`${name},`)));

const workspaceSource = source('assets/js/agent-workspace.js');
for (const name of ['CoverageFitAgentWorkspacePerformance', 'CoverageFitAgentWorkspaceLifecycle']) {
  const expected = baseline.modules[name];
  check(`${name} remains exported and frozen`, workspaceSource.includes(`window.${name} = Object.freeze`));
  check(`${name} version remains compatible`, workspaceSource.includes(`version: '${expected.version}'`));
  check(`${name} public members remain available`, expected.publicMembers.filter(member => member !== 'version').every(member => workspaceSource.includes(`${member}`)));
}
check('lifecycle snapshot fields remain compatible', baseline.modules.CoverageFitAgentWorkspaceLifecycle.snapshotFields.every(field => workspaceSource.includes(`${field}:`)));

const eventSources = [source('assets/js/workspace-data.js'), source('assets/js/conversation-planner.js'), source('assets/js/consultation-checklist.js')].join('\n');
const frozenEvents = [
  dataBaseline.readyEvent,
  dataBaseline.refreshEvent,
  baseline.modules.CoverageFitConversationPlanner.readyEvent,
  ...Object.values(checklistBaseline.events)
];
check('all frozen event names remain in source', frozenEvents.every(eventName => eventSources.includes(eventName)));

check('compatibility policy defines breaking-change boundary', ['patch', 'minor', 'major', 'deprecation'].every(key => baseline.compatibilityPolicy[key]));

const failed = checks.filter(item => !item.pass);
console.log(JSON.stringify({ suite: 'WR-1C.6 API Baseline', total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
process.exit(failed.length ? 1 : 0);
