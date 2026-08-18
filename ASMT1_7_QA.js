#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = __dirname;
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = rel => crypto.createHash('sha256').update(read(rel)).digest('hex');

function createStorage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return {
    getItem(key) { return rows.has(key) ? rows.get(key) : null; },
    setItem(key, value) { rows.set(key, String(value)); },
    removeItem(key) { rows.delete(key); },
    dump() { return Object.fromEntries(rows); }
  };
}

function createElement(id = '') {
  const listeners = new Map();
  return {
    id,
    open: false,
    textContent: '',
    innerHTML: '',
    attributes: {},
    classList: { add() {}, remove() {} },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatch(type, extra = {}) {
      for (const fn of listeners.get(type) || []) fn({ target: this, ...extra });
    },
    setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'open') this.open = true; },
    removeAttribute(name) { delete this.attributes[name]; if (name === 'open') this.open = false; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    scrollIntoView() {}
  };
}

function runContinuity({ draft = null, search = '', sessionId = 'session-1', now = Date.now() } = {}) {
  const ids = [
    'saveExitBtn','saveExitDialog','continueReviewBtn','confirmSaveExitBtn',
    'resumeDraftDialog','continueDraftBtn','startOverDraftBtn','resumeDraftProgress','resumeDraftDetail'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, createElement(id)]));
  const storageKey = 'coveragefit_assessment_draft_v1:home';
  const localSeed = draft ? { [storageKey]: JSON.stringify(draft) } : {};
  const localStorage = createStorage(localSeed);
  const sessionStorage = createStorage();
  const events = [];
  const location = {
    href: `https://coveragefit.test/assessment/${search}`,
    pathname: '/assessment/',
    search,
    hash: '',
    replaced: '',
    replace(value) { this.replaced = value; }
  };
  const history = { last: '', replaceState(_a, _b, value) { this.last = value; } };
  const document = {
    getElementById(id) { return elements[id] || null; },
    querySelector(selector) {
      if (selector === '.question, [data-property-confirmation]') return createElement('scroll-target');
      return null;
    }
  };

  class FakeDate extends Date {
    constructor(value) { super(value === undefined ? now : value); }
    static now() { return now; }
  }

  const context = {
    console,
    document,
    localStorage,
    sessionStorage,
    location,
    history,
    URLSearchParams,
    Date: FakeDate,
    requestAnimationFrame(fn) { fn(); },
    window: null
  };
  context.window = context;
  context.COVERAGEFIT_CONFIG = { slug: 'home' };
  context.CoverageFitPersonalization = { get: () => ({ sessionId }) };
  context.CoverageFitAnalytics = { track: (event, properties) => events.push({ event, properties }) };

  vm.runInNewContext(read('assets/js/assessment-continuity.js'), context, { filename: 'assessment-continuity.js' });
  return { context, elements, localStorage, sessionStorage, events, location, history, storageKey };
}

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const html = read('assessment/index.html');
const continuity = read('assets/js/assessment-continuity.js');
const engine = read('assets/js/assessment-engine.js');
const property = read('assets/js/property-confirmation.js');
const pauseNotice = read('assets/js/assessment-pause-notice.js');
const css = read('assets/css/pilot.css');

