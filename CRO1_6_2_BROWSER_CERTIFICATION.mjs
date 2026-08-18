#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url); const {chromium}=require('playwright');
const root=path.dirname(fileURLToPath(import.meta.url)); const executablePath=process.env.CHROMIUM_PATH;
if(!executablePath||!fs.existsSync(executablePath)){console.error('CHROMIUM_PATH is required.');process.exit(2)}
const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');if(!rel||rel.endsWith('/'))rel+='index.html';const target=path.resolve(root,rel);if(!target.startsWith(`${root}${path.sep}`)||!fs.existsSync(target)){res.writeHead(404).end();return}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});fs.createReadStream(target).pipe(res)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const profile={version:'1.2',firstName:'Avery',lastName:'Nurse',fullName:'Avery Nurse',email:'avery@example.com',phone:'4085550101',propertyAddress:'123 Main Street, San Jose, CA 95118',reviewContext:'Professional eligibility and home coverage review',occupationSegment:'Nurse or RN',address:{formattedAddress:'123 Main Street, San Jose, CA 95118',postalCode:'95118'},integration:{source:'408farmers',entry:'healthcare_eligibility_form',campaign:'Work in Healthcare',launchSurface:'occupation_healthcare'}};
try{
  const context=await browser.newContext({viewport:{width:320,height:700},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(p=>{sessionStorage.setItem('coveragefit_prospect_profile_v1',JSON.stringify(p));localStorage.setItem('coveragefit_prospect_profile_v1',JSON.stringify(p));},profile);
  await page.goto(`${base}/assessment/`,{waitUntil:'commit'});
  await page.waitForSelector('[data-professional-intent="true"]');
  const body=await page.locator('body').innerText();
  check('assessment sustains the original professional intent',body.includes('See which professional discounts may apply.')&&body.includes('verify which Farmers professional discounts may be available during quoting and underwriting'));
  check('per-question progress retains the intent',await page.locator('.professional-intent-progress').innerText()==='Professional discount review');
  check('assessment title stays motivating', (await page.locator('[data-trigger-assessment-title]').innerText()).includes('professional discount review'));
  check('assessment remains reflow safe at 320px',await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  await page.evaluate(()=>{const e=document.getElementById('earlyInsight');e.hidden=false;e.removeAttribute('hidden')});
  await page.waitForFunction(()=>document.getElementById('earlyInsightTitle')?.textContent.includes('discount-verification context'));
  check('checkpoint explains why to continue',(await page.locator('#earlyInsightCopy').innerText()).includes('Dylan'));
  await page.evaluate(()=>{const r=document.getElementById('result');r.style.display='block';r.hidden=false});
  await page.waitForFunction(()=>document.getElementById('resultTitle')?.textContent.includes('ready for Dylan'));
  check('completion fulfills the professional promise',(await page.locator('#resultCopy').innerText()).includes('verify which Farmers professional discounts may be available'));
  check('assessment has no runtime exception',errors.length===0);
  await context.close();

  const reportContext=await browser.newContext({viewport:{width:320,height:700},reducedMotion:'reduce'});const reportPage=await reportContext.newPage();const reportErrors=[];reportPage.on('pageerror',e=>reportErrors.push(e.message));
  const report={assessment:'home',createdAt:new Date().toISOString(),score:82,status:'Strong starting point',reviewContext:profile.reviewContext,prospectProfile:profile,personalizationContext:{journey:{reviewReason:profile.reviewContext,occupationSegment:profile.occupationSegment,entryPoint:profile.integration.entry,campaign:profile.integration.campaign},flags:{hasProfile:true}},consumer:{name:'Avery Nurse',propertyAddress:profile.propertyAddress,reviewContext:profile.reviewContext},strengths:['Completed a structured review'],priorities:[],answers:[]};
  await reportPage.addInitScript(value=>localStorage.setItem('coveragefit_home_report',JSON.stringify(value)),report);
  await reportPage.goto(`${base}/home/report/#local_preview=1`,{waitUntil:'commit'});
  await reportPage.waitForFunction(()=>document.querySelector('[data-prospect-title]')?.textContent.includes('Professional Discount Review'));
  check('private Snapshot retains the professional purpose',(await reportPage.locator('[data-prospect-reason]').innerText())==='Professional Discount Eligibility Review');
  check('private Snapshot points to Dylan verification',(await reportPage.locator('aside[data-professional-intent]').innerText()).includes('Dylan'));
  check('private Snapshot remains reflow safe at 320px',await reportPage.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  check('private Snapshot has no runtime exception',reportErrors.length===0);
  await reportContext.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
console.log(JSON.stringify({suite:'CRO-1.6.2 Browser Certification',passed:checks.length,failed:0,checks},null,2));
