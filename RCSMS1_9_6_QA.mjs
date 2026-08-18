import fs from 'node:fs';
import path from 'node:path';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import { handleRingCentralWebhook, LIVE_CONVERSATION_PREFIX, RC_SMS_CONNECTION_BUILD } from './server/ringcentral-sms-connection-core.mjs';
import { sendSmsThroughGateway, smsLiveConversationId, SMS_OUTBOUND_GATEWAY_BUILD } from './server/sms-outbound-gateway.mjs';
import { handleSmsProducerHandoff, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';
import { handleSmsOperations, queueSmsRetry, updateWebhookHealth, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { normalizeSmsOrchestration, SMS_ORCHESTRATOR_BUILD } from './server/sms-orchestrator-core.mjs';
import { normalizeSmsConsent, SMS_CONSENT_BUILD } from './server/sms-consent-core.mjs';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION, normalizeSmsIntent } from './server/sms-conversation-core.mjs';
import { SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { SMS_PRODUCER_ALERT_BUILD } from './server/sms-producer-alert.mjs';
import { SMS_CONSENT_API_BUILD } from './server/sms-consent-api-core.mjs';
import { buildSharedNumberCertificationSnapshot, SMS_SHARED_NUMBER_CERTIFICATION_BUILD, SMS_SHARED_NUMBER_CERTIFICATION_SCHEMA } from './server/sms-operations-certification-core.mjs';

const checks=[];
const check=(name,condition)=>{if(!condition)throw new Error(`FAIL: ${name}`);checks.push(name);};
class Store{
  constructor(){this.values=new Map();}
  async get(k){return this.values.has(String(k))?structuredClone(this.values.get(String(k))):null;}
  async setJSON(k,v,o={}){k=String(k);if(o.onlyIfNew&&this.values.has(k))throw new Error('D1 UNIQUE constraint');this.values.set(k,structuredClone(v));}
  async delete(k){this.values.delete(String(k));}
  async list({prefix='',limit=500}={}){return{blobs:[...this.values.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key}))};}
}
const version=fs.readFileSync('VERSION','utf8').trim();
check('release advances to CoverageFit 3.20.71',version==='3.20.71'&&JSON.parse(fs.readFileSync('package.json','utf8')).version===version);
check('shared-number certification contract is pre-port only',SMS_SHARED_NUMBER_CERTIFICATION_BUILD==='RC-SMS-1.9.6'&&SMS_SHARED_NUMBER_CERTIFICATION_SCHEMA==='1.0');
check('all RC-SMS runtime surfaces synchronize at 1.9.6',SMS_ENGINE_VERSION==='1.7.2'&&[SMS_ENGINE_BUILD,SMS_HANDOFF_BUILD,RC_SMS_CONNECTION_BUILD,SMS_PRODUCER_HANDOFF_BUILD,SMS_OPERATIONS_BUILD,SMS_PRODUCER_ALERT_BUILD,SMS_ORCHESTRATOR_BUILD,SMS_OUTBOUND_GATEWAY_BUILD,SMS_CONSENT_BUILD,SMS_CONSENT_API_BUILD].every(v=>v==='RC-SMS-1.9.6'));
check('natural home coverage review phrase resolves explicitly',normalizeSmsIntent('I want a home coverage review')==='home_review');

