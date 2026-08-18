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
const html = read('agent/workspace/index.html');
const js = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
const roadmap = read('AW-UI-2_ROADMAP.md');
const contract = JSON.parse(read('AW_UI_2_2_CONTRACT.json'));

const versionParts = read('VERSION').trim().split('.').map(Number);
const packageVersionParts = JSON.parse(read('package.json')).version.split('.').map(Number);
const versionAtLeast = parts => (parts[0] * 1000000 + parts[1] * 1000 + parts[2]) >= 3020062;
check('receiver remains at or above CoverageFit 3.20.62', versionAtLeast(versionParts) && versionAtLeast(packageVersionParts));
check('Cloudflare root-deployment layout remains present', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'server', 'agent', 'assets', 'site.webmanifest'].every(exists));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('workspace contains no duplicate IDs', ids.length === new Set(ids).size);
check('native disclosure markup remains closed', (html.match(/<details\b/g) || []).length === (html.match(/<\/details>/g) || []).length);

const tabOrder = ['workspaceTabInbox', 'workspaceTabConsultation', 'workspaceTabPipeline'].map(id => html.indexOf(`id="${id}"`));
check('Inbox is first and selected in static tab order', tabOrder.every((value, index) => value >= 0 && (!index || value > tabOrder[index - 1])) && /aria-selected="true"[^>]+id="workspaceTabInbox"/.test(html));
check('Consultation is hidden until a review is opened', /data-workspace-panel="consultation"[^>]+hidden=""[^>]+id="workspaceViewConsultation"/.test(html));
check('runtime view order begins with Inbox', js.includes("let activeWorkspaceView = 'inbox'") && js.includes("Object.freeze(['inbox', 'consultation', 'pipeline'])") && js.includes("WORKSPACE_VIEWS.includes(view) ? view : 'inbox'"));
check('direct consultation links bypass the Inbox', js.includes("return requestedConsultationId() ? 'consultation' : 'inbox'") && js.includes('activateRequestedConsultation();') && js.includes('setWorkspaceView(initialWorkspaceView());'));
check('returning to Inbox clears the deep link without changing active-record storage', js.includes("next === 'inbox'") && js.includes("url.searchParams.delete('consultation_id')") && !/localStorage|sessionStorage/.test(js.slice(js.indexOf('function clearConsultationUrl'), js.indexOf('function renderConsultationRecords'))));

check('Inbox summary exposes four accessible quick filters', ['all', 'attention', 'new', 'today'].every(value => html.includes(`data-inbox-quick-filter="${value}"`)) && (html.match(/data-inbox-quick-filter=/g) || []).length === 4 && (html.match(/aria-pressed=/g) || []).length >= 4);
check('summary counts derive from existing delivery and follow-up state', js.includes("consultationStatus(record) === 'new'") && js.includes("timing === 'overdue' || timing === 'today'") && js.includes("followUpTiming(record) === 'today'"));
check('quick filters add no storage or API path', contract.newStorageKeys.length === 0 && contract.newApiRoutes.length === 0 && !/fetch\(|localStorage|sessionStorage/.test(js.slice(js.indexOf('function recordNeedsInboxAttention'), js.indexOf('function queueSortValue'))));
check('action-first sorting prioritizes overdue due-today and new work', js.includes("timing === 'overdue' ? 0") && js.includes("timing === 'today' ? 1") && js.includes("consultationStatus(record) === 'new' ? 2"));

check('search remains immediately visible', html.includes('id="consultationSearch"') && html.indexOf('id="consultationSearch"') < html.indexOf('id="consultationAdvancedFilters"'));
check('established filters remain under native progressive disclosure', html.includes('<details class="consultation-queue__advanced"') && ['consultationStatusFilter', 'consultationStageFilter', 'consultationFollowUpFilter'].every(id => html.includes(`id="${id}"`)));
check('clear filters resets search delivery stage follow-up and quick filter', js.includes("search.value = ''") && (js.match(/\.value = 'all'/g) || []).length >= 3 && js.includes("activeInboxQuickFilter = 'all'"));

check('queue rows include producer-readable identity reason property and received time', js.includes("name.textContent = plainText(record.customer?.name") && js.includes("reason.className = 'consultation-queue__item-reason'") && js.includes("record.customer?.propertyAddress") && js.includes('`Received ${displayDateTime(receivedAt)}`'));
check('queue rows preserve delivery stage and follow-up signals', js.includes("status.dataset.state = consultationStatus(record)") && js.includes("stage.dataset.stage = dispositionDetails(record).stage") && js.includes("followUp.dataset.state = followUpDisplayValue.state"));
check('each row has one primary open or continue action', js.includes("open.textContent = record.id === activeId ? 'Continue review' : 'Open review'") && js.includes("button--primary button--compact"));
check('new records remain unread while only the Inbox is viewed', js.includes("if (activeWorkspaceView === 'consultation') maybeMarkConsultationOpened(activeRecord)") && js.includes("next === 'consultation' && currentWorkspaceSnapshot"));
check('opening a row selects the existing consultation and enters Consultation view', js.includes("data.selectConsultation(id, { dispatch: false })") && js.includes("setWorkspaceView('consultation'"));

check('connected and saved-device states reuse the existing inbox connection', html.includes('id="inboxConnectionState"') && js.includes('const connection = remoteInboxConnection()') && js.includes("connected ? 'sync' : 'connect'"));
check('empty and no-match states provide recovery actions', ['inboxViewEmpty', 'inboxEmptyTitle', 'inboxEmptyMessage', 'consultationQueueEmpty'].every(id => html.includes(`id="${id}"`)) && html.includes('data-inbox-action="clear-filters"') && html.includes('data-inbox-action="connect"'));
check('connection recovery opens the existing secure setup and focuses its token field', js.includes('setRemoteInboxExpanded(true, { remember: true })') && js.includes("byId('remoteInboxToken')?.focus"));

check('desktop and mobile Inbox layouts are present', css.includes('AW-UI-2.2 — Inbox-First Agent Navigation') && css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))') && css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'));
check('summary disclosures and rows have visible keyboard/attention safeguards', css.includes('.inbox-summary button:focus-visible') && css.includes('.consultation-queue__advanced > summary:focus-visible') && css.includes('.consultation-queue__item.needs-attention'));
check('mobile primary actions retain 44-pixel targets', css.includes('.consultation-queue__item > .button { width: 100%; min-height: 44px; }'));
check('forced-colors treatment exists for selection and attention', css.includes('@media (forced-colors: active)') && css.includes('.inbox-summary button[aria-pressed="true"]'));

for (const sprint of ['AW-UI-2.1', 'AW-UI-2.2', 'AW-UI-2.3', 'AW-UI-2.4', 'AW-UI-2.5', 'AW-UI-2.6']) {
  check(`${sprint} remains in the packaged roadmap`, roadmap.includes(sprint));
}
check('roadmap preserves the AW-UI-2.2 boundary and carries AW-UI-2.3', roadmap.includes('AW-UI-2.2 — Inbox-First Agent Navigation — Complete in 3.20.62') && roadmap.includes('AW-UI-2.3 — Guided Consultation Focus Mode'));
check('completed contract preserves all existing architectures', Object.values(contract.preserved).every(Boolean) && contract.deferred.length === 4);
check('sprint artifacts contain no access secret values', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + read('SPRINT-AW-UI-2.2.md')));

console.log(`AW-UI-2.2 QA: ${checks.length}/${checks.length} passed`);
