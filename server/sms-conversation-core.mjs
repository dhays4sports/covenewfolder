import { randomUUID } from './runtime-crypto.mjs';
import { authorizeProducer } from './consultation-inbox-core.mjs';
import { createSmsHandoff } from './sms-handoff-core.mjs';
import { partnerRegistryFromEnv, resolveSmsPartnerAttribution } from './realtor-partner-registry.mjs';

export const SMS_ENGINE_VERSION = '1.7.2';
export const SMS_ENGINE_BUILD = 'RC-SMS-1.9.6';
export const SMS_CONVERSATION_PREFIX = 'sms-conversations/';
export const SMS_STATES = Object.freeze([
  'new',
  'intent_requested',
  'buyer_address_requested',
  'buyer_closing_date_requested',
  'buyer_occupancy_requested',
  'buyer_bundle_requested',
  'home_review_address_requested',
  'home_review_reason_requested',
  'bundle_address_requested',
  'bundle_occupancy_requested',
  'bundle_status_requested',
  'other_category_requested',
  'coveragefit_ready',
  'awaiting_producer',
  'human_takeover',
  'completed',
  'opted_out'
]);
export const OPERATOR_ACTIONS = Object.freeze(['restart', 'awaiting_producer', 'human_takeover', 'resume', 'resend_handoff', 'complete', 'not_proceeding']);
export const MAX_BODY_BYTES = 16000;
export const MAX_TRANSCRIPT_ITEMS = 80;
export const MAX_INVALID_INTENT_ATTEMPTS = 2;

export const SMS_AUTOMATION_INTRO = 'Thanks for texting 408-FARMERS. This is the automated intake for Dylan at the Virginia Tam Insurance Agency. Dylan will personally review your information.';
export const SMS_INTENT_MENU = `${SMS_AUTOMATION_INTRO}\n\nWhat can we help with?\n1. Buying a home\n2. Reviewing current home coverage\n3. Home and auto together\n4. Something else\n\nReply STOP to opt out, HELP for assistance, or DYLAN to request a personal reply.`;
export const SMS_HELP_MESSAGE = '408-FARMERS uses a short automated intake so Dylan can understand what you need before personally following up. Reply 1 for Buying a home, 2 for a current home review, 3 for Home and auto together, or 4 for Something else. You can include RUSH with a time-sensitive request, or reply DYLAN for a personal response. Reply STOP to opt out.';
export const SMS_HUMAN_REQUEST_MESSAGE = 'I have paused the automated intake and queued your message for Dylan. He will reply personally as soon as he can.';
export const SMS_INVALID_INTENT_MESSAGE = 'I did not recognize that response. Reply 1, 2, 3, or 4, or reply DYLAN for a personal response.';
export const SMS_INVALID_ESCALATION_MESSAGE = 'I am having trouble matching that response. I have paused the automated intake and queued your message for Dylan.';
export const SMS_RUSH_ACKNOWLEDGEMENT = 'I have marked this as time-sensitive so Dylan can prioritize the review. RUSH does not guarantee coverage, eligibility, or turnaround time.';
export const SMS_BUYER_COMPLETION_MESSAGE = 'Thanks. I have the basic purchase details. Dylan will personally review the property and follow up by text or phone. This is not an instant quote, and coverage is subject to eligibility and underwriting.';
export const SMS_HOME_REVIEW_COMPLETION_MESSAGE = 'Thanks. I have the basics for your current-home coverage review. Dylan will personally review the information and follow up by text or phone. CoverageFit is a guided review, not an instant quote or coverage determination.';
export const SMS_BUNDLE_COMPLETION_MESSAGE = 'Thanks. I have the basics for your home-and-auto review. Dylan will personally review the information and follow up by text or phone. This does not create or bind an auto or home policy automatically.';

const CONVERSATION_ID = /^sms-sim-[a-z0-9-]{8,80}$/i;
const MESSAGE_ID = /^sim-msg-[a-z0-9-]{6,100}$/i;
const TEST_PHONE = /^\+1[2-9]\d{2}555\d{4}$/;
const STOP_COMMANDS = /^(stop|stopall|unsubscribe|cancel|end|quit)$/i;

function text(value, fallback = '') {
  if (value === 0) return '0';
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function error(status, code, message) {
  return json({ ok: false, error: { code, message } }, status);
}

function sameOrigin(request) {
  const origin = text(request.headers.get('origin'));
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch (_) { return false; }
}

function nowIso(options = {}) {
  const value = typeof options.now === 'function' ? options.now() : options.now;
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeState(value, fallback = 'new') {
  const candidate = text(value).toLowerCase();
  return SMS_STATES.includes(candidate) ? candidate : fallback;
}

function normalizedWords(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}


const MONTH_INDEX = Object.freeze({
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11
});
const WEEKDAY_INDEX = Object.freeze({ sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 });

function dateOnly(options = {}) {
  const value = typeof options.now === 'function' ? options.now() : options.now;
  const source = value instanceof Date ? value : value ? new Date(value) : new Date();
  const safe = Number.isNaN(source.getTime()) ? new Date() : source;
  return new Date(Date.UTC(safe.getUTCFullYear(), safe.getUTCMonth(), safe.getUTCDate()));
}

function utcDate(year, monthIndex, day) {
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
  return date;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function displayDate(date) {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  } catch (_) {
    return isoDate(date);
  }
}

function parseMonthNameDate(raw, today) {
  const match = raw.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}|\d{2}))?\b/i);
  if (!match) return null;
  let year = match[3] ? Number(match[3]) : today.getUTCFullYear();
  if (year < 100) year += 2000;
  return { date: utcDate(year, MONTH_INDEX[match[1].toLowerCase()], Number(match[2])), yearProvided: Boolean(match[3]) };
}

