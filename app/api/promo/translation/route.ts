import {promoTexts} from '@/lib/promo-translation';

/**
 * The admin panel's suggestion for a promo line typed in Hebrew: the site's own translation,
 * or an empty string when the dictionary has none. It reads the dictionary only.
 */
export async function GET(request:Request){
 const text=(new URL(request.url).searchParams.get('text')||'').slice(0,180);
 return Response.json(promoTexts(text),{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
