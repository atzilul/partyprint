import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getOrder,saveOrder,bindings} from '@/lib/order-store';
import {sendOrderMail} from '@/lib/order-mail';
import {createOrderAccess} from '@/lib/order-access';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 try{
  const o=await getOrder((await params).id),b=bindings();
  if(!o)return new Response('Not found',{status:404,headers:PRIVATE_HEADERS});
  const key='admin-mail:'+o.id;
  const lock=await b.DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at < ? RETURNING key').bind(key,Date.now()+60000,Date.now()).first();
  if(!lock)return Response.json({error:'אפשר לשלוח שוב בעוד דקה.'},{status:429,headers:PRIVATE_HEADERS});
  const url=await createOrderAccess(b.BUCKET,o.id),result=await sendOrderMail(b,o,url,crypto.randomUUID());
  const fresh=await getOrder(o.id);
  if(fresh)await saveOrder({...fresh,emailStatus:result.accepted?'accepted':'failed'},fresh.version!,result.accepted?'התראת מייל התקבלה בשירות השליחה':'שליחת התראת מייל נכשלה: '+result.message,'מנהל');
  return Response.json({sent:result.accepted,recipients:result.recipients,messageId:result.messageId,...(!result.accepted?{error:result.message,code:result.code}:{})},{headers:PRIVATE_HEADERS});
 }catch(e){return adminError(e)}
}
