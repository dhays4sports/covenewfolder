import fs from 'node:fs';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import { normalizeSmsOrchestration } from './server/sms-orchestrator-core.mjs';
import {
  SMS_CONSENT_BUILD,
  SMS_CONSENT_SCHEMA,
  SMS_CONSENT_STATUSES,
  SMS_PROVIDER_CONSENT_STATUSES,
  normalizeSmsConsent,
  reconcileSmsProviderConsent,
  smsPermissionSnapshot,
  smsSendClass
} from './server/sms-consent-core.mjs';
import { handleSmsConsent, SMS_CONSENT_API_BUILD } from './server/sms-consent-api-core.mjs';
import { handleRingCentralWebhook, LIVE_CONVERSATION_PREFIX, RC_SMS_CONNECTION_BUILD } from './server/ringcentral-sms-connection-core.mjs';
import { sendSmsThroughGateway, registerExternalOutbound, smsLiveConversationId, SmsGatewayError, SMS_OUTBOUND_GATEWAY_BUILD } from './server/sms-outbound-gateway.mjs';
import { handleSmsProducerHandoff, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';
import { handleSmsOperations, queueSmsRetry, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { SMS_ENGINE_BUILD } from './server/sms-conversation-core.mjs';

const checks=[];
const check=(name,condition)=>{if(!condition)throw new Error(`FAIL: ${name}`);checks.push(name);};
class Store{
  constructor(){this.values=new Map();}
  async get(k){return this.values.has(String(k))?structuredClone(this.values.get(String(k))):null;}
  async setJSON(k,v,o={}){k=String(k);if(o.onlyIfNew&&this.values.has(k))throw new Error('D1 UNIQUE constraint');this.values.set(k,structuredClone(v));}
  async delete(k){this.values.delete(String(k));}
  async list({prefix='',limit=500}={}){return{blobs:[...this.values.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key}))};}
  entries(prefix=''){return[...this.values.entries()].filter(([k])=>k.startsWith(prefix));}
}
const version=fs.readFileSync('VERSION','utf8').trim();
check('release advances to CoverageFit 3.20.70',['3.20.70','3.20.71'].includes(version)&&JSON.parse(fs.readFileSync('package.json','utf8')).version===version);
check('consent contract is explicit and bounded',['RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_CONSENT_BUILD)&&['RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_CONSENT_API_BUILD)&&SMS_CONSENT_SCHEMA==='1.0'&&['active','opted_out'].every(v=>SMS_CONSENT_STATUSES.includes(v))&&['unknown','active','opted_out','blocked'].every(v=>SMS_PROVIDER_CONSENT_STATUSES.includes(v)));
check('runtime surfaces synchronize at 1.9.5',[SMS_ENGINE_BUILD,RC_SMS_CONNECTION_BUILD,SMS_OUTBOUND_GATEWAY_BUILD,SMS_PRODUCER_HANDOFF_BUILD,SMS_OPERATIONS_BUILD].every(v=>['RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(v)));
check('producer console provenance is human initiated without becoming manual RingCentral transport',smsSendClass('producer_console')==='human_initiated'&&smsSendClass('crm')==='automated');

const env={
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'producer-access-token-1234567890',
  RINGCENTRAL_SERVER_URL:'https://platform.ringcentral.com',RINGCENTRAL_CLIENT_ID:'id',RINGCENTRAL_CLIENT_SECRET:'secret',RINGCENTRAL_JWT_TOKEN:'jwt',
  RINGCENTRAL_FROM_NUMBER:'+14085550123',RINGCENTRAL_WEBHOOK_URL:'https://coveragefit.com/api/sms/ringcentral/webhook',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'validation-token-test-123456789',RINGCENTRAL_CONVERSATION_HASH_SECRET:'conversation-hash-secret-test-123456789',RCSMS_PRODUCER_ALERTS_ENABLED:'false'
};
let clock=new Date('2026-08-17T14:00:00.000Z');
const now=()=>new Date(clock);const advance=s=>{clock=new Date(clock.getTime()+s*1000)};
let providerCounter=0;const sends=[];
const fetchImpl=async(url,init={})=>{
  if(url.endsWith('/restapi/oauth/token'))return Response.json({access_token:'token-195',expires_in:3600});
  if(url.endsWith('/sms')){providerCounter++;const payload=JSON.parse(init.body);const id=`rc195-${providerCounter}`;sends.push({id,payload,at:now().toISOString()});return Response.json({id});}
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};
const webhookPayload=({id,direction='Inbound',subject,contact,at=now().toISOString()})=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:at,body:direction==='Inbound'?{id,to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}],from:{phoneNumber:contact},type:'SMS',direction,creationTime:at,subject}:{id,to:[{phoneNumber:contact,target:true}],from:{phoneNumber:env.RINGCENTRAL_FROM_NUMBER},type:'SMS',direction,creationTime:at,subject}});
const webhookRequest=p=>new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(p)});
const authHeaders={Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`,Origin:'https://coveragefit.com','Content-Type':'application/json'};
const producerRequest=(conversationId,action,extra={})=>new Request('https://coveragefit.com/api/sms/producer/',{method:'POST',headers:authHeaders,body:JSON.stringify({conversationId,action,...extra})});

const store=new Store();
const contact='+14085550395';
const id=await smsLiveConversationId(contact,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const at=now().toISOString();
let conversation={id,schemaVersion:'1.6',channel:'ringcentral_sms',contactPhone:contact,businessPhone:env.RINGCENTRAL_FROM_NUMBER,state:'buyer_closing_date_requested',intent:'buyer',answers:{propertyAddress:'Example property'},transcript:[],inboundCount:2,outboundCount:2,createdAt:at,updatedAt:at};
conversation.orchestration=normalizeSmsOrchestration(conversation,{occurredAt:at});
conversation.smsConsent=normalizeSmsConsent(conversation,{occurredAt:at});
await store.setJSON(`${LIVE_CONVERSATION_PREFIX}${id}`,conversation);
check('legacy/live active relationship normalizes consent without migration',conversation.smsConsent.status==='active'&&smsPermissionSnapshot(conversation,{occurredAt:at}).allowed);

// Queue work while permitted, then STOP before execution.
await queueSmsRetry(store,{conversationId:id,to:contact,body:'Queued before STOP.',origin:'crm',workflow:'quote_followup',replyRoute:'producer',ownershipEffect:'producer'},{now});
const sendsBeforeStop=sends.length;
advance(1);
let response=await handleRingCentralWebhook(webhookRequest(webhookPayload({id:'stop-1',subject:'STOP',contact})),{env,store,fetchImpl,now});
let body=await response.json();
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('STOP suppresses channel globally without erasing pending workflow state',response.status===200&&body.routedTo==='suppressed'&&body.replied===false&&conversation.state==='opted_out'&&conversation.smsConsent.status==='opted_out'&&conversation.orchestration.channel.status==='opted_out'&&conversation.orchestration.automationMode==='suppressed'&&conversation.orchestration.workflow.state==='buyer_closing_date_requested');
check('STOP itself does not send an automated reply on live shared number',sends.length===sendsBeforeStop);

for(const origin of ['coveragefit','crm','appointment','quote_followup','service','life','commercial','campaign','system','producer_console']){
  let cause=null;
  try{
    await sendSmsThroughGateway({to:contact,message:`Blocked ${origin}`,origin,workflow:origin==='coveragefit'?'coveragefit_homebuyer':'test',replyRoute:origin==='coveragefit'?'coveragefit':'producer',ownershipEffect:origin==='coveragefit'?'preserve':'producer',idempotencyKey:`blocked:${origin}:195:001`},{env,store,fetchImpl,now,allowRegisteredRetry:true});
  }catch(e){cause=e;}
  check(`global STOP blocks programmatic origin ${origin}`,cause instanceof SmsGatewayError&&cause.code==='sms_channel_suppressed');
}
let externalCause=null;
try{await registerExternalOutbound({to:contact,message:'External CRM blocked',origin:'crm',workflow:'quote_followup',replyRoute:'producer',ownershipEffect:'producer'},{env,store,now});}catch(e){externalCause=e;}
check('external pre-registration also obeys global suppression',externalCause instanceof SmsGatewayError&&externalCause.code==='sms_channel_suppressed');

// Queued/scheduled retry re-checks at execution, not only queue time.
response=await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/',{method:'POST',headers:authHeaders,body:JSON.stringify({action:'retry_pending'})}),{env,store,fetchImpl,now});
body=await response.json();
check('queued retry re-checks permission at execution and becomes suppressed',body.ok&&body.processed===1&&body.suppressed===1&&body.sent===0&&sends.length===sendsBeforeStop);

// Manual RingCentral outbound cannot silently clear suppression.
advance(1);
response=await handleRingCentralWebhook(webhookRequest(webhookPayload({id:'manual-after-stop',direction:'Outbound',subject:'Manual note from Dylan',contact})),{env,store,fetchImpl,now});
body=await response.json();
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('manual RingCentral handling remains human classified but cannot re-enable consent',body.manualTakeover===true&&conversation.smsConsent.status==='opted_out'&&conversation.orchestration.channel.status==='opted_out'&&smsPermissionSnapshot(conversation,{occurredAt:now().toISOString()}).allowed===false);

// START restores permission only and does not revive CoverageFit.
advance(1);
response=await handleRingCentralWebhook(webhookRequest(webhookPayload({id:'start-1',subject:'START',contact})),{env,store,fetchImpl,now});
body=await response.json();
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('START restores channel permission but does not restart old intake',body.routedTo==='consent'&&body.replied===false&&conversation.smsConsent.status==='active'&&conversation.state==='human_takeover'&&conversation.orchestration.ownership.owner==='producer'&&conversation.orchestration.automationMode==='human_only'&&conversation.orchestration.workflow.state==='buyer_closing_date_requested');
check('START requires explicit workflow resume before CoverageFit can send',smsPermissionSnapshot(conversation,{occurredAt:now().toISOString()}).allowed===true);
let coverageFitCause=null;
try{await sendSmsThroughGateway({to:contact,message:'Should still not bot-send.',origin:'coveragefit',workflow:'coveragefit_homebuyer',replyRoute:'coveragefit',ownershipEffect:'preserve',idempotencyKey:'after-start:coveragefit:001'},{env,store,fetchImpl,now});}catch(e){coverageFitCause=e;}
check('channel opt-in alone does not restore CoverageFit ownership',coverageFitCause instanceof SmsGatewayError&&coverageFitCause.code==='coveragefit_automation_not_permitted');
advance(1);
response=await handleSmsProducerHandoff(producerRequest(id,'return_to_coveragefit'),{env,store,fetchImpl,now});
body=await response.json();
check('explicit producer continuity action can restore preserved CoverageFit after START',response.status===200&&body.conversation.state==='buyer_closing_date_requested'&&body.conversation.orchestration.ownership.owner==='coveragefit');
clearRingCentralTokenCache();
const resumedSend=await sendSmsThroughGateway({to:contact,message:'CoverageFit resumed.',origin:'coveragefit',workflow:'coveragefit_homebuyer',replyRoute:'coveragefit',ownershipEffect:'preserve',idempotencyKey:'after-start:coveragefit:002'},{env,store,fetchImpl,now});
check('CoverageFit can send only after explicit workflow restoration',resumedSend.ok&&sends.length===sendsBeforeStop+1);

// Provider reconciliation can suppress but cannot unilaterally override customer STOP.
advance(1);
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
let providerBlocked=reconcileSmsProviderConsent(conversation,'blocked',{occurredAt:now().toISOString()});
check('provider blocked signal forces authoritative local suppression',providerBlocked.smsConsent.status==='opted_out'&&providerBlocked.smsConsent.providerStatus==='blocked'&&smsPermissionSnapshot(providerBlocked,{occurredAt:now().toISOString()}).allowed===false);
let providerActive=reconcileSmsProviderConsent(providerBlocked,'active',{occurredAt:new Date(now().getTime()+1000).toISOString()});
check('provider active signal alone does not override existing application opt-out',providerActive.smsConsent.status==='opted_out'&&providerActive.smsConsent.providerStatus==='active'&&smsPermissionSnapshot(providerActive).allowed===false);
await store.setJSON(`${LIVE_CONVERSATION_PREFIX}${id}`,providerBlocked);

// Protected provider reconciliation endpoint exposes only bounded consent state.
const consentPost=new Request('https://coveragefit.com/api/sms/consent/',{method:'POST',headers:authHeaders,body:JSON.stringify({conversationId:id,action:'reconcile_provider',providerStatus:'blocked'})});
response=await handleSmsConsent(consentPost,{env,store,now});body=await response.json();
check('protected consent endpoint reconciles provider status',response.status===200&&body.consent.status==='opted_out'&&body.consent.providerStatus==='blocked'&&body.consent.automationAllowed===false);
const consentGet=new Request(`https://coveragefit.com/api/sms/consent/?conversation_id=${id}`,{headers:{Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`}});
response=await handleSmsConsent(consentGet,{env,store,now});body=await response.json();
check('protected consent endpoint reads bounded permission state',response.status===200&&body.conversationId===id&&body.consent.providerSuppressed===true);

// Operations reflects consent and keeps PII redacted.
const ops=await (await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/',{headers:{Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`}}),{env,store,now})).json();
const row=ops.conversations.find(item=>item.id===id);
check('operations exposes global consent/provider suppression with phone redacted',row?.consent?.status==='opted_out'&&row?.consent?.providerStatus==='blocked'&&!JSON.stringify(row).includes(contact));

// Producer cannot bypass suppression to resume automation.
response=await handleSmsProducerHandoff(producerRequest(id,'return_to_coveragefit'),{env,store,fetchImpl,now});body=await response.json();
check('producer continuity cannot bypass global suppression',response.status===409&&body.error?.code==='sms_channel_suppressed');

// Static boundary: all direct provider sends remain centralized in gateway.
const directSendFiles=[];
for(const file of fs.readdirSync('server').filter(f=>f.endsWith('.mjs'))){const content=fs.readFileSync(`server/${file}`,'utf8');if(content.includes('sendRingCentralSms(')&&file!=='ringcentral-client.mjs'&&file!=='sms-outbound-gateway.mjs')directSendFiles.push(file);}
check('all application SMS delivery remains behind the permission-gated gateway',directSendFiles.length===0);
const ui=fs.readFileSync('agent/sms-operations/index.html','utf8')+fs.readFileSync('assets/js/sms-operations.js','utf8');
check('operations UI identifies global consent boundary and displays consent state',[['RC-SMS-1.9.5','RC-SMS-1.9.6'].some(t=>ui.includes(t)),['Consent:','Provider:'].every(t=>ui.includes(t))].every(Boolean));
const routeFile=fs.readFileSync('functions/api/sms/consent/index.js','utf8');
check('root deployable includes protected consent reconciliation function',routeFile.includes('smsConsent'));
const d1=fs.readFileSync('server/d1-json-store.mjs','utf8');
check('consent stays inside existing sms_conversations storage boundary without new table',d1.includes("'sms_conversations'")&&!d1.includes('sms_consent_records'));
const docs=fs.readFileSync('RC-SMS-ROADMAP.md','utf8')+fs.readFileSync('SPRINT-RC-SMS-1.9.5.md','utf8')+fs.readFileSync('RC_SMS_1_9_5_CONTRACT.json','utf8');
check('package retains 1.9.5 complete with later certification roadmap',['RC-SMS-1.9.5 — Global Consent + Suppression Boundary — COMPLETE','RC-SMS-1.9.6 — Shared Number Operations Certification — COMPLETE','RC-SMS-1.10'].every(t=>docs.includes(t)));

console.log(JSON.stringify({sprint:'RC-SMS-1.9.5',version,passed:checks.length,failed:0,checks},null,2));
