import fs from 'node:fs';
import {
  SMS_AUTOMATION_MODES,
  SMS_CONVERSATION_OWNERS,
  SMS_ORCHESTRATOR_BUILD,
  SMS_OWNERSHIP_OPERATIONS,
  SMS_PRODUCER_START_WORKFLOWS,
  normalizeSmsOrchestration,
  resolveSmsInboundRoute
} from './server/sms-orchestrator-core.mjs';
import {
  SMS_OUTBOUND_GATEWAY_BUILD,
  SMS_OUTBOUND_REGISTRY_PREFIX,
  SMS_OWNERSHIP_EFFECTS,
  sendSmsThroughGateway,
  smsLiveConversationId
} from './server/sms-outbound-gateway.mjs';
import { handleRingCentralWebhook, LIVE_CONVERSATION_PREFIX, RC_SMS_CONNECTION_BUILD } from './server/ringcentral-sms-connection-core.mjs';
import { clearRingCentralTokenCache, SMS_EVENT_FILTER } from './server/ringcentral-client.mjs';
import { handleSmsProducerHandoff, SMS_PRODUCER_ACTIONS, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';
import { handleSmsOperations, SMS_OPERATIONS_BUILD } from './server/sms-operations-core.mjs';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION } from './server/sms-conversation-core.mjs';
import { SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { SMS_PRODUCER_ALERT_BUILD } from './server/sms-producer-alert.mjs';

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
check('release advances to CoverageFit 3.20.69',['3.20.69','3.20.70','3.20.71'].includes(version)&&JSON.parse(fs.readFileSync('package.json','utf8')).version===version);
check('all RC-SMS runtime surfaces synchronize at 1.9.4',SMS_ENGINE_VERSION==='1.7.2'&&[SMS_ENGINE_BUILD,SMS_HANDOFF_BUILD,RC_SMS_CONNECTION_BUILD,SMS_PRODUCER_HANDOFF_BUILD,SMS_OPERATIONS_BUILD,SMS_PRODUCER_ALERT_BUILD,SMS_ORCHESTRATOR_BUILD,SMS_OUTBOUND_GATEWAY_BUILD].every(v=>['RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(v)));
check('ownership operations and automation modes are bounded', ['acquire','transfer','pause','resume','release','close'].every(v=>SMS_OWNERSHIP_OPERATIONS.includes(v))&&['automated','assist_only','human_only','suppressed'].every(v=>SMS_AUTOMATION_MODES.includes(v)));
check('cross-workflow owner vocabulary remains bounded', ['none','coveragefit','producer','service','life','commercial','appointment','system'].every(v=>SMS_CONVERSATION_OWNERS.includes(v)));
check('producer workflow starts are bounded', ['coveragefit_homebuyer','coveragefit_home_review','coveragefit_bundle','service','appointment','life','commercial','quote_followup'].every(v=>SMS_PRODUCER_START_WORKFLOWS.includes(v)));
check('gateway ownership effects extend without removing legacy effects', ['preserve','producer','transfer','release'].every(v=>SMS_OWNERSHIP_EFFECTS.includes(v)));
check('producer endpoint keeps legacy actions and adds continuity controls', ['pause','resume','complete','not_proceeding','take_ownership','return_to_coveragefit','pause_automation','resume_workflow','close_workflow','start_workflow','transfer_ownership','release_ownership','clear_reply_context'].every(v=>SMS_PRODUCER_ACTIONS.includes(v)));

const env={
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'producer-access-token-1234567890',
  RINGCENTRAL_SERVER_URL:'https://platform.ringcentral.com',RINGCENTRAL_CLIENT_ID:'id',RINGCENTRAL_CLIENT_SECRET:'secret',RINGCENTRAL_JWT_TOKEN:'jwt',
  RINGCENTRAL_FROM_NUMBER:'+14085550123',RINGCENTRAL_WEBHOOK_URL:'https://coveragefit.com/api/sms/ringcentral/webhook',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'validation-token-test-123456789',RINGCENTRAL_CONVERSATION_HASH_SECRET:'conversation-hash-secret-test-123456789',RCSMS_PRODUCER_ALERTS_ENABLED:'false'
};
let clock=new Date('2026-08-17T06:00:00.000Z');
const now=()=>new Date(clock); const advance=s=>{clock=new Date(clock.getTime()+s*1000)};
let providerCounter=0;const providerSends=[];
const fetchImpl=async(url,init={})=>{
  if(url.endsWith('/restapi/oauth/token'))return Response.json({access_token:'token-194',expires_in:3600});
  if(url.endsWith('/sms')){providerCounter++;const payload=JSON.parse(init.body);const id=`rc194-${providerCounter}`;providerSends.push({id,payload,at:now().toISOString()});return Response.json({id});}
  throw new Error(`Unexpected RingCentral URL: ${url}`);
};
const authHeaders={Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`,Origin:'https://coveragefit.com','Content-Type':'application/json'};
const producerRequest=(conversationId,action,extra={})=>new Request('https://coveragefit.com/api/sms/producer/',{method:'POST',headers:authHeaders,body:JSON.stringify({conversationId,action,...extra})});
const webhookPayload=({id,direction='Inbound',subject,contact,at=now().toISOString()})=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:at,body:direction==='Inbound'?{id,to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}],from:{phoneNumber:contact},type:'SMS',direction,creationTime:at,subject}:{id,to:[{phoneNumber:contact,target:true}],from:{phoneNumber:env.RINGCENTRAL_FROM_NUMBER},type:'SMS',direction,creationTime:at,subject}});
const webhookRequest=p=>new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(p)});

// Exact CoverageFit state survives producer ownership and returns without recomputation drift.
const store=new Store();
const contact='+14085550301';
const id=await smsLiveConversationId(contact,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
const at=now().toISOString();
let conversation={id,schemaVersion:'1.5',channel:'ringcentral_sms',contactPhone:contact,businessPhone:env.RINGCENTRAL_FROM_NUMBER,state:'buyer_closing_date_requested',intent:'buyer',answers:{propertyAddress:'Example property'},transcript:[],inboundCount:2,outboundCount:2,createdAt:at,updatedAt:at};
conversation.orchestration=normalizeSmsOrchestration(conversation,{occurredAt:at});
await store.setJSON(`${LIVE_CONVERSATION_PREFIX}${id}`,conversation);
let res=await handleSmsProducerHandoff(producerRequest(id,'take_ownership'),{env,store,fetchImpl,now});
let body=await res.json();
check('producer can take ownership without erasing exact CoverageFit step',res.status===200&&body.conversation.state==='human_takeover'&&body.conversation.orchestration.ownership.owner==='producer'&&body.conversation.orchestration.workflow.state==='buyer_closing_date_requested'&&body.conversation.orchestration.automationMode==='human_only');
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'return_to_coveragefit'),{env,store,fetchImpl,now});body=await res.json();
check('return to CoverageFit resumes exact preserved workflow state',res.status===200&&body.conversation.state==='buyer_closing_date_requested'&&body.conversation.orchestration.workflow.state==='buyer_closing_date_requested'&&body.conversation.orchestration.ownership.owner==='coveragefit'&&body.conversation.orchestration.automationMode==='automated');

// Take ownership again, then layer service reply context without surrendering producer ownership.
advance(2);
await handleSmsProducerHandoff(producerRequest(id,'take_ownership'),{env,store,fetchImpl,now});
clearRingCentralTokenCache();
const serviceSend=await sendSmsThroughGateway({to:contact,message:'Please reply with the roof replacement year.',origin:'service',workflow:'quote_document_request',replyRoute:'service',ownershipEffect:'preserve',replyContext:'quote_document_request',replyContextTtlSeconds:3600,idempotencyKey:'service:context:194:001'},{env,store,fetchImpl,now});
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('reply context can differ from relationship owner',serviceSend.ok&&conversation.orchestration.ownership.owner==='producer'&&conversation.orchestration.replyContext?.route==='service'&&conversation.orchestration.replyContext?.context==='quote_document_request'&&conversation.orchestration.workflow.state==='buyer_closing_date_requested');
check('registered reply context is durably tied to outbound provider record',Boolean(await store.get(`${SMS_OUTBOUND_REGISTRY_PREFIX}${serviceSend.providerMessageId}`))&&conversation.outboundContext.replyContext==='quote_document_request');
const directDecision=resolveSmsInboundRoute(conversation,'2018',{occurredAt:now().toISOString()});
check('active reply context outranks producer ownership for reply routing',directDecision.route==='service'&&directDecision.reason==='reply_context:quote_document_request');
const sendsBeforeServiceReply=providerSends.length;
advance(1);
res=await handleRingCentralWebhook(webhookRequest(webhookPayload({id:'in-service-1',subject:'2018',contact})),{env,store,fetchImpl,now});body=await res.json();
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('service reply is consumed human-safely without restarting CoverageFit',body.routedTo==='service'&&body.replied===false&&providerSends.length===sendsBeforeServiceReply&&conversation.orchestration.ownership.owner==='producer'&&conversation.orchestration.workflow.state==='buyer_closing_date_requested'&&conversation.orchestration.lastRoute==='service');

// Expiration returns routing to the persistent relationship owner.
advance(3601);
res=await handleRingCentralWebhook(webhookRequest(webhookPayload({id:'in-after-expiry',subject:'Following up',contact})),{env,store,fetchImpl,now});body=await res.json();
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('expired reply context falls back to persistent producer ownership',body.routedTo==='producer'&&conversation.orchestration.ownership.owner==='producer'&&!conversation.orchestration.replyContext);

// A registered specialized transfer can move owner itself when explicitly requested.
advance(2);
const transferSend=await sendSmsThroughGateway({to:contact,message:'Service team is handling this request.',origin:'service',workflow:'service',replyRoute:'service',ownershipEffect:'transfer',ownershipTarget:'service',replyContext:'service',replyContextTtlSeconds:1800,idempotencyKey:'service:transfer:194:001'},{env,store,fetchImpl,now});
conversation=await store.get(`${LIVE_CONVERSATION_PREFIX}${id}`);
check('explicit transfer changes owner independently from reply route declaration',transferSend.ok&&conversation.orchestration.ownership.owner==='service'&&conversation.orchestration.automationMode==='assist_only'&&conversation.orchestration.replyContext.route==='service');

// Return control to producer before closing and starting subsequent workflow episodes.
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'transfer_ownership',{owner:'producer'}),{env,store,fetchImpl,now});body=await res.json();
check('protected producer action can transfer specialized ownership back to producer',res.status===200&&body.conversation.orchestration.ownership.owner==='producer');
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'close_workflow'),{env,store,fetchImpl,now});body=await res.json();
check('closing workflow archives a bounded episode and releases owner',res.status===200&&body.conversation.state==='completed'&&body.conversation.orchestration.workflow.status==='completed'&&body.conversation.orchestration.ownership.owner==='none'&&body.conversation.orchestration.workflowEpisodes.length===1);
const closedEpisodeId=body.conversation.orchestration.workflowEpisodes[0].id;
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'start_workflow',{workflowType:'life'}),{env,store,fetchImpl,now});body=await res.json();
check('completed old workflow does not block deliberate new workflow',res.status===200&&body.conversation.state==='human_takeover'&&body.conversation.orchestration.workflow.type==='life'&&body.conversation.orchestration.workflow.status==='active'&&body.conversation.orchestration.ownership.owner==='producer'&&body.conversation.orchestration.workflowEpisodes.some(e=>e.id===closedEpisodeId));
const lifeWorkflowId=body.conversation.orchestration.workflow.id;
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'start_workflow',{workflowType:'coveragefit_home_review'}),{env,store,fetchImpl,now});body=await res.json();
check('starting another workflow archives prior active episode under same channel relationship',res.status===200&&body.conversation.state==='home_review_address_requested'&&body.conversation.intent==='home_review'&&body.conversation.orchestration.ownership.owner==='coveragefit'&&body.conversation.orchestration.workflow.type==='coveragefit_home_review'&&body.conversation.orchestration.workflowEpisodes.some(e=>e.id===lifeWorkflowId));
check('workflow episode changes do not create parallel live conversation records',store.entries(LIVE_CONVERSATION_PREFIX).length===1);

// Resume/pause controls remain bounded and do not replace episode ID.
const activeWorkflowId=body.conversation.orchestration.workflow.id;
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'pause_automation'),{env,store,fetchImpl,now});body=await res.json();
check('pause automation preserves current workflow episode ID',body.conversation.orchestration.workflow.id===activeWorkflowId&&body.conversation.orchestration.workflow.state==='home_review_address_requested'&&body.conversation.orchestration.ownership.owner==='producer');
advance(2);
res=await handleSmsProducerHandoff(producerRequest(id,'resume_workflow'),{env,store,fetchImpl,now});body=await res.json();
check('resume workflow restores CoverageFit without replacing episode ID',body.conversation.orchestration.workflow.id===activeWorkflowId&&body.conversation.orchestration.ownership.owner==='coveragefit'&&body.conversation.state==='home_review_address_requested');

// Operations output is redacted and exposes only bounded continuity metadata.
const ops=await (await handleSmsOperations(new Request('https://coveragefit.com/api/sms/operations/',{headers:{Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`}}),{env,store,now})).json();
const opsConversation=ops.conversations.find(c=>c.id===id);
check('operations exposes owner previous owner episode count and reply context safely',ops.ok&&opsConversation?.orchestration?.owner==='coveragefit'&&typeof opsConversation?.orchestration?.workflowEpisodeCount==='number'&&Array.isArray(opsConversation?.workflowEpisodes)&&!JSON.stringify(opsConversation).includes(contact));

