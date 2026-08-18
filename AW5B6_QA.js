const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('agent/workspace/index.html','utf8');
const js = fs.readFileSync('assets/js/agent-workspace.js','utf8');
const css = fs.readFileSync('agent/workspace/workspace.css','utf8');
[
  ['live announcement region', html.includes('id="workspaceAnnouncements"') && html.includes('aria-live="polite"')],
  ['workspace instructions', html.includes('id="workspaceA11yInstructions"')],
  ['timeline region semantics', html.includes('id="conversationTimeline"') && html.includes('role="region"') && html.includes('aria-labelledby="conversationTimelineTitle"')],
  ['keyboard timeline navigation', js.includes('handleTimelineKeydown') && js.includes("event.key === 'Home'") && js.includes("event.key === 'End'")],
  ['focus restoration', js.includes('restoreInteractionFocus')],
  ['mobile escape collapse', js.includes('handleSidebarKeydown') && js.includes("event.key !== 'Escape'")],
  ['screen reader utility', css.includes('.sr-only')],
  ['global focus-visible style', css.includes(':where(a, button, [tabindex]):focus-visible')],
  ['touch target sizing', css.includes('min-height: 44px')],
  ['forced colors support', css.includes('@media (forced-colors: active)')]
].forEach(([name, ok]) => assert.ok(ok, name));
console.log(JSON.stringify({suite:'AW-5B.6 Accessibility',checks:10,passed:10},null,2));
