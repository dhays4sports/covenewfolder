#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const checks = [
  ['version is at least 3.14.2', (() => { const [a,b,c]=version.split('.').map(Number); return a>3 || (a===3 && (b>14 || (b===14 && c>=2))); })()],
  ['workspace loading region exists', html.includes('id="workspaceLoading"') && html.includes('aria-busy="true"')],
  ['summary skeleton exists', html.includes('workspace-skeleton--summary') && html.includes('workspace-skeleton__summary')],
  ['timeline skeleton exists', html.includes('workspace-skeleton--timeline') && html.includes('skeleton-timeline')],
  ['recommendation skeleton exists', html.includes('workspace-skeleton--recommendations')],
  ['sidebar skeleton exists', html.includes('workspace-skeleton--sidebar') && html.includes('skeleton-checklist')],
  ['checklist spinner replaced by skeleton', html.includes('checklist-loading-skeleton') && !html.includes('checklist-shell-spinner')],
  ['loading helper exists', js.includes('function setWorkspaceLoading(isLoading)')],
  ['empty state clears loading', js.includes('function showEmpty(snapshot, reason)') && js.includes('setWorkspaceLoading(false);')],
  ['ready state clears loading', js.includes("setWorkspaceLoading(false);\n    byId('emptyState').hidden = true;" )],
  ['loading animation uses shared motion-safe behavior', css.includes('@keyframes workspace-skeleton-shimmer') && css.includes('@media (prefers-reduced-motion: reduce)')],
  ['loading layout is responsive', css.includes('@media (max-width: 980px)') && css.includes('.workspace-loading { grid-template-columns: 1fr; }')],
];
let failures = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failures++;
}
console.log(`WR-1B.2: ${checks.length - failures}/${checks.length} checks passed`);
process.exit(failures ? 1 : 0);
