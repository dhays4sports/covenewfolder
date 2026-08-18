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
function sampleReport(id = 'consultation-disposition-123', name = 'Disposition Homeowner') {
  return {
    version: 'v2.4', assessment: 'home', createdAt: '2026-08-02T09:00:00.000Z', score: 79,
    status: 'Strong Foundation', strongest: 'Liability reviewed', topPriority: 'Confirm dwelling estimate',
    consumer: { name, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), email: `${id}@example.com`, phone: '4085550199', propertyAddress: '123 Outcome Way, Fremont, CA 94539', reviewContext: 'Premium increased' },
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
  const workspaceDataSource = read('assets/js/workspace-data.js');
  const dispositionFunction = read('functions/api/consultations/disposition.js');
  const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');
  const deploymentSource = read('WR1C2_DEPLOYMENT_QA.js');

  check('release version remains compatible after CONS-1.7', ['3.19.25','3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('changelog documents CONS-1.7', changelog.includes('CONS-1.7 Consultation Outcome and Disposition'));
  check('roadmap marks CONS-1.7 complete', roadmap.includes('CONS-1.7 Consultation Outcome and Disposition — Complete (3.19.25)'));
  check('CONS-1.7 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-CONS-1.7.md')));
  check('disposition function included in deployment verification', deploymentSource.includes('functions/api/consultations/disposition.js'));
  check('consultation-disposition function maps to Cloudflare Pages', dispositionFunction.includes('consultationDisposition') && dispositionFunction.includes('onRequest'));
  check('consultation-disposition handler preserves D1 rate limiting', cloudflareHandlers.includes("route: 'consultation-disposition'") && cloudflareHandlers.includes('limit: 120'));

  ['consultationStageFilter','consultationDispositionForm','consultationDispositionBadge','consultationStage','consultationOutcome','consultationDispositionNote','saveConsultationDisposition','consultationDispositionMessage'].forEach(id => check(`Workspace exposes ${id}`, workspaceHtml.includes(`id="${id}"`)));
  check('Workspace provides all bounded stage choices', ['review_received','contact_attempted','consultation_scheduled','consultation_completed','proposal_prepared','decision_pending','closed'].every(value => workspaceHtml.includes(`value="${value}"`)));
  check('Workspace provides all final outcome choices', ['policy_bound','current_carrier_retained','declined_price','declined_coverage','unable_to_reach','not_eligible','deferred'].every(value => workspaceHtml.includes(`value="${value}"`)));
  check('disposition note is bounded', workspaceHtml.includes('id="consultationDispositionNote"') && workspaceHtml.includes('maxlength="240"'));
  check('Workspace styles stage form and queue badge responsively', workspaceCss.includes('.consultation-disposition__fields') && workspaceCss.includes('.consultation-queue__stage') && workspaceCss.includes('@media (max-width: 620px)'));
  check('Workspace renders and saves disposition through active workflow', workspaceSource.includes('renderConsultationDisposition') && workspaceSource.includes('saveActiveDisposition') && workspaceSource.includes('remoteInbox.updateDisposition'));
  check('Workspace supports local disposition persistence', workspaceSource.includes('updateConsultationDisposition') && workspaceDataSource.includes('consultation-disposition-updated'));
  check('queue search and filters include disposition', workspaceSource.includes('consultationStageFilter') && workspaceSource.includes('consultationStageLabel(record)') && workspaceSource.includes('consultationOutcomeLabel(record)'));
  check('activity timeline recognizes disposition events', ['stage_changed','outcome_recorded','consultation_reopened','disposition_updated'].every(type => workspaceSource.includes(type)));

  const core = await import(`${pathToFileURL(path.join(root, 'server/consultation-inbox-core.mjs')).href}?qa=${Date.now()}`);
  check('server record version advanced', ['1.4.0','1.5.0','1.6.0','1.7.0','1.8.0'].includes(core.RECORD_VERSION));
  check('server exports supported stages', core.CONSULTATION_STAGES.length === 7 && core.CONSULTATION_STAGES.includes('closed'));
  check('server exports supported outcomes', core.CONSULTATION_OUTCOMES.length === 8 && core.CONSULTATION_OUTCOMES.includes('policy_bound'));
  check('server activity types include disposition history', ['stage_changed','outcome_recorded','consultation_reopened','disposition_updated'].every(type => core.ACTIVITY_TYPES.includes(type)));
  check('server exports disposition handler', typeof core.handleConsultationDisposition === 'function');

  const store = new MemoryBlobStore();
  const secret = 'producer-access-key-1234567890';
  const env = { COVERAGEFIT_PRODUCER_ACCESS_TOKEN: secret };
  const report = sampleReport();
  const submit = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: report })
  }), { store });
  const submitted = await submit.json();
  check('new consultation starts at review received', submit.status === 201 && submitted.record.disposition.stage === 'review_received' && submitted.record.disposition.outcome === 'none');

  const rejectedOrigin = await core.handleConsultationDisposition(new Request('https://coveragefit.com/api/consultations/disposition', {
    method: 'PATCH', headers: { Origin: 'https://attacker.example', Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ consultationId: report.consultationRecord.id, stage: 'contact_attempted', outcome: 'none' })
  }), { store, env });
  check('disposition updates reject cross-origin requests', rejectedOrigin.status === 403);
  const unauthorized = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', 'wrong-access-key-123456789', { consultationId: report.consultationRecord.id, stage: 'contact_attempted', outcome: 'none' }), { store, env });
  check('disposition updates require producer authorization', unauthorized.status === 401);
  const invalidStage = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'quoted', outcome: 'none' }), { store, env });
  check('unsupported stages are rejected', invalidStage.status === 422);
  const missingOutcome = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'closed', outcome: 'none' }), { store, env });
  check('closing requires final outcome', missingOutcome.status === 422);
  const prematureOutcome = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'decision_pending', outcome: 'policy_bound' }), { store, env });
  check('final outcome requires closed stage', prematureOutcome.status === 422);
  const longNote = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'contact_attempted', outcome: 'none', note: 'x'.repeat(241) }), { store, env });
  check('disposition note length is validated', longNote.status === 422);

  const contacted = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'contact_attempted', outcome: 'none', note: 'Left voicemail and sent text.' }), { store, env });
  const contactedBody = await contacted.json();
  check('stage change persists with note', contacted.status === 200 && contactedBody.record.disposition.stage === 'contact_attempted' && contactedBody.record.disposition.note.includes('voicemail'));
  check('stage change creates activity', contactedBody.record.activity.some(event => event.type === 'stage_changed' && event.detail.includes('Contact attempted')));

  const pending = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'decision_pending', outcome: 'none', note: 'Client reviewing proposal with spouse.' }), { store, env });
  const pendingBody = await pending.json();
  check('consultation advances through active stages', pendingBody.record.disposition.stage === 'decision_pending');

  const closed = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'closed', outcome: 'policy_bound', note: 'Home and auto bundle accepted.' }), { store, env });
  const closedBody = await closed.json();
  check('closed consultation stores final outcome and closed timestamp', closed.status === 200 && closedBody.record.disposition.stage === 'closed' && closedBody.record.disposition.outcome === 'policy_bound' && Boolean(closedBody.record.disposition.closedAt));
  check('closing creates stage and outcome activity', closedBody.record.activity.some(event => event.type === 'stage_changed') && closedBody.record.activity.some(event => event.type === 'outcome_recorded' && event.detail.includes('Policy bound')));
  check('Blob metadata includes stage and outcome', store.metadata.get(`records/${report.consultationRecord.id}`).consultationStage === 'closed' && store.metadata.get(`records/${report.consultationRecord.id}`).consultationOutcome === 'policy_bound');

  const closedAgain = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'closed', outcome: 'policy_bound', note: 'Home and auto bundle accepted.' }), { store, env });
  const closedAgainBody = await closedAgain.json();
  check('saving identical disposition does not duplicate outcome activity', closedAgainBody.record.activity.filter(event => event.type === 'outcome_recorded').length === 1);

  const reopened = await core.handleConsultationDisposition(producerRequest('https://coveragefit.com/api/consultations/disposition', 'PATCH', secret, { consultationId: report.consultationRecord.id, stage: 'consultation_scheduled', outcome: 'none', note: 'Client requested one more review call.' }), { store, env });
  const reopenedBody = await reopened.json();
  check('reopening clears outcome and closed timestamp', reopenedBody.record.disposition.stage === 'consultation_scheduled' && reopenedBody.record.disposition.outcome === 'none' && reopenedBody.record.disposition.closedAt === '');
  check('reopening creates activity without deleting prior outcome', reopenedBody.record.activity.some(event => event.type === 'consultation_reopened') && reopenedBody.record.activity.some(event => event.type === 'outcome_recorded'));

  const duplicate = await core.handleConsultationSubmission(new Request('https://coveragefit.com/api/consultations/submit', {
    method: 'POST', headers: { Origin: 'https://coveragefit.com', 'Content-Type': 'application/json' }, body: JSON.stringify({ record: report })
  }), { store });
  const duplicateBody = await duplicate.json();
  check('duplicate assessment submission preserves disposition', duplicateBody.record.disposition.stage === 'consultation_scheduled' && duplicateBody.record.activity.some(event => event.type === 'consultation_reopened'));

  const inbox = await core.handleConsultationInbox(producerRequest('https://coveragefit.com/api/consultations/inbox', 'GET', secret), { store, env });
  const inboxBody = await inbox.json();
  check('inbox returns disposition and active/closed counts', inboxBody.records[0].disposition.stage === 'consultation_scheduled' && inboxBody.counts.active === 1 && inboxBody.counts.closed === 0);

  const legacy = core.normalizeStoredRecord({
    id: 'consultation-legacy-disposition-789', product: 'home', status: 'acknowledged', createdAt: '2026-08-01T09:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    customer: {}, assessment: {}, integration: {}, delivery: { deliveredAt: '2026-08-01T09:00:00.000Z' }, report: sampleReport('consultation-legacy-disposition-789')
  });
  check('legacy records default safely to review received', legacy.disposition.stage === 'review_received' && legacy.disposition.outcome === 'none');

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
    if (absolute.pathname.endsWith('/disposition')) return core.handleConsultationDisposition(request, { store, env });
    return core.handleConsultationInbox(request, { store, env });
  };
  context.fetch = browserRoot.fetch;
  vm.runInContext(remoteSource, context, { filename: 'remote-consultations.js' });
  const records = browserRoot.CoverageFitConsultationRecords;
  const remote = browserRoot.CoverageFitRemoteConsultations;
  check('browser clients remain compatible after recommendation-plan extension', ['1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(records.VERSION) && ['1.4.0','1.5.0','1.6.0','1.7.0','1.7.1'].includes(remote.VERSION));
  check('browser exposes disposition endpoint and method', remote.DISPOSITION_ENDPOINT === '/api/consultations/disposition' && typeof remote.updateDisposition === 'function');
  check('producer access key remains session-only', remote.setToken(secret, { storage: sessionStorage }) && !localStorage.values[remote.TOKEN_KEY]);
  const sync = await remote.sync({ fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  check('browser sync imports server disposition', sync.ok && records.get(report.consultationRecord.id, { storage: localStorage }).remote.disposition.stage === 'consultation_scheduled');
  const browserClose = await remote.updateDisposition(report.consultationRecord.id, { stage: 'closed', outcome: 'current_carrier_retained', note: 'Client chose to stay with USAA.' }, { fetch: browserRoot.fetch, storage: sessionStorage, localStorage, records });
  const afterBrowserClose = records.get(report.consultationRecord.id, { storage: localStorage });
  check('browser disposition mutation updates local record', browserClose.disposition.outcome === 'current_carrier_retained' && afterBrowserClose.remote.disposition.stage === 'closed');

  const localReport = sampleReport('consultation-local-disposition-456', 'Local Homeowner');
  const localRecord = records.upsert(localReport, { storage: localStorage, dispatch: false, now: () => new Date('2026-08-02T11:00:00.000Z') });
  const localUpdated = records.updateDisposition(localRecord.id, { stage: 'proposal_prepared', outcome: 'none', note: 'Proposal ready for review.' }, { storage: localStorage, dispatch: false, now: () => new Date('2026-08-02T12:00:00.000Z') });
  check('browser-local records persist actionable stage', localUpdated.disposition.stage === 'proposal_prepared' && records.get(localRecord.id, { storage: localStorage }).disposition.note.includes('Proposal ready'));
  const localClosed = records.updateDisposition(localRecord.id, { stage: 'closed', outcome: 'deferred', note: 'Revisit at renewal.' }, { storage: localStorage, dispatch: false, now: () => new Date('2026-08-02T13:00:00.000Z') });
  check('browser-local records persist final outcome', localClosed.disposition.stage === 'closed' && localClosed.disposition.outcome === 'deferred');

  console.log(`CONS-1.7 QA: ${checks.length}/${checks.length} passed`);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
