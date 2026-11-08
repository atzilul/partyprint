import ts from 'typescript';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
function assertBrandedContactEmail(message){const html=message?.body?.html;assert.equal(typeof html,'string');assert.match(html,/^<!doctype html>/i);assert.match(html,/<html lang="he" dir="rtl" data-partyprint-email="v1">/);assert.match(html,/partyprint-logo-email\.png/);assert.match(html,/bgcolor="#EFFF5C"/);}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const output=fs.mkdtempSync(path.join(tmpdir(),'partyprint-tests-'));const cache=new Map();const dataUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
function resolve(file){if(cache.has(file))return cache.get(file);let code=file.endsWith('.json')?'export default '+fs.readFileSync(file,'utf8'):ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from ["']([^"']+)["']/g,(m,s)=>{if(s==='#partyprint-runtime')return 'from '+JSON.stringify(dataUrl("export const runtimeKind='cloudflare';export async function hashStaffPassword(){throw Error('not_available')}export const env=globalThis.testEnv;export function clientKey(r){return r.headers.get(globalThis.testIpHeader||'CF-Connecting-IP')||'anonymous'}export function publicOrigin(){return globalThis.testPublicOrigin||'https://partyprint-ai.atzilul.chatgpt.site'}"));if(s===["cloudflare:","workers"].join(""))return 'from '+JSON.stringify(dataUrl('export const env=globalThis.testEnv;'));if(s==='@/app/chatgpt-auth')return 'from '+JSON.stringify(dataUrl('export async function getChatGPTUser(){return globalThis.testUser}'));const p=s.startsWith('@/')?path.join(root,s.slice(2)):path.resolve(path.dirname(file),s);return 'from '+JSON.stringify(resolve(path.extname(p)?p:p+'.ts'))});const u=dataUrl(code);cache.set(file,u);return u}
const sql=new DatabaseSync(':memory:');for(const file of fs.readdirSync(root+'/drizzle').filter(x=>x.endsWith('.sql')))sql.exec(fs.readFileSync(root+'/drizzle/'+file,'utf8'));
const db={prepare(query){let vals=[];return{bind(...args){vals=args;return this},async first(){return sql.prepare(query).get(...vals)||null},async all(){return{results:sql.prepare(query).all(...vals)}},async run(){return sql.prepare(query).run(...vals)}}}};
const objects=new Map();const enc=new TextEncoder();const bucket={async put(k,v,opts){objects.set(k,{bytes:typeof v==='string'?enc.encode(v):new Uint8Array(v),opts})},async get(k){const o=objects.get(k);return o?{async json(){return JSON.parse(new TextDecoder().decode(o.bytes))},async text(){return new TextDecoder().decode(o.bytes)},async arrayBuffer(){return o.bytes.slice().buffer},httpMetadata:o.opts?.httpMetadata,body:o.bytes}:null},async delete(k){objects.delete(k)},async head(k){return objects.has(k)?{size:objects.get(k).bytes.length}:null},async list(){return{objects:[...objects.keys()].map(key=>({key})),truncated:false}}};
globalThis.testEnv={DB:db,BUCKET:bucket};globalThis.testUser=null;
const load=f=>import(resolve(root+'/'+f));const publicRoute=await load('app/api/orders/route.ts'),contactRoute=await load('app/api/contacts/route.ts'),eventRoute=await load('app/api/events/route.ts'),admin=await load('app/api/admin/orders/route.ts'),detail=await load('app/api/admin/orders/[id]/route.ts'),img=await load('app/api/admin/orders/[id]/image/route.ts'),bundle=await load('app/api/order-bundle/[id]/route.ts'),adminZip=await load('app/api/admin/orders/[id]/bundle/route.ts'),mail=await load('lib/order-mail.ts'),store=await load('lib/order-store.ts'),access=await load('lib/order-access.ts');
const base='https://example.test';const get=(p)=>new Request(base+p);const post=(p,body,origin=base)=>new Request(base+p,{method:'POST',headers:{origin},body});
assert.equal((await admin.GET(get('/api/admin/orders'))).status,403);
globalThis.testUser={userId:'other',email:'other@example.com'};assert.equal((await admin.GET(get('/api/admin/orders'))).status,403);
function form(email='test@example.com'){const f=new FormData();Object.entries({name:'Test <script>',phone:'0501234567',email,brief:'<img src=x onerror=alert(1)>',package:0,quantity:4,mode:'order',shirts:JSON.stringify(Array.from({length:4},()=>({size:'M',color:'black'})))}).forEach(([k,v])=>f.set(k,String(v)));for(let i=0;i<10;i++)f.append('images',new File([new Uint8Array([255,216,255,i])],`תמונה-${i}.jpg`,{type:'image/jpeg'}));return f}
assert.equal((await publicRoute.POST(post('/api/orders',form('bad-email')))).status,400);
const contact=await load('lib/contact-validation.ts');
for(const value of ['050 123 4567','03-1234567','+972501234567','00972501234567'])assert(contact.validPhone(value),value);
for(const value of ['---------','0000000000','05012','+000123456789','050abc1234567'])assert(!contact.validPhone(value),value);
assert(contact.validCalendarDate('2028-02-29'));assert(!contact.validCalendarDate('2030-02-30'));
assert(contact.validDateTime('2028-02-29T23:59'));for(const invalid of ['2030-02-30T12:00','2030-01-01T24:00','2030-01-01T12:60','2030-01-01'])assert(!contact.validDateTime(invalid));
for(const [field,value] of [['phone','---------'],['eventDate','2030-02-30']]){const bad=form();bad.set(field,value);assert.equal((await publicRoute.POST(post('/api/orders',bad))).status,400)}

