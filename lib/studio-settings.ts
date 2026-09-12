import {bindings} from './order-store';
import {DEFAULT_PRICING,Pricing,Coupon,normalizePricing} from './pricing';
export async function getPricing(){const r=await bindings().DB.prepare("SELECT data,version FROM studio_settings WHERE key='pricing'").first<{data:string;version:number}>();return r?normalizePricing(JSON.parse(r.data),r.version):DEFAULT_PRICING}
export async function getCoupon(code:string){const r=await bindings().DB.prepare('SELECT data,used,version FROM coupons WHERE code=?').bind(code.trim().toUpperCase()).first<{data:string;used:number;version:number}>();return r?{...JSON.parse(r.data),used:r.used,version:r.version} as Coupon:null}
