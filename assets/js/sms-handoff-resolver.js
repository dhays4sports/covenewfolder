(() => {
  'use strict';
  const PROFILE_KEY = 'coveragefit_prospect_profile_v1';
  const SMS_CONTEXT_KEY = 'coveragefit_sms_handoff_context_v1';
  const TRANSITION_KEY = 'coveragefit_transition_v1';
  const WELCOME_KEY = 'coveragefit_transition_welcome_v1';
  const PERSONALIZATION_KEY = 'coveragefit_personalization_context_v1';
  const clean = (value, max = 220) => String(value == null ? '' : value).trim().replace(/[<>\u0000-\u001F\u007F]/g, '').slice(0, max);
  const save = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const params = new URLSearchParams(location.search);
  const token = clean(params.get('token'), 80);
  const status = document.getElementById('status');
  const loading = document.getElementById('loading');
  const fallback = document.getElementById('fallback');
  const fallbackCopy = document.getElementById('fallbackCopy');
  const fail = (message) => {
    try { history.replaceState(history.state, document.title, location.pathname); } catch (_) {}
    if (loading) loading.hidden = true;
    if (fallback) fallback.setAttribute('aria-hidden', 'false');
    if (fallbackCopy && message) fallbackCopy.textContent = message;
  };
  if (!/^sh_[A-Za-z0-9_-]{22}$/.test(token)) { fail('This secure continuation is unavailable. You can still start the guided CoverageFit Home review.'); return; }
  if (status) status.textContent = 'Verifying your secure intake…';
  fetch('/api/sms/handoff/read', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok || !data?.handoff) throw Object.assign(new Error(data?.error?.message || 'This secure continuation could not be loaded.'), { status: response.status });
    const h = data.handoff;
    const now = new Date().toISOString();
    const profile = {
      version: '1.2', firstName: '', lastName: '', fullName: '', phone: '', email: '',
      propertyAddress: clean(h.propertyAddress), reviewContext: clean(h.reviewContext || 'Buying a home', 120),
      contactPermission: { confirmed: true, status: 'confirmed', basis: 'inbound_sms_request', source: '408farmers_sms', contract: 'coveragefit-handoff-v1', capturedAt: now, version: 'RC-SMS-1.9' },
      address: { formattedAddress: clean(h.propertyAddress), street: '', city: '', county: '', state: '', postalCode: '', country: 'US', placeId: '', selectionMethod: 'sms' },
      integration: { source: clean(h.source || '408farmers_sms',80), campaign: clean(h.campaign,160), campaignId: clean(h.campaignId,180), campaignVariant: '', campaignZip: '', entry: clean(h.entry || 'sms_handoff',100), assessment: 'home', sessionId: '', handoffVersion: '1', handoffContract: 'coveragefit-handoff-v1', senderBuild: 'RC-SMS-1.9', leadCaptured: true, leadCaptureStatus: 'sms_intake_complete', prefilled: true, partnerId: clean(h.partnerId,64), partnerName: clean(h.partnerName,100), referralSource: clean(h.referralSource,60), entryMethod: clean(h.entryMethod,30), operationsRef: clean(h.operationsRef,80) },
      smsContext: { reviewReason: clean(h.reviewReason,60), bundleStatus: clean(h.bundleStatus,60), requestCategory: clean(h.requestCategory,60), closingDate: clean(h.closingDate,40), closingDateDisplay: clean(h.closingDateDisplay,120), closingTiming: clean(h.closingTiming,80), occupancy: clean(h.occupancy,40), autoReview: h.autoReview === true ? true : h.autoReview === false ? false : null, priority: h.priority === 'rush' ? 'rush' : 'standard', rushRequested: h.rushRequested === true },
      receivedAt: now
    };
    save(sessionStorage, PROFILE_KEY, profile); save(localStorage, PROFILE_KEY, profile); save(sessionStorage, SMS_CONTEXT_KEY, profile.smsContext);
    save(sessionStorage, TRANSITION_KEY, { version:'1.0', destination:'/home/', hasProfile:true, source:'408farmers_sms', campaign:profile.integration.campaign, createdAt:now });
    try { sessionStorage.removeItem(WELCOME_KEY); sessionStorage.removeItem(PERSONALIZATION_KEY); } catch (_) {}
    try { history.replaceState(history.state, document.title, location.pathname); } catch (_) {}
    if (status) status.textContent = 'Intake verified. Preparing CoverageFit…';
    location.replace('/transition/');
  }).catch(error => fail(error?.status === 410 ? 'This secure continuation has expired. You can still start the guided CoverageFit Home review.' : 'This secure continuation is unavailable. You can still start the guided CoverageFit Home review.'));
})();
