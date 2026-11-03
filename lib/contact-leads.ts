import {bindings,getOrder} from './order-store';
import {tokenHash} from './order-access';
import {cleanSingleLine} from './text';
import {validPhone,validCalendarDate} from './contact-validation';
import {packs,isPackageQuantity,validateShirts} from './catalog';
import type {ShirtSelection} from './catalog';
import {getCoupon,getPricing} from './studio-settings';
import {couponDiscount,priceFor} from './pricing';
import {sendContactMail} from './order-mail';
import {sanitizeAttribution,type Attribution} from './attribution';
export type ContactDetails={name:string;phone:string;email:string;package:number;quantity:number;mode:string;eventDate:string;source:string;attribution:Attribution;pricePreview:number;shirtDetailsStatus:'pending'|'complete';shirts:ShirtSelection[]};
export type ContactRow={id:string;token_hash:string;token_expires_at:number;created_at:string;updated_at:string;version:number;mail_status:string;data:string;utm_source?:string|null;utm_medium?:string|null;utm_campaign?:string|null;utm_content?:string|null;utm_term?:string|null;fbclid?:string|null;fbc?:string|null;fbp?:string|null;landing_path?:string|null;first_seen_at?:string|null;referrer?:string|null};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const TOKEN=/^[a-f0-9]{64}$/;
export function validContactKey(id:unknown,token:unknown):id is string{return typeof id==='string'&&UUID.test(id)&&typeof token==='string'&&TOKEN.test(token);}
export async function contactGrant(id:string,token:string){if(!validContactKey(id,token))return null;const row=await bindings().DB.prepare('SELECT * FROM contact_leads WHERE id=?').bind(id).first<ContactRow>();return row&&row.token_expires_at>Date.now()&&row.token_hash===await tokenHash(token)?row:null;}
export function contactView(row:ContactRow){const details=JSON.parse(row.data) as ContactDetails;if(!details.attribution)details.attribution=sanitizeAttribution({utm_source:row.utm_source||details.source||'direct',utm_medium:row.utm_medium||'',utm_campaign:row.utm_campaign||'',utm_content:row.utm_content||'',utm_term:row.utm_term||'',fbclid:row.fbclid||'',fbc:row.fbc||'',fbp:row.fbp||'',landing_path:row.landing_path||'/',first_seen_at:row.first_seen_at||'',referrer:row.referrer||''});return {id:row.id,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,mailStatus:row.mail_status,details};}
export async function contactDetails(value:Record<string,unknown>):Promise<ContactDetails>{
 const name=typeof value.name==='string'?cleanSingleLine(value.name,100):'',phone=typeof value.phone==='string'?value.phone.trim():'',email=typeof value.email==='string'?value.email.trim():'',pack=Number(value.package),quantity=Number(value.quantity),mode=String(value.mode||''),eventDate=String(value.eventDate||'');
 if(!name||String(value.name).length>100||!validPhone(phone)||email.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!isPackageQuantity(pack,quantity)||!['lead','order','custom'].includes(mode))throw Error('invalid_contact');
 if(eventDate&&(!validCalendarDate(eventDate)||eventDate<new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jerusalem'})))throw Error('invalid_contact');
 const shirts=value.shirts===undefined?[]:value.shirts;if(!Array.isArray(shirts)||shirts.length&&!validateShirts(shirts,quantity))throw Error('invalid_contact');
 const attribution=sanitizeAttribution(value.attribution),fallbackSource=String(value.source||'direct').replace(/[^a-zA-Z0-9_ .-]/g,'').slice(0,100)||'direct';
 if(!attribution.utm_source){attribution.utm_source=fallbackSource;attribution.utm_medium=fallbackSource==='direct'?'direct':'';}
 const source=attribution.utm_source;
 const pricing=await getPricing(),subtotal=priceFor(pricing,pack,quantity);let pricePreview=subtotal;
 const couponCode=typeof value.couponCode==='string'?value.couponCode.trim().slice(0,30).toUpperCase():'';
 if(couponCode){const coupon=await getCoupon(couponCode);if(coupon){try{pricePreview=Math.round((subtotal-couponDiscount(coupon,subtotal,quantity,pack))*100)/100;}catch{}}}
 return {name,phone,email,package:pack,quantity,mode,eventDate,source,attribution,pricePreview,shirtDetailsStatus:shirts.length?'complete':'pending',shirts:shirts as ShirtSelection[]};
}
async function deliver(row:ContactRow,attempt:string){const result=await sendContactMail(bindings(),{...contactView(row),packageName:packs[(JSON.parse(row.data) as ContactDetails).package].name},attempt);await bindings().DB.prepare('UPDATE contact_leads SET mail_status=? WHERE id=? AND version=?').bind(result.accepted?'accepted':result.code||'failed',row.id,row.version).run();return result;}
export async function saveContact(id:string,token:string,details:ContactDetails,version:number){
 const {DB}=bindings(),now=new Date().toISOString(),hash=await tokenHash(token),json=JSON.stringify(details);
 const attribution=details.attribution;
 const attributionValues=[attribution.utm_source,attribution.utm_medium,attribution.utm_campaign,attribution.utm_content,attribution.utm_term,attribution.fbclid,attribution.fbc,attribution.fbp,attribution.landing_path,attribution.first_seen_at,attribution.referrer];
 if(!await contactGrant(id,token)&&await getOrder(id))throw Error('not_found');
 const inserted=await DB.prepare('INSERT OR IGNORE INTO contact_leads (id,token_hash,token_expires_at,created_at,updated_at,version,mail_status,data,utm_source,utm_medium,utm_campaign,utm_content,utm_term,fbclid,fbc,fbp,landing_path,first_seen_at,referrer) VALUES (?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id').bind(id,hash,Date.now()+86400000,now,now,'pending',json,...attributionValues).first<{id:string}>();
 let row=await contactGrant(id,token);if(!row)throw Error('not_found');
 if(inserted){await deliver(row,'initial').catch(()=>console.error('Contact notification unavailable'));row=(await contactGrant(id,token))!;return {created:true,...contactView(row)};}
 if(await getOrder(id))return {created:false,...contactView(row),completed:true};
 if(row.data===json)return {created:false,...contactView(row)};
 if(!Number.isInteger(version)||version!==row.version)throw Error('conflict');
 const changed=await DB.prepare('UPDATE contact_leads SET data=?,updated_at=?,version=version+1,mail_status=?,utm_source=?,utm_medium=?,utm_campaign=?,utm_content=?,utm_term=?,fbclid=?,fbc=?,fbp=?,landing_path=?,first_seen_at=?,referrer=? WHERE id=? AND version=? RETURNING id').bind(json,now,'pending',...attributionValues,id,version).first<{id:string}>();
 if(!changed)throw Error('conflict');
 row=(await contactGrant(id,token))!;
 await deliver(row,'revision-'+row.version).catch(()=>console.error('Contact update notification unavailable'));
 return {created:false,...contactView((await contactGrant(id,token))!)};
}
export async function retryContactMail(id:string){const row=await bindings().DB.prepare('SELECT * FROM contact_leads WHERE id=?').bind(id).first<ContactRow>();if(!row)throw Error('not_found');return deliver(row,'manual-'+crypto.randomUUID());}
