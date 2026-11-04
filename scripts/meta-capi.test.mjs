import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildMetaEvent,claimMetaEventId,META_GRAPH_API_VERSION,normalizeMetaClientData,
 normalizeMetaEmail,normalizeMetaPhone,postMetaEvent,validMetaEventId,fbcFromClickId} from '../lib/meta-capi-payload.ts';
import {savedLeadEventId} from '../lib/analytics.ts';

const contactId='79b44e8f-64da-4c5b-92e1-3c59d6e197a8';
const hash=value=>createHash('sha256').update(value).digest('hex');
const common={eventId:contactId,eventTime:1791300000,eventSourceUrl:'https://partyprint.co.il/order?utm_source=meta&fbclid=private#form',clientIpAddress:'203.0.113.7',clientUserAgent:'Mozilla/5.0',fbp:'fb.1.1791300000000.12345',fbc:'fb.1.1791300000000.click-id'};

test('builds safe payloads for all server event names',async()=>{
 const cases=[
  ['PageView',{},undefined],
  ['FormStart',{content_category:'family_birthday'}, {content_category:'family_birthday'}],
  ['FormStart',{content_category:'family_birthday',value:396,currency:'ILS',num_items:4}, {content_category:'family_birthday',value:396,currency:'ILS',num_items:4}],
  ['InitiateCheckout',{content_category:'team',value:950.004,currency:'USD',num_items:10,email:'private@example.com'}, {content_category:'team',value:950,currency:'ILS',num_items:10}],
  ['InitiateCheckout',{content_category:'team',value:-5,num_items:101}, {content_category:'team'}],
  ['FormStep',{step_number:2,step_name:'details',request_mode:'order',email:'private@example.com'}, {step_number:2,step_name:'details',content_name:'details',request_mode:'order'}],
 ];
 for(const [eventName,clientData,custom] of cases){
  const event=await buildMetaEvent({...common,eventName,clientData});
  assert.equal(event.event_name,eventName);
  assert.equal(event.event_id,contactId);
  assert.equal(event.event_time,common.eventTime);
  assert.equal(event.action_source,'website');
  assert.equal(event.event_source_url,'https://partyprint.co.il/order');
  assert.equal(event.user_data.client_ip_address,common.clientIpAddress);
  assert.equal(event.user_data.client_user_agent,common.clientUserAgent);
  assert.equal(event.user_data.fbp,common.fbp);
  assert.equal(event.user_data.fbc,common.fbc);
  if(custom)assert.deepEqual(event.custom_data,custom);else assert.equal(event.custom_data,undefined);
  assert.equal(JSON.stringify(event).includes('private@example.com'),false);
 }
 assert.deepEqual(normalizeMetaClientData('FormStep',{step_number:99,step_name:'bad',request_mode:'order',phone:'0501234567'}),{request_mode:'order'});
});

test('normalizes and hashes only email and Israeli phone for Lead',async()=>{
 const lead={email:'  Maya.Test@Example.com ',phone:'054-123-4567',value:418.5,packageName:'יומולדת משפחתי',eventType:'family_birthday',quantity:4};
 const event=await buildMetaEvent({...common,eventName:'Lead',clientData:{content_name:'order',content_category:'family_birthday'},lead});
 assert.equal(normalizeMetaEmail(lead.email),'maya.test@example.com');
 assert.equal(normalizeMetaPhone(lead.phone),'972541234567');
 assert.equal(normalizeMetaPhone('+972 54-123-4567'),'972541234567');
 assert.deepEqual(event.user_data.em,[hash('maya.test@example.com')]);
 assert.deepEqual(event.user_data.ph,[hash('972541234567')]);
 assert.deepEqual(event.custom_data,{content_category:'family_birthday',content_name:'יומולדת משפחתי',value:418.5,currency:'ILS',num_items:4});
 const json=JSON.stringify(event);
 for(const raw of [lead.email.trim(),lead.phone])assert.equal(json.includes(raw),false);
 assert.equal(json.includes('click-id'),true);
 assert.equal(savedLeadEventId('generate_lead',contactId),contactId);
 assert.equal(savedLeadEventId('complete_order_request',contactId),null);
 assert.equal(validMetaEventId(contactId),true);
 assert.equal(validMetaEventId('not-a-uuid'),false);
});

