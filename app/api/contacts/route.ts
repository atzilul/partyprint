import {clientKey} from '#partyprint-runtime';
import {bindings} from '@/lib/order-store';
import {readLimitedJson} from '@/lib/order-security';
import {contactDetails,contactGrant,contactView,saveContact,validContactKey} from '@/lib/contact-leads';
import {getOrder} from '@/lib/order-store';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const fail=(error:string,status=400)=>Response.json({error},{status,headers});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('הבקשה אינה מורשית.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return fail('פורמט הבקשה אינו תקין.',415);
 try{
 const raw=await readLimitedJson(request,16000);if(!raw||typeof raw!=='object'||Array.isArray(raw))return fail('בדקו את פרטי הקשר.');
 const v=raw as Record<string,unknown>,action=String(v.action);if(!validContactKey(v.id,v.token)||!['save','read'].includes(action)||(action==='save'&&v.website))return fail('בדקו את פרטי הקשר.');
 const id=v.id as string,token=v.token as string;
 if(action==='read'){const row=await contactGrant(id,token);return row?Response.json({saved:true,...contactView(row),completed:!!await getOrder(id)},{headers}):fail('השמירה אינה זמינה בכרטיסייה הזו. מלאו שוב את הפרטים.',404);}
 const {DB}=bindings(),now=Date.now(),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(clientKey(request))),key='contact:'+Math.floor(now/3600000)+':'+Array.from(new Uint8Array(hash)).map(n=>n.toString(16).padStart(2,'0')).join('');
 const count=await DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<8 RETURNING count').bind(key,now+7200000).first();
 if(!count)return fail('נשלחו יותר מדי בקשות. נסו שוב מאוחר יותר או פנו ב־WhatsApp.',429);
 await DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
 const details=await contactDetails(v),result=await saveContact(id,token,details,Number(v.version)||0);
 return Response.json({saved:true,...result},{status:result.created?201:200,headers});
 }catch(e){const message=e instanceof Error?e.message:'';return fail(message==='invalid_contact'?'מלאו שם, טלפון ומייל תקינים.':message==='not_found'?'השמירה אינה זמינה בכרטיסייה הזו.':message==='conflict'?'הפרטים השתנו בכרטיסייה אחרת. רעננו ונסו שוב.':message==='too_large'?'הבקשה גדולה מדי.':'לא הצלחנו לשמור את הפרטים. הם נשארו בטופס, נסו שוב.',message==='invalid_contact'?400:message==='not_found'?404:message==='conflict'?409:message==='too_large'?413:503);}
}
