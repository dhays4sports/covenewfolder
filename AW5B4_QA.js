const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const checks = [
  ['progress region', html.includes('id="checklistProgress"')],
  ['progress bar', html.includes('id="checklistProgressBar"')],
  ['progress count', html.includes('id="checklistProgressCount"')],
  ['remaining minutes', html.includes('id="checklistRemainingMinutes"')],
  ['current phase', html.includes('id="checklistCurrentPhase"')],
  ['complete state', html.includes('id="checklistCompleteState"')],
  ['render function', js.includes('function renderChecklistProgress')],
  ['uses contract progress', js.includes('state?.progress')],
  ['uses remaining minutes', js.includes('state?.remainingMinutes')],
  ['updates aria progress', js.includes("setAttribute('aria-valuenow'" )],
  ['complete calculation', js.includes('completed === total')],
  ['progress styling', css.includes('AW-5B.4 Live Progress Display')]
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
if (failed) process.exit(1);
console.log(`AW-5B.4 QA passed: ${checks.length} checks.`);
