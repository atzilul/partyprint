export const META_GRAPH_API_VERSION = 'v26.0';

export type MetaCapiEventName = 'PageView' | 'FormStart' | 'FormStep' | 'Lead';
export type MetaCapiStatus = 'sent' | 'failed' | 'skipped';
export type MetaCapiEvent = {
 event_name: MetaCapiEventName;
 event_time: number;
 event_id: string;
 action_source: 'website';
 event_source_url: string;
 user_data: Record<string,unknown>;
 custom_data?: Record<string,string|number>;
};
export type MetaCapiInput = {
 eventName: MetaCapiEventName;
 eventId: string;
 eventTime: number;
 eventSourceUrl: string;
 clientIpAddress?: string;
 clientUserAgent?: string;
 fbp?: string;
 fbc?: string;
 clientData?: Record<string,unknown>;
 lead?: {email:string;phone:string;value:number;packageName:string;eventType:string;quantity:number};
};

const EVENT_UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function validMetaEventId(value:unknown):value is string{return typeof value==='string'&&EVENT_UUID.test(value);}
const COOKIE_VALUE=/^[A-Za-z0-9._-]{1,256}$/;
const PACKAGE_TYPES=new Set(['family_birthday','bride_squad','groom_crew','team','custom','single']);
const REQUEST_MODES=new Set(['order','custom','lead']);
const STEP_NAMES=new Set(['package','details','idea','shirts_optional']);

