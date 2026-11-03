import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildMetaLeadEvent,postMetaLeadEvent} from '../lib/meta-capi-payload.ts';
import {savedLeadEventId} from '../lib/analytics.ts';

const contactId='79b44e8f-64da-4c5b-92e1-3c59d6e197a8';
const sample={
 eventId:contactId,
 email:'  Maya.Test@Example.com ',
 phone:'054-123-4567',
 name:'מיקה כהן',
 eventTime:1791300000,
 eventSourceUrl:'https://partyprint.co.il/?utm_source=meta&fbclid=secret#order-form',
 value:418.5,
 currency:'ILS',
 packageName:'יומולדת משפחתי',
 eventType:'family_birthday',
 quantity:4,
 clientIpAddress:'203.0.113.7',
 clientUserAgent:'Mozilla/5.0',
 fbp:'fb.1.1791300000000.12345',
 fbc:'fb.1.1791300000000.click-id',
};
const hash=value=>createHash('sha256').update(value).digest('hex');

test('Lead payload normalizes and hashes contact fields, while retaining approved match signals',async()=>{
 const event=await buildMetaLeadEvent(sample),user=event.user_data;
 assert.equal(event.event_name,'Lead');
 assert.equal(event.event_id,contactId);
 assert.equal(event.event_time,sample.eventTime);
 assert.equal(event.action_source,'website');
 assert.equal(event.event_source_url,'https://partyprint.co.il/');
 assert.deepEqual(user.em,[hash('maya.test@example.com')]);
 assert.deepEqual(user.ph,[hash('972541234567')]);
 assert.deepEqual(user.fn,[hash('מיקה')]);
 assert.deepEqual(user.ln,[hash('כהן')]);
 assert.equal(user.client_ip_address,sample.clientIpAddress);
 assert.equal(user.client_user_agent,sample.clientUserAgent);
 assert.equal(user.fbp,sample.fbp);
 assert.equal(user.fbc,sample.fbc);
 assert.deepEqual(event.custom_data,{value:418.5,currency:'ILS',content_name:'יומולדת משפחתי',content_category:'family_birthday',num_items:4});
 const serialized=JSON.stringify(event);
 for(const raw of [sample.email.trim(),sample.phone,sample.name])assert.equal(serialized.includes(raw),false);
 assert.equal(serialized.includes('utm_source'),false);
 assert.equal(serialized.includes('click-id'),true);
});

test('refusal and undecided consent stop all server requests',async()=>{
 let calls=0;
 const fetcher=async()=>{calls++;return new Response(JSON.stringify({events_received:1}),{status:200});};
 for(const consent of ['denied',null]){
  const event=await buildMetaLeadEvent(sample);
  assert.equal(await postMetaLeadEvent({consent,token:'test-token',pixelId:'2241332043403463',event,fetcher}),'skipped');
 }
 assert.equal(calls,0);
});

test('CAPI posts the matching event id without placing the token in the URL',async()=>{
 const event=await buildMetaLeadEvent(sample);let captured;
 const status=await postMetaLeadEvent({
  consent:'granted',token:'test-token',pixelId:'2241332043403463',event,testEventCode:'TEST987',
  fetcher:async(url,init)=>{captured={url:String(url),init};return new Response(JSON.stringify({events_received:1}),{status:200});},
 });
 assert.equal(status,'sent');
 assert.equal(captured.url,'https://graph.facebook.com/v21.0/2241332043403463/events');
 assert.equal(captured.url.includes('test-token'),false);
 assert.equal(new Headers(captured.init.headers).get('authorization'),'Bearer test-token');
 const body=JSON.parse(captured.init.body);
 assert.equal(body.test_event_code,'TEST987');
 assert.equal(body.data[0].event_id,contactId);
 assert.equal(body.data[0].event_name,'Lead');
});

test('Meta Pixel Lead and CAPI use the same saved-contact UUID',()=>{
 assert.equal(savedLeadEventId('generate_lead',contactId),contactId);
 assert.equal(savedLeadEventId('complete_order_request',contactId),null);
 assert.equal(savedLeadEventId('generate_lead','not-a-uuid'),null);
});
