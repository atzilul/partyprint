import {designFeeText,revisionFeeText} from './pricing';
import type {PricingFees} from './pricing';

/**
 * Static copy names the two fees as {designFee} and {revisionFee}. This fills them from
 * the price list in force. Strings, arrays and plain objects are copied; anything else
 * (icons, functions) is kept as it is.
 */
export function withFees<T>(value:T,pricing:PricingFees):T{
 const design=designFeeText(pricing),revision=revisionFeeText(pricing);
 const fill=(item:unknown):unknown=>{
  if(typeof item==='string')return item.includes('{')?item.split('{designFee}').join(design).split('{revisionFee}').join(revision):item;
  if(Array.isArray(item))return item.map(fill);
  if(item&&typeof item==='object'&&Object.getPrototypeOf(item)===Object.prototype&&!('$$typeof' in item))return Object.fromEntries(Object.entries(item).map(([key,entry])=>[key,fill(entry)]));
  return item;
 };
 return fill(value) as T;
}
