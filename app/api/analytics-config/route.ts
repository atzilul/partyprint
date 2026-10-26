import {env} from '#partyprint-runtime';

export const dynamic = 'force-dynamic';

const clean = (value: string | undefined) => String(value || '').trim().replace(/^["']|["']$/g, '');

// Public tag IDs from the hosting environment: GA_MEASUREMENT_ID and META_PIXEL_ID.
// Public pages request them unless the visitor opted out of measurement.
export async function GET() {
  const ga = clean(env.GA_MEASUREMENT_ID).toUpperCase(), pixel = clean(env.META_PIXEL_ID);
  const measurementId = /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : '';
  const metaPixelId = /^\d{8,20}$/.test(pixel) ? pixel : '';
  return Response.json({measurementId, metaPixelId}, {headers: {'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff'}});
}
