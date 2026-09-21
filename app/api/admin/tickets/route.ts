import {guard} from '@/lib/admin-auth';
import {PRIVATE_HEADERS} from '@/lib/security';
import {bindings} from '@/lib/order-store';
import {TicketStatus} from '@/lib/ticketing';
import {actor,ensureTicketValues,failure,newId,orderFor,resolveAssignee,ticketFromRow} from './_shared';

export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 try{
  const u=new URL(request.url),where:string[]=['1=1'],args:(string|number)[]=[];
  const q=(u.searchParams.get('q')||'').trim();
  const status=u.searchParams.get('status')||'';
  const priority=u.searchParams.get('priority')||'';
  const assignee=u.searchParams.get('assignee')||'';
  if(q){const search='%'+q.replace(/[\\%_]/g,'\\$&')+'%';where.push("(title LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR order_id LIKE ? ESCAPE '\\')");args.push(search,search,search,search)}
  if(['open','in_progress','waiting','done'].includes(status)){where.push('status=?');args.push(status)}
  if(['low','normal','high','urgent'].includes(priority)){where.push('priority=?');args.push(priority)}
  if(assignee==='me'){where.push('assignee_email=?');args.push((await actor()).email)}else if(assignee){where.push('assignee_email=?');args.push(assignee.toLowerCase())}
  const db=bindings().DB,filter=where.join(' AND ');
  const rows=await db.prepare(`SELECT t.*,(SELECT body FROM ticket_messages m WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message FROM tickets t WHERE ${filter} ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,t.updated_at DESC LIMIT 200`).bind(...args).all<Record<string,unknown>>();
  const total=await db.prepare(`SELECT count(*) AS n FROM tickets WHERE ${filter}`).bind(...args).first<{n:number}>();
  const counts=await db.prepare('SELECT status,count(*) AS n FROM tickets GROUP BY status').all<{status:TicketStatus;n:number}>();
  const urgent=await db.prepare("SELECT count(*) AS n FROM tickets WHERE priority='urgent' AND status!='done'").first<{n:number}>();
  return Response.json({tickets:rows.results.map(ticketFromRow),total:total?.n||0,counts:counts.results.map(item=>({status:item.status,n:Number(item.n)})),urgent:urgent?.n||0},{headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}

export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 try{
  const payload=await request.json() as Record<string,unknown>,values=ensureTicketValues(payload),order=await orderFor(values.orderId);
  const customerName=values.customerName||order?.name||'',customerEmail=values.customerEmail||order?.email||'';
  if(!customerName||!customerEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))throw Error('invalid_input');
  const assigned=await resolveAssignee(payload.assigneeEmail),user=await actor(),now=new Date().toISOString(),id=newId(),db=bindings().DB;
  await db.prepare('INSERT INTO tickets (id,title,description,status,priority,customer_name,customer_email,order_id,assignee_email,assignee_name,created_by_email,created_by_name,due_at,created_at,updated_at,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)').bind(id,values.title,values.description,values.status,values.priority,customerName,customerEmail,values.orderId||null,assigned.email||null,assigned.name||null,user.email,user.name,values.dueAt||null,now,now).run();
  const row=await db.prepare('SELECT * FROM tickets WHERE id=?').bind(id).first<Record<string,unknown>>();
  return Response.json({ticket:ticketFromRow(row||{})},{status:201,headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}
