import {Order,whatsappLink,stageLabel} from './orders';
import {orderSummary} from './order-summary';
type MailEnv={RESEND_API_KEY?:string;MAIL_FROM?:string};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function notifyOrder(env:MailEnv,order:Order,bundleUrl:string,attempt='initial'){
 if(!env.RESEND_API_KEY||!env.MAIL_FROM)return false;
 const wa=whatsappLink(order.phone,`היי ${order.name}, כאן PARTYPRINT. אנחנו מטפלים בהזמנה ${order.id.slice(0,8).toUpperCase()} ונשמח להמשיך איתך כאן.`);
 const admin=`https://partyprint-ai.atzilul.chatgpt.site/admin?order=${order.id}`;
 const summary=orderSummary(order);
 const text=summary+'\n\nהמשך טיפול בוואטסאפ: '+wa+'\nהורדת פרטי ההזמנה והתמונות (קישור ל־30 יום): '+bundleUrl+'\nניהול ההזמנה: '+admin;
 const button=(url:string,label:string,color:string)=>`<a href="${escape(url)}" style="display:inline-block;background:${color};color:white;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:bold;margin:6px 0">${label}</a>`;
 const html=`<div dir="rtl" style="font-family:Arial,sans-serif;background:#f3f4f8;padding:24px;color:#18202c"><div style="max-width:640px;margin:auto;background:white;padding:28px;border-radius:20px"><h1 style="direction:ltr;text-align:right">PARTYPRINT ✳</h1><h2>הזמנה חדשה מ${escape(order.name)}</h2><p>${escape(order.packageName)} · ${order.quantity} חולצות · ${order.price} ₪</p><p>סטטוס: ${escape(stageLabel(order.status))}</p>${button(wa,'המשך טיפול בוואטסאפ','#147b46')}<br/>${button(bundleUrl,'הורדת פרטי ההזמנה וכל התמונות','#302450')}<p style="color:#667085">קובץ ZIP עם סיכום ותמונות. הקישור בתוקף ל־30 יום, מאפשר גישה למחזיק בו ומציג את פרטי ההזמנה העדכניים.</p>${button(admin,'פתיחת ההזמנה במערכת הניהול','#18202c')}<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.8">${escape(summary)}</pre></div></div>`;
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`partyprint/${order.id}/${attempt}`},body:JSON.stringify({from:env.MAIL_FROM,to:['atzilul@gmail.com'],reply_to:order.email,subject:`PARTYPRINT · ${order.name} · ${order.id.slice(0,8)}`,text,html}),signal:AbortSignal.timeout(15000)});if(!response.ok){console.error('Order mail rejected',response.status);return false}return true}catch{console.error('Order mail unavailable');return false}
}
