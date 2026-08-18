#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const checks = [
  ['version is 3.14.3 or newer', /^3\.(1[4-9]|[2-9]\d)\.\d+$/.test(version)],
  ['page recovery state exists', html.includes('workspace-state--page') && html.includes('emptyStateRetry')],
  ['page state supports distinct error tone', js.includes("reason === 'adapter'") && js.includes("tone: 'error'")],
  ['missing assessment has assessment action', js.includes("primaryHref: '/assessment/'") && js.includes('Complete a Home assessment on this device first.')],
  ['property unavailable state exists', html.includes('id="propertyState"') && js.includes('Property details unavailable')],
  ['recommendations unavailable state exists', html.includes('id="recommendationState"') && js.includes('No recommendation topics available')],
  ['planner unavailable state has recovery action', js.includes('Conversation plan unavailable') && js.includes('data-workspace-action="retry"')],
  ['checklist empty and error states have retry controls', (html.match(/data-workspace-action="retry"/g) || []).length >= 3],
  ['storage limitation state exists', html.includes('id="checklistStorageState"') && js.includes('storageUnavailable')],
  ['workspace action delegation exists', js.includes('function handleWorkspaceAction(event)') && js.includes("document.addEventListener?.('click', handleWorkspaceAction)" ) || js.includes("listen(document, 'click', handleWorkspaceAction)")],
  ['inline-state helper escapes content', js.includes('function setInlineState(id, options)') && js.includes('escapeHtml(settings.title')],
  ['state system is responsive and forced-colors aware', css.includes('.workspace-state--page') && css.includes('@media (forced-colors: active)')],
];
let failures = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`); if (!ok) failures++; }
console.log(`WR-1B.3: ${checks.length - failures}/${checks.length} checks passed`);
process.exit(failures ? 1 : 0);
