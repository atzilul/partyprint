import {publicOrigin} from '#partyprint-runtime';
import {whatsappLink,stageLabel} from './orders';
import type {Order} from './orders';
import {orderSummary} from './order-summary';
import {bundleLinkDays,customerLinkDays} from './security';
import {safeMailSubject} from './text';
import {getTeam,getOwnerEmail} from './team';
import {renderOrderMail,managerMailRecipients} from './order-mail-template.mjs';

import {bindings} from './order-store';
import {mailConfiguration,mailFailure,sendResendMail} from './mail-delivery';
import type {MailEnv,MailResult} from './mail-delivery';
type MailAttempt=MailResult & {at:string;kind:'order'|'test';orderId?:string};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
async function recipients(){return managerMailRecipients(getOwnerEmail(),(await getTeam()).members)}
async function recordAttempt(result:MailResult,kind:'order'|'test',orderId?:string){
 const value:MailAttempt={...result,at:new Date().toISOString(),kind,...(orderId?{orderId}:{})};
 try{await bindings().DB.prepare("INSERT INTO studio_settings (key,version,data) VALUES ('mail_last_attempt',1,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data,version=studio_settings.version+1").bind(JSON.stringify(value)).run()}catch{console.error('Mail diagnostic status could not be saved')}
 if(!result.accepted)console.error('Admin notification failed',result.code,result.httpStatus||'');
 return result;
}
export async function orderMailStatus(env:MailEnv){
 const config=mailConfiguration(env),to=await recipients();
 const row=await bindings().DB.prepare("SELECT data FROM studio_settings WHERE key='mail_last_attempt'").first<{data:string}>();
 let lastAttempt:MailAttempt|null=null;
 if(row){try{lastAttempt=JSON.parse(row.data) as MailAttempt}catch{}}
 return {provider:'Resend',configured:!config.issue,sender:config.sender,recipients:to,issue:config.issue||(!to.length?mailFailure('no_recipients'):null),lastAttempt};
}
export async function sendOrderMail(env:MailEnv,order:Order,bundleUrl:string,attempt='initial'):Promise<MailResult>{
 let result:MailResult;
 try{
  const to=await recipients();
  const config=mailConfiguration(env);
  if(config.issue)return recordAttempt({...config.issue,recipients:to},'order',order.id);
  const origin=publicOrigin();
  const wa=whatsappLink(order.phone,'היי '+order.name+', כאן PARTYPRINT. אנחנו מטפלים בהזמנה '+order.id.slice(0,8).toUpperCase()+' ונשמח להמשיך איתך כאן.');
  const {html,text}=renderOrderMail(order,{origin,adminUrl:origin+'/admin?order='+encodeURIComponent(order.id),whatsappUrl:wa,bundleUrl,bundleDays:bundleLinkDays(),summary:orderSummary(order),statusLabel:stageLabel(order.status)});
  result=await sendResendMail(env,{to,reply_to:order.email,subject:safeMailSubject('PARTYPRINT · '+(order.mode==='lead'?'רעיון חדש':'הזמנה חדשה')+' מ'+order.name+' · '+order.id.slice(0,8).toUpperCase()),text,html},'partyprint/'+order.id+'/'+attempt);
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'order',order.id);
}
export async function notifyOrder(env:MailEnv,order:Order,bundleUrl:string,attempt='initial'){return (await sendOrderMail(env,order,bundleUrl,attempt)).accepted}
export async function testOrderMail(env:MailEnv):Promise<MailResult>{
 let result:MailResult;
 try{
  const to=await recipients(),origin=publicOrigin();
  const text='בדיקת מייל למנהלי PARTYPRINT. אם המייל הגיע, החיבור מהשרת ל־Resend עובד עבור התיבה שלכם. זו בדיקה בלבד, ולא נוצרה הזמנה חדשה.\nלפאנל הניהול: '+origin+'/admin';
  const html='<html lang="he" dir="rtl"><body dir="rtl" style="margin:0;padding:24px;background:#F5F4EF;font-family:Arial,sans-serif;text-align:right;color:#161616"><table role="presentation" dir="rtl" width="100%" style="max-width:620px;margin:auto;border:2px solid #161616;background:white" cellpadding="24"><tr><td bgcolor="#EFFF5C" align="right" style="background:#EFFF5C;"><img src="'+escape(origin)+'/partyprint-logo-email.png" width="240" style="max-width:100%;height:auto" alt="PARTYPRINT"></td></tr><tr><td align="right"><h1>בדיקה קטנה. חיבור גדול ✳</h1><p style="line-height:1.8">'+escape(text).replace(/\n/g,'<br>')+'</p><p>הבדיקה נשלחה לכתובות בעל האתר והמנהלים כפי שהן מוגדרות בפאנל.</p><a href="'+escape(origin)+'/admin" style="display:inline-block;padding:16px;background:#D2C5FF;color:#161616;font-weight:bold;text-decoration:none">בחזרה לפאנל ↗</a></td></tr></table></body></html>';
  result=await sendResendMail(env,{to,subject:'PARTYPRINT · בדיקת חיבור למנהלים',text,html},'partyprint/test/'+crypto.randomUUID());
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'test');
}

export async function notifyCustomer(env:MailEnv,order:Order,url:string,attempt='initial'){
 if(mailConfiguration(env).issue)return false;const customerDays=customerLinkDays(), text=`היי ${order.name}, בקשת ההזמנה ${order.id.slice(0,8).toUpperCase()} נשמרה ב־PARTYPRINT.\n${order.quantity} חולצות · ${order.price} ₪\nכל ${order.images.length} התמונות נשמרו.\nמעקב אחר ההזמנה (קישור פרטי ל־${customerDays} יום): ${url}\nאין חיוב בשליחת הטופס. מועד האספקה ייקבע איתכם לפני העבודה.\nכולל עיצוב משותף וסבב תיקונים אחד; סבב נוסף 100 ₪.\nשאלה? https://wa.me/972552896236`;try{const result=await sendResendMail(env,{to:[order.email],reply_to:getOwnerEmail(),subject:'PARTYPRINT · קיבלנו את הרעיון שלכם',text,html:`<div dir="rtl" style="font-family:Arial;padding:24px;line-height:1.8"><h1>הרעיון שלכם בפנים ✳</h1><p>${escape(text).replace(/\n/g,'<br/>')}</p><a href="${escape(url)}" style="display:inline-block;background:#352051;color:white;padding:16px;border-radius:12px">למעקב אחר ההזמנה</a></div>`},'partyprint/customer/'+order.id+'/'+attempt);return result.accepted}catch{return false}}
