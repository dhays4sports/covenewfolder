const assert = require('assert');
const PrintEngine = require('./assets/js/print-engine.js');
const AdapterRegistry = require('./assets/js/print-adapters.js');
const RendererRegistry = require('./assets/js/print-renderers.js');

const workspaceSnapshot = {
  state: 'ready',
  product: 'Home',
  customer: { name: 'Pipeline Customer', email: 'pipeline@example.com', phone: '555-0130' },
  assessment: { score: 88, status: 'Well Prepared', strongest: 'Liability', topPriority: 'Dwelling' },
  executiveSummary: 'End-to-end pipeline validation.',
  strengths: ['Liability'],
  property: { available: true, address: '456 Pipeline Way' },
  recommendations: [{
    id: 'rec-pipeline', title: 'Review dwelling', priority: 'High', category: 'Property',
    summary: 'Confirm rebuild cost.', question: 'Has the home changed?', sourceIds: ['assessment']
  }],
  attribution: null,
  schemaVersion: 1,
  adapterVersion: 'workspace-test'
};

const conversationPlan = {
  state: 'ready', plannerVersion: 'planner-test',
  summary: { topicCount: 1, agendaItemCount: 1, estimatedMinutes: 5, firstPriority: 'Dwelling' },
  sections: [{ id: 'review', title: 'Review', estimatedMinutes: 5, items: [{ id: 'item-1', phase: 'review', type: 'topic', title: 'Dwelling', estimatedMinutes: 5 }] }],
  items: [{ id: 'item-1', phase: 'review', type: 'topic', title: 'Dwelling', estimatedMinutes: 5 }],
  questions: [], guardrails: []
};

const checklistState = {
  version: 'checklist-test',
  summary: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0 },
  progress: { total: 1, completed: 0, active: 1, pending: 0, completionPercent: 0, remainingMinutes: 5, completedPhases: 0, totalPhases: 1 },
  currentPhase: 'review', remainingMinutes: 5, plannerVersion: 'planner-test',
  checklist: { phases: [{ id: 'review' }], items: [{ id: 'item-1' }] },
  diagnostics: { valid: true }
};

let rendererInput = null;
let rendererOptions = null;
const pipelineRenderer = {
  id: 'pipeline-test-renderer',
  version: '1.0.0',
  mediaType: 'application/x-coveragefit-test',
  render(model, options) {
    rendererInput = model;
    rendererOptions = options;
    return { type: 'pipeline-test', content: model.customer.name, model };
  }
};

RendererRegistry.registerRenderer('pipeline-test', pipelineRenderer, {
  metadata: { production: true, capabilities: ['test'] }
});

const result = PrintEngine.executePipeline('pipeline-test', {
  workspaceSnapshot,
  conversationPlan,
  checklistState,
  adapterRegistry: AdapterRegistry,
  rendererRegistry: RendererRegistry,
  rendererOptions: { pageSize: 'letter' },
  generatedAt: '2026-07-26T12:00:00.000Z'
});

assert.strictEqual(result.type, 'pipeline-test');
assert.strictEqual(result.content, 'Pipeline Customer');
assert.strictEqual(Object.isFrozen(result), true);
assert.strictEqual(Object.isFrozen(result.pipeline), true);
assert.strictEqual(Object.isFrozen(rendererInput), true);
assert.strictEqual(Object.isFrozen(rendererOptions), true);
assert.strictEqual(rendererOptions.pageSize, 'letter');
assert.strictEqual(rendererInput.customer.name, 'Pipeline Customer');
assert.strictEqual(rendererInput.diagnostics.adapter.type, 'home');
assert.strictEqual(rendererInput.diagnostics.adapter.id, 'home');
assert.strictEqual(rendererInput.diagnostics.pipeline.rendererIsolatedFromWorkspace, true);
assert.strictEqual(result.pipeline.adapter.type, 'home');
assert.strictEqual(result.pipeline.snapshot.immutable, true);
assert.strictEqual(result.pipeline.snapshot.valid, true);
assert.strictEqual(result.pipeline.renderer.type, 'pipeline-test');
assert.strictEqual(result.pipeline.renderer.id, 'pipeline-test-renderer');
assert.strictEqual(result.pipeline.isolation.rendererReceivesWorkspaceState, false);
assert.strictEqual(result.pipeline.isolation.rendererReceivesPrintModelOnly, true);
assert.strictEqual(result.pipeline.isolation.rendererOptionsImmutable, true);
assert.deepStrictEqual(Array.from(result.pipeline.stages), ['workspace', 'adapter', 'snapshot', 'validation', 'renderer', 'output']);
assert.strictEqual(Object.prototype.hasOwnProperty.call(rendererOptions, 'workspaceSnapshot'), false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(rendererOptions, 'conversationPlan'), false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(rendererOptions, 'checklistState'), false);

const contract = PrintEngine.getPipelineContract();
assert.strictEqual(contract.contractVersion, 1);
assert.strictEqual(contract.rendererInput, 'immutable-print-model');
assert.strictEqual(contract.rendererWorkspaceAccess, false);
assert.strictEqual(contract.outputImmutable, true);
assert.strictEqual(Object.isFrozen(contract), true);

const viaRender = PrintEngine.render('pipeline-test', {
  workspaceSnapshot, conversationPlan, checklistState,
  adapterRegistry: AdapterRegistry, rendererRegistry: RendererRegistry
});
assert.strictEqual(viaRender.pipeline.renderer.type, 'pipeline-test');

assert.throws(
  () => PrintEngine.executePipeline('pipeline-test', {
    adapterRegistry: {
      resolveType() { return 'broken'; },
      createSnapshot() { return null; }
    },
    rendererRegistry: RendererRegistry
  }),
  error => error && error.code === 'PRINT_ADAPTER_SNAPSHOT_INVALID'
);

console.log('AW-6A.5 Sprint 3 QA: PASS');