const response=await publicRoute.POST(post('/api/orders',form()));assert.equal(response.status,201);const result=await response.json();assert.equal(result.emailSent,false);const id=result.id,ctx={params:Promise.resolve({id})};assert(await store.getOrder(id));
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};const listing=await (await admin.GET(get('/api/admin/orders'))).json();assert.equal(listing.total,1);assert.equal(listing.orders[0].status,'received');assert.equal(listing.mailReady,false);assert.equal(listing.pendingMail,1);assert.equal((await detail.POST(post('/api/admin/orders/'+id,new FormData(),'https://attacker.test'),ctx)).status,403);
let order=await store.getOrder(id);const defaults={notes:'internal only',address:'Test address',dueDate:'',tracking:'',priceNote:'',revisions:0};const update=(o,extras={})=>{const f=new FormData();f.set('order',JSON.stringify({...o,...defaults,keep:o.images.map(i=>i.key),...extras}));return f};
assert.equal((await detail.POST(post('/api/admin/orders/'+id,update(order,{shirts:[{size:'M',color:''}]})),ctx)).status,400);
assert.equal((await detail.POST(post('/api/admin/orders/'+id,update(order,{price:400})),ctx)).status,400);
const oldKey=order.images[0].key;const changes=update(order,{status:'designing',keep:order.images.slice(1).map(i=>i.key)});changes.append('images',new File([new Uint8Array([255,216,255,88])],'design.jpg',{type:'image/jpeg'}));changes.append('roles','design');const edited=await detail.POST(post('/api/admin/orders/'+id,changes),ctx);assert.equal(edited.status,200);const saved=await edited.json();assert.equal(saved.status,'designing');assert.equal(saved.images.length,10);assert.equal(saved.images.at(-1).role,'design');assert(!objects.has(oldKey));assert(saved.history.length>=2);
assert.equal((await detail.POST(post('/api/admin/orders/'+id,update(order)),ctx)).status,409);
assert.equal((await img.GET(get('/api/admin/orders/'+id+'/image?key='+encodeURIComponent(oldKey)),ctx)).status,404);
const link=await access.createOrderAccess(bucket,id);let zip=await bundle.GET(new Request(link),ctx);assert.equal(zip.status,200);fs.writeFileSync(path.join(output,'admin-orders.zip'),Buffer.from(await zip.arrayBuffer()));
const second=await access.createOrderAccess(bucket,id);assert.notEqual(link,second);assert.equal((await bundle.GET(new Request(link),ctx)).status,200);assert.equal((await bundle.GET(new Request(link.replace(/token=.*/,'token=bad')),ctx)).status,404);
globalThis.testUser=null;assert.equal((await detail.GET(get('/api/admin/orders/'+id),ctx)).status,403);assert.equal((await img.GET(get('/api/admin/orders/'+id+'/image?key='+saved.images[0].key),ctx)).status,403);assert.equal((await adminZip.GET(get('/api/admin/orders/'+id+'/bundle'),ctx)).status,403);
let sent;const originalFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return Response.json({id:'mock'})};assert(await mail.notifyOrder({RESEND_API_KEY:'test',MAIL_FROM:'test@example.com'},saved,link));globalThis.fetch=originalFetch;assert.deepEqual(sent.to,['atzilul@gmail.com']);assert(sent.html.includes('https://wa.me/972501234567'));assert(sent.html.includes(link.replace(/&/g,'&amp;')));assert(!sent.html.includes('<script>'));assert(!sent.html.includes('internal only'));assert(!sent.attachments);assert(sent.reply_to==='test@example.com');
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};const sync=await admin.POST(post('/api/admin/orders',new FormData()));assert.equal(sync.status,200);assert.equal((await sync.json()).imported,0);assert.equal((await store.getOrder(id)).status,'designing');
console.log('PASS: real SQLite migrations and queries; order persistence without email; owner-only APIs; CSRF rejection; size/color and price validation; optimistic conflict; image add/remove/roles and byte storage; protected ZIP and multiple grants; escaped email, customer WhatsApp and ZIP links; legacy sync cannot overwrite edits. No real mail sent.');
db.batch=async statements=>{sql.exec('BEGIN');try{const results=[];for(const s of statements){const r=await s.run();results.push({meta:{changes:r.changes}})}sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}};
const settings=await load('app/api/admin/settings/route.ts'),prices=await load('app/api/pricing/route.ts'),analytics=await load('app/api/admin/analytics/route.ts'),business=await load('lib/pricing.ts'),settingsStore=await load('lib/studio-settings.ts');
const jsonRequest=v=>post('/api/admin/settings',JSON.stringify(v));
const config={...business.DEFAULT_PRICING,tiers:[{quantity:4,price:125}],version:0};let reply=await settings.POST(jsonRequest({action:'pricing',pricing:config}));assert.equal(reply.status,200);let configured=await reply.json();assert.equal(configured.pricing.version,1);assert.equal(business.priceFor(configured.pricing,0,5),625);
assert.equal((await settings.POST(jsonRequest({action:'pricing',pricing:config}))).status,409);
assert.equal((await settings.POST(jsonRequest({action:'pricing',pricing:{...configured.pricing,tiers:[{quantity:4,price:-1}]}}))).status,400);
const c={code:'PARTY10',title:'Test',kind:'percent',value:10,minQuantity:4,minSubtotal:400,maxUses:1,starts:'',ends:'',enabled:true,package:0,used:0,version:0};assert.equal((await settings.POST(jsonRequest({action:'coupon',coupon:c}))).status,200);
// Server CAPI contract through the generic event route and SQLite; Graph fetch is intercepted.
globalThis.testPublicOrigin='https://partyprint.co.il';globalThis.testIpHeader='x-real-ip';globalThis.testEnv.META_CAPI_TOKEN='fake-server-only-token';globalThis.testEnv.META_PIXEL_ID='2241332043403463';globalThis.testEnv.META_TEST_EVENT_CODE='TEST987';
const metaCalls=[],realFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(String(url).startsWith('https://graph.facebook.com/')){metaCalls.push({url:String(url),options});return Response.json({events_received:1});}return realFetch(url,options)};
const leadHeaders={origin:base,'content-type':'application/json','x-real-ip':'203.0.113.7','user-agent':'PARTYPRINT-CAPI-QA','cookie':'_fbp=fb.1.1791300000000.12345; _fbc=fb.1.1791300000000.test-click'};
const contactPost=(data)=>new Request(base+'/api/contacts',{method:'POST',headers:leadHeaders,body:JSON.stringify(data)});
const leadId=crypto.randomUUID(),leadToken='a'.repeat(64);const lead=await contactRoute.POST(contactPost({action:'save',id:leadId,token:leadToken,version:0,name:'מיקה כהן',phone:'054-123-4567',email:'capi-qa@example.com',package:0,quantity:4,mode:'order',eventDate:'',source:'test',shirts:[],couponCode:'PARTY10'}));
assert.equal(lead.status,201);assert.equal(metaCalls.length,0);
const eventHeaders={...leadHeaders,origin:base};
const makeEvent=(event_name,event_id,data={})=>new Request(base+'/api/events',{method:'POST',headers:eventHeaders,body:JSON.stringify({event_name,event_id,event_source_url:'https://partyprint.co.il/order?utm_source=qa&email=private#form',metaConsent:'granted',client_data:data,...(event_name==='Lead'?{contact:{id:leadId,token:leadToken}}:{})})});
const ids={PageView:crypto.randomUUID(),FormStart:crypto.randomUUID(),FormStep:crypto.randomUUID(),Lead:leadId};
for(const name of Object.keys(ids)){
 const response=await eventRoute.POST(makeEvent(name,ids[name],name==='FormStart'?{content_category:'family_birthday'}:name==='FormStep'?{step_number:2,step_name:'details',request_mode:'order',phone:'0501234567'}:{content_category:'family_birthday',content_name:'order'}));
 assert.equal(response.status,204);
}
const pause=()=>new Promise(resolve=>setTimeout(resolve,30));
for(let i=0;i<50&&metaCalls.length<4;i++)await pause();
assert.equal(metaCalls.length,4);
const byEvent=new Map(metaCalls.map(call=>{const event=JSON.parse(call.options.body).data[0];return[event.event_name,{call,event}]}));
for(const name of Object.keys(ids)){
 const entry=byEvent.get(name);assert(entry,name);
 assert.equal(entry.event.event_id,ids[name]);
 assert.equal(entry.event.event_source_url,'https://partyprint.co.il/order');
 assert.equal(entry.event.user_data.client_ip_address,'203.0.113.7');
 assert.equal(entry.event.user_data.client_user_agent,'PARTYPRINT-CAPI-QA');
 assert.equal(entry.event.user_data.fbp,'fb.1.1791300000000.12345');
 const url=new URL(entry.call.url);assert.equal(url.pathname,'/v26.0/2241332043403463/events');
 assert.equal(url.searchParams.get('access_token'),null);
 assert.equal(new Headers(entry.call.options.headers).get('authorization'),'Bearer fake-server-only-token');
 assert.equal(entry.call.options.body.includes('fake-server-only-token'),false);
  assert.equal(JSON.stringify(entry.event).includes('capi-qa@example.com'),false);
}
const leadBody=JSON.parse(byEvent.get('Lead').call.options.body),leadEvent=byEvent.get('Lead').event;
assert.equal(leadEvent.custom_data.value,450);assert.equal(leadEvent.custom_data.currency,'ILS');assert.equal(leadEvent.custom_data.content_name,'יומולדת משפחתי');assert.equal(leadEvent.custom_data.content_category,'family_birthday');assert.equal(leadEvent.custom_data.num_items,4);assert.equal(leadBody.test_event_code,'TEST987');
assert.equal(leadEvent.user_data.fbc,'fb.1.1791300000000.test-click');assert(!JSON.stringify(leadEvent).includes('054-123-4567'));assert(!JSON.stringify(leadEvent).includes('PARTY10'));
const duplicate=await eventRoute.POST(makeEvent('Lead',leadId,{content_category:'family_birthday',content_name:'order'}));assert.equal(duplicate.status,204);await pause();assert.equal(metaCalls.length,4);
const denied=await eventRoute.POST(new Request(base+'/api/events',{method:'POST',headers:eventHeaders,body:JSON.stringify({event_name:'PageView',event_id:crypto.randomUUID(),event_source_url:'https://partyprint.co.il/',metaConsent:'denied'})}));assert.equal(denied.status,204);await pause();assert.equal(metaCalls.length,4);
globalThis.fetch=realFetch;delete globalThis.testPublicOrigin;delete globalThis.testIpHeader;delete globalThis.testEnv.META_CAPI_TOKEN;delete globalThis.testEnv.META_PIXEL_ID;delete globalThis.testEnv.META_TEST_EVENT_CODE;
console.log('PASS: generic /api/events forwards PageView, FormStart, FormStep and Lead with shared IDs; consent, seven-day dedup, x-real-ip, cookies, hashed Lead data and server-only token are covered. Meta fetch was mocked.');
const preview=await prices.POST(post('/api/pricing',JSON.stringify({code:'PARTY10',package:0,quantity:4,price:1})));assert.equal(preview.status,200);assert.equal((await preview.json()).total,450);
const discountForm=form();discountForm.set('coupon','PARTY10');discountForm.set('expectedPrice','450');const discounted=await publicRoute.POST(post('/api/orders',discountForm));assert.equal(discounted.status,201);const discountedId=(await discounted.json()).id;assert.equal((await store.getOrder(discountedId)).price,450);assert.equal((await settingsStore.getCoupon('PARTY10')).used,1);
const stale={...(await settingsStore.getCoupon('PARTY10')),used:0};await assert.rejects(()=>store.insertOrder({...saved,id:crypto.randomUUID()},stale),/coupon_unavailable/);assert.equal((await settingsStore.getCoupon('PARTY10')).used,1);
assert.equal((await prices.POST(post('/api/pricing',JSON.stringify({code:'PARTY10',package:0,quantity:4})))).status,400);
const forged=form();forged.set('expectedPrice','1');assert.equal((await publicRoute.POST(post('/api/orders',forged))).status,409);
assert.throws(()=>business.couponDiscount({...c,ends:'2020-01-01'},500,4,0));assert.throws(()=>business.couponDiscount(c,500,3,0));
const metrics=await analytics.GET(get('/api/admin/analytics?days=30'));assert.equal(metrics.status,200);const numbers=await metrics.json();assert.equal(numbers.summary.orders,2);assert.equal(numbers.summary.discounts,50);assert.equal(numbers.couponUse[0].code,'PARTY10');
globalThis.testUser=null;assert.equal((await settings.GET()).status,403);assert.equal((await analytics.GET(get('/api/admin/analytics'))).status,403);
console.log('PASS: dynamic pricing, version conflicts, positive price validation, coupon constraints and server-only totals, atomic last-use redemption, expired/max-used coupon rejection, analytics sourced from real order records, private settings/analytics.');
const exportsRoute=await load('app/api/admin/orders/export/route.ts');
assert.equal((await exportsRoute.GET(get('/api/admin/orders/export'))).status,403);
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
const queryLib=await load('lib/admin-query.ts');
assert.equal(queryLib.israelDay(new Date('2026-09-11T22:00:00Z')),'2026-09-12');
assert.equal(queryLib.csvCell('  =HYPERLINK("x")'),'"\'  =HYPERLINK(""x"")"');
const target=await store.getOrder(id);await store.saveOrder({...target,dueDate:'2020-01-01',name:'=BAD()',emailStatus:'failed'},target.version,'test','owner');
let filtered=await (await admin.GET(get('/api/admin/orders?focus=overdue&sort=due'))).json();assert.equal(filtered.total,1);assert.equal(filtered.orders[0].id,id);assert.equal(filtered.attention.overdue,1);
assert.equal((await (await admin.GET(get('/api/admin/orders?from=2021-01-01'))).json()).total,0);
assert.equal((await (await admin.GET(get('/api/admin/orders?q=%25'))).json()).total,0);
const download=await exportsRoute.GET(get('/api/admin/orders/export?focus=overdue'));assert.equal(download.status,200);assert(download.headers.get('cache-control').includes('no-store'));const csv=await download.text();assert(csv.includes("'=BAD()"));assert(csv.includes(id));assert(!csv.includes(discountedId));assert(!csv.includes('internal only'));
console.log('PASS: deadline and mail filters, Israel date rollover, export matches filters, private CSV and formula injection defense.');

