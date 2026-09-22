import {publicOrigin} from '#partyprint-runtime';
import {whatsappLink,stageLabel} from './orders';
import type {Order} from './orders';
import {orderSummary} from './order-summary';
import {bundleLinkDays,customerLinkDays} from './security';
import {safeMailSubject} from './text';
import {getTeam,getOwnerEmail} from './team';
import {renderOrderMail,managerMailRecipients} from './order-mail-template.mjs';

type MailEnv={RESEND_API_KEY?:string;MAIL_FROM?:string};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export async function orderMailStatus(env:MailEnv) {
 const team=await getTeam();
 return {
  provider:'Resend',
  configured:!!(env.RESEND_API_KEY?.trim()&&env.MAIL_FROM?.trim()),
  sender:env.MAIL_FROM?.trim()||'',
  recipients:managerMailRecipients(getOwnerEmail(),team.members),
 };
}

export async function notifyOrder(env:MailEnv,order:Order,bundleUrl:string,attempt='initial'){
 if(!env.RESEND_API_KEY?.trim()||!env.MAIL_FROM?.trim())return false;
 try {
  const {recipients}=await orderMailStatus(env);
  if(!recipients.length)return false;
  const origin=publicOrigin();
  const wa=whatsappLink(order.phone,'היי '+order.name+', כאן PARTYPRINT. אנחנו מטפלים בהזמנה '+order.id.slice(0,8).toUpperCase()+' ונשמח להמשיך איתך כאן.');
  const {html,text}=renderOrderMail(order,{
   origin,
   adminUrl:origin+'/admin?order='+encodeURIComponent(order.id),
   whatsappUrl:wa,
   bundleUrl,
   bundleDays:bundleLinkDays(),
   summary:orderSummary(order),
   statusLabel:stageLabel(order.status),
  });
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{
    Authorization:'Bearer '+env.RESEND_API_KEY.trim(),
    'Content-Type':'application/json',
    'Idempotency-Key':'partyprint/'+order.id+'/'+attempt,
   },
   body:JSON.stringify({
    from:env.MAIL_FROM.trim(),
    to:recipients,
    reply_to:order.email,
    subject:safeMailSubject('PARTYPRINT · '+(order.mode==='lead'?'רעיון חדש':'הזמנה חדשה')+' מ'+order.name+' · '+order.id.slice(0,8).toUpperCase()),
    text,html,
   }),
   signal:AbortSignal.timeout(15000),
  });
  if(!response.ok){console.error('Order mail rejected',response.status);return false}
  // Provider acceptance is not proof of inbox delivery.
  return true;
 } catch {
  console.error('Order mail unavailable');
  return false;
 }
}

export async function notifyCustomer(env:MailEnv,order:Order,url:string,attempt='initial'){
 if(!env.RESEND_API_KEY||!env.MAIL_FROM)return false;const customerDays=customerLinkDays(), text=`היי ${order.name}, בקשת ההזמנה ${order.id.slice(0,8).toUpperCase()} נשמרה ב־PARTYPRINT.\n${order.quantity} חולצות · ${order.price} ₪\nכל ${order.images.length} התמונות נשמרו.\nמעקב אחר ההזמנה (קישור פרטי ל־${customerDays} יום): ${url}\nאין חיוב בשליחת הטופס. מועד האספקה ייקבע איתכם לפני העבודה.\nכולל עיצוב משותף וסבב תיקונים אחד; סבב נוסף 100 ₪.\nשאלה? https://wa.me/972552896236`;try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`partyprint/customer/${order.id}/${attempt}`},body:JSON.stringify({from:env.MAIL_FROM,to:[order.email],reply_to:getOwnerEmail(),subject:'PARTYPRINT · קיבלנו את הרעיון שלכם',text,html:`<div dir="rtl" style="font-family:Arial;padding:24px;line-height:1.8"><h1>הרעיון שלכם בפנים ✳</h1><p>${escape(text).replace(/\n/g,'<br/>')}</p><a href="${escape(url)}" style="display:inline-block;background:#352051;color:white;padding:16px;border-radius:12px">למעקב אחר ההזמנה</a></div>`}),signal:AbortSignal.timeout(15000)});return r.ok}catch{return false}}
