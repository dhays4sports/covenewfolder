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

const version = read('VERSION').trim();
const pkg = JSON.parse(read('package.json'));
const html = read('assessment/index.html');
const home = read('home/index.html');
const howItWorks = read('how-it-works/index.html');
const engine = read('assets/js/assessment-engine.js');
const consumerSource = read('assets/js/assessment-consumer-copy.js');
const property = read('assets/js/property-confirmation.js');
const propertyCss = read('assets/css/property-confirmation.css');
const pilotCss = read('assets/css/pilot.css');

check('release version remains compatible after ASMT-1.8', ['3.20.10','3.20.11','3.20.12','3.20.13','3.20.14','3.20.15','3.20.17','3.20.18','3.20.19','3.20.20','3.20.21','3.20.22','3.20.23','3.20.24','3.20.25','3.20.26','3.20.27','3.20.28','3.20.29','3.20.30','3.20.31','3.20.32','3.20.33','3.20.34','3.20.35','3.20.36','3.20.37','3.20.38','3.20.39','3.20.40','3.20.41','3.20.42','3.20.43','3.20.44','3.20.45','3.20.46','3.20.47','3.20.48','3.20.49','3.20.50','3.20.51','3.20.52','3.20.53','3.20.54','3.20.55','3.20.56','3.20.57','3.20.58','3.20.59','3.20.60'].includes(version) && pkg.version === version);
check('consumer copy module exists', fs.existsSync(path.join(root, 'assets/js/assessment-consumer-copy.js')));
check('consumer copy loads after assessment config and before assessment engine', html.indexOf('/home/assessment-config.js') < html.indexOf('/assets/js/assessment-consumer-copy.js') && html.indexOf('/assets/js/assessment-consumer-copy.js') < html.indexOf('/assets/js/assessment-engine.js'));
check('assessment metadata uses truthful five-minute estimate', html.includes('about five minutes') && html.includes('About 5 minutes remaining'));
check('Home entry point advertises five minutes', home.includes('About 5 minutes'));
check('How It Works identifies 11 questions and five minutes', howItWorks.includes('11 practical questions in about five minutes'));
check('Home trigger pages use five-minute estimate', ['triggers/renewal/index.html','triggers/premium-increase/index.html','triggers/homebuyer/index.html'].every(rel => read(rel).includes('About 5 minutes')));

check('required property address remains visible', html.includes('property-form-grid--required') && html.includes('id="propertyLine1"') && html.includes('id="propertyPostalCode"'));
check('optional property details are collapsed in a details disclosure', html.includes('<details class="property-optional" id="propertyOptionalDetails">') && !html.includes('<details class="property-optional" id="propertyOptionalDetails" open'));
check('optional disclosure is clearly labeled non-required', html.includes('Helpful, not required') && html.replace(/\s+/g, ' ').includes('Leaving these blank will not stop the review'));
check('optional property inputs remain available', ['propertyYearBuilt','propertySquareFeet','propertyRoofType','propertyRoofYear','propertyPool','propertyDetachedStructures'].every(id => html.includes(`id="${id}"`)));
check('property actions distinguish full review from address-only continuation', html.includes('Continue to My Review') && html.includes('Continue with address only'));
check('property controller recognizes optional disclosure', property.includes("const optionalDetails = $('propertyOptionalDetails')") && property.includes("const optionalSummary = $('propertyOptionalSummary')"));
check('property controller tracks optional disclosure without changing profile submission', property.includes('property_optional_details_opened') && property.includes('property_optional_details_closed') && property.includes("continueToAssessment(nextProfile, 'confirmed')"));
check('optional property CSS includes disclosure states', propertyCss.includes('.property-optional') && propertyCss.includes('.property-optional[open] summary:after'));

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(consumerSource, sandbox, { filename: 'assessment-consumer-copy.js' });
const copy = sandbox.window.CoverageFitAssessmentConsumerCopy;
check('consumer copy API is frozen and versioned', Object.isFrozen(copy) && copy.VERSION === '1.0.0' && copy.BUILD === 'ASMT-1.8');
check('consumer estimate is five minutes', copy.TOTAL_MINUTES === 5);
check('consumer copy simplifies rebuilding question', copy.question({ key: 'dwelling', title: 'original', help: 'original' }).title === "When was your home's rebuilding estimate last reviewed?");
check('consumer copy simplifies water question', copy.question({ key: 'water', title: 'original', help: 'original' }).title.includes("water-damage terms"));
check('consumer copy simplifies umbrella question', copy.question({ key: 'umbrella', title: 'original', help: 'original' }).title.includes('umbrella policy'));
check('consumer copy includes property-aware pool question', copy.question({ key: 'poolLiabilityReview', title: 'original', help: 'original' }).title.includes('swimming pool'));
check('consumer copy includes property-aware detached-structure question', copy.question({ key: 'detachedStructuresReview', title: 'original', help: 'original' }).title.includes('detached structures'));
check('consumer copy includes property-aware roof question', copy.question({ key: 'roofTermsReview', title: 'original', help: 'original' }).title.includes('covered roof loss'));
check('unknown questions retain original copy', copy.question({ key: 'unknown', title: 'Original title', help: "Why we're asking: Original help" }).title === 'Original title' && copy.question({ key: 'unknown', title: 'Original title', help: "Why we're asking: Original help" }).help === 'Original help');
check('visible answer copy is presentation-only', copy.answer({ key: 'dwelling' }, 2, { label: 'original', sub: 'original' }).label === 'I know the amount, but not how it was calculated');
check('remaining-time estimate begins at five minutes for 11 questions', copy.remainingMinutes(11, 0) === 5);
check('remaining-time estimate declines and never reaches zero', copy.remainingMinutes(11, 5) === 3 && copy.remainingMinutes(11, 10) === 1);