test('event ID deduplication allows one claim per event name for seven days',async()=>{
 const stored=new Map(),sql='INSERT INTO form_rate_limits';
 const db={
  prepare(query){
   assert.ok(query.includes(sql));
   return {bind(key,expiresAt,now){
    return {async first(){
     const expires=stored.get(key);
     if(expires!==undefined&&expires>=now)return null;
     stored.set(key,expiresAt);
     return {count:1};
    }};
   }};
  }
 };
 const now=1791300000000;
 assert.equal(await claimMetaEventId(db,'Lead',contactId,now),true);
 assert.equal(await claimMetaEventId(db,'Lead',contactId,now+1000),false);
 assert.equal(await claimMetaEventId(db,'PageView',contactId,now+1000),true);
 assert.equal(await claimMetaEventId(db,'Lead',contactId,now+7*86400000+1),true);
 assert.equal(await claimMetaEventId(db,'Lead','bad-id',now),false);
});

test('unapproved and denied consent make no Meta network call',async()=>{
 let calls=0;
 const fetcher=async()=>{calls++;return Response.json({events_received:1});};
 const event=await buildMetaEvent({...common,eventName:'PageView'});
 for(const consent of ['denied',null])assert.equal(await postMetaEvent({consent,token:'server-secret',pixelId:'2241332043403463',event,fetcher}),'skipped');
 assert.equal(calls,0);
});

test('posts to current Graph API with server token, optional test code and redacted errors',async()=>{
 const event=await buildMetaEvent({...common,eventName:'Lead',lead:{email:'maya@example.com',phone:'0501234567',value:400,packageName:'test',eventType:'family_birthday',quantity:4}});
 const token='server-only-test-token';let captured;
 assert.equal(await postMetaEvent({consent:'granted',token,pixelId:'2241332043403463',event,testEventCode:'TEST987',
  fetcher:async(url,init)=>{captured={url:String(url),init};return Response.json({events_received:1});},
 }), 'sent');
 const requestUrl=new URL(captured.url);
 assert.equal(requestUrl.pathname,'/'+META_GRAPH_API_VERSION+'/2241332043403463/events');
 assert.equal(requestUrl.searchParams.get('access_token'),null);
 assert.equal(captured.url.includes(token),false);
 assert.equal(new Headers(captured.init.headers).get('authorization'),'Bearer '+token);
 const body=JSON.parse(captured.init.body);
 assert.equal(body.test_event_code,'TEST987');
 assert.equal(body.data[0].event_id,contactId);
 assert.equal(body.data[0].event_name,'Lead');
 assert.equal(captured.init.body.includes(token),false);

 let logged=[];const failure=await postMetaEvent({consent:'granted',token,pixelId:'2241332043403463',event,
  fetcher:async()=>Response.json({error:{message:'bad request: '+token}},{status:400}),
  logger:{warn:(...args)=>logged.push(args)},
 });
 assert.equal(failure,'failed');
 assert.equal(logged.length,1);
 assert.deepEqual(logged[0].slice(0,1),[400]);
 assert.equal(logged[0].length,2);
 assert.equal(JSON.stringify(logged).includes(token),false);
});
test('fbc falls back to the landing fbclid only when it is a plausible click id',()=>{
 assert.equal(fbcFromClickId('IwAR2abc_DEF-123',1791300000000),'fb.1.1791300000000.IwAR2abc_DEF-123');
 assert.equal(fbcFromClickId('',1791300000000),undefined);
 assert.equal(fbcFromClickId(null,1791300000000),undefined);
 assert.equal(fbcFromClickId('bad value with spaces',1791300000000),undefined);
 assert.equal(fbcFromClickId('x'.repeat(201),1791300000000),undefined);
});
