const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
let checks = 0;

const registry = require(path.join(root, 'assets/js/print-adapters.js'));
global.CoverageFitPrintAdapterRegistry = registry;
const engine = require(path.join(root, 'assets/js/print-engine.js'));

assert.strictEqual(registry.VERSION, '0.1.0'); checks++;
assert.strictEqual(registry.ADAPTER_CONTRACT_VERSION, 1); checks++;
assert(Object.isFrozen(registry)); checks++;
assert.strictEqual(registry.hasAdapter('home'), true); checks++;
assert.strictEqual(registry.getAdapter('home'), registry.HomePrintAdapter); checks++;
assert(Object.isFrozen(registry.HomePrintAdapter)); checks++;
assert.strictEqual(typeof registry.HomePrintAdapter.createSnapshot, 'function'); checks++;
assert(registry.listAdapters().some(x => x.type === 'home')); checks++;
assert(Object.isFrozen(registry.listAdapters())); checks++;

const workspaceSnapshot = { schemaVersion: 1, adapterVersion: '1.0.0', product: 'Home', state: 'ready', customer: {name:'Taylor'}, assessment:{score:80,status:'Strong',strongest:'A',topPriority:'B'}, executiveSummary:'Summary', strengths:[], property:{available:true,address:'1 Main'}, recommendations:[], attribution:null };
const conversationPlan = {schemaVersion:1,plannerVersion:'1.0.0',state:'ready',summary:{},sections:[],items:[],questions:[],guardrails:[]};
const checklistState = {version:'1.0.0',summary:{},progress:{},currentPhase:'',remainingMinutes:0,plannerVersion:'1.0.0',checklist:{phases:[],items:[]},diagnostics:{}};
const adapted = registry.createSnapshot('home', {settings:{workspaceSnapshot,conversationPlan,checklistState},dependencies:{}});
assert.strictEqual(adapted.adapterType, 'home'); checks++;
assert.strictEqual(adapted.workspaceSnapshot, workspaceSnapshot); checks++;
assert(Object.isFrozen(adapted)); checks++;

assert(['0.3.0','0.4.0'].includes(engine.VERSION)); checks++;
for (const method of ['registerAdapter','getAdapter','listAdapters']) { assert.strictEqual(typeof engine[method], 'function'); checks++; }
const model = engine.buildModel({adapterRegistry: registry, workspaceSnapshot, conversationPlan, checklistState, generatedAt:'2026-07-27T00:00:00.000Z'});
assert.strictEqual(model.customer.name, 'Taylor'); checks++;
assert.strictEqual(model.diagnostics.adapter.type, 'home'); checks++;
assert.strictEqual(model.diagnostics.adapter.id, 'home'); checks++;
assert.strictEqual(model.metadata.sourceVersions.printAdapter, 'home'); checks++;
assert.strictEqual(model.metadata.sourceVersions.printAdapterVersion, '1.0.0'); checks++;
assert(Object.isFrozen(model.diagnostics.adapter)); checks++;

const custom = Object.freeze({id:'business',version:'0.1.0',contractVersion:1,createSnapshot(ctx){return {adapterType:'business',adapterId:'business',adapterVersion:'0.1.0',product:'Business',workspaceSnapshot:ctx.settings.workspaceSnapshot,conversationPlan:ctx.settings.conversationPlan,checklistState:ctx.settings.checklistState};}});
registry.registerAdapter('business', custom); checks++;
assert.strictEqual(registry.getAdapter('business'), custom); checks++;
assert.throws(() => registry.registerAdapter('business', custom), /already registered/); checks++;
const businessModel = engine.buildModel({adapterRegistry:registry,adapterType:'business',workspaceSnapshot:{...workspaceSnapshot,product:'Business'},conversationPlan,checklistState,generatedAt:'2026-07-27T00:00:00.000Z'});
assert.strictEqual(businessModel.metadata.product, 'Business'); checks++;
assert.strictEqual(businessModel.diagnostics.adapter.id, 'business'); checks++;

const html = read('agent/workspace/index.html');
assert(html.includes('/assets/js/print-adapters.js')); checks++;
assert(html.indexOf('/assets/js/print-adapters.js') < html.indexOf('/assets/js/print-engine.js')); checks++;
assert(/^3\.(?:1[6-9]|[2-9]\d)\.\d+$/.test(read('VERSION').trim())); checks++;
for (const file of ['AW6_PRINT_ADAPTERS.md','SPRINT-AW-6A.4.md']) { assert(fs.existsSync(path.join(root,file))); checks++; }
console.log(JSON.stringify({suite:'AW-6A.4 Print Data Adapters',version:read('VERSION').trim(),checks,passed:checks},null,2));
