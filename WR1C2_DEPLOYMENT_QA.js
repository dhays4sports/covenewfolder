#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];
const check = (name, ok, detail='') => checks.push({name, pass:Boolean(ok), detail});
const exists = rel => fs.existsSync(path.join(root, rel));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
['_routes.json','_headers','robots.txt','sitemap.xml','site.webmanifest','404.html','package.json','wrangler.example.jsonc','migrations/0001_ops_cf_1_1.sql','functions/api/consultations/submit.js','functions/api/consultations/inbox.js','functions/api/consultations/status.js','functions/api/consultations/follow-up.js','functions/api/consultations/activity.js','functions/api/consultations/disposition.js','functions/api/consultations/checklist.js','functions/api/reports/create.js','functions/api/reports/read.js','server/consultation-inbox-core.mjs','server/prospect-report-core.mjs','server/d1-json-store.mjs','server/cloudflare-rate-limit.mjs'].forEach(f=>check(`deployment file: ${f}`, exists(f)));
const htmlFiles=[];
(function walk(dir){ for(const ent of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,ent.name); if(ent.isDirectory() && !['.git','node_modules'].includes(ent.name)) walk(p); else if(ent.isFile() && ent.name.endsWith('.html')) htmlFiles.push(p); }})(root);
let missing=[];
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  check(`${path.relative(root,file)} manifest`, /site\.webmanifest/.test(html));
  check(`${path.relative(root,file)} favicon`, /rel=["']icon["']/.test(html));
  for(const m of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
    const ref=m[1];
    if(!ref || /^(?:https?:|mailto:|tel:|sms:|data:|javascript:|#)/i.test(ref)) continue;
    const clean=ref.split(/[?#]/)[0];
    let target;
    if(clean.startsWith('/')) target=path.join(root,clean.slice(1));
    else target=path.resolve(path.dirname(file),clean);
    if(clean.endsWith('/')) target=path.join(target,'index.html');
    if(!fs.existsSync(target)) missing.push(`${path.relative(root,file)} -> ${ref}`);
  }
}
check('all local HTML references resolve', missing.length===0, missing.join('\n'));
const sitemap=read('sitemap.xml');
const routeCount=(sitemap.match(/<url>/g)||[]).length;
const indexCount=htmlFiles.filter(f=>path.basename(f)==='index.html').length;
check('sitemap covers all index routes', routeCount===indexCount, `${routeCount}/${indexCount}`);
check('robots references sitemap', /Sitemap:\s*https:\/\/coveragefit\.com\/sitemap\.xml/.test(read('robots.txt')));
check('manifest has root scope', /"scope"\s*:\s*"\/"/.test(read('site.webmanifest')));
check('headers define security controls', /X-Content-Type-Options/.test(read('_headers')) && /Referrer-Policy/.test(read('_headers')));
const routesConfig=JSON.parse(read('_routes.json'));
const packageJson=JSON.parse(read('package.json'));
const migration=read('migrations/0001_ops_cf_1_1.sql');
check('Cloudflare Pages API routes configured', routesConfig.include.includes('/api/*'));
check('D1 database schema included', /CREATE TABLE IF NOT EXISTS consultation_records/.test(migration) && /CREATE TABLE IF NOT EXISTS prospect_reports/.test(migration));
check('Wrangler development dependency declared', packageJson.devDependencies && packageJson.devDependencies.wrangler);
check('Netlify runtime removed', !exists('netlify.toml') && !exists('netlify'));
check('producer inbox setup documentation present', exists('PRODUCER-INBOX-SETUP.md'));
check('Cloudflare setup documentation present', exists('CLOUDFLARE-SETUP.md'));
const failed=checks.filter(c=>!c.pass);
console.log(JSON.stringify({suite:'WR-1C.2 Deployment Verification',total:checks.length,passed:checks.length-failed.length,failed:failed.length,checks},null,2));
process.exit(failed.length?1:0);
