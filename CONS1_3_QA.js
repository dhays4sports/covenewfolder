const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { pathToFileURL } = require('url');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
function check(name, pass) {
  assert(pass, name);
  checks.push(name);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

class MemoryBlobStore {
  constructor() { this.values = new Map(); this.metadata = new Map(); }
  async setJSON(key, value, options = {}) {
    this.values.set(key, clone(value));
    this.metadata.set(key, clone(options.metadata || {}));
    return { modified: true };
  }
  async get(key) { return clone(this.values.get(key) || null); }
  async list(options = {}) {
    const prefix = options.prefix || '';
    return { blobs: [...this.values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key, etag: `etag-${key}` })), directories: [] };
  }
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
    createdAt: '2026-08-02T09:00:00.000Z',
    score: 68,
    status: 'Review Recommended',
    strongest: 'Liability limits reviewed',
    topPriority: 'Confirm dwelling reconstruction estimate',
    consumer: {
      name: 'Remote Homeowner',
      firstName: 'Remote',
      lastName: 'Homeowner',
      email: 'remote@example.com',
      phone: '4085550123',
      propertyAddress: '456 Prospect Avenue, Fremont, CA 94539',
      reviewContext: 'Premium increased'
    },
    integration: {
      source: '408farmers',
      campaign: 'home-review',
      referralSource: 'realtor',
      entry: 'home_lander_form',
      sessionId: 'session-remote-123',
      prefilled: true
    },
    consultationRecord: {
      id: 'consultation-remote-123',
      schemaVersion: '1.0',
      status: 'ready',
      createdAt: '2026-08-02T09:00:00.000Z'
    },
    recommendations: [{ id: 'dwelling', name: 'Confirm dwelling reconstruction estimate', priority: 'High' }],
    ...overrides
  };
}