function parseNumericDate(raw, today) {
  const iso = raw.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return { date: utcDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])), yearProvided: true };
  const slash = raw.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](20\d{2}|\d{2}))?\b/);
  if (!slash) return null;
  let year = slash[3] ? Number(slash[3]) : today.getUTCFullYear();
  if (year < 100) year += 2000;
  return { date: utcDate(year, Number(slash[1]) - 1, Number(slash[2])), yearProvided: Boolean(slash[3]) };
}

function parseWeekdayDate(normalized, today) {
  const match = normalized.match(/^(?:(this|next)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (!match) return null;
  const desired = WEEKDAY_INDEX[match[2]];
  let delta = (desired - today.getUTCDay() + 7) % 7;
  if (match[1] === 'next') delta += delta === 0 ? 7 : 7;
  else if (delta === 0) delta = 0;
  const date = new Date(today.getTime() + delta * 86400000);
  return { date, yearProvided: true };
}

export function hasSmsRushSignal(value) {
  const candidate = normalizedWords(value);
  return /\b(rush|urgent|asap|closing soon|time sensitive|this week|within (?:a|one|1) week)\b/.test(candidate);
}

export function normalizeBuyerAddress(value) {
  const candidate = text(value).replace(/\s+/g, ' ').slice(0, 180);
  if (!candidate || candidate.length < 7 || !/\d/.test(candidate) || !/[a-z]/i.test(candidate)) return '';
  if (/^p\.?\s*o\.?\s*box\b/i.test(candidate)) return '';
  return candidate;
}

export function normalizeBuyerClosingDate(value, options = {}) {
  const raw = text(value).replace(/\s+/g, ' ').slice(0, 100);
  const normalized = normalizedWords(raw);
  const today = dateOnly(options);
  if (!raw) return { ok: false, reason: 'missing' };

  if (/^(today|tomorrow)$/.test(normalized)) {
    const delta = normalized === 'tomorrow' ? 1 : 0;
    const date = new Date(today.getTime() + delta * 86400000);
    return { ok: true, raw, date: isoDate(date), display: displayDate(date), timing: normalized, approximate: false, daysUntil: delta, priority: 'rush', rushReason: normalized };
  }

  let relative = normalized.match(/^in\s+(\d{1,3})\s+(day|days|week|weeks)$/);
  if (relative) {
    const count = Number(relative[1]);
    const delta = count * (/week/.test(relative[2]) ? 7 : 1);
    if (delta > 730) return { ok: false, reason: 'too_far' };
    const date = new Date(today.getTime() + delta * 86400000);
    return { ok: true, raw, date: isoDate(date), display: displayDate(date), timing: 'relative', approximate: false, daysUntil: delta, priority: delta <= 7 ? 'rush' : 'standard', rushReason: delta <= 7 ? 'closing_within_7_days' : '' };
  }

  if (/^(this week|by the end of this week|end of this week)$/.test(normalized)) {
    return { ok: true, raw, date: '', display: 'This week', timing: 'this_week', approximate: true, daysUntil: 7, priority: 'rush', rushReason: 'this_week' };
  }
  if (/^(next week|sometime next week)$/.test(normalized)) {
    return { ok: true, raw, date: '', display: 'Next week', timing: 'next_week', approximate: true, daysUntil: 10, priority: 'standard', rushReason: '' };
  }
  if (/^(end of (?:the )?month|by month end)$/.test(normalized)) {
    const date = utcDate(today.getUTCFullYear(), today.getUTCMonth() + 1, 0);
    const delta = daysBetween(today, date);
    return { ok: true, raw, date: isoDate(date), display: `By ${displayDate(date)}`, timing: 'end_of_month', approximate: true, daysUntil: delta, priority: delta <= 7 ? 'rush' : 'standard', rushReason: delta <= 7 ? 'closing_within_7_days' : '' };
  }

  const weekday = parseWeekdayDate(normalized, today);
  const numeric = parseNumericDate(raw, today);
  const named = parseMonthNameDate(raw, today);
  const parsed = weekday || numeric || named;
  if (parsed) {
    if (!parsed.date) return { ok: false, reason: 'invalid_date' };
    const delta = daysBetween(today, parsed.date);
    if (delta < 0) return { ok: false, reason: 'past_date', parsedDate: isoDate(parsed.date) };
    if (delta > 730) return { ok: false, reason: 'too_far' };
    return { ok: true, raw, date: isoDate(parsed.date), display: displayDate(parsed.date), timing: 'exact', approximate: false, daysUntil: delta, priority: delta <= 7 ? 'rush' : 'standard', rushReason: delta <= 7 ? 'closing_within_7_days' : '' };
  }

  const approximateMonth = normalized.match(/^(early|mid|late)\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(20\d{2}))?$/);
  if (approximateMonth) {
    const month = MONTH_INDEX[approximateMonth[2]];
    const day = approximateMonth[1] === 'early' ? 7 : approximateMonth[1] === 'mid' ? 15 : 24;
    const year = approximateMonth[3] ? Number(approximateMonth[3]) : today.getUTCFullYear();
    const date = utcDate(year, month, day);
    if (!date) return { ok: false, reason: 'invalid_date' };
    const delta = daysBetween(today, date);
    if (delta < 0) return { ok: false, reason: 'past_date', parsedDate: isoDate(date) };
    return { ok: true, raw, date: isoDate(date), display: `${approximateMonth[1][0].toUpperCase()}${approximateMonth[1].slice(1)} ${approximateMonth[2][0].toUpperCase()}${approximateMonth[2].slice(1)} ${year}`, timing: 'approximate_month', approximate: true, daysUntil: delta, priority: delta <= 7 ? 'rush' : 'standard', rushReason: delta <= 7 ? 'closing_within_7_days' : '' };
  }

  return { ok: false, reason: 'unrecognized' };
}

export function normalizeSmsCommand(value) {
  const candidate = normalizedWords(value);
  if (STOP_COMMANDS.test(candidate)) return 'stop';
  if (candidate === 'start') return 'start';
  if (candidate === 'restart' || candidate === 'reset' || candidate === 'start over') return 'restart';
  if (candidate === 'help' || candidate === 'info') return 'help';
  if (/^(rush|urgent|asap|closing soon|time sensitive)$/.test(candidate)) return 'rush';
  if (/^(dylan|agent|human|person|talk to dylan|talk to an agent|call me)$/.test(candidate)) return 'human';
  return '';
}

export function normalizeSmsIntent(value) {
  const candidate = normalizedWords(value);
  if (!candidate) return '';
  if (/^(1|buyer|buying|buying a home|new home|home purchase|purchase|closing)$/.test(candidate)) return 'buyer';
  if (/\b(buying a home|buying home|new home purchase|home purchase|offer accepted|in escrow|closing on|my realtor|realtor sent|referred by.*realtor)\b/.test(candidate)) return 'buyer';
  if (/^(2|home review|review|current home|coverage review|home coverage review)$/.test(candidate)) return 'home_review';
  if (/\b(review my home|current home coverage|home policy review|renewal review|review coverage|home coverage review|review my home coverage|coverage review for my home|need a home review|want a home review)\b/.test(candidate)) return 'home_review';
  if (/^(3|bundle|home and auto|home auto|home plus auto)$/.test(candidate)) return 'bundle';
  if (/\b(home and auto|home auto bundle|bundle home.*auto|auto and home)\b/.test(candidate)) return 'bundle';
  if (/^(4|other|something else|another question)$/.test(candidate)) return 'other';
  return '';
}

function isGreeting(value) {
  return /^(hi|hello|hey|hello there|good morning|good afternoon|good evening|test|start here)$/i.test(text(value));
}

function normalizeOccupancy(value) {
  const candidate = normalizedWords(value);
  if (/^(1|primary|primary home|owner occupied|owner)$/.test(candidate)) return 'primary_home';
  if (/^(2|rental|rental property|tenant occupied|investment)$/.test(candidate)) return 'rental_property';
  if (/^(3|second|second home|vacation|vacation home)$/.test(candidate)) return 'second_home';
  if (/^(4|not sure|unsure|unknown)$/.test(candidate)) return 'not_sure';
  return '';
}

function normalizeYesNo(value) {
  const candidate = normalizedWords(value);
  if (/^(yes|y|1|sure|okay|ok|include auto|bundle)$/.test(candidate)) return true;
  if (/^(no|n|2|home only|not now)$/.test(candidate)) return false;
  return null;
}

function normalizeHomeReviewReason(value) {
  const candidate = normalizedWords(value);
  if (/^(1|renewal|renewal review|upcoming renewal)$/.test(candidate)) return 'renewal';
  if (/^(2|price|rate|premium|cost|too expensive|save money)$/.test(candidate)) return 'price';
  if (/^(3|coverage|coverage question|review coverage|limits)$/.test(candidate)) return 'coverage';
  if (/^(4|nonrenewal|non renewal|canceled|cancelled|being dropped|dropped)$/.test(candidate)) return 'nonrenewal';
  if (/^(5|other|something else|general)$/.test(candidate)) return 'other';
  return '';
}

function normalizeBundleStatus(value) {
  const candidate = normalizedWords(value);
  if (/^(1|both|both insured|home and auto|both currently insured)$/.test(candidate)) return 'both_insured';
  if (/^(2|home only|just home|home insured)$/.test(candidate)) return 'home_only';
  if (/^(3|auto only|just auto|auto insured)$/.test(candidate)) return 'auto_only';
  if (/^(4|neither|none|not insured)$/.test(candidate)) return 'neither';
  if (/^(5|not sure|unsure|unknown)$/.test(candidate)) return 'not_sure';
  return '';
}

function normalizeOtherCategory(value) {
  const candidate = normalizedWords(value);
  if (/^(1|service|servicing|existing policy|current policy|billing|claim|policy change)$/.test(candidate)) return 'servicing';
  if (/^(2|landlord|rental|rental property|investment property)$/.test(candidate)) return 'landlord';
  if (/^(3|business|commercial|commercial insurance)$/.test(candidate)) return 'business';
  if (/^(4|life|life insurance)$/.test(candidate)) return 'life';
  if (/^(5|other|something else|special|not sure|unsupported)$/.test(candidate)) return 'special';
  return '';
}

function transcriptItem(direction, body, occurredAt, options = {}) {
  return {
    id: text(options.id, `${direction}-${randomUUID()}`).slice(0, 120),
    direction,
    body: text(body).slice(0, 800),
    occurredAt,
    stateBefore: normalizeState(options.stateBefore),
    stateAfter: normalizeState(options.stateAfter, normalizeState(options.stateBefore)),
    kind: text(options.kind, direction === 'inbound' ? 'prospect' : 'automation').slice(0, 40)
  };
}

function appendTranscript(conversation, items) {
  const next = [...(Array.isArray(conversation.transcript) ? conversation.transcript : []), ...items].slice(-MAX_TRANSCRIPT_ITEMS);
  return { ...conversation, transcript: next };
}

function replyForState(state) {
  return ({
    intent_requested: SMS_INTENT_MENU,
    buyer_address_requested: 'What is the address of the home you are purchasing?',
    buyer_closing_date_requested: 'When are you scheduled to close? You can reply with a date, next Friday, or this week.',
    buyer_occupancy_requested: 'How will the property be used? Reply 1 Primary home, 2 Rental property, 3 Second home, or 4 Not sure yet.',
    buyer_bundle_requested: 'Would you also like Dylan to review your auto coverage for possible bundle opportunities? Reply YES or NO.',
    home_review_address_requested: 'What is the address of the home you want Dylan to review?',
    home_review_reason_requested: 'What prompted the review? Reply 1 Renewal, 2 Price/rate, 3 Coverage questions, 4 Non-renewal/cancellation concern, or 5 Other.',
    bundle_address_requested: 'What is the address of the home you want reviewed with auto?',
    bundle_occupancy_requested: 'How is the home used? Reply 1 Primary home, 2 Rental property, 3 Second home, or 4 Not sure yet.',
    bundle_status_requested: 'What is currently insured? Reply 1 Both home and auto, 2 Home only, 3 Auto only, 4 Neither, or 5 Not sure.',
    other_category_requested: 'What best describes what you need? Reply 1 Existing-policy service, 2 Landlord/rental property, 3 Business/commercial, 4 Life, or 5 Something else.',
    coveragefit_ready: SMS_BUYER_COMPLETION_MESSAGE,
    awaiting_producer: SMS_HUMAN_REQUEST_MESSAGE,
    human_takeover: 'Automation is paused for a simulated personal reply from Dylan.',
    completed: 'This simulated conversation is complete.',
    opted_out: 'You have been opted out of this simulated conversation. Reply START to begin again.'
  })[state] || '';
}

function intentAcknowledgement(intent) {
  return ({
    buyer: 'Thanks. I have marked this as a home-purchase request and queued it for Dylan. He will reply personally. This is not an instant quote.',
    home_review: 'Thanks. I have marked this as a current-home coverage review and queued it for Dylan. He will reply personally.',
    bundle: 'Thanks. I have marked this as a home-and-auto request and queued it for Dylan. He will reply personally.',
    other: 'Thanks. I have queued your message for Dylan so he can respond personally.'
  })[intent] || SMS_HUMAN_REQUEST_MESSAGE;
}

function resetResult(reply = SMS_INTENT_MENU) {
  return {
    state: 'intent_requested',
    intent: '',
    answers: {},
    attribution: null,
    invalidIntentAttempts: 0,
    resetAnswers: true,
    reply,
    command: 'restart'
  };
}

export function routeSmsInbound(source, messageBody, options = {}) {
  const conversation = source && typeof source === 'object' ? source : { state: 'new' };
  const mode = options.mode === 'live' ? 'live' : 'simulator';
  const rawBody = text(messageBody).slice(0, 800);
  const partnerResolution = resolveSmsPartnerAttribution(rawBody, options.partnerRegistry || []);
  const body = text(partnerResolution.matched ? partnerResolution.cleanedBody : rawBody).slice(0, 800);
  const command = normalizeSmsCommand(body);
  const currentState = normalizeState(conversation.state);
  const isFirstMessage = Boolean(options.isFirstMessage || currentState === 'new');
  const rushSignal = hasSmsRushSignal(body);
  const partnerDefaultIntent = partnerResolution.active ? partnerResolution.defaultIntent : '';

  if (command === 'stop') {
    return {
      state: 'opted_out',
      invalidIntentAttempts: 0,
      reply: mode === 'simulator' ? replyForState('opted_out') : '',
      command
    };
  }

  if (currentState === 'opted_out') {
    if (command === 'start') return { ...resetResult(SMS_INTENT_MENU), command: 'start' };
    return { state: 'opted_out', invalidIntentAttempts: 0, reply: '', command };
  }

  if (command === 'start' || command === 'restart') return { ...resetResult(SMS_INTENT_MENU), command };
  if (command === 'help') {
    return {
      state: currentState === 'new' ? 'intent_requested' : currentState,
      invalidIntentAttempts: Number(conversation.invalidIntentAttempts) || 0,
      reply: SMS_HELP_MESSAGE,
      command
    };
  }
  if (command === 'human') {
    return {
      state: 'awaiting_producer',
      invalidIntentAttempts: 0,
      reply: isFirstMessage ? `${SMS_AUTOMATION_INTRO}\n\n${SMS_HUMAN_REQUEST_MESSAGE}` : SMS_HUMAN_REQUEST_MESSAGE,
      command
    };
  }
  if (command === 'rush') {
    const answers = { priority: 'rush', rushRequested: true, rushReason: 'prospect_requested' };
    if (currentState === 'new' || currentState === 'intent_requested') {
      const reply = `${SMS_RUSH_ACKNOWLEDGEMENT}

${replyForState('buyer_address_requested')}`;
      return { state: 'buyer_address_requested', intent: 'buyer', answers, invalidIntentAttempts: 0, reply: isFirstMessage ? `${SMS_AUTOMATION_INTRO}

${reply}` : reply, command };
    }
    const prompt = replyForState(currentState);
    return { state: currentState, answers, invalidIntentAttempts: Number(conversation.invalidIntentAttempts) || 0, reply: `${SMS_RUSH_ACKNOWLEDGEMENT}${prompt ? `

${prompt}` : ''}`, command };
  }

  if (currentState === 'new' || currentState === 'intent_requested') {
    const intentBody = body.replace(/\b(rush|urgent|asap|time[- ]?sensitive)\b/ig, ' ').replace(/\s+/g, ' ').trim();
    const intent = normalizeSmsIntent(body) || normalizeSmsIntent(intentBody) || (!body && partnerDefaultIntent === 'buyer' ? 'buyer' : '');
    if (intent) {
      if (intent === 'buyer') {
        const reply = replyForState('buyer_address_requested');
        const answers = rushSignal ? { priority: 'rush', rushRequested: true, rushReason: 'prospect_requested' } : {};
        const rushPrefix = rushSignal ? `${SMS_RUSH_ACKNOWLEDGEMENT}\n\n` : '';
        return {
          state: 'buyer_address_requested',
          intent,
          answers,
          invalidIntentAttempts: 0,
          reply: isFirstMessage ? `${SMS_AUTOMATION_INTRO}\n\n${rushPrefix}${reply}` : `${rushPrefix}${reply}`,
          command: ''
        };
      }
      const nextState = intent === 'home_review' ? 'home_review_address_requested' : intent === 'bundle' ? 'bundle_address_requested' : 'other_category_requested';
      const answers = rushSignal ? { priority: 'rush', rushRequested: true, rushReason: 'prospect_requested' } : {};
      const rushPrefix = rushSignal ? `${SMS_RUSH_ACKNOWLEDGEMENT}\n\n` : '';
      const reply = `${rushPrefix}${replyForState(nextState)}`;
      return { state: nextState, intent, answers, invalidIntentAttempts: 0, reply: isFirstMessage ? `${SMS_AUTOMATION_INTRO}\n\n${reply}` : reply, command: '' };
    }

    if (currentState === 'new' || isGreeting(body)) {
      return { state: 'intent_requested', invalidIntentAttempts: 0, reply: SMS_INTENT_MENU, command: '' };
    }

    const attempts = Math.max(0, Number(conversation.invalidIntentAttempts) || 0) + 1;
    if (attempts >= MAX_INVALID_INTENT_ATTEMPTS) {
      return {
        state: 'awaiting_producer',
        invalidIntentAttempts: attempts,
        reply: SMS_INVALID_ESCALATION_MESSAGE,
        command: ''
      };
    }
    return {
      state: 'intent_requested',
      invalidIntentAttempts: attempts,
      reply: SMS_INVALID_INTENT_MESSAGE,
      command: ''
    };
  }

  switch (currentState) {
    case 'buyer_address_requested': {
      const propertyAddress = normalizeBuyerAddress(body);
      if (!propertyAddress) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please send the property street address, including the street number and name. A city and ZIP are helpful when available.', command: '' };
      return { state: 'buyer_closing_date_requested', answers: { propertyAddress }, invalidIntentAttempts: 0, reply: replyForState('buyer_closing_date_requested'), command: '' };
    }
    case 'buyer_closing_date_requested': {
      const closing = normalizeBuyerClosingDate(body, options);
      if (!closing.ok) {
        const reply = closing.reason === 'past_date'
          ? 'That date appears to have passed. Please reply with the updated closing date, such as 2026-09-15 or next Friday.'
          : closing.reason === 'too_far'
            ? 'That closing date appears unusually far away. Please confirm the expected date, including the year.'
            : 'I could not confirm that closing date. Reply with YYYY-MM-DD, MM/DD/YYYY, next Friday, or this week.';
        return { state: currentState, invalidIntentAttempts: 0, reply, command: '' };
      }
      const explicitRush = conversation.answers?.rushRequested === true;
      const effectivePriority = explicitRush ? 'rush' : closing.priority;
      const rushReason = explicitRush ? 'prospect_requested' : closing.rushReason;
      return {
        state: 'buyer_occupancy_requested',
        answers: {
          closingDate: closing.date,
          closingDateRaw: closing.raw,
          closingDateDisplay: closing.display,
          closingTiming: closing.timing,
          closingApproximate: closing.approximate,
          daysUntilClosing: closing.daysUntil,
          priority: effectivePriority,
          ...(rushReason ? { rushReason } : {})
        },
        invalidIntentAttempts: 0,
        reply: `${effectivePriority === 'rush' ? `${SMS_RUSH_ACKNOWLEDGEMENT}\n\n` : ''}${replyForState('buyer_occupancy_requested')}`,
        command: ''
      };
    }
    case 'buyer_occupancy_requested': {
      const occupancy = normalizeOccupancy(body);
      if (!occupancy) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply 1 for Primary home, 2 for Rental property, 3 for Second home, or 4 for Not sure yet.', command: '' };
      return { state: 'buyer_bundle_requested', answers: { occupancy }, invalidIntentAttempts: 0, reply: replyForState('buyer_bundle_requested'), command: '' };
    }
    case 'buyer_bundle_requested': {
      const autoReview = normalizeYesNo(body);
      if (autoReview === null) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply YES or NO. This only records whether you would like Dylan to review auto coverage; it does not create an auto quote automatically.', command: '' };
      const priority = conversation.answers?.priority === 'rush' ? 'rush' : 'standard';
      const priorityLine = priority === 'rush' ? ' I have also kept the request marked as time-sensitive for Dylan.' : '';
      return { state: 'coveragefit_ready', answers: { autoReview }, invalidIntentAttempts: 0, reply: `${SMS_BUYER_COMPLETION_MESSAGE}${priorityLine}`, command: '' };
    }
    case 'home_review_address_requested': {
      const propertyAddress = normalizeBuyerAddress(body);
      if (!propertyAddress) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please send the property street address, including the street number and name.', command: '' };
      return { state: 'home_review_reason_requested', answers: { propertyAddress }, invalidIntentAttempts: 0, reply: replyForState('home_review_reason_requested'), command: '' };
    }
    case 'home_review_reason_requested': {
      const reviewReason = normalizeHomeReviewReason(body);
      if (!reviewReason) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply 1 Renewal, 2 Price/rate, 3 Coverage questions, 4 Non-renewal/cancellation concern, or 5 Other.', command: '' };
      const priorityLine = conversation.answers?.priority === 'rush' ? ' I have kept this marked as time-sensitive for Dylan.' : '';
      return { state: 'coveragefit_ready', answers: { reviewReason }, invalidIntentAttempts: 0, reply: `${SMS_HOME_REVIEW_COMPLETION_MESSAGE}${priorityLine}`, command: '' };
    }
    case 'bundle_address_requested': {
      const propertyAddress = normalizeBuyerAddress(body);
      if (!propertyAddress) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please send the property street address, including the street number and name.', command: '' };
      return { state: 'bundle_occupancy_requested', answers: { propertyAddress }, invalidIntentAttempts: 0, reply: replyForState('bundle_occupancy_requested'), command: '' };
    }
    case 'bundle_occupancy_requested': {
      const occupancy = normalizeOccupancy(body);
      if (!occupancy) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply 1 Primary home, 2 Rental property, 3 Second home, or 4 Not sure yet.', command: '' };
      return { state: 'bundle_status_requested', answers: { occupancy }, invalidIntentAttempts: 0, reply: replyForState('bundle_status_requested'), command: '' };
    }
    case 'bundle_status_requested': {
      const bundleStatus = normalizeBundleStatus(body);
      if (!bundleStatus) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply 1 Both home and auto, 2 Home only, 3 Auto only, 4 Neither, or 5 Not sure.', command: '' };
      const priorityLine = conversation.answers?.priority === 'rush' ? ' I have kept this marked as time-sensitive for Dylan.' : '';
      return { state: 'coveragefit_ready', answers: { bundleStatus, autoReview: true }, invalidIntentAttempts: 0, reply: `${SMS_BUNDLE_COMPLETION_MESSAGE}${priorityLine}`, command: '' };
    }
    case 'other_category_requested': {
      const requestCategory = normalizeOtherCategory(body);
      if (!requestCategory) return { state: currentState, invalidIntentAttempts: 0, reply: 'Please reply 1 Existing-policy service, 2 Landlord/rental property, 3 Business/commercial, 4 Life, or 5 Something else.', command: '' };
      const labels = { servicing: 'existing-policy service', landlord: 'landlord/rental property', business: 'business/commercial', life: 'life', special: 'special request' };
      return { state: 'awaiting_producer', answers: { requestCategory }, invalidIntentAttempts: 0, reply: `Thanks. I have routed your ${labels[requestCategory]} request to Dylan for a personal response.${conversation.answers?.priority === 'rush' ? ' It remains marked as time-sensitive.' : ''}`, command: '' };
    }
    default:
      break;
  }

  return {
    state: currentState,
    invalidIntentAttempts: Math.max(0, Number(conversation.invalidIntentAttempts) || 0),
    reply: '',
    command: ''
  };
}

export function createSimulatorConversation(options = {}) {
  const createdAt = nowIso(options);
  const conversationId = text(options.conversationId, `sms-sim-${randomUUID()}`);
  if (!CONVERSATION_ID.test(conversationId)) throw new TypeError('A valid opaque simulator conversation ID is required.');
  const testPhone = text(options.testPhone, '+14085550199');
  if (!TEST_PHONE.test(testPhone)) throw new TypeError('Use a reserved North American 555 test number in the simulator.');
  return {
    schemaVersion: '1.2',
    engineVersion: SMS_ENGINE_VERSION,
    build: SMS_ENGINE_BUILD,
    id: conversationId,
    testPhone,
    state: 'new',
    intent: '',
    answers: {},
    attribution: null,
    invalidIntentAttempts: 0,
    lastCommand: '',
    processedMessageIds: [],
    transcript: [],
    createdAt,
    updatedAt: createdAt,
    completedAt: ''
  };
}

export function normalizeConversation(value) {
  if (!value || typeof value !== 'object' || !CONVERSATION_ID.test(text(value.id))) return null;
  return {
    schemaVersion: '1.2',
    engineVersion: SMS_ENGINE_VERSION,
    build: SMS_ENGINE_BUILD,
    id: text(value.id),
    testPhone: TEST_PHONE.test(text(value.testPhone)) ? text(value.testPhone) : '+14085550199',
    state: normalizeState(value.state),
    intent: text(value.intent).slice(0, 40),
    answers: value.answers && typeof value.answers === 'object' && !Array.isArray(value.answers) ? clone(value.answers) : {},
    attribution: value.attribution && typeof value.attribution === 'object' && !Array.isArray(value.attribution) ? clone(value.attribution) : null,
    invalidIntentAttempts: Math.max(0, Math.min(MAX_INVALID_INTENT_ATTEMPTS, Number(value.invalidIntentAttempts) || 0)),
    lastCommand: text(value.lastCommand).slice(0, 40),
    processedMessageIds: Array.isArray(value.processedMessageIds) ? value.processedMessageIds.map(item => text(item)).filter(item => MESSAGE_ID.test(item)).slice(-100) : [],
    transcript: Array.isArray(value.transcript) ? value.transcript.filter(item => item && typeof item === 'object').slice(-MAX_TRANSCRIPT_ITEMS) : [],
    createdAt: text(value.createdAt),
    updatedAt: text(value.updatedAt),
    completedAt: text(value.completedAt),
    handoff: value.handoff && typeof value.handoff === 'object' ? { url: text(value.handoff.url), createdAt: text(value.handoff.createdAt), expiresAt: text(value.handoff.expiresAt) } : null,
    producerDisposition: text(value.producerDisposition),
    producerHandoffAt: text(value.producerHandoffAt)
  };
}

export function processSimulatorInbound(source, input, options = {}) {
  const conversation = normalizeConversation(source) || createSimulatorConversation(options);
  const messageId = text(input?.messageId);
  if (!MESSAGE_ID.test(messageId)) throw new TypeError('A valid simulator message ID is required.');
  const body = text(input?.body).slice(0, 800);
  if (!body) throw new TypeError('A simulator message body is required.');
  if (conversation.processedMessageIds.includes(messageId)) return { conversation, deduped: true, reply: '' };

  const occurredAt = nowIso(options);
  const before = conversation.state;
  const partnerResolution = resolveSmsPartnerAttribution(body, options.partnerRegistry || []);
  const result = routeSmsInbound(conversation, body, { mode: 'simulator', isFirstMessage: before === 'new', now: options.now, partnerRegistry: options.partnerRegistry || [] });
  const next = {
    ...conversation,
    attribution: partnerResolution.active ? partnerResolution.attribution : conversation.attribution,
    state: normalizeState(result.state, before),
    intent: Object.prototype.hasOwnProperty.call(result, 'intent') ? text(result.intent) : conversation.intent,
    answers: result.resetAnswers ? {} : (result.answers === null ? {} : { ...conversation.answers, ...(result.answers || {}) }),
    invalidIntentAttempts: Math.max(0, Number(result.invalidIntentAttempts) || 0),
    lastCommand: text(result.command),
    processedMessageIds: [...conversation.processedMessageIds, messageId].slice(-100),
    updatedAt: occurredAt,
    completedAt: result.state === 'completed' ? occurredAt : conversation.completedAt
  };
  const inbound = transcriptItem('inbound', body, occurredAt, { id: messageId, stateBefore: before, stateAfter: next.state });
  const outboundBody = text(result.reply);
  const items = [inbound];
  if (outboundBody) items.push(transcriptItem('outbound', outboundBody, occurredAt, { stateBefore: before, stateAfter: next.state }));
  return { conversation: appendTranscript(next, items), deduped: false, reply: outboundBody };
}

export function applySimulatorAction(source, action, options = {}) {
  const conversation = normalizeConversation(source);
  if (!conversation) throw new TypeError('A valid simulator conversation is required.');
  const normalizedAction = text(action).toLowerCase();
  if (!OPERATOR_ACTIONS.includes(normalizedAction)) throw new TypeError('Unsupported simulator operator action.');
  const occurredAt = nowIso(options);
  if (normalizedAction === 'restart') {
    const restarted = createSimulatorConversation({ ...options, conversationId: conversation.id, testPhone: conversation.testPhone });
    const reply = SMS_INTENT_MENU;
    restarted.state = 'intent_requested';
    restarted.updatedAt = occurredAt;
    restarted.lastCommand = 'restart';
    restarted.transcript = [transcriptItem('outbound', reply, occurredAt, { stateBefore: 'new', stateAfter: 'intent_requested', kind: 'system' })];
    return { conversation: restarted, reply };
  }
  if (normalizedAction === 'resend_handoff') {
    if (!conversation.handoff?.url) throw new TypeError('This simulator conversation does not have a CoverageFit continuation link to resend.');
    const reply = `Here is your secure CoverageFit continuation link again: ${conversation.handoff.url}`;
    return {
      conversation: appendTranscript({ ...conversation, updatedAt: occurredAt }, [transcriptItem('outbound', reply, occurredAt, { stateBefore: conversation.state, stateAfter: conversation.state, kind: 'operator' })]),
      reply
    };
  }
  const resumeState = (() => {
    const a = conversation.answers || {};
    if (!conversation.intent) return 'intent_requested';
    if (conversation.intent === 'buyer') {
      if (!a.propertyAddress) return 'buyer_address_requested';
      if (!(a.closingDateDisplay || a.closingDateRaw || a.closingDate)) return 'buyer_closing_date_requested';
      if (!a.occupancy) return 'buyer_occupancy_requested';
      if (typeof a.autoReview !== 'boolean') return 'buyer_bundle_requested';
    } else if (conversation.intent === 'home_review') {
      if (!a.propertyAddress) return 'home_review_address_requested';
      if (!a.reviewReason) return 'home_review_reason_requested';
    } else if (conversation.intent === 'bundle') {
      if (!a.propertyAddress) return 'bundle_address_requested';
      if (!a.occupancy) return 'bundle_occupancy_requested';
      if (!a.bundleStatus) return 'bundle_status_requested';
    } else if (conversation.intent === 'other') {
      return a.requestCategory ? 'awaiting_producer' : 'other_category_requested';
    }
    return conversation.handoff?.url ? 'awaiting_producer' : 'coveragefit_ready';
  })();
  const target = ({ awaiting_producer: 'awaiting_producer', human_takeover: 'human_takeover', resume: resumeState, complete: 'completed', not_proceeding: 'completed' })[normalizedAction];
  const reply = normalizedAction === 'resume' ? `Guided intake resumed. ${replyForState(target)}` : normalizedAction === 'not_proceeding' ? 'This simulated conversation was marked not proceeding.' : replyForState(target);
  const next = {
    ...conversation,
    state: target,
    updatedAt: occurredAt,
    completedAt: target === 'completed' ? occurredAt : conversation.completedAt,
    producerDisposition: normalizedAction === 'not_proceeding' ? 'not_proceeding' : normalizedAction === 'complete' ? 'completed' : text(conversation.producerDisposition)
  };
  return {
    conversation: appendTranscript(next, [transcriptItem('outbound', reply, occurredAt, { stateBefore: conversation.state, stateAfter: target, kind: 'operator' })]),
    reply
  };
}

function metadata(conversation) {
  return {
    state: conversation.state,
    intent: conversation.intent,
    invalidIntentAttempts: conversation.invalidIntentAttempts,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    completedAt: conversation.completedAt,
    build: SMS_ENGINE_BUILD
  };
}

async function parseBody(request) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { response: error(413, 'payload_too_large', 'The simulator request is too large.') };
  if (!String(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) return { response: error(415, 'unsupported_media_type', 'Expected application/json.') };
  let raw = '';
  try { raw = await request.text(); } catch (_) { return { response: error(400, 'invalid_body', 'The simulator request could not be read.') }; }
  if (!raw || raw.length > MAX_BODY_BYTES) return { response: error(raw ? 413 : 400, raw ? 'payload_too_large' : 'invalid_body', 'A valid simulator request is required.') };
  try { return { payload: JSON.parse(raw) }; } catch (_) { return { response: error(400, 'invalid_json', 'The simulator request is not valid JSON.') }; }
}

export async function handleSmsSimulator(request, options = {}) {
  const authorization = authorizeProducer(request, options.env || {});
  if (!authorization.ok) return authorization.response;
  const store = options.store;
  if (!store?.get || !store?.setJSON) return error(503, 'storage_unavailable', 'The SMS simulator storage service is unavailable.');

  if (request.method === 'GET') {
    const conversationId = text(new URL(request.url).searchParams.get('conversation_id'));
    if (!CONVERSATION_ID.test(conversationId)) return error(422, 'invalid_conversation_id', 'A valid opaque simulator conversation ID is required.');
    const conversation = normalizeConversation(await store.get(`${SMS_CONVERSATION_PREFIX}${conversationId}`));
    if (!conversation) return error(404, 'conversation_not_found', 'The simulator conversation was not found.');
    return json({ ok: true, conversation });
  }

  if (request.method !== 'POST') return error(405, 'method_not_allowed', 'GET or POST is required.');
  if (!sameOrigin(request)) return error(403, 'origin_rejected', 'The SMS simulator can only be changed from this CoverageFit site.');
  const parsed = await parseBody(request);
  if (parsed.response) return parsed.response;
  const payload = parsed.payload || {};
  const conversationId = text(payload.conversationId, `sms-sim-${randomUUID()}`);
  if (!CONVERSATION_ID.test(conversationId)) return error(422, 'invalid_conversation_id', 'A valid opaque simulator conversation ID is required.');
  const key = `${SMS_CONVERSATION_PREFIX}${conversationId}`;
  let conversation = normalizeConversation(await store.get(key));
  if (!conversation) {
    try { conversation = createSimulatorConversation({ conversationId, testPhone: payload.testPhone, now: options.now }); }
    catch (cause) { return error(422, 'invalid_simulator_contact', cause.message); }
  }

  try {
    let result;
    const partnerRegistry = options.partnerRegistry || partnerRegistryFromEnv(options.env || {});
    if (payload.action) result = applySimulatorAction(conversation, payload.action, { now: options.now });
    else result = processSimulatorInbound(conversation, { messageId: payload.messageId, body: payload.body }, { now: options.now, partnerRegistry });
    if (!result.deduped && result.conversation.state === 'coveragefit_ready' && !result.conversation.handoff?.url) {
      const handoffStore = options.handoffStore || options.store;
      if (!handoffStore?.setJSON) throw new TypeError('Secure SMS handoff storage is unavailable.');
      const access = await createSmsHandoff(result.conversation, { store: handoffStore, now: options.now, origin: new URL(request.url).origin });
      result.conversation.handoff = access;
      const continuation = `Continue your guided CoverageFit review here: ${access.url}\nThe property and purchase details you already provided will carry forward.`;
      result.reply = `${result.reply}\n\n${continuation}`;
      const transcript = Array.isArray(result.conversation.transcript) ? result.conversation.transcript : [];
      const last = transcript[transcript.length - 1];
      if (last && last.direction === 'outbound') last.body = result.reply;
      result.conversation.state = 'awaiting_producer';
      result.conversation.producerHandoffAt = nowIso(options);
      result.conversation.updatedAt = result.conversation.producerHandoffAt;
    }
    await store.setJSON(key, result.conversation, { metadata: metadata(result.conversation) });
    return json({ ok: true, deduped: Boolean(result.deduped), reply: result.reply, conversation: result.conversation }, result.deduped ? 200 : 201);
  } catch (cause) {
    return error(422, 'invalid_simulator_input', text(cause?.message, 'The simulator input was not accepted.'));
  }
}
