import fs from 'node:fs';
import path from 'node:path';
import { SMS_ENGINE_BUILD, SMS_ENGINE_VERSION } from './server/sms-conversation-core.mjs';
import { RC_SMS_CONNECTION_BUILD, LIVE_CONVERSATION_PREFIX, handleRingCentralWebhook } from './server/ringcentral-sms-connection-core.mjs';
import { SMS_EVENT_FILTER, clearRingCentralTokenCache } from './server/ringcentral-client.mjs';
import { buildSmsProducerSummary, determineGuidedResumeState, handleSmsProducerHandoff, SMS_PRODUCER_HANDOFF_BUILD } from './server/sms-producer-handoff-core.mjs';

const root=process.cwd(), read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const checks=[]; const check=(name,v)=>{if(!v)throw new Error(`FAIL: ${name}`);checks.push(name)};
class MemoryStore { constructor(){this.values=new Map()} async get(k){return this.values.get(String(k))||null} async setJSON(k,v,o={}){k=String(k);if(o.onlyIfNew&&this.values.has(k))throw new Error('UNIQUE');this.values.set(k,JSON.parse(JSON.stringify(v)))} async delete(k){this.values.delete(String(k))} async list({prefix='',limit=500}={}){return {blobs:[...this.values.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key}))}} entries(prefix=''){return [...this.values.entries()].filter(([k])=>k.startsWith(prefix))} }

check('release advances to 3.20.25',['3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(read('VERSION').trim())&&JSON.parse(read('package.json')).version===read('VERSION').trim());
check('RC-SMS components synchronize at 1.7',['1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION)&&['RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD)&&['RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD)&&['RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_PRODUCER_HANDOFF_BUILD));
check('protected producer endpoint exists',fs.existsSync(path.join(root,'functions/api/sms/producer/index.js'))&&read('server/cloudflare-pages-handlers.mjs').includes('smsProducerHandoff'));

const example={id:'sms-live-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',contactPhone:'+14085550177',businessPhone:'+14085550123',state:'awaiting_producer',intent:'buyer',answers:{propertyAddress:'123 Main Street, San Jose, CA 95118',closingDateDisplay:'Friday, August 28, 2026',occupancy:'primary_home',autoReview:true,priority:'rush'},attribution:{partnerId:'jessica-martinez',partnerName:'Jessica Martinez'},handoff:{url:'https://coveragefit.com/sms/continue/?token=sh_opaque'},transcript:[],createdAt:'2026-08-06T20:00:00Z',updatedAt:'2026-08-06T20:05:00Z'};
const summary=buildSmsProducerSummary(example);
check('producer summary is concise and actionable',summary.text.includes('NEW 408FARMERS BUYER')&&summary.text.includes('Jessica Martinez')&&summary.text.includes('123 Main Street')&&summary.text.includes('RUSH / time-sensitive')&&summary.text.includes('Link delivered'));
check('resume state derives from captured buyer progress',determineGuidedResumeState({...example,handoff:null,answers:{propertyAddress:'123 Main Street'}})==='buyer_closing_date_requested');

const now=new Date('2026-08-06T20:00:00Z');
const env={COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'producer-access-token-1234567890',RINGCENTRAL_SERVER_URL:'https://platform.ringcentral.com',RINGCENTRAL_CLIENT_ID:'id',RINGCENTRAL_CLIENT_SECRET:'secret',RINGCENTRAL_JWT_TOKEN:'jwt',RINGCENTRAL_FROM_NUMBER:'+14085550123',RINGCENTRAL_WEBHOOK_URL:'https://coveragefit.com/api/sms/ringcentral/webhook',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'validation-1234567890',RINGCENTRAL_CONVERSATION_HASH_SECRET:'hash-secret-1234567890'};
const inbound=(id,subject)=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:now.toISOString(),body:{id,to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}],from:{phoneNumber:'+14085550177'},type:'SMS',direction:'Inbound',creationTime:now.toISOString(),subject,messageStatus:'Received'}});
const outbound=(id,subject)=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:now.toISOString(),body:{id,to:[{phoneNumber:'+14085550177',target:true}],from:{phoneNumber:env.RINGCENTRAL_FROM_NUMBER},type:'SMS',direction:'Outbound',creationTime:now.toISOString(),subject,messageStatus:'Sent'}});
const request=payload=>new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(payload)});
const sent=[]; const fetchImpl=async(url,init={})=>{if(url.endsWith('/restapi/oauth/token'))return new Response(JSON.stringify({access_token:'token',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});if(url.endsWith('/sms')){const b=JSON.parse(init.body);sent.push(b);return new Response(JSON.stringify({id:`out-${sent.length}`}),{status:200,headers:{'Content-Type':'application/json'}})}throw new Error(`Unexpected ${url}`)};
const store=new MemoryStore(), handoffStore=new MemoryStore(); clearRingCentralTokenCache();
for(const [id,msg] of [['810000001','1'],['810000002','123 Main Street, San Jose, CA 95118'],['810000003','8/28/2026'],['810000004','1'],['810000005','YES']]){
 const res=await handleRingCentralWebhook(request(inbound(id,msg)),{env,store,handoffStore,fetchImpl,now}); check(`buyer step ${id} succeeds`,res.status===200);
}
let live=store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('completed buyer intake queues for producer',live?.state==='awaiting_producer'&&live?.handoff?.url&&live?.producerSummary?.property.includes('123 Main Street'));
check('producer summary retains partner-safe direct fallback',live?.producerSummary?.referredBy==='Direct / no partner captured');
const automatedId=live.transcript.filter(x=>x.kind==='automation').at(-1)?.id?.replace(/^rc-/,'');
check('automation outbound RingCentral id is persisted',Boolean(automatedId));
const echoRes=await handleRingCentralWebhook(request(outbound(automatedId,'automated echo body ignored')),{env,store,handoffStore,fetchImpl,now}); const echoBody=await echoRes.json();
check('automation outbound webhook echo does not trigger takeover', echoBody.automationEcho===true || (echoBody.registeredOutbound===true && echoBody.outboundOrigin==='coveragefit'));
live=store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1]; check('automation echo leaves producer queue intact',live.state==='awaiting_producer');
const manualRes=await handleRingCentralWebhook(request(outbound('manual-9001','Hi, this is Dylan. I have your information and will review it with you.')),{env,store,handoffStore,fetchImpl,now}); const manualBody=await manualRes.json();
check('manual RingCentral reply triggers human takeover',manualBody.manualTakeover===true&&manualBody.state==='human_takeover');
live=store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('manual reply is recorded as producer transcript',live.state==='human_takeover'&&live.transcript.at(-1)?.kind==='producer'&&live.manualTakeoverAt);
const inboundAfterTakeover=await handleRingCentralWebhook(request(inbound('810000006','Thanks Dylan')),{env,store,handoffStore,fetchImpl,now}); const afterBody=await inboundAfterTakeover.json();
check('automation stays silent after human takeover',afterBody.replied===false&&store.entries(LIVE_CONVERSATION_PREFIX)[0][1].state==='human_takeover');

