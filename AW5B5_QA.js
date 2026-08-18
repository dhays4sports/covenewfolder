const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const checks = [
  ['timeline card', html.includes('id="conversationTimeline"')],
  ['timeline summary', html.includes('id="conversationTimelineSummary"')],
  ['timeline renderer', js.includes('function renderConversationTimeline')],
  ['source item mapping', js.includes('item.sourceItemId')],
  ['event-driven timeline refresh', js.includes('renderConversationTimeline(state)')],
  ['timeline activation handler', js.includes('function handleTimelineAction')],
  ['engine activation', js.includes('checklistEngine.activate(itemId)')],
  ['next item advancement', js.includes('const nextItem = orderedItems.slice')],
  ['timeline click listener', js.includes("byId('conversationTimeline')?.addEventListener") || js.includes("listen(byId('conversationTimeline')")],
  ['current timeline state', js.includes("status === 'current'")],
  ['completed timeline state', js.includes("status === 'complete'")],
  ['responsive timeline styling', css.includes('AW-5B.5 Conversation Timeline Synchronization')]
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
if (failed) process.exit(1);
console.log(`AW-5B.5 QA passed: ${checks.length} checks.`);
