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
const contract = JSON.parse(read('AW_UI_2_3_CONTRACT.json'));
const sprint = read('SPRINT-AW-UI-2.3.md');

const versionParts = read('VERSION').trim().split('.').map(Number);
const packageVersionParts = JSON.parse(read('package.json')).version.split('.').map(Number);
const versionAtLeast = parts => (parts[0] * 1000000 + parts[1] * 1000 + parts[2]) >= 3020063;
check('receiver remains at or above CoverageFit 3.20.63', versionAtLeast(versionParts) && versionAtLeast(packageVersionParts));
check('Cloudflare root-deployment layout remains present', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'server', 'agent', 'assets', 'site.webmanifest'].every(exists));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('workspace contains no duplicate IDs', ids.length === new Set(ids).size);
check('native disclosure markup remains closed', (html.match(/<details\b/g) || []).length === (html.match(/<\/details>/g) || []).length);
check('Focus Mode landmark and live state are present', ['consultationFocusMode', 'consultationFocusModeTitle', 'consultationFocusModeDetail', 'consultationFocusModeStatus'].every(id => html.includes(`id="${id}"`)));
check('Focus Mode begins enabled for an open consultation', /class="consultation-focus-mode cf-card" data-enabled="true" id="consultationFocusMode"/.test(html) && js.includes('let consultationFocusModeEnabled = true'));
check('full record remains explicitly available', html.includes('id="consultationFocusModeToggle"') && html.includes('Show full record') && js.includes("consultationFocusModeEnabled ? 'Show full record' : 'Use focus mode'"));

