import {env} from '#partyprint-runtime';

export const dynamic = 'force-dynamic';

// Public GA4 Measurement ID from the hosting environment (GA_MEASUREMENT_ID).
// The browser requests it only after the visitor opts into analytics.
export async function GET() {
  const raw = String(env.GA_MEASUREMENT_ID || '').trim().replace(/^["']|["']$/g, '').toUpperCase();
  const measurementId = /^G-[A-Z0-9]{4,20}$/.test(raw) ? raw : '';
  return Response.json({measurementId}, {headers: {'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff'}});
}
