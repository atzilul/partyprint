import {clientKey,env,publicOrigin} from '#partyprint-runtime';
import {bindings} from '@/lib/order-store';
import {packs} from './catalog';
import {packageType} from './analytics';
import type {ContactRow,ContactDetails} from './contact-leads';
import {buildMetaLeadEvent,postMetaLeadEvent,type MetaCapiStatus} from './meta-capi-payload';

const clean=(value:string|undefined)=>String(value||'').trim().replace(/^[\"']|[\"']$/g,'');
const uuid=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
function cookieValue(header:string|undefined,name:string){
 if(!header)return undefined;
 const prefix=name+'=';
 for(const part of header.split(';')){const item=part.trim();if(item.startsWith(prefix))return item.slice(prefix.length)||undefined;}
 return undefined;
}
function trustedClientIp(request:Request){const value=clientKey(request);return value==='anonymous'?undefined:value;}
function configured(){
 return /^\d{8,20}$/.test(clean(env.META_PIXEL_ID))&&clean(env.META_CAPI_TOKEN).length>0;
}
export async function attemptContactLeadMeta(request:Request,id:string,row:ContactRow,consent:'granted'|'denied'|null):Promise<MetaCapiStatus>{
 if(consent!=='granted'||!uuid(id)||!configured())return 'skipped';
 const site=new URL(publicOrigin());
 if(!['partyprint.co.il','www.partyprint.co.il'].includes(site.hostname.toLowerCase()))return 'skipped';
 const {DB}=bindings(),now=Date.now(),limitKey='meta-lead:'+id;
 const count=await DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<2 RETURNING count').bind(limitKey,now+48*60*60*1000).first();
 if(!count)return 'skipped';
 let details:ContactDetails;
 try{details=JSON.parse(row.data) as ContactDetails;}catch{return 'failed';}
 const pack=packs[details.package],eventType=packageType(details.package);
 if(!pack||!eventType)return 'failed';
 const created=Date.parse(row.created_at),eventTime=Math.floor((Number.isFinite(created)?created:now)/1000);
 try{
  const event=await buildMetaLeadEvent({
   eventId:id,
   email:details.email,
   phone:details.phone,
   name:details.name,
   eventTime,
   eventSourceUrl:new URL('/',site).toString(),
   value:details.pricePreview,
   currency:'ILS',
   packageName:pack.name,
   eventType,
   quantity:details.quantity,
   clientIpAddress:trustedClientIp(request),
   clientUserAgent:request.headers.get('user-agent')||undefined,
   fbp:cookieValue(request.headers.get('cookie')||undefined,'_fbp'),
   fbc:cookieValue(request.headers.get('cookie')||undefined,'_fbc'),
  });
  const status=await postMetaLeadEvent({
   consent,
   token:clean(env.META_CAPI_TOKEN),
   pixelId:clean(env.META_PIXEL_ID),
   event,
   testEventCode:clean(env.META_TEST_EVENT_CODE)||undefined,
  });
  if(status==='failed')console.warn('Meta CAPI Lead request was not accepted');
  return status;
 }catch{
  console.warn('Meta CAPI Lead preparation failed');
  return 'failed';
 }
}
