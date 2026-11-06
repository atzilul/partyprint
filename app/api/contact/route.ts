import {clientKey} from '#partyprint-runtime';
import {bindings} from '@/lib/order-store';
import {readLimitedJson} from '@/lib/order-security';
import {contactMessage,topicLabel} from '@/lib/contact-messages';
import {sendContactMessageMail} from '@/lib/order-mail';

/**
 * A message from the contact page. It is saved as a ticket (the studio's own list of open
 * conversations) and the managers get an email. Nothing is sent to the visitor.
 */
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const fail=(error:string,status=400)=>Response.json({error},{status,headers});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('הבקשה אינה מורשית.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return fail('פורמט הבקשה אינו תקין.',415);
 try{
  const raw=await readLimitedJson(request,8000);
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail('בדקו את הפרטים ונסו שוב.');
  const value=raw as Record<string,unknown>;
  // A field people never see; only an automatic sender fills it.
  if(value.website)return fail('בדקו את הפרטים ונסו שוב.');
  let message;
  try{message=contactMessage(value);}catch{return fail('בדקו את הפרטים ונסו שוב.');}
  const {DB}=bindings();
  if(!DB)return fail('שליחת הודעות אינה זמינה כרגע. אפשר לפנות אלינו ב־WhatsApp.',503);
  const now=Date.now(),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(clientKey(request)));
  const key='message:'+Math.floor(now/3600000)+':'+Array.from(new Uint8Array(hash)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  const count=await DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<5 RETURNING count').bind(key,now+7200000).first();
  if(!count)return fail('נשלחו יותר מדי הודעות. נסו שוב מאוחר יותר או פנו ב־WhatsApp.',429);
  const id=crypto.randomUUID(),at=new Date(now).toISOString();
  const description=message.body+'\n\nטלפון: '+message.phone+'\nנשלח מעמוד יצירת הקשר באתר.';
  await DB.prepare('INSERT INTO tickets (id,title,description,status,priority,customer_name,customer_email,order_id,assignee_email,assignee_name,created_by_email,created_by_name,due_at,created_at,updated_at,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)')
   .bind(id,'פנייה מהאתר · '+topicLabel(message.topic),description,'open','normal',message.name,message.email,null,null,null,'website','טופס יצירת קשר',null,at,at).run();
  // The message is saved either way; the email is how the studio hears about it quickly.
  let emailSent=false;
  try{emailSent=(await sendContactMessageMail(bindings(),{id,createdAt:at,...message})).accepted;}catch{console.error('Contact message notification unavailable');}
  return Response.json({reference:id.slice(0,8).toUpperCase(),emailSent},{status:201,headers});
 }catch{
  return fail('לא הצלחנו לשמור את ההודעה. נסו שוב או פנו ב־WhatsApp.',503);
 }
}
