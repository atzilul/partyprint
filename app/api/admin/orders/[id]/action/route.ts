import {productionReady} from '@/lib/production';
import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getOrder,saveOrder} from '@/lib/order-store';
import {STAGES,stageLabel} from '@/lib/orders';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 try{
  const raw=await request.text();if(raw.length>1000)return new Response(null,{status:413,headers:PRIVATE_HEADERS});
  let v;try{v=JSON.parse(raw)}catch{return Response.json({error:'בקשה לא תקינה'},{status:400,headers:PRIVATE_HEADERS})}
  const o=await getOrder((await params).id);if(!o)return Response.json({error:'ההזמנה לא נמצאה'},{status:404,headers:PRIVATE_HEADERS});
  if(v?.version!==o.version)throw Error('conflict');
  if(v.action==='next'){
   const index=STAGES.findIndex(s=>s[0]===o.status),next=STAGES[index+1];
   if(!next)return Response.json({error:'ההזמנה כבר בשלב האחרון'},{status:400,headers:PRIVATE_HEADERS});
   if(['printing','printed','shipped'].includes(next[0])&&!productionReady(o))return Response.json({error:'נדרש אישור לקוח לגרסת העיצוב הנוכחית לפני המשך הייצור.'},{status:400,headers:PRIVATE_HEADERS});
   return Response.json(await saveOrder({...o,status:next[0]},o.version!,`שלב: ${stageLabel(o.status)} ← ${next[1]}`,'מנהל'),{headers:PRIVATE_HEADERS});
  }
  if(v.action==='followup')return Response.json(await saveOrder({...o,followUpAt:new Date().toISOString()},o.version!,'סומן מעקב שבוצע על ידי המנהל. אין אישור שליחת הודעה.','מנהל'),{headers:PRIVATE_HEADERS});
  return Response.json({error:'פעולה לא נתמכת'},{status:400,headers:PRIVATE_HEADERS});
 }catch(e){return adminError(e)}
}