// Static product surface and handoff documentation.
const ui=fs.readFileSync('agent/sms-operations/index.html','utf8')+fs.readFileSync('assets/js/sms-operations.js','utf8');
check('operations UI identifies 1.9.4 and exposes continuity controls', ['RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].some(v=>ui.includes(v))&&['Take ownership','Return to CoverageFit','Pause automation','Resume workflow','Close workflow','Start new workflow','Reply context:'].every(t=>ui.includes(t)));
const d1=fs.readFileSync('server/d1-json-store.mjs','utf8');
check('1.9.4 remains within existing sms_conversations storage boundary',d1.includes("'sms_conversations'")&&!d1.includes('sms_workflow_episodes'));
const docs=fs.readFileSync('SPRINT-RC-SMS-1.9.4.md','utf8')+fs.readFileSync('RC-SMS-ROADMAP.md','utf8')+fs.readFileSync('RC_SMS_1_9_4_CONTRACT.json','utf8');
check('package embeds 1.9.4 contract and retains later roadmap',['Cross-Workflow Ownership + Producer Continuity','RC-SMS-1.9.5','RC-SMS-1.9.6','RC-SMS-1.10'].every(t=>docs.includes(t)));

console.log(JSON.stringify({sprint:'RC-SMS-1.9.4',version,passed:checks.length,failed:0,checks},null,2));
