#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = __dirname;
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
const checks = [
  ['version is at least 3.14.1', /^3\.(1[4-9]|[2-9]\d)\.\d+$/.test(version)],
  ['semantic brand token exists', css.includes('--color-brand-900:')],
  ['semantic surface token exists', css.includes('--color-surface:')],
  ['semantic text token exists', css.includes('--color-text-900:')],
  ['spacing scale exists', css.includes('--space-1:') && css.includes('--space-16:')],
  ['radius scale exists', css.includes('--radius-sm:') && css.includes('--radius-pill:')],
  ['elevation scale exists', css.includes('--shadow-sm:') && css.includes('--shadow-lg:')],
  ['motion tokens exist', css.includes('--duration-fast:') && css.includes('--ease-standard:')],
  ['compatibility aliases exist', css.includes('--navy: var(--color-brand-900)') && css.includes('--line: var(--color-border)')],
  ['workspace cards use tokens', css.includes('.workspace-card,\n.empty-state,\n.checklist-sidebar')],
  ['buttons use tokenized transitions', css.includes('var(--duration-fast) var(--ease-standard)')],
  ['mobile spacing uses tokens', css.includes('padding: var(--space-3) var(--space-4)')],
];
let failures = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failures++;
}
console.log(`WR-1B.1: ${checks.length - failures}/${checks.length} checks passed`);
process.exit(failures ? 1 : 0);
