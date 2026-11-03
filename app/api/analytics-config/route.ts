import {env} from '#partyprint-runtime';

export const dynamic = 'force-dynamic';

const clean = (value: string | undefined) => String(value || '').trim().replace(/^["']|["']$/g, '');

// Public tag IDs and consent mode. Missing or invalid CONSENT_MODE is strict.
// "notice" enables only the non-identifying pre-choice Meta behavior events.
export async function GET() {
  const ga = clean(env.GA_MEASUREMENT_ID).toUpperCase(), pixel = clean(env.META_PIXEL_ID);
  const measurementId = /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : '';
  const metaPixelId = /^\d{8,20}$/.test(pixel) ? pixel : '';
  const requestedMode = clean(env.CONSENT_MODE).toLowerCase();
  const consentMode = requestedMode === 'notice' ? 'notice' : 'strict';
  // The answer can differ per deployment, so it must not sit in a shared cache.
  return Response.json({measurementId, metaPixelId, consentMode}, {headers: {'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff'}});
}
