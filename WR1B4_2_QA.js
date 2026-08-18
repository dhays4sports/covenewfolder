const fs = require('fs');
const path = require('path');

const root = __dirname;
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();

const checks = [];
function check(name, condition) {
  if (!condition) throw new Error('FAIL: ' + name);
  checks.push(name);
}

check('version advanced', (() => { const [a,b,c]=version.split('.').map(Number); return a>3 || (a===3 && (b>14 || (b===14 && c>=5))); })());
check('motion state snapshot exists', js.includes('captureChecklistMotionState'));
check('motion application helper exists', js.includes('applyChecklistMotion'));
check('completion motion class exists', js.includes('checklist-item--motion-complete'));
check('reopen motion class exists', js.includes('checklist-item--motion-reopen'));
check('active motion class exists', js.includes('checklist-item--motion-active'));
check('shared motion helper used', js.includes('CoverageFitWorkspaceMotion'));
check('reduced motion checked in JS', js.includes('prefersReducedMotion'));
check('completion keyframes exist', css.includes('@keyframes workspace-checklist-complete'));
check('reopen keyframes exist', css.includes('@keyframes workspace-checklist-reopen'));
check('active keyframes exist', css.includes('@keyframes workspace-checklist-active'));
check('reduced motion CSS safeguard exists', css.includes('@media (prefers-reduced-motion: reduce)'));

console.log(`WR-1B.4.2 QA passed: ${checks.length} checks`);
