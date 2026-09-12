import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {bindings} from '@/lib/order-store';
import {normalizeOrder,stageLabel} from '@/lib/orders';
import {orderQuery,csvCell,israelDay} from '@/lib/admin-query';
export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 try{
  const {where,args,sort}=orderQuery(new URL(request.url).searchParams);
  const rows=await bindings().DB.prepare(`SELECT data FROM orders WHERE ${where} ORDER BY ${sort} LIMIT 5001`).bind(...args).all<{data:string}>();
  if(rows.results.length>5000)return Response.json({error:'יותר מ־5,000 הזמנות. צמצמו את הסינון לפני הייצוא.'},{status:422,headers:PRIVATE_HEADERS});
  const records=[['מספר הזמנה','לקוח','טלפון','מייל','שלב','סוג פנייה','חבילה','כמות','סכום הזמנה בשקלים','מועד יעד','כתובת','מעקב','קופון','הנחה מקורית','נוצרה','עודכנה'],...rows.results.map(r=>{const o=normalizeOrder(JSON.parse(r.data));return [o.id,o.name,o.phone,o.email,stageLabel(o.status),o.mode==='lead'?'התייעצות':'הזמנה',o.packageName,o.quantity,o.price,o.dueDate,o.address,o.tracking,o.couponCode,o.discount||0,o.createdAt,o.updatedAt]})];
  return new Response('\uFEFF'+records.map(row=>row.map(csvCell).join(',')).join('\r\n'),{headers:{...PRIVATE_HEADERS,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="partyprint-orders-${israelDay()}.csv"`}});
 }catch(e){return adminError(e)}
}
