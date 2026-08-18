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
const contract = JSON.parse(read('AW_UI_2_5_CONTRACT.json'));
const sprint = read('SPRINT-AW-UI-2.5.md');

const versionParts = read('VERSION').trim().split('.').map(Number);
const packageVersionParts = JSON.parse(read('package.json')).version.split('.').map(Number);
const versionAtLeast = parts => (parts[0] * 1000000 + parts[1] * 1000 + parts[2]) >= 3020065;
check('receiver remains at or above CoverageFit 3.20.65', versionAtLeast(versionParts) && versionAtLeast(packageVersionParts));
check('Cloudflare root-deployment layout remains present', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'server', 'agent', 'assets', 'site.webmanifest'].every(exists));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('workspace contains no duplicate IDs', ids.length === new Set(ids).size);
check('native disclosure markup remains closed', (html.match(/<details\b/g) || []).length === (html.match(/<\/details>/g) || []).length);
check('mobile consultation dock has an accessible landmark', html.includes('aria-label="Mobile consultation actions"') && html.includes('id="mobileConsultationDock"'));
check('dock exposes four thumb-reachable primary actions', ['mobileCallAction', 'mobileTextAction', 'mobileFocusAction', 'mobileConsultationMore'].every(id => html.includes(`id="${id}"`)));
check('More sheet exposes the four bounded secondary actions', ['mobileEmailAction', 'mobileDocumentAction', 'mobileSnapshotAction', 'mobileInboxAction'].every(id => html.includes(`id="${id}"`)));
check('More sheet retains an explicit selected-record guardrail', html.includes('These actions use only the selected consultation’s existing contact and document availability.'));

check('mobile contact actions reuse existing tel sms and mailto destinations', js.includes("setCustomerActionLink('mobileCallAction', `tel:${callablePhone}`") && js.includes("setCustomerActionLink('mobileTextAction', `sms:${callablePhone}`") && js.includes("setCustomerActionLink('mobileEmailAction', `mailto:${email}`"));
check('mobile Document reuses existing destination and availability', js.includes("byId('mobileDocumentAction')") && js.includes('consultationDocumentHref(consultationId)'));
check('mobile Snapshot reuses existing destination and availability', js.includes("byId('mobileSnapshotAction')") && js.includes('customerReportHref(record)'));
check('mobile document and snapshot preserve activity logging', js.includes("listen(byId('mobileDocumentAction'), 'click', logConsultationDocumentActivity)") && js.includes("listen(byId('mobileSnapshotAction'), 'click', logCustomerReportActivity)"));
check('mobile current-stage action binds to the established progress model', js.includes('mobileFocusAction.href = recommendedStage.target') && js.includes('mobileFocusAction.textContent = recommendedStage.label'));
check('mobile current-stage action exposes a descriptive label', js.includes('Go to current consultation stage: ${recommendedStage.label}. ${recommendedStage.summary}'));
check('Inbox action reuses the existing Workspace view switcher', js.includes("action?.dataset.mobileConsoleAction === 'inbox'") && js.includes("setWorkspaceView('inbox', { announce: true"));

check('compact viewport collapses homeowner context while wide desktop opens it', js.includes("const viewport = window.matchMedia('(min-width: 1181px)').matches ? 'wide' : 'compact'") && js.includes("disclosure.open = viewport === 'wide'"));
check('stage navigation becomes a swipeable horizontal strip', css.includes('scroll-snap-type: inline mandatory') && css.includes('-webkit-overflow-scrolling: touch') && css.includes('scroll-snap-align: center'));
check('selected mobile stage centers without scrolling the page vertically', js.includes("window.matchMedia?.('(max-width: 900px)').matches") && js.includes('nav.scrollTo?.({ left') && !js.slice(js.indexOf('function centerMobileFocusStage'), js.indexOf('function renderConsultationFocusMode')).includes('scrollIntoView'));
check('stage centering respects reduced motion', js.includes("behavior: prefersReducedMotion() ? 'auto' : 'smooth'"));
check('stage auto-centering resets when the active record changes', js.includes("lastMobileFocusStageId = ''") && js.includes('recordId !== consultationFocusRecordId'));

