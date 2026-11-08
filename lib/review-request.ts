import {publicOrigin} from '#partyprint-runtime';
import type {Order} from './orders';
import {bindings} from './order-store';
import {renderReviewRequest} from './order-mail-template.mjs';
import {mailConfiguration,sendResendMail} from './mail-delivery';
import type {MailEnv} from './mail-delivery';
import {getOwnerEmail} from './team';
import {translateMail} from '@/i18n/mail';

/**
 * A review request: one email when an order is marked shipped, in the customer's language,
 * with the studio's Google review link. Off until the link is set and switched on in the
 * admin settings (studio_settings key 'review').
 */
export type ReviewSettings={enabled:boolean;url:string;version:number};
export const DEFAULT_REVIEW_SETTINGS:ReviewSettings={enabled:false,url:'',version:0};
const REVIEW_SUBJECT='PARTYPRINT · החולצות שלכם בדרך';

/** A Google review address: https on google.com, g.page or a Google short link. */
export function validReviewUrl(value:unknown):value is string{
 if(typeof value!=='string'||value.length>500)return false;
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password)return false;
  const host=url.hostname.toLowerCase();
  return host==='g.page'||host==='goo.gl'||host==='maps.app.goo.gl'||host==='google.com'||host.endsWith('.google.com')||/^(?:www\.)?google\.co\.il$/.test(host);
 }catch{return false}
}
export function cleanReviewSettings(value:unknown,version:number):ReviewSettings|null{
 if(!value||typeof value!=='object')return null;
 const {enabled,url}=value as {enabled?:unknown;url?:unknown};
 const link=typeof url==='string'?url.trim():'';
 if(typeof enabled!=='boolean'||(link!==''&&!validReviewUrl(link))||(enabled&&!link))return null;
 return {enabled,url:link,version};
}
export async function getReviewSettings():Promise<ReviewSettings>{
 const row=await bindings().DB.prepare("SELECT data,version FROM studio_settings WHERE key='review'").first<{data:string;version:number}>();
 if(!row)return DEFAULT_REVIEW_SETTINGS;
 try{return cleanReviewSettings(JSON.parse(row.data),row.version)||DEFAULT_REVIEW_SETTINGS}catch{return DEFAULT_REVIEW_SETTINGS}
}

export function reviewRequestMail(order:Order,reviewUrl:string){
 const reference=order.id.slice(0,8).toUpperCase();
 const rendered=renderReviewRequest(order,{origin:publicOrigin(),reviewUrl});
 return translateMail({subject:REVIEW_SUBJECT,html:rendered.html as string,text:rendered.text as string},order.language,[reviewUrl,order.name,reference]);
}

/**
 * After an order is saved: if it has just become shipped, has an email, is not cancelled and
 * was not asked before, send the request once and note when. A failure never blocks the save.
 */
export async function requestReviewAfterShipping(env:MailEnv,before:Pick<Order,'status'>,after:Order):Promise<boolean>{
 try{
  if(before.status==='shipped'||after.status!=='shipped'||!after.email||after.cancelledAt||after.archivedAt||after.reviewRequestedAt)return false;
  const settings=await getReviewSettings();
  if(!settings.enabled||!validReviewUrl(settings.url)||mailConfiguration(env).issue)return false;
  const {subject,html,text}=reviewRequestMail(after,settings.url);
  const result=await sendResendMail(env,{to:[after.email],reply_to:getOwnerEmail(),subject,text,html},'partyprint/review/'+after.id);
  if(!result.accepted)return false;
  // Noted without a new order version, so the screen that marked it shipped keeps working.
  await bindings().DB.prepare("UPDATE orders SET data=json_set(data,'$.reviewRequestedAt',?) WHERE id=?").bind(new Date().toISOString(),after.id).run();
  return true;
 }catch{console.error('Review request unavailable');return false}
}
