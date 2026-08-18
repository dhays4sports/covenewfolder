const assert = require('assert');
const Registry = require('./assets/js/print-renderers.js');

assert.ok(['0.2.0', '0.3.0'].includes(Registry.VERSION));
assert.strictEqual(Registry.getDefaultRendererType(), 'html');
assert.strictEqual(Registry.hasRenderer('HTML'), true);
assert.strictEqual(typeof Registry.getRenderer('html').render, 'function');
assert.strictEqual(Registry.getRenderer(), Registry.getRenderer('html'));
assert.deepStrictEqual(Array.from(Registry.listRenderers()), ['html']);
assert.strictEqual(Object.isFrozen(Registry.listRenderers()), true);

const htmlMetadata = Registry.getRendererMetadata('html');
assert.strictEqual(htmlMetadata.type, 'html');
assert.strictEqual(htmlMetadata.mediaType, 'text/html');
assert.strictEqual(Registry.supports('html', 'PRINT-PREVIEW'), true);
assert.strictEqual(Object.isFrozen(htmlMetadata), true);
assert.strictEqual(Object.isFrozen(htmlMetadata.capabilities), true);

const textRenderer = {
  version: '1.0.0',
  mediaType: 'text/plain',
  extension: 'txt',
  capabilities: ['text'],
  render(model) { return { type: 'text', content: model.state }; }
};
const registered = Registry.registerRenderer(' Text ', textRenderer, { metadata: { name: 'Text Renderer' } });
assert.strictEqual(registered.type, 'text');
assert.strictEqual(Registry.getRenderer('TEXT'), textRenderer);
assert.strictEqual(Registry.supports('text', 'text'), true);

assert.throws(
  () => Registry.registerRenderer('text', textRenderer),
  error => error && error.code === 'PRINT_RENDERER_DUPLICATE'
);
assert.throws(
  () => Registry.registerRenderer('broken', {}),
  error => error && error.code === 'PRINT_RENDERER_INVALID'
);
assert.throws(
  () => Registry.setDefaultRenderer('pdf'),
  error => error && error.code === 'PRINT_RENDERER_NOT_FOUND'
);

Registry.setDefaultRenderer('text');
assert.strictEqual(Registry.getDefaultRendererType(), 'text');
assert.strictEqual(Registry.resolveRenderer().type, 'text');
assert.strictEqual(Object.isFrozen(Registry.resolveRenderer()), true);

const replacement = { version: '1.1.0', render() { return { type: 'text-v2' }; } };
Registry.registerRenderer('text', replacement, { replace: true });
assert.strictEqual(Registry.getRenderer('text'), replacement);

const diagnostics = Registry.getDiagnostics();
assert.strictEqual(diagnostics.valid, true);
assert.strictEqual(diagnostics.rendererCount, 2);
assert.strictEqual(diagnostics.defaultRendererType, 'text');
assert.strictEqual(Object.isFrozen(diagnostics), true);
assert.strictEqual(Object.isFrozen(diagnostics.renderers), true);

assert.strictEqual(Registry.unregisterRenderer('text'), true);
assert.strictEqual(Registry.getDefaultRendererType(), 'html');
assert.strictEqual(Registry.unregisterRenderer('missing'), false);
assert.strictEqual(Registry.getRenderer('missing'), null);
assert.throws(
  () => Registry.resolveRenderer('missing'),
  error => error && error.code === 'PRINT_RENDERER_NOT_FOUND'
);

console.log('AW-6A.5 Sprint 2 QA: PASS');