const auth={Authorization:`Bearer ${env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}`};
const listReq=new Request('https://coveragefit.com/api/sms/producer',{headers:auth}); const listRes=await handleSmsProducerHandoff(listReq,{env,store,fetchImpl,now}); const listBody=await listRes.json();
check('protected producer queue lists takeover conversations',listRes.status===200&&listBody.count===1&&listBody.conversations[0].producerSummary.property.includes('123 Main Street'));
const noAuth=await handleSmsProducerHandoff(new Request('https://coveragefit.com/api/sms/producer'),{env,store,now}); check('producer queue rejects unauthenticated access',noAuth.status===401);
const id=live.id;
const actionReq=(action)=>new Request('https://coveragefit.com/api/sms/producer',{method:'POST',headers:{...auth,Origin:'https://coveragefit.com','Content-Type':'application/json'},body:JSON.stringify({conversationId:id,action})});
let actionRes=await handleSmsProducerHandoff(actionReq('resume'),{env,store,fetchImpl,now}); let actionBody=await actionRes.json(); check('producer can resume guided state safely',actionRes.status===200&&actionBody.conversation.state==='awaiting_producer');
actionRes=await handleSmsProducerHandoff(actionReq('resend_handoff'),{env,store,fetchImpl,now}); actionBody=await actionRes.json(); check('producer can resend existing secure CoverageFit link',actionRes.status===200&&sent.at(-1).text.includes('/sms/continue/?token='));
actionRes=await handleSmsProducerHandoff(actionReq('not_proceeding'),{env,store,fetchImpl,now}); actionBody=await actionRes.json(); check('producer can mark conversation not proceeding',actionBody.conversation.state==='completed'&&actionBody.conversation.producerDisposition==='not_proceeding');

const simulatorHtml=read('agent/sms-simulator/index.html'), simulatorJs=read('assets/js/sms-simulator.js');
check('simulator exposes producer summary and handoff controls',simulatorHtml.includes('Dylan-ready intake summary')&&simulatorHtml.includes('Live Dylan queue')&&simulatorHtml.includes('Resume guided intake')&&simulatorHtml.includes('Resend CoverageFit link')&&simulatorHtml.includes('Mark not proceeding')&&simulatorJs.includes('NEW 408FARMERS BUYER')&&simulatorJs.includes("PRODUCER_ENDPOINT = '/api/sms/producer'"));
check('sprint documentation exists',fs.existsSync(path.join(root,'SPRINT-RC-SMS-1.7.md')));
console.log(JSON.stringify({sprint:'RC-SMS-1.7',passed:checks.length,failed:0,checks},null,2));
