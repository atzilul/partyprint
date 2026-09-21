import {guard} from '@/lib/admin-auth';
import {PRIVATE_HEADERS} from '@/lib/security';
import {bindings} from '@/lib/order-store';
import {ensureTicketValues,failure,orderFor,resolveAssignee,ticketFromRow} from '../_shared';

async function current(id:string){const row=await bindings().DB.prepare('SELECT * FROM tickets WHERE id=?').bind(id).first<Record<string,unknown>>();if(!row)throw Error('ticket_not_found');return row}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard();if(denied)return denied;
 try{const {id}=await params,row=await current(id),messages=await bindings().DB.prepare('SELECT id,ticket_id,author_email,author_name,body,created_at FROM ticket_messages WHERE ticket_id=? ORDER BY created_at ASC').bind(id).all<Record<string,unknown>>();return Response.json({ticket:ticketFromRow(row),messages:messages.results.map(message=>({id:String(message.id),ticketId:String(message.ticket_id),authorEmail:String(message.author_email),authorName:String(message.author_name),body:String(message.body),createdAt:String(message.created_at)}))},{headers:PRIVATE_HEADERS})}catch(error){return failure(error)}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 try{
  const {id}=await params,payload=await request.json() as Record<string,unknown>,old=ticketFromRow(await current(id));
  const values=ensureTicketValues({title:payload.title===undefined?old.title:payload.title,description:payload.description===undefined?old.description:payload.description,customerName:payload.customerName===undefined?old.customerName:payload.customerName,customerEmail:payload.customerEmail===undefined?old.customerEmail:payload.customerEmail,dueAt:payload.dueAt===undefined?old.dueAt:payload.dueAt,orderId:payload.orderId===undefined?old.orderId:payload.orderId,status:payload.status===undefined?old.status:payload.status,priority:payload.priority===undefined?old.priority:payload.priority});
  const order=await orderFor(values.orderId),customerName=values.customerName||order?.name||'',customerEmail=values.customerEmail||order?.email||'';if(!customerName||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))throw Error('invalid_input');
  const assigned=await resolveAssignee(payload.assigneeEmail===undefined?old.assigneeEmail:payload.assigneeEmail),now=new Date().toISOString(),row=await bindings().DB.prepare('UPDATE tickets SET title=?,description=?,status=?,priority=?,customer_name=?,customer_email=?,order_id=?,assignee_email=?,assignee_name=?,due_at=?,updated_at=?,version=version+1 WHERE id=? AND version=? RETURNING *').bind(values.title,values.description,values.status,values.priority,customerName,customerEmail,values.orderId||null,assigned.email||null,assigned.name||null,values.dueAt||null,now,id,old.version).first<Record<string,unknown>>();
  if(!row)throw Error('conflict');
  return Response.json({ticket:ticketFromRow(row)},{headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}
