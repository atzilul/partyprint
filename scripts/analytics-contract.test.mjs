import test from 'node:test';
import assert from 'node:assert/strict';
import {isExcludedPath,metaModeFor,metaEventsFor} from '../lib/analytics.ts';
test('staff, customer and authentication paths are never measurement targets',()=>{
 for(const path of ['/admin','/admin/orders','/api/analytics-config','/track/example','/design/example','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth','/chatgpt-auth/callback'])assert.equal(isExcludedPath(path),true,path);
 for(const path of ['/','/ordering-guide','/guides/example','/blog/example','/administrator'])assert.equal(isExcludedPath(path),false,path);
});
test('trusted country takes priority over timezone for the existing Meta rule',()=>{
 assert.equal(metaModeFor('IL','Europe/Berlin'),'notice');
 assert.equal(metaModeFor('DE','Asia/Jerusalem'),'strict');
 assert.equal(metaModeFor('','Asia/Jerusalem'),'notice');
 assert.equal(metaModeFor('','Europe/Berlin'),'strict');
 assert.equal(metaModeFor('',''),'strict');
});
test('funnel stages send a standard Meta event with value next to the custom name',()=>{
 const start=metaEventsFor('begin_order_request',{request_mode:'order',package_type:'family_birthday',value:396,currency:'ILS',num_items:4,name:'private'});
 assert.deepEqual(start,[
  ['track','InitiateCheckout',{content_category:'family_birthday',value:396,currency:'ILS',num_items:4}],
  ['trackCustom','FormStart',{content_category:'family_birthday',value:396,currency:'ILS',num_items:4}],
 ]);
 assert.deepEqual(metaEventsFor('select_package',{package_type:'team',request_mode:'order',value:950,currency:'ILS',num_items:10}),[
  ['track','ViewContent',{content_category:'team',value:950,currency:'ILS',num_items:10}],
 ]);
 assert.deepEqual(metaEventsFor('generate_lead',{request_mode:'order',package_type:'bride_squad',quantity_band:'6-10',coupon_status:'none',value:630,currency:'ILS',num_items:6,email:'private@example.com'}),[
  ['track','Lead',{content_category:'bride_squad',content_name:'order',value:630,currency:'ILS',num_items:6}],
 ]);
 const complete=metaEventsFor('complete_order_request',{request_mode:'order',package_type:'groom_crew',quantity_band:'6-10',coupon_status:'accepted',value:567,currency:'ILS',num_items:6});
 assert.equal(complete.length,2);
 assert.deepEqual(complete[0],['track','SubmitApplication',{content_category:'groom_crew',value:567,currency:'ILS',num_items:6}]);
 assert.equal(complete[1][1],'RequestComplete');
 assert.deepEqual(metaEventsFor('form_step',{step_number:2,step_name:'details',request_mode:'order'}),[
  ['trackCustom','FormStep',{step_number:2,step_name:'details',request_mode:'order',content_name:'details'}],
 ]);
});
test('value and num_items are range-checked and rounded; nothing else passes',()=>{
 const [[,,noValue]]=metaEventsFor('begin_order_request',{package_type:'team',value:-1,num_items:0,currency:'USD'});
 assert.deepEqual(noValue,{content_category:'team'});
 const [[,,tooLarge]]=metaEventsFor('begin_order_request',{package_type:'team',value:100001,num_items:101});
 assert.deepEqual(tooLarge,{content_category:'team'});
 const [[,,rounded]]=metaEventsFor('begin_order_request',{package_type:'team',value:661.499,num_items:7});
 assert.deepEqual(rounded,{content_category:'team',value:661.5,currency:'ILS',num_items:7});
 const [[,,asString]]=metaEventsFor('begin_order_request',{package_type:'team',value:'440',num_items:'4'});
 assert.deepEqual(asString,{content_category:'team'});
 assert.equal(metaEventsFor('not_an_event',{value:1}),null);
 assert.deepEqual(metaEventsFor('form_submit_attempt',{request_mode:'order',value:440}),[['trackCustom','FormSubmitAttempt',{request_mode:'order'}]]);
});
