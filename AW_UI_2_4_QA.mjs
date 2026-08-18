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
const contract = JSON.parse(read('AW_UI_2_4_CONTRACT.json'));
const sprint = read('SPRINT-AW-UI-2.4.md');

const versionParts = read('VERSION').trim().split('.').map(Number);
const packageVersionParts = JSON.parse(read('package.json')).version.split('.').map(Number);
const versionAtLeast = parts => (parts[0] * 1000000 + parts[1] * 1000 + parts[2]) >= 3020064;
check('receiver remains at or above CoverageFit 3.20.64', versionAtLeast(versionParts) && versionAtLeast(packageVersionParts));
check('Cloudflare root-deployment layout remains present', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'server', 'agent', 'assets', 'site.webmanifest'].every(exists));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('workspace contains no duplicate IDs', ids.length === new Set(ids).size);
check('native disclosure markup remains closed', (html.match(/<details\b/g) || []).length === (html.match(/<\/details>/g) || []).length);
check('existing active homeowner IDs remain intact', ['activeCustomerHeader', 'activeCustomerName', 'activeCustomerProperty', 'activeCustomerReason', 'activeCustomerReceived'].every(id => html.includes(`id="${id}"`)));
check('active consultation is explicitly the snapshot rail', html.includes('class="active-customer-header active-customer-header--snapshot cf-card"'));

check('snapshot exposes top priority status and next step', ['activeCustomerPriority', 'activeCustomerStatus', 'activeCustomerNextStep'].every(id => html.includes(`id="${id}"`)));
check('top priority derives from the existing assessment', js.includes("record?.assessment?.topPriority || snapshot?.assessment?.topPriority") && js.includes("updateText(byId('activeCustomerPriority'), priority)"));
check('status derives from the existing disposition stage', js.includes('const stage = dispositionDetails(record).stage') && js.includes("status.dataset.stage = stage") && js.includes("updateText(status, stageLabel)"));
check('next step binds to the existing recommended progress stage', js.includes("updateText(byId('activeCustomerNextStep'), recommendedStage.summary)") && js.includes('const recommendedStage = model.stages.find'));
check('collapsed summary combines status and recommended next step', js.includes("updateText(byId('activeCustomerSnapshotSummary'), `${activeStatus} · ${recommendedStage.label}: ${recommendedStage.summary}`)"));

check('existing Call Text and Email actions remain present', ['customerCallAction', 'customerTextAction', 'customerEmailAction'].every(id => html.includes(`id="${id}"`)));
check('contact actions preserve existing destination schemes', js.includes("`tel:${callablePhone}`") && js.includes("`sms:${callablePhone}`") && js.includes("`mailto:${email}`"));
check('contact actions preserve existing availability helper', ['customerCallAction', 'customerTextAction', 'customerEmailAction'].every(id => js.includes(`setCustomerActionLink('${id}'`)));
check('Document and Snapshot quick actions are present', html.includes('id="activeCustomerDocumentAction"') && html.includes('id="activeCustomerSnapshotAction"'));
check('Document quick action reuses the existing destination function', js.includes("byId('openConsultationDocument')") && js.includes("byId('activeCustomerDocumentAction')") && js.includes('consultationDocumentHref(consultationId)'));
check('Snapshot quick action reuses the existing destination function', js.includes("byId('openCustomerReport')") && js.includes("byId('activeCustomerSnapshotAction')") && js.includes('customerReportHref(record)'));
check('Document and Snapshot reuse established availability states', (js.match(/action\.setAttribute\?\.\('aria-disabled', enabled \? 'false' : 'true'\)/g) || []).length >= 2 && (js.match(/action\.tabIndex = enabled \? 0 : -1/g) || []).length >= 2);
check('Document remains safely opened in a separate context', /id="activeCustomerDocumentAction" rel="noopener" target="_blank"/.test(html));
check('Snapshot retains local-preview preparation and activity logging', js.includes("listen(byId('activeCustomerSnapshotAction'), 'click', logCustomerReportActivity)") && js.includes('cacheCustomerReportPreview(record)'));
check('Document retains existing activity logging', js.includes("listen(byId('activeCustomerDocumentAction'), 'click', logConsultationDocumentActivity)"));
check('Inbox action preserves the existing consultation chooser ID', html.includes('id="chooseConsultationAction"') && js.includes("listen(byId('chooseConsultationAction'), 'click'"));