assert.equal(business.priceFor(business.pricingForShirt(112.25),0,4),449);
for(const p of [0,1,2,3])assert.equal(business.priceFor(business.pricingForShirt(99.9),p,10),999);
for(const n of [5,10,15,20])assert.equal(business.priceFor(business.pricingForShirt(99.9),4,n),Math.round(99.9*100)*n/100);
assert(!business.validPricing({tiers:[{quantity:4,price:1.001}],version:0}));assert(!business.validPricing({tiers:[{quantity:4,price:1001}],version:0}));assert(!business.validPricing(null));
assert.equal(business.normalizePricing({basePrices:[449,1,2,3]},9).shirtPrice,110);assert.equal(business.unitPriceFor(business.DEFAULT_PRICING,15),93);assert.equal(business.unitPriceFor(business.DEFAULT_PRICING,20),90);
assert.equal(configured.pricing.extraShirtPrice,125);assert.deepEqual(configured.pricing.basePrices,[500,750,750,1250]);
console.log('PASS: quantity tiers across packs and custom quantities, legacy normalization, decimal precision and forged pack-price fields ignored.');
const actions=await load('app/api/admin/orders/[id]/action/route.ts');
globalThis.testUser=null;assert.equal((await actions.POST(post('/api/admin/orders/'+id+'/action',JSON.stringify({action:'next',version:1})),ctx)).status,403);
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
let quick=await store.getOrder(id);const nextRequest=()=>post('/api/admin/orders/'+id+'/action',JSON.stringify({action:'next',version:quick.version}));
assert.equal((await actions.POST(post('/api/admin/orders/'+id+'/action',JSON.stringify({action:'next',version:quick.version}),'https://attacker.test'),ctx)).status,403);
let nextResponse=await actions.POST(nextRequest(),ctx);assert.equal(nextResponse.status,200);const moved=await nextResponse.json();assert.equal(moved.status,'review');assert.equal(moved.price,quick.price);assert.deepEqual(moved.images,quick.images);assert.equal((await actions.POST(nextRequest(),ctx)).status,409);
sql.prepare('UPDATE orders SET updated_at=? WHERE id=?').run('2020-01-01T00:00:00.000Z',id);
assert.equal((await (await admin.GET(get('/api/admin/orders?focus=followup'))).json()).total,1);
const follow=await actions.POST(post('/api/admin/orders/'+id+'/action',JSON.stringify({action:'followup',version:moved.version})),ctx);assert.equal(follow.status,200);const followed=await follow.json();assert(followed.followUpAt);assert.equal(followed.status,'review');assert.equal((await (await admin.GET(get('/api/admin/orders?focus=followup'))).json()).total,0);
console.log('PASS: quick actions reject anonymous/foreign-origin/stale writes; stage advance preserves order details; manual follow-up defers the queue and writes history.');
const production=await load('app/api/admin/orders/[id]/production/route.ts'),customerDesign=await load('app/api/design/[id]/route.ts'),printRoute=await load('app/api/admin/orders/[id]/print/route.ts'),productionLib=await load('lib/production.ts');
let before=await store.getOrder(id);const designKey=before.images.find(i=>i.role==='design').key;
const productionPost=(body,origin=base)=>production.POST(post('/api/admin/orders/'+id+'/production',JSON.stringify(body),origin),ctx);
globalThis.testUser=null;assert.equal((await productionPost({})).status,403);assert.equal((await printRoute.GET(get('/api/admin/orders/'+id+'/print'),ctx)).status,403);
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
assert.equal((await productionPost({action:'approval',keys:[designKey],version:before.version},'https://attacker.test')).status,403);
assert.equal((await printRoute.GET(get('/api/admin/orders/'+id+'/print'),ctx)).status,409);
let approvalResponse=await productionPost({action:'approval',keys:[designKey],version:before.version});assert.equal(approvalResponse.status,200);let approvalData=await approvalResponse.json();const token=new URL(approvalData.url).hash.slice(1),endpoint='/api/design/'+id+'?token='+token;const approvalId=approvalData.order.approval.id;
assert.equal((await customerDesign.GET(get('/api/design/'+id+'?token=wrong'),ctx)).status,404);
let previewResponse=await customerDesign.GET(get(endpoint),ctx);assert.equal(previewResponse.status,200);const previewData=await previewResponse.json();assert(!('phone' in previewData));assert(!('payments' in previewData));assert(!('hash' in previewData));assert.equal(previewData.images.length,1);
assert.equal((await customerDesign.GET(get(endpoint+'&image=0'),ctx)).status,200);assert.equal((await customerDesign.GET(get(endpoint+'&image=1'),ctx)).status,404);
assert.equal((await customerDesign.POST(post(endpoint,JSON.stringify({approvalId,state:'changes',name:'Customer',comment:''})),ctx)).status,400);
assert.equal((await customerDesign.POST(post(endpoint,JSON.stringify({approvalId,state:'approved',name:'Customer',comment:'Looks good'}),'https://attacker.test'),ctx)).status,403);
let accepted=await customerDesign.POST(post(endpoint,JSON.stringify({approvalId,state:'approved',name:'Customer',comment:'Looks good'})),ctx);assert.equal(accepted.status,200);assert.equal((await customerDesign.POST(post(endpoint,JSON.stringify({approvalId,state:'approved',name:'Customer',comment:''})),ctx)).status,409);
assert(productionLib.productionReady(await store.getOrder(id)));let packet=await printRoute.GET(get('/api/admin/orders/'+id+'/print'),ctx);assert.equal(packet.status,200);fs.writeFileSync(path.join(output,'approved-print.zip'),Buffer.from(await packet.arrayBuffer()));
let paidOrder=await store.getOrder(id);assert.equal((await productionPost({action:'payment',version:paidOrder.version,kind:'deposit',amount:100,method:'Bank',reference:'Test receipt'})).status,200);paidOrder=await store.getOrder(id);assert.equal(productionLib.paidTotal(paidOrder),100);assert.equal(paidOrder.status,'approved');assert.equal((await productionPost({action:'payment',version:paidOrder.version,kind:'refund',amount:101,method:'Bank',reference:''})).status,400);
assert.equal((await productionPost({action:'payment',version:paidOrder.version,kind:'refund',amount:25,method:'Bank',reference:'Correction'})).status,200);paidOrder=await store.getOrder(id);assert.equal(productionLib.paidTotal(paidOrder),75);
const altered=await store.saveOrder({...paidOrder,shirts:paidOrder.shirts.map((s,n)=>n? s:{...s,size:'XL'})},paidOrder.version,'Changed size','owner');assert.equal(altered.approval.state,'stale');assert.equal(altered.status,'designing');assert.equal((await customerDesign.GET(get(endpoint),ctx)).status,409);assert.equal((await printRoute.GET(get('/api/admin/orders/'+id+'/print'),ctx)).status,409);
let again=await productionPost({action:'approval',keys:[designKey],version:altered.version});assert.equal(again.status,200);const newer=await again.json();assert.equal((await customerDesign.GET(get(endpoint),ctx)).status,404);const newerEndpoint='/api/design/'+id+'?token='+new URL(newer.url).hash.slice(1);assert.equal((await customerDesign.POST(post(newerEndpoint,JSON.stringify({approvalId:newer.order.approval.id,state:'changes',name:'Customer',comment:'Please change title'})),ctx)).status,200);assert.equal((await store.getOrder(id)).status,'designing');
console.log('PASS: private immutable approval snapshots; token scope/replacement; approve/revision responses; no replay; print only approved files; shirt changes invalidate approval; manual payment/refund ledger and version checks.');
const teamApi=await load('app/api/admin/team/route.ts');
globalThis.testUser={userId:'stranger',email:'staff@example.com'};assert.equal((await teamApi.GET()).status,403);assert.equal((await admin.GET(get('/api/admin/orders'))).status,403);
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};let teamData=await (await teamApi.GET()).json();assert.equal(teamData.members.length,0);
const teamPost=(v,origin=base)=>teamApi.POST(post('/api/admin/team',JSON.stringify(v),origin));
assert.equal((await teamPost({action:'add',email:'staff@example.com',name:'Studio Staff',version:0},'https://attacker.test')).status,403);
let added=await teamPost({action:'add',email:'Staff@Example.com',name:'Studio Staff',version:teamData.version});assert.equal(added.status,200);teamData=await added.json();assert.equal(teamData.members[0].email,'staff@example.com');
assert.equal((await teamPost({action:'add',email:'second@example.com',name:'Second',version:0})).status,409);
globalThis.testUser={userId:'staff1',email:'staff@example.com'};assert.equal((await admin.GET(get('/api/admin/orders'))).status,200);assert.equal((await detail.GET(get('/api/admin/orders/'+id),ctx)).status,200);assert.equal((await teamApi.GET()).status,403);assert.equal((await teamPost({action:'add',email:'evil@example.com',name:'Evil',version:teamData.version})).status,403);
let staffOrder=await store.getOrder(id);let staffUpdated=await actions.POST(post('/api/admin/orders/'+id+'/action',JSON.stringify({action:'followup',version:staffOrder.version})),ctx);assert.equal(staffUpdated.status,200);assert.equal((await staffUpdated.json()).history.at(-1).actor,'staff@example.com');
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};assert.equal((await teamPost({action:'remove',email:'atzilul@gmail.com',version:teamData.version})).status,400);assert.equal((await teamPost({action:'remove',email:'staff@example.com',version:teamData.version})).status,200);
globalThis.testUser={userId:'staff1',email:'staff@example.com'};assert.equal((await admin.GET(get('/api/admin/orders'))).status,403);assert.equal((await detail.GET(get('/api/admin/orders/'+id),ctx)).status,403);
console.log('PASS: owner-only team access management; invitation email normalization; team access without escalation; owner cannot be removed; version conflicts; removal revokes API access; named staff audit trail.');
// Expanded workflow: scoped team, customer tracking, print specs, backup restoration.
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
const wf=await load('app/api/admin/orders/[id]/workflow/route.ts'),workspace=await load('app/api/admin/workspace/route.ts'),tracking=await load('app/api/track/[id]/route.ts'),customerAccess=await load('lib/customer-access.ts'),backupsApi=await load('app/api/admin/backups/route.ts'),contentApi=await load('app/api/admin/content/route.ts'),publicContent=await load('app/api/content/route.ts');
let t=await (await teamApi.GET()).json();assert.equal((await teamPost({action:'add',email:'design@example.com',name:'Design',role:'designer',version:t.version})).status,200);
let wo=await store.getOrder(id);const workflowData={version:wo.version,assignee:'design@example.com',task:'Prepare design',taskDue:'2030-01-01T12:00',taskDone:false,printSpecs:[],printNote:''};assert.equal((await wf.POST(post('/workflow',JSON.stringify({...workflowData,assignee:'unknown@example.com'})),ctx)).status,400);for(const taskDue of ['2030-02-30T12:00','2030-01-01T24:00'])assert.equal((await wf.POST(post('/workflow',JSON.stringify({...workflowData,taskDue})),ctx)).status,400);assert.equal((await wf.POST(post('/workflow',JSON.stringify(workflowData)),ctx)).status,200);
globalThis.testUser={userId:'designer',email:'design@example.com'};assert.equal((await detail.GET(get('/api/admin/orders/'+id),ctx)).status,403);assert.equal((await admin.GET(get('/api/admin/orders'))).status,403);assert.equal((await adminZip.GET(get('/bundle'),ctx)).status,403);const jobs=await (await workspace.GET(get('/api/admin/workspace'))).json();assert.equal(jobs.orders.length,1);assert(!('phone' in jobs.orders[0]));assert(!('price' in jobs.orders[0]));assert(!('notes' in jobs.orders[0]));assert.equal((await backupsApi.GET(get('/api/admin/backups'))).status,403);
let df=new FormData();wo=await store.getOrder(id);df.set('id',id);df.set('version',String(wo.version));df.set('brief','Updated by assigned designer');df.append('images',new File([new Uint8Array([255,216,255,1])],'new-design.jpg',{type:'image/jpeg'}));const staffSaved=await workspace.POST(post('/api/admin/workspace',df));assert.equal(staffSaved.status,200);const staffResult=await staffSaved.json();assert.equal(staffResult.order.version,wo.version+1);assert.equal(staffResult.order.brief,'Updated by assigned designer');assert.equal(staffResult.order.images.length,wo.images.length+1);for(const key of ['phone','email','price','notes','address','payments','history'])assert(!(key in staffResult.order),key);assert.equal((await store.getOrder(id)).price,wo.price);
const staleStaff=await workspace.POST(post('/api/admin/workspace',df));assert.equal(staleStaff.status,409);assert.equal((await store.getOrder(id)).images.length,staffResult.order.images.length);

