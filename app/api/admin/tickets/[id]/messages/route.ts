import {guard} from '@/lib/admin-auth';
import {PRIVATE_HEADERS} from '@/lib/security';
import {bindings} from '@/lib/order-store';
import {actor,failure,newId,text} from '../../_shared';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 try{
  const {id}=await params,payload=await request.json() as Record<string,unknown>,body=text(payload.body,5000,true),db=bindings().DB;
  const exists=await db.prepare('SELECT id FROM tickets WHERE id=?').bind(id).first<{id:string}>();if(!exists)throw Error('ticket_not_found');
  const user=await actor(),now=new Date().toISOString(),message={id:newId(),ticketId:id,authorEmail:user.email,authorName:user.name,body,createdAt:now};
  await db.batch([db.prepare('INSERT INTO ticket_messages (id,ticket_id,author_email,author_name,body,created_at) VALUES (?,?,?,?,?,?)').bind(message.id,id,message.authorEmail,message.authorName,message.body,message.createdAt),db.prepare('UPDATE tickets SET updated_at=?,version=version+1 WHERE id=?').bind(now,id)]);
  return Response.json({message},{status:201,headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}