const env={
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'producer-access-196-'.padEnd(32,'x'),
  RINGCENTRAL_SERVER_URL:'https://platform.ringcentral.com',RINGCENTRAL_CLIENT_ID:'id-196',RINGCENTRAL_CLIENT_SECRET:'secret-196-private',RINGCENTRAL_JWT_TOKEN:'jwt-196-private',
  RINGCENTRAL_FROM_NUMBER:'+14085550123',RINGCENTRAL_WEBHOOK_URL:'https://coveragefit.com/api/sms/ringcentral/webhook',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'validation-196-private-token',RINGCENTRAL_CONVERSATION_HASH_SECRET:'hash-196-private-secret-123456789',RCSMS_PRODUCER_ALERTS_ENABLED:'false'
};
let clock=new Date('2026-08-17T14:00:00.000Z');
const now=()=>new Date(clock);const advance=s=>{clock=new Date(clock.getTime()+s*1000)};
let providerCounter=0;const sends=[];
const fetchImpl=async(url,init={})=>{
  if(url.endsWith('/restapi/oauth/token'))return Response.json({access_token:'token-196',expires_in:3600});
  if(url.endsWith('/sms')){providerCounter++;const payload=JSON.parse(init.body);const id=`rc196-${providerCounter}`;sends.push({id,payload,at:now().toISOString()});return Response.json({id});}
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};
const store=new Store();
const authHeaders={Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`,Origin:'https://coveragefit.com','Content-Type':'application/json'};
const webhookPayload=({id,direction='Inbound',subject,contact,at=now().toISOString()})=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:at,body:direction==='Inbound'?{id,to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}],from:{phoneNumber:contact},type:'SMS',direction,creationTime:at,subject}:{id,to:[{phoneNumber:contact,target:true}],from:{phoneNumber:env.RINGCENTRAL_FROM_NUMBER},type:'SMS',direction,creationTime:at,subject}});
const webhookRequest=p=>new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(p)});
const producerRequest=(conversationId,action,extra={})=>new Request('https://coveragefit.com/api/sms/producer/',{method:'POST',headers:authHeaders,body:JSON.stringify({conversationId,action,...extra})});
const convId=contact=>smsLiveConversationId(contact,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const getConversation=async contact=>store.get(`${LIVE_CONVERSATION_PREFIX}${await convId(contact)}`);
async function seed(contact,{state='buyer_closing_date_requested',intent='buyer',answers={propertyAddress:'Example property'},owner,workflowStatus,completedAt=''}={}){
  const id=await convId(contact);const at=now().toISOString();let c={id,schemaVersion:'1.6',channel:'ringcentral_sms',contactPhone:contact,businessPhone:env.RINGCENTRAL_FROM_NUMBER,state,intent,answers,transcript:[],inboundCount:2,outboundCount:2,createdAt:at,updatedAt:at,completedAt};
  c.orchestration=normalizeSmsOrchestration(c,{occurredAt:at});c.smsConsent=normalizeSmsConsent(c,{occurredAt:at});
  if(owner){c.orchestration={...c.orchestration,ownership:{...c.orchestration.ownership,owner,previousOwner:owner==='producer'?'coveragefit':'none',reason:'qa_seed',updatedAt:at},automationMode:owner==='coveragefit'?'automated':owner==='producer'?'human_only':'assist_only',workflow:{...c.orchestration.workflow,status:workflowStatus||c.orchestration.workflow.status}};}
  await store.setJSON(`${LIVE_CONVERSATION_PREFIX}${id}`,c);return id;
}
async function inbound(contact,subject,id){advance(1);const res=await handleRingCentralWebhook(webhookRequest(webhookPayload({id,subject,contact})),{env,store,fetchImpl,now});return {res,body:await res.json()};}
async function outboundEcho(contact,subject,id){advance(1);const res=await handleRingCentralWebhook(webhookRequest(webhookPayload({id,direction:'Outbound',subject,contact})),{env,store,fetchImpl,now});return {res,body:await res.json()};}
clearRingCentralTokenCache();

// Fresh explicit buyer -> CoverageFit, then reply continues CoverageFit.
const freshBuyer='+14085551001';let x=await inbound(freshBuyer,'buying a home','fresh-buyer-1');let c=await getConversation(freshBuyer);
check('fresh explicit homebuyer request launches CoverageFit',x.body.routedTo==='coveragefit'&&x.body.replied===true&&c.state==='buyer_address_requested'&&c.orchestration.ownership.owner==='coveragefit');
x=await inbound(freshBuyer,'123 Main St, San Jose CA','fresh-buyer-2');c=await getConversation(freshBuyer);
check('CoverageFit customer reply continues preserved workflow',x.body.replied===true&&c.state==='buyer_closing_date_requested'&&c.orchestration.ownership.owner==='coveragefit'&&c.answers.propertyAddress);

// Manual Dylan collision and producer reply continuity.
const manual='+14085551002';await seed(manual);const beforeManual=await getConversation(manual);x=await outboundEcho(manual,'Dylan here — I can help.','manual-out-1');c=await getConversation(manual);
check('manual Dylan text during intake pauses automation and preserves exact step',x.body.manualTakeover===true&&c.state==='human_takeover'&&c.orchestration.ownership.owner==='producer'&&c.orchestration.workflow.state===beforeManual.orchestration.workflow.state&&c.orchestration.automationMode==='human_only');
const sendsBeforeProducerReply=sends.length;x=await inbound(manual,'Friday around noon','manual-in-2');c=await getConversation(manual);
check('customer reply to Dylan remains producer routed with no bot',x.body.routedTo==='producer'&&x.body.replied===false&&sends.length===sendsBeforeProducerReply&&c.orchestration.workflow.state==='buyer_closing_date_requested');

// Registered appointment traffic and reply context.
const appointment='+14085551003';
const sentAppointment=await sendSmsThroughGateway({to:appointment,message:'Reminder: appointment tomorrow at 2 PM.',origin:'appointment',workflow:'appointment',replyRoute:'appointment',ownershipEffect:'producer',replyContext:'appointment',idempotencyKey:'196-appointment-1'},{env,store,fetchImpl,now});
x=await outboundEcho(appointment,'Reminder: appointment tomorrow at 2 PM.',sentAppointment.providerMessageId);c=await getConversation(appointment);
check('appointment reminder echo is registered and never false manual takeover',x.body.registeredOutbound===true&&!x.body.manualTakeover&&x.body.outboundOrigin==='appointment'&&c.orchestration.ownership.owner==='producer');
x=await inbound(appointment,'Can we make it 3 instead?','appointment-in-1');
check('appointment reply uses declared appointment context without bot reply',x.body.routedTo==='appointment'&&x.body.replied===false&&x.body.routeReason==='reply_context:appointment');

// CRM quote follow-up traffic.
const crm='+14085551004';
const sentCrm=await sendSmsThroughGateway({to:crm,message:'Checking in on the home and auto options.',origin:'crm',workflow:'quote_followup',replyRoute:'producer',ownershipEffect:'producer',replyContext:'quote_followup',idempotencyKey:'196-crm-1'},{env,store,fetchImpl,now});
x=await outboundEcho(crm,'Checking in on the home and auto options.',sentCrm.providerMessageId);
check('CRM quote follow-up echo stays registered and does not launch CoverageFit',x.body.registeredOutbound===true&&x.body.outboundOrigin==='crm'&&x.body.replyRoute==='producer');
const sendsBeforeCrmReply=sends.length;x=await inbound(crm,'What would it be with a higher deductible?','crm-in-1');
check('CRM customer reply routes producer/quote context with no CoverageFit send',x.body.routedTo==='producer'&&x.body.routeReason==='reply_context:quote_followup'&&x.body.replied===false&&sends.length===sendsBeforeCrmReply);

// Existing service context and fresh ambiguous greeting.
const service='+14085551005';await seed(service,{state:'human_takeover',intent:'',answers:{},owner:'producer',workflowStatus:'paused'});x=await inbound(service,'I need an ID card','service-in-1');
check('existing producer-owned service request does not receive CoverageFit menu',x.body.routedTo==='producer'&&x.body.replied===false);
const ambiguous='+14085551006';const sendsBeforeAmbiguous=sends.length;x=await inbound(ambiguous,'Hi Dylan','ambiguous-1');
check('fresh ambiguous Hi Dylan fails producer-safe',x.body.routedTo==='producer'&&x.body.replied===false&&sends.length===sendsBeforeAmbiguous);

// STOP/START global boundary.
const consent='+14085551007';await seed(consent);x=await inbound(consent,'STOP','consent-stop');c=await getConversation(consent);
check('STOP during workflow globally suppresses automation and preserves workflow state',x.body.routedTo==='suppressed'&&x.body.replied===false&&c.smsConsent.status==='opted_out'&&c.orchestration.automationMode==='suppressed'&&c.orchestration.workflow.state==='buyer_closing_date_requested');
const sendsBeforeStart=sends.length;x=await inbound(consent,'START','consent-start');c=await getConversation(consent);
check('START restores permission only without blind workflow restart',x.body.routedTo==='consent'&&x.body.replied===false&&c.smsConsent.status==='active'&&c.orchestration.ownership.owner==='producer'&&c.orchestration.automationMode==='human_only'&&c.orchestration.workflow.state==='buyer_closing_date_requested'&&sends.length===sendsBeforeStart);

// Unknown outbound safety.
const unknown='+14085551008';x=await outboundEcho(unknown,'External message','unknown-out-1');c=await getConversation(unknown);
check('unknown outbound becomes producer-safe external_unknown',x.body.manualTakeover===true&&x.body.outboundOrigin==='external_unknown'&&c.orchestration.ownership.owner==='producer'&&c.orchestration.automationMode==='human_only');

// Duplicate webhook dedupe.
const dedupe='+14085551009';advance(1);const dupePayload=webhookPayload({id:'dupe-in-1',subject:'buying a home',contact:dedupe});const beforeDupe=sends.length;
let r1=await handleRingCentralWebhook(webhookRequest(dupePayload),{env,store,fetchImpl,now});let b1=await r1.json();let r2=await handleRingCentralWebhook(webhookRequest(dupePayload),{env,store,fetchImpl,now});let b2=await r2.json();
check('duplicate inbound webhook creates one transition and one send',b1.deduped===false&&b2.deduped===true&&sends.length===beforeDupe+1);

// Retry preserves source / ownership provenance.
const retry='+14085551010';const retryId=await seed(retry,{state:'human_takeover',intent:'',answers:{},owner:'producer',workflowStatus:'paused'});await queueSmsRetry(store,{conversationId:retryId,to:retry,body:'Quote follow-up retry.',origin:'quote_followup',workflow:'quote_followup',replyRoute:'producer',ownershipEffect:'producer',replyContext:'quote_followup'},{now});
advance(1);let opsRes=await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/',{method:'POST',headers:authHeaders,body:JSON.stringify({action:'retry_pending'})}),{env,store,fetchImpl,now});let opsBody=await opsRes.json();c=await getConversation(retry);
check('RingCentral retry preserves source and producer ownership',opsBody.sent===1&&c.outboundContext.origin==='quote_followup'&&c.outboundContext.replyRoute==='producer'&&c.orchestration.ownership.owner==='producer');

// Completed customer explicit new review -> new episode, same relationship.
const reentry='+14085551011';const reentryId=await seed(reentry,{state:'completed',intent:'buyer',answers:{propertyAddress:'Old property'},completedAt:now().toISOString()});const oldRelationshipId=reentryId;x=await inbound(reentry,'I want a home coverage review','reentry-1');c=await getConversation(reentry);
check('completed customer explicit new review starts a fresh workflow episode',x.body.replied===true&&c.id===oldRelationshipId&&c.state==='home_review_address_requested'&&c.intent==='home_review'&&Object.keys(c.answers).length===0&&c.orchestration.workflow.type==='coveragefit_home_review'&&c.orchestration.workflowEpisodes.length===1);
check('completed prior workflow is archived rather than overwritten',c.orchestration.workflowEpisodes[0].type==='coveragefit_homebuyer'&&c.orchestration.workflowEpisodes[0].status==='completed');

// Producer release now resumes preserved CoverageFit workflow exactly.
const release='+14085551012';const releaseId=await seed(release);let pr=await handleSmsProducerHandoff(producerRequest(releaseId,'take_ownership'),{env,store,fetchImpl,now});let pb=await pr.json();check('producer can take ownership before release certification',pr.status===200&&pb.conversation.orchestration.ownership.owner==='producer'&&pb.conversation.orchestration.workflow.state==='buyer_closing_date_requested');
advance(1);pr=await handleSmsProducerHandoff(producerRequest(releaseId,'release_ownership'),{env,store,fetchImpl,now});pb=await pr.json();
check('producer release resumes exact preserved CoverageFit workflow',pr.status===200&&pb.conversation.state==='buyer_closing_date_requested'&&pb.conversation.orchestration.ownership.owner==='coveragefit'&&pb.conversation.orchestration.automationMode==='automated'&&pb.conversation.orchestration.workflow.state==='buyer_closing_date_requested');

// Consent still blocks a release that would reactivate automation.
const releaseStop='+14085551013';const releaseStopId=await seed(releaseStop);await handleSmsProducerHandoff(producerRequest(releaseStopId,'take_ownership'),{env,store,fetchImpl,now});await inbound(releaseStop,'STOP','release-stop');pr=await handleSmsProducerHandoff(producerRequest(releaseStopId,'release_ownership'),{env,store,fetchImpl,now});pb=await pr.json();
check('producer release cannot bypass STOP',pr.status===409&&pb.error?.code==='sms_channel_suppressed');

// Backward-compatible D1 data_json fixtures.
for(const file of ['legacy-pre-orchestrator.json','legacy-producer-takeover.json','legacy-opted-out.json']){
  const fixture=JSON.parse(fs.readFileSync(path.join('fixtures/rc-sms-1.9.6',file),'utf8'));const raw=fixture.data_json;const o=normalizeSmsOrchestration(raw,{occurredAt:raw.updatedAt});const consentState=normalizeSmsConsent({...raw,orchestration:o},{occurredAt:raw.updatedAt});const exp=fixture.expect;
  if(exp.owner)check(`${file} lazy orchestration owner compatibility`,o.ownership.owner===exp.owner);
  if(exp.automationMode)check(`${file} lazy automation-mode compatibility`,o.automationMode===exp.automationMode);
  if(exp.workflowType)check(`${file} lazy workflow-type compatibility`,o.workflow.type===exp.workflowType);
  if(exp.workflowState)check(`${file} preserves workflow state`,o.workflow.state===exp.workflowState);
  if(exp.channelStatus)check(`${file} preserves channel status`,o.channel.status===exp.channelStatus);
  check(`${file} lazy consent compatibility`,consentState.status===exp.consentStatus);
}

// Non-destructive Operations readiness snapshot and privacy boundary.
await updateWebhookHealth(store,{success:true},{now});
const snapshot=await buildSharedNumberCertificationSnapshot({env,store,now,operationsBuild:SMS_OPERATIONS_BUILD});
check('pre-port readiness snapshot is ready but carrier remains pending',snapshot.readyForPortCertification===true&&snapshot.status==='ready_for_rc_sms_1_10'&&snapshot.applicationCertification==='certified'&&snapshot.carrierCertification==='pending_rc_sms_1_10');
check('readiness snapshot exposes no phone numbers message bodies or secrets',snapshot.privacy.containsPhoneNumbers===false&&snapshot.privacy.containsMessageBodies===false&&snapshot.privacy.containsSecrets===false&&!JSON.stringify(snapshot).includes(env.RINGCENTRAL_CLIENT_SECRET)&&!JSON.stringify(snapshot).includes(env.RINGCENTRAL_JWT_TOKEN)&&!JSON.stringify(snapshot).includes(env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN));
check('readiness snapshot includes webhook/retry/relationship evidence',snapshot.evidence.webhook.observed===true&&snapshot.evidence.relationships.total>0&&snapshot.evidence.retries.total>0);
const incomplete=await buildSharedNumberCertificationSnapshot({env:{},store,now,operationsBuild:SMS_OPERATIONS_BUILD});
check('pre-port readiness fails closed on missing runtime configuration',incomplete.readyForPortCertification===false&&incomplete.blockers.includes('runtime_configuration_incomplete')&&incomplete.runtime.configuration.missing.includes('RINGCENTRAL_CLIENT_SECRET'));

opsRes=await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/',{headers:{Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`}}),{env,store,now});opsBody=await opsRes.json();
check('protected Operations API surfaces non-destructive certification snapshot',opsRes.status===200&&opsBody.certification?.build==='RC-SMS-1.9.6'&&opsBody.certification?.carrierCertification==='pending_rc_sms_1_10');
const ui=fs.readFileSync('agent/sms-operations/index.html','utf8')+fs.readFileSync('assets/js/sms-operations.js','utf8');
check('Operations UI identifies 1.9.6 and pre-port certification boundary',['RC-SMS-1.9.6','Shared number operations certification','Pre-port certification','Shared-number readiness','Final 408-FARMERS carrier certification remains RC-SMS-1.10'].every(t=>ui.includes(t)));

