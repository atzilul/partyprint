// Browser measurement for PARTYPRINT: Google Analytics 4 and Meta Pixel; approved events also use server CAPI.
//
// Before a choice, only the PageView is sent. In strict mode (the default), all
// other events stay in an in-memory queue until approval. In notice mode, Meta
// may also receive the non-identifying ViewContent, InitiateCheckout and
// FormStep events; approval flushes everything else and refusal drops the queue.
// A refusal is stored for 12 months. Events already sent are not recalled.
//
// Under Israel's Privacy Protection Law Amendment 13, notice is a business/legal
// decision. Keep strict as the default; do not enable notice without owner review.
//
// Every event name and parameter value is checked against a fixed allowlist.
// Raw names, emails, phones, free text, request/order IDs, coupon codes, design
// text and file names never enter event parameters. The opaque contact UUID is
// used only as Meta's Lead eventID option for browser/server deduplication; it is
// never a GA4 parameter.
// (Meta's automatic advanced matching is a dataset setting in Events Manager,
// not code: when enabled, Meta's own script may hash contact fields it finds.)
// See docs/analytics.md for the measurement plan.

export type ConsentChoice = 'granted' | 'denied';
type Params = Record<string, string | number>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & {queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown; callMethod?: (...args: unknown[]) => void; disablePushState?: boolean};
    _fbq?: unknown;
    [disable: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const CONSENT_KEY = 'partyprint-consent-v1';
export const CONSENT_EVENT = 'partyprint-consent';
const CONSENT_MAX_AGE = 365 * 86400000;
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;
const PIXEL_ID = /^\d{8,20}$/;
const EVENT_UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** The saved contact UUID is the matching identifier for browser and server Lead events. */
export function savedLeadEventId(name:string,contactId:string):string|null{
  return name==='generate_lead'&&EVENT_UUID.test(contactId)?contactId:null;
}

export type MetaMode = 'notice' | 'strict';
/** Unknown or invalid configuration is strict; only an explicit server setting enables notice mode. */
export function consentModeFromConfig(value: unknown): MetaMode {
  return value === 'notice' ? 'notice' : 'strict';
}

// Staff, customer tracking and design-approval pages are never measured.
const EXCLUDED_PREFIXES = ['/admin', '/track', '/design', '/api', '/signin-with-chatgpt', '/signout-with-chatgpt', '/chatgpt-auth'];
export function isExcludedPath(path: string) {
  return EXCLUDED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export const PACKAGE_TYPES = ['family_birthday', 'bride_squad', 'groom_crew', 'team', 'custom', 'single'] as const;
export function packageType(index: number): string | undefined {
  return PACKAGE_TYPES[index];
}
export function quantityBand(quantity: number): string | undefined {
  if (!Number.isFinite(quantity) || quantity < 1) return undefined;
  return quantity <= 5 ? '1-5' : quantity <= 10 ? '6-10' : quantity <= 20 ? '11-20' : quantity <= 50 ? '21-50' : '51-100';
}
export function requestMode(mode: string): string | undefined {
  return mode === 'lead' || mode === 'custom' || mode === 'order' ? mode : undefined;
}
export const STEP_NAMES = ['package', 'details', 'idea', 'shirts_optional'] as const;

/** Maps a failed /api/orders response to a fixed category (never the message text). */
export function submitErrorType(status: number | 'network' | 'no_confirmation'): string {
  if (status === 'network' || status === 'no_confirmation') return status;
  if (status === 429) return 'rate_limited';
  if (status === 409) return 'price_or_coupon_changed';
  if (status === 413) return 'files_too_large';
  if (status === 400) return 'validation_rejected';
  if (status === 403 || status === 415) return 'request_rejected';
  if (status >= 500) return 'server_unavailable';
  return 'unknown';
}

const range = (from: number, to: number) => Array.from({length: to - from + 1}, (_, i) => from + i);
const VALUES: Record<string, readonly (string | number)[]> = {
  package_type: PACKAGE_TYPES,
  request_mode: ['order', 'custom', 'lead'],
  quantity_band: ['1-5', '6-10', '11-20', '21-50', '51-100'],
  coupon_status: ['accepted', 'rejected', 'empty', 'error', 'none'],
  step_number: [1, 2, 3],
  step_name: STEP_NAMES,
  field_name: ['shirts', 'name', 'phone', 'email', 'event_date', 'brief', 'images'],
  error_type: [
    'missing_name', 'invalid_phone', 'invalid_email', 'invalid_event_date', 'missing_shirt_choice', 'upload_limit',
    'network', 'rate_limited', 'price_or_coupon_changed', 'files_too_large', 'validation_rejected',
    'request_rejected', 'server_unavailable', 'no_confirmation', 'unknown',
  ],
  cta_location: ['header', 'hero', 'package', 'size_help', 'order_form', 'confirmation', 'contact', 'footer', 'policy', 'content', 'other'],
  faq_index: range(1, 60),
  content_name: [...PACKAGE_TYPES, 'order', 'custom', 'lead', 'details'],
  currency: ['ILS'],
};
const EVENTS: Record<string, readonly string[]> = {
  select_package: ['package_type', 'request_mode'],
  begin_order_request: ['request_mode', 'package_type', 'value', 'currency', 'num_items', 'content_name'],
  form_step: ['step_number', 'step_name', 'request_mode', 'content_name'],
  form_field_complete: ['field_name', 'request_mode'],
  form_submit_attempt: ['request_mode', 'package_type'],
  coupon_apply: ['coupon_status'],
  form_validation_error: ['error_type'],
  form_submit_error: ['error_type'],
  faq_open: ['faq_index'],
  generate_lead: ['request_mode', 'package_type', 'quantity_band', 'coupon_status', 'value', 'currency', 'num_items'],
  complete_order_request: ['request_mode', 'package_type', 'quantity_band', 'coupon_status', 'value', 'currency', 'num_items', 'content_name'],
  contact_save_attempt: ['request_mode', 'package_type'],
  contact_save_error: ['error_type'],
  // One named event per contact channel.
  contact_order_form: ['request_mode', 'package_type', 'quantity_band'],
  contact_consult_form: [],
  contact_whatsapp: ['cta_location'],
  contact_email: ['cta_location'],
  contact_phone: ['cta_location'],
};

function allowedValue(key: string, value: string | number) {
  if (key === 'value') return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000;
  if (key === 'num_items') return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100;
  return VALUES[key]?.includes(value) ?? false;
}

function clean(name: string, params: Record<string, string | number | undefined>): Params | null {
  const allowed = EVENTS[name];
  if (!allowed) return null;
  const out: Params = {};
  for (const key of allowed) {
    const value = params[key];
    if (value !== undefined && allowedValue(key, value)) out[key] = value;
  }
  return out;
}

type MetaParams = Record<string, string | number | string[]>;
type MetaEventSpec = {method: 'track' | 'trackCustom'; event: string; data: MetaParams};
function standardMetaData(p: Params, contentName?: string): MetaParams {
  const data: MetaParams = {};
  for (const key of ['value', 'currency', 'num_items', 'content_category'] as const) {
    const value = p[key];
    if (value !== undefined) data[key] = value;
  }
  const name = contentName || (typeof p.content_name === 'string' ? p.content_name : undefined);
  const packageType = typeof p.package_type === 'string' ? p.package_type : undefined;
  if (name) data.content_name = name;
  if (packageType) data.content_ids = [packageType];
  return data;
}

/** Maps internal events to browser Meta events. The CAPI subset uses the same event IDs. */
export function metaEvents(name: string, p: Params): MetaEventSpec[] {
  switch (name) {
    case 'select_package':
      return [{method: 'track', event: 'ViewContent', data: p.package_type ? {content_category: p.package_type} : {}}];
    case 'begin_order_request': {
      const checkoutName = typeof p.content_name === 'string' ? p.content_name : typeof p.package_type === 'string' ? p.package_type : undefined;
      const checkout = standardMetaData(p, checkoutName);
      const start: MetaParams = typeof p.package_type === 'string' ? {content_category: p.package_type} : {};
      return [
        {method: 'track', event: 'InitiateCheckout', data: checkout},
        {method: 'trackCustom', event: 'FormStart', data: start},
      ];
    }
    case 'complete_order_request':
      return [
        {method: 'trackCustom', event: 'RequestComplete', data: p},
        {method: 'track', event: 'SubmitApplication', data: standardMetaData(p, typeof p.content_name === 'string' ? p.content_name : typeof p.package_type === 'string' ? p.package_type : undefined)},
      ];
    case 'generate_lead':
      return [{method: 'track', event: 'Lead', data: {
        ...standardMetaData(p, typeof p.request_mode === 'string' ? p.request_mode : undefined),
        ...(p.package_type ? {content_category: p.package_type} : {}),
      }}];
    case 'contact_whatsapp':
      return [{method: 'track', event: 'Contact', data: {content_name: 'whatsapp', ...(p.cta_location ? {content_category: p.cta_location} : {})}}];
    case 'contact_email':
      return [{method: 'track', event: 'Contact', data: {content_name: 'email', ...(p.cta_location ? {content_category: p.cta_location} : {})}}];
    case 'contact_phone':
      return [{method: 'track', event: 'Contact', data: {content_name: 'phone', ...(p.cta_location ? {content_category: p.cta_location} : {})}}];
    case 'form_step':
      return [{method: 'trackCustom', event: 'FormStep', data: {
        ...p,
        ...(p.step_name === 'details' ? {content_name: 'details'} : {}),
      }}];
    case 'form_submit_attempt':
      return [{method: 'trackCustom', event: 'FormSubmitAttempt', data: p}];
    case 'meta_page_view':
      return [{method: 'track', event: 'PageView', data: {}}];
    default:
      return [];
  }
}

// ---- choice and buffered dispatch ----

let choice: ConsentChoice | null = null, choiceLoaded = false;
type PendingEvent = {
  name: string;
  params: Params;
  occurredAt: number;
  eventIds: Record<string, string>;
  pixelSent: string[];
  gaSent: boolean;
  contact?: LeadCapability;
  receiptKey?: string;
  dedupeKey?: string;
  firstPartyKind?: 'view' | 'form_start';
  pagePath?: string;
};
type LeadCapability = {id: string; token: string};
type ServerMetaName = 'PageView' | 'FormStart' | 'FormStep' | 'Lead';
let pending: PendingEvent[] = [];
export const MAX_PENDING_ANALYTICS_EVENTS = 50;
export function hasPendingAnalyticsCapacity(queueSize:number):boolean{
  return Number.isInteger(queueSize)&&queueSize>=0&&queueSize<MAX_PENDING_ANALYTICS_EVENTS;
}

export function readConsent(): ConsentChoice | null {
  if (choiceLoaded) return choice;
  choiceLoaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as {analytics?: unknown; at?: unknown} | null;
    if (raw && typeof raw.at === 'number' && Date.now() - raw.at < CONSENT_MAX_AGE && (raw.analytics === 'granted' || raw.analytics === 'denied')) choice = raw.analytics;
  } catch { /* storage unavailable: show the notice again */ }
  return choice;
}

export function saveConsent(next: ConsentChoice) {
  choice = next; choiceLoaded = true;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({analytics: next, at: Date.now()})); } catch { /* keep the in-memory choice */ }
  if (next === 'denied') { pending = []; disableMeasurement(); }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function excludedNow() {
  return typeof location === 'undefined' || isExcludedPath(location.pathname);
}
function enabled() {
  return typeof window !== 'undefined' && !excludedNow() && readConsent() !== 'denied';
}

