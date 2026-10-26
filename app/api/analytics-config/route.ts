import {env} from '#partyprint-runtime';

export const dynamic = 'force-dynamic';

const clean = (value: string | undefined) => String(value || '').trim().replace(/^["']|["']$/g, '');

// Public tag IDs from the hosting environment: GA_MEASUREMENT_ID and META_PIXEL_ID.
// Public pages request them unless the visitor opted out of measurement.
//
// `country` is filled only when PARTYPRINT_TRUSTED_COUNTRY_HEADER names a header
// that the hosting edge is confirmed to overwrite with the visitor's ISO country
// code (same rule as PARTYPRINT_TRUSTED_IP_HEADER). Otherwise it is empty and the
// browser falls back to its time zone; anything not clearly Israel is treated
// as strict (no Meta pixel before "אישור").
export async function GET(request: Request) {
  const ga = clean(env.GA_MEASUREMENT_ID).toUpperCase(), pixel = clean(env.META_PIXEL_ID);
  const measurementId = /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : '';
  const metaPixelId = /^\d{8,20}$/.test(pixel) ? pixel : '';
  const header = clean(env.PARTYPRINT_TRUSTED_COUNTRY_HEADER).toLowerCase();
  const raw = header && /^[a-z0-9-]{1,64}$/.test(header) ? clean(request.headers.get(header) || '').toUpperCase() : '';
  const country = /^[A-Z]{2}$/.test(raw) && raw !== 'XX' ? raw : '';
  // The answer can differ per visitor, so it must not sit in a shared cache.
  return Response.json({measurementId, metaPixelId, country}, {headers: {'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff'}});
}
