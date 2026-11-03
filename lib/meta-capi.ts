import {clientKey,env,publicOrigin} from '#partyprint-runtime';
import {bindings} from '@/lib/order-store';
import {contactGrant,validContactKey,type ContactDetails,type ContactRow} from './contact-leads';
import {packs} from './catalog';
import {packageType} from './analytics';
import {
 buildMetaEvent,claimMetaEventId,postMetaEvent,type MetaCapiEventName,type MetaCapiStatus,
} from './meta-capi-payload';

const clean=(value:string|undefined)=>String(value||'').trim().replace(/^[\"']|[\"']$/g,'');
function cookieValue(header:string|undefined,name:string){
 if(!header)return undefined;
 const prefix=name+'=';
 for(const part of header.split(';')){const item=part.trim();if(item.startsWith(prefix))return item.slice(prefix.length)||undefined;}
 return undefined;
}
function trustedClientIp(request:Request){
 const value=clientKey(request);
 return value==='anonymous'?undefined:value;
}
function configured(){
 return /^\d{8,20}$/.test(clean(env.META_PIXEL_ID))&&clean(env.META_CAPI_TOKEN).length>0;
}
function sourceUrl(value:unknown,origin:string){
 if(typeof value!=='string'||value.length>2000)return null;
 try{
  const url=new URL(value,origin);
  if(url.origin!==origin||url.protocol!=='https:')return null;
  return url.origin+url.pathname;
 }catch{return null;}
}
export type MetaEventRequest={
 event_name:MetaCapiEventName;
 event_id:string;
 event_source_url:string;
 metaConsent:'granted'|'denied'|null;
 client_data?:Record<string,unknown>;
 contact?:{id:string;token:string};
};
export async function attemptMetaEvent(request:Request,input:MetaEventRequest):Promise<MetaCapiStatus>{
 if(input.metaConsent!=='granted'||!configured())return 'skipped';
 const origin=new URL(publicOrigin()).origin;
 if(!['https://partyprint.co.il','https://www.partyprint.co.il'].includes(origin))return 'skipped';
 const url=sourceUrl(input.event_source_url,origin);
 if(!url)return 'skipped';
 let lead:MetaCapiEventInput['lead'];
 if(input.event_name==='Lead'){
  if(!input.contact||!validContactKey(input.contact.id,input.contact.token))return 'skipped';
  let row:ContactRow|null;
  try{row=await contactGrant(input.contact.id,input.contact.token);}catch{return 'failed';}
  if(!row)return 'skipped';
  let details:ContactDetails;
  try{details=JSON.parse(row.data) as ContactDetails;}catch{return 'failed';}
  const pack=packs[details.package],type=packageType(details.package);
  if(!pack||!type)return 'failed';
  lead={email:details.email,phone:details.phone,value:details.pricePreview,packageName:pack.name,eventType:type,quantity:details.quantity};
 }
 const now=Date.now();
 const event=await buildMetaEvent({
  eventName:input.event_name,
  eventId:input.event_id,
  eventTime:Math.floor(now/1000),
  eventSourceUrl:url,
  clientIpAddress:trustedClientIp(request),
  clientUserAgent:request.headers.get('user-agent')||undefined,
  fbp:cookieValue(request.headers.get('cookie')||undefined,'_fbp'),
  fbc:cookieValue(request.headers.get('cookie')||undefined,'_fbc'),
  clientData:input.client_data,
  lead,
 });
 const {DB}=bindings();
 if(!await claimMetaEventId(DB,input.event_name,input.event_id,now))return 'skipped';
 return postMetaEvent({
  consent:input.metaConsent,
  token:clean(env.META_CAPI_TOKEN),
  pixelId:clean(env.META_PIXEL_ID),
  event,
  testEventCode:clean(env.META_TEST_EVENT_CODE)||undefined,
 });
}
type MetaCapiEventInput={lead?:{email:string;phone:string;value:number;packageName:string;eventType:string;quantity:number}};
