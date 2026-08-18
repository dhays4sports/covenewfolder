const fs = require('fs');
const path = require('path');
const root = __dirname;
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const checks = [
  ['version', /^3\.(1[5-9]|[2-9]\d)\.\d+$/.test(version)],
  ['reduced motion scroll helper', js.includes('function safeScrollIntoView') && js.includes("settings.behavior = prefersReducedMotion() ? 'auto'")],
  ['timeline uses safe scroll', js.includes("safeScrollIntoView(current")],
  ['checklist uses safe scroll', js.includes("safeScrollIntoView(byId(`checklist-item-${itemId}`)")],
  ['editable shortcut guard', js.includes('function isTypingTarget')],
  ['refresh shortcut', js.includes("key === 'r'") && html.includes('aria-keyshortcuts="Alt+R"')],
  ['checklist shortcut', js.includes("key === 'c'") && html.includes('aria-keyshortcuts="Alt+C"')],
  ['shortcut listener managed', js.includes("listen(document, 'keydown', handleWorkspaceShortcuts)")],
  ['sticky header depth', js.includes('syncStickyHeaderDepth') && css.includes('.workspace-header.is-scrolled')],
  ['passive scroll listener', js.includes("listen(window, 'scroll', syncStickyHeaderDepth, { passive: true })")],
  ['refresh guard', js.includes('workspaceRenderInProgress') && js.includes('setRefreshBusy(true)')],
  ['busy control feedback', css.includes('.button.is-busy::after') && css.includes('@keyframes workspace-control-spin')],
  ['reset cancellation feedback', js.includes("announce('Phase reset cancelled.')") && js.includes("announce('Full checklist reset cancelled.')")],
  ['touch interaction polish', css.includes('touch-action: manipulation') && css.includes('-webkit-tap-highlight-color: transparent')],
  ['press feedback', css.includes(':active:not(:disabled)')],
  ['hover capability query', css.includes('@media (hover: hover) and (pointer: fine)')],
  ['disabled state', css.includes('cursor: not-allowed')],
  ['sticky scroll margins', css.includes('scroll-margin-top: 104px')],
  ['reduced motion interaction safeguard', css.includes('@media (prefers-reduced-motion: reduce)')]
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ sprint: 'WR-1B.9', passed: !failures.length, checks: checks.length, failures }, null, 2));
if (failures.length) process.exit(1);
