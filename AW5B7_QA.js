const fs = require('fs');
const path = require('path');
const root = __dirname;
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const checks = [
  ['mobile optimization marker', css.includes('AW-5B.7 Mobile Optimization')],
  ['dynamic viewport height', css.includes('78dvh') && css.includes('82dvh')],
  ['safe area support', css.includes('env(safe-area-inset-bottom)')],
  ['bounded sidebar scroll', css.includes('overflow-y: auto') && css.includes('overscroll-behavior: contain')],
  ['sticky mobile header', css.includes('.checklist-sidebar__header') && css.includes('position: sticky')],
  ['sticky progress panel', css.includes('.checklist-progress') && css.includes('position: sticky')],
  ['narrow phone breakpoint', css.includes('@media (max-width: 380px)')],
  ['touch scrolling', css.includes('-webkit-overflow-scrolling: touch')],
  ['viewport sync function', js.includes('syncChecklistSidebarForViewport')],
  ['manual preference preservation', js.includes('mobileSidebarPreference') && js.includes('{ remember: true }')],
  ['resize integration', js.includes("window.addEventListener('resize', syncChecklistSidebarForViewport)") || js.includes("listen(window, 'resize', syncChecklistSidebarForViewport)")],
  ['sidebar semantics retained', html.includes('aria-controls="checklistSidebarBody"')]
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log(`AW-5B.7 passed ${checks.length} checks.`);
