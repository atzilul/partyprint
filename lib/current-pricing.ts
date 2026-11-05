import {getPricing} from './studio-settings';
import {DEFAULT_PRICING} from './pricing';
import type {Pricing} from './pricing';

/**
 * The price list the studio saved in the admin panel. Every public page that prints a
 * price reads it through here, so a change in the panel reaches all of them. The code
 * defaults are only the fallback for a database that cannot be reached.
 */
export async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
