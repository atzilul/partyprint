import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||process.cwd())+'/package.json');
const {chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected audit origin');
const gaId='G-PARTYPRINTQA',pixel='9999999999999999';
const report={base,at:new Date().toISOString(),scope:'Isolated client contract: synthetic contact fields, mocked analytics vendors and mocked order responses; no network writes or emails',scenarios:[],errors:[]};
if(!base.includes('127.0.0.1')){const expected=createBuildIdentity(),live=await fetch(base+'/api/release').then(r=>r.json());report.release={expectedFingerprint:expected.sourceFingerprint,publicFingerprint:live.sourceFingerprint,publicCommit:live.sourceCommit};if(expected.sourceState!=='clean'||live.sourceState!=='clean'||expected.sourceFingerprint!==live.sourceFingerprint){report.status='waiting_for_matching_deployment';await mkdir('artifacts',{recursive:true});await writeFile('artifacts/measurement-contract-production.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exit(0);}}
const browser=await chromium.launch({headless:true});
try{
 for(const scenario of [{name:'Israel notice',country:'IL',timezone:'Asia/Jerusalem',width:390},{name:'Strict Meta region',country:'DE',timezone:'Europe/Berlin',width:1366},{name:'Late approval after saved receipt',country:'IL',timezone:'Asia/Jerusalem',width:390,late:true},{name:'Stored refusal',country:'IL',timezone:'Asia/Jerusalem',width:320,denied:true}]){
  const context=await browser.newContext({viewport:{width:scenario.width,height:900},locale:'he-IL',timezoneId:scenario.timezone,reducedMotion:'reduce'});
  await context.addInitScript(({denied})=>{
   if(location.pathname==='/')history.replaceState(null,'','/?utm_source=measurement_qa&email=qa%40example.invalid&phone=0500000000&order_id=private-fixture');
   if(denied)localStorage.setItem('partyprint-consent-v1',JSON.stringify({analytics:'denied',at:Date.now()}));
  },{denied:!!scenario.denied});
  const page=await context.newPage(),checks=[],clientErrors=[];
  const counts={mockOrders:0,firstPartyEvents:0,googleScripts:0,metaScripts:0,blockedWrites:0,networkWrites:0};
  let releasePromo;
  const promoGate=new Promise(resolve=>{releasePromo=resolve;});
  page.on('pageerror',e=>clientErrors.push(e.message.slice(0,200)));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method();
   if(url.origin===base&&url.pathname==='/api/analytics-config')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({measurementId:gaId,metaPixelId:pixel,country:scenario.country})});
   if(url.origin===base&&url.pathname==='/api/promo'){await promoGate;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'הטבה לקבוצה שלכם עם אישור העיצוב לפני ההדפסה',code:'QA-PROMO'})});}
   if(url.hostname==='www.googletagmanager.com'&&method==='GET'){counts.googleScripts++;return route.fulfill({status:200,contentType:'application/javascript',body:'/* vendor intentionally stubbed */'});}
   if(url.hostname==='connect.facebook.net'&&method==='GET'){counts.metaScripts++;return route.fulfill({status:200,contentType:'application/javascript',body:'/* vendor intentionally stubbed */'});}
   if(!['GET','HEAD','OPTIONS'].includes(method)){
    if(url.origin===base&&url.pathname==='/api/events'){counts.firstPartyEvents++;return route.fulfill({status:204,body:''});}
    if(url.origin===base&&url.pathname==='/api/orders'){
     counts.mockOrders++;
     const response=counts.mockOrders===1?{status:500,body:{error:'כשל מדומה לבדיקת הממשק'}}:counts.mockOrders===2?{status:200,body:{ok:true}}:{status:201,body:{id:'12345678-1234-4234-8234-123456789abc',summary:'בדיקת ממשק בלבד; לא נוצרה הזמנה',emailSent:false}};
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
  let promoLayout=null;
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
   if(scenario.denied){
    const s=await snapshot();
    check('Stored refusal loads no Google or Meta tag',counts.googleScripts===0&&counts.metaScripts===0);
    check('Stored refusal emits no page event',eventCount(s,'page_view')===0&&metaEvents(s).length===0&&counts.firstPartyEvents===0);
   }else{
    await page.waitForFunction(()=>window.dataLayer?.some(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]==='page_view'));
    let s=await snapshot();
    check('Exactly one initial GA page view',eventCount(s,'page_view')===1);
    const loc=s.ga.find(x=>x[0]==='event'&&x[1]==='page_view')?.[2]?.page_location||'';
    check('Campaign retained and personal query fields removed',loc.includes('utm_source=measurement_qa')&&!/email=|phone=|order_id=|example.invalid/.test(loc));
    if(scenario.country==='IL'){
     check('Israel notice sends PageView only before choice',metaEvents(s).length===1&&metaEvents(s)[0][1]==='PageView');
     const off=s.meta.findIndex(x=>x[0]==='set'&&x[1]==='autoConfig'&&x[2]===false),init=s.meta.findIndex(x=>x[0]==='init');
     check('Automatic Meta configuration is off before init',off>=0&&off<init);
    }else check('Strict Meta region loads no pixel before approval',counts.metaScripts===0&&s.meta.length===0);
    if(!scenario.late)await page.getByRole('button',{name:'אישור',exact:true}).click();
    await page.waitForFunction(()=>window.fbq?.queue?.some(x=>x[0]==='track'&&x[1]==='PageView'));
    s=await snapshot();
    check('Approval does not duplicate GA or Meta PageView',eventCount(s,'page_view')===1&&metaEvents(s).filter(x=>x[1]==='PageView').length===1);
    const form=page.locator('#order-form');await form.scrollIntoViewIfNeeded();
    await form.getByRole('button',{name:'המשך לפרטי קשר',exact:true}).click();
    await form.locator('input[name="name"]').fill('בדיקת פרטיות סינתטית');
    await form.locator('input[name="phone"]').fill('0500000000');
    await form.locator('.optional-order-details summary').click();
    await form.locator('input[name="email"]').fill('qa-measurement@example.invalid');
    for(let attempt=1;attempt<=3;attempt++){
     await form.getByRole('button',{name:'שליחת הפנייה',exact:true}).click();
     await page.waitForFunction(n=>window.dataLayer?.some(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]===(n<3?'form_submit_error':'generate_lead')),attempt);
     if(attempt===1)await form.getByRole('button',{name:'שליחת הפנייה',exact:true}).waitFor({state:'visible'});
     if(attempt===2)await page.waitForFunction(()=>window.dataLayer?.filter(x=>Array.from(x)[0]==='event'&&Array.from(x)[1]==='form_submit_error').length===2);
     s=await snapshot();
     check(attempt===1?'Server error emits no lead':attempt===2?'Missing save confirmation emits no lead':'Save confirmation emits exactly one lead',eventCount(s,'generate_lead')===(attempt===3?1:0));
    }
    s=await snapshot();
    check('Saved receipt contains no personal data in measurement',!JSON.stringify(s).includes('qa-measurement@example.invalid')&&!JSON.stringify(s).includes('0500000000')&&!JSON.stringify(s).includes('12345678-1234-4234-8234-123456789abc'));
    check('Quote start uses custom FormStart rather than checkout',metaEvents(s).every(x=>x[1]!=='InitiateCheckout')&&(scenario.late||metaEvents(s).some(x=>x[1]==='FormStart')));
    if(scenario.late){check('No Meta lead before explicit consent',metaEvents(s).filter(x=>x[1]==='Lead').length===0);await page.getByRole('button',{name:'אישור',exact:true}).click();await page.waitForFunction(()=>window.fbq?.queue?.some(x=>x[1]==='Lead'));s=await snapshot();}
    check('Saved receipt emits one Meta Lead when consent permits',metaEvents(s).filter(x=>x[1]==='Lead').length===1);
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.dataLayer?.some(x=>Array.from(x)[1]==='page_view'));
    s=await snapshot();check('Refreshing thanks does not emit another GA or Meta lead',eventCount(s,'generate_lead')===0&&metaEvents(s).filter(x=>x[1]==='Lead').length===0);
    // Reload resets vendor queues; prior exactly-once assertion was above.
    check('Reload retains local conversion deduplication',metaEvents(s).filter(x=>x[1]==='Lead').length===0);
    check('Contact values and response ID are absent from analytics payloads',!/[א-ת]{2,}\sפרטיות|0500000000|qa-measurement|example.invalid|12345678-1234-4234-8234-123456789abc/.test(JSON.stringify(s)));
    check('Meta init has no advanced-matching contact argument',s.meta.filter(x=>x[0]==='init').every(x=>x.length===2));
    await page.evaluate(()=>{document.cookie='_ga=qa; path=/';document.cookie='_fbp=qa; path=/';});
    await page.getByRole('button',{name:'הגדרות פרטיות ועוגיות',exact:true}).click();
    await page.getByRole('button',{name:'לא, תודה',exact:true}).click();
    s=await snapshot();const beforeGA=s.ga.filter(x=>x[0]==='event').length,beforeMeta=metaEvents(s).length,beforeCounter=counts.firstPartyEvents;
    check('Refusal disables GA and revokes Meta consent',s.disabled&&s.meta.some(x=>x[0]==='consent'&&x[1]==='revoke'));
    check('Refusal clears measurement cookies',await page.evaluate(()=>!document.cookie.split(';').some(x=>/^\s*_(?:ga|fbp)=/.test(x))));
    await page.evaluate(()=>{const link=document.createElement('a');link.href='mailto:qa@example.invalid';link.addEventListener('click',event=>event.preventDefault());document.body.append(link);link.click();link.remove();});
    s=await snapshot();
    check('Refusal stops further measurement events',s.ga.filter(x=>x[0]==='event').length===beforeGA&&metaEvents(s).length===beforeMeta&&counts.firstPartyEvents===beforeCounter);
    const oldGoogle=counts.googleScripts,oldMeta=counts.metaScripts;
    await page.reload({waitUntil:'networkidle'});
    check('Refusal persists on reload',counts.googleScripts===oldGoogle&&counts.metaScripts===oldMeta);
   }
   check('No unhandled client exception',clientErrors.length===0);
   check('No network write was forwarded',counts.networkWrites===0);
  }catch(e){report.errors.push({scenario:scenario.name,message:e.message.slice(0,700),clientErrors});}
  finally{releasePromo();report.scenarios.push({name:scenario.name,checks,counts,promoLayout,clientErrors});await context.close();}
 }
}finally{await browser.close();}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/measurement-contract-'+(base.includes('127.0.0.1')?'local':'production')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
