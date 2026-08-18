const assert = require('assert');
const PrintEngine = require('./assets/js/print-engine.js');

function readySnapshot() {
  return {
    state: 'ready',
    product: 'Home',
    customer: { name: 'Test Customer', email: 'test@example.com', phone: '555-0100' },
    assessment: { score: 82, status: 'Strong Foundation', strongest: 'Liability', topPriority: 'Dwelling' },
    executiveSummary: 'A renderer-ready consultation model.',
    strengths: ['Liability limits'],
    property: { available: true, address: '123 Main St' },
    recommendations: [{ id: 'rec-1', title: 'Review dwelling', priority: 'High', category: 'Property', summary: 'Confirm rebuild cost.', question: 'What changed?', sourceIds: ['assessment'] }],
    attribution: null,
    schemaVersion: 1,
    adapterVersion: 'test'
  };
}

function planner() {
  return {
    state: 'ready',
    plannerVersion: 'test',
    summary: { topicCount: 1, agendaItemCount: 1, estimatedMinutes: 5, firstPriority: 'Dwelling' },
    sections: [{ id: 'section-1', title: 'Review', estimatedMinutes: 5, items: [{ id: 'item-1', phase: 'review', type: 'topic', title: 'Dwelling', estimatedMinutes: 5 }] }],
    items: [{ id: 'item-1', phase: 'review', type: 'topic', title: 'Dwelling', estimatedMinutes: 5 }],
    questions: [],
    guardrails: []
  };
}

function checklist() {
  return {
    version: 'test',
    summary: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0 },
    progress: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0, remainingMinutes: 5, completedPhases: 0, totalPhases: 1 },
    currentPhase: 'review',
    remainingMinutes: 5,
    plannerVersion: 'test',
    checklist: { phases: [{ id: 'review' }], items: [{ id: 'item-1' }] },
    diagnostics: { valid: true }
  };
}

const renderer = {
  render(model, options) {
    return { type: 'html', html: '<main>Rendered</main>', model, options };
  }
};
const rendererRegistry = {
  getRenderer(type) { return type === 'html' ? renderer : null; },
  listRenderers() { return Object.freeze(['html']); }
};
const common = {
  workspaceSnapshot: readySnapshot(),
  conversationPlan: planner(),
  checklistState: checklist(),
  rendererRegistry,
  generatedAt: '2026-07-26T12:00:00.000Z'
};

const model = PrintEngine.renderModel(common);
assert.strictEqual(model.state, 'ready');
assert.strictEqual(model.diagnostics.validation.valid, true);
assert.strictEqual(Object.isFrozen(model), true);
assert.strictEqual(Object.isFrozen(model.metadata), true);

const automatic = PrintEngine.render(common);
assert.strictEqual(automatic.type, 'html');
assert.strictEqual(automatic.html, '<main>Rendered</main>');
assert.strictEqual(Object.isFrozen(automatic), true);
assert.strictEqual(Object.isFrozen(automatic.model), true);
assert.strictEqual(Object.isFrozen(automatic.options), true);

const explicit = PrintEngine.render('html', { ...common, rendererOptions: { pageSize: 'letter' } });
assert.strictEqual(explicit.options.pageSize, 'letter');

assert.throws(
  () => PrintEngine.render('pdf', common),
  error => error && error.code === 'PRINT_RENDERER_NOT_FOUND' && error.details.availableRenderers.includes('html')
);

assert.throws(
  () => PrintEngine.render({ ...common, rendererRegistry: null }),
  error => error && error.code === 'PRINT_RENDERER_REGISTRY_UNAVAILABLE'
);

console.log('AW-6A.5 Sprint 1 QA: PASS');
