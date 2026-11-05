import type {Pricing} from './pricing';

/** Studio WhatsApp number, as used across the site. */
export const WHATSAPP_NUMBER='972552896236';

/**
 * WhatsApp link with a ready message that names the page the visitor came from,
 * so an enquiry that skips the form still tells the studio which page produced it.
 */
export function contentWhatsappUrl(title:string):string{
 const clean=title.replace(/\s+/g,' ').trim().slice(0,120);
 return 'https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent('היי PARTYPRINT, הגעתי מהעמוד "'+clean+'" ואשמח להצעה לחולצות בעיצוב אישי.');
}

export type PriceRow={label:string;price:number};
export type PriceLimits={maxQuantity:number;singleShirtPrice:number};
/**
 * Price per shirt by quantity tier, then the single-shirt price, as plain rows for a table.
 * The catalogue limits are passed in so this module stays free of runtime imports.
 */
export function priceRows(pricing:Pick<Pricing,'tiers'|'singleShirtPrice'>,limits:PriceLimits):PriceRow[]{
 const tiers=(Array.isArray(pricing.tiers)?pricing.tiers:[]).filter(tier=>Number.isFinite(tier.quantity)&&Number.isFinite(tier.price)&&tier.price>0).sort((a,b)=>a.quantity-b.quantity);
 const rows=tiers.map((tier,index)=>{
  const upper=index<tiers.length-1?tiers[index+1].quantity-1:limits.maxQuantity;
  return {label:upper>tier.quantity?tier.quantity+' עד '+upper+' חולצות':tier.quantity+' חולצות',price:tier.price};
 });
 return [...rows,{label:'חולצה אחת, מתנה אישית',price:pricing.singleShirtPrice??limits.singleShirtPrice}];
}
