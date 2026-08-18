const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const workspaceHtml = read('agent/workspace/index.html');
const consultationHtml = read('agent/consultation/index.html');
const consultationCss = read('agent/consultation/consultation.css');
const workspaceSource = read('assets/js/agent-workspace.js');
const controllerSource = read('assets/js/consultation-document.js');
const changelog = read('CHANGELOG.md');
const roadmap = read('ROADMAP.md');
const version = read('VERSION').trim();

const checks = [];
function check(name, pass) {
  assert(pass, name);
  checks.push(name);
}

function memoryStorage(initial = {}) {
  const values = { ...initial };
  return {
    values,
    getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem(key, value) { values[key] = String(value); },
    removeItem(key) { delete values[key]; }
  };
}

function sampleReport(overrides = {}) {
  return {
    version: 'v2.4',
    assessment: 'home',
    createdAt: '2026-08-02T08:00:00.000Z',
    score: 72,
    status: 'Strong Foundation',
    strongest: 'Liability foundation',
    topPriority: 'Dwelling replacement cost',
    executiveSummary: 'Review the reconstruction estimate and liability limits before presenting options.',
    strengths: ['Liability foundation'],
    consumer: {
      name: 'Dylan Haysbert',
      firstName: 'Dylan',
      lastName: 'Haysbert',
      phone: '4085550100',
      email: 'dylan@example.com',
      propertyAddress: '123 Main Street, Fremont, CA 94539',
      reviewContext: 'Premium increased'
    },
    integration: { source: '408farmers', campaign: 'home-review', entry: 'home_lander_form', sessionId: 'session-cons12', prefilled: true },
    propertyProfile: {
      address: '123 Main Street, Fremont, CA 94539',
      yearBuilt: 1998,
      squareFeet: 2100,
      stories: 2,
      constructionType: 'Frame',
      roofType: 'Composition',
      foundationType: 'Slab',
      verifiedByUser: true
    },
    recommendations: [
      {
        id: 'dwelling',
        name: 'Confirm dwelling reconstruction estimate',
        priority: 'High',
        category: 'Dwelling',
        clientExplanation: 'The reconstruction estimate should reflect current labor and material costs.',
        conversationStarter: 'How was the current dwelling limit calculated?'
      }
    ],
    ...overrides
  };
}

function fakeElement(id) {
  return {
    id,
    hidden: false,
    disabled: false,
    textContent: '',
    href: '',
    title: '',
    srcdoc: '',
    attributes: {},
    listeners: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    focus() {},
    contentWindow: {
      printed: 0,
      focused: 0,
      focus() { this.focused += 1; },
      print() { this.printed += 1; }
    }
  };
}

function browserRuntime() {
  const storage = memoryStorage();
  const ids = [
    'documentAnnouncements', 'documentLoading', 'documentError', 'documentPreview',
    'documentErrorMessage', 'printConsultationDocument', 'consultationDocumentFrame',
    'documentRecordLabel', 'backToWorkspace', 'documentErrorAction'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, fakeElement(id)]));
  elements.documentError.hidden = true;
  elements.documentPreview.hidden = true;
  const document = {
    readyState: 'loading',
    title: 'Consultation Document | CoverageFit',
    addEventListener() {},
    getElementById(id) { return elements[id] || null; }
  };
  const rootObject = {
    document,
    localStorage: storage,
    location: { search: '', href: 'https://coveragefit.com/agent/consultation/' },
    history: { replaceState() {} },
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {},
    CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; },
    COVERAGEFIT_PRODUCER: {
      name: 'Dylan Haysbert',
      title: 'Licensed Insurance Producer',
      license: 'CA License #4528400',
      agency: 'Virginia Tam Insurance Agency',
      phone: '(408) 327-6377',
      email: 'dylan@dylanhaysbert.com'
    },
    COVERAGEFIT_PRODUCER_READY: Promise.resolve()
  };
  const context = {
    window: rootObject,
    globalThis: rootObject,
    console,
    Date,
    Intl,
    URL,
    URLSearchParams,
    Promise,
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  const scripts = [
    'assets/js/consultation-records.js',
    'assets/js/protection-score.js',
    'assets/js/workspace-data.js',
    'assets/js/conversation-planner.js',
    'assets/js/consultation-checklist.js',
    'assets/js/print-adapters.js',
    'assets/js/print-sections.js',
    'assets/js/print-visibility.js',
    'assets/js/print/models/executive-summary-model.js',
    'assets/js/print/models/protection-snapshot-model.js',
    'assets/js/print/models/property-summary-model.js',
    'assets/js/print/models/recommendation-model.js',
    'assets/js/print/sections/executive-summary.js',
    'assets/js/print/sections/property-summary.js',
    'assets/js/print/sections/recommendations.js',
    'assets/js/print/models/checklist-model.js',
    'assets/js/print/sections/checklist.js',
    'assets/js/print/models/timeline-model.js',
    'assets/js/print/sections/timeline.js',
    'assets/js/print/sections/metadata.js',
    'assets/js/document-composer.js',
    'assets/js/print/report-shell.js',
    'assets/js/print-renderers.js',
    'assets/js/print-engine.js',
    'assets/js/consultation-document.js'
  ];
  scripts.forEach(rel => vm.runInContext(read(rel), context, { filename: rel }));
  return { rootObject, context, storage, elements };
}

