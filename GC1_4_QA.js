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

function snapshot(overrides = {}) {
  return {
    state: 'ready',
    customer: { name: 'Avery Homeowner', propertyAddress: '408 Main St', reviewContext: 'Buying a home' },
    assessment: { score: 61, status: 'Review Recommended', topPriority: 'Water protection', completion: { state: 'complete' } },
    recommendations: [
      { id: 'water', title: 'Water backup protection', explanation: 'Confirm the current limit.', evidenceQuality: 'confirmed', source: { priorityScore: 8, findingType: 'identified-gap' } },
      { id: 'roof', title: 'Roof settlement', explanation: 'Review settlement terms.', evidenceQuality: 'needs-verification', source: { priorityScore: 6, findingType: 'uncertainty' } }
    ],
    evidenceHandoff: {
      available: true,
      state: 'open-questions',
      guardrail: 'Confirm policy language before making a recommendation.',
      confirmedFacts: [{ id: 'occupancy', key: 'occupancy', title: 'Occupancy', answer: 'Primary residence', evidenceQuality: 'confirmed' }],
      verificationItems: [{ id: 'deductible', key: 'deductible', title: 'Current deductible', answer: 'Not sure', question: 'Compare the declarations page.', evidenceQuality: 'needs-verification', priorityOrder: 1 }],
      unresolvedQuestions: [
        { id: 'roof-age', key: 'roof-age', title: 'Roof age', answer: 'Approximate', question: 'Confirm the installation year.', evidenceQuality: 'partial', priorityOrder: 2 },
        { id: 'water-limit', key: 'water-limit', title: 'Water backup limit', answer: 'No answer recorded', question: 'Ask whether a limit is shown.', evidenceQuality: 'missing', priorityOrder: 3 }
      ]
    },
    property: { available: true, address: '408 Main St', confirmation: { label: 'Property details require confirmation', verifiedCount: 0, requiresConfirmation: true } },
    ...overrides
  };
}

