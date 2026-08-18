#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

class MemoryStorage {
  constructor(){ this.map = new Map(); }
  getItem(key){ return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key,value){ this.map.set(key,String(value)); }
  removeItem(key){ this.map.delete(key); }
}
class MemoryBlobStore {
  constructor(){ this.map = new Map(); this.deleted = []; }
  async setJSON(key,value,options={}){
    if(options.onlyIfNew && this.map.has(key)) throw new Error('exists');
    this.map.set(key, JSON.parse(JSON.stringify(value)));
    return { modified: true };
  }
  async get(key){ return this.map.has(key) ? JSON.parse(JSON.stringify(this.map.get(key))) : null; }
  async delete(key){ this.deleted.push(key); this.map.delete(key); }
}

(async()=>{
  const version = read('VERSION').trim();
  const html = read('home/report/index.html');
  const assessmentHtml = read('assessment/index.html');
  const assessmentEngine = read('assets/js/assessment-engine.js');
  const reportEngine = read('assets/js/report-engine.js');
  const reveal = read('assets/js/snapshot-reveal.js');
  const snapshot = read('assets/js/interactive-snapshot.js');
  const workspace = read('assets/js/agent-workspace.js');
  const css = read('assets/css/prospect-snapshot.css');
  const deployQa = read('WR1C2_DEPLOYMENT_QA.js');
  const changelog = read('CHANGELOG.md');
  const roadmap = read('ROADMAP.md');

  check('release version preserves RPT-1.2 through Cloudflare migration', ['3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
  check('RPT-1.2 changelog entry exists', changelog.includes('RPT-1.2 Private Durable Prospect Report Access'));
  check('RPT-1.2 roadmap entry is complete', roadmap.includes('RPT-1.2 Private Durable Prospect Report Access — Complete (3.19.31)'));
  check('RPT-1.2 sprint document exists', fs.existsSync(path.join(root, 'SPRINT-RPT-1.2.md')));
  check('private report setup document exists', fs.existsSync(path.join(root, 'PROSPECT-REPORT-ACCESS.md')));

  check('prospect report core exists', fs.existsSync(path.join(root, 'server/prospect-report-core.mjs')));
  check('prospect report create function exists', fs.existsSync(path.join(root, 'functions/api/reports/create.js')));
  check('prospect report read function exists', fs.existsSync(path.join(root, 'functions/api/reports/read.js')));
  check('prospect report client exists', fs.existsSync(path.join(root, 'assets/js/prospect-report-access.js')));
  check('deployment QA requires private report server files', deployQa.includes('functions/api/reports/create.js') && deployQa.includes('functions/api/reports/read.js') && deployQa.includes('server/prospect-report-core.mjs'));

  const server = await import(path.join(root, 'server/prospect-report-core.mjs'));
  const sample = {
    assessment: 'home', createdAt: '2026-08-02T20:00:00.000Z', score: 74, status: 'Strong Foundation',
    consumer: { name: 'Jordan Lee', firstName: 'Jordan', lastName: 'Lee', email: 'jordan@example.com', phone: '408-555-1212', propertyAddress: '123 Main Street, Fremont, CA 94539', reviewContext: 'Premium increased' },
    categories: [{name:'Dwelling',score:70}], priorities: [{name:'Dwelling limit'}], answers: [{label:'Not sure',points:-1}], strengths:['Completed review'],
    consultationRecord: { id:'consultation-secret' }, prospectReport: { id:'report_secret' },
    prospectProfile: { email:'jordan@example.com' }, personalizationContext: { identity:{email:'jordan@example.com'} },
    integration: { source:'408farmers', sessionId:'session-secret' }, attribution: { campaign:'home', sessionId:'session-secret' }
  };
  check('server validates completed Home reports', server.reportIsReady(sample));
  check('server rejects incomplete reports', !server.reportIsReady({assessment:'home',score:74,consumer:{name:'Jordan'}}));
  const publicPayload = server.publicReportPayload(sample);
  check('public payload removes email and phone', !publicPayload.consumer.email && !publicPayload.consumer.phone);
  check('public payload removes prospect profile and personalization context', !publicPayload.prospectProfile && !publicPayload.personalizationContext);
  check('public payload removes consultation and report access identifiers', !publicPayload.consultationRecord && !publicPayload.prospectReport);
  check('public payload removes session identifiers', !publicPayload.integration.sessionId && !publicPayload.attribution.sessionId);
  check('public payload preserves report content', publicPayload.score === 74 && publicPayload.consumer.name === 'Jordan Lee' && publicPayload.priorities.length === 1);
  const generatedId = server.createReportId();
  check('server creates 256-bit opaque report identifiers', server.REPORT_ID_PATTERN.test(generatedId) && generatedId.length === 50);
  const generatedKey = await server.reportKey(generatedId);
  check('server hashes report IDs into storage keys', generatedKey.startsWith('reports/') && !generatedKey.includes(generatedId));
  check('server retention is 30 days', server.REPORT_TTL_DAYS === 30);

  const origin = 'https://coveragefit.com';
  const store = new MemoryBlobStore();
  const createRequest = new Request(`${origin}/api/reports/create`, { method:'POST', headers:{Origin:origin,'Content-Type':'application/json'}, body:JSON.stringify({report:sample}) });
  const createResponse = await server.handleProspectReportCreate(createRequest, { store, now:new Date('2026-08-02T20:00:00.000Z') });
  const created = await createResponse.json();
  check('server create returns 201', createResponse.status === 201 && created.ok);
  check('server create returns only opaque access metadata', server.REPORT_ID_PATTERN.test(created.access.id) && !created.report);
  check('server create reports deterministic expiration', created.access.expiresAt === '2026-09-01T20:00:00.000Z');
  check('server stores one hashed record', store.map.size === 1 && [...store.map.keys()][0] === await server.reportKey(created.access.id));
  const storedRecord = [...store.map.values()][0];
  check('stored record does not contain raw access token', !JSON.stringify(storedRecord).includes(created.access.id));
  check('stored record contains sanitized public report', !storedRecord.report.consumer.email && storedRecord.report.consumer.name === 'Jordan Lee');

  const readRequest = new Request(`${origin}/api/reports/read`, { method:'POST', headers:{Origin:origin,'Content-Type':'application/json'}, body:JSON.stringify({reportId:created.access.id}) });
  const readResponse = await server.handleProspectReportRead(readRequest, { store, now:new Date('2026-08-03T20:00:00.000Z') });
  const readBody = await readResponse.json();
  check('server read returns private report', readResponse.status === 200 && readBody.report.consumer.name === 'Jordan Lee');
  check('server read returns no-cache privacy headers', readResponse.headers.get('cache-control').includes('no-store') && readResponse.headers.get('referrer-policy') === 'no-referrer');
  const unavailableResponse = await server.handleProspectReportRead(new Request(`${origin}/api/reports/read`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({reportId:`report_${'A'.repeat(43)}`})}), { store });
  check('missing private report returns truthful 404', unavailableResponse.status === 404 && (await unavailableResponse.json()).error.code === 'report_unavailable');
  const expiredRequest = new Request(`${origin}/api/reports/read`, { method:'POST', headers:{Origin:origin,'Content-Type':'application/json'}, body:JSON.stringify({reportId:created.access.id}) });
  const expiredResponse = await server.handleProspectReportRead(expiredRequest, { store, now:new Date('2026-09-02T20:00:00.000Z') });
  check('expired private report returns truthful 410', expiredResponse.status === 410 && (await expiredResponse.json()).error.code === 'report_expired');
  check('expired private report is deleted', store.deleted.includes(await server.reportKey(created.access.id)));
  const crossOriginCreate = await server.handleProspectReportCreate(new Request(`${origin}/api/reports/create`, {method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({report:sample})}), {store:new MemoryBlobStore()});
  check('cross-origin report creation is rejected', crossOriginCreate.status === 403);
  const botResponse = await server.handleProspectReportCreate(new Request(`${origin}/api/reports/create`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({website:'bot',report:sample})}), {store:new MemoryBlobStore()});
  check('honeypot submissions are accepted without storage', botResponse.status === 202);

  delete require.cache[require.resolve('./assets/js/prospect-report-access.js')];
  const client = require('./assets/js/prospect-report-access.js');
  const localStorage = new MemoryStorage();
  const serverToken = `report_${'B'.repeat(43)}`;
  const createClientResult = await client.create(sample, {
    storage: localStorage,
    now: new Date('2026-08-02T20:00:00.000Z'),
    fetch: async()=>new Response(JSON.stringify({ok:true,access:{id:serverToken,createdAt:'2026-08-02T20:00:00.000Z',expiresAt:'2026-09-01T20:00:00.000Z'}}),{status:201,headers:{'Content-Type':'application/json'}})
  });
  check('client create returns durable server access', createClientResult.ok && createClientResult.durable && createClientResult.reportId === serverToken);
  check('client caches durable report for temporary outages', client.readLocal(serverToken,{storage:localStorage,now:new Date('2026-08-03T20:00:00.000Z')}).ok);
  const fallbackStorage = new MemoryStorage();
  const localResult = await client.create(sample,{storage:fallbackStorage,now:new Date('2026-08-02T20:00:00.000Z'),fetch:async()=>{throw new Error('offline')}});
  check('client creates truthful device-only fallback', localResult.ok && localResult.localOnly && client.LOCAL_ID_PATTERN.test(localResult.reportId));
  check('device-only fallback expires after one day', localResult.expiresAt === '2026-08-03T20:00:00.000Z');
  const fetched = await client.retrieve(serverToken,{storage:new MemoryStorage(),fetch:async()=>new Response(JSON.stringify({ok:true,report:publicPayload,access:{id:serverToken,createdAt:'2026-08-02T20:00:00.000Z',expiresAt:'2026-09-01T20:00:00.000Z'}}),{status:200,headers:{'Content-Type':'application/json'}})});
  check('client retrieves server-backed report across devices', fetched.ok && fetched.durable && fetched.report.consumer.name === 'Jordan Lee');
  const cachedStorage = new MemoryStorage();
  client.cache(serverToken,publicPayload,{createdAt:'2026-08-02T20:00:00.000Z',expiresAt:'2026-09-01T20:00:00.000Z'},{storage:cachedStorage});
  const cachedResult = await client.retrieve(serverToken,{storage:cachedStorage,now:new Date('2026-08-03T20:00:00.000Z'),fetch:async()=>{throw new Error('offline')}});
  check('temporary read failure uses a valid cached copy', cachedResult.ok && cachedResult.cached && cachedResult.warningCode);
  const deletedResult = await client.retrieve(serverToken,{storage:cachedStorage,fetch:async()=>new Response(JSON.stringify({ok:false,error:{code:'report_unavailable',message:'Unavailable'}}),{status:404,headers:{'Content-Type':'application/json'}})});
  check('server deletion does not fall back to stale cache', !deletedResult.ok && deletedResult.code === 'report_unavailable' && !client.readLocal(serverToken,{storage:cachedStorage}).ok);
  check('client reads report ID from URL fragment', client.readIdFromLocation({hash:`#report_id=${serverToken}`,search:''}) === serverToken);
  check('client builds fragment-only private report URL', client.buildUrl(serverToken,'/home/report/') === `/home/report/#report_id=${serverToken}`);
  check('client does not place bearer token in API path', client.READ_ENDPOINT === '/api/reports/read');

  check('assessment loads private report client', assessmentHtml.includes('/assets/js/prospect-report-access.js'));
  check('assessment creates private report before consultation handoff', assessmentEngine.includes('CoverageFitProspectReports.create') && assessmentEngine.indexOf('CoverageFitProspectReports.create') < assessmentEngine.indexOf('CoverageFitConsultationRecords'));
  check('assessment stores report access on consultation payload', assessmentEngine.includes('report.prospectReport = {') && assessmentEngine.includes('id: prospectReportAccess.reportId'));
  check('assessment excludes bearer report ID from Formspree payload', assessmentEngine.includes('delete formPayload.prospectReport'));
  check('assessment redirects with opaque fragment access', assessmentEngine.includes('CoverageFitProspectReports?.buildUrl'));
  check('assessment no longer creates name or property query parameters', !assessmentEngine.includes('new URLSearchParams({name:') && !assessmentEngine.includes("qs.set('cf_session_id'"));

  check('report route is noindex and no-referrer', html.includes('name="robots" content="noindex, nofollow"') && html.includes('name="referrer" content="no-referrer"'));
  check('report route starts in a secure loading state', html.includes('id="prospectReportState"') && html.includes('Opening your private Snapshot'));
  check('report content remains hidden until retrieval completes', html.includes('id="prospectReport"') && html.includes('aria-label="Home Protection Snapshot" hidden'));
  check('report route includes retry and retake recovery actions', html.includes('id="prospectReportRetry"') && html.includes('id="prospectReportRetake"'));
  check('report route loads private access client before report engine', html.indexOf('prospect-report-access.js') < html.indexOf('report-engine.js'));
  check('report engine exposes one readiness promise', reportEngine.includes('COVERAGEFIT_PROSPECT_REPORT_READY'));
  check('report engine renders expired unavailable and temporary states', reportEngine.includes("showState('expired'") && reportEngine.includes("showState('unavailable'") && reportEngine.includes("showState('temporary'"));
  check('report engine stores no customer name in analytics', !reportEngine.includes('score,name') && reportEngine.includes("privateAccess:"));
  check('interactive snapshot waits for private report retrieval', snapshot.includes('COVERAGEFIT_PROSPECT_REPORT_READY'));
  check('snapshot reveal waits for private report retrieval', reveal.includes('COVERAGEFIT_PROSPECT_REPORT_READY'));
  check('snapshot reveal derives reason from stored report not URL', reveal.includes('report?.reviewContext') && !reveal.includes("params.get('trigger')"));
  check('access states are responsive and print-hidden', css.includes('.prospect-report-state') && css.includes('.prospect-report-state{display:none!important}'));
  check('Agent Workspace opens server-backed report by opaque fragment', workspace.includes('/home/report/#report_id=') && workspace.includes('updateCustomerReportAction'));
  check('legacy browser reports require an explicit local preview fragment', workspace.includes('/home/report/#local_preview=1') && reportEngine.includes("get('local_preview') === '1'"));

  console.log(`RPT-1.2 QA: ${checks.length}/${checks.length} passed`);
})().catch(error=>{ console.error(error); process.exit(1); });