check('wide desktop snapshot rail is sticky', css.includes('@media (min-width: 1181px)') && css.includes('.active-customer-header--snapshot { position: sticky; top: 126px; z-index: 17; }'));
check('Current Focus no longer competes as a second sticky rail', css.includes('.consultation-focus { position: relative; top: auto; z-index: auto; }'));
check('sticky targets retain safe scroll clearance', css.includes('scroll-margin-top: 252px'));
check('medium and small layouts expose native snapshot disclosure', html.includes('id="activeCustomerSnapshotDetails" open=""') && (css.match(/\.active-customer-snapshot > summary \{ display: flex; \}/g) || []).length >= 2);
check('wide desktop keeps the native disclosure semantically open', js.includes("window.matchMedia('(min-width: 1181px)').matches") && js.includes("disclosure.open = viewport === 'wide'") && js.includes('syncActiveCustomerSnapshotDisclosure();'));
check('closed disclosure safely hides only derived snapshot facts', css.includes('.active-customer-snapshot:not([open]) > .active-customer-snapshot__facts { display: none !important; }'));
check('small screens disable snapshot stickiness by omission', contract.behavior.smallScreenSticky === false && css.includes('@media (max-width: 900px)'));
check('small-screen quick actions retain 44-pixel targets', css.includes('.active-customer-header--snapshot .active-customer-header__actions .button { min-height: 44px; }'));
check('phone snapshot facts collapse to one readable column', css.includes('.active-customer-snapshot__facts { grid-template-columns: 1fr; }'));
check('forced-colors snapshot boundary is present', css.includes('.active-customer-header--snapshot { border: 2px solid CanvasText; border-left: 4px solid Highlight; }'));
check('reduced-motion/backdrop safeguard is present', css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('.active-customer-header--snapshot { backdrop-filter: none; }'));

const headerSlice = js.slice(js.indexOf('function renderCustomerActionHeader'), js.indexOf('function renderProducerConsumerStory'));
check('snapshot rendering creates no storage or network path', !/localStorage|sessionStorage|fetch\(|remoteInbox\./.test(headerSlice));
check('contract introduces no storage key or API route', contract.newStorageKeys.length === 0 && contract.newApiRoutes.length === 0);
check('snapshot fields and actions are explicitly bounded', contract.snapshotFields.length === 6 && contract.quickActions.length === 5);
check('contract confirms existing destinations and no duplicate record', contract.behavior.availabilityRulesReused && contract.behavior.activityLoggingReused && contract.behavior.duplicateConsultationRecord === false);
check('completed contract preserves all named architectures', Object.values(contract.preserved).every(Boolean));
check('Focus Mode remains packaged and unchanged in role', html.includes('id="consultationFocusMode"') && contract.preserved.focusMode && exists('AW_UI_2_3_CONTRACT.json'));
check('later workspace UI sprints remain explicitly deferred', contract.deferred.length === 2 && contract.deferred.every(item => roadmap.includes(item.split(' ')[0])));
check('roadmap preserves the AW-UI-2.4 boundary and carries AW-UI-2.5', roadmap.includes('AW-UI-2.4 — Sticky Snapshot and Quick Actions — Complete in 3.20.64') && roadmap.includes('AW-UI-2.5 — Mobile Agent Console'));
check('sprint artifacts contain no access secret values', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + sprint));

console.log(`AW-UI-2.4 QA: ${checks.length}/${checks.length} passed`);
