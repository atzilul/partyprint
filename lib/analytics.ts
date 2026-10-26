// Privacy-conscious analytics for PARTYPRINT (browser only).
//
// Nothing is loaded and nothing leaves the browser until the visitor opts in.
// Every GA4 event name and every parameter value is checked against a fixed
// allowlist; anything else is dropped. Names, emails, phones, free text, order
// IDs, coupon codes, design text and file names are never passed in here.
// See docs/analytics.md for the measurement plan.

export type ConsentChoice = 'granted' | 'denied';
type Params = Record<string, string | number>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [disable: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const CONSENT_KEY = 'partyprint-consent-v1';
export const CONSENT_EVENT = 'partyprint-consent';
const CONSENT_MAX_AGE = 365 * 86400000;
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

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
  step_name: ['package', 'shirts', 'details'],
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
  form_step: ['step_number', 'step_name'],
  coupon_apply: ['coupon_status'],
  click_whatsapp: ['cta_location'],
  form_validation_error: ['error_type'],
  form_submit_error: ['error_type'],
  faq_open: ['faq_index'],
  generate_lead: ['request_mode', 'package_type', 'quantity_band', 'coupon_status'],
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

// ---- consent ----

let choice: ConsentChoice | null = null, choiceLoaded = false;

export function readConsent(): ConsentChoice | null {
  if (choiceLoaded) return choice;
  choiceLoaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as {analytics?: unknown; at?: unknown} | null;
    if (raw && typeof raw.at === 'number' && Date.now() - raw.at < CONSENT_MAX_AGE && (raw.analytics === 'granted' || raw.analytics === 'denied')) choice = raw.analytics;
  } catch { /* storage unavailable: ask again, measure nothing */ }
  return choice;
}

export function saveConsent(next: ConsentChoice) {
  choice = next; choiceLoaded = true;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({analytics: next, at: Date.now()})); } catch { /* keep the in-memory choice */ }
  if (next === 'denied') { pending = []; disableGoogleAnalytics(); }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// ---- queue: actions before the visitor decides stay in memory only ----

type Pending = {ga: string; params: Params} | {site: 'view' | 'form_start'};
let pending: Pending[] = [];
const MAX_PENDING = 30;
const remember = (item: Pending) => { if (pending.length < MAX_PENDING) pending.push(item); };

function excludedNow() {
  return typeof location === 'undefined' || isExcludedPath(location.pathname);
}

/** Records an allowlisted GA4 event. No-op until analytics consent is granted. */
export function track(name: string, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === 'undefined' || excludedNow()) return;
  const safe = clean(name, params);
  if (!safe) return;
  const current = readConsent();
  if (current === 'denied') return;
  if (current === 'granted' && gaState === 'ready') { window.gtag?.('event', name, safe); return; }
  if (current === 'granted' && gaState === 'off') return;
  remember({ga: name, params: safe});
}

/** Aggregate first-party counter (/api/events). Same consent rule as GA. */
export function siteEvent(kind: 'view' | 'form_start') {
  if (typeof window === 'undefined' || excludedNow()) return;
  const current = readConsent();
  if (current === 'denied') return;
  if (current === 'granted') { postSiteEvent(kind); return; }
  remember({site: kind});
}

function postSiteEvent(kind: 'view' | 'form_start') {
  fetch('/api/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({kind})}).catch(() => {});
}

function flush() {
  const items = pending; pending = [];
  for (const item of items) {
    if ('site' in item) postSiteEvent(item.site);
    else if (gaState === 'ready') window.gtag?.('event', item.ga, item.params);
    else if (gaState !== 'off') remember(item);
  }
}

// ---- Google tag ----

let gaState: 'idle' | 'loading' | 'ready' | 'off' = 'idle';
let loading: Promise<void> | null = null;
let measurementId = '';
let lastLocation = '';
let lastPath = '';

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic', 'gclid', 'gbraid', 'wbraid', 'dclid'];

/** Page URL without hash or query, keeping only campaign attribution parameters. */
function safeLocation() {
  const url = new URL(location.href), out = new URL(url.origin + url.pathname);
  for (const key of CAMPAIGN_KEYS) {
    const value = url.searchParams.get(key);
    if (value && !value.includes('@')) out.searchParams.set(key, value.slice(0, 100));
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

function disableGoogleAnalytics() {
  if (measurementId) window[`ga-disable-${measurementId}`] = true;
  window.gtag?.('consent', 'update', {analytics_storage: 'denied'});
  // Remove first-party GA cookies on this host and the parent domain.
  const host = location.hostname, parent = host.replace(/^www\./, '');
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0].trim();
    if (name !== '_ga' && !name.startsWith('_ga_')) continue;
    for (const domain of ['', `; domain=${host}`, `; domain=.${parent}`]) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  }
  lastPath = '';
}

async function loadGoogleTag() {
  gaState = 'loading';
  try {
    const response = await fetch('/api/analytics-config', {headers: {Accept: 'application/json'}});
    const config = response.ok ? await response.json() as {measurementId?: string} : {};
    measurementId = MEASUREMENT_ID.test(config.measurementId || '') ? config.measurementId as string : '';
  } catch { measurementId = ''; }
  if (readConsent() !== 'granted') { gaState = 'idle'; return; }
  if (!measurementId) { gaState = 'off'; flush(); return; }

  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the Arguments object, so this must not become a rest parameter.
  window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
  window[`ga-disable-${measurementId}`] = false;
  window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debugRequested() ? {debug_mode: true} : {}),
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  gaState = 'ready';
}

function sendPageView() {
  if (gaState !== 'ready' || excludedNow()) return;
  const path = location.pathname + location.search;
  if (path === lastPath) return;
  lastPath = path;
  const page = {page_location: safeLocation(), page_referrer: lastLocation || safeReferrer(), page_title: document.title.slice(0, 120)};
  lastLocation = page.page_location;
  window.gtag?.('set', page);
  window.gtag?.('event', 'page_view', page);
}

/** Called by the consent manager after opt-in and on every route change. */
export async function startAnalytics() {
  if (readConsent() !== 'granted' || excludedNow()) return;
  if (gaState === 'idle') loading = loadGoogleTag();
  if (loading) await loading;
  if (readConsent() !== 'granted') return;
  if (gaState === 'ready') {
    window[`ga-disable-${measurementId}`] = false;
    window.gtag?.('consent', 'update', {analytics_storage: 'granted'});
    sendPageView();
  }
  flush();
}

// ---- delegated listeners (no data leaves the page unless consent allows it) ----

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
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!link) return;
    let host = '';
    try { host = new URL((link as HTMLAnchorElement).href).hostname; } catch { return; }
    if (host === 'wa.me' || host === 'api.whatsapp.com') track('click_whatsapp', {cta_location: ctaLocation(link)});
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
