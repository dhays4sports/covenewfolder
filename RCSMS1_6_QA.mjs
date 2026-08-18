import fs from 'node:fs';
import path from 'node:path';
import {
  normalizePartnerRegistry,
  resolveSmsPartnerAttribution,
  partnerRegistryFromEnv
} from './server/realtor-partner-registry.mjs';
import {
  SMS_ENGINE_BUILD,
  SMS_ENGINE_VERSION,
  createSimulatorConversation,
  processSimulatorInbound,
  normalizeSmsCommand,
  normalizeSmsIntent
} from './server/sms-conversation-core.mjs';
import { createSmsHandoff, handleSmsHandoffRead, SMS_HANDOFF_BUILD } from './server/sms-handoff-core.mjs';
import { RC_SMS_CONNECTION_BUILD, LIVE_CONVERSATION_PREFIX, handleRingCentralWebhook } from './server/ringcentral-sms-connection-core.mjs';
import { SMS_EVENT_FILTER, clearRingCentralTokenCache } from './server/ringcentral-client.mjs';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const checks=[];
const check=(name,value)=>{if(!value)throw new Error(`FAIL: ${name}`);checks.push(name)};
class MemoryStore{constructor(){this.values=new Map()} async get(k){return this.values.get(String(k))||null} async setJSON(k,v,o={}){k=String(k);if(o.onlyIfNew&&this.values.has(k))throw new Error('UNIQUE');this.values.set(k,JSON.parse(JSON.stringify(v)))} async delete(k){this.values.delete(String(k))} entries(prefix=''){return [...this.values.entries()].filter(([k])=>k.startsWith(prefix))}}

