
'use strict';
const fs=require('fs'); const path=require('path'); const root=__dirname;
const html=fs.readFileSync(path.join(root,'agent/workspace/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'agent/workspace/workspace.css'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/js/agent-workspace.js'),'utf8');
const failures=[]; const assert=(c,m)=>{if(!c)failures.push(m)};
[
  'data-checklist-action="reset-all"',
  'id="checklistResetAll"'
].forEach(v=>assert(html.includes(v),`Missing interaction markup: ${v}`));
[
  "function handleChecklistAction(event)",
  "data-checklist-action=\"toggle-complete\"",
  "data-checklist-action=\"activate\"",
  "data-checklist-action=\"reset-item\"",
  "data-checklist-action=\"reset-phase\"",
  "checklistEngine.complete(itemId)",
  "checklistEngine.reopen(itemId)",
  "checklistEngine.activate(itemId)",
  "checklistEngine.resetItem(itemId)",
  "checklistEngine.resetPhase(phaseId)",
  "checklistEngine.reset()",
  "handleChecklistAction"
].forEach(v=>assert(js.includes(v),`Missing interaction behavior: ${v}`));
assert(js.includes("window.CoverageFitAgentWorkspaceChecklist"),'Interactions must inspect event-delivered workspace state.');
assert(!js.includes('innerHTML = event'),'Interactions must not directly replace UI from raw events.');
assert(js.includes("window.confirm"),'Reset confirmation is missing.');
[
  '.checklist-item__check', '.checklist-item__actions', '.checklist-phase__reset', '.checklist-reset-all', ':focus-visible'
].forEach(v=>assert(css.includes(v),`Missing interaction style: ${v}`));
if(failures.length){console.error(JSON.stringify({sprint:'AW-5B.3',passed:false,failures},null,2));process.exit(1)}
console.log(JSON.stringify({sprint:'AW-5B.3',passed:true,checks:22},null,2));
