#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const workspace = read('assets/js/agent-workspace.js');
const workspaceHtml = read('agent/workspace/index.html');
const reportEngine = read('assets/js/report-engine.js');
const accessClient = read('assets/js/prospect-report-access.js');
const changelog = read('CHANGELOG.md');
const roadmap = read('ROADMAP.md');
const readme = read('README.md');

check('release version remains compatible after RPT-1.3', ['3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && ['3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(pkg.version));
check('RPT-1.3 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-RPT-1.3.md')) && fs.existsSync(path.join(root, 'AGENT-WORKSPACE-CUSTOMER-REPORT-RECOVERY.md')));
check('RPT-1.3 changelog entry exists', changelog.includes('## 3.20.8 — RPT-1.3 Agent Workspace Customer Report Recovery'));
check('RPT-1.3 roadmap entry is complete', roadmap.includes('RPT-1.3 Agent Workspace Customer Report Recovery — Complete (3.20.8)'));
check('README identifies Cloudflare runtime', readme.includes('Production runtime remains Cloudflare Pages Functions plus D1'));

check('Workspace report links mark explicit workspace preview', workspace.includes('&workspace_preview=1') && workspace.includes('#local_preview=1&workspace_preview=1'));
check('Workspace caches the active report before navigation', workspace.includes("window.localStorage?.setItem?.('coveragefit_home_report', JSON.stringify(report))"));
check('Workspace blocks navigation if preview preparation fails', workspace.includes("event?.preventDefault?.()") && workspace.includes('customer report preview could not be prepared'));
check('Workspace still logs customer report activity', workspace.includes("remoteInbox.logActivity(record.id, 'customer_report_opened')"));

check('Report route recognizes workspace preview flag', reportEngine.includes("hashParams.get('workspace_preview') === '1'"));
check('Report route attempts durable retrieval before Workspace fallback', reportEngine.indexOf('accessApi.retrieve(reportId)') < reportEngine.indexOf("if ((!accessResult?.ok || !accessResult?.report)"));
check('Report route recovers from missing durable lookup with prepared Workspace report', reportEngine.includes("(!accessResult?.ok || !accessResult?.report) && (allowLegacyPreview || allowWorkspacePreview)") && reportEngine.includes('workspacePreview: allowWorkspacePreview'));
check('Recovered Workspace report is labeled truthfully', reportEngine.includes("accessStatus.textContent = 'Agent Workspace preview'"));
check('Normal private-link deletion behavior remains unchanged', accessClient.includes("if (error?.code === 'report_unavailable' || error?.status === 404)") && accessClient.includes('removeLocal(id, settings)'));
const hrefBlock = workspace.slice(workspace.indexOf('function customerReportHref'), workspace.indexOf('function cacheCustomerReportPreview'));
check('Workspace fallback does not place customer data in the URL', !hrefBlock.includes('consumer') && !hrefBlock.includes('propertyAddress') && !hrefBlock.includes('email'));

check('Current Agent Workspace copy references Cloudflare', workspaceHtml.includes('configured in Cloudflare') && workspace.includes('configured in Cloudflare'));
check('Current Agent Workspace copy no longer references Netlify', !workspaceHtml.includes('Netlify') && !workspace.includes('configured in Netlify'));
check('Cloudflare Pages Functions remain present', fs.existsSync(path.join(root, 'functions/api/reports/read.js')) && fs.existsSync(path.join(root, 'functions/api/consultations/inbox.js')));
check('Netlify runtime remains removed', !fs.existsSync(path.join(root, 'netlify.toml')) && !fs.existsSync(path.join(root, 'netlify')));

console.log(`RPT-1.3 QA: ${checks.length}/${checks.length} passed`);
