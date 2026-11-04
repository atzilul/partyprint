import {clientKey} from '#partyprint-runtime';
import {bindings} from '@/lib/order-store';
import {tokenHash} from '@/lib/order-access';
import {attemptMetaEvent,type MetaEventRequest} from '@/lib/meta-capi';
import {validMetaEventId} from '@/lib/meta-capi-payload';
import {validContactKey} from '@/lib/contact-leads';

const META_EVENTS=new Set(['PageView','InitiateCheckout','FormStart','FormStep','Lead']);
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415});
 try{
  const text=await request.text();
  if(text.length>4096)return new Response(null,{status:413});
  const v=JSON.parse(text) as Record<string,unknown>;
  if(!v||typeof v!=='object'||Array.isArray(v))return new Response(null,{status:400});
  if(v.event_name!==undefined){
   if(!META_EVENTS.has(String(v.event_name))||!validMetaEventId(v.event_id)||typeof v.event_source_url!=='string')return new Response(null,{status:400});
   if(v.metaConsent!=='granted')return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
   const eventName=v.event_name as MetaEventRequest['event_name'];
   let contact:MetaEventRequest['contact'];
   if(eventName==='Lead'){
    if(!v.contact||typeof v.contact!=='object'||Array.isArray(v.contact))return new Response(null,{status:400});
    const candidate=v.contact as Record<string,unknown>;
    if(!validContactKey(candidate.id,candidate.token))return new Response(null,{status:400});
    contact={id:candidate.id as string,token:candidate.token as string};
   }
   const {DB}=bindings(),now=Date.now(),ip=clientKey(request);
   const key='meta-rate:'+Math.floor(now/3600000)+':'+await tokenHash(ip);
   const limit=await DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<120 RETURNING count').bind(key,now+7200000).first();
   if(!limit)return new Response(null,{status:429});
   await DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
   const input:MetaEventRequest={
    event_name:eventName,
    event_id:v.event_id,
    event_source_url:v.event_source_url,
    metaConsent:'granted',
    client_data:v.client_data&&typeof v.client_data==='object'&&!Array.isArray(v.client_data)?v.client_data as Record<string,unknown>:undefined,
    contact,
   };
   void attemptMetaEvent(request,input).catch(()=>{});
   return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
  }
  if(!['view','form_start'].includes(String(v.kind)))return new Response(null,{status:400});
  const {DB}=bindings(),now=Date.now(),ip=clientKey(request),key='event-counter:'+Math.floor(now/3600000)+':'+await tokenHash(ip);
  const limit=await DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<60 RETURNING count').bind(key,now+7200000).first();
  if(!limit)return new Response(null,{status:429});
  await DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
  const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jerusalem'});
  await DB.prepare('INSERT INTO site_events (key,day,kind,count) VALUES (?,?,?,1) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(day+':'+v.kind,day,v.kind).run();
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }catch{return new Response(null,{status:503})}
}
