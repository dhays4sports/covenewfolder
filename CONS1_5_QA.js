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

function sampleReport(id = 'consultation-followup-123', name = 'Follow Up Homeowner') {
  return {
    version: 'v2.4',
    assessment: 'home',
    createdAt: '2026-08-02T09:00:00.000Z',
    score: 68,
    status: 'Review Recommended',
    strongest: 'Liability limits reviewed',
    topPriority: 'Confirm dwelling reconstruction estimate',
    consumer: {
      name,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      email: `${id}@example.com`,
      phone: '4085550199',
      propertyAddress: '123 Follow Up Way, Fremont, CA 94539',
      reviewContext: 'Premium increased'
    },
    integration: {
      source: '408farmers', campaign: 'home-review', referralSource: 'realtor',
      entry: 'home_lander_form', sessionId: `session-${id}`, prefilled: true
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
  const followUpFunction = read('functions/api/consultations/follow-up.js');
  const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');
  const deploymentSource = read('WR1C2_DEPLOYMENT_QA.js');

  check('release version advanced to 3.19.23', ['3.19.23','3.19.24','3.19.25','3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('changelog documents CONS-1.5', changelog.includes('CONS-1.5 Producer Inbox Search, Filters, and Follow-Up Queue'));
  check('roadmap marks CONS-1.5 complete', roadmap.includes('CONS-1.5 Producer Inbox Search, Filters, and Follow-Up Queue — Complete (3.19.23)'));
  check('follow-up function is included in deployment verification', deploymentSource.includes('functions/api/consultations/follow-up.js'));
  check('consultation-follow-up function maps to Cloudflare Pages', followUpFunction.includes('consultationFollowUp') && followUpFunction.includes('onRequest'));
  check('consultation-follow-up handler preserves D1 rate limiting', cloudflareHandlers.includes("route: 'consultation-follow-up'") && cloudflareHandlers.includes('limit: 120'));

  ['consultationSearch','consultationStatusFilter','consultationFollowUpFilter','consultationQueueList','consultationFollowUpForm','consultationFollowUpDate','consultationFollowUpNote'].forEach(id => {
    check(`Workspace exposes ${id}`, workspaceHtml.includes(`id="${id}"`));
  });
  check('Workspace includes all delivery filters', ['new','opened','acknowledged','local'].every(value => workspaceHtml.includes(`value="${value}"`)));
  check('Workspace includes actionable follow-up filters', ['needs-action','overdue','today','upcoming','completed','unscheduled'].every(value => workspaceHtml.includes(`value="${value}"`)));
  check('Workspace styles responsive queue and follow-up controls', workspaceCss.includes('.consultation-queue__filters') && workspaceCss.includes('.consultation-follow-up__fields') && workspaceCss.includes('@media (max-width: 620px)'));
  check('Workspace performs safe text-only queue rendering', workspaceSource.includes('renderConsultationQueue') && workspaceSource.includes('textContent = followUpDisplayValue.text') && !workspaceSource.includes('consultationQueueList.innerHTML'));
  check('Workspace searches customer and campaign fields', ['customer.email','customer.phone','customer.propertyAddress','customer.reviewContext','integration?.campaign','integration?.referralSource'].every(value => workspaceSource.includes(value)));
  check('Workspace derives overdue and due-today states', workspaceSource.includes("return 'overdue'") && workspaceSource.includes("return 'today'"));
  check('Workspace schedules, completes, and clears follow-up', ['scheduleFollowUp','completeFollowUp','clearFollowUp'].every(name => workspaceSource.includes(`remoteInbox.${name}`)));
  check('local records are labeled without false server follow-up', workspaceSource.includes('follow-up scheduling unavailable'));

  const core = await import(`${pathToFileURL(path.join(root, 'server/consultation-inbox-core.mjs')).href}?qa=${Date.now()}`);
  check('server record version advanced', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0'].includes(core.RECORD_VERSION));
  check('server exports follow-up states', Array.isArray(core.FOLLOW_UP_STATES) && core.FOLLOW_UP_STATES.join(',') === 'none,scheduled,completed');
  check('server exports follow-up handler', typeof core.handleConsultationFollowUp === 'function');

  const store = new MemoryBlobStore();
  const secret = 'producer-access-key-1234567890';
  const env = { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret };
  const report = sampleReport();

  const submission = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: report })
  }), { store });
  const submissionBody = await submission.json();
  check('new records begin without scheduled follow-up', submission.status === 201 && submissionBody.record.followUp.state === 'none' && !submissionBody.record.followUp.dueDate);

  const rejectedOrigin = await core.handleConsultationFollowUp(new Request('https://coveragefit.com/api/consultations/follow-up', {
    method: 'PATCH',
    headers: { Origin: 'https://attacker.example', Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-05' })
  }), { store, env });
  check('follow-up updates reject cross-origin requests', rejectedOrigin.status === 403);

  const unauthorized = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', 'wrong-access-key-123456789', {
    consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-05'
  }), { store, env });
  check('follow-up updates require producer authorization', unauthorized.status === 401);

  const missingDate = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'scheduled'
  }), { store, env });
  check('scheduled follow-up requires valid date', missingDate.status === 422);

  const longNote = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-05', note: 'x'.repeat(241)
  }), { store, env });
  check('follow-up note length is validated', longNote.status === 422);

  const prematureCompletion = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'completed'
  }), { store, env });
  check('unscheduled follow-up cannot be marked complete', prematureCompletion.status === 422);

  const scheduled = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id,
    state: 'scheduled',
    dueDate: '2026-08-05',
    note: 'Call after 4 PM to review deductible options'
  }), { store, env });
  const scheduledBody = await scheduled.json();
  check('producer can schedule follow-up', scheduled.status === 200 && scheduledBody.record.followUp.state === 'scheduled');
  check('scheduled follow-up persists date and note', scheduledBody.record.followUp.dueDate === '2026-08-05' && scheduledBody.record.followUp.note.includes('deductible'));
  check('scheduling records timestamps', Boolean(scheduledBody.record.followUp.scheduledAt) && Boolean(scheduledBody.record.followUp.updatedAt));
  check('follow-up mutation preserves consultation ordering timestamp', scheduledBody.record.updatedAt === submissionBody.record.updatedAt);
  check('Blob metadata includes follow-up queue fields', store.metadata.get(`records/${report.consultationRecord.id}`).followUpState === 'scheduled' && store.metadata.get(`records/${report.consultationRecord.id}`).followUpDueDate === '2026-08-05');

  const inboxScheduled = await core.handleConsultationInbox(producerRequest('https://coveragefit.com/api/consultations/inbox', 'GET', secret), { store, env });
  const inboxScheduledBody = await inboxScheduled.json();
  check('inbox returns scheduled follow-up', inboxScheduledBody.records[0].followUp.state === 'scheduled' && inboxScheduledBody.records[0].followUp.dueDate === '2026-08-05');
  check('inbox includes follow-up counts', inboxScheduledBody.counts.followUpScheduled === 1 && inboxScheduledBody.counts.followUpCompleted === 0);

  const opened = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, status: 'opened'
  }), { store, env });
  const openedBody = await opened.json();
  check('delivery lifecycle changes preserve follow-up', openedBody.record.status === 'opened' && openedBody.record.followUp.state === 'scheduled');

  const completed = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'completed'
  }), { store, env });
  const completedBody = await completed.json();
  check('producer can mark follow-up complete', completedBody.record.followUp.state === 'completed' && Boolean(completedBody.record.followUp.completedAt));
  check('completed follow-up retains scheduled context', completedBody.record.followUp.dueDate === '2026-08-05' && completedBody.record.followUp.note.includes('deductible'));

  const duplicate = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: report })
  }), { store });
  const duplicateBody = await duplicate.json();
  check('duplicate submission preserves completed follow-up', duplicateBody.record.followUp.state === 'completed' && Boolean(duplicateBody.record.followUp.completedAt));

  const rescheduled = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-12', note: 'Second conversation'
  }), { store, env });
  const rescheduledBody = await rescheduled.json();
  check('completed follow-up can be rescheduled as a new action', rescheduledBody.record.followUp.state === 'scheduled' && rescheduledBody.record.followUp.dueDate === '2026-08-12' && !rescheduledBody.record.followUp.completedAt);

  const cleared = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, {
    consultationId: report.consultationRecord.id, state: 'none'
  }), { store, env });
  const clearedBody = await cleared.json();
  check('producer can clear follow-up', clearedBody.record.followUp.state === 'none' && !clearedBody.record.followUp.dueDate && !clearedBody.record.followUp.note);

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
    if (absolute.pathname.endsWith('/follow-up')) return core.handleConsultationFollowUp(request, { store, env });
    return core.handleConsultationInbox(request, { store, env });
  };
  context.fetch = browserRoot.fetch;
  vm.runInContext(remoteSource, context, { filename: 'remote-consultations.js' });
  const records = browserRoot.CoverageFitConsultationRecords;
  const remote = browserRoot.CoverageFitRemoteConsultations;
  check('browser queue clients remain compatible', ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && ['1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION));
  check('browser client exposes follow-up endpoint and methods', remote.FOLLOW_UP_ENDPOINT === '/api/consultations/follow-up' && ['scheduleFollowUp','completeFollowUp','clearFollowUp'].every(name => typeof remote[name] === 'function'));
  check('producer access key remains session-only', remote.setToken(secret, { storage: sessionStorage }) && !localStorage.values[remote.TOKEN_KEY]);

  const browserReport = sampleReport('consultation-browser-followup-456', 'Browser Queue Homeowner');
  await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST',
    headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ record: browserReport })
  }), { store });
  const sync = await remote.sync({ fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  check('sync imports unscheduled remote record', sync.ok && records.get(browserReport.consultationRecord.id, { storage: localStorage }).remote.followUp.state === 'none');

  const beforeSchedule = records.get(browserReport.consultationRecord.id, { storage: localStorage });
  const browserScheduled = await remote.scheduleFollowUp(browserReport.consultationRecord.id, '2026-08-06', 'Text before calling', {
    fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records
  });
  const afterSchedule = records.get(browserReport.consultationRecord.id, { storage: localStorage });
  check('browser scheduling persists server and local queue state', browserScheduled.followUp.state === 'scheduled' && afterSchedule.remote.followUp.dueDate === '2026-08-06');
  check('local queue mutation does not reorder consultation content', afterSchedule.updatedAt === beforeSchedule.updatedAt);
  const browserCompleted = await remote.completeFollowUp(browserReport.consultationRecord.id, {
    fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records
  });
  check('browser completion persists locally', browserCompleted.followUp.state === 'completed' && records.get(browserReport.consultationRecord.id, { storage: localStorage }).remote.followUp.state === 'completed');
  await remote.clearFollowUp(browserReport.consultationRecord.id, {
    fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records
  });
  check('browser clear removes local queue details', records.get(browserReport.consultationRecord.id, { storage: localStorage }).remote.followUp.state === 'none');

  console.log(`CONS-1.5 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
