export type MetaCapiStatus='sent'|'failed'|'skipped';
export type MetaLeadInput={
 eventId:string;
 email:string;
 phone:string;
 name:string;
 eventTime:number;
 eventSourceUrl:string;
 value:number;
 currency:'ILS';
 packageName:string;
 eventType:string;
 quantity:number;
 clientIpAddress?:string;
 clientUserAgent?:string;
 fbp?:string;
 fbc?:string;
};
export type MetaLeadEvent={
 event_name:'Lead';
 event_time:number;
 event_id:string;
 action_source:'website';
 event_source_url:string;
 user_data:Record<string,unknown>;
 custom_data:{value:number;currency:'ILS';content_name:string;content_category:string;num_items:number};
};
const EVENT_UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const COOKIE_VALUE=/^[A-Za-z0-9._-]{1,256}$/;
export function normalizeMetaEmail(value:string){return value.normalize('NFKC').trim().toLowerCase();}
export function normalizeMetaPhone(value:string){
 let digits=value.replace(/\D/g,'');
 if(digits.startsWith('00'))digits=digits.slice(2);
 if(digits.startsWith('0'))digits='972'+digits.slice(1);
 return digits;
}
export function normalizeMetaNamePart(value:string){
 return value.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]/gu,'');
}
export async function sha256Hex(value:string){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
function safeCookie(value:string|undefined){return value&&COOKIE_VALUE.test(value)?value:undefined;}
function safeUserAgent(value:string|undefined){return value?.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,500)||undefined;}
function safeIp(value:string|undefined){return value&&value.length<=45&&!/[\s,]/.test(value)?value:undefined;}
export async function buildMetaLeadEvent(input:MetaLeadInput):Promise<MetaLeadEvent>{
 if(!EVENT_UUID.test(input.eventId))throw new Error('invalid_event_id');
 if(!Number.isInteger(input.eventTime)||input.eventTime<1)throw new Error('invalid_event_time');
 if(!Number.isFinite(input.value)||input.value<0||!Number.isInteger(input.quantity)||input.quantity<1)throw new Error('invalid_event_value');
 let source:URL;
 try{source=new URL(input.eventSourceUrl);}catch{throw new Error('invalid_event_source_url');}
 if(source.protocol!=='https:')throw new Error('invalid_event_source_url');
 source.search='';source.hash='';
 const normalizedEmail=normalizeMetaEmail(input.email);
 const normalizedPhone=normalizeMetaPhone(input.phone);
 const nameParts=input.name.normalize('NFKC').trim().split(/\s+/).filter(Boolean);
 const first=normalizeMetaNamePart(nameParts[0]||'');
 const last=normalizeMetaNamePart(nameParts.slice(1).join(' '));
 if(!normalizedEmail||!normalizedPhone||!first)throw new Error('missing_match_data');
 const userData:Record<string,unknown>={
  em:[await sha256Hex(normalizedEmail)],
  ph:[await sha256Hex(normalizedPhone)],
  fn:[await sha256Hex(first)],
 };
 if(last)userData.ln=[await sha256Hex(last)];
 const clientIp=safeIp(input.clientIpAddress),userAgent=safeUserAgent(input.clientUserAgent);
 const fbp=safeCookie(input.fbp),fbc=safeCookie(input.fbc);
 if(clientIp)userData.client_ip_address=clientIp;
 if(userAgent)userData.client_user_agent=userAgent;
 if(fbp)userData.fbp=fbp;
 if(fbc)userData.fbc=fbc;
 return {
  event_name:'Lead',
  event_time:input.eventTime,
  event_id:input.eventId,
  action_source:'website',
  event_source_url:source.origin+source.pathname,
  user_data:userData,
  custom_data:{
   value:Math.round(input.value*100)/100,
   currency:'ILS',
   content_name:input.packageName.slice(0,100),
   content_category:input.eventType.slice(0,100),
   num_items:input.quantity,
  },
 };
}
export async function postMetaLeadEvent(args:{
 consent:'granted'|'denied'|null;
 token:string;
 pixelId:string;
 event:MetaLeadEvent;
 testEventCode?:string;
 fetcher?:typeof fetch;
}):Promise<MetaCapiStatus>{
 if(args.consent!=='granted')return 'skipped';
 if(!args.token.trim()||!/^\d{8,20}$/.test(args.pixelId))return 'skipped';
 const body={data:[args.event],...(args.testEventCode?.trim()?{test_event_code:args.testEventCode.trim().slice(0,100)}:{})};
 try{
  const response=await (args.fetcher||fetch)('https://graph.facebook.com/v21.0/'+args.pixelId+'/events',{
   method:'POST',
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+args.token.trim()},
   body:JSON.stringify(body),
   cache:'no-store',
   signal:AbortSignal.timeout(3000),
  });
  if(!response.ok){try{await response.body?.cancel();}catch{}return 'failed';}
  const result=await response.json() as {events_received?:unknown};
  return typeof result.events_received==='number'&&result.events_received>0?'sent':'failed';
 }catch{return 'failed';}
}
