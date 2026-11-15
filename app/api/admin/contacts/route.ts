import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {bindings} from '@/lib/order-store';
import {markContactFollowUp,retryContactMail} from '@/lib/contact-leads';
import type {ContactRow} from '@/lib/contact-leads';
import {readLimitedJson} from '@/lib/order-security';
export async function GET(request:Request){const denied=await guard();if(denied)return denied;try{const u=new URL(request.url),id=u.searchParams.get('id')||'',page=Math.max(0,Math.min(10000,Math.floor(Number(u.searchParams.get('page'))||0)));const focus=u.searchParams.get('focus')||'';
 // Waiting for follow-up: no completed request, details saved at least 2 hours ago, and no follow-up in the last 3 days.
 const pending="o.id IS NULL AND c.updated_at<=strftime('%Y-%m-%dT%H:%M:%fZ','now','-2 hours') AND coalesce(json_extract(c.data,'$.followUpAt'),'')<=strftime('%Y-%m-%dT%H:%M:%fZ','now','-3 days')";
 const clauses=[id?'c.id=?':'1=1'],args=id?[id]:[];if(focus==='pending')clauses.push(pending);
 const where=clauses.join(' AND '),order=focus==='pending'?'c.updated_at ASC':'c.updated_at DESC';
 const rows=await bindings().DB.prepare('SELECT c.id,c.created_at,c.updated_at,c.version,c.mail_status,c.data,o.id AS order_id FROM contact_leads c LEFT JOIN orders o ON o.id=c.id WHERE '+where+' ORDER BY '+order+' LIMIT 40 OFFSET ?').bind(...args,page*40).all<ContactRow&{order_id:string|null}>();const count=await bindings().DB.prepare('SELECT count(*) AS n FROM contact_leads c LEFT JOIN orders o ON o.id=c.id WHERE '+where).bind(...args).first<{n:number}>();
 const waiting=await bindings().DB.prepare('SELECT count(*) AS n FROM contact_leads c LEFT JOIN orders o ON o.id=c.id WHERE '+pending).first<{n:number}>();
 return Response.json({contacts:rows.results.map(r=>({id:r.id,createdAt:r.created_at,updatedAt:r.updated_at,version:r.version,mailStatus:r.mail_status,details:JSON.parse(r.data),completed:!!r.order_id,orderId:r.order_id})),total:count?.n||0,page,pending:waiting?.n||0},{headers:PRIVATE_HEADERS});}catch(e){return adminError(e)}}
export async function POST(request:Request){const denied=await guard(request);if(denied)return denied;try{const v=await readLimitedJson(request,1000) as {id?:string;action?:string};if(!['resend','followup'].includes(String(v.action))||!v.id||!/^[a-f0-9-]{36}$/.test(v.id))return Response.json({error:'בקשה אינה תקינה.'},{status:400,headers:PRIVATE_HEADERS});
 if(v.action==='followup'){const at=await markContactFollowUp(v.id);return Response.json({accepted:true,followUpAt:at,message:'סומן מעקב. אין אישור שליחת הודעה; התזכורת תחזור בעוד 3 ימים.'},{headers:PRIVATE_HEADERS});}
 const result=await retryContactMail(v.id);return Response.json({accepted:result.accepted,message:result.message},{headers:PRIVATE_HEADERS});}catch(e){return adminError(e)}}