// Staff upload limits use stored object bytes when older image metadata has no size.
wo=await store.getOrder(id);const originalImage=wo.images[0],originalObject=objects.get(originalImage.key);
const limitOrder={...wo,images:wo.images.map((image,i)=>i===0?{...image,size:undefined}:image)};
sql.prepare('UPDATE orders SET data=? WHERE id=?').run(JSON.stringify(limitOrder),id);
objects.set(originalImage.key,{...originalObject,bytes:new Uint8Array(30*1024*1024)});
const overflow=new FormData();overflow.set('id',id);overflow.set('version',String(wo.version));overflow.append('images',new File([new Uint8Array([255,216,255,1])],'too-much.jpg',{type:'image/jpeg'}));
assert.equal((await workspace.POST(post('/api/admin/workspace',overflow))).status,400);assert.equal((await store.getOrder(id)).version,wo.version);
objects.set(originalImage.key,originalObject);sql.prepare('UPDATE orders SET data=? WHERE id=?').run(JSON.stringify(wo),id);
const malformed=new FormData();malformed.set('id',id);malformed.set('version',String(wo.version));malformed.append('images',new File(['fake bytes'],'fake.jpg',{type:'image/jpeg'}));assert.equal((await workspace.POST(post('/api/admin/workspace',malformed))).status,400);assert.equal((await store.getOrder(id)).version,wo.version);
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};wo=await store.getOrder(id);const spec={side:'front',placement:'center chest',widthCm:20,heightCm:25,imageKey:wo.images.at(-1).key,shirtNumbers:[1,2,3,4]};assert.equal((await wf.POST(post('/workflow',JSON.stringify({...workflowData,version:wo.version,printSpecs:[{...spec,shirtNumbers:[999]}]})),ctx)).status,400);assert.equal((await wf.POST(post('/workflow',JSON.stringify({...workflowData,version:wo.version,printSpecs:[spec]})),ctx)).status,200);
const trackUrl=await customerAccess.createCustomerAccess(id),trackToken=new URL(trackUrl).hash.slice(1);const tr=await tracking.GET(get('/api/track/'+id+'?token='+trackToken),ctx);assert.equal(tr.status,200);const tv=await tr.json();assert(!('notes' in tv));assert(!('phone' in tv));assert(!('approvalHistory' in tv));assert.equal((await tracking.GET(get('/api/track/'+id+'?token='+'a'.repeat(64)),ctx)).status,404);
const bpost=v=>backupsApi.POST(post('/api/admin/backups',JSON.stringify(v)));let b=await (await bpost({action:'start'})).json();let iterations=0;while(b.state==='running'){const res=await bpost({action:'step',id:b.id,version:b.version});assert.equal(res.status,200);b=await res.json();assert(++iterations<100)}assert(b.items.some(i=>i.id===id));const snapshot=JSON.parse(new TextDecoder().decode(objects.get(b.items.find(i=>i.id===id).file).bytes));const imageKey=snapshot.order.images[0].key;objects.delete(imageKey);wo=await store.getOrder(id);await store.saveOrder({...wo,images:wo.images.filter(i=>i.key!==imageKey),brief:'Changed after backup'},wo.version,'test edit','test');wo=await store.getOrder(id);const restoredResponse=await bpost({action:'restore',id:b.id,orderId:id,orderVersion:wo.version});assert.equal(restoredResponse.status,200);const restored=await store.getOrder(id);assert.equal(restored.brief,snapshot.order.brief);assert.equal(restored.images.length,snapshot.order.images.length);assert(restored.images.every(i=>objects.has(i.key)));assert.equal(restored.approval.state,'stale');assert.equal((await bpost({action:'restore',id:b.id,orderId:id,orderVersion:wo.version})).status,409);const backupDownload=await backupsApi.GET(get('/api/admin/backups?id='+b.id+'&download=1'));assert.equal(backupDownload.status,200);fs.writeFileSync(path.join(output,'party-backup-test.zip'),Buffer.from(await backupDownload.arrayBuffer()));
let closed=await wf.POST(post('/workflow',JSON.stringify({version:restored.version,action:'close',kind:'cancel',reason:'Customer cancelled'})),ctx);assert.equal(closed.status,200);const active=await (await admin.GET(get('/api/admin/orders?q='+id))).json();assert.equal(active.total,0);const archive=await (await admin.GET(get('/api/admin/orders?q='+id+'&focus=archive'))).json();assert.equal(archive.total,1);const co=await store.getOrder(id);assert.equal((await actions.POST(post('/action',JSON.stringify({action:'next',version:co.version})),ctx)).status,409);
const cf=new FormData();cf.set('data',JSON.stringify({action:'settings',version:0,leadDays:8,sizes:[{size:'M',width:50,length:70}]}));assert.equal((await contentApi.POST(post('/api/admin/content',cf))).status,200);const pc=await (await publicContent.GET(get('/api/content'))).json();assert.equal(pc.sizes[0].width,50);assert.equal(pc.gallery.length,0);
const ops=await load('lib/operational-analytics.ts');const report=await ops.operationalAnalytics('2000-01-01');assert(report.responses.cancelled>=1);assert(report.netReceipts>=0);assert(Array.isArray(report.stageDurations));assert.equal((await admin.GET(get('/api/admin/orders?focus=balance'))).status,200);assert.equal((await admin.GET(get('/api/admin/orders?focus=task'))).status,200);
console.log('PASS: role-scoped assignments and redacted designer workspace, print mapping validation, private customer tracking, full backup and byte restoration after deletion, restore conflicts, archive/cancel protection, real content settings and operational SQL. No customer messages sent.');
// Ticketing smoke checks: durable records, customer/order links, team assignment,
// thread messages, validation and same-origin protection.
const ticketsApi=await load('app/api/admin/tickets/route.ts'),ticketOptions=await load('app/api/admin/tickets/options/route.ts'),ticketDetail=await load('app/api/admin/tickets/[id]/route.ts'),ticketMessages=await load('app/api/admin/tickets/[id]/messages/route.ts');
globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
assert.equal((await ticketsApi.POST(post('/api/admin/tickets',JSON.stringify({title:'Foreign request',customerName:'Customer',customerEmail:'customer@example.com'}),'https://attacker.test'))).status,403);
const ticketResponse=await ticketsApi.POST(post('/api/admin/tickets',JSON.stringify({title:'Prepare customer preview',description:'Send the first design draft for review.',customerName:'Customer',customerEmail:'customer@example.com',assigneeEmail:'atzilul@gmail.com',priority:'high',dueAt:'2030-01-15'})));
assert.equal(ticketResponse.status,201);const ticketData=await ticketResponse.json(),ticketId=ticketData.ticket.id;assert.equal(ticketData.ticket.customerName,'Customer');assert.equal(ticketData.ticket.assigneeEmail,'atzilul@gmail.com');
const ticketList=await (await ticketsApi.GET(get('/api/admin/tickets?q=customer'))).json();assert.equal(ticketList.total,1);assert.equal(ticketList.tickets[0].id,ticketId);assert.equal(ticketList.tickets[0].priority,'high');
const ticketCtx={params:Promise.resolve({id:ticketId})};const ticketView=await ticketDetail.GET(get('/api/admin/tickets/'+ticketId),ticketCtx);assert.equal(ticketView.status,200);assert.equal((await ticketView.json()).messages.length,0);
assert.equal((await ticketMessages.POST(post('/api/admin/tickets/'+ticketId,JSON.stringify({body:'Preview is ready for review.'}),'https://attacker.test'),ticketCtx)).status,403);
const messageResponse=await ticketMessages.POST(post('/api/admin/tickets/'+ticketId,JSON.stringify({body:'Preview is ready for review.'})),ticketCtx);assert.equal(messageResponse.status,201);
const changed=await ticketDetail.PATCH(post('/api/admin/tickets/'+ticketId,JSON.stringify({status:'in_progress',priority:'urgent',version:ticketData.ticket.version})),ticketCtx);assert.equal(changed.status,200);assert.equal((await changed.json()).ticket.status,'in_progress');
assert.equal((await ticketDetail.PATCH(post('/api/admin/tickets/'+ticketId,JSON.stringify({assigneeEmail:'unknown@example.com'})),ticketCtx)).status,400);
const hydrated=await (await ticketDetail.GET(get('/api/admin/tickets/'+ticketId),ticketCtx)).json();assert.equal(hydrated.messages[0].body,'Preview is ready for review.');assert.equal(hydrated.ticket.priority,'urgent');
const options=await ticketOptions.GET();assert.equal(options.status,200);const optionData=await options.json();assert(optionData.assignees.some(item=>item.email==='atzilul@gmail.com'));
console.log('PASS: ticket creation, same-origin protection, customer assignment, team assignee validation, filters, priority/status updates and durable message threads.');

