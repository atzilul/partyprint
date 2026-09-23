import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {bindings} from '@/lib/order-store';
import {orderMailStatus,testOrderMail} from '@/lib/order-mail';
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 try{
  const b=bindings(),now=Date.now();
  const lock=await b.DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET expires_at=excluded.expires_at WHERE expires_at < ? RETURNING key').bind('admin-mail:test',now+60000,now).first();
  if(!lock)return Response.json({error:'אפשר לשלוח בדיקה נוספת בעוד דקה.'},{status:429,headers:PRIVATE_HEADERS});
  // Recipients are always resolved on the server from the current team.
  const result=await testOrderMail(b);
  return Response.json({result,mail:await orderMailStatus(b)},{headers:PRIVATE_HEADERS});
 }catch(e){return adminError(e)}
}
