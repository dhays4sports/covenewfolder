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

check('release version remains compatible after CONS-1.8', ['3.19.26','3.19.27','3.19.28','3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('changelog documents CONS-1.8', changelog.includes('CONS-1.8 Consultation Pipeline Summary and Outcome Reporting'));
check('roadmap marks CONS-1.8 complete', roadmap.includes('CONS-1.8 Consultation Pipeline Summary and Outcome Reporting — Complete (3.19.26)'));
check('CONS-1.8 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-CONS-1.8.md')));
check('pipeline summary module is loaded before Workspace', workspaceHtml.indexOf('/assets/js/consultation-pipeline-summary.js') > 0 && workspaceHtml.indexOf('/assets/js/consultation-pipeline-summary.js') < workspaceHtml.indexOf('/assets/js/agent-workspace.js'));
check('Workspace exposes pipeline summary region', ['consultationPipeline','pipelineTotalCount','pipelineOpenCount','pipelineClosedCount','pipelineBoundCount','pipelineStageList','pipelineOutcomeList'].every(id => workspaceHtml.includes(`id="${id}"`)));
check('Workspace labels synchronized scope and closed outcomes', workspaceHtml.includes('All synchronized records') && workspaceHtml.includes('Closed consultations only'));
check('Workspace renders pipeline and focuses existing stage filter', workspaceSource.includes('renderConsultationPipeline(records)') && workspaceSource.includes('handlePipelineStageClick') && workspaceSource.includes("byId('consultationStageFilter')"));
check('Workspace keeps pipeline reporting separate from record mutation', !workspaceSource.includes('updatePipelineRecord') && !workspaceSource.includes('pipelineStorage'));
check('Pipeline CSS includes responsive metric and report layouts', workspaceCss.includes('.consultation-pipeline__metrics') && workspaceCss.includes('.consultation-pipeline__reports') && workspaceCss.includes('@media (max-width: 620px)'));
check('Pipeline CSS respects reduced motion', workspaceCss.includes('@media (prefers-reduced-motion: reduce)') && workspaceCss.includes('.consultation-pipeline__bar-fill'));
check('summary module exposes compatible version', ['1.0.0','1.1.0','1.2.0'].includes(pipeline.VERSION));
check('summary module defines every workflow stage', pipeline.STAGES.length === 7 && pipeline.STAGES.some(item => item.key === 'closed'));
check('summary module defines every final outcome', pipeline.OUTCOMES.length === 7 && pipeline.OUTCOMES.some(item => item.key === 'policy_bound'));

const records = [
  { id: '1', disposition: { stage: 'review_received', outcome: 'none' } },
  { id: '2', disposition: { stage: 'contact_attempted', outcome: 'none' } },
  { id: '3', disposition: { stage: 'consultation_scheduled', outcome: 'none' } },
  { id: '4', disposition: { stage: 'proposal_prepared', outcome: 'none' } },
  { id: '5', disposition: { stage: 'closed', outcome: 'policy_bound' } },
  { id: '6', remote: { disposition: { stage: 'closed', outcome: 'current_carrier_retained' } }, disposition: { stage: 'review_received', outcome: 'none' } },
  { id: '7', remote: { disposition: { stage: 'closed', outcome: 'declined_price' } } },
  { id: '8', disposition: { stage: 'not-a-stage', outcome: 'policy_bound' } }
];
const summary = pipeline.summarize(records);
check('summary counts all valid records', summary.total === 8);
check('summary reports open versus closed counts', summary.open === 5 && summary.closed === 3);
check('summary reports policy-bound count', summary.bound === 1);
check('summary reports close rate', summary.closeRate === 38);
check('summary reports bound share of closed', summary.boundRate === 33);
check('summary counts each stage', summary.stages.find(item => item.key === 'review_received').count === 2 && summary.stages.find(item => item.key === 'closed').count === 3);
check('summary reports stage percentages against total', summary.stages.find(item => item.key === 'closed').percentage === 38);
check('summary uses remote disposition before local fallback', pipeline.disposition(records[5]).stage === 'closed');
check('summary reports final outcomes only for closed records', summary.outcomes.find(item => item.key === 'policy_bound').count === 1 && summary.outcomes.find(item => item.key === 'current_carrier_retained').count === 1);
check('summary reports outcome shares against closed records', summary.outcomes.find(item => item.key === 'declined_price').percentage === 33);
check('invalid stage normalizes to review received', pipeline.disposition(records[7]).stage === 'review_received' && pipeline.disposition(records[7]).outcome === 'none');
check('empty input returns truthful zero summary', pipeline.summarize(null).total === 0 && pipeline.summarize([]).closeRate === 0);
check('summary result is immutable at top level', Object.isFrozen(summary));
check('stage and outcome arrays are immutable', Object.isFrozen(summary.stages) && Object.isFrozen(summary.outcomes));

console.log(`CONS-1.8 QA: ${checks.length}/${checks.length} passed`);
