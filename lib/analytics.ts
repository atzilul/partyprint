// Measurement for PARTYPRINT (browser only): Google Analytics 4 and the Meta pixel.
//
// Google Analytics: notice + opt-out (owner's decision, Oct 2026). It loads on
// public pages unless the visitor clicks "לא, תודה".
//
// Meta pixel, by region (see metaMode):
//  - Israel ("notice"): before a choice the pixel may send PageView only; other
//    Meta events wait for "אישור"; "לא, תודה" stops every further Meta event.
//  - Everywhere else, including the EU and any visitor whose region cannot be
//    identified ("strict"): the pixel is not loaded at all until "אישור".
// A refusal is stored for 12 months. Events already sent are not recalled.
//
// Every event name and every parameter value we send is checked against a fixed
// allowlist; anything else is dropped. Names, emails, phones, free text, order
// IDs, coupon codes, design text and file names are never passed in here.
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

export type MetaMode = 'notice' | 'strict';
const ISRAEL_TIME_ZONES = ['Asia/Jerusalem', 'Asia/Tel_Aviv'];

/**
 * Israel gets the notice mode; anything else (EU, other countries, unknown) is
 * strict. A country from a trusted server header wins; without one, the
 * browser's time zone is the only signal, and a missing or non-Israeli zone is
 * treated as unknown, i.e. strict.
 */
export function metaModeFor(country: string, timeZone: string): MetaMode {
  if (/^[A-Z]{2}$/.test(country)) return country === 'IL' ? 'notice' : 'strict';
  return ISRAEL_TIME_ZONES.includes(timeZone) ? 'notice' : 'strict';
}
function browserTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

// Staff, customer tracking and design-approval pages are never measured.
const EXCLUDED_PREFIXES = ['/admin', '/track', '/design', '/api', '/signin-with-chatgpt', '/signout-with-chatgpt'];
export function isExcludedPath(path: string) {
  return EXCLUDED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export const PACKAGE_TYPES = ['family_birthday', 'bride_squad', 'groom_crew', 'team', 'custom'] as const;
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
export const STEP_NAMES = ['package', 'shirts', 'details'] as const;

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
};
const EVENTS: Record<string, readonly string[]> = {
  select_package: ['package_type', 'request_mode'],
  begin_order_request: ['request_mode', 'package_type'],
  form_step: ['step_number', 'step_name', 'request_mode'],
  form_field_complete: ['field_name', 'request_mode'],
  form_submit_attempt: ['request_mode', 'package_type'],
  coupon_apply: ['coupon_status'],
  form_validation_error: ['error_type'],
  form_submit_error: ['error_type'],
  faq_open: ['faq_index'],
  generate_lead: ['request_mode', 'package_type', 'quantity_band', 'coupon_status'],
  // One named event per contact channel.
  contact_order_form: ['request_mode', 'package_type', 'quantity_band'],
  contact_consult_form: [],
  contact_whatsapp: ['cta_location'],
  contact_email: ['cta_location'],
  contact_phone: ['cta_location'],
};

function clean(name: string, params: Record<string, string | number | undefined>): Params | null {
  const allowed = EVENTS[name];
  if (!allowed) return null;
  const out: Params = {};
  for (const key of allowed) {
    const value = params[key];
    if (value !== undefined && VALUES[key].includes(value)) out[key] = value;
  }
  return out;
}

