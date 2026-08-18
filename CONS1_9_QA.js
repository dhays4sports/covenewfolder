#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];
function check(name, pass) { assert(pass, name); checks.push(name); }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const version = read('VERSION').trim();
const changelog = read('CHANGELOG.md');
const roadmap = read('ROADMAP.md');
const workspaceHtml = read('agent/workspace/index.html');
const workspaceCss = read('agent/workspace/workspace.css');
const workspaceSource = read('assets/js/agent-workspace.js');
const pipeline = require('./assets/js/consultation-pipeline-summary.js');

check('release version remains compatible after CONS-1.9', ['3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('changelog documents CONS-1.9', changelog.includes('CONS-1.9 Consultation Pipeline Date Range and Source Segmentation'));
check('roadmap marks CONS-1.9 complete', roadmap.includes('CONS-1.9 Consultation Pipeline Date Range and Source Segmentation — Complete (3.19.27)'));
check('CONS-1.9 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-CONS-1.9.md')));
check('Workspace exposes bounded date range controls', ['pipelineDateRange','pipelineCustomDates','pipelineDateStart','pipelineDateEnd','pipelineDateMessage'].every(id => workspaceHtml.includes(`id="${id}"`)));
check('Workspace exposes campaign referral and entry breakdowns', ['pipelineCampaignList','pipelineReferralList','pipelineEntryList'].every(id => workspaceHtml.includes(`id="${id}"`)));
check('Workspace includes all-time and bounded preset ranges', ['all','7d','30d','90d','custom'].every(value => workspaceHtml.includes(`value="${value}"`)));
check('Workspace date range scopes pipeline and queue rendering', workspaceSource.includes('pipelineRecordSelection(records, pipelineDateOptions())') && workspaceSource.includes('renderConsultationQueue(records'));
check('Workspace renders all three source segments', workspaceSource.includes("summary.sources?.campaigns") && workspaceSource.includes("summary.sources?.referrals") && workspaceSource.includes("summary.sources?.entries"));
check('Workspace listens for date range changes', workspaceSource.includes("listen(byId('pipelineDateRange'), 'change', handlePipelineDateChange)") && workspaceSource.includes("listen(byId('pipelineDateStart'), 'change', handlePipelineDateChange)"));
check('Date and source UI is responsive', workspaceCss.includes('.consultation-pipeline__date-controls') && workspaceCss.includes('.consultation-pipeline__source-reports') && workspaceCss.includes('@media (max-width: 620px)'));
check('Pipeline module advanced compatibly', ['1.1.0','1.2.0'].includes(pipeline.VERSION));
check('Pipeline module defines bounded presets', pipeline.DATE_RANGES.length === 5 && pipeline.MAX_CUSTOM_RANGE_DAYS === 366);

const records = [
  {
    id: 'recent-bound',
    createdAt: '2026-08-02T10:00:00.000Z',
    integration: { campaign: 'home_purchase', referralSource: 'Realtor', entry: 'home_form', source: '408FARMERS' },
    disposition: { stage: 'closed', outcome: 'policy_bound' }
  },
  {
    id: 'recent-open',
    remote: { deliveredAt: '2026-07-25T12:00:00.000Z', disposition: { stage: 'contact_attempted', outcome: 'none' } },
    createdAt: '2026-07-24T12:00:00.000Z',
    integration: { campaign: 'renewal', referralSource: 'Lender', source: '408FARMERS' }
  },
  {
    id: 'older-closed',
    createdAt: '2026-05-01T10:00:00.000Z',
    integration: { campaign: 'home_purchase', referralSource: '', entry: 'direct' },
    disposition: { stage: 'closed', outcome: 'deferred' }
  },
  {
    id: 'legacy-unattributed',
    createdAt: '2025-01-01T10:00:00.000Z',
    integration: {},
    disposition: { stage: 'review_received', outcome: 'none' }
  }
];

const all = pipeline.summarize(records, { range: 'all', now: '2026-08-02T12:00:00.000Z' });
check('all-time summary retains all records', all.total === 4 && all.availableTotal === 4);
check('all-time campaign segmentation counts repeated campaigns', all.sources.campaigns.find(item => item.key === 'home_purchase').count === 2);
check('source segmentation includes truthful unattributed buckets', all.sources.referrals.some(item => item.label === 'Unattributed') && all.sources.entries.some(item => item.label === 'Unattributed'));
check('entry segmentation falls back to source', all.sources.entries.some(item => item.key === '408farmers' && item.count === 1));
check('source percentages use selected record total', all.sources.campaigns.find(item => item.key === 'home_purchase').percentage === 50);

const thirty = pipeline.summarize(records, { range: '30d', now: '2026-08-02T12:00:00.000Z' });
check('last-30-day range filters older records', thirty.total === 2 && thirty.availableTotal === 4);
check('date-filtered stage and outcome totals remain accurate', thirty.closed === 1 && thirty.open === 1 && thirty.bound === 1);
check('remote delivered timestamp takes priority for range filtering', thirty.sources.campaigns.some(item => item.key === 'renewal'));

const seven = pipeline.filterRecords(records, { range: '7d', now: '2026-08-02T12:00:00.000Z' });
check('last-7-day range is inclusive of the current date window', seven.records.length === 1 && seven.records[0].id === 'recent-bound');

const custom = pipeline.summarize(records, { range: 'custom', startDate: '2026-04-01', endDate: '2026-05-31', now: '2026-08-02T12:00:00.000Z' });
check('custom range includes records inside inclusive bounds', custom.total === 1 && custom.outcomes.find(item => item.key === 'deferred').count === 1);
check('custom range exposes a readable label', custom.range.label.includes('Apr') && custom.range.label.includes('May'));

const missing = pipeline.resolveDateRange({ range: 'custom', startDate: '', endDate: '' });
check('incomplete custom range fails truthfully', missing.valid === false && missing.error.includes('both'));
const reversed = pipeline.resolveDateRange({ range: 'custom', startDate: '2026-08-02', endDate: '2026-08-01' });
check('reversed custom range is rejected', reversed.valid === false && reversed.error.includes('on or before'));
const unbounded = pipeline.resolveDateRange({ range: 'custom', startDate: '2024-01-01', endDate: '2026-08-02' });
check('custom date range is bounded', unbounded.valid === false && unbounded.error.includes('366'));
check('invalid custom range returns no misleading records', pipeline.filterRecords(records, { range: 'custom' }).records.length === 0);
check('summary and source collections are immutable', Object.isFrozen(thirty) && Object.isFrozen(thirty.sources) && Object.isFrozen(thirty.sources.campaigns));

console.log(`CONS-1.9 QA: ${checks.length}/${checks.length} passed`);