// Notification recipients must follow the current team, including role/removal changes.
const mailTestApi=await load('app/api/admin/mail/test/route.ts');
const priorOwner=process.env.PARTYPRINT_ADMIN_EMAIL;
const priorMailKey=globalThis.testEnv.RESEND_API_KEY,priorMailFrom=globalThis.testEnv.MAIL_FROM;
const originalTeam=sql.prepare("SELECT data,version FROM studio_settings WHERE key='team'").get();
const deliveries=[];
try{
 process.env.PARTYPRINT_ADMIN_EMAIL=' "owner@example.com" ';
 globalThis.testUser={userId:'owner-test',email:'owner@example.com'};
 globalThis.testEnv.RESEND_API_KEY=' "re_test" ';globalThis.testEnv.MAIL_FROM=' "PARTYPRINT <orders@example.com>" ';
 const members=[{email:'manager@example.com',role:'manager'},{email:'legacy@example.com'},{email:'designer@example.com',role:'designer'},{email:'printer@example.com',role:'printer'},{email:'owner@example.com',role:'manager'}];
 const writeTeam=members=>sql.prepare("INSERT INTO studio_settings(key,data,version) VALUES ('team',?,1) ON CONFLICT(key) DO UPDATE SET data=excluded.data").run(JSON.stringify({members,history:[]}));
 writeTeam(members);
 globalThis.fetch=async(_url,init)=>{deliveries.push(JSON.parse(init.body));return Response.json({id:'notification-test-id'})};
 assert.equal((await mail.notifyOrder(globalThis.testEnv,saved,link)),true);
 assert.deepEqual(deliveries.at(-1).to,['owner@example.com','manager@example.com','legacy@example.com']);
 let state=await mail.orderMailStatus(globalThis.testEnv);
 assert.deepEqual(state.recipients,state.lastAttempt.recipients);assert.equal(state.lastAttempt.messageId,'notification-test-id');
 // Remove a manager and downgrade a legacy manager: neither receives the next alert.
 writeTeam([{email:'legacy@example.com',role:'designer'},{email:'new@example.com',role:'manager'}]);
 assert.equal((await mail.notifyOrder(globalThis.testEnv,saved,link,'retry')),true);
 assert.deepEqual(deliveries.at(-1).to,['owner@example.com','new@example.com']);
 globalThis.testUser=null;
 assert.equal((await mailTestApi.POST(post('/api/admin/mail/test','{}'))).status,403);
 globalThis.testUser={userId:'owner-test',email:'owner@example.com'};
 assert.equal((await mailTestApi.POST(post('/api/admin/mail/test','{}','https://attacker.test'))).status,403);
 let testResponse=await mailTestApi.POST(post('/api/admin/mail/test',JSON.stringify({to:['injected@example.com']})));
 assert.equal(testResponse.status,200);assert.deepEqual(deliveries.at(-1).to,['owner@example.com','new@example.com']);
 assert.equal((await testResponse.json()).mail.lastAttempt.kind,'test');
 assert.equal((await mailTestApi.POST(post('/api/admin/mail/test','{}'))).status,429);
 // A rejected notification still preserves the submitted order, with a useful admin diagnostic.
 sql.prepare('DELETE FROM form_rate_limits').run();
 globalThis.fetch=async()=>Response.json({name:'validation_error',message:'The sender domain is not verified.'},{status:403});
 const failureResponse=await publicRoute.POST(post('/api/orders',form()));assert.equal(failureResponse.status,201);
 const failedOrder=await failureResponse.json();assert.equal(failedOrder.emailSent,false);assert(await store.getOrder(failedOrder.id));
 state=await mail.orderMailStatus(globalThis.testEnv);assert.equal(state.lastAttempt.code,'domain_not_verified');assert.equal(state.lastAttempt.orderId,failedOrder.id);
 assert(!JSON.stringify(state).includes('re_test'));
}finally{
 globalThis.fetch=originalFetch;
 if(priorOwner===undefined)delete process.env.PARTYPRINT_ADMIN_EMAIL;else process.env.PARTYPRINT_ADMIN_EMAIL=priorOwner;
 globalThis.testEnv.RESEND_API_KEY=priorMailKey;globalThis.testEnv.MAIL_FROM=priorMailFrom;
 if(originalTeam)sql.prepare("UPDATE studio_settings SET data=?,version=? WHERE key='team'").run(originalTeam.data,originalTeam.version);
 else sql.prepare("DELETE FROM studio_settings WHERE key='team'").run();
}
console.log('PASS: live team recipients, owner normalization, role/removal changes, protected test send, recipient injection rejection, rate limiting, provider diagnostics and order persistence after Resend failure. No real emails sent.');