/** The Meta pixel receives standard events only, built from the already-cleaned GA parameters. */
function metaEvent(name: string, p: Params): [method: 'track' | 'trackCustom', event: string, data: Params] | null {
  switch (name) {
    case 'select_package': return ['track', 'ViewContent', p.package_type ? {content_category: p.package_type} : {}];
    case 'begin_order_request': return ['track', 'InitiateCheckout', p.package_type ? {content_category: p.package_type} : {}];
    case 'generate_lead': return ['track', 'Lead', {...(p.package_type ? {content_category: p.package_type} : {}), ...(p.request_mode ? {content_name: p.request_mode} : {})}];
    case 'contact_whatsapp': return ['track', 'Contact', {content_name: 'whatsapp', ...(p.cta_location ? {content_category: p.cta_location} : {})}];
    case 'contact_email': return ['track', 'Contact', {content_name: 'email', ...(p.cta_location ? {content_category: p.cta_location} : {})}];
    case 'contact_phone': return ['track', 'Contact', {content_name: 'phone', ...(p.cta_location ? {content_category: p.cta_location} : {})}];
    case 'form_step': return ['trackCustom', 'FormStep', p];
    case 'form_submit_attempt': return ['trackCustom', 'FormSubmitAttempt', p];
    default: return null;
  }
}

// ---- choice ----

let choice: ConsentChoice | null = null, choiceLoaded = false;

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
/** Measurement runs on public pages unless the visitor opted out. */
function enabled() {
  return typeof window !== 'undefined' && !excludedNow() && readConsent() !== 'denied';
}

// ---- dispatch ----

type Pending = {name: string; params: Params};
let pending: Pending[] = [];
const MAX_PENDING = 30;

/** Records an allowlisted event in GA4 (and its Meta equivalent). */
export function track(name: string, params: Record<string, string | number | undefined> = {}) {
  if (!enabled()) return;
  const safe = clean(name, params);
  if (!safe) return;
  if (tagsState === 'ready') send(name, safe);
  else if (pending.length < MAX_PENDING) pending.push({name, params: safe});
}

function send(name: string, params: Params) {
  if (measurementId) window.gtag?.('event', name, params);
  // Meta events other than PageView need an explicit "אישור" in every region.
  const meta = metaReady() && metaAllowed('event') ? metaEvent(name, params) : null;
  if (meta) window.fbq?.(meta[0], meta[1], meta[2]);
}

