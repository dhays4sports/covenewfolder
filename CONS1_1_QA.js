const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const root = __dirname;
const recordsSource = fs.readFileSync(path.join(root, 'assets/js/consultation-records.js'), 'utf8');
const workspaceDataSource = fs.readFileSync(path.join(root, 'assets/js/workspace-data.js'), 'utf8');
const assessmentSource = fs.readFileSync(path.join(root, 'assets/js/assessment-engine.js'), 'utf8');
const assessmentHtml = fs.readFileSync(path.join(root, 'assessment/index.html'), 'utf8');
const workspaceHtml = fs.readFileSync(path.join(root, 'agent/workspace/index.html'), 'utf8');
const workspaceSource = fs.readFileSync(path.join(root, 'assets/js/agent-workspace.js'), 'utf8');
const workspaceCss = fs.readFileSync(path.join(root, 'agent/workspace/workspace.css'), 'utf8');
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const roadmap = fs.readFileSync(path.join(root, 'ROADMAP.md'), 'utf8');
const version = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();

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

function loadRecords() {
  const events = [];
  const rootObject = {
    dispatchEvent(event) { events.push(event); },
    CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; }
  };
  const context = {
    globalThis: rootObject,
    window: rootObject,
    module: { exports: {} },
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math
  };
  vm.createContext(context);
  vm.runInContext(recordsSource, context);
  return { api: context.module.exports, rootObject, events };
}

function homeReport(overrides = {}) {
  return {
    version: 'v2.4',
    assessment: 'home',
    createdAt: '2026-08-02T08:00:00.000Z',
    score: 72,
    status: 'Strong Foundation',
    consumer: {
      firstName: 'Dylan',
      lastName: 'Haysbert',
      name: 'Dylan Haysbert',
      email: 'dylan@example.com',
      phone: '4085550100',
      propertyAddress: '123 Main Street, Fremont, CA 94539',
      reviewContext: 'Premium increased'
    },
    integration: {
      source: '408farmers',
      campaign: 'door_hanger',
      referralSource: 'realtor',
      entry: 'home_lander_form',
      sessionId: 'session-123',
      prefilled: true
    },
    strengths: ['Assessment completed'],
    priorities: [{ tag: 'Liability', category: 'Liability', insight: 'Confirm limits', question: 'Confirm liability limits', points: -10 }],
    topPriority: 'Confirm limits',
    strongest: 'Assessment completed',
    ...overrides
  };
}

check('release version remains compatible after CONS-1.1', /^(?:3\.19\.(?:19|2[0-9]|3[01])|3\.20\.[0-9]+)$/.test(version));
check('CONS-1.1 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-CONS-1.1.md')));
check('changelog contains CONS-1.1 release', changelog.includes('3.19.19 — CONS-1.1 Completed Review Consultation Handoff'));
check('roadmap marks CONS-1.1 complete', roadmap.includes('CONS-1.1 Completed Review Consultation Handoff — Complete'));
check('consultation record runtime exists', fs.existsSync(path.join(root, 'assets/js/consultation-records.js')));

const { api: records, events } = loadRecords();
check('consultation record API is frozen', Object.isFrozen(records));
check('record schema is versioned', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && records.SCHEMA_VERSION === '1.0');
check('record storage keys are namespaced', records.STORE_KEY === 'coveragefit.consultations.v1' && records.ACTIVE_KEY === 'coveragefit.consultations.active');
check('record archive is bounded', records.MAX_RECORDS === 25);
check('record lifecycle events are exposed', records.EVENTS.CREATED === 'coveragefit:consultation-record-created' && records.EVENTS.SELECTED === 'coveragefit:consultation-record-selected' && records.EVENTS.UPDATED === 'coveragefit:consultation-record-updated');

const store = memoryStorage();
const firstReport = homeReport();
const first = records.upsert(firstReport, { storage: store, dispatch: false, now: () => new Date('2026-08-02T08:01:00.000Z') });
check('completed Home report creates a record', Boolean(first?.id));
check('record id is opaque and excludes customer details', /^consultation-[a-z0-9]+$/.test(first.id) && !first.id.includes('Dylan') && !first.id.includes('123'));
check('record preserves final report payload', first.report.consumer.email === 'dylan@example.com' && first.report.score === 72);
check('record preserves customer and integration summary', first.customer.propertyAddress.includes('123 Main') && first.integration.referralSource === 'realtor');
check('new record becomes active', store.getItem(records.ACTIVE_KEY) === first.id);
check('record appears in durable list', records.list({ storage: store }).length === 1);
check('active record can be reopened', records.getActive({ storage: store }).id === first.id);

