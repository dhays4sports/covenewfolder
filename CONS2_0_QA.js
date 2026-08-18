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
const readme = read('README.md');
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const workspace = read('assets/js/agent-workspace.js');
const pipeline = require('./assets/js/consultation-pipeline-summary.js');

check('release version remains compatible after CONS-2.0', ['3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('changelog documents CONS-2.0', changelog.includes('CONS-2.0 Consultation Pipeline Trend and Export'));
check('roadmap marks CONS-2.0 complete', roadmap.includes('CONS-2.0 Consultation Pipeline Trend and Export — Complete (3.19.28)'));
check('README documents trend and export', readme.includes('CONS-2.0 Pipeline trend and CSV export'));
check('CONS-2.0 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-CONS-2.0.md')));
check('Workspace exposes trend chart and detail table', ['pipelineTrendChart','pipelineTrendTableWrap','pipelineTrendTableBody','pipelineTrendMeta'].every(id => html.includes(`id="${id}"`)));
check('Workspace exposes a visible CSV download action', html.includes('id="pipelineExportCsv"') && html.includes('Download pipeline CSV'));
check('Workspace explains cohort conversion semantics', html.includes('Each bucket groups reviews by received date and shows their current policy-bound conversion.'));
check('Workspace includes truthful trend and export status regions', html.includes('id="pipelineTrendEmpty"') && html.includes('id="pipelineExportMessage"'));
check('Workspace renders the pipeline trend from the active summary', workspace.includes('renderPipelineTrend(summary)') && workspace.includes('pipelineTrendSvg(trend)'));
check('Workspace downloads a UTF-8 CSV through Blob', workspace.includes("new window.Blob([result.csv], { type: 'text/csv;charset=utf-8' })") && workspace.includes('createObjectURL(blob)'));
check('Workspace uses the selected reporting range for CSV generation', workspace.includes('pipelineSummary?.buildCsv?.(records, pipelineDateOptions())'));
check('Workspace revokes generated object URLs', workspace.includes('clearPipelineExportObjectUrl') && workspace.includes('revokeObjectURL'));
check('Workspace registers the CSV action through managed listeners', workspace.includes("listen(byId('pipelineExportCsv'), 'click', handlePipelineCsvExport)"));
check('Trend layout is responsive and print-independent', css.includes('CONS-2.0 — consultation pipeline trend and CSV export') && css.includes('.consultation-pipeline__trend-chart') && css.includes('@media (max-width: 620px)'));
check('Trend visual exposes separate volume and conversion series', css.includes('.consultation-pipeline__trend-bar') && css.includes('.consultation-pipeline__trend-line') && css.includes('.consultation-pipeline__trend-point'));

check('pipeline module advanced to 1.2.0', pipeline.VERSION === '1.2.0');
check('pipeline module exposes adaptive trend granularities', pipeline.TREND_GRANULARITIES.map(item => item.key).join(',') === 'day,week,month,quarter,year');
check('pipeline module exposes stable CSV columns', pipeline.CSV_COLUMNS.length >= 20 && pipeline.CSV_COLUMNS[0].label === 'Consultation ID');
check('pipeline module exposes trend and CSV builders', typeof pipeline.buildTrend === 'function' && typeof pipeline.buildCsv === 'function');

const records = [
  {
    id: 'bound-new',
    createdAt: '2026-08-02T18:00:00.000Z',
    customer: { name: '=HYPERLINK("https://example.com")', email: 'dylan@example.com', phone: '408-555-0100', propertyAddress: '123 Main St, San Jose, CA', reviewContext: 'Buying a home' },
    assessment: { score: 88 },
    integration: { source: '408FARMERS', campaign: 'home_purchase', referralSource: 'Realtor', entry: 'home_form' },
    disposition: { stage: 'closed', outcome: 'policy_bound', note: 'Bound, "preferred" option', closedAt: '2026-08-02T20:00:00.000Z' }
  },
  {
    id: 'closed-retained',
    remote: {
      serverBacked: true,
      status: 'acknowledged',
      deliveredAt: '2026-08-01T18:00:00.000Z',
      openedAt: '2026-08-01T19:00:00.000Z',
      acknowledgedAt: '2026-08-01T20:00:00.000Z',
      followUp: { state: 'completed', scheduledAt: '2026-08-01T21:00:00.000Z', note: 'Reviewed renewal\nwith client' },
      disposition: { stage: 'closed', outcome: 'current_carrier_retained', closedAt: '2026-08-01T22:00:00.000Z' }
    },
    createdAt: '2026-07-31T18:00:00.000Z',
    customer: { name: 'Jane "JJ" Jones', email: 'jane@example.com' },
    integration: { campaign: 'renewal', referralSource: 'Lender', source: '408FARMERS' },
    assessment: { score: 72 }
  },
  {
    id: 'open-contacted',
    createdAt: '2026-07-30T18:00:00.000Z',
    customer: { name: 'Taylor Smith', phone: '510-555-0100' },
    integration: { campaign: 'premium_increase', entry: 'home_form', source: '408FARMERS' },
    disposition: { stage: 'contact_attempted', outcome: 'none' }
  },
  {
    id: 'open-received',
    createdAt: '2026-07-27T18:00:00.000Z',
    customer: { name: 'Chris Lee' },
    integration: {},
    disposition: { stage: 'review_received', outcome: 'none' }
  },
  {
    id: 'older',
    createdAt: '2026-06-01T18:00:00.000Z',
    customer: { name: 'Older Record' },
    integration: { campaign: 'legacy' },
    disposition: { stage: 'closed', outcome: 'deferred' }
  }
];