// Quantity changes are exercised against the actual route with only the
// in-memory SQLite/bucket fixture. No customer order or external send is made.
const quantityPriorFetch=globalThis.fetch,quantityPriorKey=globalThis.testEnv.RESEND_API_KEY,quantityPriorFrom=globalThis.testEnv.MAIL_FROM;
let quantityNetworkAttempts=0;
try{
 delete globalThis.testEnv.RESEND_API_KEY;delete globalThis.testEnv.MAIL_FROM;
 globalThis.fetch=async()=>{quantityNetworkAttempts++;throw Error('External network is forbidden in quantity API QA')};
 const quantityConfig=await settingsStore.getPricing();
 const quantityForm=(pack,n)=>{const f=form();f.delete('images');f.set('package',String(pack));f.set('quantity',String(n));f.set('mode',pack===4?'custom':'order');f.set('shirts',JSON.stringify(Array.from({length:Number.isInteger(n)&&n>=1&&n<=100?n:4},()=>({size:'M',color:'white',sizeType:'adult'}))));return f};
 for(const [pack,n] of [[0,1],[0,2],[0,3],[0,5],[1,1],[1,4],[2,2],[2,7],[3,3],[3,4],[3,14],[4,1],[4,2],[4,3],[4,4],[4,7],[4,21]]){
  sql.prepare('DELETE FROM form_rate_limits').run();
  const f=quantityForm(pack,n),expected=business.priceFor(quantityConfig,pack,n);f.set('expectedPrice',String(expected));
  const response=await publicRoute.POST(post('/api/orders',f));assert.equal(response.status,201,'quantity '+n+' in package '+pack);
  const submitted=await response.json(),stored=await store.getOrder(submitted.id);
  assert.equal(stored.quantity,n);assert.equal(stored.shirts.length,n);assert.equal(stored.price,expected);assert.equal(submitted.emailSent,false);
 }
 // A design for every shirt: the team package only, 50 per shirt on top of the quantity price.
 for(const [pack,n,design,individual] of [[3,10,'individual',true],[3,4,'individual',true],[3,10,'shared',false],[1,6,'individual',false],[4,5,'individual',false]]){
  sql.prepare('DELETE FROM form_rate_limits').run();
  const expected=business.priceFor(quantityConfig,pack,n)+(individual?50*n:0),f=quantityForm(pack,n);f.set('designMode',design);f.set('expectedPrice',String(expected));
  const response=await publicRoute.POST(post('/api/orders',f));assert.equal(response.status,201,'design '+design+' in package '+pack);
  const submitted=await response.json(),stored=await store.getOrder(submitted.id);
  assert.equal(stored.price,expected);assert.equal(stored.designMode,individual?'individual':undefined);assert.equal(stored.packageName.includes('עיצוב אישי לכל חולצה'),individual);assert.equal(submitted.packageName,stored.packageName);
 }
 {sql.prepare('DELETE FROM form_rate_limits').run();const f=quantityForm(3,10);f.set('designMode','individual');f.set('expectedPrice',String(business.priceFor(quantityConfig,3,10)));assert.equal((await publicRoute.POST(post('/api/orders',f))).status,409,'the shared-design price cannot buy a design for every shirt');}
 // The admin panel sets both fees; an order is priced by them and keeps them.
 {const visitor=globalThis.testUser;globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};const before=await settingsStore.getPricing();
  let saved=await settings.POST(jsonRequest({action:'pricing',pricing:{...before,individualDesignPrice:65.5,extraRevisionPrice:120}}));assert.equal(saved.status,200);
  const feeConfig=await settingsStore.getPricing();assert.equal(feeConfig.individualDesignPrice,65.5);assert.equal(feeConfig.extraRevisionPrice,120);assert.equal(feeConfig.version,before.version+1);
  const published=await (await prices.GET()).json();assert.equal(published.individualDesignPrice,65.5);assert.equal(published.extraRevisionPrice,120);
  sql.prepare('DELETE FROM form_rate_limits').run();
  const expected=business.priceFor(feeConfig,3,10,'individual');assert.equal(expected,business.priceFor(feeConfig,3,10)+655);
  const f=quantityForm(3,10);f.set('designMode','individual');f.set('expectedPrice',String(expected));
  const response=await publicRoute.POST(post('/api/orders',f));assert.equal(response.status,201);
  const submitted=await response.json(),stored=await store.getOrder(submitted.id);
  assert.equal(stored.price,expected);assert.equal(stored.designSurcharge,65.5);assert.equal(stored.revisionPrice,120);
  assert.match(submitted.summary,/65\.5 ₪ נוספים לחולצה/);assert.match(submitted.summary,/כל סבב נוסף: 120 ₪\./);
  sql.prepare('DELETE FROM form_rate_limits').run();const old=quantityForm(3,10);old.set('designMode','individual');old.set('expectedPrice',String(business.priceFor(feeConfig,3,10)+500));assert.equal((await publicRoute.POST(post('/api/orders',old))).status,409,'the previous surcharge no longer buys a design for every shirt');
  assert.equal((await settings.POST(jsonRequest({action:'pricing',pricing:{...feeConfig,extraRevisionPrice:0}}))).status,400);
  saved=await settings.POST(jsonRequest({action:'pricing',pricing:{...feeConfig,individualDesignPrice:50,extraRevisionPrice:100}}));assert.equal(saved.status,200);
  const restored=await settingsStore.getPricing();assert.equal(restored.individualDesignPrice,50);assert.equal(restored.extraRevisionPrice,100);globalThis.testUser=visitor;
 }
 // A request sent from a translated page: the order remembers the language, and its links lead there.
 {const current=await settingsStore.getPricing();
  const send=async headers=>{sql.prepare('DELETE FROM form_rate_limits').run();const f=quantityForm(3,10);f.set('expectedPrice',String(business.priceFor(current,3,10)));const response=await publicRoute.POST(new Request(base+'/api/orders',{method:'POST',headers:{origin:base,...headers},body:f}));assert.equal(response.status,201);const submitted=await response.json();return {submitted,stored:await store.getOrder(submitted.id)};};
  const arabic=await send({'x-partyprint-language':'ar'});
  assert.equal(arabic.stored.language,'ar');assert.match(arabic.submitted.trackingUrl,/\/ar\/track\/[a-f0-9-]{36}#/);assert.match(arabic.submitted.summary,/שפת הלקוח: ערבית/);
  const referred=await send({referer:base+'/ar/lp/team'});
  assert.equal(referred.stored.language,'ar','the address the request came from is the fallback');
  const hebrew=await send({});
  assert.equal(hebrew.stored.language,undefined);assert.match(hebrew.submitted.trackingUrl,/^[^#]*\/track\/[a-f0-9-]{36}#/);assert.doesNotMatch(hebrew.submitted.trackingUrl,/\/ar\//);assert.doesNotMatch(hebrew.submitted.summary,/שפת הלקוח/);
  const unknown=await send({'x-partyprint-language':'xx',referer:base+'/guides'});
  assert.equal(unknown.stored.language,undefined,'a language the site does not have is ignored');
 }
 // The contact page's form: a message becomes an open ticket; junk, other origins and floods are turned away.
 {const contactRoute=await load('app/api/contact/route.ts');
  const send=(body,origin=base)=>contactRoute.POST(new Request(base+'/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}));
  const good={name:'דנה לוי',phone:'0501234567',email:'dana.contact@example.com',topic:'bundle',body:'צריכים 40 חולצות לגן, אפשר הצעה?'};
  sql.prepare('DELETE FROM form_rate_limits').run();
  const saved=await send(good);assert.equal(saved.status,201);const reply=await saved.json();assert.match(reply.reference,/^[0-9A-F]{8}$/);assert.equal(reply.emailSent,false);
  const row=sql.prepare("SELECT * FROM tickets WHERE customer_email='dana.contact@example.com'").get();
  assert.equal(row.status,'open');assert.equal(row.priority,'normal');assert.equal(row.customer_name,'דנה לוי');assert.match(row.title,/^פנייה מהאתר · הזמנה גדולה/);assert.match(row.description,/40 חולצות/);assert.match(row.description,/טלפון: 0501234567/);assert.equal(row.id.slice(0,8).toUpperCase(),reply.reference);
  assert.equal((await send(good,'https://evil.example')).status,403);
  assert.equal((await send({...good,website:'https://spam.example'})).status,400);
  for(const bad of [{name:''},{phone:'12'},{email:'nope'},{body:'hi'},{body:'x'.repeat(2001)}])assert.equal((await send({...good,...bad})).status,400,JSON.stringify(Object.keys(bad)));
  assert.equal((await contactRoute.POST(new Request(base+'/api/contact',{method:'POST',headers:{origin:base,'content-type':'text/plain'},body:'x'}))).status,415);
  assert.equal((await send({...good,email:'other.topic@example.com',topic:'not-a-topic'})).status,201);
  assert.match(sql.prepare("SELECT title FROM tickets WHERE customer_email='other.topic@example.com'").get().title,/משהו אחר/,'an unknown topic is filed under the last one');
  sql.prepare('DELETE FROM form_rate_limits').run();
  for(let attempt=0;attempt<5;attempt++)assert.equal((await send(good)).status,201);
  assert.equal((await send(good)).status,429,'the sixth message in an hour waits');
  sql.prepare('DELETE FROM form_rate_limits').run();
 }
 for(const n of [0,-1,4.5,101,NaN]){
  sql.prepare('DELETE FROM form_rate_limits').run();
  assert.equal((await publicRoute.POST(post('/api/orders',quantityForm(4,n)))).status,400);
 }
 sql.prepare('DELETE FROM form_rate_limits').run();
 const stalePrice=quantityForm(4,7);stalePrice.set('expectedPrice','1');
 assert.equal((await publicRoute.POST(post('/api/orders',stalePrice))).status,409);
 sql.prepare('DELETE FROM form_rate_limits').run();
 const wrongCount=quantityForm(4,7);wrongCount.set('shirts',JSON.stringify(Array.from({length:8},()=>({size:'M',color:'white'}))));
 assert.equal((await publicRoute.POST(post('/api/orders',wrongCount))).status,400);
 assert.equal(quantityNetworkAttempts,0);
}finally{
 globalThis.fetch=quantityPriorFetch;globalThis.testEnv.RESEND_API_KEY=quantityPriorKey;globalThis.testEnv.MAIL_FROM=quantityPriorFrom;
}
console.log('PASS: all occasions start at four and support reduction to one with authoritative tier pricing; actual order API checks quantity, active shirt count and server price in isolated fixtures; zero external network calls.');

// The quote is saved before optional shirt details. Tests use temporary SQLite
// and an in-memory bucket; any attempted external request fails this block.
{
 const beforeFetch=globalThis.fetch,priorKey=globalThis.testEnv.RESEND_API_KEY,priorFrom=globalThis.testEnv.MAIL_FROM;
 let external=0;delete globalThis.testEnv.RESEND_API_KEY;delete globalThis.testEnv.MAIL_FROM;
 globalThis.fetch=async()=>{external++;throw Error('External send forbidden in quote-flow QA')};
 const trackRoute=await load('app/api/track/[id]/route.ts');
 const resetRate=()=>sql.prepare('DELETE FROM form_rate_limits').run();
 const pendingForm=(p=0,n=4)=>{const f=form('contact-required@example.invalid');f.delete('images');f.set('package',String(p));f.set('quantity',String(n));f.set('shirts','[]');f.set('shirtDetailsStatus','pending');return f;};
 try{
  resetRate();const response=await publicRoute.POST(post('/api/orders',pendingForm()));assert.equal(response.status,201);const receipt=await response.json();let pending=await store.getOrder(receipt.id);assert.equal(pending.email,'contact-required@example.invalid');assert.equal(pending.shirtDetailsStatus,'pending');assert.deepEqual(pending.shirts,[]);assert.equal(pending.customerEmailStatus,'not_configured');assert.equal(receipt.quantity,4);assert.equal(receipt.imagesCount,0);assert(receipt.trackingUrl.includes('/track/'+receipt.id+'#'));assert.equal((await load('lib/production.ts')).productionReady(pending),false);
  const context={params:Promise.resolve({id:receipt.id})};const u=new URL(receipt.trackingUrl),endpoint=base+'/api/track/'+receipt.id+'?token='+u.hash.slice(1);
  const read=await trackRoute.GET(new Request(endpoint),context);assert.equal(read.status,200);const data=await read.json();assert.equal(data.shirtDetailsStatus,'pending');assert.equal(data.canEditShirts,true);assert.equal(read.headers.get('Cache-Control').includes('no-store'),true);
  const shirts=Array.from({length:4},(_,i)=>({sizeType:i===0?'child':'adult',size:i===0?'8':'M',color:'black'}));
  const patch=(value,origin=base,url=endpoint)=>trackRoute.PATCH(new Request(url,{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(value)}),context);
  assert.equal((await patch({shirts,version:data.version},'https://attacker.test')).status,403);
  assert.equal((await patch({shirts,version:data.version},base,base+'/api/track/'+receipt.id)).status,404);
  assert.equal((await patch({shirts,version:data.version,price:1})).status,400);
  assert.equal((await patch({shirts:shirts.slice(0,3),version:data.version})).status,400);
  assert.equal((await patch({shirts:[{sizeType:'child',size:'3',color:'black'},...shirts.slice(1)],version:data.version})).status,400);
  assert.equal((await patch({shirts,version:0})).status,409);
  const savedResponse=await patch({shirts,version:data.version});assert.equal(savedResponse.status,200);const savedDetails=await savedResponse.json();assert.equal(savedDetails.shirtDetailsStatus,'complete');pending=await store.getOrder(receipt.id);assert.deepEqual(pending.shirts,shirts);assert.equal(pending.price,receipt.price);assert.equal(pending.quantity,4);assert.equal(pending.email,'contact-required@example.invalid');assert((await bucket.get('orders/'+receipt.id+'/order.txt')).text);assert.equal((await patch({shirts,version:data.version})).status,409);
  const locked=await store.saveOrder({...pending,status:'review'},pending.version,'lock fixture','test');assert.equal((await patch({shirts,version:locked.version})).status,409);
  resetRate();const single=await publicRoute.POST(post('/api/orders',pendingForm(5,1)));assert.equal(single.status,201);assert.equal((await single.json()).price,180);
  for(const [p,n] of [[0,1],[4,2],[4,3]]){resetRate();const small=await publicRoute.POST(post('/api/orders',pendingForm(p,n)));assert.equal(small.status,201);assert.equal((await small.json()).price,business.priceFor(await settingsStore.getPricing(),p,n));}for(const [p,n] of [[4,0],[4,101],[5,4]]){resetRate();assert.equal((await publicRoute.POST(post('/api/orders',pendingForm(p,n)))).status,400);}
  resetRate();const legacyMissing=pendingForm();legacyMissing.delete('shirtDetailsStatus');assert.equal((await publicRoute.POST(post('/api/orders',legacyMissing))).status,400);
  resetRate();const mismatched=pendingForm();mismatched.set('shirts',JSON.stringify(shirts));assert.equal((await publicRoute.POST(post('/api/orders',mismatched))).status,400);
  assert.equal(external,0);
  let optionalMail;globalThis.fetch=async(_url,options)=>{optionalMail=JSON.parse(options.body);return Response.json({id:'optional-email-test'});};
  assert(await mail.notifyOrder({...globalThis.testEnv,RESEND_API_KEY:'re_test_optional',MAIL_FROM:'test@example.com'},{...pending,email:''},link));assert.equal(Object.hasOwn(optionalMail,'reply_to'),false);assert(optionalMail.html.includes('לא נמסר'));
 }finally{globalThis.fetch=beforeFetch;globalThis.testEnv.RESEND_API_KEY=priorKey;globalThis.testEnv.MAIL_FROM=priorFrom;}
 console.log('PASS: quote saved with required email and explicit pending sizes; private capability-only, same-origin, bounded size PATCH with version/field/production locks; single shirt 180; reduction from four down to one is supported without a separate visible product; zero external requests.');
}

// Optional sizing can now be explicitly confirmed before saving any request
// mode. Legacy consultation requests still require an empty pending array.
{
 const previousFetch=globalThis.fetch,previousKey=globalThis.testEnv.RESEND_API_KEY,previousFrom=globalThis.testEnv.MAIL_FROM;let external=0;
 delete globalThis.testEnv.RESEND_API_KEY;delete globalThis.testEnv.MAIL_FROM;globalThis.fetch=async()=>{external++;throw Error('External network forbidden in pre-submit sizing QA')};
 try{
  const choices=Array.from({length:4},(_,i)=>({sizeType:i===0?'child':'adult',size:i===0?'8':'M',color:i===0?'gray':'black'}));const ordersModule=await load('lib/orders.ts');
  for(const mode of ['order','custom','lead']){sql.prepare('DELETE FROM form_rate_limits').run();const f=form();f.delete('images');f.set('mode',mode);f.set('shirtDetailsStatus','complete');f.set('shirts',JSON.stringify(choices));const response=await publicRoute.POST(post('/api/orders',f));assert.equal(response.status,201,mode);const receipt=await response.json(),o=await store.getOrder(receipt.id);assert.equal(o.shirtDetailsStatus,'complete');assert.deepEqual(o.shirts,choices);assert.equal(o.mode,mode);
   const edited=ordersModule.editOrder(o,{...o,...defaults,shirtDetailsStatus:'complete'},await settingsStore.getPricing());assert.deepEqual(edited.shirts,choices,'admin edit preserves explicitly chosen sizes for '+mode);
  }
  for(const [status,shirts] of [['complete',choices.slice(0,3)],['complete',[{sizeType:'child',size:'3',color:'black'},...choices.slice(1)]],['pending',choices]]){sql.prepare('DELETE FROM form_rate_limits').run();const f=form();f.delete('images');f.set('mode','lead');f.set('shirtDetailsStatus',status);f.set('shirts',JSON.stringify(shirts));assert.equal((await publicRoute.POST(post('/api/orders',f))).status,400);}
  sql.prepare('DELETE FROM form_rate_limits').run();const legacy=form();legacy.delete('images');legacy.set('mode','lead');legacy.set('shirts',JSON.stringify(choices));assert.equal((await publicRoute.POST(post('/api/orders',legacy))).status,400);assert.equal(external,0);
 }finally{globalThis.fetch=previousFetch;globalThis.testEnv.RESEND_API_KEY=previousKey;globalThis.testEnv.MAIL_FROM=previousFrom;}
 console.log('PASS: explicit pre-submit adult/child selections persist across all modes and admin edits; incomplete/pending/legacy invalid arrays rejected; zero external requests.');
}

// Explicit contact capture: actual SQLite/routes, provider stub, no real customer/order writes.
{
 const contacts=await load('app/api/contacts/route.ts'),contactAdmin=await load('app/api/admin/contacts/route.ts'),contactStore=await load('lib/contact-leads.ts'),team=await load('lib/team.ts');
 const oldFetch=globalThis.fetch,oldKey=globalThis.testEnv.RESEND_API_KEY,oldFrom=globalThis.testEnv.MAIL_FROM,oldBatch=db.batch;
 const messages=[];let queue=Promise.resolve();
 db.batch=statements=>{const work=queue.then(()=>oldBatch(statements));queue=work.catch(()=>{});return work;};
 globalThis.testEnv.RESEND_API_KEY='re_test_contact';globalThis.testEnv.MAIL_FROM='orders@example.invalid';
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://api.resend.com/emails');messages.push({body:JSON.parse(options.body),key:new Headers(options.headers).get('Idempotency-Key')});return Response.json({id:'contact-fixture-'+messages.length});};
 const key=()=>({id:crypto.randomUUID(),token:'a'.repeat(64)}),info={name:'Synthetic <script> contact',phone:'0501234567',email:'synthetic-contact@example.invalid',package:4,quantity:5,mode:'custom',eventDate:'',source:'qa'};
 const send=(v,origin=base)=>contacts.POST(new Request(base+'/api/contacts',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(v)}));
 const reset=()=>sql.prepare('DELETE FROM form_rate_limits').run();
 try{
  globalThis.testUser=null;assert.equal((await contactAdmin.GET(get('/api/admin/contacts'))).status,403);assert.equal((await contactAdmin.POST(new Request(base+'/api/admin/contacts',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:'{}'}))).status,403);
  const credentials=key(),input={action:'save',...credentials,version:0,...info};
  const orderCount=sql.prepare('SELECT count(*) AS n FROM orders').get().n;
  reset();assert.equal((await send({...input,email:''})).status,400);assert.equal((await send(input,'https://attacker.test')).status,403);assert.equal((await send({...input,website:'bot'})).status,400);assert.equal(messages.length,0);
  reset();const response=await send(input);assert.equal(response.status,201);const saved=await response.json();assert.equal(saved.saved,true);assert.equal(saved.id,credentials.id);assert.equal(saved.version,1);assert.equal(saved.details.email,info.email);assert.equal(saved.mailStatus,'accepted');assert.equal(sql.prepare('SELECT count(*) AS n FROM orders').get().n,orderCount);
  assert.equal(messages.length,1);assertBrandedContactEmail(messages[0]);assert.equal(messages[0].body.reply_to,info.email);assert.deepEqual(messages[0].body.to,[team.getOwnerEmail()]);assert(messages[0].body.text.includes(info.phone));assert(messages[0].body.text.includes(info.email));assert(messages[0].body.text.includes('/admin?contact='+credentials.id));assert(!messages[0].body.to.includes(info.email));
  assert.equal((await send(input)).status,200);assert.equal(messages.length,1,'Idempotent save does not resend');
  const row=sql.prepare('SELECT * FROM contact_leads WHERE id=?').get(credentials.id);assert.notEqual(row.token_hash,credentials.token);assert(!row.data.includes(credentials.token));
  const read=await send({action:'read',...credentials});assert.equal(read.status,200);assert.equal(read.headers.get('Cache-Control'),'no-store');assert.equal((await read.json()).details.email,info.email);
  assert.equal((await send({action:'read',...credentials,token:'b'.repeat(64)})).status,404);
  assert.equal((await send({...input,name:'Updated contact',version:0})).status,409);assert.equal(messages.length,1);
  const updated=await send({...input,name:'Updated contact',version:1});assert.equal(updated.status,200);assert.equal((await updated.json()).version,2);assert.equal(messages.length,2);assertBrandedContactEmail(messages[1]);
  const bodyLimit=new Request(base+'/api/contacts',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:'x'.repeat(16001)});assert.equal((await contacts.POST(bodyLimit)).status,413);
  globalThis.testUser={userId:'owner',email:team.getOwnerEmail()};const list=await contactAdmin.GET(get('/api/admin/contacts?id='+credentials.id));assert.equal(list.status,200);const listing=await list.json();assert.equal(listing.contacts.length,1);assert.equal(listing.contacts[0].completed,false);assert(!JSON.stringify(listing).includes(row.token_hash));
  assert.equal((await contactAdmin.POST(new Request(base+'/api/admin/contacts',{method:'POST',headers:{origin:'https://attacker.test','Content-Type':'application/json'},body:JSON.stringify({action:'resend',id:credentials.id})}))).status,403);
  const coupon={code:'CONTACT10',title:'Fixture',kind:'percent',value:10,minQuantity:4,minSubtotal:0,maxUses:1,starts:'',ends:'',enabled:true,package:-1,used:0,version:1};
  sql.prepare('INSERT INTO coupons (code,version,used,data) VALUES (?,1,0,?)').run(coupon.code,JSON.stringify(coupon));assert.equal((await settingsStore.getCoupon(coupon.code)).used,0);
  const final=()=>{const f=form(info.email);f.set('name',info.name);f.set('phone',info.phone);f.set('package','4');f.set('quantity','5');f.set('shirts','[]');f.set('shirtDetailsStatus','pending');f.set('contactId',credentials.id);f.set('contactToken',credentials.token);f.set('coupon',coupon.code);const subtotal=business.priceFor(quantityConfigForContact,4,5);f.set('expectedPrice',String(Math.round(subtotal*.9*100)/100));return f;};
  const quantityConfigForContact=await settingsStore.getPricing();reset();
  const beforeMail=messages.length;const completed=await publicRoute.POST(post('/api/orders',final()));assert.equal(completed.status,201);const receipt=await completed.json();assert.equal(receipt.id,credentials.id);assert.equal((await store.getOrder(receipt.id)).contactCaptureId,credentials.id);assert.equal((await settingsStore.getCoupon(coupon.code)).used,1);assert.equal(messages.length,beforeMail+2,'Only completion sends normal owner/customer confirmations');
  const beforeRetry=messages.length;reset();const again=await publicRoute.POST(post('/api/orders',final()));assert.equal(again.status,200);assert.equal((await again.json()).id,receipt.id);assert.equal(messages.length,beforeRetry);assert.equal((await settingsStore.getCoupon(coupon.code)).used,1);assert.equal(sql.prepare('SELECT count(*) AS n FROM orders').get().n,orderCount+1);
  const contactBackup=await load('app/api/admin/backups/route.ts');const backupSnapshot=await (await contactBackup.POST(post('/api/admin/backups',JSON.stringify({action:'start'})))).json();assert(backupSnapshot.contacts.some(row=>row.id===credentials.id));
  const linked=await (await contactAdmin.GET(get('/api/admin/contacts?id='+credentials.id))).json();assert.equal(linked.contacts[0].completed,true);
  const hijack={...info,...key(),id:receipt.id,action:'save'};hijack.token='c'.repeat(64);reset();assert.equal((await send(hijack)).status,404);
  const existingLegacy=key();existingLegacy.id=id;reset();assert.equal((await send({action:'save',...existingLegacy,...info})).status,404);assert.equal(sql.prepare('SELECT count(*) AS n FROM contact_leads WHERE id=?').get(id).n,0);
  const expiring=key();reset();assert.equal((await send({action:'save',...expiring,...info})).status,201);sql.prepare('UPDATE contact_leads SET token_expires_at=? WHERE id=?').run(Date.now()-1,expiring.id);assert.equal((await send({action:'read',...expiring})).status,404);
  const concurrent=key();reset();const prior=messages.length;const pair=await Promise.all([send({action:'save',...concurrent,...info}),send({action:'save',...concurrent,...info})]);assert.deepEqual(pair.map(r=>r.status).sort(),[200,201]);assert.equal(messages.length,prior+1);assert.equal(sql.prepare('SELECT count(*) AS n FROM contact_leads WHERE id=?').get(concurrent.id).n,1);
  reset();const invalidOrder=form('');assert.equal((await publicRoute.POST(post('/api/orders',invalidOrder))).status,400);
  const retryEndpoint=new Request(base+'/api/admin/contacts',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'resend',id:concurrent.id})});assert.equal((await contactAdmin.POST(retryEndpoint)).status,200);
  assertBrandedContactEmail(messages.at(-1));assert.deepEqual(messages.at(-1).body.to,[team.getOwnerEmail()]);
  const failure=key();globalThis.fetch=async()=>Response.json({name:'validation_error',message:'sender domain is not verified'},{status:403});reset();const failedMail=await send({action:'save',...failure,...info});assert.equal(failedMail.status,201);assert.equal((await failedMail.json()).mailStatus,'domain_not_verified');assert(await contactStore.contactGrant(failure.id,failure.token));
  console.log('PASS: required-email contact capture persists separately before ideas; owner-only plain email, no customer reminder; private resume, CSRF/body/capability/version/expiry/rate protections; deduped completion/coupon; no real external requests.');
 }finally{globalThis.fetch=oldFetch;globalThis.testEnv.RESEND_API_KEY=oldKey;globalThis.testEnv.MAIL_FROM=oldFrom;db.batch=oldBatch;}
}
// A customer on a translated page gets the confirmation email in their language; the branded-template check must not block it.
{
 const priorFetch=globalThis.fetch,priorKey=globalThis.testEnv.RESEND_API_KEY,priorFrom=globalThis.testEnv.MAIL_FROM;
 try{
  sql.prepare('DELETE FROM form_rate_limits').run();
  globalThis.testEnv.RESEND_API_KEY='re_test_language';globalThis.testEnv.MAIL_FROM='PARTYPRINT <orders@example.com>';
  const sent=[];globalThis.fetch=async(_url,init)=>{sent.push(JSON.parse(init.body));return Response.json({id:'language-test'})};
  for(const [language,subject] of [['en','We got your idea'],['ar','استلمنا فكرتكم']]){
   sent.length=0;
   const response=await publicRoute.POST(new Request(base+'/api/orders',{method:'POST',headers:{origin:base,'x-partyprint-language':language},body:form('customer-'+language+'@example.com')}));
   assert.equal(response.status,201);const receipt=await response.json();
   assert.equal(receipt.customerEmailSent,true,language+' customer email was not sent');
   const mail=sent.find(message=>message.to?.[0]==='customer-'+language+'@example.com');
   assert(mail&&mail.subject.includes(subject),language+' customer email subject');
   assert.match(receipt.trackingUrl,new RegExp('/'+language+'/track/'+receipt.id+'#[a-f0-9]{64}$'));
  }
  console.log('PASS: English and Arabic customers receive the branded confirmation email in their language, with a tracking link in their language.');
 }finally{globalThis.fetch=priorFetch;globalThis.testEnv.RESEND_API_KEY=priorKey;globalThis.testEnv.MAIL_FROM=priorFrom;}
}
// Review request: off until a Google link is set and switched on; one email when an order first ships, in the customer's language.
{
 const review=await load('lib/review-request.ts'),settingsApi=await load('app/api/admin/settings/route.ts');
 const priorFetch=globalThis.fetch,priorKey=globalThis.testEnv.RESEND_API_KEY,priorFrom=globalThis.testEnv.MAIL_FROM,priorUser=globalThis.testUser,priorOwner=process.env.PARTYPRINT_ADMIN_EMAIL;
 try{
  globalThis.testEnv.RESEND_API_KEY='re_test_review';globalThis.testEnv.MAIL_FROM='PARTYPRINT <orders@example.com>';
  const sent=[];globalThis.fetch=async(_url,init)=>{sent.push(JSON.parse(init.body));return Response.json({id:'review-test'})};
  assert(review.validReviewUrl('https://g.page/r/abc/review'));assert(review.validReviewUrl('https://search.google.com/local/writereview?placeid=x'));
  for(const bad of ['http://g.page/r/abc','https://evil.example/review','https://g.page.evil.com/x','javascript:alert(1)'])assert(!review.validReviewUrl(bad),bad);
  const shippedBase=await store.getOrder(id);
  const shipped={...shippedBase,status:'shipped',email:'buyer@example.com',language:'en',cancelledAt:undefined,archivedAt:undefined,reviewRequestedAt:undefined};
  // Off by default: nothing is sent.
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},shipped),false);assert.equal(sent.length,0);
  // The owner switches it on in the settings.
  delete process.env.PARTYPRINT_ADMIN_EMAIL;globalThis.testUser={userId:'owner',email:'atzilul@gmail.com'};
  const postSettings=body=>settingsApi.POST(new Request(base+'/api/admin/settings',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(body)}));
  assert.equal((await postSettings({action:'review',review:{enabled:true,url:'',version:0}})).status,400);
  assert.equal((await postSettings({action:'review',review:{enabled:true,url:'https://evil.example/r',version:0}})).status,400);
  const on=await postSettings({action:'review',review:{enabled:true,url:'https://g.page/r/partyprint/review',version:0}});assert.equal(on.status,200);
  assert.equal((await on.json()).review.enabled,true);
  assert.equal((await postSettings({action:'review',review:{enabled:false,url:'',version:0}})).status,409);
  // A transition that is not "just shipped" sends nothing.
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'shipped'},shipped),false);
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},{...shipped,email:''}),false);
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},{...shipped,cancelledAt:'2026-01-01T00:00:00.000Z'}),false);
  assert.equal(sent.length,0);
  // Just shipped: one email to the customer, in English, with the link and the WhatsApp way out.
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},shipped),true);
  assert.equal(sent.length,1);assert.deepEqual(sent[0].to,['buyer@example.com']);
  assert.equal(sent[0].subject,'PARTYPRINT · Your shirts are on their way');
  assert.match(sent[0].html,/<html lang="en" dir="ltr" data-partyprint-email="v1">/);
  assert(sent[0].html.includes('https://g.page/r/partyprint/review'));assert(sent[0].html.includes('Write a Google review'));assert(sent[0].html.includes('wa.me/972552896236'));
  assert(!/[֐-׿]/.test(sent[0].html.replace(/<[^>]+>/g,'').replace(shippedBase.name,'')),'English review email holds Hebrew');
  assert(JSON.parse(sql.prepare('SELECT data FROM orders WHERE id=?').get(id).data).reviewRequestedAt);
  // Asked once only.
  assert.equal(await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},{...shipped,reviewRequestedAt:'2026-01-01T00:00:00.000Z'}),false);
  // Arabic and Hebrew customers get their own language.
  sent.length=0;await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},{...shipped,language:'ar'});
  assert.equal(sent[0].subject,'PARTYPRINT · تيشيرتاتكم في الطريق');assert.match(sent[0].html,/<html lang="ar" dir="rtl"/);
  sent.length=0;await review.requestReviewAfterShipping(globalThis.testEnv,{status:'printed'},{...shipped,language:undefined});
  assert.equal(sent[0].subject,'PARTYPRINT · החולצות שלכם בדרך');
  console.log('PASS: review request is off until a valid Google link is switched on; sent once when an order first ships, to the customer, in their language, with a WhatsApp way out; settings validate the link and versions.');
 }finally{globalThis.fetch=priorFetch;globalThis.testEnv.RESEND_API_KEY=priorKey;globalThis.testEnv.MAIL_FROM=priorFrom;globalThis.testUser=priorUser;if(priorOwner===undefined)delete process.env.PARTYPRINT_ADMIN_EMAIL;else process.env.PARTYPRINT_ADMIN_EMAIL=priorOwner;}
}
