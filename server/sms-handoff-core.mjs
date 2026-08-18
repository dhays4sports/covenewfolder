import { randomBase64Url, sha256Hex } from './runtime-crypto.mjs';

export const SMS_HANDOFF_BUILD = 'RC-SMS-1.9.6';
export const SMS_HANDOFF_SCHEMA_VERSION = '1.2';
export const SMS_HANDOFF_PREFIX = 'sms-handoffs/';
export const SMS_HANDOFF_TTL_MS = 24 * 60 * 60 * 1000;
export const SMS_HANDOFF_TOKEN_PATTERN = /^sh_[A-Za-z0-9_-]{22}$/;
export const SMS_HANDOFF_PATH = '/sms/continue/';

function text(value, fallback = '') {
  if (value === 0) return '0';
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}
function clean(value, max = 220) { return text(value).replace(/[<>\u0000-\u001F\u007F]/g, '').slice(0, max); }
function json(body, status = 200) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  }});
}
function error(status, code, message, detail = {}) { return json({ ok: false, error: { code, message, ...detail } }, status); }
function sameOrigin(request) {
  const origin = text(request.headers.get('origin'));
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch (_) { return false; }
}
function nowDate(options = {}) {
  const value = typeof options.now === 'function' ? options.now() : options.now;
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
export function createSmsHandoffToken() { return `sh_${randomBase64Url(16)}`; }
export async function smsHandoffKey(token) {
  if (!SMS_HANDOFF_TOKEN_PATTERN.test(text(token))) return '';
  return `${SMS_HANDOFF_PREFIX}${await sha256Hex(token)}`;
}
export function smsHandoffUrl(token, requestOrOrigin = 'https://coveragefit.com') {
  if (!SMS_HANDOFF_TOKEN_PATTERN.test(text(token))) return '';
  let origin = 'https://coveragefit.com';
  try { origin = new URL(typeof requestOrOrigin === 'string' ? requestOrOrigin : requestOrOrigin.url).origin; } catch (_) {}
  return new URL(`${SMS_HANDOFF_PATH}?token=${encodeURIComponent(token)}`, `${origin}/`).toString();
}
function handoffPayload(conversation) {
  const answers = conversation?.answers && typeof conversation.answers === 'object' ? conversation.answers : {};
  const partnerId = clean(conversation?.attribution?.partnerId, 64);
  return {
    source: '408farmers_sms',
    campaign: partnerId ? 'partner_referral' : `${clean(conversation?.intent, 40) || 'home'}_sms_intake`,
    campaignId: partnerId ? `${clean(conversation?.intent, 40) || 'home'}_partner_${partnerId}_sms` : `rc_sms_${clean(conversation?.intent, 40) || 'home'}`,
    entry: 'sms_handoff',
    assessment: 'home',
    reviewContext: !clean(conversation?.intent, 40) || conversation?.intent === 'buyer' ? 'Buying a home' : conversation?.intent === 'home_review' ? 'Reviewing current home coverage' : conversation?.intent === 'bundle' ? 'Home and auto together' : 'Coverage review',
    propertyAddress: clean(answers.propertyAddress),
    closingDate: clean(answers.closingDate, 40),
    closingDateDisplay: clean(answers.closingDateDisplay, 120),
    closingTiming: clean(answers.closingTiming, 80),
    occupancy: clean(answers.occupancy, 40),
    autoReview: answers.autoReview === true ? true : answers.autoReview === false ? false : null,
    reviewReason: clean(answers.reviewReason, 60),
    bundleStatus: clean(answers.bundleStatus, 60),
    requestCategory: clean(answers.requestCategory, 60),
    priority: answers.priority === 'rush' ? 'rush' : 'standard',
    rushRequested: answers.rushRequested === true,
    partnerId,
    partnerName: clean(conversation?.attribution?.partnerName, 100),
    partnerCode: clean(conversation?.attribution?.partnerCode, 16),
    referralSource: clean(conversation?.attribution?.referralSource, 60),
    entryMethod: clean(conversation?.attribution?.entryMethod, 30),
    conversationId: clean(conversation?.id, 100)
  };
}
export async function createSmsHandoff(conversation, options = {}) {
  if (!conversation || conversation.state !== 'coveragefit_ready') throw new TypeError('A CoverageFit-ready SMS conversation is required.');
  const store = options.store;
  if (!store?.setJSON) throw new TypeError('SMS handoff storage is unavailable.');
  const now = nowDate(options);
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + SMS_HANDOFF_TTL_MS).toISOString();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = createSmsHandoffToken();
    const key = await smsHandoffKey(token);
    const operationsRef = `sot_${randomBase64Url(16)}`;
    const record = {
      schemaVersion: SMS_HANDOFF_SCHEMA_VERSION,
      build: SMS_HANDOFF_BUILD,
      createdAt,
      expiresAt,
      payload: { ...handoffPayload(conversation), operationsRef }
    };
    try {
      await store.setJSON(key, record, { onlyIfNew: true, metadata: {
        schemaVersion: SMS_HANDOFF_SCHEMA_VERSION,
        build: SMS_HANDOFF_BUILD,
        source: '408farmers_sms',
        createdAt,
        updatedAt: createdAt,
        expiresAt
      }});
      if (options.operationsStore?.setJSON && conversation?.id) {
        const mapKey = `sms-ops/handoff-map/${await sha256Hex(operationsRef)}`;
        await options.operationsStore.setJSON(mapKey, { build: SMS_HANDOFF_BUILD, operationsRef, conversationId: clean(conversation.id,100), createdAt, expiresAt }, { metadata: { build: SMS_HANDOFF_BUILD, createdAt, updatedAt: createdAt, expiresAt } }).catch(() => {});
      }
      return { token, url: smsHandoffUrl(token, options.origin || 'https://coveragefit.com'), createdAt, expiresAt };
    } catch (cause) { if (attempt === 2) throw cause; }
  }
  throw new Error('Unable to create SMS handoff.');
}
export function smsHandoffIsFresh(record, now = new Date()) {
  const expiresAt = Date.parse(record?.expiresAt || '');
  return Boolean(record && record.schemaVersion === SMS_HANDOFF_SCHEMA_VERSION && Number.isFinite(expiresAt) && expiresAt > now.getTime());
}
export async function handleSmsHandoffRead(request, options = {}) {
  if (request.method !== 'POST') return error(405, 'method_not_allowed', 'POST is required.');
  if (!sameOrigin(request)) return error(403, 'origin_rejected', 'This handoff must be opened from CoverageFit.');
  let payload;
  try { payload = await request.json(); } catch (_) { return error(400, 'invalid_json', 'A valid handoff request is required.'); }
  const token = text(payload?.token);
  if (!SMS_HANDOFF_TOKEN_PATTERN.test(token)) return error(404, 'handoff_unavailable', 'This secure buyer handoff is unavailable.', { fallbackUrl: '/home/' });
  const store = options.store;
  if (!store?.get) return error(503, 'storage_unavailable', 'Secure handoff storage is unavailable.', { fallbackUrl: '/home/' });
  try {
    const record = await store.get(await smsHandoffKey(token));
    const now = nowDate(options);
    if (!record) return error(404, 'handoff_unavailable', 'This secure buyer handoff is unavailable.', { fallbackUrl: '/home/' });
    if (!smsHandoffIsFresh(record, now)) return error(410, 'handoff_expired', 'This secure buyer handoff has expired.', { fallbackUrl: '/home/' });
    const source = record.payload || {};
    if (options.operationsStore?.get && options.operationsStore?.setJSON && source.conversationId) {
      const key = `sms-live-conversations/${source.conversationId}`;
      const conversation = await options.operationsStore.get(key).catch(() => null);
      if (conversation && typeof conversation === 'object') {
        conversation.coverageFitStartedAt = conversation.coverageFitStartedAt || now.toISOString();
        conversation.updatedAt = now.toISOString();
        await options.operationsStore.setJSON(key, conversation, { metadata: { state: conversation.state || '', intent: conversation.intent || '', coverageFitStarted: true, createdAt: conversation.createdAt || now.toISOString(), updatedAt: conversation.updatedAt } }).catch(() => {});
      }
    }
    return json({ ok: true, handoff: {
      source: source.source,
      campaign: source.campaign,
      campaignId: source.campaignId,
      entry: source.entry,
      assessment: source.assessment,
      reviewContext: source.reviewContext,
      propertyAddress: source.propertyAddress,
      closingDate: source.closingDate,
      closingDateDisplay: source.closingDateDisplay,
      closingTiming: source.closingTiming,
      occupancy: source.occupancy,
      autoReview: source.autoReview,
      reviewReason: source.reviewReason,
      bundleStatus: source.bundleStatus,
      requestCategory: source.requestCategory,
      priority: source.priority,
      rushRequested: source.rushRequested,
      partnerId: source.partnerId,
      partnerName: source.partnerName,
      referralSource: source.referralSource,
      entryMethod: source.entryMethod,
      operationsRef: source.operationsRef,
      expiresAt: record.expiresAt
    }});
  } catch (cause) {
    console.error('CoverageFit SMS handoff read failed', cause);
    return error(503, 'handoff_read_failed', 'This secure buyer handoff could not be loaded.', { fallbackUrl: '/home/' });
  }
}
