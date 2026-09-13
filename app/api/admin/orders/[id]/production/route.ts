import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getOrder,saveOrder,bindings} from '@/lib/order-store';
import {tokenHash} from '@/lib/order-access';
import {shirtSignature,paidTotal,PaymentEntry} from '@/lib/production';
import {validateShirts} from '@/lib/catalog';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const copies:string[]=[];let committed=false;
 try{
  const raw=await request.text();if(raw.length>5000)return new Response(null,{status:413,headers:PRIVATE_HEADERS});
  let v;try{v=JSON.parse(raw)}catch{return Response.json({error:'בקשה לא תקינה'},{status:400,headers:PRIVATE_HEADERS})}
  const o=await getOrder((await params).id);if(!o)return new Response(null,{status:404,headers:PRIVATE_HEADERS});if(o.cancelledAt||o.archivedAt)return Response.json({error:'יש לפתוח מחדש את ההזמנה לפני המשך טיפול.'},{status:409,headers:PRIVATE_HEADERS});if(v?.version!==o.version)throw Error('conflict');
  if(v.action==='approval'){
   if(!validateShirts(o.shirts,o.quantity)||o.mode==='lead')return Response.json({error:'יש להשלים מידות וצבעים ולהפוך את הפנייה להזמנה לפני בקשת אישור.'},{status:400,headers:PRIVATE_HEADERS});
   const keys=v.keys;if(!Array.isArray(keys)||!keys.length||keys.length>10||new Set(keys).size!==keys.length||keys.some(k=>!o.images.some(i=>i.key===k&&(i.role==='design'||i.role==='print'))))return Response.json({error:'בחרו בין עיצוב אחד לעשרה עיצובים שסומנו כעיצוב לאישור או להדפסה.'},{status:400,headers:PRIVATE_HEADERS});
   if(o.printSpecs?.some(s=>!keys.includes(s.imageKey)))return Response.json({error:'כל הקבצים שבהוראות ההדפסה צריכים להיכלל בגרסה לאישור.'},{status:400,headers:PRIVATE_HEADERS});const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID(),images=[];
   for(const key of keys){const source=await bindings().BUCKET.get(key);if(!source)throw Error('missing');const copy:string=`orders/${o.id}/approval-${id}/${images.length}`;await bindings().BUCKET.put(copy,await source.arrayBuffer(),{httpMetadata:source.httpMetadata});copies.push(copy);images.push({key:copy,name:o.images.find(i=>i.key===key)!.name})}
   const approval={printSignature:JSON.stringify({specs:o.printSpecs||[],note:o.printNote||''}),id,hash:await tokenHash(token),expiresAt:Date.now()+30*86400000,state:'pending' as const,createdAt:new Date().toISOString(),sourceKeys:keys,images,shirtsSignature:shirtSignature(o),quantity:o.quantity,shirts:o.shirts};
   const saved=await saveOrder({...o,approvalHistory:[...(o.approvalHistory||[]),...(o.approval?[o.approval]:[])],approval,status:'review'},o.version!,'נוצרה גרסת עיצוב לאישור לקוח. יש לשתף את הקישור.','מנהל');committed=true;
   return Response.json({order:saved,url:`https://partyprint-ai.atzilul.chatgpt.site/design/${o.id}#${token}`},{headers:PRIVATE_HEADERS});
  }
  if(v.action==='payment'){
   const amount=v.amount;if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0||amount>100000||Math.abs(amount*100-Math.round(amount*100))>1e-8||!['deposit','balance','refund'].includes(v.kind)||typeof v.method!=='string'||v.method.length>80||typeof v.reference!=='string'||v.reference.length>200)return Response.json({error:'בדקו סוג תנועה, סכום, אמצעי תשלום ואסמכתא.'},{status:400,headers:PRIVATE_HEADERS});
   if((o.payments||[]).length>=500)return Response.json({error:'הגעתם למגבלת התנועות להזמנה.'},{status:400,headers:PRIVATE_HEADERS});
   if(v.kind==='refund'&&Math.round(amount*100)>Math.round(paidTotal(o)*100))return Response.json({error:'ההחזר גבוה מהסכום שהתקבל.'},{status:400,headers:PRIVATE_HEADERS});
   const entry:PaymentEntry={id:crypto.randomUUID(),kind:v.kind,amount,method:v.method.trim(),reference:v.reference.trim(),at:new Date().toISOString()};
   const saved=await saveOrder({...o,payments:[...(o.payments||[]),entry]},o.version!,`תועד ${v.kind==='refund'?'החזר':'תשלום'} בסך ${amount} ₪ (רישום ידני)`,'מנהל');committed=true;return Response.json({order:saved},{headers:PRIVATE_HEADERS});
  }
  return Response.json({error:'פעולה לא נתמכת'},{status:400,headers:PRIVATE_HEADERS});
 }catch(e){return adminError(e)}finally{if(!committed)await Promise.allSettled(copies.map(k=>bindings().BUCKET.delete(k)))}
}
