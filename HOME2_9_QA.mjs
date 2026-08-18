#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const bytes = relative => fs.statSync(path.join(root, relative)).size;
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const assessment = read('assessment/index.html');
const transition = read('transition/index.html');
const css = read('assets/css/home-mobile-certification.css');
const a11y = read('assets/js/home-mobile-certification.js');
const engine = read('assets/js/assessment-engine.js');
const contract = JSON.parse(read('HOME2_9_MOBILE_ACCESSIBILITY_PERFORMANCE_CONTRACT.json'));

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

check('receiver advances to CoverageFit 3.20.60', read('VERSION').trim() === '3.20.60' && JSON.parse(read('package.json')).version === '3.20.60');
check('assessment and transition markup are structurally balanced', balanced(assessment) && balanced(transition));
check('both routes expose skip navigation and focusable main landmarks', [assessment, transition].every(source => source.includes('class="cf-skip-link"') && /<main[^>]+id="main-content"[^>]+tabindex="-1"/.test(source)));
check('assessment uses SVG branding and intrinsic media dimensions', assessment.includes('/assets/images/coveragefit-logo.svg') && !assessment.includes('coveragefit-logo-board.png') && assessment.includes('width="292"') && assessment.includes('width="260"'));
check('all property controls have true labels', (assessment.match(/<label class="property-field/g) || []).length === 13 && !assessment.includes('<div class="property-field'));
check('assessment exposes semantic progress and question announcements', assessment.includes('role="progressbar"') && assessment.includes('id="assessmentQuestionLive"') && engine.includes("setAttribute('aria-valuetext'") && engine.includes('lastAnnouncedQuestion'));
check('answer selection and changing focus are programmatic', engine.includes("setAttribute('aria-pressed'") && engine.includes("[aria-pressed=\"true\"]") && engine.includes("qTitle?.focus({ preventScroll: true })"));
check('validation errors are connected and cleared accessibly', a11y.includes("addEventListener('invalid'") && a11y.includes("setAttribute('aria-invalid', 'true')") && a11y.includes("setAttribute('aria-describedby'") && a11y.includes('clearInvalid'));
check('mobile controls, touch targets and short-screen dialogs are guarded', css.includes('font-size: 16px !important') && css.includes('min-height: 44px') && css.includes('100dvh') && css.includes('overflow-y: auto'));
check('narrow-phone, landscape, safe-area, reduced-motion and forced-colors rules exist', css.includes('@media (max-width: 380px)') && css.includes('(orientation: landscape)') && css.includes('env(safe-area-inset-top)') && css.includes('prefers-reduced-motion: reduce') && css.includes('forced-colors: active'));

for (const [route, source] of [['assessment', assessment], ['transition', transition]]) {
  const scripts = [...source.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"[^>]*>/g)];
  check(`${route} scripts use ordered deferred fetching`, scripts.length > 0 && scripts.every(match => /\bdefer\b/.test(match[1]) || /\bdefer\b/.test(match[0])));
}

const ids = [...assessment.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
check('assessment contains no duplicate IDs', new Set(ids).size === ids.length);

const scripts = [...assessment.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
const styles = [...assessment.matchAll(/<link[^>]+href="([^"]+\.css)"/g)];
const initialBytes = bytes('assessment/index.html')
  + scripts.reduce((sum, match) => sum + bytes(match[1].replace(/^\//, '')), 0)
  + styles.reduce((sum, match) => sum + bytes(match[1].replace(/^\//, '')), 0)
  + bytes('assets/images/coveragefit-logo.svg')
  + bytes('assets/illustrations/default.svg');
check('assessment initial transfer is below 500 KB', initialBytes < contract.performance.initialTransferBudgetBytes);

const payoff = read('assets/js/intent-payoff-continuity.js');
check('question-two observer-loop correction remains preserved', !/subtree\s*:\s*true/.test(payoff) && !a11y.includes('MutationObserver'));
const score = read('assets/js/protection-score.js');
check('marketing and certification fields remain outside score calculations', !/homeReviewGoal|housingContext|reviewTiming|campaignVariant|certification/i.test(score));
check('assessment, recovery and two-lead behavior remain unchanged by contract', contract.unchanged.handoffRecovery && contract.unchanged.assessmentQuestions && contract.unchanged.protectionScoreFormula && contract.unchanged.zeroRepeatCompletion && contract.unchanged.leadDelivery);

console.log(`CF-HOME-2.9 QA: ${checks.length}/${checks.length} passed; assessment_initial_bytes=${initialBytes}`);
