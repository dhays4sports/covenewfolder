#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');
const tagForId = (source, id) => (source.match(new RegExp(`<[^>]+id=\\"${id}\\"[^>]*>`, 'i')) || [''])[0];
const between = (source, start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : '';
};

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const html = read('agent/workspace/index.html');
const css = read('agent/workspace/workspace.css');
const js = read('assets/js/agent-workspace.js');
const cloudflareHandlers = read('server/cloudflare-pages-handlers.mjs');

check('release remains compatible after AW-7.1', ['3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('package description identifies consultation-first workspace', /consultation-first Agent Workspace/i.test(pkg.description));
check('AW-7.1 documentation exists', exists('AGENT-WORKSPACE-CONSULTATION-FIRST.md') && exists('SPRINT-AW-7.1.md'));
check('roadmap marks AW-7.1 complete', read('ROADMAP.md').includes('AW-7.1 Consultation-First Agent Workspace — Complete (3.20.11)'));
check('changelog contains AW-7.1 release', read('CHANGELOG.md').includes('## 3.20.11 — AW-7.1 Consultation-First Agent Workspace'));

check('Workspace exposes Consultation Inbox and Pipeline tabs', ['workspaceTabConsultation','workspaceTabInbox','workspaceTabPipeline'].every(id => html.includes(`id="${id}"`)));
check('Workspace tabs use accessible tab semantics', html.includes('role="tablist"') && (html.match(/role="tab"/g) || []).length === 3 && (html.match(/role="tabpanel"/g) || []).length === 3);
check('Consultation is the selected default tab', tagForId(html, 'workspaceTabConsultation').includes('aria-selected="true"') && !tagForId(html, 'workspaceViewConsultation').includes('hidden'));
check('Inbox and Pipeline panels are hidden by default', tagForId(html, 'workspaceViewInbox').includes('hidden') && tagForId(html, 'workspaceViewPipeline').includes('hidden'));
check('JS defaults to consultation view', js.includes("setWorkspaceView('consultation');"));
check('JS supports keyboard tab navigation', js.includes("['ArrowLeft', 'ArrowRight', 'Home', 'End']") && js.includes('handleWorkspaceTabKeydown'));
check('view changes synchronize aria-selected and tabindex', js.includes("tab.setAttribute?.('aria-selected', String(selected))") && js.includes('tab.tabIndex = selected ? 0 : -1'));
check('view changes announce the active Workspace surface', js.includes('view opened.'));

check('selected consultation begins with compact customer header', html.includes('id="activeCustomerHeader"') && html.includes('Active consultation'));
check('customer header shows name property reason and received state', ['activeCustomerName','activeCustomerProperty','activeCustomerReason','activeCustomerReceived'].every(id => html.includes(`id="${id}"`)));
check('customer header offers call text and email actions', ['customerCallAction','customerTextAction','customerEmailAction'].every(id => html.includes(`id="${id}"`)));
check('customer header offers consultation switching', html.includes('id="chooseConsultationAction"') && html.includes('Choose another'));
check('customer actions are created from the selected record', js.includes('renderCustomerActionHeader(snapshot)') && js.includes('tel:${callablePhone}') && js.includes('sms:${callablePhone}') && js.includes('mailto:${email}'));
check('unavailable customer actions fail closed', js.includes("action.href = enabled ? href : '#'") && js.includes("action.setAttribute?.('aria-disabled', enabled ? 'false' : 'true')"));
check('Choose another opens Inbox view', js.includes("listen(byId('chooseConsultationAction'), 'click', () => setWorkspaceView('inbox'"));

check('consultation is organized into Before During and After phases', ['Before the conversation','During the conversation','After the conversation'].every(label => html.includes(label)));
check('Before phase leads with actionable preparation', html.includes('Know what matters first') && html.includes('What to discuss first'));
check('During phase presents one working flow', html.includes('Follow one working flow'));
check('After phase groups outcome and next step', html.includes('Record the outcome and next step'));
check('supporting contact and property details are collapsible', (html.match(/<details class="workspace-disclosure"/g) || []).length >= 2);

const during = between(html, 'id="consultationDuringTitle"', 'id="consultationAfterTitle"');
check('conversation timeline and checklist share the During phase', during.includes('id="conversationTimeline"') && during.includes('id="checklistSidebar"'));
check('conversation flow uses one combined card', during.includes('workspace-card--consultation-flow') && during.includes('consultation-flow__timeline') && during.includes('consultation-flow__checklist'));
check('timeline wording describes consultation position', html.includes('Where you are in the consultation'));
check('checklist wording describes questions checks and notes', html.includes('Questions, checks, and notes'));
check('timeline and checklist controllers remain active', js.includes("listen(byId('conversationTimeline'), 'click'") && js.includes("listen(byId('checklistSidebar'), 'click'"));
check('existing checklist keyboard behavior remains active', js.includes('handleTimelineKeydown') && js.includes('handleSidebarKeydown'));
check('checklist detail control uses plain working language', js.includes("'Show details'") && js.includes("'Hide details'"));

check('producer evidence headings use plain language', ['What they told us','Check the policy','Ask the homeowner'].every(label => html.includes(label)));
check('producer evidence labels use plain language in JS', js.includes("return 'Homeowner answer'") && js.includes("return 'Check policy'") && js.includes("return 'Ask homeowner'"));
check('evidence handoff status is simplified', js.includes("return 'Ready for conversation'") && js.includes("return 'Policy checks needed'") && js.includes("return 'Questions to ask'"));
check('formal evidence state remains available to runtime rendering', js.includes("item?.evidenceQuality") && js.includes('data-quality='));

const inbox = between(html, 'id="workspaceViewInbox"', 'id="workspaceViewPipeline"');
const pipeline = html.slice(html.indexOf('id="workspaceViewPipeline"'));
check('searchable queue lives in Inbox view', inbox.includes('id="consultationQueueList"') && inbox.includes('id="consultationSearch"'));
check('pipeline reporting lives in Pipeline view', pipeline.includes('id="consultationPipeline"') && pipeline.includes('id="pipelineTotalCount"'));
check('legacy record selector is retained only as hidden compatibility control', inbox.includes('class="workspace-compat-control" hidden') && inbox.includes('id="consultationRecordSelect"'));
check('queue selection returns to the consultation', js.includes("setWorkspaceView('consultation');") && js.includes('Opened consultation record for'));
check('pipeline stage actions focus the Inbox', js.includes("setWorkspaceView('inbox');") && js.includes('Consultation inbox filtered to'));
check('Inbox and Pipeline have truthful empty states', html.includes('id="inboxViewEmpty"') && html.includes('id="pipelineViewEmpty"'));

check('secure inbox setup has a compact disclosure control', html.includes('id="remoteInboxDisclosure"') && html.includes('id="remoteInboxPanel"'));
check('connected inbox collapses automatically', js.includes('if (connected && !remoteInboxExpandedByUser) setRemoteInboxExpanded(false)'));
check('disconnected inbox remains open for setup', js.includes('if (!connected) setRemoteInboxExpanded(true)'));
check('connected inbox shows last synchronization status', js.includes('Connected · Last synced'));
check('producer access key remains session-only explanatory copy', html.includes('key stays in this browser session'));

check('header actions use clear Consultation Document and Client Snapshot labels', html.includes('>Consultation Document</a>') && html.includes('>Client Snapshot</a>'));
check('consultation document and customer report action IDs are preserved', html.includes('id="openConsultationDocument"') && html.includes('id="openCustomerReport"'));
check('follow-up workflow IDs are preserved', ['consultationFollowUpForm','consultationFollowUpDate','consultationFollowUpNote','saveConsultationFollowUp'].every(id => html.includes(`id="${id}"`)));
check('disposition workflow IDs are preserved', ['consultationDispositionForm','consultationStage','consultationOutcome','saveConsultationDisposition'].every(id => html.includes(`id="${id}"`)));
check('notes and activity workflow IDs are preserved', ['consultationNotesActivity','consultationNoteForm','consultationActivityList'].every(id => html.includes(`id="${id}"`)));
check('secure inbox authentication controls are preserved', ['remoteInboxToken','remoteInboxConnect','remoteInboxSync','remoteInboxDisconnect'].every(id => html.includes(`id="${id}"`)));

check('AW-7.1 CSS section exists', css.includes('AW-7.1 — Consultation-first Agent Workspace'));
check('tabs remain visible while navigating long Workspace views', css.includes('.workspace-tabs') && css.includes('position: sticky'));
check('active consultation uses one-column consultation-first layout', css.includes('.workspace-grid--consultation-first') && css.includes('grid-template-columns: minmax(0, 1fr)'));
check('mobile customer actions retain touch-friendly height', css.includes('.active-customer-header__actions .button') && css.includes('min-height: 44px'));
check('mobile consultation flow removes nested scrolling', css.includes('.consultation-flow__checklist .checklist-sidebar__body') && css.includes('overflow: visible'));
check('mobile tabs support horizontal overflow', css.includes('overflow-x: auto'));
check('reduced-motion preference remains supported', css.includes('@media (prefers-reduced-motion: reduce)'));

new vm.Script(js, { filename: 'agent-workspace.js' });
check('Agent Workspace JavaScript parses successfully', true);
check('Protection Score implementation is unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('Workspace normalization remains AW-7.1 compatible after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('consultation record storage retains AW-7.1 compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/consultation-records.js') === '68533998ebdce50e5f551dc30b946475ceda5601522a9352c852815916f0b140');
check('remote consultation authentication retains AW-7.1 compatibility after the additive recommendation endpoint', hash('assets/js/remote-consultations.js') === '779d00356ee151c09a884f2af6d76dfb82265608dc92583739892f8e2c3f6ecf');
check('pipeline computation contract is unchanged', hash('assets/js/consultation-pipeline-summary.js') === '219af792d4811fe21d9e28805999496ac1c7dc87d5f2a97884f0aa978ec22002');
check('conversation planner retains the consultation-flow contract after GC-1.5', hash('assets/js/conversation-planner.js') === '93315ad24415bf04ba411013d68410017187f78085fe925334311c89f37f2cfe');
check('consultation checklist contract is unchanged', hash('assets/js/consultation-checklist.js') === '940e5677e7f8e1ab2fdcec8caa25bbd2dec7b5abc91a923c16c260b3ee5dc9c2');
check('consultation document retains AW-7.1 compatibility', ['b22a2462a2e59f229fc72105b787d54956d50f123aff1704b721b6a09807cc23', '098c9ef6304ef547cd723d2e21d5f394e6b55b93763f5b2bb0e38c352c94e47e', 'b74f512d3b1cc681ada68ed8eb29e74a9b120df6625a49bbf25c7a24a63ead36', '828eb0577b06abba09c7943f9ca6480999975c844c71b856c9d748a0ab223ddc', 'f151252d94de2c796860c274f9e73bf8aab78ef351a3c8974ea91565dac05fb6', 'bc89d45da4e88a13b2103faa4ae09d4520917f2cce89a7d2dbf6c0c4e1dffb16'].includes(hash('assets/js/consultation-document.js')));
check('D1 consultation API retains AW-7.1 compatibility after additive GC-1.6 recommendation persistence', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('Cloudflare route handlers preserve Workspace APIs while adding NP-1.3 referrals', ['consultationSubmit','consultationInbox','consultationStatus','consultationFollowUp','consultationActivity','consultationDisposition','prospectReportCreate','prospectReportRead','referralLinkCreate','referralLinkRead'].every(name => cloudflareHandlers.includes(`export function ${name}`)));
check('producer notification contract is unchanged', hash('server/producer-notification.mjs') === 'cfd1aef3009ca2bb014555fa8498b65e4289a3af276b671474ac2cc7acb0b6a7');
check('D1 migration is unchanged', hash('migrations/0001_ops_cf_1_1.sql') === '1bbbd39be2e30119920c2914308c64ad2e11ca460a8f065cd2e6ec9a05cb53cc');

console.log(`AW-7.1 QA: ${checks.length}/${checks.length} passed`);