// Static route/secret hygiene and single delivery boundary.
for(const rel of ['functions/api/sms/ringcentral/webhook.js','functions/api/sms/send.js','functions/api/sms/outbound/register.js','functions/api/sms/producer/index.js','functions/api/sms/consent/index.js','functions/api/sms/operations/index.js'])check(`root deployable route exists: ${rel}`,fs.existsSync(rel));
check('root package contains no committed .env or live wrangler secret file',!fs.existsSync('.env')&&!fs.existsSync('.dev.vars')&&!fs.existsSync('wrangler.toml')&&!fs.existsSync('wrangler.jsonc'));
const publicClientFiles=['agent/sms-operations/index.html','assets/js/sms-operations.js','assets/js/sms-simulator.js'].filter(fs.existsSync).map(f=>fs.readFileSync(f,'utf8')).join('\n');
check('client surfaces do not reference private RingCentral secret bindings',!['RINGCENTRAL_CLIENT_SECRET','RINGCENTRAL_JWT_TOKEN','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN','RINGCENTRAL_CONVERSATION_HASH_SECRET'].some(v=>publicClientFiles.includes(v)));
let directSendRefs=[];for(const rel of fs.readdirSync('server').filter(f=>f.endsWith('.mjs'))){const source=fs.readFileSync(path.join('server',rel),'utf8');if(!['sms-outbound-gateway.mjs','ringcentral-client.mjs'].includes(rel)&&/\bsendRingCentralSms\s*\(/.test(source))directSendRefs.push(rel);}check('gateway remains single application RingCentral delivery boundary',directSendRefs.length===0);

const docs=fs.readFileSync('RC-SMS-ROADMAP.md','utf8')+(fs.existsSync('SPRINT-RC-SMS-1.9.6.md')?fs.readFileSync('SPRINT-RC-SMS-1.9.6.md','utf8'):'')+(fs.existsSync('RC_SMS_1_9_6_CONTRACT.json')?fs.readFileSync('RC_SMS_1_9_6_CONTRACT.json','utf8'):'');
check('package marks 1.9.6 complete and 1.10 next',['RC-SMS-1.9.6 — Shared Number Operations Certification — COMPLETE','RC-SMS-1.10 — 408-FARMERS Port + Live Carrier Certification — NEXT'].every(t=>docs.includes(t)));
check('1.9.6 never claims final carrier certification',!snapshot.readyForPortCertification||snapshot.carrierCertification==='pending_rc_sms_1_10');

console.log(JSON.stringify({sprint:'RC-SMS-1.9.6',version,passed:checks.length,failed:0,checks},null,2));