(async () => {
  const version = read('VERSION').trim();
  const changelog = read('CHANGELOG.md');
  const roadmap = read('ROADMAP.md');
  const routesConfig = JSON.parse(read('_routes.json'));
  const migration = read('migrations/0001_ops_cf_1_1.sql');
  const packageJson = JSON.parse(read('package.json'));
  const assessmentHtml = read('assessment/index.html');
  const assessmentSource = read('assets/js/assessment-engine.js');
  const workspaceHtml = read('agent/workspace/index.html');
  const workspaceSource = read('assets/js/agent-workspace.js');
  const remoteSource = read('assets/js/remote-consultations.js');
  const submitFunction = read('functions/api/consultations/submit.js');
  const inboxFunction = read('functions/api/consultations/inbox.js');
  const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');

  check('release version remains compatible after CONS-1.3', ['3.19.23','3.19.24','3.19.25','3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('changelog documents CONS-1.3', changelog.includes('CONS-1.3 Server-Backed Producer Inbox Foundation'));
  check('roadmap marks CONS-1.3 complete', roadmap.includes('CONS-1.3 Server-Backed Producer Inbox Foundation — Complete (3.19.21)'));
  check('Cloudflare Pages routes invoke only API functions', routesConfig.include.includes('/api/*'));
  check('Cloudflare D1 migration defines consultation storage', migration.includes('CREATE TABLE IF NOT EXISTS consultation_records'));
  check('Netlify dependency is removed', !packageJson.dependencies && !packageJson.devDependencies?.['@netlify/blobs']);

  check('assessment loads remote consultation client after local record store', assessmentHtml.indexOf('/assets/js/consultation-records.js') < assessmentHtml.indexOf('/assets/js/remote-consultations.js'));
  check('assessment contains bot-trap field', assessmentHtml.includes('id="website"') && assessmentHtml.includes('tabindex="-1"'));
  check('completed Home submission invokes remote handoff', assessmentSource.includes('CoverageFitRemoteConsultations.submit(report') && assessmentSource.includes('await remoteSubmission'));
  check('remote failure does not replace browser-local record creation', assessmentSource.indexOf('CoverageFitConsultationRecords') < assessmentSource.indexOf('CoverageFitRemoteConsultations.submit'));

  check('Workspace exposes secure producer inbox controls', workspaceHtml.includes('id="remoteInboxForm"') && workspaceHtml.includes('id="remoteInboxToken"') && workspaceHtml.includes('Connect &amp; sync'));
  check('Workspace loads remote inbox client before Workspace controller', workspaceHtml.indexOf('/assets/js/remote-consultations.js') < workspaceHtml.indexOf('/assets/js/agent-workspace.js'));
  check('Workspace can sync and disconnect remote inbox', workspaceSource.includes('syncRemoteInbox') && workspaceSource.includes('handleRemoteInboxDisconnect'));
  check('access key is session-scoped in browser client', remoteSource.includes("root.sessionStorage") && !remoteSource.includes("localStorage || null"));
  check('remote endpoints use same-origin paths', remoteSource.includes("'/api/consultations/submit'") && remoteSource.includes("'/api/consultations/inbox'"));
  check('inbox request sends bearer authorization', remoteSource.includes('Authorization: `Bearer ${token}`'));

  check('submission function maps to the Cloudflare handler', submitFunction.includes('consultationSubmit') && submitFunction.includes('onRequest'));
  check('submission handler uses D1 and preserves rate limiting', cloudflareHandlers.includes('createConsultationStore') && cloudflareHandlers.includes("route: 'consultation-submit'") && cloudflareHandlers.includes('limit: 12'));
  check('inbox function maps to the Cloudflare handler', inboxFunction.includes('consultationInbox') && inboxFunction.includes('onRequest'));
  check('inbox handler uses D1 and preserves protected rate limiting', cloudflareHandlers.includes("route: 'consultation-inbox'") && cloudflareHandlers.includes('limit: 60'));

  const core = await import(`${pathToFileURL(path.join(root, 'server/consultation-inbox-core.mjs')).href}?qa=${Date.now()}`);
  const store = new MemoryBlobStore();
  const report = sampleReport();

  const rejectedOrigin = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: report })
  }), { store });
  check('submission rejects cross-origin browser requests', rejectedOrigin.status === 403 && store.values.size === 0);

  const invalidPayload = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: { assessment: 'home' } })
  }), { store });
  check('submission rejects incomplete consultation records', invalidPayload.status === 422 && store.values.size === 0);

  const trapPayload = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ website: 'bot-filled.example', record: report })
  }), { store });
  check('bot-trap submissions are accepted without storage', trapPayload.status === 202 && store.values.size === 0);

  const savedResponse = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ schemaVersion: '1.0', website: '', record: report })
  }), { store });
  const savedBody = await savedResponse.json();
  check('valid completed review is stored server-side', savedResponse.status === 201 && savedBody.record.id === report.consultationRecord.id && store.values.size === 1);
  check('stored record retains the complete report', (await store.get(`records/${report.consultationRecord.id}`)).report.consumer.email === 'remote@example.com');

  const notConfigured = await core.handleConsultationInbox(new Request('https://coveragefit.com/api/consultations/inbox', {
    headers: { Authorization: 'Bearer any-token' }
  }), { store, env: {} });
  check('inbox fails closed when server access key is not configured', notConfigured.status === 503);

  const secret = 'producer-access-key-1234567890';
  const unauthorized = await core.handleConsultationInbox(new Request('https://coveragefit.com/api/consultations/inbox', {
    headers: { Authorization: 'Bearer wrong-access-key-123456789' }
  }), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret } });
  check('inbox rejects an invalid producer access key', unauthorized.status === 401);

  const authorized = await core.handleConsultationInbox(new Request('https://coveragefit.com/api/consultations/inbox?limit=50', {
    headers: { Authorization: `Bearer ${secret}` }
  }), { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret } });
  const authorizedBody = await authorized.json();
  check('authorized producer can retrieve remote consultations', authorized.status === 200 && authorizedBody.count === 1 && authorizedBody.records[0].id === report.consultationRecord.id);
  check('inbox response prevents browser caching', authorized.headers.get('cache-control').includes('no-store'));

  const sessionStorage = memoryStorage();
  const localStorage = memoryStorage();
  const browserRoot = {
    sessionStorage,
    localStorage,
    dispatchEvent() {},
    CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; }
  };
  const browserContext = {
    window: browserRoot,
    globalThis: browserRoot,
    console,
    Date,
    JSON,
    Promise,
    URL,
    URLSearchParams,
    AbortController,
    Request,
    Response,
    Headers,
    setTimeout,
    clearTimeout
  };
  vm.createContext(browserContext);
  vm.runInContext(read('assets/js/consultation-records.js'), browserContext, { filename: 'consultation-records.js' });
  browserRoot.fetch = async (url, options = {}) => {
    const absolute = new URL(url, 'https://coveragefit.com');
    const headers = new Headers(options.headers || {});
    if ((options.method || 'GET').toUpperCase() === 'POST') headers.set('Origin', 'https://coveragefit.com');
    const request = new Request(absolute, { ...options, headers });
    if (absolute.pathname.endsWith('/submit')) return core.handleConsultationSubmission(request, { store });
    return core.handleConsultationInbox(request, { store, env: { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret } });
  };
  browserContext.fetch = browserRoot.fetch;
  vm.runInContext(remoteSource, browserContext, { filename: 'remote-consultations.js' });
  const remote = browserRoot.CoverageFitRemoteConsultations;

  check('remote client exposes stable API', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION) && typeof remote.submit === 'function' && typeof remote.sync === 'function');
  const remoteSubmit = await remote.submit(report, { fetch: browserRoot.fetch, storage: sessionStorage });
  check('browser client submits completed review to server endpoint', remoteSubmit.ok === true && remoteSubmit.recordId === report.consultationRecord.id);
  check('browser client records only non-PII submission status', !sessionStorage.values[remote.LAST_SUBMISSION_KEY].includes('remote@example.com'));
  check('producer token validation rejects short keys', remote.setToken('short', { storage: sessionStorage }) === false);
  check('producer token is stored only in session storage', remote.setToken(secret, { storage: sessionStorage }) === true && sessionStorage.values[remote.TOKEN_KEY] === secret && !localStorage.values[remote.TOKEN_KEY]);

  const syncResult = await remote.sync({
    fetch: browserRoot.fetch,
    storage: sessionStorage,
    localStorage,
    records: browserRoot.CoverageFitConsultationRecords
  });
  check('remote inbox sync imports server record into existing archive', syncResult.ok === true && syncResult.imported === 1);
  check('imported remote review is selectable by existing Workspace data flow', browserRoot.CoverageFitConsultationRecords.get(report.consultationRecord.id, { storage: localStorage })?.report?.consumer?.name === 'Remote Homeowner');
  check('remote inbox sync stores only timestamp metadata in session', Boolean(sessionStorage.values[remote.SYNCED_AT_KEY]) && !sessionStorage.values[remote.SYNCED_AT_KEY].includes('Remote Homeowner'));
  check('disconnect clears producer access key', remote.clearToken({ storage: sessionStorage }) === true && !sessionStorage.values[remote.TOKEN_KEY]);

  console.log(`CONS-1.3 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
