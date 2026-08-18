#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
const recovery = require(path.join(root, 'assets/js/home-branch-recovery.js'));
const scoring = require(path.join(root, 'assets/js/protection-score.js'));
const contract = JSON.parse(read('HOME2_8_CONTINUITY_BRANCH_RECOVERY_CONTRACT.json'));

const now = Date.parse('2026-08-13T03:00:00.000Z');
const base = {
  profile: { housingContext: 'owner_occupied', receivedAt: new Date(now - 1000).toISOString() },
  context: { journey: { housingContext: 'owner_occupied' } },
  conversion: { flags: { isHomeHandoff: true } },
  transition: null
};

check('receiver preserves HOME-2.8 in the certified release', ['3.20.59', '3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim() && ['CF-HOME-2.8', 'CF-HOME-2.9'].includes(recovery.BUILD));
check('recent trusted homeowner is not redirected', recovery.resolve(base, now).active && !recovery.resolve(base, now).shouldRecover);
for (const housingContext of ['owner_occupied', 'landlord', 'buyer']) {
  const value = recovery.resolve({ ...base, profile: { ...base.profile, housingContext }, context: { journey: { housingContext } } }, now);
  assert.equal(value.shouldRecover, false);
}
check('owner, landlord, and buyer remain on Home assessment', true);
const renter = recovery.resolve({ ...base, profile: { ...base.profile, housingContext: 'renter' }, context: { journey: { housingContext: 'renter' } } }, now);
check('recent trusted renter is returned to renters path', renter.shouldRecover && renter.destination === 'https://408farmers.com/contact/?intent=renters&recovery=coveragefit_branch');
check('renter recovery route contains no personal or property fields', !/name|email|phone|address|property|consent|session/i.test(new URL(renter.destination).search));
check('untrusted or stale renter cannot trigger recovery', !recovery.resolve({ ...base, conversion: { flags: { isHomeHandoff: false } }, profile: { housingContext: 'renter', receivedAt: new Date(now - 1000).toISOString() } }, now).shouldRecover && !recovery.resolve({ ...base, profile: { housingContext: 'renter', receivedAt: new Date(now - recovery.ACTIVE_WINDOW_MS - 1).toISOString() }, context: { journey: { housingContext: 'renter' } } }, now).shouldRecover);
check('transition and assessment load branch guard after conversion trust is derived', read('transition/index.html').indexOf('conversion-handoff.js') < read('transition/index.html').indexOf('home-branch-recovery.js') && read('assessment/index.html').indexOf('conversion-handoff.js') < read('assessment/index.html').indexOf('home-branch-recovery.js'));
check('missing transition marker can recover trusted profile', read('assets/js/transition-route.js').includes('handoffRecovered') && read('assets/js/transition-route.js').includes('trusted_browser_profile'));
check('existing seven-day assessment draft remains canonical', read('assets/js/assessment-continuity.js').includes('7 * 24 * 60 * 60 * 1000') && contract.assessmentContinuity.existingDraftStorageReused);

const questions = [{ key: 'limit', title: 'Limit', category: 'Structure', weight: 10, answers: [] }];
const selections = { limit: { value: 'unsure', label: 'Not sure', scoreImpact: 0.5 } };
const baseline = scoring.evaluate({ questions, selections });
for (const branch of ['owner_occupied', 'landlord', 'buyer', 'renter']) {
  const result = scoring.evaluate({ questions, selections, branch, recovered: true });
  assert.equal(result.score, baseline.score);
  assert.equal(result.methodology.totalPenalty, baseline.methodology.totalPenalty);
}
check('Protection Score is invariant across branch and recovery context', true);
check('score engine never reads branch recovery fields', !/HomeBranchRecovery|home_branch_recovery|handoffRecovered|housingContext/.test(read('assets/js/protection-score.js')));
check('receiver contract preserves assessment, zero-repeat, and lead delivery', contract.unchanged.assessmentQuestions && contract.unchanged.protectionScoreFormula && contract.unchanged.zeroRepeatCompletion && contract.unchanged.leadDelivery);

console.log(`CF-HOME-2.8 QA: ${checks.length}/${checks.length} passed`);
