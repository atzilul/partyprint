import {bindings,getOrder} from './order-store';
import {tokenHash} from './order-access';
import {cleanSingleLine} from './text';
import {validPhone,validCalendarDate} from './contact-validation';
import {isPackageQuantity,validateShirts,designModeFor,packageLabel} from './catalog';
import type {ShirtSelection,DesignMode} from './catalog';
import {getCoupon,getPricing} from './studio-settings';
import {couponDiscount,priceFor} from './pricing';
import {sendContactMail} from './order-mail';
import {parseAttribution} from './attribution';
import type {Attribution} from './attribution';
export type ContactDetails={name:string;phone:string;email:string;package:number;quantity:number;mode:string;eventDate:string;source:string;attribution?:Attribution;pricePreview:number;designMode?:DesignMode;shirtDetailsStatus:'pending'|'complete';shirts:ShirtSelection[]};
export type ContactRow={id:string;token_hash:string;token_expires_at:number;created_at:string;updated_at:string;version:number;mail_status:string;data:string};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const TOKEN=/^[a-f0-9]{64}$/;
export function validContactKey(id:unknown,token:unknown):id is string{return typeof id==='string'&&UUID.test(id)&&typeof token==='string'&&TOKEN.test(token);}
export async function contactGrant(id:string,token:string){if(!validContactKey(id,token))return null;const row=await bindings().DB.prepare('SELECT * FROM contact_leads WHERE id=?').bind(id).first<ContactRow>();return row&&row.token_expires_at>Date.now()&&row.token_hash===await tokenHash(token)?row:null;}
export function contactView(row:ContactRow){return {id:row.id,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,mailStatus:row.mail_status,details:JSON.parse(row.data) as ContactDetails};}
export async function contactDetails(value:Record<string,unknown>):Promise<ContactDetails>{
 const name=typeof value.name==='string'?cleanSingleLine(value.name,100):'',phone=typeof value.phone==='string'?value.phone.trim():'',email=typeof value.email==='string'?value.email.trim():'',pack=Number(value.package),quantity=Number(value.quantity),mode=String(value.mode||''),eventDate=String(value.eventDate||'');
 if(!name||String(value.name).length>100||!validPhone(phone)||email.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!isPackageQuantity(pack,quantity)||!['lead','order','custom'].includes(mode))throw Error('invalid_contact');
 if(eventDate&&(!validCalendarDate(eventDate)||eventDate<new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jerusalem'})))throw Error('invalid_contact');
 const shirts=value.shirts===undefined?[]:value.shirts;if(!Array.isArray(shirts)||shirts.length&&!validateShirts(shirts,quantity))throw Error('invalid_contact');
 const source=String(value.source||'direct').replace(/[^a-zA-Z0-9_ .-]/g,'').slice(0,100)||'direct';
 const attribution=parseAttribution(value.attribution);
 const designMode=designModeFor(pack,value.designMode);
 const pricing=await getPricing(),subtotal=priceFor(pricing,pack,quantity,designMode);let pricePreview=subtotal;
 const couponCode=typeof value.couponCode==='string'?value.couponCode.trim().slice(0,30).toUpperCase():'';
 if(couponCode){const coupon=await getCoupon(couponCode);if(coupon){try{pricePreview=Math.round((subtotal-couponDiscount(coupon,subtotal,quantity,pack))*100)/100;}catch{}}}
 return {name,phone,email,package:pack,quantity,mode,eventDate,source,...(attribution?{attribution}:{}),pricePreview,...(designMode==='individual'?{designMode}:{}),shirtDetailsStatus:shirts.length?'complete':'pending',shirts:shirts as ShirtSelection[]};
}
async function deliver(row:ContactRow,attempt:string){const details=JSON.parse(row.data) as ContactDetails;const result=await sendContactMail(bindings(),{...contactView(row),packageName:packageLabel(details.package,details.designMode)},attempt);await bindings().DB.prepare('UPDATE contact_leads SET mail_status=? WHERE id=? AND version=?').bind(result.accepted?'accepted':result.code||'failed',row.id,row.version).run();return result;}
export async function saveContact(id:string,token:string,details:ContactDetails,version:number){
 const {DB}=bindings(),now=new Date().toISOString(),hash=await tokenHash(token),json=JSON.stringify(details);
 if(!await contactGrant(id,token)&&await getOrder(id))throw Error('not_found');
 const inserted=await DB.prepare('INSERT OR IGNORE INTO contact_leads (id,token_hash,token_expires_at,created_at,updated_at,version,mail_status,data) VALUES (?,?,?,?,?,1,?,?) RETURNING id').bind(id,hash,Date.now()+86400000,now,now,'pending',json).first<{id:string}>();
 let row=await contactGrant(id,token);if(!row)throw Error('not_found');
 if(inserted){await deliver(row,'initial').catch(()=>console.error('Contact notification unavailable'));row=(await contactGrant(id,token))!;return {created:true,...contactView(row)};}
 if(await getOrder(id))return {created:false,...contactView(row),completed:true};
 if(row.data===json)return {created:false,...contactView(row)};
 if(!Number.isInteger(version)||version!==row.version)throw Error('conflict');
 const changed=await DB.prepare('UPDATE contact_leads SET data=?,updated_at=?,version=version+1,mail_status=? WHERE id=? AND version=? RETURNING id').bind(json,now,'pending',id,version).first<{id:string}>();
 if(!changed)throw Error('conflict');
 row=(await contactGrant(id,token))!;
 await deliver(row,'revision-'+row.version).catch(()=>console.error('Contact update notification unavailable'));
 return {created:false,...contactView((await contactGrant(id,token))!)};
}
export async function retryContactMail(id:string){const row=await bindings().DB.prepare('SELECT * FROM contact_leads WHERE id=?').bind(id).first<ContactRow>();if(!row)throw Error('not_found');return deliver(row,'manual-'+crypto.randomUUID());}
