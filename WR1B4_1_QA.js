const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = __dirname;
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/workspace-motion.js'), 'utf8');
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
[
  '--duration-instant:', '--duration-fast:', '--duration-normal:', '--duration-slow:',
  '--ease-standard:', '--ease-emphasized:', '--ease-exit:'
].forEach(token => ok(css.includes(token), `Missing ${token}`));
ok(css.includes('.motion-fade-enter'), 'Missing fade utility');
ok(css.includes('.motion-slide-up-enter'), 'Missing slide utility');
ok(css.includes('.motion-scale-enter'), 'Missing scale utility');
ok(css.includes('.motion-collapse'), 'Missing collapse utility');
ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Missing reduced motion media query');
ok(html.includes('/assets/js/workspace-motion.js'), 'Motion helper not loaded by Workspace');
const sandbox = {
  window: {
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: fn => { fn(); return 1; },
    cancelAnimationFrame() {},
    setTimeout: fn => { fn(); return 1; },
    clearTimeout() {},
    Promise
  },
  globalThis: {}
};
vm.createContext(sandbox);
vm.runInContext(js, sandbox);
const api = sandbox.window.CoverageFitWorkspaceMotion;
ok(api && /^0\.(?:[1-9]|[1-9]\d+)\.0$/.test(api.VERSION), 'Motion API missing');
ok(Object.isFrozen(api), 'Motion API must be frozen');
ok(api.getDuration('fast') === 160, 'Fast duration mismatch');
ok(api.getDuration('slow') === 320, 'Slow duration mismatch');
ok(typeof api.nextFrame(() => {}) === 'function', 'nextFrame must return cancellation function');
const reducedSandbox = { window: { matchMedia: () => ({ matches: true }) }, globalThis: {} };
vm.createContext(reducedSandbox);
vm.runInContext(js, reducedSandbox);
ok(reducedSandbox.window.CoverageFitWorkspaceMotion.getDuration('slow') === 0, 'Reduced motion must resolve to zero duration');
console.log(JSON.stringify({ suite: 'WR-1B.4.1 Motion Foundation', checks, passed: checks }, null, 2));
