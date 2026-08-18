const fs = require('fs');
const path = require('path');
const root = __dirname;
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();

const checks = [
  ['release version is 3.14.9 or newer', /^3\.(14\.(?:9|[1-9]\d)|(?:1[5-9]|[2-9]\d)\.\d+)$/.test(version)],
  ['shared component dimension tokens exist', css.includes('--control-height-md') && css.includes('--card-padding')],
  ['shared card component exists', css.includes('.cf-card {') && css.includes('.cf-card--inset {')],
  ['shared button component exists', css.includes('.cf-button {') && css.includes('.cf-button--primary') && css.includes('.cf-button--secondary')],
  ['shared badge and section heading components exist', css.includes('.cf-badge {') && css.includes('.cf-section-heading {')],
  ['shared state/list/progress components exist', css.includes('.cf-state {') && css.includes('.cf-list {') && css.includes('.cf-progress-track {')],
  ['static workspace cards opt into shared card component', html.includes('workspace-card cf-card workspace-card--summary')],
  ['static buttons opt into shared button component', html.includes('button--primary cf-button cf-button--primary')],
  ['static headings opt into shared heading component', html.includes('card-heading cf-section-heading')],
  ['checklist progress uses shared progress track', html.includes('checklist-progress__track cf-progress-track')],
  ['generated recommendation cards use shared inset card', js.includes('recommendation-card cf-card cf-card--inset')],
  ['generated checklist phases use shared inset card', js.includes('checklist-phase cf-card cf-card--inset')],
  ['generated timeline list uses shared list component', js.includes('conversation-timeline__list cf-list')],
  ['legacy classes remain available', css.includes('.workspace-card') && css.includes('.button--primary') && css.includes('.workspace-inline-state')],
  ['no behavior APIs were added to component cleanup', !js.includes('CoverageFitWorkspaceComponents')]
];

const failed = checks.filter(([, ok]) => !ok);
console.log(JSON.stringify({ suite: 'WR-1B.5 Component Cleanup', checks: checks.length, passed: checks.length - failed.length, failed: failed.map(([name]) => name) }, null, 2));
if (failed.length) process.exit(1);
