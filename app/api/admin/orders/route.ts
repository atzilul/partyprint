import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {bindings} from '@/lib/order-store';
import {normalizeOrder,Order} from '@/lib/orders';
import {orderQuery,israelDay} from '@/lib/admin-query';
export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 try{
  const {DB,RESEND_API_KEY,MAIL_FROM}=bindings(),u=new URL(request.url);
  const page=Math.max(0,Math.min(10000,Math.floor(Number(u.searchParams.get('page'))||0)));
  const {where,args,sort}=orderQuery(u.searchParams);
  const rows=await DB.prepare(`SELECT data,version FROM orders WHERE ${where} ORDER BY ${sort} LIMIT 40 OFFSET ?`).bind(...args,page*40).all<{data:string;version:number}>();
  const count=await DB.prepare(`SELECT count(*) AS n FROM orders WHERE ${where}`).bind(...args).first<{n:number}>();
  const counts=await DB.prepare('SELECT status,count(*) AS n FROM orders GROUP BY status').all();
  const pending=await DB.prepare("SELECT count(*) AS n FROM orders WHERE coalesce(json_extract(data,'$.emailStatus'),'') != 'accepted'").first<{n:number}>();
  const today=israelDay();
  const attention=await DB.prepare("SELECT sum(CASE WHEN status!='shipped' AND json_extract(data,'$.dueDate')!='' AND json_extract(data,'$.dueDate')<? THEN 1 ELSE 0 END) AS overdue,sum(CASE WHEN status!='shipped' AND json_extract(data,'$.dueDate')=? THEN 1 ELSE 0 END) AS today FROM orders").bind(today,today).first<{overdue:number;today:number}>();
  return Response.json({orders:rows.results.map(r=>({...normalizeOrder(JSON.parse(r.data)),version:r.version})),total:count?.n||0,counts:counts.results,mailReady:!!(RESEND_API_KEY&&MAIL_FROM),pendingMail:pending?.n||0,attention:{overdue:attention?.overdue||0,today:attention?.today||0},today},{headers:PRIVATE_HEADERS});
 }catch(e){return adminError(e)}
}
export async function POST(request:Request){const denied=await guard(request);if(denied)return denied;try{const {DB,BUCKET}=bindings();const cursor=new URL(request.url).searchParams.get('cursor')||undefined;const page=await BUCKET.list({prefix:'orders/',limit:200,cursor});let imported=0;for(const item of page.objects){if(!item.key.endsWith('/details.json'))continue;const obj=await BUCKET.get(item.key);if(!obj)continue;const o=normalizeOrder(await obj.json<Order>());if(!o.id||!o.createdAt)continue;const result=await DB.prepare('INSERT OR IGNORE INTO orders (id,status,created_at,updated_at,version,data) VALUES (?,?,?,?,1,?) RETURNING id').bind(o.id,o.status,o.createdAt,o.createdAt,JSON.stringify(o)).first();if(result)imported++}return Response.json({imported,cursor:page.truncated?page.cursor:null},{headers:PRIVATE_HEADERS})}catch(e){return adminError(e)}}
