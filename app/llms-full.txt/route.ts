import {currentPricing} from '@/lib/current-pricing';
import {llmsFullText} from '@/lib/llms-text';

// Served per request so the prices are the admin price list in force.
export const dynamic='force-dynamic';
export async function GET(){
 return new Response(llmsFullText(await currentPricing()),{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=300'}});
}
