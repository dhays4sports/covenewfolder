const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { pathToFileURL } = require('url');

const root = __dirname;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
function check(name, pass) { assert(pass, name); checks.push(name); }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class MemoryBlobStore {
  constructor() { this.values = new Map(); this.metadata = new Map(); }
  async setJSON(key, value, options = {}) { this.values.set(key, clone(value)); this.metadata.set(key, clone(options.metadata || {})); return { modified: true }; }
  async get(key) { return clone(this.values.get(key) || null); }
  async list(options = {}) { const prefix = options.prefix || ''; return { blobs: [...this.values.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })), directories: [] }; }
}
function memoryStorage(initial = {}) {
  const values = { ...initial };
  return { values, getItem(key) { return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; }, setItem(key, value) { values[key] = String(value); }, removeItem(key) { delete values[key]; } };
}
function sampleReport(id = 'consultation-notes-123', name = 'Notes Homeowner') {
  return {
    version: 'v2.4', assessment: 'home', createdAt: '2026-08-02T09:00:00.000Z', score: 74,
    status: 'Strong Foundation', strongest: 'Liability reviewed', topPriority: 'Confirm dwelling estimate',
    consumer: { name, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), email: `${id}@example.com`, phone: '4085550199', propertyAddress: '123 Activity Way, Fremont, CA 94539', reviewContext: 'Premium increased' },
    integration: { source: '408farmers', campaign: 'home-review', referralSource: 'realtor', entry: 'home_lander_form', sessionId: `session-${id}`, prefilled: true },
    consultationRecord: { id, schemaVersion: '1.0', status: 'ready', createdAt: '2026-08-02T09:00:00.000Z' },
    recommendations: [{ id: 'dwelling', name: 'Confirm dwelling estimate', priority: 'High' }]
  };
}
function producerRequest(url, method, secret, body) {
  const headers = { Authorization: `Bearer ${secret}` };
  if (method !== 'GET') { headers.Origin = 'https://coveragefit.com'; headers['Content-Type'] = 'application/json'; }
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
  const activityFunction = read('functions/api/consultations/activity.js');
  const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');
  const deploymentSource = read('WR1C2_DEPLOYMENT_QA.js');

  check('release version advanced to 3.19.24', ['3.19.24','3.19.25','3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('changelog documents CONS-1.6', changelog.includes('CONS-1.6 Consultation Notes and Activity Timeline'));
  check('roadmap marks CONS-1.6 complete', roadmap.includes('CONS-1.6 Consultation Notes and Activity Timeline — Complete (3.19.24)'));
  check('activity function included in deployment verification', deploymentSource.includes('functions/api/consultations/activity.js'));
  check('consultation-activity function maps to Cloudflare Pages', activityFunction.includes('consultationActivity') && activityFunction.includes('onRequest'));
  check('consultation-activity handler preserves D1 rate limiting', cloudflareHandlers.includes("route: 'consultation-activity'") && cloudflareHandlers.includes('limit: 180'));

  ['consultationNotesActivity','consultationNoteForm','consultationNoteText','saveConsultationNote','consultationActivityList','consultationActivityEmpty'].forEach(id => check(`Workspace exposes ${id}`, workspaceHtml.includes(`id="${id}"`)));
  check('producer note input is bounded', workspaceHtml.includes('maxlength="1000"'));
  check('Workspace styles responsive notes and activity timeline', workspaceCss.includes('.consultation-note-form textarea') && workspaceCss.includes('.consultation-activity-item') && workspaceCss.includes('@media (max-width: 620px)'));
  check('Workspace renders activity with textContent', workspaceSource.includes('renderConsultationActivity') && workspaceSource.includes('detail.textContent = plainText(event.detail)'));
  check('Workspace saves producer notes', workspaceSource.includes('remoteInbox.addNote(record.id, note)'));
  check('Workspace records consultation document access', workspaceSource.includes("remoteInbox.logActivity(record.id, 'consultation_document_opened')"));
  check('Workspace records customer report access', workspaceSource.includes("remoteInbox.logActivity(record.id, 'customer_report_opened')"));
  check('consultation search includes producer notes', workspaceSource.includes('record.remote.notes.map(note => note.body)'));

  const core = await import(`${pathToFileURL(path.join(root, 'server/consultation-inbox-core.mjs')).href}?qa=${Date.now()}`);
  check('server record version advanced', ['1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0'].includes(core.RECORD_VERSION));
  check('server exports activity limits and types', core.MAX_PRODUCER_NOTES === 50 && core.MAX_ACTIVITY_EVENTS === 100 && core.ACTIVITY_TYPES.includes('producer_note'));
  check('server exports activity handler', typeof core.handleConsultationActivity === 'function');

  const store = new MemoryBlobStore();
  const secret = 'producer-access-key-1234567890';
  const env = { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret };
  const report = sampleReport();
  const submit = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: report })
  }), { store });
  const submitted = await submit.json();
  check('new consultation starts with delivered activity', submit.status === 201 && submitted.record.activity.some(event => event.type === 'delivered'));
  check('new consultation starts without producer notes', Array.isArray(submitted.record.notes) && submitted.record.notes.length === 0);

  const rejectedOrigin = await core.handleConsultationActivity(new Request('https://coveragefit.com/api/consultations/activity', {
    method: 'POST', headers: { Origin: 'https://attacker.example', Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ consultationId: report.consultationRecord.id, type: 'producer_note', note: 'Unsafe origin' })
  }), { store, env });
  check('activity updates reject cross-origin requests', rejectedOrigin.status === 403);
  const unauthorized = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', 'wrong-access-key-123456789', { consultationId: report.consultationRecord.id, type: 'producer_note', note: 'Unauthorized' }), { store, env });
  check('activity updates require producer authorization', unauthorized.status === 401);
  const missingNote = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, { consultationId: report.consultationRecord.id, type: 'producer_note' }), { store, env });
  check('producer note body is required', missingNote.status === 422);
  const longNote = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, { consultationId: report.consultationRecord.id, type: 'producer_note', note: 'x'.repeat(1001) }), { store, env });
  check('producer note length is validated', longNote.status === 422);
  const invalidType = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, { consultationId: report.consultationRecord.id, type: 'deleted' }), { store, env });
  check('unsupported activity types are rejected', invalidType.status === 422);

  const noteResponse = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, {
    consultationId: report.consultationRecord.id, type: 'producer_note', note: 'Client prefers a higher deductible and wants to discuss umbrella coverage.'
  }), { store, env });
  const noted = await noteResponse.json();
  check('producer note persists on record', noteResponse.status === 200 && noted.record.notes.length === 1 && noted.record.notes[0].body.includes('umbrella'));
  check('producer note appears in activity timeline', noted.record.activity.some(event => event.type === 'producer_note' && event.detail.includes('umbrella')));
  check('Blob metadata includes note count', store.metadata.get(`records/${report.consultationRecord.id}`).noteCount === 1);

  const opened = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, { consultationId: report.consultationRecord.id, status: 'opened' }), { store, env });
  const openedBody = await opened.json();
  check('opening adds one opened event', openedBody.record.activity.filter(event => event.type === 'opened').length === 1);
  const openedAgain = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, { consultationId: report.consultationRecord.id, status: 'opened' }), { store, env });
  const openedAgainBody = await openedAgain.json();
  check('reopening does not duplicate opened event', openedAgainBody.record.activity.filter(event => event.type === 'opened').length === 1);
  const acknowledged = await core.handleConsultationStatus(producerRequest('https://coveragefit.com/api/consultations/status', 'PATCH', secret, { consultationId: report.consultationRecord.id, status: 'acknowledged' }), { store, env });
  const acknowledgedBody = await acknowledged.json();
  check('acknowledgment adds timeline event', acknowledgedBody.record.activity.some(event => event.type === 'acknowledged'));

  const scheduled = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, { consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-08', note: 'Review deductible options' }), { store, env });
  const scheduledBody = await scheduled.json();
  check('follow-up scheduling adds timeline event', scheduledBody.record.activity.some(event => event.type === 'follow_up_scheduled' && event.detail.includes('2026-08-08')));
  const updated = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, { consultationId: report.consultationRecord.id, state: 'scheduled', dueDate: '2026-08-09', note: 'Call after 4 PM' }), { store, env });
  const updatedBody = await updated.json();
  check('follow-up changes add updated event', updatedBody.record.activity.some(event => event.type === 'follow_up_updated'));
  const completed = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, { consultationId: report.consultationRecord.id, state: 'completed' }), { store, env });
  const completedBody = await completed.json();
  check('follow-up completion adds timeline event', completedBody.record.activity.some(event => event.type === 'follow_up_completed'));
  const cleared = await core.handleConsultationFollowUp(producerRequest('https://coveragefit.com/api/consultations/follow-up', 'PATCH', secret, { consultationId: report.consultationRecord.id, state: 'none' }), { store, env });
  const clearedBody = await cleared.json();
  check('follow-up clearing adds timeline event', clearedBody.record.activity.some(event => event.type === 'follow_up_cleared'));

  const documentOpened = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, { consultationId: report.consultationRecord.id, type: 'consultation_document_opened' }), { store, env });
  const documentOpenedBody = await documentOpened.json();
  check('consultation document access is recorded', documentOpenedBody.record.activity.some(event => event.type === 'consultation_document_opened'));
  const documentOpenedAgain = await core.handleConsultationActivity(producerRequest('https://coveragefit.com/api/consultations/activity', 'POST', secret, { consultationId: report.consultationRecord.id, type: 'consultation_document_opened' }), { store, env });
  const documentOpenedAgainBody = await documentOpenedAgain.json();
  check('rapid duplicate document activity is deduplicated', documentOpenedAgainBody.record.activity.filter(event => event.type === 'consultation_document_opened').length === 1);

  const duplicate = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: report })
  }), { store });
  const duplicateBody = await duplicate.json();
  check('duplicate assessment submission preserves notes', duplicateBody.record.notes.length === 1);
  check('duplicate assessment submission preserves activity history', duplicateBody.record.activity.some(event => event.type === 'acknowledged') && duplicateBody.record.activity.some(event => event.type === 'producer_note'));

  const inbox = await core.handleConsultationInbox(producerRequest('https://coveragefit.com/api/consultations/inbox', 'GET', secret), { store, env });
  const inboxBody = await inbox.json();
  check('inbox returns notes and activity', inboxBody.records[0].notes.length === 1 && inboxBody.records[0].activity.length >= 7);

  const legacy = core.normalizeStoredRecord({
    id: 'consultation-legacy-activity-789', product: 'home', status: 'acknowledged', createdAt: '2026-08-01T09:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    customer: {}, assessment: {}, integration: {}, delivery: { deliveredAt: '2026-08-01T09:00:00.000Z', openedAt: '2026-08-01T09:30:00.000Z', acknowledgedAt: '2026-08-01T10:00:00.000Z' },
    followUp: { state: 'scheduled', dueDate: '2026-08-04', note: 'Legacy follow-up', updatedAt: '2026-08-01T10:10:00.000Z' }, report: sampleReport('consultation-legacy-activity-789')
  });
  check('legacy lifecycle records receive synthesized activity', ['delivered','opened','acknowledged','follow_up_scheduled'].every(type => legacy.activity.some(event => event.type === type)));

  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const browserRoot = { localStorage, sessionStorage, dispatchEvent() {}, CustomEvent: function CustomEvent(type, options) { this.type = type; this.detail = options?.detail; } };
  const context = { window: browserRoot, globalThis: browserRoot, console, Date, JSON, Promise, URL, URLSearchParams, AbortController, Request, Response, Headers, setTimeout, clearTimeout };
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
    if (absolute.pathname.endsWith('/activity')) return core.handleConsultationActivity(request, { store, env });
    return core.handleConsultationInbox(request, { store, env });
  };
  context.fetch = browserRoot.fetch;
  vm.runInContext(remoteSource, context, { filename: 'remote-consultations.js' });
  const records = browserRoot.CoverageFitConsultationRecords;
  const remote = browserRoot.CoverageFitRemoteConsultations;
  check('browser clients remain compatible', ['1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && ['1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION));
  check('browser exposes activity endpoint and methods', remote.ACTIVITY_ENDPOINT === '/api/consultations/activity' && typeof remote.addNote === 'function' && typeof remote.logActivity === 'function');
  check('producer access key remains session-only', remote.setToken(secret, { storage: sessionStorage }) && !localStorage.values[remote.TOKEN_KEY]);
  const sync = await remote.sync({ fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  const synced = records.get(report.consultationRecord.id, { storage: localStorage });
  check('browser sync imports server notes and activity', sync.ok && synced.remote.notes.length === 1 && synced.remote.activity.some(event => event.type === 'producer_note'));
  const browserNote = await remote.addNote(report.consultationRecord.id, 'Second note saved from the browser client.', { fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  const afterBrowserNote = records.get(report.consultationRecord.id, { storage: localStorage });
  check('browser note mutation updates local record', browserNote.notes.length === 2 && afterBrowserNote.remote.notes.length === 2);
  await remote.logActivity(report.consultationRecord.id, 'customer_report_opened', { fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  check('browser activity mutation updates local timeline', records.get(report.consultationRecord.id, { storage: localStorage }).remote.activity.some(event => event.type === 'customer_report_opened'));

  console.log(`CONS-1.6 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