const duplicate = records.upsert({ ...firstReport, score: 74 }, { storage: store, id: first.id, dispatch: false, now: () => new Date('2026-08-02T08:02:00.000Z') });
check('upsert updates rather than duplicates a record', records.list({ storage: store }).length === 1 && duplicate.assessment.score === 74);
check('upsert preserves original record creation date', duplicate.createdAt === first.createdAt);

const secondReport = homeReport({
  createdAt: '2026-08-02T09:00:00.000Z',
  consumer: { ...firstReport.consumer, name: 'Alex Smith', firstName: 'Alex', lastName: 'Smith', email: 'alex@example.com', propertyAddress: '456 Oak Avenue, San Jose, CA 95124' },
  integration: { ...firstReport.integration, sessionId: 'session-456' }
});
const second = records.upsert(secondReport, { storage: store, dispatch: false, now: () => new Date('2026-08-02T09:01:00.000Z') });
check('later completed review creates a second durable record', records.list({ storage: store }).length === 2);
check('records are ordered newest first', records.list({ storage: store })[0].id === second.id);
check('earlier record remains retrievable', records.get(first.id, { storage: store }).customer.name === 'Dylan Haysbert');
check('record selection restores an earlier review', records.select(first.id, { storage: store, dispatch: false }).id === first.id && store.getItem(records.ACTIVE_KEY) === first.id);
check('non-Home reports do not create Home consultation records', records.upsert({ ...firstReport, assessment: 'business' }, { storage: store, dispatch: false }) === null);

const brokenStore = memoryStorage({ [records.STORE_KEY]: '{bad json' });
check('malformed archives fail safely', records.list({ storage: brokenStore }).length === 0);
const blockedStorage = { getItem() { return null; }, setItem() { throw new Error('blocked'); } };
check('blocked browser storage fails without throwing', records.upsert(firstReport, { storage: blockedStorage, dispatch: false }) === null);
const boundedStore = memoryStorage();
for (let index = 0; index < 30; index += 1) {
  records.upsert(homeReport({
    createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
    consumer: { ...firstReport.consumer, email: `person${index}@example.com`, propertyAddress: `${index + 1} Main Street` },
    integration: { ...firstReport.integration, sessionId: `bounded-${index}` }
  }), { storage: boundedStore, dispatch: false, now: () => new Date(`2026-08-${String(index + 1).padStart(2, '0')}T10:01:00.000Z`) });
}
check('archive pruning retains no more than 25 records', records.list({ storage: boundedStore }).length === 25);

const eventStore = memoryStorage();
records.upsert(firstReport, { storage: eventStore });
check('record creation emits a lifecycle event', events.some(event => event.type === records.EVENTS.CREATED));
records.select(records.list({ storage: eventStore })[0].id, { storage: eventStore });
check('record selection emits a lifecycle event', events.some(event => event.type === records.EVENTS.SELECTED));

check('assessment form loads consultation records before the assessment engine', assessmentHtml.indexOf('/assets/js/consultation-records.js') > -1 && assessmentHtml.indexOf('/assets/js/consultation-records.js') < assessmentHtml.indexOf('/assets/js/assessment-engine.js'));
check('assessment form includes consultation record correlation field', /name="consultation_record_id"\s+id="consultationRecordId"/.test(assessmentHtml));
check('assessment creates records only for Home reviews', assessmentSource.includes("config.slug === 'home' && window.CoverageFitConsultationRecords"));
check('assessment adds record metadata to the submitted payload', assessmentSource.includes('report.consultationRecord = {') && assessmentSource.includes('id: recordId'));
check('assessment writes the record id into Formspree payload', assessmentSource.includes('consultationField.value = consultationRecord?.id'));
check('record creation remains after final consumer details are assembled', assessmentSource.indexOf('report.consumer = {') < assessmentSource.indexOf('CoverageFitConsultationRecords'));

