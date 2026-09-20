export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

export const PRIVATE_HEADERS = {
  ...SECURITY_HEADERS,
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

function configuredDays(name: string, fallback: number, maximum: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 1 && value <= maximum ? value : fallback;
}

export function customerLinkDays() {
  return configuredDays('PARTYPRINT_CUSTOMER_LINK_DAYS', 30, 90);
}

export function bundleLinkDays() {
  return configuredDays('PARTYPRINT_BUNDLE_LINK_DAYS', 7, 30);
}

export function approvalLinkDays() {
  return configuredDays('PARTYPRINT_APPROVAL_LINK_DAYS', 30, 30);
}
