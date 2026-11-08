import type {ShirtSelection} from './catalog';
// Kept in this tab only. No names, phone numbers, emails, free text or filenames.
// The private tracking capability never appears in analytics or /thanks URLs.
export type RequestReceipt={shirtDetailsStatus?:'pending'|'complete';suggestedShirts?:ShirtSelection[];id:string;at:number;package:number;quantity:number;price:number;imagesCount:number;trackingUrl:string;emailRequested:boolean;customerEmailSent:boolean;requestMode:'order'|'custom'|'lead';couponStatus:'accepted'|'none'};
const KEY='partyprint-request-receipt-v1';let memory:RequestReceipt|null=null;
function valid(v:unknown):v is RequestReceipt{
 if(!v||typeof v!=='object')return false;const x=v as RequestReceipt;
 return /^[a-f0-9-]{36}$/.test(x.id)&&Number.isFinite(x.at)&&Date.now()-x.at<86400000&&x.at<=Date.now()+60000&&Number.isInteger(x.package)&&x.package>=0&&x.package<6&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=100&&Number.isFinite(x.price)&&x.price>=0&&typeof x.trackingUrl==='string'&&['order','custom','lead'].includes(x.requestMode);
}
export function safeTrackingUrl(value:string,id:string){
 try{const u=new URL(value,location.origin);if(u.origin!==location.origin||!new RegExp('^(?:/[a-z]{2})?/track/'+id+'$').test(u.pathname)||!/^#[a-f0-9]{64}$/.test(u.hash)||u.search)return '';return u.pathname+u.hash}catch{return ''}
}
export function saveReceipt(value:RequestReceipt){memory=value;try{sessionStorage.setItem(KEY,JSON.stringify(value))}catch{}}
export function readReceipt(){if(memory&&valid(memory))return memory;try{const v=JSON.parse(sessionStorage.getItem(KEY)||'null');if(valid(v)){memory=v;return v}}catch{}return null;}
export function customerApi(receipt:RequestReceipt){const url=safeTrackingUrl(receipt.trackingUrl,receipt.id);return url?'/api/track/'+receipt.id+'?token='+new URL(url,location.origin).hash.slice(1):'';}