(async () => {
  check('release version remains compatible after CONS-1.2', /^(?:3\.19\.(?:20|2[1-9]|3[01])|3\.20\.[0-9]+)$/.test(version));
  check('changelog documents CONS-1.2', changelog.includes('CONS-1.2 Consultation Document Access'));
  check('roadmap marks CONS-1.2 complete', roadmap.includes('CONS-1.2 Consultation Document Access — Complete (3.19.20)'));

  check('Workspace exposes visible consultation-document action', workspaceHtml.includes('id="openConsultationDocument"') && (workspaceHtml.includes('Open consultation document') || workspaceHtml.includes('Agent Guide') || workspaceHtml.includes('Consultation Document')));
  check('Workspace action opens in a separate agent tab safely', workspaceHtml.includes('target="_blank"') && workspaceHtml.includes('rel="noopener"'));
  check('Workspace action starts disabled without a saved record', workspaceHtml.includes('id="openConsultationDocument"') && workspaceHtml.includes('aria-disabled="true"'));
  check('Workspace controller links the active opaque record', workspaceSource.includes('/agent/consultation/?consultation_id=') && workspaceSource.includes('updateConsultationDocumentAction(snapshot)'));
  check('Workspace document link does not include customer PII parameters', !workspaceSource.includes("searchParams.set('customer'") && !workspaceSource.includes("searchParams.set('address'"));

  check('consultation document route exists', fs.existsSync(path.join(root, 'agent/consultation/index.html')));
  check('consultation document route is noindex', consultationHtml.includes('content="noindex, nofollow"'));
  check('document route contains Print / Save PDF action', consultationHtml.includes('id="printConsultationDocument"') && consultationHtml.includes('Print / Save PDF'));
  check('document route contains accessible loading, error, and no-script states', consultationHtml.includes('id="documentLoading"') && consultationHtml.includes('id="documentError"') && consultationHtml.includes('<noscript>') && consultationHtml.includes('role="alert"'));
  check('document route contains a titled preview frame', consultationHtml.includes('id="consultationDocumentFrame"') && consultationHtml.includes('title="CoverageFit home protection consultation document preview"'));
  check('document route loads selected-record and print pipeline dependencies in order', consultationHtml.indexOf('/assets/js/consultation-records.js') < consultationHtml.indexOf('/assets/js/workspace-data.js') && consultationHtml.indexOf('/assets/js/workspace-data.js') < consultationHtml.indexOf('/assets/js/print-engine.js') && consultationHtml.indexOf('/assets/js/print-engine.js') < consultationHtml.indexOf('/assets/js/consultation-document.js'));
  check('document styling includes mobile controls', consultationCss.includes('@media (max-width: 560px)') && consultationCss.includes('min-height: 44px'));
  check('document styling includes reduced-motion behavior', consultationCss.includes('@media (prefers-reduced-motion: reduce)'));

  const runtime = browserRuntime();
  const records = runtime.rootObject.CoverageFitConsultationRecords;
  const record = records.upsert(sampleReport(), { storage: runtime.storage, dispatch: false, id: 'consultation-cons12-test' });
  check('test consultation record created', record && record.id === 'consultation-cons12-test');

  const documentApi = runtime.rootObject.CoverageFitConsultationDocument;
  check('document controller exposes stable public API', documentApi && ['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0'].includes(documentApi.VERSION) && typeof documentApi.renderDocument === 'function');
  check('controller reads only opaque consultation_id', documentApi.requestedConsultationId('?consultation_id=consultation-cons12-test&name=ignored') === 'consultation-cons12-test');
  check('controller builds opaque Workspace return link', documentApi.workspaceHref(record.id) === '/agent/workspace/?consultation_id=consultation-cons12-test');
  check('missing record lookup fails safely', documentApi.resolveRecord(records, 'consultation-does-not-exist') === null);

  const rendered = documentApi.renderDocument(record, {
    workspaceData: runtime.rootObject.CoverageFitWorkspaceData,
    planner: runtime.rootObject.CoverageFitConversationPlanner,
    checklist: runtime.rootObject.CoverageFitConsultationChecklist,
    printEngine: runtime.rootObject.CoverageFitPrintEngine,
    producer: runtime.rootObject.COVERAGEFIT_PRODUCER
  });
  check('selected consultation drives the generated snapshot', rendered.snapshot.consultation.id === record.id && rendered.snapshot.customer.name === 'Dylan Haysbert');
  check('selected consultation generates a ready conversation plan', rendered.plan.state === 'ready' && rendered.plan.items.length > 0);
  check('selected consultation generates checklist state', rendered.checklistState.checklist.state === 'ready' && rendered.checklistState.checklist.items.length > 0);
  check('Print Engine returns full HTML document', rendered.output.type === 'html' && rendered.output.html.startsWith('<!doctype html>'));
  check('generated output uses certified report shell with call-ready default', rendered.output.diagnostics.reportShellValid === true && !rendered.output.html.includes('data-print-shell="cover"') && !rendered.output.html.includes('Page 1 of 3'));
  check('generated output includes selected customer and address', rendered.output.html.includes('Dylan Haysbert') && rendered.output.html.includes('123 Main Street'));
  check('generated output identifies the Consultation Document', rendered.output.html.includes('Consultation Document') && rendered.output.html.includes('Consultation working document'));
  check('generated output carries opaque record reference', rendered.output.html.includes('consultation-cons12-test'));

  runtime.rootObject.location.search = `?consultation_id=${record.id}`;
  const initializedOutput = await documentApi.initialize();
  check('normal route initialization produces document output', initializedOutput && initializedOutput.html.includes('data-print-shell="body"'));
  runtime.elements.consultationDocumentFrame.listeners.load();
  check('normal route initialization reveals preview after frame load', runtime.elements.documentPreview.hidden === false && runtime.elements.documentLoading.hidden === true && runtime.elements.documentError.hidden === true);
  check('normal route initialization writes generated HTML to frame', runtime.elements.consultationDocumentFrame.srcdoc.includes('data-print-shell="body"'));
  check('normal route initialization enables print action', runtime.elements.printConsultationDocument.disabled === false);
  check('normal route initialization labels selected record accessibly', runtime.elements.documentRecordLabel.textContent.includes('Dylan Haysbert') && runtime.elements.documentRecordLabel.textContent.includes('123 Main Street'));
  check('normal route initialization preserves opaque return route', runtime.elements.backToWorkspace.href === '/agent/workspace/?consultation_id=consultation-cons12-test');

  const printed = documentApi.printDocument();
  check('print action opens frame print service', printed === true && runtime.elements.consultationDocumentFrame.contentWindow.printed === 1);
  check('print action announces Save as PDF guidance', runtime.elements.documentAnnouncements.textContent.includes('Save as PDF'));

  const missingRuntime = browserRuntime();
  missingRuntime.rootObject.location.search = '?consultation_id=consultation-missing';
  const missingOutput = await missingRuntime.rootObject.CoverageFitConsultationDocument.initialize();
  check('missing record route does not generate output', missingOutput === null);
  check('missing record route exposes recoverable error state', missingRuntime.elements.documentError.hidden === false && missingRuntime.elements.documentPreview.hidden === true);
  check('missing record route returns to opaque Workspace route', missingRuntime.elements.documentErrorAction.href === '/agent/workspace/?consultation_id=consultation-missing');

  console.log(`CONS-1.2 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