check('release remains compatible after GC-1.4', ['3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('centralized Command Center advances for Verify Before Advising', ['1.3.0','1.3.1'].includes(commandCenter.VERSION) && typeof commandCenter.verificationMap === 'function');
check('verification status definitions are frozen and centrally exported', Object.isFrozen(commandCenter.VERIFICATION_GROUPS) && commandCenter.VERIFICATION_GROUPS.length === 4);

const input = snapshot();
const original = JSON.stringify(input);
const model = commandCenter.verificationMap(input);
check('status map explicitly separates all four required states', model.groups.map(group => group.label).join(',') === 'Known,Inferred,Missing,Needs confirmation');
check('known contains only clear homeowner-reported evidence', model.knownCount === 1 && model.groups[0].preview.source === 'Homeowner reported' && model.groups[0].preview.detail === 'Primary residence');
check('known copy does not claim independent policy verification', /homeowner-reported/i.test(model.groups[0].description) && !/verified policy fact/i.test(model.groups[0].description));
check('inferred findings remain visibly CoverageFit interpretations', model.inferredCount === 2 && /not verified policy facts/i.test(model.groups[1].description) && model.groups[1].items.every(item => item.source === 'CoverageFit interpretation' && /policy fact/i.test(item.detail)));
check('missing evidence remains separate from partial answers', model.missingCount === 1 && model.groups[2].preview.id === 'water-limit');
check('policy checks and partial answers remain needs-confirmation work', model.groups[3].items.some(item => item.id === 'deductible' && item.source === 'Check policy') && model.groups[3].items.some(item => item.id === 'roof-age' && item.source === 'Ask homeowner'));
check('unconfirmed Property Intelligence stays in needs confirmation', model.groups[3].items.some(item => item.id === 'property-profile-confirmation' && item.source === 'Confirm property'));
check('classification does not mutate the Workspace snapshot', JSON.stringify(input) === original);
check('verification guardrail is preserved from the evidence handoff', model.guardrail === 'Confirm policy language before making a recommendation.');

const confirmedProperty = commandCenter.verificationMap(snapshot({ property: { available: true, confirmation: { label: 'Customer-confirmed', verifiedCount: 3, requiresConfirmation: false } } }));
check('customer-confirmed property does not create a false confirmation item', !confirmedProperty.groups[3].items.some(item => item.id === 'property-profile-confirmation'));
check('customer-confirmed property is carried as known context', confirmedProperty.groups[0].items.some(item => item.id === 'property-profile-known' && item.source === 'Homeowner confirmed'));

const legacy = commandCenter.verificationMap(snapshot({ evidenceHandoff: { available: false, confirmedFacts: [], verificationItems: [], unresolvedQuestions: [] }, property: { available: false } }));
check('legacy reports fail safely into manual confirmation', legacy.state === 'legacy' && legacy.groups[3].items.some(item => item.id === 'legacy-evidence-review'));
check('legacy recommendations remain inferred instead of becoming known', legacy.knownCount === 0 && legacy.inferredCount === 2);
check('unavailable Property Intelligence is identified as missing context', legacy.groups[2].items.some(item => item.id === 'property-profile-missing' && item.source === 'Not available'));

const ready = commandCenter.verificationMap(snapshot({ recommendations: [], evidenceHandoff: { available: true, confirmedFacts: [{ id: 'clear', title: 'Clear answer', answer: 'Yes' }], verificationItems: [], unresolvedQuestions: [], guardrail: 'Confirm.' }, property: { available: true, confirmation: { label: 'Customer-confirmed', verifiedCount: 3, requiresConfirmation: false } } }));
check('fully clear evidence produces a ready verification state', ready.state === 'ready' && ready.reviewCount === 0 && ready.knownCount === 2);

const commandModel = commandCenter.build(input, {});
check('existing Command Center integrates the status map additively', commandModel.verification.groups.length === 4 && commandModel.verify.length === 3);
check('existing next-action behavior still uses prioritized confirmation work', commandModel.action.target === '#consultationCommandVerify' && /confirmed/i.test(commandModel.action.title));
check('GC-1.3 Priority Findings remain intact', commandModel.priorities.length === 2 && commandModel.priorities[0].id === 'water');

check('Workspace names Verify Before Advising and all four states accessibly', html.includes('>Verify before advising<') && html.includes('>Facts, assumptions, and gaps<') && html.includes('Known, inferred, missing, and needs-confirmation status'));
check('Workspace renders the centralized state, count, source, title, and detail', ['model.verification.totalCount','model.verification.groups.map','group.preview.source','group.preview.title','group.preview.detail'].every(token => workspace.includes(token)));
check('responsive status map gives missing and confirmation distinct treatment', css.includes('.consultation-verification-map') && css.includes('data-verification-state="missing"') && css.includes('data-verification-state="confirmation"') && css.includes('.consultation-verification-map { grid-template-columns: 1fr; }'));
check('detailed evidence handoff remains the complete working view', html.includes('id="evidenceHandoffCard"') && workspace.includes('renderEvidenceHandoff(snapshot.evidenceHandoff)'));

check('Protection Score remains byte-for-byte unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains byte-for-byte unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('workspace normalization retains GC-1.4 compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('conversation planner advances only through bounded GC-1.5 integration', hash('assets/js/conversation-planner.js') === '93315ad24415bf04ba411013d68410017187f78085fe925334311c89f37f2cfe');
check('consultation document retains GC-1.4 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('status model does not read storage or create another assessment', !commandSource.includes('localStorage') && !commandSource.includes('sessionStorage') && !commandSource.includes('CoverageFitProtectionScore.evaluate'));
check('verification copy contains no unsupported insurance outcome', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(commandSource));

new vm.Script(commandSource, { filename: 'consultation-command-center.js' });
new vm.Script(workspace, { filename: 'agent-workspace.js' });
check('modified JavaScript parses successfully', true);

console.log(`GC-1.4 QA: ${passed}/${passed} passed`);