const seven = pipeline.buildTrend(records, { range: '7d', now: '2026-08-02T21:00:00.000Z' });
check('seven-day reporting uses daily buckets', seven.granularity === 'day' && seven.label === 'Daily');
check('seven-day trend includes every day in the selected window', seven.buckets.length === 7);
check('trend retains empty date buckets', seven.buckets.some(bucket => bucket.consultations === 0));
check('trend totals only selected records', seven.buckets.reduce((sum, bucket) => sum + bucket.consultations, 0) === 4);
check('trend counts current closed records by received-date cohort', seven.buckets.reduce((sum, bucket) => sum + bucket.closed, 0) === 2);
check('trend counts policy-bound outcomes by received-date cohort', seven.buckets.reduce((sum, bucket) => sum + bucket.bound, 0) === 1);
const boundBucket = seven.buckets.find(bucket => bucket.bound === 1);
check('trend calculates policy-bound conversion from consultations', boundBucket.conversionRate === 100 && boundBucket.closeRate === 100);
const deliveredLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(records[1].remote.deliveredAt));
check('trend uses the remote delivered timestamp before local created time', seven.buckets.some(bucket => bucket.label.includes(deliveredLabel) && bucket.consultations === 1));
check('trend output is immutable', Object.isFrozen(seven) && Object.isFrozen(seven.buckets) && Object.isFrozen(seven.buckets[0]));
const partlyUndated = pipeline.buildTrend([...records, { id: 'undated', disposition: { stage: 'review_received', outcome: 'none' } }], { range: 'all' });
check('trend reports records without a received date truthfully', partlyUndated.selectedTotal === 6 && partlyUndated.datedTotal === 5 && partlyUndated.undatedTotal === 1);

const thirty = pipeline.buildTrend(records, { range: '30d', now: '2026-08-02T21:00:00.000Z' });
check('thirty-day reporting uses weekly buckets', thirty.granularity === 'week' && thirty.buckets.length >= 4 && thirty.buckets.length <= 6);
const yearlyRecords = Array.from({ length: 12 }, (_, month) => ({ id: `m-${month}`, createdAt: `2025-${String(month + 1).padStart(2, '0')}-15T18:00:00.000Z`, disposition: { stage: month % 2 ? 'closed' : 'review_received', outcome: month % 4 === 1 ? 'policy_bound' : 'none' } }));
const yearTrend = pipeline.buildTrend(yearlyRecords, { range: 'custom', startDate: '2025-01-01', endDate: '2025-12-31', now: '2026-08-02T21:00:00.000Z' });
check('annual custom reporting uses monthly buckets', yearTrend.granularity === 'month' && yearTrend.buckets.length === 12);
check('summary includes the same trend contract', pipeline.summarize(records, { range: '7d', now: '2026-08-02T21:00:00.000Z' }).trend.buckets.length === 7);
check('summary exposes consultation-to-bound conversion rate', pipeline.summarize(records, { range: '7d', now: '2026-08-02T21:00:00.000Z' }).conversionRate === 25);

const csv = pipeline.buildCsv(records, { range: '7d', now: '2026-08-02T21:00:00.000Z' });
check('CSV export succeeds for a valid selected range', csv.valid === true && csv.rowCount === 4);
check('CSV begins with a UTF-8 BOM', csv.csv.charCodeAt(0) === 0xFEFF);
check('CSV contains operational pipeline headers', ['Consultation ID','Customer name','Consultation stage','Final outcome','Campaign','Protection score'].every(label => csv.csv.includes(`"${label}"`)));
check('CSV excludes records outside the selected range', !csv.csv.includes('Older Record'));
check('CSV sorts newest received records first', csv.rows[0].consultationId === 'bound-new' && csv.rows[csv.rows.length - 1].consultationId === 'open-received');
check('CSV neutralizes spreadsheet formulas', csv.csv.includes("\"'=HYPERLINK("));
check('CSV escapes embedded quotes', csv.csv.includes('Jane ""JJ"" Jones'));
check('CSV safely quotes multiline notes', csv.csv.includes('Reviewed renewal\nwith client'));
check('CSV includes server and local record types truthfully', csv.csv.includes('Server-backed') && csv.csv.includes('Browser-local'));
const repeatedCsv = pipeline.buildCsv(records, { range: '7d', now: '2026-08-02T21:00:00.000Z' });
check('CSV filename is deterministic and contains no customer PII', csv.filename === repeatedCsv.filename && /^coveragefit-consultation-pipeline_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}_exported-\d{4}-\d{2}-\d{2}\.csv$/.test(csv.filename) && !csv.filename.includes('dylan'));
check('CSV export rows and result are immutable', Object.isFrozen(csv) && Object.isFrozen(csv.rows) && Object.isFrozen(csv.rows[0]));
const invalid = pipeline.buildCsv(records, { range: 'custom', startDate: '', endDate: '' });
check('invalid date ranges fail without a misleading CSV', invalid.valid === false && invalid.rowCount === 0 && invalid.csv === '' && invalid.error.includes('both'));
const empty = pipeline.buildCsv(records, { range: 'custom', startDate: '2024-01-01', endDate: '2024-01-31', now: '2026-08-02T21:00:00.000Z' });
check('empty valid ranges still produce a header-only CSV contract', empty.valid === true && empty.rowCount === 0 && empty.csv.split('\r\n').length === 1);

console.log(`CONS-2.0 QA: ${checks.length}/${checks.length} passed`);
