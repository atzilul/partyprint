import {packs,calculatePrice,DEFAULT_SHIRT_PRICE} from './catalog';
export type Pricing={shirtPrice:number;basePrices:number[];extraShirtPrice:number;customPrices:Record<number,number>;version:number};
export function pricingForShirt(shirtPrice:number,version=0):Pricing {
 const total=(n:number)=>Math.round(shirtPrice*100)*n/100;
 return {shirtPrice,basePrices:packs.slice(0,4).map(p=>total(p.n)),extraShirtPrice:shirtPrice,customPrices:Object.fromEntries([5,10,15,20].map(n=>[n,total(n)])),version};
}
export const DEFAULT_PRICING:Pricing=pricingForShirt(DEFAULT_SHIRT_PRICE);
export function validPricing(v:unknown):v is Pricing {
 if(!v||typeof v!=='object')return false;
 const {shirtPrice,version}=v as Pricing;
 return typeof shirtPrice==='number'&&Number.isFinite(shirtPrice)&&shirtPrice>=0.01&&shirtPrice<=1000&&Math.abs(shirtPrice*100-Math.round(shirtPrice*100))<1e-8&&Number.isInteger(version)&&version>=0;
}
export function normalizePricing(v:Partial<Pricing>,version=0):Pricing {
 // Legacy settings are converted using the family pack unit price. No old pack overrides survive.
 const raw=v.shirtPrice??(Array.isArray(v.basePrices)?v.basePrices[0]/packs[0].n:DEFAULT_SHIRT_PRICE);
 const shirtPrice=Math.round(raw*100)/100;
 return pricingForShirt(Number.isFinite(shirtPrice)&&shirtPrice>=0.01&&shirtPrice<=1000?shirtPrice:DEFAULT_SHIRT_PRICE,version);
}
export function priceFor(config:Pricing,pack:number,quantity:number){calculatePrice(pack,quantity);return Math.round(config.shirtPrice*100)*quantity/100}
export type Coupon={code:string;title:string;kind:'percent'|'fixed';value:number;minQuantity:number;minSubtotal:number;maxUses:number;starts:string;ends:string;enabled:boolean;package:number;used:number;version:number};
export function cleanCoupon(v:Coupon):Coupon{const c={code:String(v.code||'').trim().toUpperCase(),title:String(v.title||'').trim(),kind:v.kind,value:Number(v.value),minQuantity:Number(v.minQuantity),minSubtotal:Number(v.minSubtotal),maxUses:Number(v.maxUses),starts:String(v.starts||''),ends:String(v.ends||''),enabled:v.enabled===true,package:Number(v.package),used:0,version:Number(v.version)||0};if(!/^[A-Z0-9_-]{3,30}$/.test(c.code)||c.title.length>100||!['percent','fixed'].includes(c.kind)||!Number.isInteger(c.value)||c.value<1||c.value>(c.kind==='percent'?100:100000)||![c.minQuantity,c.minSubtotal,c.maxUses].every(n=>Number.isInteger(n)&&n>=0&&n<=1000000)||!Number.isInteger(c.package)||c.package< -1||c.package>4)throw Error('בדקו קוד, סוג הנחה, סכום ותנאי מבצע.');for(const d of [c.starts,c.ends])if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d))))throw Error('תאריכי המבצע אינם תקינים.');if(c.starts&&c.ends&&c.starts>c.ends)throw Error('תאריך הסיום חייב להיות לאחר תאריך ההתחלה.');return c}
export function couponDiscount(c:Coupon,subtotal:number,quantity:number,pack:number,day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jerusalem'})){if(!c.enabled||c.starts&&day<c.starts||c.ends&&day>c.ends||c.maxUses>0&&c.used>=c.maxUses||quantity<c.minQuantity||subtotal<c.minSubtotal||c.package!==-1&&c.package!==pack)throw Error('הקוד אינו פעיל או אינו מתאים להזמנה הזו.');return Math.min(subtotal,Math.round((c.kind==='percent'?subtotal*c.value/100:c.value)*100)/100)}
