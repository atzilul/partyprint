import {publicOrigin} from '#partyprint-runtime';
import {whatsappLink,stageLabel} from './orders';
import type {Order} from './orders';
import {orderSummary} from './order-summary';
import {bundleLinkDays,customerLinkDays} from './security';
import {safeMailSubject} from './text';
import {getTeam,getOwnerEmail} from './team';
import {renderOrderMail,renderCustomerConfirmation,renderContactNotice,renderContactMessage,renderManagerMailTest,managerMailRecipients} from './order-mail-template.mjs';
import {topicLabel} from './contact-messages';
import type {ContactMessage} from './contact-messages';

import {bindings} from './order-store';
import {mailConfiguration,mailFailure,sendResendMail} from './mail-delivery';
import type {MailEnv,MailResult} from './mail-delivery';
import {describeAttribution} from './attribution';
import type {Attribution} from './attribution';
import {RESPONSE_PROMISE_STATIC} from './response-promise';
type MailAttempt=MailResult & {at:string;kind:'order'|'test'|'contact';orderId?:string};
async function recipients(){return managerMailRecipients(getOwnerEmail(),(await getTeam()).members)}
async function recordAttempt(result:MailResult,kind:'order'|'test'|'contact',orderId?:string){
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
  const {html,text}=renderOrderMail(order,{origin,adminUrl:origin+'/admin?order='+encodeURIComponent(order.id),whatsappUrl:wa,bundleUrl,bundleDays:bundleLinkDays(),summary:orderSummary(order),statusLabel:stageLabel(order.status),sourceLine:order.attribution?describeAttribution(order.attribution):(order.source||'direct')});
  result=await sendResendMail(env,{to,...(order.email?{reply_to:order.email}:{}),subject:safeMailSubject('PARTYPRINT · '+(order.mode==='lead'?'רעיון חדש':'הזמנה חדשה')+' מ'+order.name+' · '+order.id.slice(0,8).toUpperCase()),text,html},'partyprint/'+order.id+'/'+attempt);
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'order',order.id);
}
export async function notifyOrder(env:MailEnv,order:Order,bundleUrl:string,attempt='initial'){return (await sendOrderMail(env,order,bundleUrl,attempt)).accepted}
export async function testOrderMail(env:MailEnv):Promise<MailResult>{
 let result:MailResult;
 try{
  const to=await recipients(),origin=publicOrigin();
  const {html,text}=renderManagerMailTest({origin});
  result=await sendResendMail(env,{to,subject:'PARTYPRINT · בדיקת חיבור למנהלים',text,html},'partyprint/test/'+crypto.randomUUID());
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'test');
}

export async function notifyCustomer(env:MailEnv,order:Order,url:string,attempt='initial'){
 if(!order.email||mailConfiguration(env).issue)return false;
 const customerDays=customerLinkDays();
 const {html,text}=renderCustomerConfirmation(order,{origin:publicOrigin(),url,days:customerDays,promise:RESPONSE_PROMISE_STATIC});
 try{
  const result=await sendResendMail(env,{to:[order.email],reply_to:getOwnerEmail(),subject:'PARTYPRINT · קיבלנו את הרעיון שלכם',text,html},'partyprint/customer/'+order.id+'/'+attempt);
  return result.accepted;
 }catch{return false}
}

export async function sendContactMail(env:MailEnv,contact:{id:string;version:number;createdAt:string;updatedAt:string;packageName:string;details:{name:string;phone:string;email:string;quantity:number;eventDate:string;pricePreview:number;source?:string;attribution?:Attribution}},attempt='initial'):Promise<MailResult>{
 let result:MailResult;
 try{
  const to=managerMailRecipients(getOwnerEmail(),[]),origin=publicOrigin(),url=origin+'/admin?contact='+encodeURIComponent(contact.id);
  const d=contact.details,reference=contact.id.slice(0,8).toUpperCase();
  const whatsappUrl=whatsappLink(d.phone,'היי '+d.name+', כאן PARTYPRINT. קיבלנו את הפנייה '+reference+' ל־'+d.quantity+' חולצות ('+contact.packageName+') וחוזרים אליך עם כיוון ראשון בהקדם. בינתיים, יש תמונה שאתם הכי אוהבים?');
  const {html,text}=renderContactNotice(contact,{origin,adminUrl:url,attempt,sourceLine:d.attribution?describeAttribution(d.attribution):(d.source||'direct'),whatsappUrl,promise:RESPONSE_PROMISE_STATIC});
  result=await sendResendMail(env,{to,reply_to:contact.details.email,subject:safeMailSubject('PARTYPRINT · פרטי קשר '+(attempt==='initial'?'חדשים':'עודכנו')+' מ'+contact.details.name+' · '+contact.id.slice(0,8).toUpperCase()),text,html},'partyprint/contact/'+contact.id+'/'+attempt,3000);
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'contact',contact.id);
}

/** Tells the managers about a message from the contact page, with a ready WhatsApp reply to the sender. */
export async function sendContactMessageMail(env:MailEnv,message:ContactMessage&{id:string;createdAt:string}):Promise<MailResult>{
 let result:MailResult;
 try{
  const to=await recipients(),origin=publicOrigin(),reference=message.id.slice(0,8).toUpperCase();
  const config=mailConfiguration(env);
  if(config.issue)return recordAttempt({...config.issue,recipients:to},'contact',message.id);
  const whatsappUrl=whatsappLink(message.phone,'היי '+message.name+', כאן PARTYPRINT. קיבלנו את ההודעה שלך ('+reference+') ואנחנו כאן.');
  const {html,text}=renderContactMessage({...message,topicLabel:topicLabel(message.topic)},{origin,adminUrl:origin+'/admin?ticket='+encodeURIComponent(message.id),whatsappUrl});
  result=await sendResendMail(env,{to,reply_to:message.email,subject:safeMailSubject('PARTYPRINT · הודעה מהאתר מ'+message.name+' · '+reference),text:text as string,html:html as string},'partyprint/message/'+message.id,5000);
 }catch{result=mailFailure('preparation_failed')}
 return recordAttempt(result,'contact',message.id);
}