check('assessment engine reads presentation-only question copy', engine.includes('consumerCopy?.question?.(question)'));
check('assessment engine reads presentation-only answer copy', engine.includes('consumerCopy?.answer?.(question, index, answer)'));
check('stored answer continues to spread original answer object', engine.includes('selections[question.key] = {\n            ...answer,'));
check('progress label is consumer-friendly', engine.includes('Question ${current + 1} of ${questions.length}') && !engine.includes("'Industry Review'"));
check('progress bar reflects the current answered step', engine.includes('Math.round((current + 1) / questions.length * 100)'));
check('dynamic time estimate uses the consumer copy contract', engine.includes('consumerCopy?.remainingMinutes?.(questions.length, current)'));

const feedbackStart = engine.indexOf('function renderAnswerFeedback');
const feedbackEnd = engine.indexOf('function showIncompleteFeedback', feedbackStart);
const feedbackChunk = engine.slice(feedbackStart, feedbackEnd);
check('live answer feedback removes Evidence quality heading', !feedbackChunk.includes('Evidence quality'));
check('live answer feedback uses friendly homeowner language', feedbackChunk.includes('Good to know') && feedbackChunk.includes('Added to your review') && feedbackChunk.includes('Good item to confirm'));
check('evidence classification remains attached to feedback metadata', feedbackChunk.includes('feedback.dataset.evidenceQuality = evidence.quality'));
check('incomplete feedback normalizes Not sure as acceptable', engine.includes('“Not sure” is always okay'));

const insightStart = engine.indexOf('function showEarlyInsight');
const insightEnd = engine.indexOf('next.onclick', insightStart);
const insightChunk = engine.slice(insightStart, insightEnd);
check('early insight remains present as inline checkpoint', html.includes('early-insight--inline') && html.includes('Quick checkpoint'));
check('early insight no longer includes a required continue button', !html.includes('id="continueInsight"'));
check('early insight no longer hides the quiz', !insightChunk.includes("quiz.style.display = 'none'"));
check('early insight is marked non-blocking in analytics', insightChunk.includes('blocking: false'));
check('second answer triggers checkpoint without adding a navigation step', engine.includes('if (current === 1 && !earlyInsightShown) showEarlyInsight();') && !engine.includes("saveDraft('early_insight_continued'"));
check('draft compatibility preserves early insight state', engine.includes('earlyInsightShown') && engine.includes("restoredView === 'earlyInsight'"));

check('mobile assessment removes fixed question height', pilotCss.includes('.pilot-tool .question{min-height:0}'));
check('mobile answers use tighter pacing', pilotCss.includes('.answers{gap:9px') && pilotCss.includes('.answer{padding:14px 13px'));
check('mobile navigation is sticky and safe-area aware', pilotCss.includes('position:sticky') && pilotCss.includes('env(safe-area-inset-bottom)'));
check('inline insight receives compact mobile treatment', pilotCss.includes('.early-insight--inline'));

check('Protection Score implementation is byte-for-byte unchanged', hash('assets/js/protection-score.js') === '0cf3190a5bb99aceb0e527f91268247481fd14e67acd81fb35db3accd8a5f2a8');
check('Home assessment questions, weights, and answer impacts are byte-for-byte unchanged', hash('home/assessment-config.js') === 'f4f39337871c7ce6952b77607470dcef963a039b2e467eaedfe5e35b6348553b');
check('Agent Workspace normalization retains assessment compatibility after additive GC-1.6 recommendation persistence', hash('assets/js/workspace-data.js') === '8a11fd11fb3e027cfef746f4f9214b9d345c5db49862921dff27bbcfcc49eef2');
check('consultation inbox retains notification compatibility after additive GC-1.6 recommendation persistence', hash('server/consultation-inbox-core.mjs') === '0ff5280851373a887716a317a7a2497d981811ce3e101533b17d40e890d8b277');
check('continuity module remains present and seven-day draft behavior is untouched', read('assets/js/assessment-continuity.js').includes('const TTL_MS = 7 * 24 * 60 * 60 * 1000'));
check('ASMT-1.8 documentation exists', fs.existsSync(path.join(root, 'ASSESSMENT-CONSUMER-CLARITY-AND-COMPLETION.md')) && fs.existsSync(path.join(root, 'SPRINT-ASMT-1.8.md')));
check('roadmap marks ASMT-1.8 complete', read('ROADMAP.md').includes('ASMT-1.8 Consumer Clarity and Completion Optimization — Complete (3.20.10)'));
check('changelog contains ASMT-1.8 release', read('CHANGELOG.md').includes('## 3.20.10 — ASMT-1.8 Consumer Clarity and Completion Optimization'));

console.log(`ASMT-1.8 QA: ${checks.length}/${checks.length} passed`);