function serverMetaName(value: string): value is ServerMetaName {
  return value === 'PageView' || value === 'FormStart' || value === 'FormStep' || value === 'Lead';
}
function createPending(name: string, params: Params, options: {occurredAt?: number; leadId?: string; contact?: LeadCapability; receiptKey?: string; dedupeKey?: string; firstPartyKind?: 'view' | 'form_start'; pagePath?: string} = {}): PendingEvent {
  const eventIds: Record<string, string> = {};
  for (const spec of metaEvents(name, params)) {
    eventIds[spec.event] = spec.event === 'Lead' && options.leadId ? options.leadId : crypto.randomUUID();
  }
  return {
    name, params, occurredAt: options.occurredAt ?? Date.now(), eventIds, pixelSent: [], gaSent: false,
    ...(options.contact ? {contact: options.contact} : {}),
    ...(options.receiptKey ? {receiptKey: options.receiptKey} : {}),
    ...(options.dedupeKey ? {dedupeKey: options.dedupeKey} : {}),
    ...(options.firstPartyKind ? {firstPartyKind: options.firstPartyKind} : {}),
    ...(options.pagePath ? {pagePath: options.pagePath} : {}),
  };
}
function enqueue(item: PendingEvent): PendingEvent | null {
  if (item.dedupeKey) {
    const existing = pending.find(entry => entry.dedupeKey === item.dedupeKey);
    if (existing) {
      if (item.contact) existing.contact = item.contact;
      return existing;
    }
  }
  if (!hasPendingAnalyticsCapacity(pending.length)) return null;
  pending.push(item);
  pending.sort((left, right) => left.occurredAt - right.occurredAt);
  return item;
}
function metaReady() {
  return metaLoaded && typeof window.fbq === 'function';
}
function metaAllowed() {
  return !!pixelId && enabled() && readConsent() === 'granted';
}
function sendServerMetaEvent(eventName: ServerMetaName, eventID: string, occurredAt: number, clientData: MetaParams, contact?: LeadCapability) {
  if (readConsent() !== 'granted') return;
  const body = {
    event_name: eventName, event_id: eventID, event_time: Math.floor(occurredAt / 1000),
    event_source_url: safeLocation(), metaConsent: 'granted', client_data: clientData,
    ...(contact ? {contact} : {}),
  };
  fetch('/api/events', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), keepalive: true,
  }).catch(() => {});
}
function dispatchMeta(item: PendingEvent, preChoice = false) {
  const specs = metaEvents(item.name, item.params);
  const allowedBeforeChoice = new Set(['PageView', 'ViewContent', 'InitiateCheckout', 'FormStep']);
  for (const spec of specs) {
    if (preChoice && !(spec.event === 'PageView' || (metaMode === 'notice' && allowedBeforeChoice.has(spec.event)))) continue;
    const eventID = item.eventIds[spec.event];
    if (!item.pixelSent.includes(spec.event)) {
      window.fbq?.(spec.method, spec.event, spec.data, ...(eventID ? [{eventID}] : []));
      item.pixelSent.push(spec.event);
    }
    if (!preChoice && serverMetaName(spec.event) && eventID) {
      sendServerMetaEvent(spec.event, eventID, item.occurredAt, spec.data, item.contact);
    }
  }
}
function dispatchFirstParty(item: PendingEvent) {
  if (!item.firstPartyKind || readConsent() !== 'granted') return;
  fetch('/api/events', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({kind: item.firstPartyKind}), keepalive: true,
  }).catch(() => {});
}
function markSavedReceipt(item: PendingEvent) {
  if (!item.receiptKey) return;
  const specs = metaEvents(item.name, item.params);
  const sent = {ga: item.gaSent, meta: specs.length > 0 && specs.every(spec => item.pixelSent.includes(spec.event))};
  receiptEvents.set(item.receiptKey, sent);
  try { sessionStorage.setItem(item.receiptKey, JSON.stringify(sent)); } catch { /* private-tab storage can be unavailable */ }
}
function sendItem(item: PendingEvent) {
  if (item.firstPartyKind) { dispatchFirstParty(item); return; }
  if (item.name !== 'meta_page_view' && !item.gaSent && measurementId && window.gtag) {
    window.gtag('event', item.name, {...item.params, event_time: Math.floor(item.occurredAt / 1000)});
    item.gaSent = true;
  }
  if (metaReady() && metaAllowed()) dispatchMeta(item);
  markSavedReceipt(item);
}