/** Aggregate first-party counter (/api/events), same opt-out rule. */
export function siteEvent(kind: 'view' | 'form_start') {
  if (!enabled()) return;
  fetch('/api/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({kind})}).catch(() => {});
}

function flush() {
  const items = pending; pending = [];
  for (const item of items) send(item.name, item.params);
}

// ---- tags ----

let tagsState: 'idle' | 'loading' | 'ready' = 'idle';
let loading: Promise<void> | null = null;
let measurementId = '', pixelId = '', country = '';
let lastLocation = '', lastPath = '', lastMetaPath = '';
let metaLoaded = false, metaMode: MetaMode = 'strict';

let configLoading: Promise<void> | null = null;
function loadConfig() {
  configLoading ??= (async () => {
    try {
      const response = await fetch('/api/analytics-config', {headers: {Accept: 'application/json'}});
      const config = response.ok ? await response.json() as {measurementId?: string; metaPixelId?: string; country?: string} : {};
      measurementId = MEASUREMENT_ID.test(config.measurementId || '') ? config.measurementId as string : '';
      pixelId = PIXEL_ID.test(config.metaPixelId || '') ? config.metaPixelId as string : '';
      country = /^[A-Z]{2}$/.test(config.country || '') ? config.country as string : '';
    } catch { measurementId = ''; pixelId = ''; country = ''; }
  })();
  return configLoading;
}

/** This visitor's Meta mode; the notice text depends on it. */
export async function getMetaMode(): Promise<MetaMode> {
  await loadConfig();
  return metaModeFor(country, browserTimeZone());
}

/**
 * Meta may run when the visitor chose "אישור"; before any choice only PageView,
 * and only in the Israel notice mode. Never after "לא, תודה".
 */
function metaAllowed(kind: 'pageview' | 'event') {
  if (!pixelId || !enabled()) return false;
  const current = readConsent();
  if (current === 'granted') return true;
  return current === null && kind === 'pageview' && metaMode === 'notice';
}
function metaReady() {
  return metaLoaded && typeof window.fbq === 'function';
}

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic', 'gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid'];

/** Page URL without hash or query, keeping only campaign attribution parameters. */
function safeLocation() {
  const url = new URL(location.href), out = new URL(url.origin + url.pathname);
  for (const key of CAMPAIGN_KEYS) {
    const value = url.searchParams.get(key);
    if (value && !value.includes('@')) out.searchParams.set(key, value.slice(0, 200));
  }
  return out.toString();
}

/** Same-site referrers keep only a non-excluded path; other sites only their origin. */
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
    for (const domain of ['', `; domain=${host}`, `; domain=.${parent}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  }
}

function disableMeasurement() {
  if (measurementId) window[`ga-disable-${measurementId}`] = true;
  window.gtag?.('consent', 'update', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  window.fbq?.('consent', 'revoke');
  deleteCookies(name => name === '_ga' || name.startsWith('_ga_') || name === '_fbp' || name === '_fbc' || name.startsWith('_gcl_'));
  lastPath = ''; lastMetaPath = '';
}

function loadGoogle(id: string) {
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the Arguments object, so this must not become a rest parameter.
  window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
  window[`ga-disable-${id}`] = false;
  window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted'});
  window.gtag('js', new Date());
  window.gtag('config', id, {send_page_view: false, ...(debugRequested() ? {debug_mode: true} : {})});
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/**
 * `automatic` = Meta's automatic configuration (button clicks and page metadata
 * detected by Meta's script). It is switched off when the pixel loads before a
 * choice (Israel notice mode), because the notice promises PageView only until
 * "אישור". It is decided once, before init, so it stays off until the next page load.
 */
function loadMeta(id: string, automatic: boolean) {
  if (!window.fbq) {
    type FbqStub = ((...args: unknown[]) => void) & {queue: unknown[]; loaded: boolean; version: string; push: unknown; callMethod?: (...args: unknown[]) => void; disablePushState?: boolean};
    // Same contract as Meta's base snippet: queue calls until fbevents.js installs callMethod.
    const fbq = function fbqStub(...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.call(fbq, ...args); else fbq.queue.push(args);
    } as FbqStub;
    fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; fbq.push = fbq;
    // sendPageView() sends PageView itself on every route change, gated by the
    // visitor's choice and the excluded paths; Meta's own history-based PageView
    // would duplicate it and could fire on /admin, /track or /design.
    fbq.disablePushState = true;
    window.fbq = fbq; window._fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  if (!automatic) window.fbq!('set', 'autoConfig', false, id);
  window.fbq!('consent', 'grant');
  window.fbq!('init', id);
}

async function loadTags() {
  tagsState = 'loading';
  await loadConfig();
  metaMode = metaModeFor(country, browserTimeZone());
  if (!enabled()) { tagsState = 'idle'; return; }
  if (measurementId) loadGoogle(measurementId);
  tagsState = 'ready';
}

/** Loads (or re-grants) the Meta pixel only when this visitor's mode and choice allow it. */
function ensureMeta() {
  if (!metaAllowed('pageview') && !metaAllowed('event')) return;
  if (!metaLoaded) { loadMeta(pixelId, metaAllowed('event')); metaLoaded = true; }
  else window.fbq?.('consent', 'grant');
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
  // Tracked separately: in the strict mode the pixel may load only after "אישור", on a page GA already counted.
  if (path !== lastMetaPath && metaReady() && metaAllowed('pageview')) {
    lastMetaPath = path;
    window.fbq?.('track', 'PageView');
  }
}

/** Called by the consent manager on load, after a choice and on every route change. */
export async function startAnalytics() {
  if (!enabled()) return;
  if (tagsState === 'idle') loading = loadTags();
  if (loading) await loading;
  if (!enabled() || tagsState !== 'ready') return;
  if (measurementId) {
    window[`ga-disable-${measurementId}`] = false;
    window.gtag?.('consent', 'update', {analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted'});
  }
  ensureMeta();
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
