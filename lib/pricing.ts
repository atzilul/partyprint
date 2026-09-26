import {packs,calculatePrice,DEFAULT_SHIRT_PRICE} from './catalog';

export type PriceTier={quantity:number;price:number};
export type Pricing={shirtPrice:number;tiers:PriceTier[];basePrices:number[];extraShirtPrice:number;customPrices:Record<number,number>;version:number};

export const DEFAULT_TIERS:PriceTier[]=[
 {quantity:4,price:110},
 {quantity:6,price:105},
 {quantity:8,price:100},
 {quantity:10,price:95},
 {quantity:15,price:93},
 {quantity:20,price:90},
];

const cents=(value:number)=>Math.round(value*100);
const money=(value:number)=>cents(value)/100;

export function unitPriceFor(config:Pick<Pricing,'tiers'|'shirtPrice'>,quantity:number){
 const tiers=Array.isArray(config.tiers)?config.tiers.filter(t=>Number.isFinite(t.quantity)&&Number.isFinite(t.price)&&t.price>0).sort((a,b)=>a.quantity-b.quantity):[];
 const tier=[...tiers].reverse().find(t=>quantity>=t.quantity)??tiers[0];
 return money(tier?.price??config.shirtPrice??DEFAULT_SHIRT_PRICE);
}

export function pricingForTiers(tiers:PriceTier[],version=0):Pricing {
 const sorted=tiers.map(t=>({quantity:Number(t.quantity),price:money(Number(t.price))})).sort((a,b)=>a.quantity-b.quantity);
 const fallback=sorted[0]?.price||DEFAULT_SHIRT_PRICE;
 const config={tiers:sorted,shirtPrice:fallback};
 const total=(n:number)=>money(unitPriceFor(config,n)*n);
 return {
  shirtPrice:unitPriceFor(config,4),
  tiers:sorted,
  basePrices:packs.slice(0,4).map(p=>total(p.n)),
  extraShirtPrice:unitPriceFor(config,4),
  customPrices:Object.fromEntries([5,10,15,20].map(n=>[n,total(n)])),
  version,
 };
}

export function pricingForShirt(shirtPrice:number,version=0):Pricing {
 return pricingForTiers([{quantity:4,price:shirtPrice}],version);
}

export const DEFAULT_PRICING:Pricing=pricingForTiers(DEFAULT_TIERS);

export function validPricing(v:unknown):v is Pricing {
 if(!v||typeof v!=='object')return false;
 const {tiers,version}=v as Pricing;
 if(!Array.isArray(tiers)||tiers.length<1||tiers.length>12||!Number.isInteger(version)||version<0)return false;
 let previous=0;
 return tiers.every(t=>Number.isInteger(t.quantity)&&t.quantity>=1&&t.quantity<=100&&t.quantity>previous&&Number.isFinite(t.price)&&t.price>=0.01&&t.price<=1000&&Math.abs(t.price*100-Math.round(t.price*100))<1e-8&&(previous=t.quantity)>0);
}

export function normalizePricing(v:Partial<Pricing>,version=0):Pricing {
 if(Array.isArray(v.tiers)&&v.tiers.length){
  const tiers=v.tiers.filter(t=>t&&Number.isFinite(t.quantity)&&Number.isFinite(t.price)).map(t=>({quantity:Number(t.quantity),price:Number(t.price)}));
  if(validPricing({...v,tiers,version}))return pricingForTiers(tiers,version);
 }
 // The previous release stored one global shirtPrice. Migrate that shape to the
 // new public ladder so every package immediately uses the same quantity rules.
 return pricingForTiers(DEFAULT_TIERS,version);
}

export function priceFor(config:Pricing,pack:number,quantity:number){
 calculatePrice(pack,quantity);
 return money(unitPriceFor(config,quantity)*quantity);
}

export type Coupon={code:string;title:string;promoText?:string;kind:'percent'|'fixed';value:number;minQuantity:number;minSubtotal:number;maxUses:number;starts:string;ends:string;enabled:boolean;package:number;used:number;version:number};
export function cleanCoupon(v:Coupon):Coupon{const c={code:String(v.code||'').trim().toUpperCase(),title:String(v.title||'').trim(),promoText:String(v.promoText||'').replace(/\s+/g,' ').trim(),kind:v.kind,value:Number(v.value),minQuantity:Number(v.minQuantity),minSubtotal:Number(v.minSubtotal),maxUses:Number(v.maxUses),starts:String(v.starts||''),ends:String(v.ends||''),enabled:v.enabled===true,package:Number(v.package),used:0,version:Number(v.version)||0};if(!/^[A-Z0-9_-]{3,30}$/.test(c.code)||c.title.length>100||c.promoText.length>180||!['percent','fixed'].includes(c.kind)||!Number.isInteger(c.value)||c.value<1||c.value>(c.kind==='percent'?100:100000)||![c.minQuantity,c.minSubtotal,c.maxUses].every(n=>Number.isInteger(n)&&n>=0&&n<=1000000)||!Number.isInteger(c.package)||c.package< -1||c.package>4)throw Error('בדקו קוד, טקסט תצוגה, סוג הנחה, סכום ותנאי מבצע.');for(const d of [c.starts,c.ends])if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d))))throw Error('תאריכי המבצע אינם תקינים.');if(c.starts&&c.ends&&c.starts>c.ends)throw Error('תאריך הסיום חייב להיות לאחר תאריך ההתחלה.');return c}
export function couponDiscount(c:Coupon,subtotal:number,quantity:number,pack:number,day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jerusalem'})){if(!c.enabled||c.starts&&day<c.starts||c.ends&&day>c.ends||c.maxUses>0&&c.used>=c.maxUses||quantity<c.minQuantity||subtotal<c.minSubtotal||c.package!==-1&&c.package!==pack)throw Error('הקוד אינו פעיל או אינו מתאים להזמנה הזו.');return Math.min(subtotal,Math.round((c.kind==='percent'?subtotal*c.value/100:c.value)*100)/100)}
