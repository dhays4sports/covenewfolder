const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('assets/js/prefill-intake.js', 'utf8');

function storage(){ const m=new Map(); return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}; }
function run(search){
  const sessionStorage=storage(), localStorage=storage();
  let replaced=''; let event=null;
  const context={
    window:{location:{search,pathname:'/home/',hash:''},history:{state:null,replaceState:(a,b,c)=>replaced=c},dispatchEvent:e=>event=e},
    location:{search,pathname:'/home/',hash:''},
    history:{state:null,replaceState:(a,b,c)=>replaced=c},
    document:{title:'CoverageFit'}, sessionStorage, localStorage,
    URLSearchParams, Date, console,
    CustomEvent:function(type,opts){this.type=type;this.detail=opts.detail;}
  };
  context.window.window=context.window; context.window.document=context.document;
  context.window.sessionStorage=sessionStorage; context.window.localStorage=localStorage;
  context.window.URLSearchParams=URLSearchParams; context.window.CustomEvent=context.CustomEvent;
  vm.createContext(context); vm.runInContext(source,context);
  return {context,sessionStorage,localStorage,replaced,event};
}

let r=run('?first_name=Dylan&last_name=Haysbert&phone=408-327-6377&email=DYLAN%40EXAMPLE.COM&property_address=123%20Main%20St%2C%20Fremont%2C%20CA%2094539&property_city=Fremont&property_state=CA&property_zip=94539&segment=Current%20policy%20renewal&source=408farmers&campaign=door_hanger&session_id=abc123&prefill=1&handoff_version=1&utm_source=print');
const profile=JSON.parse(r.sessionStorage.getItem('coveragefit_prospect_profile_v1'));
assert.equal(profile.fullName,'Dylan Haysbert');
assert.equal(profile.email,'dylan@example.com');
assert.equal(profile.address.city,'Fremont');
assert.equal(profile.integration.sessionId,'abc123');
assert.ok(r.localStorage.getItem('coveragefit_prospect_profile_v1'));
assert.equal(r.replaced,'/home/?source=408farmers&campaign=door_hanger&session_id=abc123&utm_source=print');
assert.ok(!r.replaced.includes('email='));
assert.equal(r.event.type,'coveragefit:prefill-ready');
assert.ok(!JSON.stringify(r.event.detail).includes('dylan@example.com'));
assert.equal(r.context.window.CoverageFitPrefill.get().propertyAddress,'123 Main St, Fremont, CA 94539');

r=run('?source=direct&utm_source=test');
assert.equal(r.replaced,'');
assert.equal(r.context.window.CoverageFitPrefill.get(),null);

console.log('CF-INT-1C QA: 12/12 passed');
