#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const workspace = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const behavior = read('assets/js/workspace-simplified-architecture.js');
const roadmap = read('AW-UI-2_ROADMAP.md');
const contract = JSON.parse(read('AW_UI_2_1_CONTRACT.json'));

const currentVersion = read('VERSION').trim();
check('receiver remains compatible with CoverageFit 3.20.61 or later', /^3\.20\.(?:6[1-9]|[7-9]\d|\d{3,})$/.test(currentVersion) && JSON.parse(read('package.json')).version === currentVersion);
check('Cloudflare Pages root deployment files remain present', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'agent', 'assets', 'site.webmanifest'].every(exists));
check('new native disclosures are closed and the main shell remains singular', (workspace.match(/<details\b/g) || []).length === (workspace.match(/<\/details>/g) || []).length && (workspace.match(/<main\b/g) || []).length === 1 && (workspace.match(/<\/main>/g) || []).length === 1);

const ids = [...workspace.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('workspace contains no duplicate IDs', new Set(ids).size === ids.length);

const criticalIds = [
  'refreshWorkspace', 'openConsultationDocument', 'openCustomerReport', 'workspaceTabs',
  'workspaceTabConsultation', 'workspaceTabInbox', 'workspaceTabPipeline', 'remoteInboxBar',
  'remoteInboxToken', 'remoteInboxConnect', 'workspaceViewConsultation', 'workspaceLayout',
  'activeCustomerHeader', 'activeCustomerName', 'customerCallAction', 'customerTextAction',
  'customerEmailAction', 'chooseConsultationAction', 'consultationFocus', 'consultationFocusProgress',
  'producerPilotReadiness', 'producerPilotReadinessChecks', 'producerPilotOutputConfirmed',
  'consultationCommandCenter', 'consultationProspectStory', 'consultationCommandPriorityList',
  'consultationCommandVerifyList', 'consultationDocumentStory', 'consultationProgress',
  'guidedQuestionsPanel', 'conversationTimeline', 'checklistSidebar', 'recommendationBuilder',
  'consultationCompletion', 'workspaceViewInbox', 'workspaceViewPipeline'
];
check('established dynamic workspace hooks remain present', criticalIds.every(id => ids.includes(id)));

check('simplified shell uses native Tools disclosure', workspace.includes('<details class="workspace-tools">') && workspace.includes('<summary><span aria-hidden="true" class="workspace-tools__icon">'));
check('secondary readiness uses native progressive disclosure', workspace.includes('workspace-readiness-disclosure') && workspace.includes('<em>Conversation readiness</em>'));
check('five-stage architecture is explicit and ordered', ['Prepare', 'Verify', 'Discuss', 'Recommend', 'Close'].every(label => workspace.includes(`<strong>${label}</strong>`)));
check('producer-facing workspace language replaces internal primary labels', workspace.includes('Your next clear step.') && workspace.includes('What matters for this review') && !workspace.includes('PC-1.5 live pilot preflight'));
check('workspace keeps all three established primary views', ['Consultation', 'Inbox', 'Pipeline'].every(label => workspace.includes(`>${label}</button>`)));

const requiredScripts = [
  '/assets/js/consultation-records.js', '/assets/js/remote-consultations.js',
  '/assets/js/protection-score.js', '/assets/js/consultation-command-center.js',
  '/assets/js/recommendation-builder.js', '/assets/js/consultation-progress.js',
  '/assets/js/producer-pilot-readiness.js', '/assets/js/consultation-completion.js',
  '/assets/js/consultation-checklist.js', '/assets/js/print-engine.js',
  '/assets/js/agent-workspace.js', '/assets/js/workspace-simplified-architecture.js'
];
check('consultation engines and simplified behavior remain wired', requiredScripts.every(source => workspace.includes(`src="${source}"`)));
check('simplified behavior supports outside click and Escape', behavior.includes("!tools.contains(event.target)") && behavior.includes("event.key !== 'Escape'"));
check('in-page links can reveal disclosed targets', behavior.includes("closest('details')") && behavior.includes('disclosure.open = true'));
check('readiness state is reflected without creating parallel state', behavior.includes("attributeFilter: ['data-state']") && !/localStorage|sessionStorage|fetch\(/.test(behavior));

check('CoverageFit navy shell and calm elevation are certified', css.includes('AW-UI-2.1 — Simplified Workspace Architecture') && css.includes('rgba(8, 38, 68, .97)') && css.includes('var(--shadow-sm)'));
check('mobile Tools menu and architecture strip are protected', css.includes('.workspace-tools .workspace-header__actions { display: grid; grid-template-columns: 1fr; }') && css.includes('grid-template-columns: repeat(5, minmax(52px, 1fr))'));
check('keyboard and forced-color safeguards exist', css.includes('.workspace-tools > summary:focus-visible') && css.includes('@media (forced-colors: active)'));

for (const sprint of ['AW-UI-2.1', 'AW-UI-2.2', 'AW-UI-2.3', 'AW-UI-2.4', 'AW-UI-2.5', 'AW-UI-2.6']) {
  check(`${sprint} is recorded in the packaged roadmap`, roadmap.includes(sprint));
}
check('roadmap preserves the completed AW-UI-2.1 boundary and carries AW-UI-2.2', roadmap.includes('AW-UI-2.1 — Simplified Workspace Architecture — Complete in 3.20.61') && roadmap.includes('AW-UI-2.2 — Inbox-First Agent Navigation'));
check('contract preserves established application architecture', Object.values(contract.preserved).every(Boolean) && contract.deferred.length === 5);
check('roadmap and sprint record contain no producer secret values', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + read('SPRINT-AW-UI-2.1.md')));

console.log(`AW-UI-2.1 QA: ${checks.length}/${checks.length} passed`);