check('release remains compatible after ASMT-1.7', /^3\.20\.(?:9|[1-9][0-9]+)$/.test(version) && pkg.version === version);
check('Save & Exit is visible in the assessment header', html.includes('id="saveExitBtn"') && html.includes('Save &amp; Exit'));
check('pause confirmation dialog exists', html.includes('id="saveExitDialog"') && html.replace(/\s+/g, ' ').includes('A Protection Score, completed consultation, or producer notification will not be created'));
check('resume dialog offers Continue and Start Over', html.includes('id="resumeDraftDialog"') && html.includes('id="continueDraftBtn"') && html.includes('id="startOverDraftBtn"'));
check('continuity module loads before property confirmation and assessment engine', html.indexOf('/assets/js/assessment-continuity.js') < html.indexOf('/assets/js/property-confirmation.js') && html.indexOf('/assets/js/property-confirmation.js') < html.indexOf('/assets/js/assessment-engine.js'));
check('draft TTL is exactly seven days', continuity.includes('const TTL_MS = 7 * 24 * 60 * 60 * 1000'));
check('draft is localStorage-only', continuity.includes('localStorage.setItem(storageKey') && !continuity.includes('fetch('));
check('draft module does not call report, consultation, or notification services', !/CoverageFitProspectReports|CoverageFitConsultationRecords|CoverageFitRemoteConsultations|producer-notification|FormData/.test(continuity));
check('continuous answer saving is integrated for choice answers', engine.includes("saveDraft('answer_selected')"));
check('continuous answer saving is integrated for text answers', engine.includes("saveDraft('answer_updated')"));
check('current question key and index are persisted', engine.includes('currentQuestionKey') && engine.includes('currentIndex: current'));
check('exact saved selections are restored', engine.includes('restoredDraft.selections') && engine.includes('JSON.parse(JSON.stringify(restoredDraft.selections))'));
check('saved question is restored by stable key before index fallback', engine.includes('questions.findIndex(question => question.key === restoredDraft.currentQuestionKey)'));
check('early insight state is persisted and restored compatibly', engine.includes('earlyInsightShown') && engine.includes("restoredView === 'earlyInsight'"));
check('property confirmation state is saved', property.includes('propertyConfirmed: true') && property.includes('propertyProfileId'));
check('confirmed property step is skipped on resume', property.includes('resumeConfirmedProperty') && property.includes("document.body.classList.add('property-confirmed')"));
check('completion clears the draft through continuity contract', engine.includes('continuity?.markCompleted?.'));
check('incomplete-question guard remains before finish', engine.includes("findIndex(question => question.required !== false && !selections[question.key])") && engine.indexOf('firstMissing >= 0') < engine.indexOf('finish();'));
check('contact submission guard remains intact', (engine.match(/firstMissing/g) || []).length >= 4);
check('paused, resumed, expired, restarted, and completed events are tracked', [
  'assessment_paused','assessment_resumed','assessment_draft_expired','assessment_restarted','assessment_continuity_completed'
].every(event => continuity.includes(`'${event}'`)));
check('Home page can show a review-saved continuation notice', pauseNotice.includes('assessmentPausedNotice') && pauseNotice.includes('Continue My Review'));
check('continuity UI styles exist', css.includes('.assessment-save-exit') && css.includes('.assessment-dialog') && css.includes('.assessment-paused-notice'));

const fresh = runContinuity();
check('fresh session exposes continuity API', fresh.context.CoverageFitAssessmentContinuity?.VERSION === '1.0.0');
check('fresh session does not create an empty draft', fresh.localStorage.getItem(fresh.storageKey) === null);

const saved = fresh.context.CoverageFitAssessmentContinuity.save({
  currentIndex: 2,
  currentQuestionKey: 'ordinanceLaw',
  questionCount: 11,
  selections: { dwelling: { index: 1, label: 'More than two years ago' } },
  propertyConfirmed: true,
  startedAt: Date.now() - 10000
});
check('draft save preserves exact question and answer selection', saved.currentQuestionKey === 'ordinanceLaw' && saved.selections.dwelling.index === 1);
check('draft save sets seven-day expiration', Date.parse(saved.expiresAt) - Date.parse(saved.updatedAt) === 7 * 24 * 60 * 60 * 1000);
check('draft contains no score, report, consultation, or notification payload', !('score' in saved) && !('report' in saved) && !('consultationRecord' in saved) && !('producerNotification' in saved));