check('mobile dock is hidden outside the mobile breakpoint', css.includes('.mobile-consultation-dock { display: none; }') && css.includes('@media (max-width: 900px)'));
check('mobile dock is fixed to the thumb zone', css.includes('position: fixed') && css.includes('bottom: 0') && css.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'));
check('main surface reserves space for the fixed dock', css.includes('padding-bottom: calc(108px + env(safe-area-inset-bottom))'));
check('dock honors left right and bottom safe areas', css.includes('env(safe-area-inset-right)') && css.includes('env(safe-area-inset-bottom)') && css.includes('env(safe-area-inset-left)'));
check('primary dock controls exceed the 44-pixel touch target', css.includes('min-height: 48px'));
check('working form controls use 16-pixel mobile text', css.includes('font-size: 16px'));
check('working inputs and selects retain 44-pixel targets', css.includes('workspace-view--consultation input:not([type="checkbox"]):not([type="radio"])') && css.includes('min-height: 44px'));
check('working text areas retain usable mobile height', css.includes('.workspace-view--consultation textarea { min-height: 96px; max-width: 100%; }'));
check('checklist and decision controls retain mobile touch targets', css.includes('.checklist-item__check { min-width: 44px; min-height: 44px; }') && css.includes('.recommendation-builder-item label { min-height: 44px; }'));

check('More sheet is bounded by dynamic viewport height', css.includes('max-height: min(68dvh, 520px)') && css.includes('overflow-y: auto'));
check('short landscape has a dedicated resilient layout', css.includes('@media (orientation: landscape) and (max-height: 620px) and (max-width: 960px)') && css.includes('max-height: calc(100dvh - 82px - env(safe-area-inset-bottom))'));
check('narrow 360-pixel phones retain dedicated dock and stage sizing', css.includes('@media (max-width: 360px)') && css.includes('flex-basis: 112px'));
check('long consultation content wraps rather than overflowing', css.includes('.consultation-verification-map,') && css.includes('.consultation-activity-list { overflow-wrap: anywhere; }'));
check('mobile work surface contains horizontal overflow', css.includes('overflow-x: clip') && css.includes('overscroll-behavior-inline: contain'));
check('required Focus Mode guardrail remains visible', html.includes('class="consultation-focus-mode__guardrail"') && !/consultation-focus-mode__guardrail[^}]*display\s*:\s*none/.test(css));
check('completion and recommendation guardrails remain packaged', ['consultationCompletionGuardrail', 'recommendationBuilderGuardrail', 'consultationCommandGuardrail'].every(id => html.includes(`id="${id}"`)));

check('More sheet supports explicit close outside tap Escape and action dismissal', js.includes("mobileConsoleAction === 'close'") && js.includes('handleMobileConsoleDismiss') && js.includes("event.key === 'Escape' && byId('mobileConsultationMore')?.open") && js.includes("event.target.closest?.('.mobile-consultation-more__panel a')"));
check('mobile listeners use the established teardown-aware listener helper', js.includes("listen(byId('mobileConsultationDock'), 'click', handleMobileConsoleAction)") && js.includes("listen(document, 'click', handleMobileConsoleDismiss)"));
check('print explicitly removes the mobile action dock', css.includes('@media print') && css.includes('.mobile-consultation-dock { display: none !important; }'));
check('reduced-motion behavior removes dock blur and stage animation', css.includes('.mobile-consultation-dock { backdrop-filter: none; }') && css.includes('.consultation-focus-mode nav { scroll-behavior: auto; }'));
check('forced-colors behavior preserves dock and primary-action boundaries', css.includes('@media (forced-colors: active) and (max-width: 900px)') && css.includes('.mobile-consultation-more__panel { border: 2px solid CanvasText; background: Canvas; }'));

const mobileHandlerSlice = js.slice(js.indexOf('function closeMobileConsultationMore'), js.indexOf("listen(document, 'click', handleWorkspaceAction)"));
check('mobile console creates no storage or network path', !/localStorage|sessionStorage|fetch\(|remoteInbox\./.test(mobileHandlerSlice));
check('contract introduces no storage key or API route', contract.newStorageKeys.length === 0 && contract.newApiRoutes.length === 0);
check('contract confirms mobile state is not persisted', contract.behavior.newMobileStatePersistence === false && contract.behavior.actionAvailabilityRulesReused);
check('completed contract preserves all named architectures', Object.values(contract.preserved).every(Boolean));
check('AW-UI-2.3 and 2.4 remain packaged', ['AW_UI_2_3_CONTRACT.json', 'AW_UI_2_4_CONTRACT.json'].every(exists) && contract.preserved.focusMode && contract.preserved.stickyDesktopSnapshot);
check('final certification sprint remains explicitly deferred', contract.deferred.length === 1 && roadmap.includes('AW-UI-2.6'));
check('roadmap preserves the AW-UI-2.5 baseline and carries AW-UI-2.6', roadmap.includes('AW-UI-2.5 — Mobile Agent Console — Complete in 3.20.65') && (roadmap.includes('The next sprint is `AW-UI-2.6 — Accessibility and Regression Certification`.') || roadmap.includes('AW-UI-2.6 — Accessibility and Regression Certification — Complete in 3.20.66')));
check('sprint artifacts contain no access secret values', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + sprint));

console.log(`AW-UI-2.5 QA: ${checks.length}/${checks.length} passed`);
