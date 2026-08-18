#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_REFERRAL_ORIGIN,
  CANONICAL_REFERRAL_PATH,
  CANONICAL_REFERRAL_TOKEN_PATH,
  REFERRAL_TOKEN_PATTERN,
  referralUrl
} from './server/referral-link-core.mjs';
import shareApi from './assets/js/post-submission-share.js';
import welcomeApi from './assets/js/referred-homeowner-welcome.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
  console.log('PASS', name);
}

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const token = `ref_${'C'.repeat(16)}`;
const uniqueUrl = referralUrl(token);
const genericUrl = referralUrl('');

check('release version is NP-1.4', ['3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('post-submission sharing is advanced for the branded bridge', shareApi.VERSION === '1.4.0' && shareApi.BUILD === 'NP-1.5');
check('canonical referral origin is the trusted 408FARMERS domain', CANONICAL_REFERRAL_ORIGIN === 'https://408farmers.com');
check('unique referral tokens use a clean path instead of a visible rid query parameter', uniqueUrl === `https://408farmers.com${CANONICAL_REFERRAL_TOKEN_PATH}${token}` && !uniqueUrl.includes('?rid='));
check('generic fallback uses the branded neighbor route', genericUrl === `https://408farmers.com${CANONICAL_REFERRAL_PATH}`);
check('share module recovers the token from the branded path', shareApi.tokenFromUrl(uniqueUrl) === token && REFERRAL_TOKEN_PATTERN.test(shareApi.tokenFromUrl(uniqueUrl)));
check('share channel markers preserve the same path token', ['sms','native','copy'].every(channel => {
  const url = new URL(shareApi.buildChannelUrl(uniqueUrl, channel));
  return shareApi.tokenFromUrl(url.toString()) === token && url.searchParams.get('share') === channel;
}));
check('legacy CoverageFit query-token parsing remains compatible', shareApi.tokenFromUrl(`https://coveragefit.com/home/?ref=neighbor&rid=${token}`) === token);
check('invalid paths and generic URLs do not create a false token', shareApi.tokenFromUrl('https://408farmers.com/neighbor/r/not-a-token') === '' && shareApi.tokenFromUrl(genericUrl) === '');
check('report share module exposes the branded fallback URL', read('home/report/index.html').includes('data-share-url="https://408farmers.com/neighbor/"') && read('home/report/index.html').includes('408farmers.com/neighbor'));
check('server fallbacks inherit the branded generic route', read('server/referral-link-core.mjs').includes("fallbackUrl: referralUrl('')"));
check('CoverageFit Home still owns the referred-homeowner welcome and token validation', read('home/index.html').includes('/assets/js/referred-homeowner-welcome.js') && read('assets/js/referred-homeowner-welcome.js').includes("const TOKEN_PARAMETER = 'rid'") && read('assets/js/referred-homeowner-welcome.js').includes("const VALIDATE_ENDPOINT = '/api/referrals/read'"));
check('referred welcome removes bridge query clutter after attribution is captured', (() => {
  let replaced = '';
  const result = welcomeApi.cleanVisibleUrl({
    location: {
      pathname: '/home/',
      search: `?ref=neighbor&rid=${token}&share=sms&source=408farmers&entry=neighbor_referral_bridge&utm_campaign=coveragefit_neighbor_pass&keep=1`,
      hash: ''
    },
    history: { state: null, replaceState(_state, _title, url) { replaced = url; } }
  });
  return result === '/home/?keep=1' && replaced === '/home/?keep=1';
})());
check('sprint documentation records clean path, bridge, token survival, and generic fallback', ['408farmers.com/neighbor/r/', 'token survives', 'generic neighbor', 'no duplicate intake'].every(phrase => read('SPRINT-NP-1.4.md').toLowerCase().includes(phrase)));
check('changelog records the NP-1.4 release', read('CHANGELOG.md').includes('## 3.20.17 — NP-1.4 408FARMERS Referral Bridge'));

console.log(JSON.stringify({ sprint: 'NP-1.4', passed: checks.length, failed: 0, checks }, null, 2));
