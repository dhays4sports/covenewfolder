const fs = require('fs');
const path = require('path');
const root = __dirname;
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();

const checks = [
  ['release version is 3.15.0 or newer', /^3\.(1[5-9]|[2-9][0-9])\.\d+$/.test(version)],
  ['stable signature helper exists', js.includes('function stableSignature(value)')],
  ['targeted text updater exists', js.includes('function updateText(element, value)')],
  ['targeted hidden-state updater exists', js.includes('function setHidden(element, hidden)')],
  ['checklist render signature exists', js.includes('lastChecklistStructureSignature') && js.includes('checklistSkips')],
  ['timeline render signature exists', js.includes('lastTimelineStructureSignature') && js.includes('timelineSkips')],
  ['property render signature exists', js.includes('lastPropertySignature') && js.includes('propertySkips')],
  ['recommendation render signature exists', js.includes('lastRecommendationSignature') && js.includes('recommendationSkips')],
  ['progress updates are targeted', js.includes('performanceStats.progressUpdates') && js.includes('bar.style.width !==')],
  ['performance diagnostics API exists', js.includes('CoverageFitAgentWorkspacePerformance') && js.includes("version: '1.0.0'")],
  ['performance snapshot is immutable', js.includes('return Object.freeze({ ...performanceStats })')],
  ['event duration measurement exists', js.includes('performanceStats.lastEventDurationMs') && js.includes('nowMs() - startedAt')],
  ['full checklist rebuild is skipped when unchanged', js.includes('structureSignature === lastChecklistStructureSignature')],
  ['full timeline rebuild is skipped when unchanged', js.includes('structureSignature === lastTimelineStructureSignature')],
  ['render signatures reset on full workspace refresh', js.includes("lastChecklistStructureSignature = '';\n    lastTimelineStructureSignature = '';")],
];

const failed = checks.filter(([, ok]) => !ok);
console.log(JSON.stringify({ suite: 'WR-1B.6 Render Performance', checks: checks.length, passed: checks.length - failed.length, failed: failed.map(([name]) => name) }, null, 2));
if (failed.length) process.exit(1);
