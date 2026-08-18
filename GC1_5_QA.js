#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
const planner = require('./assets/js/conversation-planner.js');
let passed = 0;
const check = (name, condition) => { assert.ok(condition, name); console.log('PASS', name); passed += 1; };

function snapshot(overrides = {}) {
  return {
    state: 'ready',
    customer: { name: 'Avery Homeowner' },
    assessment: { score: 61, status: 'Review Recommended', strongest: 'Assessment completed' },
    property: { available: true, address: '408 Main St', confirmation: { requiresConfirmation: true } },
    evidenceHandoff: {
      available: true,
      summary: { confirmed: 1, verification: 1, unresolved: 2 },
      confirmedFacts: [{ id: 'occupancy', key: 'occupancy', title: 'Occupancy', question: 'This confirmed fact must not become a question.' }],
      verificationItems: [{ id: 'water', key: 'water', title: 'Water-loss deductible', question: 'What deductible and limit are shown on the current policy?', evidenceQuality: 'needs-verification', priorityOrder: 1 }],
      unresolvedQuestions: [
        { id: 'roof-age', key: 'roof-age', title: 'Roof age', question: 'What year was the roof installed?', evidenceQuality: 'partial', priorityOrder: 1 },
        { id: 'alarm', key: 'alarm', title: 'Monitored alarm', question: 'Is the alarm professionally monitored?', evidenceQuality: 'missing', priorityOrder: 9 }
      ]
    },
    recommendations: [
      { id: 'water', key: 'water', questionKey: 'water', order: 1, title: 'Water-loss terms', priority: 'High', confidence: 90, conversationStarter: 'Could we review the water-loss terms together?', evidenceQuality: 'needs-verification' },
      { id: 'liability', key: 'liability', questionKey: 'liability', order: 2, title: 'Liability foundation', priority: 'High', confidence: 80, conversationStarter: 'What assets and responsibilities should this liability limit protect?', evidenceQuality: 'confirmed' },
      { id: 'earthquake', key: 'earthquake', questionKey: 'earthquake', order: 3, title: 'Earthquake protection', priority: 'Medium', confidence: 75, conversationStarter: 'How would you plan to recover after earthquake damage?', evidenceQuality: 'confirmed' }
    ],
    ...overrides
  };
}

