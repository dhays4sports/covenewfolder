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
const sprint = read('SPRINT-AW-UI-2.6.md');
const report = read('AW_UI_2_6_ACCESSIBILITY_REGRESSION_CERTIFICATION.md');
const contract = JSON.parse(read('AW_UI_2_6_CONTRACT.json'));

function balanced(source) {
  const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const stack = [];
  for (const match of source.matchAll(/<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi)) {
    const token = match[0];
    const name = match[1].toLowerCase();
    if (token.startsWith('<!') || voids.has(name) || token.endsWith('/>')) continue;
    if (token.startsWith('</')) {
      if (stack.pop() !== name) return false;
    } else stack.push(name);
  }
  return stack.length === 0;
}

function hexToLuminance(hex) {
  const expanded = hex.length === 4 ? `#${[...hex.slice(1)].map(value => value + value).join('')}` : hex;
  const channels = expanded.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [hexToLuminance(foreground), hexToLuminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

function cssToken(name) {
  return css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{3,6})`, 'i'))?.[1];
}

check('receiver remains compatible after CoverageFit 3.20.66', ['3.20.66','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('Cloudflare root deployment remains complete', ['index.html', '404.html', '_headers', '_routes.json', 'functions', 'server', 'migrations', 'agent', 'assets', 'site.webmanifest'].every(exists));
check('Workspace markup is structurally balanced', balanced(html));
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('Workspace contains no duplicate IDs', ids.length === new Set(ids).size);
check('Workspace declares English and permits browser zoom', /<html\s+lang="en">/.test(html) && /name="viewport"/.test(html) && !/maximum-scale|user-scalable\s*=\s*no/i.test(html));
check('Workspace retains one page heading', (html.match(/<h1\b/g) || []).length === 1);
check('skip navigation targets a focusable main landmark', html.includes('class="skip-link" href="#workspace-main"') && html.includes('class="workspace-main" id="workspace-main" tabindex="-1"'));
check('main landmark is connected to operating instructions', html.includes('aria-describedby="workspaceA11yInstructions" class="workspace-main"'));
check('operating instructions cover tabs Focus Mode and shortcuts', html.includes('Left and Right Arrow, Home, and End') && html.includes('Press Alt+R') && html.includes('Alt+C'));

check('primary view control uses horizontal tab semantics', html.includes('aria-orientation="horizontal" class="workspace-tabs"') && html.includes('role="tablist"'));
for (const [name, suffix] of [['Inbox', 'Inbox'], ['Consultation', 'Consultation'], ['Pipeline', 'Pipeline']]) {
  check(`${name} tab controls its labeled panel`, html.includes(`aria-controls="workspaceView${suffix}"`) && html.includes(`aria-labelledby="workspaceTab${suffix}"`) && html.includes(`id="workspaceView${suffix}" role="tabpanel"`));
}
check('tab implementation exposes selected state and one roving tab stop', js.includes("tab.setAttribute?.('aria-selected', String(selected))") && js.includes('tab.tabIndex = selected ? 0 : -1'));
check('tabs support Left Right Home and End keys', js.includes("['ArrowLeft', 'ArrowRight', 'Home', 'End']") && js.includes('handleWorkspaceTabKeydown'));
check('opening a consultation transfers focus before Inbox content hides', js.includes("setWorkspaceView('consultation', { focus: true })"));
check('Inbox cross-view actions transfer focus before Consultation content hides', (js.match(/setWorkspaceView\('inbox', \{[^}]*focus: true/g) || []).length >= 3);

check('Focus Mode navigator is described by keyboard help and live status', html.includes('aria-describedby="consultationFocusKeyboardHelp consultationFocusModeStatus"'));
check('Focus Mode stage controls use one roving tab stop', js.includes('control.tabIndex = stage.id === (consultationFocusModeEnabled ? selectedStage.id : recommendedStage.id) ? 0 : -1'));
check('Focus Mode implements Arrow Home and End movement', js.includes('function handleConsultationFocusModeKeydown') && js.includes("event.key === 'ArrowRight'") && js.includes("event.key === 'ArrowLeft'") && js.includes("event.key === 'Home'") && js.includes("event.key === 'End'"));
check('Focus Mode keyboard movement activates and announces the stage', js.includes("selectConsultationFocusStage(next?.dataset?.consultationFocusStage, { announce: true, locked: true, scroll: false })"));
check('Focus Mode keyboard movement avoids vertical page scroll', js.includes("next?.focus?.({ preventScroll: true })") && js.includes('centerMobileFocusStage(next'));
check('Focus Mode keyboard handler uses teardown-aware registration', js.includes("listen(byId('consultationFocusMode'), 'keydown', handleConsultationFocusModeKeydown)"));

check('native disclosure markup remains balanced', (html.match(/<details\b/g) || []).length === (html.match(/<\/details>/g) || []).length);
check('Tools disclosure uses its stable visible name instead of a stale Open label', html.includes('<details class="workspace-tools">\n<summary><span aria-hidden="true"') && !html.includes('aria-label="Open workspace tools"'));
check('mobile action panel is a labeled described region', html.includes('aria-describedby="mobileConsultationGuardrail" aria-labelledby="mobileConsultationActionsTitle"') && html.includes('role="region"'));
check('mobile disclosure keeps a concise visible and screen-reader name', html.includes('<summary>More <span class="sr-only">consultation actions</span></summary>'));
check('mobile panel retains explicit close and Escape focus restoration', html.includes('aria-label="Close more consultation actions"') && js.includes("event.key === 'Escape'") && js.includes("querySelector?.('summary')?.focus?.()"));

const idSet = new Set(ids);
const describedReferences = [...html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/));
check('every static ARIA relationship resolves to an element', describedReferences.every(id => idSet.has(id)));
const labelTargets = [...html.matchAll(/<label[^>]+for="([^"]+)"/g)].map(match => match[1]);
check('every explicit form label resolves to a control', labelTargets.length > 0 && labelTargets.every(id => idSet.has(id)));
check('producer access key has a true label and protected autocomplete behavior', html.includes('<label for="remoteInboxToken">') && html.includes('autocomplete="off" id="remoteInboxToken"'));
check('completion and follow-up controls retain visible wrapper labels', html.includes('class="consultation-completion__field') && html.includes('for="consultationFollowUpDate"'));
check('Workspace provides polite status and assertive error regions', (html.match(/role="status"/g) || []).length >= 15 && html.includes('role="alert"'));
check('dynamic disabled links leave the keyboard order', js.includes('action.tabIndex = enabled ? 0 : -1'));
check('generated queue and checklist controls have programmatic names', js.includes("open.setAttribute('aria-label'") && js.includes('aria-label="${escapeHtml(checkboxLabel)}"'));
check('no positive tabindex or autofocus is introduced', !/tabindex="[1-9]/.test(html) && !/\bautofocus\b/i.test(html));
check('new-window links retain noopener protection', [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].every(match => /rel="[^"]*noopener/.test(match[0])));

check('global focus treatment covers native and custom interactive controls', css.includes(':where(a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])):focus-visible'));
check('dark header receives an inverse focus color', css.includes('.workspace-header :where(a[href], button, summary):focus-visible') && css.includes('outline-color: #7dd3fc'));
check('primary text token meets AA on white', contrast(cssToken('color-text-500'), '#ffffff') >= 4.5);
check('brand action text token meets AA on white', contrast(cssToken('color-brand-700'), '#ffffff') >= 4.5);
check('warning text token meets AA on warning surface', contrast(cssToken('color-warning-700'), cssToken('color-warning-100')) >= 4.5);
check('focus indicator color meets non-text contrast on white', contrast(cssToken('color-focus'), '#ffffff') >= 3);
check('increased-contrast preference strengthens borders focus and opacity', css.includes('@media (prefers-contrast: more)') && css.includes('--color-border-strong: #8092a2') && css.includes('opacity: .68'));
check('reduced-motion preference suppresses animations transitions and smooth scrolling', css.includes('*, *::before, *::after') && css.includes('animation-duration: .01ms !important') && css.includes('transition-duration: .01ms !important') && css.includes('scroll-behavior: auto !important'));
check('forced colors preserve focus selected disabled and surface boundaries', css.includes('@media (forced-colors: active)') && css.includes('outline: 3px solid Highlight !important') && css.includes('background: Highlight') && css.includes('border-color: GrayText'));

check('document no longer forces a 320-pixel minimum', css.includes('body {') && css.includes('min-width: 0') && !css.includes('min-width: 320px'));
check('extreme zoom and narrow reflow have a 320-CSS-pixel safeguard', css.includes('@media (max-width: 320px)') && css.includes('.workspace-main { width: calc(100% - 20px); }'));
check('mobile safe areas dynamic viewport and 44-pixel controls remain certified', css.includes('env(safe-area-inset-bottom)') && css.includes('68dvh') && css.includes('min-height: 44px'));
check('Safari fallbacks precede progressive viewport enhancements', css.includes('max-height: min(68vh, 520px)') && css.indexOf('max-height: min(68vh, 520px)') < css.indexOf('max-height: min(68dvh, 520px)'));
check('iOS momentum scroll and text-size adjustment remain present', css.includes('-webkit-overflow-scrolling: touch') && css.includes('-webkit-text-size-adjust: 100%'));
check('required guardrails remain visible and packaged', ['consultationCommandGuardrail', 'recommendationBuilderGuardrail', 'consultationCompletionGuardrail', 'mobileConsultationGuardrail'].every(id => html.includes(`id="${id}"`)) && !/Guardrail[^}]*display\s*:\s*none/i.test(css));

check('contract records no new storage API or migration surface', contract.newStorageKeys.length === 0 && contract.newApiRoutes.length === 0 && contract.newDatabaseMigrations.length === 0);
check('contract preserves every named architecture', Object.values(contract.preserved).every(Boolean));
check('contract distinguishes source certification from universal AT claims', contract.certified.screenReaderSemanticsReview && contract.universalAssistiveTechnologyClaim === false && contract.postDeployOperationalEvidence.length === 4);
check('release decision has no open code blocker', contract.decision === 'approved_for_controlled_production' && contract.openCodeBlockers.length === 0);
check('all six AW-UI contracts remain packaged', [1, 2, 3, 4, 5, 6].every(number => exists(`AW_UI_2_${number}_CONTRACT.json`)));
check('roadmap completes the AW-UI-2 program at 3.20.66', roadmap.includes('AW-UI-2.6 — Accessibility and Regression Certification — Complete in 3.20.66') && roadmap.includes('The AW-UI-2 program is complete.'));
check('certification report includes decision defects matrix and post-deploy evidence', report.includes('APPROVED FOR CONTROLLED PRODUCTION DEPLOYMENT') && report.includes('Defect disposition') && report.includes('Post-deploy operational evidence'));
check('sprint artifacts contain no producer secret value', !/Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:token|key|secret)=/i.test(roadmap + sprint + report + JSON.stringify(contract)));

console.log(`AW-UI-2.6 QA: ${checks.length}/${checks.length} passed`);
