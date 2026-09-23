export type MailEnv = {RESEND_API_KEY?:string;MAIL_FROM?:string};
export type MailFailureCode = 'missing_api_key'|'missing_sender'|'invalid_sender'|'no_recipients'|'invalid_api_key'|'restricted_api_key'|'domain_not_verified'|'testing_restriction'|'quota_exceeded'|'rate_limited'|'provider_unavailable'|'provider_rejected'|'invalid_response'|'network_error'|'preparation_failed';
export type MailResult = {accepted:boolean;recipients:string[];messageId?:string;code?:MailFailureCode;message:string;httpStatus?:number};
export function cleanMailValue(value?:string){const s=(value||'').trim();return s.length>=2&&((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'")))?s.slice(1,-1).trim():s}
const messages:Record<MailFailureCode,string>={
 missing_api_key:'חסר מפתח RESEND_API_KEY בהגדרות השרת. שמרו אותו ובצעו פריסה מחדש.',
 missing_sender:'חסרה כתובת MAIL_FROM בהגדרות השרת. יש להשתמש בכתובת מדומיין מאומת ב־Resend.',
 invalid_sender:'כתובת MAIL_FROM אינה תקינה. הזינו כתובת מייל או PARTYPRINT <orders@your-domain>.',
 no_recipients:'לא נמצאו כתובות תקינות של בעל האתר או מנהלים ברשימת הצוות.',
 invalid_api_key:'Resend דחה את מפתח השליחה. בדקו שהמפתח פעיל ונשמר נכון בשרת.',
 restricted_api_key:'מפתח Resend אינו מורשה לשליחה זו. בדקו את הרשאות השליחה והדומיין המשויך למפתח.',
 domain_not_verified:'הדומיין של כתובת השולח אינו מאומת ב־Resend. אמתו אותו וודאו ש־MAIL_FROM משתמש באותו דומיין.',
 testing_restriction:'Resend מגביל כרגע שליחה לכתובת הבדיקה של החשבון. כדי לשלוח למנהלים, אמתו דומיין והגדירו ממנו את MAIL_FROM.',
 quota_exceeded:'מכסת השליחה ב־Resend נוצלה. בדקו את המכסה בחשבון לפני ניסיון נוסף.',
 rate_limited:'Resend הגביל זמנית את קצב הבקשות. נסו שוב בעוד דקה.',
 provider_unavailable:'שירות Resend אינו זמין כרגע. ההזמנה שמורה; אפשר לשלוח שוב בהמשך.',
 provider_rejected:'Resend דחה את ההודעה. בדקו את יומן השליחה בחשבון Resend.',
 invalid_response:'לא התקבל מזהה הודעה תקין מ־Resend. בדקו את יומן השליחה לפני ניסיון נוסף.',
 network_error:'לא התקבל אישור מ־Resend בזמן. בדקו את החיבור מהשרת ואת יומן השליחה לפני ניסיון נוסף.',
 preparation_failed:'לא ניתן להכין את ההתראה או לקרוא את רשימת המנהלים. ההזמנה נשמרה; בדקו את יומן השרת.',
};
export function mailFailure(code:MailFailureCode,recipients:string[]=[],httpStatus?:number):MailResult{return {accepted:false,recipients,code,message:messages[code],...(httpStatus?{httpStatus}:{})}}
export function mailConfiguration(env:MailEnv){
 const apiKey=cleanMailValue(env.RESEND_API_KEY),sender=cleanMailValue(env.MAIL_FROM);
 const address=sender.match(/^[^<>\r\n]*<([^<>]+)>$/)?.[1]||sender;
 const code:MailFailureCode|undefined=!apiKey?'missing_api_key':!sender?'missing_sender':/[\r\n]/.test(sender)||!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(address)?'invalid_sender':undefined;
 return {apiKey,sender,issue:code?mailFailure(code):null};
}
function providerFailure(status:number,body:unknown,recipients:string[]){
 const value=body&&typeof body==='object'?body as {name?:unknown;message?:unknown}:{};
 const name=typeof value.name==='string'?value.name:'';
 const message=typeof value.message==='string'?value.message.toLowerCase():'';
 let code:MailFailureCode='provider_rejected';
 if(status===401||name==='invalid_api_key'||name==='missing_api_key')code='invalid_api_key';
 else if(name==='restricted_api_key'||name==='invalid_permission'||name==='suspended_api_key')code='restricted_api_key';
 else if(message.includes('only send testing emails'))code='testing_restriction';
 else if(message.includes('domain')&&(message.includes('not verified')||message.includes('verify your domain')))code='domain_not_verified';
 else if(name.includes('quota'))code='quota_exceeded';
 else if(status===429)code='rate_limited';
 else if(status>=500)code='provider_unavailable';
 // Never store or expose raw provider text, request bodies, or credentials.
 return mailFailure(code,recipients,status);
}
export async function sendResendMail(env:MailEnv,payload:{to:string[];subject:string;html:string;text:string;reply_to?:string},idempotencyKey:string):Promise<MailResult>{
 const config=mailConfiguration(env);
 if(config.issue)return {...config.issue,recipients:payload.to};
 if(!payload.to.length)return mailFailure('no_recipients');
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from:config.sender,...payload}),signal:AbortSignal.timeout(15000)});
  const body:unknown=await response.json().catch(()=>null);
  if(!response.ok)return providerFailure(response.status,body,payload.to);
  const id=body&&typeof body==='object'&&'id' in body?body.id:null;
  if(typeof id!=='string'||!id||id.length>100||!/^[a-zA-Z0-9_-]+$/.test(id))return mailFailure('invalid_response',payload.to,response.status);
  return {accepted:true,recipients:payload.to,messageId:id,message:'Resend קיבל את ההודעה לשליחה. יש לבדוק בתיבת הדואר או ביומן המסירה אם היא הגיעה.'};
 }catch{return mailFailure('network_error',payload.to)}
}
