import type {Workflow} from './workflow';
import type {DesignApproval,PaymentEntry} from './production';
import {DEFAULT_PRICING,Pricing,priceFor} from './pricing';
import {packs,validateShirts} from './catalog';
import {cleanSingleLine} from './text';
export const STAGES=[['received','הזמנה התקבלה'],['designing','נשלח לעיצוב'],['review','עיצוב נשלח ללקוח'],['approved','עיצוב אושר'],['printing','ההזמנה נשלחה להדפסה'],['printed','הדפסה מוכנה'],['shipped','נשלח ללקוח']] as const;
export type Stage=typeof STAGES[number][0];
export type OrderImage={name:string;key:string;size?:number;role?:string};
export type Order=Workflow & {approvalHistory?:DesignApproval[];approval?:DesignApproval;payments?:PaymentEntry[];followUpAt?:string;subtotal?:number;discount?:number;couponCode?:string;id:string;name:string;phone:string;email:string;brief:string;package:number;packageName:string;quantity:number;price:number;mode:string;createdAt:string;updatedAt?:string;status:string;priceStatus:string;shirts:{size:string;color:string}[];images:OrderImage[];version?:number;notes?:string;address?:string;dueDate?:string;tracking?:string;revisions?:number;priceNote?:string;emailStatus?:string;history?:{at:string;action:string;actor:string}[]};
export function whatsappLink(phone:string,message:string){let n=phone.replace(/\D/g,'');if(n.startsWith('00'))n=n.slice(2);if(n.startsWith('0'))n='972'+n.slice(1);if(!/^\d{9,15}$/.test(n))return '';return 'https://wa.me/'+n+'?text='+encodeURIComponent(message)}
export function stageLabel(s:string){return STAGES.find(x=>x[0]===s)?.[1]||STAGES[0][1]}
export function normalizeOrder(o:Order):Order{return {...o,status:STAGES.some(s=>s[0]===o.status)?o.status:'received',version:o.version||1,history:o.history||[],revisions:o.revisions||0}}
export function editOrder(old:Order,v:Record<string,unknown>,pricing:Pricing=DEFAULT_PRICING):Order{
 const str=(key:string,max:number)=>{if(typeof v[key]!=='string'||(v[key] as string).length>max)throw Error('פרטים לא תקינים: '+key);return (v[key] as string).trim()};
 const eventDate=typeof v.eventDate==='string'?v.eventDate:old.eventDate||'';if(eventDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)||Number.isNaN(Date.parse(eventDate))))throw Error('תאריך אירוע לא תקין.');const name=cleanSingleLine(str('name',100),100),phone=str('phone',20),email=str('email',150),brief=str('brief',3000),notes=str('notes',5000),address=str('address',500),tracking=str('tracking',500),dueDate=str('dueDate',10),priceNote=str('priceNote',500);
 if(!name||!/^\+?[0-9() \-]{9,20}$/.test(phone)||!whatsappLink(phone,'')||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('יש למלא שם, מספר טלפון ומייל תקינים.');
 if(dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||Number.isNaN(Date.parse(dueDate))))throw Error('תאריך לא תקין.');
 const p=Number(v.package),quantity=Number(v.quantity),price=Number(v.price),revisions=Number(v.revisions);const catalogPrice=priceFor(pricing,p,quantity);
 if(!Number.isFinite(price)||price<0||price>100000||!Number.isInteger(revisions)||revisions<0||revisions>100)throw Error('מחיר או מספר סבבים לא תקינים.');
 if(price!==old.price&&price!==catalogPrice&&!priceNote)throw Error('יש לציין הסבר למחיר השונה ממחיר החבילה.');
 if(!STAGES.some(s=>s[0]===v.status)||!['lead','order','custom'].includes(String(v.mode)))throw Error('סטטוס או סוג פנייה לא תקינים.');
 if(v.mode!=='lead'&&!validateShirts(v.shirts,quantity))throw Error('יש לבחור מידה וצבע לכל חולצה.');
 return {...old,eventDate,name,phone,email,brief,notes,address,tracking,dueDate,priceNote,package:p,packageName:packs[p].name,quantity,price,revisions,status:String(v.status),mode:String(v.mode),shirts:v.mode==='lead'?[]:v.shirts as Order['shirts'],priceStatus:price!==old.price?'adjusted':old.priceStatus};
}