/** Records an allowlisted interaction. Undecided visitors get an in-memory queue, never persistent storage. */
export function track(name: string, params: Record<string, string | number | undefined> = {}) {
  if (!enabled()) return;
  const safe = clean(name, params);
  if (!safe) return;
  const item = createPending(name, safe);
  if (readConsent() === 'granted' && tagsState === 'ready' && pending.length === 0) { sendItem(item); return; }
  const queued = enqueue(item);
  if (queued && readConsent() === null && metaMode === 'notice' && tagsState === 'ready' && metaReady()) dispatchMeta(queued, true);
}

/** First-party counters follow the same consent queue and are dropped on refusal. */
export function siteEvent(kind: 'view' | 'form_start') {
  if (!enabled()) return;
  const item = createPending('__first_party', {}, {firstPartyKind: kind});
  if (readConsent() === 'granted' && tagsState === 'ready' && pending.length === 0) dispatchFirstParty(item);
  else enqueue(item);
}

function flush() {
  if (readConsent() === 'denied') { pending = []; return; }
  if (readConsent() === null) {
    if (metaMode === 'notice' && metaReady()) for (const item of pending) dispatchMeta(item, true);
    return;
  }
  const items = pending; pending = [];
  for (const item of items) sendItem(item);
}

// ---- tags ----