const returnDraft = {
  schemaVersion: '1.0', continuityVersion: '1.0.0', assessment: 'home', sessionId: 'session-1',
  createdAt: new Date(Date.now() - 60000).toISOString(), updatedAt: new Date(Date.now() - 30000).toISOString(),
  expiresAt: new Date(Date.now() + 60000).toISOString(), status: 'paused', paused: true,
  currentIndex: 3, currentQuestionKey: 'water', questionCount: 11,
  selections: { dwelling: { index: 0, label: 'Within the past two years' }, water: { index: 1, label: 'Some details unclear' } },
  answerCount: 2, propertyConfirmed: true, earlyInsightShown: true
};
const returning = runContinuity({ draft: returnDraft });
check('returning session opens the resume dialog', returning.elements.resumeDraftDialog.open === true);
check('resume dialog reports the saved question position', returning.elements.resumeDraftProgress.textContent === 'Question 4 of 11');
returning.elements.continueDraftBtn.dispatch('click');
const resumed = JSON.parse(returning.localStorage.getItem(returning.storageKey));
check('Continue changes draft from paused to active', resumed.paused === false && resumed.status === 'active' && Boolean(resumed.resumedAt));
check('Continue tracks resumed state', returning.events.some(row => row.event === 'assessment_resumed'));

returning.elements.saveExitBtn.dispatch('click');
check('Save & Exit button opens confirmation dialog', returning.elements.saveExitDialog.open === true);
returning.elements.confirmSaveExitBtn.dispatch('click');
const paused = JSON.parse(returning.localStorage.getItem(returning.storageKey));
check('confirmed exit persists paused status', paused.paused === true && paused.status === 'paused' && Boolean(paused.pausedAt));
check('confirmed exit returns to CoverageFit Home', returning.location.href === '/home/?review_saved=1');
check('confirmed exit tracks paused state', returning.events.some(row => row.event === 'assessment_paused'));

const expiredDraft = { ...returnDraft, expiresAt: new Date(Date.now() - 1).toISOString() };
const expired = runContinuity({ draft: expiredDraft });
check('expired draft is removed', expired.localStorage.getItem(expired.storageKey) === null);
check('expired draft event is tracked', expired.events.some(row => row.event === 'assessment_draft_expired'));

const restartRun = runContinuity({ draft: returnDraft });
restartRun.elements.startOverDraftBtn.dispatch('click');
check('Start Over clears the saved draft', restartRun.localStorage.getItem(restartRun.storageKey) === null);
check('Start Over reloads the blank assessment route', restartRun.location.replaced === '/assessment/?restart=1');
check('Start Over tracks restarted state', restartRun.events.some(row => row.event === 'assessment_restarted'));

const completeRun = runContinuity({ draft: returnDraft });
completeRun.context.CoverageFitAssessmentContinuity.markCompleted({ answerCount: 11, questionCount: 11, durationSeconds: 180 });
check('successful completion clears the draft', completeRun.localStorage.getItem(completeRun.storageKey) === null);
check('successful completion tracks continuity completion', completeRun.events.some(row => row.event === 'assessment_continuity_completed'));

check('Protection Score implementation is byte-for-byte unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('Home assessment questions and weights are byte-for-byte unchanged', hash('home/assessment-config.js') === 'f4f39337871c7ce6952b77607470dcef963a039b2e467eaedfe5e35b6348553b');
check('Agent Workspace normalization retains assessment compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('consultation inbox retains producer notification compatibility after additive GC-1.6 recommendation persistence', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('ASMT-1.7 documentation exists', fs.existsSync(path.join(root, 'ASSESSMENT-CONTINUITY-AND-RESPECTFUL-EXIT.md')) && fs.existsSync(path.join(root, 'SPRINT-ASMT-1.7.md')));
check('roadmap marks ASMT-1.7 complete', read('ROADMAP.md').includes('ASMT-1.7 Assessment Continuity and Respectful Exit — Complete (3.20.9)'));
check('changelog contains ASMT-1.7 release', read('CHANGELOG.md').includes('## 3.20.9 — ASMT-1.7 Assessment Continuity and Respectful Exit'));

console.log(`ASMT-1.7 QA: ${checks.length}/${checks.length} passed`);
