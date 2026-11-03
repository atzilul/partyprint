export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  fbc: string;
  fbp: string;
  landing_path: string;
  first_seen_at: string;
  referrer: string;
};

export const FIRST_TOUCH_KEY = 'partyprint-first-touch-v1';

const emptyAttribution = (): Attribution => ({
  utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '',
  fbclid: '', fbc: '', fbp: '', landing_path: '/', first_seen_at: '', referrer: '',
});

function plain(value: unknown, max: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

function safePath(value: unknown): string {
  const path = plain(value, 500);
  if (!path.startsWith('/') || path.startsWith('//')) return '/';
  try { return new URL(path, 'https://partyprint.co.il').pathname.slice(0, 200) || '/'; }
  catch { return '/'; }
}

function safeReferrer(value: unknown): string {
  const raw = plain(value, 1000);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return (url.origin + url.pathname).slice(0, 300);
  } catch { return ''; }
}

function cookieValue(cookie: string, name: string): string {
  const found = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
  if (!found) return '';
  try { return decodeURIComponent(found.slice(name.length + 1)); }
  catch { return found.slice(name.length + 1); }
}

export function sanitizeAttribution(value: unknown): Attribution {
  const input = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const out = emptyAttribution();
  out.utm_source = plain(input.utm_source, 200);
  out.utm_medium = plain(input.utm_medium, 200);
  out.utm_campaign = plain(input.utm_campaign, 200);
  out.utm_content = plain(input.utm_content, 200);
  out.utm_term = plain(input.utm_term, 200);
  out.fbclid = plain(input.fbclid, 300).replace(/[^A-Za-z0-9._-]/g, '');
  out.fbc = plain(input.fbc, 300).replace(/[^A-Za-z0-9._-]/g, '');
  out.fbp = plain(input.fbp, 300).replace(/[^A-Za-z0-9._-]/g, '');
  out.landing_path = safePath(input.landing_path);
  const at = plain(input.first_seen_at, 40);
  const parsed = Date.parse(at);
  out.first_seen_at = Number.isFinite(parsed) ? new Date(parsed).toISOString() : '';
  out.referrer = safeReferrer(input.referrer);
  return out;
}

export function applyMarketingAttributionConsent(value: unknown, allowed: boolean): Attribution {
  const out = sanitizeAttribution(value);
  if (!allowed) { out.fbc = ''; out.fbp = ''; }
  return out;
}

export function createFirstTouch(input: {
  href: string;
  referrer?: string;
  cookie?: string;
  marketingConsent?: boolean;
  now?: Date;
}): Attribution {
  const out = emptyAttribution();
  const now = input.now || new Date();
  let url: URL;
  try { url = new URL(input.href); }
  catch { url = new URL('https://partyprint.co.il/'); }
  const params = url.searchParams;
  out.utm_source = plain(params.get('utm_source'), 200);
  out.utm_medium = plain(params.get('utm_medium'), 200);
  out.utm_campaign = plain(params.get('utm_campaign'), 200);
  out.utm_content = plain(params.get('utm_content'), 200);
  out.utm_term = plain(params.get('utm_term'), 200);
  out.fbclid = plain(params.get('fbclid'), 300).replace(/[^A-Za-z0-9._-]/g, '');
  out.landing_path = safePath(params.get('pp_landing_path') || url.pathname);
  out.first_seen_at = now.toISOString();
  out.referrer = safeReferrer(input.referrer);

  let refHost = '';
  try { refHost = input.referrer ? new URL(input.referrer).hostname.toLowerCase().replace(/^www\./, '') : ''; }
  catch { refHost = ''; }
  const searchEngines: Record<string, string> = {
    'google.com': 'google', 'google.co.il': 'google', 'bing.com': 'bing',
    'search.yahoo.com': 'yahoo', 'duckduckgo.com': 'duckduckgo', 'search.brave.com': 'brave',
  };
  const searchSource = Object.entries(searchEngines).find(([host]) => refHost === host || refHost.endsWith('.' + host))?.[1];
  if (!out.utm_source) {
    if (out.fbclid) { out.utm_source = 'facebook'; out.utm_medium = out.utm_medium || 'paid_social'; }
    else if (searchSource) { out.utm_source = searchSource; out.utm_medium = out.utm_medium || 'organic'; }
    else if (refHost && refHost !== url.hostname.toLowerCase()) { out.utm_source = refHost; out.utm_medium = out.utm_medium || 'referral'; }
    else { out.utm_source = 'direct'; out.utm_medium = out.utm_medium || 'direct'; }
  } else if (!out.utm_medium && out.fbclid) {
    out.utm_medium = 'paid_social';
  }

  if (input.marketingConsent) {
    out.fbc = cookieValue(input.cookie || '', '_fbc');
    out.fbp = cookieValue(input.cookie || '', '_fbp');
  }
  return sanitizeAttribution(out);
}

export function readFirstTouchAttribution(marketingConsent = false): Attribution {
  if (typeof window === 'undefined') return sanitizeAttribution(null);
  const removeLandingHint = () => {
    try {
      const current = new URL(location.href);
      if (!current.searchParams.has('pp_landing_path')) return;
      current.searchParams.delete('pp_landing_path');
      history.replaceState(history.state, '', current.pathname + current.search + current.hash);
    } catch { /* keep the current URL if the browser prevents history updates */ }
  };
  try {
    const existing = localStorage.getItem(FIRST_TOUCH_KEY);
    if (existing) {
      const prior = sanitizeAttribution(JSON.parse(existing));
      const saved = applyMarketingAttributionConsent(prior, marketingConsent);
      let changed = saved.fbc !== prior.fbc || saved.fbp !== prior.fbp;
      if (marketingConsent && (!saved.fbc || !saved.fbp)) {
        const refreshed = createFirstTouch({
          href: location.href,
          referrer: document.referrer,
          cookie: document.cookie,
          marketingConsent: true,
          now: new Date(saved.first_seen_at || Date.now()),
        });
        saved.fbc ||= refreshed.fbc;
        saved.fbp ||= refreshed.fbp;
        changed = true;
      }
      if (changed) localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(saved));
      removeLandingHint();
      return saved;
    }
    const value = createFirstTouch({href: location.href, referrer: document.referrer, cookie: document.cookie, marketingConsent});
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(value));
    removeLandingHint();
    return value;
  } catch {
    return createFirstTouch({href: location.href, referrer: document.referrer, cookie: document.cookie, marketingConsent});
  }
}

export function attributionSummary(value: unknown): string {
  const a = sanitizeAttribution(value);
  const primary = [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content].filter(Boolean).join(' / ') || 'direct';
  const details = [
    a.utm_term && 'term: ' + a.utm_term,
    a.fbclid && 'fbclid: ' + a.fbclid,
    a.fbc && 'fbc: ' + a.fbc,
    a.fbp && 'fbp: ' + a.fbp,
    a.landing_path && 'נחיתה: ' + a.landing_path,
    a.first_seen_at && 'first_seen: ' + a.first_seen_at,
    a.referrer && 'referrer: ' + a.referrer,
  ].filter(Boolean);
  return 'מקור: ' + primary + (details.length ? ' · ' + details.join(' · ') : '');
}
