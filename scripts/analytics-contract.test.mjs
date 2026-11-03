import test from 'node:test';
import assert from 'node:assert/strict';
import {consentModeFromConfig,hasPendingAnalyticsCapacity,isExcludedPath,metaEvents,MAX_PENDING_ANALYTICS_EVENTS} from '../lib/analytics.ts';

test('staff, customer and authentication paths are never measurement targets',()=>{
 for(const path of ['/admin','/admin/orders','/api/analytics-config','/track/example','/design/example','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth','/chatgpt-auth/callback'])assert.equal(isExcludedPath(path),true,path);
 for(const path of ['/','/ordering-guide','/guides/example','/blog/example','/administrator'])assert.equal(isExcludedPath(path),false,path);
});

test('consent mode is strict unless a server explicitly selects notice',()=>{
 assert.equal(consentModeFromConfig(undefined),'strict');
 assert.equal(consentModeFromConfig('strict'),'strict');
 assert.equal(consentModeFromConfig('typo'),'strict');
 assert.equal(consentModeFromConfig('notice'),'notice');
});

test('the undecided analytics queue has a hard 50-event capacity',()=>{
 assert.equal(MAX_PENDING_ANALYTICS_EVENTS,50);
 assert.equal(hasPendingAnalyticsCapacity(0),true);
 assert.equal(hasPendingAnalyticsCapacity(49),true);
 assert.equal(hasPendingAnalyticsCapacity(50),false);
 assert.equal(hasPendingAnalyticsCapacity(-1),false);
 assert.equal(hasPendingAnalyticsCapacity(50.5),false);
});

test('order request maps to standard Meta events with values and stable package content IDs',()=>{
 const begin=metaEvents('begin_order_request',{request_mode:'order',package_type:'family_birthday',value:450,currency:'ILS',num_items:4,content_name:'family_birthday'});
 assert.deepEqual(begin.map(item=>[item.method,item.event]),[['track','InitiateCheckout'],['trackCustom','FormStart']]);
 assert.deepEqual(begin[0].data,{value:450,currency:'ILS',num_items:4,content_name:'family_birthday',content_ids:['family_birthday']});
 const lead=metaEvents('generate_lead',{request_mode:'order',package_type:'family_birthday',value:450,currency:'ILS',num_items:4});
 assert.equal(lead.length,1);
 assert.equal(lead[0].method,'track');
 assert.equal(lead[0].event,'Lead');
 assert.deepEqual(lead[0].data,{value:450,currency:'ILS',num_items:4,content_name:'order',content_ids:['family_birthday'],content_category:'family_birthday'});
 const done=metaEvents('complete_order_request',{request_mode:'order',package_type:'family_birthday',value:450,currency:'ILS',num_items:4,content_name:'family_birthday'});
 assert.deepEqual(done.map(item=>[item.method,item.event]),[['trackCustom','RequestComplete'],['track','SubmitApplication']]);
 assert.deepEqual(done[1].data,{value:450,currency:'ILS',num_items:4,content_name:'family_birthday',content_ids:['family_birthday']});
});

test('details stage is labeled for custom Meta conversion building',()=>{
 const [item]=metaEvents('form_step',{step_number:2,step_name:'details',request_mode:'order'});
 assert.equal(item.event,'FormStep');
 assert.equal(item.data.content_name,'details');
});