check('release remains compatible after GC-1.5', ['3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(read('VERSION').trim()) && JSON.parse(read('package.json')).version === read('VERSION').trim());
check('existing conversation planner advances additively for GC-1.5', ['1.1.0','1.2.0'].includes(planner.VERSION) && planner.SCHEMA_VERSION === '1.0' && typeof planner.getGuidedQuestions === 'function');

const input = snapshot();
const original = JSON.stringify(input);
const questions = planner.getGuidedQuestions(input);
check('five next-best questions are bounded by default', questions.length === 5);
check('missing assessment information leads the question sequence', questions[0].kind === 'missing' && questions[0].sourceId === 'alarm' && questions[0].label === 'Ask homeowner');
check('partial answers remain distinct clarification work', questions[1].kind === 'clarify' && questions[1].sourceId === 'roof-age' && questions[1].label === 'Clarify answer');
check('policy-verification prompts remain check-policy work', questions[2].kind === 'policy' && questions[2].sourceId === 'water' && questions[2].label === 'Check policy');
check('unconfirmed property context produces one property question', questions[3].kind === 'property' && questions[3].sourceId === 'property-profile');
check('ranked findings provide exploration questions after open evidence', questions[4].kind === 'finding' && questions[4].findingId === 'liability');
check('source question wording is preserved exactly', questions[0].question === 'Is the alarm professionally monitored?' && questions[2].question === 'What deductible and limit are shown on the current policy?');
check('each question explains why it was selected', questions.every(item => item.why && item.sourceTitle));
check('guided question order is explicit and continuous', questions.map(item => item.order).join(',') === '1,2,3,4,5');
check('finding is suppressed when the same assessment key already needs verification', !questions.some(item => item.findingId === 'water'));
check('confirmed evidence does not become a follow-up question', !questions.some(item => item.sourceId === 'occupancy'));
check('question derivation does not mutate the Workspace snapshot', JSON.stringify(input) === original);

const expanded = planner.getGuidedQuestions(input, { questionLimit: 10 });
check('explicit question limit allows remaining ranked findings', expanded.length === 6 && expanded.at(-1).findingId === 'earthquake');
check('question limit is enforced centrally', planner.getGuidedQuestions(input, { questionLimit: 2 }).length === 2);
check('confirmed property does not create unnecessary repeat confirmation', !planner.getGuidedQuestions(snapshot({ property: { available: true, address: '408 Main St', confirmation: { requiresConfirmation: false } } }), { questionLimit: 10 }).some(item => item.kind === 'property'));
check('unavailable property produces truthful collection wording', planner.getGuidedQuestions(snapshot({ property: { available: false, address: '', confirmation: { requiresConfirmation: true } } }), { questionLimit: 10 }).some(item => item.kind === 'property' && /address, characteristics/i.test(item.question)));
check('non-ready snapshots fail safely with no generated questions', planner.getGuidedQuestions({ state: 'empty' }).length === 0);

const plan = planner.getPlan(input);
check('conversation plan exposes guided questions additively', plan.guidedQuestions.length === 5 && plan.summary.guidedQuestionCount === 5);
check('legacy plan questions contract remains intact', plan.questions.length === plan.items.filter(item => item.prompt).length && plan.questions[0] === plan.items[0].prompt);
check('guided questions do not create another agenda or checklist architecture', plan.items.every(item => item.type !== 'guided-question') && plan.sections.every(section => section.id !== 'guided-questions'));
check('empty plan exposes the additive contract safely', Array.isArray(planner.getPlan({ state: 'empty' }).guidedQuestions) && planner.getPlan({ state: 'empty' }).summary.guidedQuestionCount === 0);

const html = read('agent/workspace/index.html');
const workspace = read('assets/js/agent-workspace.js');
const css = read('agent/workspace/workspace.css');
check('existing During phase contains one guided-question surface', (html.match(/id="guidedQuestionsPanel"/g) || []).length === 1 && html.includes('id="guidedQuestionList"') && html.includes('>What to ask next<'));
check('Workspace renders planner-derived labels, questions, reasons, and sources', ['plan?.guidedQuestions','item.label','item.question','item.why','item.sourceTitle'].every(token => workspace.includes(token)));
check('question surface explains its evidence-based derivation and policy guardrail', html.includes('unanswered details, policy checks, property confirmation, and the highest-priority findings') && html.includes('Confirm the answer and policy language'));
check('responsive question styling is present', css.includes('.guided-questions-panel') && css.includes('.guided-question[data-question-kind="missing"]') && css.includes('grid-template-columns: 30px minmax(0, 1fr)'));
check('question engine does not read storage or invoke another assessment', !read('assets/js/conversation-planner.js').includes('localStorage') && !read('assets/js/conversation-planner.js').includes('sessionStorage') && !read('assets/js/conversation-planner.js').includes('CoverageFitProtectionScore.evaluate'));
check('guided copy contains no unsupported insurance outcome', !/you qualify|guaranteed discount|guaranteed rate|approved coverage|underwriting approved/i.test(read('assets/js/conversation-planner.js') + html));

check('Protection Score remains byte-for-byte unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('assessment engine remains byte-for-byte unchanged', hash('assets/js/assessment-engine.js') === '0495ed5f714d608a3e1fa51a6fbc9e933fd33268175b11410995ed1feb639fb3');
check('workspace normalization retains GC-1.5 compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('consultation command center remains byte-for-byte unchanged', ['39e1fb2be21302892b3b1cdc9e414c62e741022bce2f4278f97bbe413b87c7d3','c6884e55d27e6542d52b0808a97fda33a7331f58e8a6b1030dbf53411bd149e9','d9ceb2fd1195d7f77937167ac6effa0569f47bfebb62ef3399a1e8e9618e2656','864fa096c62c21c6f4aa9449cf38f16d952208969ac1ba2205484fb4ac0169f3'].includes(hash('assets/js/consultation-command-center.js')));
check('consultation document retains GC-1.5 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));

new Function(read('assets/js/conversation-planner.js'));
new Function(workspace);
check('modified JavaScript parses successfully', true);

console.log(`GC-1.5 QA: ${passed}/${passed} passed`);
