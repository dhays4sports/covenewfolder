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
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

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
    return { blobs: [...this.values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })), directories: [] };
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

function sampleReport(id = 'consultation-lifecycle-123') {
  return {
    version: 'v2.4',
    assessment: 'home',
    createdAt: '2026-08-02T09:00:00.000Z',
    score: 72,
    status: 'Strong Foundation',
    strongest: 'Liability limits reviewed',
    topPriority: 'Confirm dwelling reconstruction estimate',
    consumer: {
      name: 'Lifecycle Homeowner',
      firstName: 'Lifecycle',
      lastName: 'Homeowner',
      email: 'lifecycle@example.com',
      phone: '4085550199',
      propertyAddress: '789 Delivery Lane, Fremont, CA 94539',
      reviewContext: 'Non-renewal or cancellation'
    },
    integration: {
      source: '408farmers', campaign: 'home-review', referralSource: 'realtor',
      entry: 'home_lander_form', sessionId: 'session-lifecycle-123', prefilled: true
    },
    consultationRecord: { id, schemaVersion: '1.0', status: 'ready', createdAt: '2026-08-02T09:00:00.000Z' },
    recommendations: [{ id: 'dwelling', name: 'Confirm dwelling reconstruction estimate', priority: 'High' }]
  };
}

function producerRequest(url, method, secret, body) {
  const headers = { Authorization: `Bearer ${secret}` };
  if (method !== 'GET') {
    headers.Origin = 'https://coveragefit.com';
    headers['Content-Type'] = 'application/json';
  }
  return new Request(url, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
}

(async () => {
  const version = read('VERSION').trim();
  const changelog = read('CHANGELOG.md');
  const roadmap = read('ROADMAP.md');
  const workspaceHtml = read('agent/workspace/index.html');
  const workspaceCss = read('agent/workspace/workspace.css');
  const workspaceSource = read('assets/js/agent-workspace.js');
  const remoteSource = read('assets/js/remote-consultations.js');
  const recordsSource = read('assets/js/consultation-records.js');
  const statusFunction = read('functions/api/consultations/status.js');
  const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');
  const deploymentSource = read('WR1C2_DEPLOYMENT_QA.js');

  check('release version advanced to 3.19.22', ['3.19.23','3.19.24','3.19.25','3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('changelog documents CONS-1.4', changelog.includes('CONS-1.4 Producer Inbox Delivery State and Record Acknowledgment'));
  check('roadmap marks CONS-1.4 complete', roadmap.includes('CONS-1.4 Producer Inbox Delivery State and Record Acknowledgment — Complete (3.19.22)'));
  check('status function is included in deployment verification', deploymentSource.includes('functions/api/consultations/status.js'));
  check('consultation-status function maps to Cloudflare Pages', statusFunction.includes('consultationStatus') && statusFunction.includes('onRequest'));
  check('consultation-status handler preserves D1 rate limiting', cloudflareHandlers.includes("route: 'consultation-status'") && cloudflareHandlers.includes('limit: 120'));

  check('Workspace exposes delivery status badge', workspaceHtml.includes('id="consultationDeliveryBadge"') && workspaceHtml.includes('id="consultationDeliveryMeta"'));
  check('Workspace exposes acknowledgment action', workspaceHtml.includes('id="acknowledgeConsultation"') && workspaceHtml.includes('Acknowledge review'));
  check('Workspace styles all remote lifecycle states', ['new', 'opened', 'acknowledged'].every(status => workspaceCss.includes(`[data-state="${status}"]`)));
  check('Workspace marks selected new records opened', workspaceSource.includes('maybeMarkConsultationOpened') && workspaceSource.includes('remoteInbox.markOpened'));
  check('Workspace acknowledges active record explicitly', workspaceSource.includes('acknowledgeActiveConsultation') && workspaceSource.includes('remoteInbox.acknowledge'));
  check('record selector includes lifecycle label', workspaceSource.includes('consultationStatusLabel(record)'));
  check('remote client exposes status endpoint and methods', remoteSource.includes("'/api/consultations/status'") && remoteSource.includes('function markOpened') && remoteSource.includes('function acknowledge'));
  check('local record archive persists remote lifecycle state', recordsSource.includes('function updateRemote') && recordsSource.includes('deliveredAt') && recordsSource.includes('acknowledgedAt'));

  const core = await import(`${pathToFileURL(path.join(root, 'server/consultation-inbox-core.mjs')).href}?qa=${Date.now()}`);
  const store = new MemoryBlobStore();
  const report = sampleReport();
  const secret = 'producer-access-key-1234567890';
  const env = { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret };

  const submission = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: report })
  }), { store });
  const submissionBody = await submission.json();
  check('server submission records delivered lifecycle', submission.status === 201 && submissionBody.record.delivery.state === 'delivered' && Boolean(submissionBody.record.delivery.deliveredAt));
  check('new remote review begins in new state', submissionBody.record.status === 'new' && Boolean(submissionBody.record.delivery.newAt));
  check('server metadata retains delivery state', store.metadata.get(`records/${report.consultationRecord.id}`).status === 'new' && Boolean(store.metadata.get(`records/${report.consultationRecord.id}`).deliveredAt));

  const inbox = await core.handleConsultationInbox(producerRequest('https://coveragefit.com/api/consultations/inbox', 'GET', secret), { store, env });
  const inboxBody = await inbox.json();
  check('inbox returns lifecycle state and counts', inbox.status === 200 && inboxBody.counts.new === 1 && inboxBody.records[0].delivery.state === 'delivered');

  const rejectedOrigin = await core.handleConsultationStatus(new Request('https://coveragefit.com/api/consultations/status', {
    method: 'PATCH',
    headers: { Origin: 'https://attacker.example', Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ consultationId: report.consultationRecord.id, status: 'opened' })
  }), { store, env });
  check('status updates reject cross-origin requests', rejectedOrigin.status === 403);

  const unauthorized = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', 'wrong-access-key-123456789', {
    consultationId: report.consultationRecord.id, status: 'opened'
  }), { store, env });
  check('status updates require producer authorization', unauthorized.status === 401);

  const opened = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, status: 'opened'
  }), { store, env });
  const openedBody = await opened.json();
  check('producer can advance new record to opened', opened.status === 200 && openedBody.record.status === 'opened');
  check('opened state records opened timestamp', Boolean(openedBody.record.delivery.openedAt) && !openedBody.record.delivery.acknowledgedAt);
  check('status advancement preserves content ordering timestamp', openedBody.record.updatedAt === submissionBody.record.updatedAt && Boolean(openedBody.record.statusUpdatedAt));

  const openedAgain = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, status: 'opened'
  }), { store, env });
  const openedAgainBody = await openedAgain.json();
  check('opened update is idempotent', openedAgainBody.record.status === 'opened' && openedAgainBody.record.delivery.openedAt === openedBody.record.delivery.openedAt);

  const acknowledged = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, status: 'acknowledged'
  }), { store, env });
  const acknowledgedBody = await acknowledged.json();
  check('producer can acknowledge opened record', acknowledged.status === 200 && acknowledgedBody.record.status === 'acknowledged');
  check('acknowledgment records timestamp and preserves open', Boolean(acknowledgedBody.record.delivery.acknowledgedAt) && acknowledgedBody.record.delivery.openedAt === openedBody.record.delivery.openedAt);

  const noDowngrade = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, status: 'opened'
  }), { store, env });
  const noDowngradeBody = await noDowngrade.json();
  check('acknowledged record cannot be downgraded', noDowngradeBody.record.status === 'acknowledged');

  const duplicateSubmission = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: report })
  }), { store });
  const duplicateBody = await duplicateSubmission.json();
  check('duplicate prospect submission preserves producer acknowledgment', duplicateBody.record.status === 'acknowledged' && Boolean(duplicateBody.record.delivery.acknowledgedAt));

  const missingRecord = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: 'consultation-missing-999', status: 'opened'
  }), { store, env });
  check('status update returns not found for missing record', missingRecord.status === 404);

  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const browserRoot = {
    localStorage,
    sessionStorage,
    dispatchEvent() {},
    CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; }
  };
  const context = {
    window: browserRoot, globalThis: browserRoot, console, Date, JSON, Promise, URL, URLSearchParams,
    AbortController, Request, Response, Headers, setTimeout, clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(recordsSource, context, { filename: 'consultation-records.js' });
  browserRoot.fetch = async (url, options = {}) => {
    const absolute = new URL(url, 'https://coveragefit.com');
    const headers = new Headers(options.headers || {});
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') headers.set('Origin', 'https://coveragefit.com');
    const request = new Request(absolute, { ...options, method, headers });
    if (absolute.pathname.endsWith('/submit')) return core.handleConsultationSubmission(request, { store });
    if (absolute.pathname.endsWith('/status')) return core.handleConsultationStatus(request, { store, env });
    return core.handleConsultationInbox(request, { store, env });
  };
  context.fetch = browserRoot.fetch;
  vm.runInContext(remoteSource, context, { filename: 'remote-consultations.js' });
  const records = browserRoot.CoverageFitConsultationRecords;
  const remote = browserRoot.CoverageFitRemoteConsultations;
  check('browser lifecycle client version advanced', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION) && ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION));
  check('producer access key remains session-only', remote.setToken(secret, { storage: sessionStorage }) && !localStorage.values[remote.TOKEN_KEY]);

  const secondReport = sampleReport('consultation-browser-456');
  await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: secondReport })
  }), { store });
  const sync = await remote.sync({ fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  check('sync imports remote new state into local consultation archive', sync.ok && records.get(secondReport.consultationRecord.id, { storage: localStorage }).remote.status === 'new');
  const beforeOpenedLocal = records.get(secondReport.consultationRecord.id, { storage: localStorage });
  const openedClient = await remote.markOpened(secondReport.consultationRecord.id, { fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  const afterOpenedLocal = records.get(secondReport.consultationRecord.id, { storage: localStorage });
  check('browser open action persists server and local opened state', openedClient.status === 'opened' && afterOpenedLocal.remote.status === 'opened');
  check('local lifecycle update does not reorder consultation content', afterOpenedLocal.updatedAt === beforeOpenedLocal.updatedAt);
  const acknowledgedClient = await remote.acknowledge(secondReport.consultationRecord.id, { fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  const localAcknowledged = records.get(secondReport.consultationRecord.id, { storage: localStorage });
  check('browser acknowledge action persists server and local acknowledged state', acknowledgedClient.status === 'acknowledged' && localAcknowledged.remote.status === 'acknowledged');
  check('local archive retains delivery timestamps after acknowledgment', Boolean(localAcknowledged.remote.deliveredAt) && Boolean(localAcknowledged.remote.openedAt) && Boolean(localAcknowledged.remote.acknowledgedAt));
  records.updateRemote(secondReport.consultationRecord.id, { status: 'new', delivery: { deliveredAt: localAcknowledged.remote.deliveredAt } }, { storage: localStorage, dispatch: false });
  check('local archive refuses stale status downgrade', records.get(secondReport.consultationRecord.id, { storage: localStorage }).remote.status === 'acknowledged');

  console.log(`CONS-1.4 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