export function normalizeMetaEmail(value:string){return value.normalize('NFKC').trim().toLowerCase();}
export function normalizeMetaPhone(value:string){
 let digits=value.replace(/\D/g,'');
 if(digits.startsWith('00'))digits=digits.slice(2);
 if(digits.startsWith('0'))digits='972'+digits.slice(1);
 return digits;
}
export async function sha256Hex(value:string){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
function safeCookie(value:string|undefined){return value&&COOKIE_VALUE.test(value)?value:undefined;}
const CLICK_ID=/^[A-Za-z0-9._-]{1,200}$/;
/** Builds Meta's fbc value from a landing-page fbclid when the _fbc cookie is not present yet. */
export function fbcFromClickId(fbclid:string|null|undefined,now=Date.now()){
 return fbclid&&CLICK_ID.test(fbclid)?'fb.1.'+now+'.'+fbclid:undefined;
}
function safeUserAgent(value:string|undefined){return value?.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,500)||undefined;}
function safeIp(value:string|undefined){return value&&value.length<=45&&/^[0-9a-f:.]+$/i.test(value)?value:undefined;}
export function normalizeMetaClientData(eventName:MetaCapiEventName,value:unknown):Record<string,string|number>{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const raw=value as Record<string,unknown>,out:Record<string,string|number>={};
 if(eventName==='FormStart'){
  if(typeof raw.content_category==='string'&&PACKAGE_TYPES.has(raw.content_category))out.content_category=raw.content_category;
 }else if(eventName==='FormStep'){
  if(Number.isInteger(raw.step_number)&&Number(raw.step_number)>=1&&Number(raw.step_number)<=3)out.step_number=Number(raw.step_number);
  if(typeof raw.step_name==='string'&&STEP_NAMES.has(raw.step_name))out.step_name=raw.step_name;
  if(typeof raw.request_mode==='string'&&REQUEST_MODES.has(raw.request_mode))out.request_mode=raw.request_mode;
 }else if(eventName==='Lead'){
  if(typeof raw.content_category==='string'&&PACKAGE_TYPES.has(raw.content_category))out.content_category=raw.content_category;
  if(typeof raw.content_name==='string'&&REQUEST_MODES.has(raw.content_name))out.content_name=raw.content_name;
 }
 return out;
}
export async function buildMetaEvent(input:MetaCapiInput):Promise<MetaCapiEvent>{
 if(!validMetaEventId(input.eventId))throw new Error('invalid_event_id');
 if(!Number.isInteger(input.eventTime)||input.eventTime<1)throw new Error('invalid_event_time');
 let source:URL;
 try{source=new URL(input.eventSourceUrl);}catch{throw new Error('invalid_event_source_url');}
 if(source.protocol!=='https:'||!['partyprint.co.il','www.partyprint.co.il'].includes(source.hostname.toLowerCase()))throw new Error('invalid_event_source_url');
 source.search='';source.hash='';
 const userData:Record<string,unknown>={};
 const ip=safeIp(input.clientIpAddress),ua=safeUserAgent(input.clientUserAgent),fbp=safeCookie(input.fbp),fbc=safeCookie(input.fbc);
 if(ip)userData.client_ip_address=ip;
 if(ua)userData.client_user_agent=ua;
 if(fbp)userData.fbp=fbp;
 if(fbc)userData.fbc=fbc;
 const customData=normalizeMetaClientData(input.eventName,input.clientData);
 if(input.eventName==='Lead'){
  if(!input.lead)throw new Error('missing_lead_data');
  const email=normalizeMetaEmail(input.lead.email),phone=normalizeMetaPhone(input.lead.phone);
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\d{7,15}$/.test(phone))throw new Error('invalid_match_data');
  userData.em=[await sha256Hex(email)];
  userData.ph=[await sha256Hex(phone)];
  if(!Number.isFinite(input.lead.value)||input.lead.value<0||!Number.isInteger(input.lead.quantity)||input.lead.quantity<1)throw new Error('invalid_lead_value');
  Object.assign(customData,{
   value:Math.round(input.lead.value*100)/100,
   currency:'ILS',
   content_name:input.lead.packageName.slice(0,100),
   content_category:input.lead.eventType,
   num_items:input.lead.quantity,
  });
 }
 return {
  event_name:input.eventName,
  event_time:input.eventTime,
  event_id:input.eventId,
  action_source:'website',
  event_source_url:source.origin+source.pathname,
  user_data:userData,
  ...(Object.keys(customData).length?{custom_data:customData}:{}),
 };
}
export interface MetaDedupeDatabase {
 prepare(query:string):{bind(...values:unknown[]):{first<T=unknown>():Promise<T|null>}};
}
export async function claimMetaEventId(db:MetaDedupeDatabase,eventName:MetaCapiEventName,eventId:string,now=Date.now()):Promise<boolean>{
 if(!validMetaEventId(eventId))return false;
 const row=await db.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE expires_at < ? RETURNING count').bind('meta-event:'+eventName+':'+eventId,now+7*86400000,now).first();
 return !!row;
}
export async function postMetaEvent(args:{
 consent:'granted'|'denied'|null;
 token:string;
 pixelId:string;
 event:MetaCapiEvent;
 testEventCode?:string;
 fetcher?:typeof fetch;
 logger?:Pick<Console,'warn'>;
}):Promise<MetaCapiStatus>{
 if(args.consent!=='granted'||!args.token.trim()||!/^\d{8,20}$/.test(args.pixelId))return 'skipped';
 // The token travels in the Authorization header, never in the URL, so it cannot
 // end up in proxy or hosting request logs.
 const url=new URL('https://graph.facebook.com/'+META_GRAPH_API_VERSION+'/'+args.pixelId+'/events');
 const body={data:[args.event],...(args.testEventCode?.trim()?{test_event_code:args.testEventCode.trim().slice(0,100)}:{})};
 try{
  const response=await (args.fetcher||fetch)(url.toString(),{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+args.token.trim()},
   body:JSON.stringify(body),
   cache:'no-store',
   signal:AbortSignal.timeout(3000),
  });
  let parsed:{events_received?:unknown;error?:{message?:unknown}}={};
  try{parsed=await response.json() as typeof parsed;}catch{}
  if(!response.ok||!(typeof parsed.events_received==='number'&&parsed.events_received>0)){
   let message=typeof parsed.error?.message==='string'?parsed.error.message:'Meta Graph API did not accept the event';
   message=message.replaceAll(args.token.trim(),'[redacted]').slice(0,500);
   (args.logger||console).warn(response.status,message);
   return 'failed';
  }
  return 'sent';
 }catch{return 'failed';}
}
