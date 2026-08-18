const assert = require('assert');
const path = require('path');

const planner = require(path.resolve(__dirname, 'assets/js/conversation-planner.js'));

assert(['1.1.0','1.2.0'].includes(planner.VERSION));
assert.equal(planner.SCHEMA_VERSION, '1.0');

const empty = planner.getPlan({ state: 'empty', customer: { name: 'Not provided' } });
assert.equal(empty.state, 'empty');
assert.equal(empty.summary.topicCount, 0);
assert.equal(empty.sections.length, 0);

const snapshot = {
  state: 'ready',
  customer: { name: 'Avery Stone' },
  assessment: {
    score: 74,
    status: 'Strong Foundation',
    createdAt: '2026-07-25T12:00:00.000Z',
    strongest: 'Structured review completed'
  },
  strengths: ['Structured review completed'],
  property: {
    available: true,
    address: '123 Main St, Fremont, CA 94539',
    confirmation: { requiresConfirmation: false, label: '2 fields customer-confirmed' }
  },
  recommendations: [
    {
      id: 'water', order: 2, title: 'Water Damage', category: 'Property', priority: 'High', confidence: 88,
      explanation: 'Confirm water protection.', conversationStarter: 'How would a water loss affect you?',
      producerNotes: 'Review deductible and prevention requirements.', evidence: ['Older plumbing']
    },
    {
      id: 'umbrella', order: 1, title: 'Umbrella Liability', category: 'Liability', priority: 'Medium', confidence: 92,
      explanation: 'Review liability coordination.', conversationStarter: 'What assets should be considered?', evidence: []
    },
    {
      id: 'earthquake', order: 3, title: 'Earthquake', category: 'Property', priority: 'High', confidence: 70,
      explanation: 'Discuss earthquake exposure.', conversationStarter: 'Have you considered earthquake protection?', evidence: []
    }
  ]
};

const plan = planner.getPlan(snapshot);
assert.equal(plan.state, 'ready');
assert.equal(plan.customer.name, 'Avery Stone');
assert.equal(plan.summary.topicCount, 3);
assert.equal(plan.summary.firstPriority, 'Water Damage');
assert.equal(plan.items[0].phase, 'opening');
assert.equal(plan.items[1].type, 'property-confirmation');
const evidenceStep = plan.items.find(item => item.type === 'evidence-handoff');
assert(evidenceStep);
assert.equal(evidenceStep.phase, 'context');
const reviewTopics = plan.items.filter(item => item.type === 'recommendation-topic');
assert.equal(reviewTopics[0].title, 'Water Damage');
assert.equal(reviewTopics[1].title, 'Earthquake');
assert.equal(reviewTopics[2].title, 'Umbrella Liability');
assert.equal(plan.sections.map(section => section.id).join(','), 'opening,context,review,connect,close');
assert(plan.questions.length >= 7);
assert(plan.summary.estimatedMinutes > 0);
assert(plan.guardrails.some(item => item.includes('discussion topics')));

const limited = planner.getPlan(snapshot, { topicLimit: 2 });
assert.equal(limited.summary.topicCount, 2);
assert.equal(limited.items.filter(item => item.type === 'recommendation-topic').length, 2);

const noTopics = planner.getPlan({
  state: 'ready', customer: { name: 'Jordan' }, assessment: {}, strengths: [],
  property: { available: false, confirmation: { requiresConfirmation: true } }, recommendations: []
});
assert.equal(noTopics.state, 'ready');
assert.equal(noTopics.summary.topicCount, 0);
assert(noTopics.diagnostics.warnings.some(item => item.includes('No recommendation topics')));
assert(noTopics.diagnostics.warnings.some(item => item.includes('No Property Intelligence')));

const repeat = planner.getPlan(snapshot);
const comparable = value => ({
  state: value.state,
  customer: value.customer,
  assessment: value.assessment,
  summary: value.summary,
  sections: value.sections,
  items: value.items,
  questions: value.questions,
  guardrails: value.guardrails,
  diagnostics: value.diagnostics
});
assert.deepStrictEqual(comparable(plan), comparable(repeat));

console.log('AW-3 conversation planner QA passed');
