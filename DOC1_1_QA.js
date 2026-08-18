#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const checks = [];

function check(name, pass) {
  assert(pass, name);
  checks.push(name);
}
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }

const version = read('VERSION').trim();
const consultationHtml = read('agent/consultation/index.html');
const consultationCss = read('agent/consultation/consultation.css');
const workspaceSource = read('assets/js/workspace-data.js');
const printEngineSource = read('assets/js/print-engine.js');
const rendererSource = read('assets/js/print-renderers.js');
const executiveSectionSource = read('assets/js/print/sections/executive-summary.js');
const propertySectionSource = read('assets/js/print/sections/property-summary.js');
const guideSectionSource = read('assets/js/print/sections/consultation-guide.js');
const documentSource = read('assets/js/consultation-document.js');
const changelog = read('CHANGELOG.md');
const roadmap = read('ROADMAP.md');

check('release version remains compatible after DOC-1.1', ['3.19.29','3.19.31','3.20.0','3.20.1','3.20.2','3.20.4','3.20.5','3.20.6','3.20.7','3.20.8','3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version));
check('DOC-1.1 changelog entry exists', changelog.includes('DOC-1.1 Consultation Document Production Audit and Compression'));
check('DOC-1.1 roadmap entry is complete', roadmap.includes('DOC-1.1 Consultation Document Production Audit and Compression — Complete (3.19.29)'));
check('DOC-1.1 sprint documentation exists', fs.existsSync(path.join(root, 'SPRINT-DOC-1.1.md')));
check('DOC-1.1 print certification exists', fs.existsSync(path.join(root, 'DOC1_1_PRINT_CERTIFICATION.md')));

check('consultation route exposes optional cover control', consultationHtml.includes('id="includeCoverPage"') && consultationHtml.includes('Include cover page'));
check('consultation route loads consolidated guide model and section', consultationHtml.includes('/assets/js/print/models/consultation-guide-model.js') && consultationHtml.includes('/assets/js/print/sections/consultation-guide.js'));
check('consultation route no longer loads standalone recommendation print section', !consultationHtml.includes('/assets/js/print/sections/recommendations.js'));
check('consultation route no longer loads standalone checklist print section', !consultationHtml.includes('/assets/js/print/sections/consultation-checklist.js'));
check('consultation route no longer loads standalone timeline print section', !consultationHtml.includes('/assets/js/print/sections/consultation-timeline.js'));
check('optional cover control is styled in the active route', consultationCss.includes('.document-toolbar__option'));

check('workspace data maps replacement-cost aliases', workspaceSource.includes("['replacementCost', 'reconstructionCost', 'dwellingLimit', 'coverageA', 'rebuildValue']"));
check('workspace data maps current premium', workspaceSource.includes("currentPremium: firstValue(['currentPremium', 'annualPremium', 'premium'])"));
check('workspace data maps renewal and expiration dates', workspaceSource.includes("renewalDate: firstValue(['renewalDate', 'expirationDate', 'policyExpiration', 'cancellationDate'])"));
check('print engine retains recommendation explanations', printEngineSource.includes('explanation: text(item?.explanation || item?.clientExplanation || item?.summary'));
check('print engine retains conversation questions', printEngineSource.includes('conversationStarter: text(item?.conversationStarter || item?.discussionQuestion || item?.question'));
check('print engine carries consultation context', printEngineSource.includes('consultationContext: normalizeConsultationContext'));
check('year rendering avoids thousands formatting', propertySectionSource.includes("function year(value)") && propertySectionSource.includes("year(m.construction.yearBuilt)") && !propertySectionSource.includes("number(m.construction.yearBuilt)"));
check('executive language avoids Review Review generation', !executiveSectionSource.includes('Review Review') && documentSource.includes('includeCover: Boolean(preferences?.includeCover)'));
check('fixed three-page labels are removed by the call-ready guide', !executiveSectionSource.includes('Page 1 of 3') && !propertySectionSource.includes('Page 2 of 3') && !guideSectionSource.includes('Page 3 of 3'));
check('call-ready consultation CSS supersedes three-page compression', rendererSource.includes('CALL_READY_CONSULTATION_CSS') && !rendererSource.includes('CONSULTATION_COMPRESSION_CSS'));
check('consultation guide uses sequential call-ready topic structure', ['What the assessment found','A question to discuss','Why we are asking','What to confirm','Notes'].every(label => guideSectionSource.includes(label)));
check('consultation guide includes decisions open items and next action', guideSectionSource.includes('What the homeowner decided') && guideSectionSource.includes('Open items') && guideSectionSource.includes('Next action'));

const workspaceData = require('./assets/js/workspace-data.js');
const report = {
  version: 'doc11-fixture',
  assessment: 'Home',
  createdAt: '2026-08-02T16:00:00.000Z',
  score: 72,
  status: 'Strong Foundation',
  strongest: 'Liability limits reviewed',
  consumer: {
    firstName: 'Jordan',
    lastName: 'Martinez',
    email: 'jordan@example.com',
    phone: '408-555-0199',
    propertyAddress: '123 Main Street, Fremont, CA 94539',
    reviewContext: 'Premium increased'
  },
  coverage: {
    reconstructionCost: '$825,000',
    allOtherPerilsDeductible: '$5,000',
    insuranceCarrier: 'Example Mutual',
    annualPremium: '$3,420',
    policyExpiration: '2026-09-15'
  },
  strengths: ['Liability limits reviewed', 'Completed a structured property review'],
  recommendations: [
    {
      id: 'dwelling',
      title: 'Review dwelling reconstruction estimate',
      priority: 'High',
      category: 'Property',
      clientExplanation: 'The estimated rebuilding amount should reflect current labor, materials, debris removal, and local construction costs rather than market value.',
      conversationStarter: 'How was the current dwelling limit established, and have major upgrades been completed since then?',
      producerNotes: 'Compare the current Coverage A limit with the carrier reconstruction estimate and explain extended replacement and ordinance or law options.',
      evidence: ['Kitchen remodel completed in 2022']
    },
    {
      id: 'water',
      title: 'Review water-loss prevention and deductible',
      priority: 'High',
      category: 'Water',
      clientExplanation: 'Water losses can create different deductibles, exclusions, and mitigation requirements depending on the cause and policy wording.',
      conversationStarter: 'What leak detection, automatic shutoff, or recent plumbing updates are in place today?',
      producerNotes: 'Confirm water deductible, seepage limitations, backup coverage, and any device requirements before presenting options.',
      evidence: ['Home built in 1998']
    },
    {
      id: 'deductible',
      title: 'Confirm the property deductible',
      priority: 'Review',
      category: 'Property',
      clientExplanation: 'The deductible must be manageable immediately after a loss and should be evaluated alongside the premium difference.',
      conversationStarter: 'What amount would you be comfortable paying out of pocket after a covered loss?',
      producerNotes: 'Present deductible alternatives only after confirming the customer cash-flow preference and current deductible.',
      evidence: ['Customer selected premium increase as review reason']
    }
  ]
};
const propertyProfile = {
  address: '123 Main Street, Fremont, CA 94539',
  yearBuilt: 1998,
  squareFeet: 2140,
  stories: 2,
  constructionType: 'Frame',
  roofType: 'Composition - 2018',
  foundationType: 'Slab',
  detachedStructures: true,
  verifiedByUser: true
};
const snapshot = workspaceData.getSnapshot({ report, propertyProfile, consultationRecord: null });
check('workspace snapshot receives current carrier', snapshot.property.coverage.currentCarrier === 'Example Mutual');
check('workspace snapshot receives reconstruction limit', snapshot.property.coverage.replacementCost === '$825,000');
check('workspace snapshot receives deductible', snapshot.property.coverage.deductible === '$5,000');
check('workspace snapshot receives annual premium', snapshot.property.coverage.currentPremium === '$3,420');
check('workspace snapshot receives renewal date', snapshot.property.coverage.renewalDate === '2026-09-15');
check('workspace recommendation retains explanation', snapshot.recommendations[0].explanation.includes('current labor'));
check('workspace recommendation retains conversation question', snapshot.recommendations[0].conversationStarter.includes('current dwelling limit'));

const registry = require('./assets/js/print-sections.js');
registry.clearRegistry();
require('./assets/js/print/sections/executive-summary.js');
require('./assets/js/print/sections/property-summary.js');
require('./assets/js/print/sections/consultation-guide.js');
global.CoverageFitPrintSectionRegistry = registry;
global.CoverageFitPrintVisibilityEngine = require('./assets/js/print-visibility.js');
global.CoverageFitPrintDocumentComposer = require('./assets/js/document-composer.js');
global.CoverageFitPrintReportShell = require('./assets/js/print/report-shell.js');
global.CoverageFitPrintRendererRegistry = require('./assets/js/print-renderers.js');
global.CoverageFitPrintAdapterRegistry = require('./assets/js/print-adapters.js');
const engine = require('./assets/js/print-engine.js');

const recommendations = snapshot.recommendations.map((item, index) => ({
  ...item,
  sourceIds: [item.id],
  order: index + 1
}));
const timelineItems = recommendations.map((item, index) => ({
  id: `plan-${item.id}`,
  phase: 'review',
  type: 'recommendation-topic',
  title: item.title,
  estimatedMinutes: 4,
  objective: item.explanation,
  prompt: item.conversationStarter,
  coachingNote: item.producerNotes,
  evidence: item.evidence,
  sourceIds: [item.id],
  order: index + 1
}));
const conversationPlan = {
  state: 'ready',
  plannerVersion: '1.0.0',
  summary: { topicCount: 3, agendaItemCount: 3, estimatedMinutes: 14, firstPriority: recommendations[0].title },
  sections: [{ id: 'review', title: 'Review', estimatedMinutes: 14, items: timelineItems }],
  items: timelineItems,
  questions: timelineItems.map(item => item.prompt),
  guardrails: ['Confirm against the issued policy.']
};
const checklistItems = recommendations.map((item, index) => ({
  id: `check-${item.id}`,
  sourceItemId: `plan-${item.id}`,
  phaseId: 'review',
  phaseTitle: 'Coverage review',
  order: index + 1,
  title: item.title,
  description: item.explanation,
  prompt: item.conversationStarter,
  coachingNote: item.producerNotes,
  status: 'pending',
  estimatedMinutes: 4,
  required: true,
  recommendationIds: [item.id],
  priority: item.priority,
  evidence: item.evidence
}));
const checklistState = {
  version: '1.0.0',
  summary: { total: 3, completed: 0, active: 0, pending: 3, completionPercent: 0 },
  progress: { total: 3, completed: 0, active: 0, pending: 3, completionPercent: 0, remainingMinutes: 12, completedPhases: 0, totalPhases: 1 },
  currentPhase: 'review',
  remainingMinutes: 12,
  plannerVersion: '1.0.0',
  checklist: { phases: [{ id: 'review', title: 'Coverage review', order: 1 }], items: checklistItems },
  diagnostics: { valid: true }
};

function render(includeCover) {
  return engine.render('html', {
    adapterType: 'home',
    workspaceSnapshot: { ...snapshot, recommendations, executiveSummary: 'The review identified a solid liability foundation and three areas to confirm before comparing options.' },
    conversationPlan,
    checklistState,
    consultationContext: {
      reviewReason: 'Premium increased',
      missingInformation: ['Current declarations page', 'Mortgagee or lender details'],
      decisions: [],
      nextAction: 'Review the current declarations page and prepare a home and auto bundle comparison.',
      stage: 'consultation_scheduled',
      outcome: 'none',
      dispositionNote: '',
      followUp: { state: 'scheduled', dueDate: '2026-08-05', note: 'Call after 4 PM' }
    },
    title: 'Home Protection Consultation',
    preparedBy: 'Dylan Haysbert',
    agency: 'Virginia Tam Insurance Agency',
    consultationDate: '2026-08-02T16:00:00.000Z',
    generatedAt: '2026-08-02T16:10:00.000Z',
    rendererOptions: {
      title: 'Jordan Martinez | Consultation Document | CoverageFit',
      reportShellOptions: {
        title: 'Home Protection Consultation',
        documentLabel: 'Agent Consultation Document',
        reportId: 'consultation-doc11-123',
        consultationDate: '2026-08-02T16:00:00.000Z',
        generatedAt: '2026-08-02T16:10:00.000Z',
        preparedBy: 'Dylan Haysbert',
        agency: 'Virginia Tam Insurance Agency',
        producerTitle: 'Licensed Insurance Producer',
        producerLicense: '4528400',
        producerPhone: '408-FARMERS',
        producerEmail: 'dylan@dylanhaysbert.com',
        confidentialLabel: 'Confidential agent consultation document',
        includeCover,
        includePageNumbers: false
      }
    }
  });
}

const output = render(false);
const html = output.html;
const sectionIds = output.diagnostics?.sectionIds || output.pipeline?.diagnostics?.sectionIds || [];
check('default document renders exactly three working sections', sectionIds.join(',') === 'executive-summary,property-summary,consultation-guide');
check('default document omits standalone cover', !html.includes('data-print-shell="cover"'));
check('default document is no longer limited by deterministic three-page labels', !['Page 1 of 3','Page 2 of 3','Page 3 of 3'].some(label => html.includes(label)));
check('generated document includes contact details and review reason', html.includes('408-555-0199') && html.includes('jordan@example.com') && html.includes('Premium increased'));
check('generated document includes coverage fields', ['$825,000','$5,000','Example Mutual','$3,420','Sep 15, 2026'].every(value => html.includes(value)));
check('generated year is not thousands formatted', html.includes('>1998<') && !html.includes('1,998'));
check('generated document preserves recommendation explanation', html.includes('estimated rebuilding amount should reflect current labor'));
check('generated document preserves conversation question', html.includes('How was the current dwelling limit established'));
check('generated document includes missing information', html.includes('Current declarations page') && html.includes('Mortgagee or lender details'));
check('generated document includes decision closeout and next action', html.includes('Decision summary') && html.includes('prepare a home and auto bundle comparison'));
check('generated document retains the call-ready guide inside the Consultation Record', html.includes('Consultation Record') && html.includes('Priority findings'));
check('generated document omits standalone checklist heading', !html.includes('>Consultation Checklist<'));
check('generated document omits standalone timeline heading', !html.includes('>Consultation Timeline<'));
check('generated document avoids duplicated Review Review wording', !html.includes('Review Review'));
check('print model retains consultation context', output.model.consultationContext.reviewReason === 'Premium increased');
check('print model retains normalized policy data', output.model.propertySummary.coverage.currentCarrier === 'Example Mutual' && output.model.propertySummary.coverage.replacementCost === '$825,000');
check('print output and model are immutable', Object.isFrozen(output) && Object.isFrozen(output.model));

const withCover = render(true);
check('cover can be enabled explicitly', withCover.html.includes('data-print-shell="cover"'));
check('optional cover does not change working section set', (withCover.diagnostics?.sectionIds || []).join(',') === 'executive-summary,property-summary,consultation-guide');

console.log(`DOC-1.1 QA: ${checks.length}/${checks.length} passed`);
