#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.dirname(fileURLToPath(import.meta.url));
let server = null;
let baseUrl = process.env.COVERAGEFIT_QA_BASE_URL;
if (!baseUrl) {
  server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let target = path.join(root, pathname);
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      const type = target.endsWith('.js') ? 'text/javascript' : target.endsWith('.css') ? 'text/css' : 'text/html';
      response.writeHead(200, { 'Content-Type': type });
      createReadStream(target).pipe(response);
    } catch (_) {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || '/tmp/cf-chromium';
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

async function answerThroughQuestionTwo() {
  await page.locator('#answers .answer').first().click();
  await page.click('#nextBtn');
  await page.waitForFunction(() => document.querySelector('#stepLabel')?.textContent?.startsWith('Question 2'));

  const startedAt = Date.now();
  await page.locator('#answers .answer').first().click({ timeout: 2000 });
  await page.waitForFunction(() => !document.querySelector('#earlyInsight')?.hidden, null, { timeout: 2000 });
  const clickDurationMs = Date.now() - startedAt;
  assert(clickDurationMs < 1000, `Question 2 answer blocked the main thread for ${clickDurationMs}ms`);
  assert.equal(await page.locator('#nextBtn').isEnabled(), true);
  return clickDurationMs;
}

try {
  await page.goto(`${baseUrl}/assessment/?restart=1`, { waitUntil: 'networkidle' });
  await page.fill('#propertyLine1', '123 Main Street');
  await page.fill('#propertyCity', 'Fremont');
  await page.fill('#propertyState', 'CA');
  await page.fill('#propertyPostalCode', '94539');
  await page.click('#propertyConfirmationForm button[type="submit"]');

  const genericDurationMs = await answerThroughQuestionTwo();
  assert.equal(await page.locator('#earlyInsightTitle').textContent(), 'You’re already narrowing the coverage questions most worth checking.');
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => document.querySelector('#nextBtn')?.disabled), false);

  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`${baseUrl}/transition/?source=408farmers&entry=healthcare_eligibility_form&assessment=home&next=%2Fassessment%2F&prefill=1&handoff_version=1&sender_build=408-FLOW-1.5&handoff_contract=coveragefit-handoff-v1&lead_captured=true&lead_capture_status=confirmed&contact_consent=true&first_name=Alex&last_name=Rivera&email=alex%40example.com&phone=4085550188&property_address=123%20Main%20Street%2C%20Fremont%2C%20CA%2094539&property_street=123%20Main%20Street&property_city=Fremont&property_state=CA&property_zip=94539&property_country=US&occupation_segment=Nurse%20or%20RN&review_context=Professional%20eligibility%20and%20home%20coverage%20review`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/assessment/**', { timeout: 10000 });
  await page.waitForSelector('#propertyQuickConfirm:not([hidden])', { timeout: 3000 });
  assert.equal(await page.locator('#propertyQuickAddress').textContent(), '123 Main Street, Fremont, CA 94539');
  await page.click('#propertyQuickConfirmBtn');
  const handoffDurationMs = await answerThroughQuestionTwo();
  assert.equal(await page.locator('#earlyInsight').isVisible(), true);
  assert.deepEqual(pageErrors, []);

  console.log(`CoverageFit browser QA: generic ${genericDurationMs}ms; confirmed 408FARMERS handoff ${handoffDurationMs}ms`);
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