let tagsState: 'idle' | 'loading' | 'ready' = 'idle';
let loading: Promise<void> | null = null;
let measurementId = '', pixelId = '';
let lastLocation = '', lastPath = '', lastMetaPath = '';
let metaLoaded = false, metaMode: MetaMode = 'strict';
let configLoading: Promise<void> | null = null;
function loadConfig() {
  configLoading ??= (async () => {
    try {
      const response = await fetch('/api/analytics-config', {headers: {Accept: 'application/json'}});
      const config = response.ok ? await response.json() as {measurementId?: string; metaPixelId?: string; consentMode?: string} : {};
      measurementId = MEASUREMENT_ID.test(config.measurementId || '') ? config.measurementId as string : '';
      pixelId = PIXEL_ID.test(config.metaPixelId || '') ? config.metaPixelId as string : '';
      metaMode = consentModeFromConfig(config.consentMode);
    } catch { measurementId = ''; pixelId = ''; metaMode = 'strict'; }
  })();
  return configLoading;
}

/** This is a server-controlled setting; an absent or invalid value is strict. */
export async function getMetaMode(): Promise<MetaMode> {
  await loadConfig();
  return metaMode;
}

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic', 'gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid'];
function safeLocation() {
  const url = new URL(location.href), out = new URL(url.origin + url.pathname);
  for (const key of CAMPAIGN_KEYS) {
    const value = url.searchParams.get(key);
    if (value && !value.includes('@')) out.searchParams.set(key, value.slice(0, 200));
  }
  return out.toString();
}
function safeReferrer() {
  try {
    if (!document.referrer) return '';
    const ref = new URL(document.referrer);
    if (ref.origin !== location.origin) return ref.origin + '/';
    return isExcludedPath(ref.pathname) ? ref.origin + '/' : ref.origin + ref.pathname;
  } catch { return ''; }
}
function debugRequested() {
  try {
    if (new URL(location.href).searchParams.get('ga_debug') === '1') sessionStorage.setItem('partyprint-ga-debug', '1');
    return sessionStorage.getItem('partyprint-ga-debug') === '1';
  } catch { return false; }
}
function deleteCookies(match: (name: string) => boolean) {
  const host = location.hostname, parent = host.replace(/^www\./, '');
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0].trim();
    if (!match(name)) continue;
    for (const domain of ['', '; domain=' + host, '; domain=.' + parent]) document.cookie = name + '=; Max-Age=0; path=/' + domain;
  }
}
function setGaDisabled(id: string, disabled: boolean) {
  const key = `ga-disable-${id}` as `ga-disable-${string}`;
  window[key] = disabled;
}
function disableMeasurement() {
  if (measurementId) setGaDisabled(measurementId, true);
  window.gtag?.('consent', 'update', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  window.fbq?.('consent', 'revoke');
  deleteCookies(name => name === '_ga' || name.startsWith('_ga_') || name === '_fbp' || name === '_fbc' || name.startsWith('_gcl_'));
  lastPath = ''; lastMetaPath = '';
}
function loadGoogle(id: string) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
  const consent = readConsent() === 'granted' ? 'granted' : 'denied';
  setGaDisabled(id, false);
  window.gtag('consent', 'default', {analytics_storage: consent, ad_storage: consent, ad_user_data: consent, ad_personalization: consent});
  window.gtag('js', new Date());
  window.gtag('config', id, {send_page_view: false, ...(debugRequested() ? {debug_mode: true} : {})});
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
}
function loadMeta(id: string, grantConsent: boolean) {
  if (!window.fbq) {
    type FbqStub = ((...args: unknown[]) => void) & {queue: unknown[]; loaded: boolean; version: string; push: unknown; callMethod?: (...args: unknown[]) => void; disablePushState?: boolean};
    const fbq = function fbqStub(...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.call(fbq, ...args); else fbq.queue.push(args);
    } as FbqStub;
    fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; fbq.push = fbq;
    fbq.disablePushState = true;
    window.fbq = fbq; window._fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  window.fbq!('set', 'autoConfig', false, id);
  if (grantConsent) window.fbq!('consent', 'grant');
  window.fbq!('init', id);
  metaLoaded = true;
}
async function loadTags() {
  tagsState = 'loading';
  await loadConfig();
  if (!enabled()) { tagsState = 'idle'; return; }
  if (measurementId) loadGoogle(measurementId);
  tagsState = 'ready';
}
function ensureMeta(forPageView = false) {
  const current = readConsent();
  if (!pixelId || !enabled() || current === 'denied') return;
  if (current === null && metaMode !== 'notice' && !forPageView) return;
  if (!metaLoaded) loadMeta(pixelId, current === 'granted');
  else if (current === 'granted') window.fbq?.('consent', 'grant');
}
function sendPageView() {
  if (tagsState !== 'ready' || excludedNow()) return;
  const path = location.pathname + location.search;
  if (path !== lastPath) {
    lastPath = path;
    const page = {page_location: safeLocation(), page_referrer: lastLocation || safeReferrer(), page_title: document.title.slice(0, 120)};
    lastLocation = page.page_location;
    if (measurementId) {
      window.gtag?.('set', page);
      window.gtag?.('event', 'page_view', page);
    }
  }
  if (!pixelId || path === lastMetaPath || readConsent() === 'denied') return;
  const item = createPending('meta_page_view', {}, {pagePath: path, dedupeKey: 'meta-page:' + path});
  item.gaSent = true;
  if (readConsent() === 'granted' && metaReady() && pending.length === 0) {
    lastMetaPath = path;
    sendItem(item);
    return;
  }
  const queued = enqueue(item);
  if (!queued) return;
  lastMetaPath = path;
  if (readConsent() === null && metaReady()) dispatchMeta(queued, true);
}

/** Called by the consent manager on load, after a choice and on every route change. */
export async function startAnalytics() {
  if (!enabled()) return;
  if (tagsState === 'idle') loading = loadTags();
  if (loading) await loading;
  if (!enabled() || tagsState !== 'ready') return;
  if (measurementId && readConsent() === 'granted') {
    setGaDisabled(measurementId, false);
    window.gtag?.('consent', 'update', {analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted'});
  }
  ensureMeta(readConsent() === null);
  sendPageView();
  flush();
}

// ---- delegated listeners ----

const CTA_CONTEXT: [string, string][] = [
  ['.whatsapp-handoff', 'confirmation'],
  ['.size-guide, .shirt-options', 'size_help'],
  ['.order-reassurance, .order-copy', 'package'],
  ['#order-form, .form-card', 'order_form'],
  ['.studio-contact, #contact, .contact-section', 'contact'],
  ['.policy-page', 'policy'],
  ['.trust-strip, footer, .site-seo-footer, .seo-footer', 'footer'],
  ['.topbar, header, nav', 'header'],
  ['.hero', 'hero'],
  ['main, article, section', 'content'],
];

function ctaLocation(link: Element) {
  const explicit = link.closest('[data-cta-location]')?.getAttribute('data-cta-location');
  if (explicit) return explicit;
  for (const [selector, label] of CTA_CONTEXT) if (link.closest(selector)) return label;
  return 'other';
}

let listening = false;
export function installInteractionTracking() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('click', event => {
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('mailto:')) { track('contact_email', {cta_location: ctaLocation(link)}); return; }
    if (href.startsWith('tel:')) { track('contact_phone', {cta_location: ctaLocation(link)}); return; }
    let host = '';
    try { host = new URL(link.href).hostname; } catch { return; }
    if (host === 'wa.me' || host === 'api.whatsapp.com' || host === 'web.whatsapp.com') track('contact_whatsapp', {cta_location: ctaLocation(link)});
  }, true);
  // FAQ answers are site-authored <details> without a class; only their position is sent.
  document.addEventListener('toggle', event => {
    const details = event.target as HTMLDetailsElement;
    if (!(details instanceof HTMLDetailsElement) || !details.open || details.className) return;
    if (details.closest('form, .size-guide')) return;
    const index = Array.from(document.querySelectorAll('details:not([class])')).indexOf(details) + 1;
    if (index > 0) track('faq_open', {faq_index: index});
  }, true);
}

// A saved receipt deduplicates its Lead and completion in this tab only.
const receiptEvents = new Map<string, {ga: boolean; meta: boolean}>();
function receiptStatus(key: string) {
  let sent = receiptEvents.get(key);
  if (!sent) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || 'null');
      sent = {ga: stored?.ga === true, meta: stored?.meta === true};
    } catch { sent = {ga: false, meta: false}; }
    receiptEvents.set(key, sent);
  }
  return sent;
}
async function trackSavedRequestEvent(name: 'generate_lead' | 'complete_order_request', localReceiptId: string, params: Record<string, string | number | undefined>, contactToken?: string) {
  if (!/^[a-f0-9-]{36}$/i.test(localReceiptId) || !enabled()) return;
  const safe = clean(name, params);
  if (!safe) return;
  const storageKey = (name === 'generate_lead' ? 'partyprint-lead-' : 'partyprint-complete-') + localReceiptId;
  const sent = receiptStatus(storageKey);
  if (sent.ga && sent.meta) return;
  const leadId = savedLeadEventId(name, localReceiptId) || undefined;
  const contact = name === 'generate_lead' && contactToken ? {id: localReceiptId, token: contactToken} : undefined;
  if (readConsent() === null) {
    const item = createPending(name, safe, {
      leadId, contact, receiptKey: storageKey, dedupeKey: 'receipt:' + storageKey,
    });
    item.gaSent = sent.ga;
    if (sent.meta) item.pixelSent = metaEvents(name, safe).map(spec => spec.event);
    enqueue(item);
    return;
  }
  await startAnalytics();
  if (!enabled() || tagsState !== 'ready') return;
  const current = receiptStatus(storageKey);
  if (current.ga && current.meta) return;
  const item = createPending(name, safe, {
    leadId, contact, receiptKey: storageKey, dedupeKey: 'receipt:' + storageKey,
  });
  item.gaSent = current.ga;
  if (current.meta) item.pixelSent = metaEvents(name, safe).map(spec => spec.event);
  sendItem(item);
}

export const trackSavedLead = (id: string, params: Record<string, string | number | undefined>, token?: string) => trackSavedRequestEvent('generate_lead', id, params, token);
export const trackSavedCompletion = (id: string, params: Record<string, string | number | undefined>) => trackSavedRequestEvent('complete_order_request', id, params);