check('Agent Workspace loads consultation records before workspace data', workspaceHtml.indexOf('/assets/js/consultation-records.js') > -1 && workspaceHtml.indexOf('/assets/js/consultation-records.js') < workspaceHtml.indexOf('/assets/js/workspace-data.js'));
check('Agent Workspace contains an accessible saved-record selector', workspaceHtml.includes('id="consultationRecordSelect"') && workspaceHtml.includes('label for="consultationRecordSelect"'));
check('Agent Workspace exposes record status through a live region', workspaceHtml.includes('id="consultationRecordMeta"') && workspaceHtml.includes('role="status"') && workspaceHtml.includes('aria-live="polite"'));
check('record selector styling includes a mobile layout', workspaceCss.includes('CONS-1.1 — durable consultation record selector') && workspaceCss.includes('@media (max-width: 760px)'));
check('Workspace controller lists and selects records through the data adapter', workspaceSource.includes('data.listConsultations()') && workspaceSource.includes('data.selectConsultation(consultationId'));
check('Workspace deep links use only opaque consultation_id', workspaceSource.includes("searchParams.set('consultation_id', consultationId)") && !workspaceSource.includes("searchParams.set('customer'"));
check('Workspace announces record changes accessibly', workspaceSource.includes('Opened consultation record for'));

function loadWorkspaceData({ storage, locationSearch = '' }) {
  const rootObject = {
    localStorage: storage,
    location: { search: locationSearch },
    CoverageFitConsultationRecords: records,
    dispatchEvent() {},
    CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; },
    addEventListener() {},
    removeEventListener() {}
  };
  const context = {
    globalThis: rootObject,
    window: rootObject,
    module: { exports: {} },
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    URLSearchParams
  };
  vm.createContext(context);
  vm.runInContext(workspaceDataSource, context);
  return context.module.exports;
}

const workspaceStore = memoryStorage();
const workspaceFirst = records.upsert(firstReport, { storage: workspaceStore, dispatch: false, id: first.id });
const workspaceSecond = records.upsert(secondReport, { storage: workspaceStore, dispatch: false, id: second.id });
const data = loadWorkspaceData({ storage: workspaceStore });
const activeSnapshot = data.getSnapshot({ storage: workspaceStore, propertyProfile: null });
check('Workspace loads the active durable consultation record', activeSnapshot.consultation.id === workspaceSecond.id && activeSnapshot.customer.name === 'Alex Smith');
check('Workspace snapshot identifies durable record storage mode', activeSnapshot.source.storageMode === 'consultation-record' && activeSnapshot.consultation.durable === true);
check('Workspace adapter lists all durable consultations', data.listConsultations({ storage: workspaceStore }).length === 2);
const selected = data.selectConsultation(workspaceFirst.id, { storage: workspaceStore, dispatch: false });
check('Workspace adapter selects an earlier consultation', selected.id === workspaceFirst.id);
check('selected consultation mirrors into legacy report key', JSON.parse(workspaceStore.getItem(data.REPORT_KEY)).consumer.name === 'Dylan Haysbert');
const selectedSnapshot = data.getSnapshot({ storage: workspaceStore, propertyProfile: null });
check('selected record drives the existing Workspace snapshot', selectedSnapshot.customer.name === 'Dylan Haysbert' && selectedSnapshot.consultation.id === workspaceFirst.id);

const queryData = loadWorkspaceData({ storage: workspaceStore, locationSearch: `?consultation_id=${workspaceSecond.id}` });
const querySnapshot = queryData.getSnapshot({ storage: workspaceStore, propertyProfile: null });
check('opaque consultation deep link opens the requested record', querySnapshot.consultation.id === workspaceSecond.id && querySnapshot.customer.name === 'Alex Smith');

const legacyStore = memoryStorage({ coveragefit_home_report: JSON.stringify(firstReport) });
const legacyData = loadWorkspaceData({ storage: legacyStore });
const legacySnapshot = legacyData.getSnapshot({ storage: legacyStore, propertyProfile: null });
check('legacy latest-report fallback remains compatible', legacySnapshot.state === 'ready' && legacySnapshot.consultation === null && legacySnapshot.source.storageMode === 'legacy-report');

console.log(`CONS-1.1 QA: ${checks.length}/${checks.length} passed`);
