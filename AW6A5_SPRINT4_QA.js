const assert = require('assert');
const PrintEngine = require('./assets/js/print-engine.js');
const AdapterRegistry = require('./assets/js/print-adapters.js');
const RendererRegistry = require('./assets/js/print-renderers.js');
const SectionRegistry = require('./assets/js/print-sections.js');
SectionRegistry.clearRegistry();
require('./assets/js/print/sections/executive-summary.js');
require('./assets/js/print/sections/property-summary.js');
require('./assets/js/print/sections/consultation-guide.js');
global.CoverageFitPrintSectionRegistry = SectionRegistry;
global.CoverageFitPrintVisibilityEngine = require('./assets/js/print-visibility.js');
global.CoverageFitPrintDocumentComposer = require('./assets/js/document-composer.js');
global.CoverageFitPrintReportShell = require('./assets/js/print/report-shell.js');
global.CoverageFitPrintRendererRegistry = RendererRegistry;
global.CoverageFitPrintAdapterRegistry = AdapterRegistry;

const workspaceSnapshot = {
  state: 'ready', product: 'Home', customer: { name: 'Automatic Renderer Customer' },
  assessment: { score: 91, status: 'Well Prepared', strongest: 'Liability', topPriority: 'Property' },
  executiveSummary: 'Automatic renderer selection validation.', strengths: ['Liability'],
  property: { available: true, address: '789 Default Way' },
  recommendations: [{ id: 'rec-1', title: 'Review property', priority: 'High', category: 'Property', summary: 'Confirm details.', question: 'Any changes?', sourceIds: ['assessment'] }],
  attribution: null, schemaVersion: 1, adapterVersion: 'workspace-test'
};
const conversationPlan = { state: 'ready', plannerVersion: 'planner-test', summary: { topicCount: 0, agendaItemCount: 0, estimatedMinutes: 0, firstPriority: '' }, sections: [], items: [], questions: [], guardrails: [] };
const checklistState = { version: 'checklist-test', summary: { total: 0, completed: 0, active: 0, pending: 0, completionPercent: 0 }, progress: { total: 0, completed: 0, active: 0, pending: 0, completionPercent: 0, remainingMinutes: 0, completedPhases: 0, totalPhases: 0 }, currentPhase: '', remainingMinutes: 0, plannerVersion: 'planner-test', checklist: { phases: [], items: [] }, diagnostics: { valid: true } };
const base = { workspaceSnapshot, conversationPlan, checklistState, adapterRegistry: AdapterRegistry, rendererRegistry: RendererRegistry };

// No renderer argument resolves through the registry default.
const automatic = PrintEngine.render(base);
assert.strictEqual(automatic.pipeline.renderer.type, RendererRegistry.getDefaultRendererType());
assert.strictEqual(automatic.pipeline.renderer.selectionStrategy, 'registry-default');
assert.strictEqual(Object.isFrozen(automatic), true);

// Explicit renderer remains authoritative.
const explicit = PrintEngine.render('html', base);
assert.strictEqual(explicit.pipeline.renderer.type, 'html');
assert.strictEqual(explicit.pipeline.renderer.selectionStrategy, 'explicit');

// Capability selection resolves a capable registered renderer.
RendererRegistry.registerRenderer('capability-test', {
  id: 'capability-test-renderer', version: '1.0.0', capabilities: ['proposal'],
  render(model) { return { type: 'capability-test', model }; }
}, { metadata: { capabilities: ['proposal'], production: true } });
const capability = PrintEngine.render(Object.assign({}, base, { rendererCapability: 'proposal', requireCapability: true }));
assert.strictEqual(capability.pipeline.renderer.type, 'capability-test');
assert.strictEqual(capability.pipeline.renderer.selectionStrategy, 'capability');
assert.strictEqual(capability.pipeline.renderer.requestedCapability, 'proposal');

assert.throws(
  () => PrintEngine.render(Object.assign({}, base, { rendererCapability: 'nonexistent', requireCapability: true })),
  error => error && error.code === 'PRINT_RENDERER_CAPABILITY_NOT_FOUND'
);

const selected = PrintEngine.selectRendererType(null, {}, RendererRegistry);
assert.strictEqual(selected.type, RendererRegistry.getDefaultRendererType());
assert.strictEqual(selected.strategy, 'registry-default');
assert.strictEqual(Object.isFrozen(selected), true);

console.log('AW-6A.5 Sprint 4 QA: PASS');
