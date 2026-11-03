import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||process.cwd())+'/package.json');
const {chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected audit origin');
const gaId='G-PARTYPRINTQA',pixel='9999999999999999';
const report={base,at:new Date().toISOString(),scope:'Isolated client contract: synthetic contact fields, mocked analytics vendors and mocked contact/order responses; no network writes or emails',scenarios:[],errors:[]};
if(!base.includes('127.0.0.1')){const expected=createBuildIdentity(),live=await fetch(base+'/api/release').then(r=>r.json());report.release={expectedFingerprint:expected.sourceFingerprint,publicFingerprint:live.sourceFingerprint,publicCommit:live.sourceCommit};if(expected.sourceState!=='clean'||live.sourceState!=='clean'||expected.sourceFingerprint!==live.sourceFingerprint){report.status='waiting_for_matching_deployment';await mkdir('artifacts',{recursive:true});await writeFile('artifacts/measurement-contract-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exit(0);}}
const browser=await chromium.launch({headless:true});
try{
 for(const scenario of [{name:'Strict buffered approval',mode:'strict',timezone:'Asia/Jerusalem',width:390},{name:'Notice behavioral events',mode:'notice',timezone:'Asia/Jerusalem',width:390},{name:'Refusal drops buffered events',mode:'strict',timezone:'Asia/Jerusalem',width:390,refuse:true},{name:'Late approval after saved receipt',mode:'strict',timezone:'Asia/Jerusalem',width:390,late:true},{name:'Stored refusal',mode:'strict',timezone:'Asia/Jerusalem',width:320,denied:true}]){
  const context=await browser.newContext({viewport:{width:scenario.width,height:900},locale:'he-IL',timezoneId:scenario.timezone,reducedMotion:'reduce'});
  await context.addInitScript(({denied})=>{
   if(location.pathname==='/')history.replaceState(null,'','/?utm_source=measurement_qa&email=qa%40example.invalid&phone=0500000000&order_id=private-fixture');
   if(denied)localStorage.setItem('partyprint-consent-v1',JSON.stringify({analytics:'denied',at:Date.now()}));
  },{denied:!!scenario.denied});
  const page=await context.newPage(),checks=[],clientErrors=[];
  let capturedContact=null;const counts={mockContacts:0,mockOrders:0,firstPartyEvents:0,serverMetaEvents:[],googleScripts:0,metaScripts:0,blockedWrites:0,networkWrites:0};
  let releasePromo;
  const promoGate=new Promise(resolve=>{releasePromo=resolve;});
  page.on('pageerror',e=>clientErrors.push(e.message.slice(0,200)));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method();
   if(url.origin===base&&url.pathname==='/api/analytics-config')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({measurementId:gaId,metaPixelId:pixel,consentMode:scenario.mode})});
   if(url.origin===base&&url.pathname==='/api/promo'){await promoGate;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'הטבה לקבוצה שלכם עם אישור העיצוב לפני ההדפסה',code:'QA-PROMO'})});}
   if(url.hostname==='www.googletagmanager.com'&&method==='GET'){counts.googleScripts++;return route.fulfill({status:200,contentType:'application/javascript',body:'/* vendor intentionally stubbed */'});}
   if(url.hostname==='connect.facebook.net'&&method==='GET'){counts.metaScripts++;return route.fulfill({status:200,contentType:'application/javascript',body:'/* vendor intentionally stubbed */'});}
   if(!['GET','HEAD','OPTIONS'].includes(method)){
    if(url.origin===base&&url.pathname==='/api/events'){counts.firstPartyEvents++;const payload=req.postDataJSON();if(payload.event_name)counts.serverMetaEvents.push({event_name:payload.event_name,event_id:payload.event_id,event_time:payload.event_time,event_source_url:payload.event_source_url,metaConsent:payload.metaConsent,client_data:payload.client_data});return route.fulfill({status:204,body:''});}
    if(url.origin===base&&url.pathname==='/api/contacts'){
     const v=req.postDataJSON();
     if(v.action==='read')return route.fulfill({status:capturedContact?200:404,contentType:'application/json',body:JSON.stringify(capturedContact?{saved:true,id:capturedContact.id,version:1,details:capturedContact.details}:{error:'not found'})});
     counts.mockContacts++;
     if(counts.mockContacts<3)return route.fulfill({status:counts.mockContacts===1?503:200,contentType:'application/json',body:JSON.stringify(counts.mockContacts===1?{error:'כשל שמירה מדומה'}:{ok:true})});
     capturedContact={id:v.id,details:{name:v.name,phone:v.phone,email:v.email,package:v.package,quantity:v.quantity,mode:v.mode,eventDate:v.eventDate,source:v.source}};
     return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({saved:true,id:v.id,version:1,details:capturedContact.details,mailStatus:'accepted'})});
    }
    if(url.origin===base&&url.pathname==='/api/orders'){
     counts.mockOrders++;
     const response=counts.mockOrders===1?{status:500,body:{error:'כשל מדומה לבדיקת הממשק'}}:counts.mockOrders===2?{status:200,body:{ok:true}}:{status:201,body:{id:capturedContact.id,summary:'בדיקת ממשק בלבד; לא נוצרה הזמנה',emailSent:false}};
     return route.fulfill({status:response.status,contentType:'application/json',body:JSON.stringify(response.body)});
    }
    counts.blockedWrites++;return route.abort();
   }
   if(url.origin!==base)return route.abort();
   if(!['GET','HEAD','OPTIONS'].includes(method))counts.networkWrites++;
   return route.continue();
  });
  const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
  const snapshot=()=>page.evaluate(()=>({ga:(window.dataLayer||[]).map(x=>Array.from(x)),meta:Array.from(window.fbq?.queue||[]),disabled:window['ga-disable-G-PARTYPRINTQA']===true}));
  const eventCount=(s,name)=>s.ga.filter(x=>x[0]==='event'&&x[1]===name).length;
  const metaEvents=s=>s.meta.filter(x=>x[0]==='track'||x[0]==='trackCustom');
  let promoLayout=null,consentLayouts=[];
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
   await page.locator('.hero').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const before=await page.locator('.hero').boundingBox();
   releasePromo();
   await page.locator('.launch-offer').waitFor({state:'visible'});
   await page.waitForLoadState('networkidle',{timeout:20000});
   const after=await page.locator('.hero').boundingBox();
   promoLayout={heroTopBefore:before.y,heroTopAfter:after.y,deltaPixels:Math.abs(after.y-before.y),note:'Fonts settled; delayed synthetic promo isolates banner-induced movement'};
   if(process.env.PARTYPRINT_EXPECT_STABLE_PROMO==='1')check('Loading promotion does not move hero',promoLayout.deltaPixels<=1);
   if(!scenario.denied){
    check('No notice opens automatically',await page.locator('.consent-banner').count()===0);
    const banner=page.getByRole('region',{name:'הגדרות פרטיות',exact:true});
    await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();
    await banner.waitFor({state:'visible'});
    const savedBefore=await page.evaluate(()=>localStorage.getItem('partyprint-consent-v1'));
    for(const width of scenario.name==='Strict buffered approval'?[320,375,414,768,1366]:[scenario.width]){
     await page.setViewportSize({width,height:600});
     await page.evaluate(()=>document.fonts.ready);
     const compact=await banner.boundingBox();
     check(`Compact notice fits viewport at ${width}px`,compact&&compact.height<=132&&compact.x>=0&&compact.x+compact.width<=width&&compact.y>=0&&compact.y+compact.height<=600);
     for(const name of ['אישור','לא, תודה','פרטים']){
      const box=await banner.getByRole('button',{name,exact:true}).boundingBox();
      check(`Accessible ${name} target at ${width}px`,box&&box.height>=44&&box.width>=44&&box.y>=compact.y&&box.y+box.height<=compact.y+compact.height);
     }
     const sticky=await page.locator('.mobile-sticky').isVisible()?await page.locator('.mobile-sticky').boundingBox():null;
     check(`Notice leaves mobile action visible at ${width}px`,!sticky||compact.y+compact.height<=sticky.y);
     await banner.getByRole('button',{name:'פרטים',exact:true}).click();
     await banner.getByRole('link',{name:'מדיניות הפרטיות',exact:true}).waitFor({state:'visible'});
     const expanded=await banner.boundingBox();
     check(`Expanded details stay bounded at ${width}px`,expanded&&expanded.height<=420&&expanded.y>=0&&expanded.y+expanded.height<=600);
     check(`Details toggle exposes expanded state at ${width}px`,await banner.getByRole('button',{name:'פחות פרטים',exact:true}).getAttribute('aria-expanded')==='true');
     await banner.getByRole('button',{name:'פחות פרטים',exact:true}).click();
     check(`Details collapse at ${width}px`,await banner.locator('.consent-details').isHidden());
     consentLayouts.push({width,compactHeight:compact.height,expandedHeight:expanded.height});
     // Reopen from the footer after a reload to verify the undecided choice is not persisted.
     counts.serverMetaEvents.length=0;counts.firstPartyEvents=0;
     await page.reload({waitUntil:'domcontentloaded'});await page.locator('.hero').waitFor();await page.evaluate(()=>document.fonts.ready);
    }
    check('Reading details does not change consent',await page.evaluate(()=>localStorage.getItem('partyprint-consent-v1'))===savedBefore);
    await page.setViewportSize({width:scenario.width,height:900});
    if(scenario.name==='Strict buffered approval')console.log('CONSENT_COMPACT_SCREENSHOT '+(await page.screenshot({type:'jpeg',quality:65})).toString('base64'));
   }
   if(scenario.denied){
    const s=await snapshot();
    check('Stored refusal loads no Google or Meta tag',counts.googleScripts===0&&counts.metaScripts===0);
    check('Stored refusal emits no page event or server CAPI',eventCount(s,'page_view')===0&&metaEvents(s).length===0&&counts.firstPartyEvents===0&&counts.serverMetaEvents.length===0);
    check('Stored refusal does not reopen notice',await page.locator('.consent-banner').count()===0);
    await page.goto(base+'/privacy-policy',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();
    check('Settings reopen on policy page with shared tokens',await page.locator('.consent-banner').evaluate(el=>getComputedStyle(el).fontFamily.includes('Assistant')&&getComputedStyle(el).maxWidth==='440px'));
    await page.getByRole('button',{name:'פרטים',exact:true}).click();
    check('Saved refusal remains visible in expanded settings',await page.locator('.consent-details').innerText().then(text=>text.includes('המדידה כבויה')));
   }else{
    await page.waitForFunction(()=>window.dataLayer?.some(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]==='page_view'));
    let s=await snapshot();
    check('Exactly one initial GA page view',eventCount(s,'page_view')===1);
    const loc=s.ga.find(x=>x[0]==='event'&&x[1]==='page_view')?.[2]?.page_location||'';
    check('Campaign retained and personal query fields removed',loc.includes('utm_source=measurement_qa')&&!/email=|phone=|order_id=|example.invalid/.test(loc));
    const off=s.meta.findIndex(x=>x[0]==='set'&&x[1]==='autoConfig'&&x[2]===false),init=s.meta.findIndex(x=>x[0]==='init');
    check('Automatic Meta configuration is off before init',off>=0&&off<init);
    check('PageView is the only event sent before a choice',metaEvents(s).length===1&&metaEvents(s)[0][1]==='PageView');
    check('No Meta consent grant occurs before visitor approval',!s.meta.some(x=>x[0]==='consent'&&x[1]==='grant'));
    check('No server CAPI event is sent before approval',counts.serverMetaEvents.length===0);
    const form=page.locator('#order-form');await form.scrollIntoViewIfNeeded();
    await form.getByRole('button',{name:'מגניב, ממשיכים לפרטים!',exact:true}).click();
    s=await snapshot();
    if(scenario.mode==='strict'){
     check('Strict mode holds interactions before approval',eventCount(s,'begin_order_request')===0&&metaEvents(s).length===1);
    }else{
     check('Notice mode sends only safe behavior events before approval',metaEvents(s).some(x=>x[1]==='InitiateCheckout')&&metaEvents(s).some(x=>x[1]==='FormStep')&&!metaEvents(s).some(x=>x[1]==='Lead'||x[1]==='FormStart'));
     check('Notice mode does not send GA interactions before approval',eventCount(s,'begin_order_request')===0);
    }
    if(scenario.refuse){
     await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();
     const banner=page.getByRole('region',{name:'הגדרות פרטיות',exact:true});
     await banner.getByRole('button',{name:'לא, תודה',exact:true}).click();
     s=await snapshot();
     check('Refusal drops the buffered queue and leaves only PageView',eventCount(s,'page_view')===1&&eventCount(s,'begin_order_request')===0&&metaEvents(s).filter(x=>x[1]!=='PageView').length===0);
     check('Refusal sends no first-party or CAPI events',counts.firstPartyEvents===0&&counts.serverMetaEvents.length===0);
     await page.evaluate(()=>{const link=document.createElement('a');link.href='mailto:qa@example.invalid';link.addEventListener('click',event=>event.preventDefault());document.body.append(link);link.click();link.remove();});
     s=await snapshot();
     check('Refusal stops later events after dropping the queue',eventCount(s,'page_view')===1&&metaEvents(s).length===1&&counts.serverMetaEvents.length===0);
     check('No unhandled client exception',clientErrors.length===0);
     check('No network write was forwarded',counts.networkWrites===0);
     continue;
    }
    if(!scenario.late){await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();await page.getByRole('button',{name:'אישור',exact:true}).click();}
    if(!scenario.late){
     await page.waitForFunction(()=>window.dataLayer?.some(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]==='begin_order_request'));
     await page.waitForFunction(()=>window.fbq?.queue?.some(x=>x[0]==='trackCustom'&&x[1]==='FormStart'));
     s=await snapshot();
     const checkouts=metaEvents(s).filter(x=>x[1]==='InitiateCheckout'),starts=metaEvents(s).filter(x=>x[1]==='FormStart');
     check('Approval grants Meta consent',s.meta.some(x=>x[0]==='consent'&&x[1]==='grant'));
     check('Approval flushes InitiateCheckout and FormStart once each',checkouts.length===1&&starts.length===1);
     const beginGa=s.ga.find(x=>x[0]==='event'&&x[1]==='begin_order_request');
     check('InitiateCheckout carries numeric quote value, original event_time and unique eventID',typeof checkouts[0]?.[2]?.value==='number'&&checkouts[0]?.[2]?.currency==='ILS'&&Number.isInteger(checkouts[0]?.[2]?.num_items)&&Number.isInteger(checkouts[0]?.[2]?.event_time)&&!!checkouts[0]?.[3]?.eventID);
     check('GA and Pixel event parameters preserve the same original event_time',Number.isInteger(beginGa?.[2]?.event_time)&&checkouts[0]?.[2]?.event_time===beginGa?.[2]?.event_time);
     check('Standard checkout and custom FormStart use different eventIDs',checkouts[0]?.[3]?.eventID!==starts[0]?.[3]?.eventID);
    }
    await page.waitForFunction(()=>window.fbq?.queue?.some(x=>x[0]==='track'&&x[1]==='PageView'));
    s=await snapshot();
    check('Approval does not duplicate GA or Meta PageView',eventCount(s,'page_view')===1&&metaEvents(s).filter(x=>x[1]==='PageView').length===1);
    await form.locator('input[name="name"]').fill('בדיקת פרטיות סינתטית');
    await form.locator('input[name="phone"]').fill('0500000000');
    await form.locator('input[name="email"]').fill('qa-measurement@example.invalid');
    for(let attempt=1;attempt<=3;attempt++){
     await form.getByRole('button',{name:'שומרים פרטים וממשיכים לרעיון',exact:true}).click();
     await page.waitForFunction(n=>window.dataLayer?.filter(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]===(n<3?'contact_save_error':'generate_lead')).length>=(n<3?n:1),attempt);
     s=await snapshot();
     check(attempt===1?'Failed contact save emits no lead':attempt===2?'Missing contact confirmation emits no lead':'Confirmed contact save emits exactly one lead',eventCount(s,'generate_lead')===(attempt===3?1:0));
    }
    check('No complete order is created before optional idea step',counts.mockOrders===0&&await form.locator('.pp-contact-saved').isVisible());
    const leadBufferedAt=Date.now();
    s=await snapshot();
    let approvalAt=0;
    if(scenario.late){check('No Meta lead before explicit consent',metaEvents(s).filter(x=>x[1]==='Lead').length===0);await page.waitForTimeout(2100);approvalAt=Date.now();await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();await page.getByRole('button',{name:'אישור',exact:true}).click();await page.waitForFunction(()=>window.fbq?.queue?.some(x=>x[1]==='Lead'));s=await snapshot();}
    check('Captured contact emits one Meta Lead when consent permits',metaEvents(s).filter(x=>x[1]==='Lead').length===1);
     const leadData=metaEvents(s).find(x=>x[1]==='Lead')?.[2];
     const expectedPack=['family_birthday','bride_squad','groom_crew','team','custom','single'][capturedContact.details.package];
     check('Lead carries discounted quote value, currency, quantity and package content ID',typeof leadData?.value==='number'&&leadData?.currency==='ILS'&&leadData?.num_items===capturedContact.details.quantity&&Array.isArray(leadData?.content_ids)&&leadData.content_ids[0]===expectedPack);
     const detailsStep=metaEvents(s).find(x=>x[1]==='FormStep'&&x[2]?.step_name==='details');
     check('Details FormStep includes content_name=details',detailsStep?.[2]?.content_name==='details');
     check('GA details step includes content_name=details',s.ga.some(x=>x[0]==='event'&&x[1]==='form_step'&&x[2]?.step_name==='details'&&x[2]?.content_name==='details'));
     for(let i=0;i<20&&!counts.serverMetaEvents.some(x=>x.event_name==='Lead');i++)await page.waitForTimeout(25);
     const leadServer=counts.serverMetaEvents.filter(x=>x.event_name==='Lead');
     const leadPixel=metaEvents(s).filter(x=>x[1]==='Lead');
     check('Server Lead shares browser eventID and original event time',leadServer.length===1&&leadPixel.length===1&&leadServer[0]?.event_id===leadPixel[0]?.[3]?.eventID&&Number.isInteger(leadServer[0]?.event_time));
     if(scenario.late)check('CAPI uses the contact-save time, not late approval time',Math.abs(leadServer[0]?.event_time-Math.floor(leadBufferedAt/1000))<=2&&leadServer[0]?.event_time<Math.floor(approvalAt/1000));
     check('Server Lead payload excludes raw contact details',leadServer.length===1&&!JSON.stringify(leadServer[0]).includes('qa-measurement@example.invalid')&&!JSON.stringify(leadServer[0]).includes('0500000000'));
    for(let attempt=1;attempt<=3;attempt++){
     await form.getByRole('button',{name:'יאללה, הופכים את הרעיון לחולצה!',exact:true}).click();
     await page.waitForFunction(n=>window.dataLayer?.filter(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]===(n<3?'form_submit_error':'complete_order_request')).length>=(n<3?n:1),attempt);
     s=await snapshot();
     check(attempt===1?'Final server error keeps the saved lead without completion':attempt===2?'Missing final confirmation is not completion':'Final confirmation emits one completion',eventCount(s,'generate_lead')===1&&eventCount(s,'complete_order_request')===(attempt===3?1:0));
    }
    s=await snapshot();
    check('Final completion does not duplicate the contact Lead',metaEvents(s).filter(x=>x[1]==='Lead').length===1&&metaEvents(s).filter(x=>x[1]==='RequestComplete').length===1&&metaEvents(s).filter(x=>x[1]==='SubmitApplication').length===1);
    const application=metaEvents(s).find(x=>x[1]==='SubmitApplication')?.[2];
    check('SubmitApplication carries the Lead price fields and its own eventID',typeof application?.value==='number'&&application.currency==='ILS'&&application.value===leadData?.value&&application.num_items===leadData?.num_items&&!!metaEvents(s).find(x=>x[1]==='SubmitApplication')?.[3]?.eventID);
    const leadEvents=metaEvents(s).filter(x=>x[1]==='Lead');const measuredData=JSON.stringify({ga:s.ga,meta:metaEvents(s).map(x=>x[2])});check('Raw contact fields stay out of browser event parameters; opaque UUID is used only as Meta eventID',!measuredData.includes('qa-measurement@example.invalid')&&!measuredData.includes('0500000000')&&!measuredData.includes(capturedContact.id)&&leadEvents.length===1&&leadEvents[0][3]?.eventID===capturedContact.id);
    check('Quote start keeps both standard checkout and custom start events without duplicates',metaEvents(s).filter(x=>x[1]==='InitiateCheckout').length===1&&metaEvents(s).filter(x=>x[1]==='FormStart').length===1);
     check('Every server event has a matching browser eventID',counts.serverMetaEvents.every(e=>metaEvents(s).some(x=>x[1]===e.event_name&&x[3]?.eventID===e.event_id)));
     check('Consent refusal blocks server CAPI events',!scenario.denied||counts.serverMetaEvents.length===0);
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.dataLayer?.some(x=>Array.from(x)[1]==='page_view'));
    s=await snapshot();check('Reload emits no duplicate lead or completion',eventCount(s,'generate_lead')===0&&eventCount(s,'complete_order_request')===0&&metaEvents(s).filter(x=>x[1]==='Lead'||x[1]==='RequestComplete').length===0);
    check('Contact values are absent from analytics payloads',!/[א-ת]{2,}\sפרטיות|0500000000|qa-measurement|example.invalid/.test(JSON.stringify(s)));
    check('Meta init has no advanced matching contact argument',s.meta.filter(x=>x[0]==='init').every(x=>x.length===2));
    await page.evaluate(()=>{document.cookie='_ga=qa; path=/';document.cookie='_fbp=qa; path=/';});
    await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();
    await page.getByRole('button',{name:'לא, תודה',exact:true}).click();
    s=await snapshot();const beforeGA=s.ga.filter(x=>x[0]==='event').length,beforeMeta=metaEvents(s).length,beforeCounter=counts.firstPartyEvents,beforeCapi=counts.serverMetaEvents.length;
    check('Refusal disables GA and revokes Meta consent',s.disabled&&s.meta.some(x=>x[0]==='consent'&&x[1]==='revoke'));
    check('Refusal clears measurement cookies',await page.evaluate(()=>!document.cookie.split(';').some(x=>/^\s*_(?:ga|fbp)=/.test(x))));
    await page.evaluate(()=>{const link=document.createElement('a');link.href='mailto:qa@example.invalid';link.addEventListener('click',event=>event.preventDefault());document.body.append(link);link.click();link.remove();});
    s=await snapshot();
    check('Refusal stops further measurement events',s.ga.filter(x=>x[0]==='event').length===beforeGA&&metaEvents(s).length===beforeMeta&&counts.firstPartyEvents===beforeCounter&&counts.serverMetaEvents.length===beforeCapi);
    const oldGoogle=counts.googleScripts,oldMeta=counts.metaScripts;
    await page.reload({waitUntil:'networkidle'});
    check('Refusal persists on reload',counts.googleScripts===oldGoogle&&counts.metaScripts===oldMeta);
   }
   check('No unhandled client exception',clientErrors.length===0);
   check('No network write was forwarded',counts.networkWrites===0);
  }catch(e){report.errors.push({scenario:scenario.name,message:e.message.slice(0,700),clientErrors});}
  finally{releasePromo();report.scenarios.push({name:scenario.name,checks,counts,promoLayout,consentLayouts,clientErrors});await context.close();}
 }
}finally{await browser.close();}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/measurement-contract-'+(base.includes('127.0.0.1')?'local':'production')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
