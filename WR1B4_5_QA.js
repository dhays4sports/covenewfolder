const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const motionSource = fs.readFileSync(path.join(root, 'assets/js/workspace-motion.js'), 'utf8');
const workspaceSource = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const checks = [];
function check(name, condition) { if (!condition) throw new Error('FAIL: ' + name); checks.push(name); }

let nextTimer = 1;
const timers = new Map();
const context = {
  console,
  WeakMap,
  Promise,
  setTimeout(fn, delay) { const id = nextTimer++; timers.set(id, { fn, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(motionSource, context);
const motion = context.CoverageFitWorkspaceMotion;
const classes = new Set();
const element = {
  offsetWidth: 100,
  classList: {
    add(name) { classes.add(name); },
    remove(name) { classes.delete(name); }
  }
};

check('version advanced', (() => { const [a,b,c]=version.split('.').map(Number); return a>3 || (a===3 && (b>14 || (b===14 && c>=8))); })());
check('motion utility upgraded', motion.VERSION === '0.2.0');
check('restartClass exposed', typeof motion.restartClass === 'function');
check('scheduleClassCleanup exposed', typeof motion.scheduleClassCleanup === 'function');
check('cancelClassCleanup exposed', typeof motion.cancelClassCleanup === 'function');
motion.restartClass(element, 'audit-motion', 100, 20);
check('motion class starts immediately', classes.has('audit-motion'));
check('one cleanup timer scheduled', timers.size === 1);
motion.restartClass(element, 'audit-motion', 100, 20);
check('duplicate cleanup timer replaced', timers.size === 1);
const timer = Array.from(timers.values())[0];
timer.fn();
check('motion class cleaned after timer', !classes.has('audit-motion'));
check('workspace uses centralized cleanup', workspaceSource.includes("motion.restartClass(element, className"));
check('timeline uses centralized cleanup', workspaceSource.includes("motion.restartClass(item, className"));
check('progress uses centralized cleanup', workspaceSource.includes("motion.restartClass(element, 'checklist-progress--motion-update'"));
check('sidebar uses centralized cleanup', workspaceSource.includes("motion.restartClass(sidebar, 'checklist-sidebar--motion-toggle'"));
check('reduced motion CSS remains', css.includes('@media (prefers-reduced-motion: reduce)'));
check('native focus restoration remains', workspaceSource.includes('restoreInteractionFocus()'));
check('native confirmation remains', workspaceSource.includes('window.confirm(message)'));
console.log(`WR-1B.4.5 QA passed: ${checks.length} checks`);
