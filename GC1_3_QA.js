#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
let passed = 0;
const check = (name, condition) => { assert.ok(condition, name); console.log('PASS', name); passed += 1; };

const commandSource = read('assets/js/consultation-command-center.js');
const commandContext = { window: {} };
vm.runInNewContext(commandSource, commandContext, { filename: 'consultation-command-center.js' });
const commandCenter = commandContext.window.CoverageFitConsultationCommandCenter;
const workspace = read('assets/js/agent-workspace.js');
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');

function recommendation(id, title, source, evidenceQuality = 'confirmed', priority = 'Review topic') {
  return { id, title, explanation: `${title} explanation`, evidenceQuality, priority, order: source?.legacyOrder, source: { ...source } };
}

function snapshot(recommendations) {
  return {
    state: 'ready',
    customer: { name: 'Avery Homeowner', propertyAddress: '408 Main St', reviewContext: 'Buying a home' },
    assessment: { score: 62, status: 'Review Recommended', topPriority: 'Assessment fallback', completion: { state: 'complete' } },
    recommendations,
    evidenceHandoff: { guardrail: 'Confirm policy details before making a recommendation.', verificationItems: [], unresolvedQuestions: [] }
  };
}

check('release remains compatible after GC-1.3', ['3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('centralized command-center model remains Priority Findings compatible', ['1.2.0','1.3.0','1.3.1'].includes(commandCenter.VERSION) && typeof commandCenter.priorityFindings === 'function');

const input = [
  recommendation('legacy-high', 'Legacy high label', { legacyOrder: 1 }, 'missing', 'High'),
  recommendation('medium-score', 'Medium assessment score', { priorityScore: 5, weightedPenalty: 3, findingType: 'uncertainty', order: 2 }, 'needs-verification', 'Medium'),
  recommendation('highest-score', 'Highest assessment score', { priorityScore: 9, weightedPenalty: 7, findingType: 'identified-gap', order: 3 }, 'confirmed', 'Review'),
  recommendation('lower-score', 'Lower assessment score', { priorityScore: 2, weightedPenalty: 1, findingType: 'consideration', order: 4 }, 'missing', 'High')
];
const original = JSON.stringify(input);
const ranked = commandCenter.priorityFindings(snapshot(input), 3);
check('existing assessment priority score is authoritative over display label and input order', ranked.map(item => item.id).join(',') === 'highest-score,medium-score,lower-score');
check('open evidence does not override a materially higher assessment priority score', ranked[0].id === 'highest-score' && ranked[2].id === 'lower-score');
check('Priority Findings stays bounded to three discussion topics', ranked.length === 3 && ranked.map(item => item.rank).join(',') === '1,2,3');
check('priority sequencing is explicit and beginner friendly', ranked.map(item => item.sequenceLabel).join(',') === 'Discuss first,Discuss next,Then review');
check('ranking does not mutate the normalized workspace recommendations', JSON.stringify(input) === original);

const tie = commandCenter.priorityFindings(snapshot([
  recommendation('consideration', 'Consideration', { priorityScore: 5, weightedPenalty: 3, findingType: 'consideration', order: 1 }),
  recommendation('gap', 'Identified gap', { priorityScore: 5, weightedPenalty: 3, findingType: 'identified-gap', order: 2 }),
  recommendation('uncertain', 'Uncertainty', { priorityScore: 5, weightedPenalty: 3, findingType: 'uncertainty', order: 3 }, 'needs-verification')
]), 3);
check('finding type resolves equal assessment scores without changing score math', tie.map(item => item.id).join(',') === 'gap,uncertain,consideration');

const reasonAware = commandCenter.priorityFindings(snapshot([
  recommendation('reason-gap', 'Purchase coverage detail', { priorityScore: 8, weightedPenalty: 5, findingType: 'identified-gap', reviewReasonPriorityBoost: 1.5, order: 1 }),
  recommendation('property-gap', 'Property coverage detail', { priorityScore: 7, weightedPenalty: 5, findingType: 'identified-gap', propertyPriorityBoost: 1, order: 2 })
]), 3);
check('review-reason relevance is explained without replacing the actual reason', /stated review reason/i.test(reasonAware[0].rationale) && !/campaign|occupation|referral/i.test(reasonAware[0].rationale));
check('property relevance is explained as assessment context', /property context/i.test(reasonAware[1].rationale));

const evidenceActions = commandCenter.priorityFindings(snapshot([
  recommendation('policy', 'Policy wording', { priorityScore: 6, findingType: 'uncertainty', order: 1 }, 'needs-verification'),
  recommendation('homeowner', 'Household detail', { priorityScore: 5, findingType: 'consideration', order: 2 }, 'partial'),
  recommendation('discuss', 'Confirmed gap', { priorityScore: 4, findingType: 'identified-gap', order: 3 }, 'confirmed')
]), 3);
check('existing evidence quality produces a concise next-discussion cue', evidenceActions.map(item => item.actionLabel).join(',') === 'Check policy,Ask homeowner,Discuss finding');

const legacy = commandCenter.priorityFindings(snapshot([
  recommendation('low', 'Low topic', { legacyOrder: 1 }, 'confirmed', 'Low'),
  recommendation('high', 'High topic', { legacyOrder: 2 }, 'confirmed', 'High'),
  recommendation('medium', 'Medium topic', { legacyOrder: 3 }, 'confirmed', 'Medium')
]), 3);
check('legacy saved reports retain deterministic label and source-order fallbacks', legacy.map(item => item.id).join(',') === 'high,medium,low');

const fallback = commandCenter.priorityFindings(snapshot([]), 3);
check('reports without recommendation rows retain the saved assessment fallback', fallback.length === 1 && fallback[0].id === 'assessment-priority');

const model = commandCenter.build(snapshot(input), {});
check('Command Center consumes the centralized ranked findings model', model.priorities.map(item => item.id).join(',') === 'highest-score,medium-score,lower-score');
check('raw ranking scores are not exposed in the user-visible finding model', model.priorities.every(item => !Object.prototype.hasOwnProperty.call(item, 'priorityScore') && !Object.prototype.hasOwnProperty.call(item, 'weightedPenalty')));
check('Protection Score implementation remains byte-for-byte unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains byte-for-byte unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('workspace normalization retains GC-1.3 compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');

check('existing Command Center now names and frames Priority Findings', html.includes('>Priority findings<') && html.includes('>What to address first<') && html.includes('0 ranked findings'));
check('Workspace renders rank rationale and evidence action from the central model', workspace.includes('item.sequenceLabel') && workspace.includes('item.rationale') && workspace.includes('item.actionLabel'));
check('responsive priority-finding presentation includes visible evidence states', css.includes('.consultation-priority-finding__meta') && css.includes('data-evidence-quality="needs-verification"'));
check('ranking engine does not read storage or create a parallel assessment', !commandSource.includes('localStorage') && !commandSource.includes('sessionStorage') && !commandSource.includes('CoverageFitProtectionScore.evaluate'));
check('Priority Findings copy contains no unsupported insurance outcome', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(commandSource));

new vm.Script(commandSource, { filename: 'consultation-command-center.js' });
new vm.Script(workspace, { filename: 'agent-workspace.js' });
check('modified JavaScript parses successfully', true);

console.log(`GC-1.3 QA: ${passed}/${passed} passed`);