const stages = ['understand', 'verify', 'discuss', 'recommend', 'decide', 'next-step'];
check('all six authoritative stages appear once in Focus Mode', stages.every(stage => (html.match(new RegExp(`data-consultation-focus-stage="${stage}"`, 'g')) || []).length === 1));
check('stage order matches the existing Consultation Progress model', JSON.stringify(contract.stageOrder) === JSON.stringify(stages) && js.includes("Object.freeze(['understand', 'verify', 'discuss', 'recommend', 'decide', 'next-step'])"));
check('Focus Mode reads the established progress model', js.includes('const consultationProgress = window.CoverageFitConsultationProgress') && js.includes('consultationProgress.build(snapshot') && contract.stageSource === 'CoverageFitConsultationProgress');
check('no parallel progress model is persisted', contract.behavior.viewOnlyStageSelection && !/localStorage|sessionStorage|fetch\(/.test(js.slice(js.indexOf('function consultationFocusStateLabel'), js.indexOf('function renderProducerPilotReadiness'))));

check('previous and next stage actions are present', html.includes('data-consultation-focus-action="previous"') && html.includes('data-consultation-focus-action="next"'));
check('recommended-stage return is present', html.includes('data-consultation-focus-action="current"') && js.includes('currentConsultationProgressModel.current?.id'));
check('direct stage selection never marks work complete', js.includes('consultationFocusStageId = stage.id') && !/complete|persist|save|updateConsultation/.test(js.slice(js.indexOf('function selectConsultationFocusStage'), js.indexOf('function handleConsultationFocusModeClick'))));
check('completion and attention states remain visible', js.includes("stage.state === 'complete'") && js.includes("stage.state === 'attention'") && js.includes("return 'Needs attention'"));
check('current stage keeps semantic aria-current', js.includes("setAttribute?.('aria-current', 'step')") && js.includes("removeAttribute?.('aria-current')"));
check('selected viewing stage is independently exposed', js.includes("setAttribute?.('aria-pressed', String(selected))") && js.includes("'Viewing'"));

check('stage filtering uses presentation classes only', js.includes("classList?.toggle?.('is-focus-hidden', !visible)") && css.includes('.workspace-grid.is-consultation-focus-mode .is-focus-hidden { display: none !important; }'));
check('full-record mode removes every focus filter', js.includes('const visible = !consultationFocusModeEnabled || rule.stages.includes(stageId)'));
check('Understand scopes existing Command Center and summary work', js.includes("{ selector: '#consultationCommandCenter', stages: ['understand', 'verify'] }") && js.includes("workspace-card--summary', stages: ['understand']"));
check('Verify scopes existing evidence work', js.includes("{ selector: '#consultationCommandVerify', stages: ['verify'] }") && js.includes("{ selector: '#evidenceHandoffCard', stages: ['verify'] }"));
check('Discuss scopes existing questions and checklist flow', js.includes("{ selector: '#guidedQuestionsPanel', stages: ['discuss'] }") && js.includes("workspace-card--consultation-flow', stages: ['discuss']"));
check('Recommend scopes the existing Recommendation Builder', js.includes("{ selector: '#recommendationBuilder', stages: ['recommend'] }"));
check('Decide scopes existing completion and disposition work', js.includes("{ selector: '#consultationCompletion', stages: ['decide', 'next-step'] }") && js.includes("{ selector: '#consultationDispositionForm', stages: ['decide'] }"));
check('Next step scopes existing follow-up and activity work', js.includes("{ selector: '#consultationFollowUpForm', stages: ['next-step'] }") && js.includes("{ selector: '#consultationNotesActivity', stages: ['next-step'] }"));

check('supporting context remains progressively disclosed', html.includes('class="workspace-secondary-disclosure workspace-readiness-disclosure"') && (html.match(/<details class="workspace-disclosure"/g) || []).length >= 2);
check('evidence is shown only in its relevant focused stage', contract.progressiveDisclosure.includes('property details') && js.includes("#evidenceHandoffCard', stages: ['verify']"));
check('existing recommendation coaching remains preserved', html.includes('id="recommendationBuilder"') && html.includes('/assets/js/explanation-assist.js') && contract.progressiveDisclosure.includes('recommendation explanation coaching'));
check('guardrail states that navigation changes only the view', html.includes('Stage navigation changes only this view') && html.includes('remain driven by the existing consultation record'));

check('desktop stage navigator uses six balanced columns', css.includes('grid-template-columns: repeat(6, minmax(0, 1fr))'));
check('narrow layouts retain horizontally reachable stage navigation', css.includes('.consultation-focus-mode nav { overflow-x: auto') && css.includes('min-width: 690px'));
check('mobile Focus Mode controls retain 44-pixel targets', css.includes('.consultation-focus-mode__actions .button { width: 100%; min-height: 44px; }'));
check('keyboard focus and forced-colors states are visible', css.includes('.consultation-focus-mode__stages button:focus-visible') && css.includes('@media (forced-colors: active)') && css.includes('.consultation-focus-mode__stages li.is-selected button { border: 3px solid Highlight; }'));
check('reduced-motion treatment is present', css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('.consultation-focus-mode__stages li.is-selected button { box-shadow: none; }'));

check('existing persistence handlers remain in place', ['persistChecklistProgress', 'saveActiveRecommendationPlan', 'saveActiveCompletion', 'saveActiveDisposition', 'saveActiveFollowUp'].every(name => js.includes(`function ${name}`)));
check('contract introduces no storage key or API route', contract.newStorageKeys.length === 0 && contract.newApiRoutes.length === 0);
check('completed contract preserves all named architectures', Object.values(contract.preserved).every(Boolean));
check('later workspace UI sprints remain explicitly deferred', contract.deferred.length === 3 && contract.deferred.every(item => roadmap.includes(item.split(' ')[0])));
check('roadmap preserves the AW-UI-2.3 boundary and carries AW-UI-2.4', roadmap.includes('AW-UI-2.3 — Guided Consultation Focus Mode — Complete in 3.20.63') && roadmap.includes('AW-UI-2.4 — Sticky Snapshot and Quick Actions'));
check('sprint artifacts contain no access secret values', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + sprint));

console.log(`AW-UI-2.3 QA: ${checks.length}/${checks.length} passed`);