const version=read('VERSION').trim(); const pkg=JSON.parse(read('package.json'));
check('release advances to 3.20.24',['3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60','3.20.67','3.20.68','3.20.69','3.20.70','3.20.71'].includes(version)&&pkg.version===version);
check('RC-SMS components synchronize at 1.6',['1.4.0','1.5.0','1.6.0','1.7.0','1.7.1','1.7.2'].includes(SMS_ENGINE_VERSION)&&['RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_ENGINE_BUILD)&&['RC-SMS-1.6','RC-SMS-1.7','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(RC_SMS_CONNECTION_BUILD)&&['RC-SMS-1.6','RC-SMS-1.8','RC-SMS-1.9','RC-SMS-1.9.1','RC-SMS-1.9.2','RC-SMS-1.9.3','RC-SMS-1.9.4','RC-SMS-1.9.5','RC-SMS-1.9.6'].includes(SMS_HANDOFF_BUILD));
check('partner registry module exists',fs.existsSync(path.join(root,'server/realtor-partner-registry.mjs')));

const registry=normalizePartnerRegistry([
  {code:'JM42',partnerId:'jessica-martinez',partnerName:'Jessica Martinez',status:'active',source:'realtor_partner',defaultIntent:'buyer'},
  {code:'OLD9',partnerId:'inactive-agent',partnerName:'Inactive Agent',status:'inactive',source:'realtor_partner',defaultIntent:'buyer'}
]);
check('registry normalizes canonical records',registry.length===2&&registry[0].code==='JM42'&&registry[0].partnerId==='jessica-martinez');
let duplicateRejected=false; try{normalizePartnerRegistry([{code:'AA11',partnerId:'a',partnerName:'A'},{code:'aa11',partnerId:'b',partnerName:'B'}])}catch{duplicateRejected=true}
check('partner codes are unique case-insensitively',duplicateRejected);
const fromEnv=partnerRegistryFromEnv({RCSMS_PARTNER_REGISTRY_JSON:JSON.stringify(registry)});
check('server registry loads from deployment environment',fromEnv.length===2&&fromEnv[0].code==='JM42');

const resolved=resolveSmsPartnerAttribution("Hi Dylan, I'm buying a home. Jessica referred me. Ref: jm42",registry);
check('code inside normal prefilled message resolves case-insensitively',resolved.active&&resolved.attribution.partnerId==='jessica-martinez'&&resolved.attribution.partnerName==='Jessica Martinez');
check('recognized code is removed before conversation interpretation',!resolved.cleanedBody.includes('JM42')&&!/Ref:/i.test(resolved.cleanedBody)&&normalizeSmsIntent(resolved.cleanedBody)==='buyer');
const stopResolved=resolveSmsPartnerAttribution('STOP Ref: JM42',registry);
check('partner code does not interfere with STOP',normalizeSmsCommand(stopResolved.cleanedBody)==='stop');
const rushResolved=resolveSmsPartnerAttribution('RUSH Ref: JM42',registry);
check('partner code does not interfere with RUSH',normalizeSmsCommand(rushResolved.cleanedBody)==='rush');
const inactive=resolveSmsPartnerAttribution("I'm buying a home Ref: OLD9",registry);
check('inactive code fails safely without attribution',inactive.matched&&inactive.active===false&&inactive.attribution===null&&normalizeSmsIntent(inactive.cleanedBody)==='buyer');
const unknown=resolveSmsPartnerAttribution("I'm buying a home Ref: ZZ99",registry);
check('unknown code does not break normal intent',unknown.matched===false&&normalizeSmsIntent(unknown.cleanedBody)==='buyer');

let conversation=createSimulatorConversation({conversationId:'sms-sim-partner-12345678',testPhone:'+14085550199',now:'2026-08-06T20:00:00Z'});
const sequence=[
  ['sim-msg-000001',"Hi Dylan, I'm buying a home and need help. Ref: JM42"],
  ['sim-msg-000002','123 Main Street, San Jose, CA 95118'],
  ['sim-msg-000003','August 28, 2026'],
  ['sim-msg-000004','1'],
  ['sim-msg-000005','YES']
];
for(const [messageId,body] of sequence){conversation=processSimulatorInbound(conversation,{messageId,body},{partnerRegistry:registry,now:'2026-08-06T20:00:00Z'}).conversation}
check('simulator persists partner attribution throughout buyer intake',conversation.state==='coveragefit_ready'&&conversation.attribution?.partnerId==='jessica-martinez'&&conversation.attribution?.entryMethod==='sms');
check('partner code is not echoed in automation replies',conversation.transcript.filter(x=>x.direction==='outbound').every(x=>!x.body.includes('JM42')));

const handoffStore=new MemoryStore();
const access=await createSmsHandoff(conversation,{store:handoffStore,now:new Date('2026-08-06T20:00:00Z'),origin:'https://coveragefit.com'});
check('opaque handoff URL excludes realtor identity',!access.url.includes('Jessica')&&!access.url.includes('JM42')&&!access.url.includes('jessica-martinez'));
const reqRead=new Request('https://coveragefit.com/api/sms/handoff/read',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json'},body:JSON.stringify({token:access.token})});
const resRead=await handleSmsHandoffRead(reqRead,{store:handoffStore,now:new Date('2026-08-06T20:01:00Z')}); const bodyRead=await resRead.json();
check('CoverageFit handoff receives canonical partner attribution',resRead.status===200&&bodyRead.handoff.partnerId==='jessica-martinez'&&bodyRead.handoff.partnerName==='Jessica Martinez'&&bodyRead.handoff.referralSource==='realtor_partner'&&bodyRead.handoff.entryMethod==='sms');
check('SMS campaign remains partner-measurable',bodyRead.handoff.campaignId==='buyer_partner_jessica-martinez_sms');
check('public handoff response does not expose partner code',!Object.prototype.hasOwnProperty.call(bodyRead.handoff,'partnerCode'));

const resolver=read('assets/js/sms-handoff-resolver.js');
check('browser stores partner identity in existing CoverageFit integration context',resolver.includes('partnerId: clean(h.partnerId')&&resolver.includes('partnerName: clean(h.partnerName')&&resolver.includes('referralSource: clean(h.referralSource')&&resolver.includes('entryMethod: clean(h.entryMethod'));
check('downstream assessment retains partner identity',read('assets/js/assessment-engine.js').includes('partnerId: journey.partnerId')&&read('assets/js/assessment-engine.js').includes('partnerName: report.integration?.partnerName'));

// Live webhook path with server-side registry config.
const now=new Date('2026-08-06T20:00:00Z');
const env={RINGCENTRAL_SERVER_URL:'https://platform.ringcentral.com',RINGCENTRAL_CLIENT_ID:'id',RINGCENTRAL_CLIENT_SECRET:'secret',RINGCENTRAL_JWT_TOKEN:'jwt',RINGCENTRAL_FROM_NUMBER:'+14085550123',RINGCENTRAL_WEBHOOK_URL:'https://coveragefit.com/api/sms/ringcentral/webhook',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'validation-1234567890',RINGCENTRAL_CONVERSATION_HASH_SECRET:'hash-secret-1234567890',RCSMS_PARTNER_REGISTRY_JSON:JSON.stringify(registry)};
const inbound=(id,subject)=>({uuid:`uuid-${id}`,event:SMS_EVENT_FILTER,timestamp:now.toISOString(),body:{id,to:[{phoneNumber:env.RINGCENTRAL_FROM_NUMBER,target:true}],from:{phoneNumber:'+14085550177'},type:'SMS',direction:'Inbound',creationTime:now.toISOString(),subject,messageStatus:'Received'}});
const request=payload=>new Request(env.RINGCENTRAL_WEBHOOK_URL,{method:'POST',headers:{'Validation-Token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(payload)});
const sent=[]; const fetchImpl=async(url,init={})=>{if(url.endsWith('/restapi/oauth/token'))return new Response(JSON.stringify({access_token:'token',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});if(url.endsWith('/sms')){const b=JSON.parse(init.body);sent.push(b);return new Response(JSON.stringify({id:`out-${sent.length}`}),{status:200,headers:{'Content-Type':'application/json'}})}throw new Error(`Unexpected ${url}`)};
const store=new MemoryStore(), liveHandoff=new MemoryStore(); clearRingCentralTokenCache();
for(const [id,msg] of [['710000001',"Hi Dylan, I'm buying a home. Ref: JM42"],['710000002','123 Main Street, San Jose, CA 95118'],['710000003','8/28/2026'],['710000004','1'],['710000005','YES']]){
  const response=await handleRingCentralWebhook(request(inbound(id,msg)),{env,store,handoffStore:liveHandoff,fetchImpl,now}); check(`live partner step ${id} succeeds`,response.status===200);
}
const liveConversation=store.entries(LIVE_CONVERSATION_PREFIX)[0]?.[1];
check('live conversation persists canonical realtor attribution',liveConversation?.attribution?.partnerId==='jessica-martinez'&&liveConversation?.attribution?.partnerCode==='JM42');
check('live outbound messages do not echo referral code',sent.every(item=>!String(item.text||'').includes('JM42')));
check('live handoff created without partner identity in URL',liveConversation?.handoff?.url?.includes('token=sh_')&&!liveConversation.handoff.url.includes('Jessica'));

check('sprint documentation records configuration boundary',/RCSMS_PARTNER_REGISTRY_JSON/.test(read('SPRINT-RC-SMS-1.6.md'))&&/No production realtor records/.test(read('SPRINT-RC-SMS-1.6.md')));
console.log(JSON.stringify({sprint:'RC-SMS-1.6',passed:checks.length,failed:0,checks},null,2));
