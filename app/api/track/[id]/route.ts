import {customerOrder} from '@/lib/customer-access';
import {PRIVATE_HEADERS} from '@/lib/admin-auth';
import {bindings,saveOrder} from '@/lib/order-store';
import {approvalCurrent,paidTotal} from '@/lib/production';
import {validateShirts} from '@/lib/catalog';
import {orderSummary} from '@/lib/order-summary';
const reply=(error:string,status:number)=>Response.json({error},{status,headers:PRIVATE_HEADERS});
export async function GET(r:Request,{params}:{params:Promise<{id:string}>}){try{const o=await customerOrder(r,(await params).id);if(!o)return reply('הקישור אינו זמין או שפג תוקפו. בקשו קישור חדש מהסטודיו.',404);const a=o.approval&&approvalCurrent(o)?o.approval:undefined;const image=new URL(r.url).searchParams.get('image');if(image!==null){const n=Number(image);if(!a||!Number.isInteger(n)||!a.images[n])return new Response(null,{status:404,headers:PRIVATE_HEADERS});const f=await bindings().BUCKET.get(a.images[n].key);return f?new Response(f.body,{headers:{...PRIVATE_HEADERS,'Content-Type':f.httpMetadata?.contentType||'application/octet-stream'}}):new Response(null,{status:404,headers:PRIVATE_HEADERS})}return Response.json({id:o.id,name:o.name,packageName:o.packageName,quantity:o.quantity,shirts:o.shirts,shirtDetailsStatus:o.shirtDetailsStatus??(validateShirts(o.shirts,o.quantity)?'complete':'pending'),version:o.version,canEditShirts:!o.cancelledAt&&!o.archivedAt&&['received','designing'].includes(o.status),price:o.price,paid:paidTotal(o),status:o.status,createdAt:o.createdAt,dueDate:o.dueDate,eventDate:o.eventDate,tracking:o.tracking,brief:o.brief,cancelled:!!o.cancelledAt,approval:a?{state:a.state,images:a.images.map(i=>i.name),comment:a.comment}:null},{headers:PRIVATE_HEADERS})}catch{return reply('לא ניתן לטעון כרגע. נסו שוב.',503)}}
// A private, expiring customer capability is required. This endpoint can only
// change sizes/colors before review; it cannot alter price, contact or quantity.
export async function PATCH(r:Request,{params}:{params:Promise<{id:string}>}){
 if(r.headers.get('origin')!==new URL(r.url).origin)return reply('הבקשה אינה מורשית.',403);
 if(!r.headers.get('content-type')?.startsWith('application/json'))return reply('פורמט בקשה לא תקין.',415);
 try{
  const reader=r.body?.getReader();if(!reader)return reply('בקשה ריקה.',400);
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>16384){await reader.cancel();return reply('הבקשה גדולה מדי.',413)}chunks.push(item.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let v;try{v=JSON.parse(new TextDecoder().decode(bytes))}catch{return reply('בקשה לא תקינה.',400)}
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(key=>!['shirts','version'].includes(key)))return reply('מותר לעדכן מידות וצבעים בלבד.',400);
  const o=await customerOrder(r,(await params).id);if(!o)return reply('הקישור אינו זמין או שפג תוקפו.',404);
  if(o.cancelledAt||o.archivedAt||!['received','designing'].includes(o.status))return reply('ההזמנה כבר בטיפול מתקדם. לתיאום שינוי פנו אלינו ב־WhatsApp.',409);
  if(!Number.isInteger(v.version)||v.version!==o.version)return reply('הפנייה עודכנה. רעננו את המידות ונסו שוב.',409);
  if(!validateShirts(v.shirts,o.quantity))return reply('בחרו סוג, מידה וצבע תקינים לכל חולצה.',400);
  const shirts=v.shirts.map((s:{size:string;color:string;sizeType?:string})=>({size:s.size,color:s.color,sizeType:s.sizeType==='child'?'child' as const:'adult' as const}));
  const saved=await saveOrder({...o,shirts,shirtDetailsStatus:'complete'},o.version!,'הלקוח השלים מידות וצבעים.','לקוח');
  // DB is canonical; bundle exports regenerate their summary from DB too.
  try{await bindings().BUCKET.put(`orders/${o.id}/order.txt`,orderSummary(saved),{httpMetadata:{contentType:'text/plain; charset=utf-8'}})}catch{console.error('Customer size summary copy unavailable')}
  return Response.json({version:saved.version,shirts:saved.shirts,shirtDetailsStatus:'complete'},{headers:PRIVATE_HEADERS});
 }catch(e){if(e instanceof Error&&e.message==='conflict')return reply('הפנייה עודכנה. רעננו ונסו שוב.',409);return reply('לא הצלחנו לשמור את המידות. הפנייה המקורית נשמרה.',503)}
}
