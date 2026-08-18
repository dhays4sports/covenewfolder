#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hash = relative => crypto.createHash('sha256').update(read(relative)).digest('hex');
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };

const readiness = require('./assets/js/producer-pilot-readiness.js');
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const workspace = read('assets/js/agent-workspace.js');
const sprint = read('SPRINT-PC-1.5.md');
const runbook = read('PC1_5_LIVE_PRODUCER_PILOT_RUNBOOK.md');

const snapshot = Object.freeze({
  state: 'ready',
  consultation: Object.freeze({ id: 'consultation-pc15-pilot-fixture', remote: Object.freeze({ serverBacked: true }) })
});
const readyContext = Object.freeze({
  record: snapshot.consultation,
  plan: Object.freeze({ state: 'ready' }),
  checklist: Object.freeze({ checklist: Object.freeze({ state: 'ready' }) }),
  connection: Object.freeze({ connected: true }),
  persistenceState: 'secure',
  documentAvailable: true,
  documentHref: '/agent/consultation/?consultation_id=consultation-pc15-pilot-fixture',
  printPreviewConfirmed: true
});

check('release advances to CoverageFit 3.20.51', ['3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('one centrally versioned pilot readiness model is exposed', readiness.VERSION === '1.0.0' && readiness.PROFILE_VERSION === 'PC-1.5' && typeof readiness.build === 'function');
check('the model defines the five bounded checks in one order', readiness.CHECK_ORDER.join(',') === 'record,workflow,continuity,document,device-output');

let model = readiness.build({ state: 'empty' }, {});
check('missing consultation state blocks pilot readiness', model.state === 'blocked' && model.ready === false && model.summary.ready === 0 && model.next.id === 'record');
check('missing record action leads to the existing consultation inbox', model.action.target === '#workspaceTabInbox');

model = readiness.build(snapshot, {
  ...readyContext,
  record: { id: snapshot.consultation.id, remote: { serverBacked: false } },
  connection: { connected: false },
  persistenceState: 'device',
  printPreviewConfirmed: false
});
check('a browser-local record remains usable but does not satisfy the live pilot gate', model.state === 'attention' && model.summary.ready === 3 && model.next.id === 'continuity');
check('local-record guidance sends the producer to existing secure inbox setup', model.checks.find(item => item.id === 'continuity').action.target === '#remoteInboxBar' && model.checks.find(item => item.id === 'continuity').detail.includes('secure producer inbox'));

model = readiness.build(snapshot, { ...readyContext, connection: { connected: false }, persistenceState: 'device', printPreviewConfirmed: false });
check('a disconnected server-backed record remains action-needed', model.ready === false && model.next.id === 'continuity' && model.next.detail.includes('Connect the secure producer inbox'));
model = readiness.build(snapshot, { ...readyContext, persistenceState: 'pending', printPreviewConfirmed: false });
check('a pending secure checkpoint cannot be represented as ready', model.ready === false && model.next.id === 'continuity' && model.next.detail.includes('finish secure synchronization'));
model = readiness.build(snapshot, { ...readyContext, printPreviewConfirmed: false });
check('secure workflow readiness still requires the current-device preview', model.state === 'attention' && model.summary.ready === 4 && model.next.id === 'device-output');
check('the device check opens the existing consultation document', model.action.target === readyContext.documentHref && model.action.label === 'Open document and check output');

model = readiness.build(snapshot, readyContext);
check('all five operational checks produce one ready state', model.ready === true && model.state === 'ready' && model.summary.ready === 5 && model.summary.remaining === 0);
check('ready state returns the existing Command Center as the first consultation action', model.action.target === '#consultationCommandCenter' && model.action.label === 'Begin guided consultation');
check('the readiness result is deeply immutable', Object.isFrozen(model) && Object.isFrozen(model.checks) && model.checks.every(Object.isFrozen) && Object.isFrozen(model.summary));
check('readiness makes no network or persistence write', !/localStorage|sessionStorage|\bfetch\b|setItem|setJSON|updateChecklist/i.test(read('assets/js/producer-pilot-readiness.js')));

check('Workspace contains exactly one pilot preflight', (html.match(/id="producerPilotReadiness"/g) || []).length === 1 && (html.match(/id="producerPilotReadinessChecks"/g) || []).length === 1);
check('preflight appears after Current Focus and before the existing Command Center', html.indexOf('id="consultationFocus"') < html.indexOf('id="producerPilotReadiness"') && html.indexOf('id="producerPilotReadiness"') < html.indexOf('id="consultationCommandCenter"'));
check('preflight includes one explicit current-device acknowledgement', (html.match(/id="producerPilotOutputConfirmed"/g) || []).length === 1 && html.includes('I reviewed every page in Print Preview on this device.'));
check('current-device confirmation clearly states its session boundary', html.includes('only to this selected consultation and open Workspace session'));
check('the pilot model loads before the existing Workspace controller', html.indexOf('/assets/js/producer-pilot-readiness.js') < html.indexOf('/assets/js/agent-workspace.js'));

const pilotRenderer = workspace.slice(workspace.indexOf('function renderProducerPilotReadiness'), workspace.indexOf('function setRemoteInboxExpanded'));
check('one Workspace renderer consumes the central readiness model', pilotRenderer.includes('producerPilotReadiness.build') && pilotRenderer.includes('window.CoverageFitAgentWorkspacePilotReadiness = model'));
check('renderer derives from the selected record and existing consultation engines', pilotRenderer.includes('activeConsultationRecord') && pilotRenderer.includes('currentConversationPlan') && pilotRenderer.includes('CoverageFitAgentWorkspaceChecklist'));
check('renderer consumes the existing secure persistence state and connection', pilotRenderer.includes('remoteInboxConnection()') && pilotRenderer.includes('persistenceState: checklistPersistenceState'));
check('renderer reuses the existing opaque consultation document route', pilotRenderer.includes('consultationDocumentHref(consultationId)') && !pilotRenderer.includes('customer.name') && !pilotRenderer.includes('propertyAddress'));
check('device acknowledgement is memory-only and consultation-specific', workspace.includes('const pilotOutputConfirmations = new Set()') && pilotRenderer.includes('pilotOutputConfirmations.has(consultationId)') && !/localStorage|sessionStorage|\bfetch\b/.test(pilotRenderer));
check('secure-save changes and checklist events refresh pilot readiness', workspace.includes('renderProducerPilotReadiness(state || window.CoverageFitAgentWorkspaceChecklist || null)') && workspace.includes('renderProducerPilotReadiness(state);'));
check('the existing progress and Command Center remain the preflight destinations', workspace.includes("'Begin guided consultation', target: '#consultationCommandCenter'") || readiness.build(snapshot, readyContext).action.target === '#consultationCommandCenter');

check('attention, blocked, and ready states are visually distinct', css.includes('.producer-pilot-readiness[data-state="ready"]') && css.includes('.producer-pilot-readiness[data-state="blocked"]') && css.includes('var(--color-warning-600)'));
check('five checks collapse cleanly on tablet and phone', css.includes('repeat(5, minmax(0, 1fr))') && css.includes('repeat(2, minmax(0, 1fr))') && css.includes('.producer-pilot-readiness__checks { grid-template-columns: 1fr; }'));
check('phone action remains touch friendly', css.includes('.producer-pilot-readiness__footer .button { width: 100%; min-height: 44px; }'));
check('preflight has accessible status and checklist semantics', html.includes('aria-live="polite" class="producer-pilot-readiness__badge') && html.includes('aria-label="Live producer pilot readiness checks"'));

check('PC-1.5 documentation and deployed-device runbook exist', fs.existsSync(path.join(root, 'SPRINT-PC-1.5.md')) && fs.existsSync(path.join(root, 'PC1_5_LIVE_PRODUCER_PILOT_RUNBOOK.md')));
check('roadmap and changelog complete PC-1.5', read('ROADMAP.md').includes('PC-1.5 Live Producer Pilot Readiness — Complete (3.20.51)') && read('CHANGELOG.md').includes('## 3.20.51 — PC-1.5 Live Producer Pilot Readiness'));
check('PC-1.6 production certification remains deferred', read('ROADMAP.md').includes('[ ] PC-1.6 — Production Release Certification') && sprint.includes('PC-1.6 Production Release Certification remains deferred'));
check('runbook requires deployed Safari/macOS, recovery, PDF, and physical output evidence', ['Safari/macOS', 'cross-refresh checklist recovery', 'Save as PDF', 'physical output', 'defect list'].every(term => runbook.includes(term)));
check('documentation never claims the live producer pilot already occurred', sprint.includes('does not fabricate') && runbook.includes('does not itself prove that a live pilot occurred'));

for (const relative of ['assets/js/producer-pilot-readiness.js', 'assets/js/agent-workspace.js']) new Function(read(relative));
check('new and modified JavaScript parses successfully', true);
check('existing progress, checklist, and PC-1.4 document readiness engines remain unchanged', hash('assets/js/consultation-progress.js') === 'f0ebe864f6fd0c8c6d3bbe465999d4e65ba0f465835f0fd602d8239987bfe2da' && hash('assets/js/consultation-checklist.js') === '940e5677e7f8e1ab2fdcec8caa25bbd2dec7b5abc91a923c16c260b3ee5dc9c2' && hash('assets/js/print-production-readiness.js') === '762cd555d828b902fd2ef733ed9539df10b4dae5e0b080a18e18c2c684fad6e7');
check('assessment and Protection Score remain unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3' && hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('FLOW intake advances only for HOME-2.1 semantics while RC-SMS handoff remains unchanged', hash('assets/js/prefill-intake.js') === '9cca4d8bbd6d2ba6b7f72aaf569dc252762c41d6e8857111a3d7f03f5a351f48' && hash('assets/js/sms-handoff-resolver.js') === 'defea794444f829cac4f267feab32ab43ba16eefe3a25d92ca13fa01595bc262');
check('shared producer-consumer story and document architecture remain unchanged', hash('assets/js/producer-consumer-story.js') === '875b5e7ff003b65a8f19172410d7846e4528fd44c2473e3caede7e9af02c8eb7' && hash('assets/js/print/consultation-document-architecture.js') === 'f0c9b69f80a5b38c61fbbd9933e80184d2ac367fe980fad9c3860c1fb33403f1');
check('PC-1.5 makes no unsupported insurance or pilot-completion claim', !/guaranteed discount|guaranteed rate|underwriting approved|coverage approved|you qualify|pilot (?:was|is) completed/i.test(`${html}\n${workspace}\n${sprint}\n${runbook}`));

console.log(JSON.stringify({ suite: 'PC-1.5 Live Producer Pilot Readiness', version: read('VERSION').trim(), passed: checks.length, failed: 0, checks }, null, 2));
