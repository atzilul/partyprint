import {createRequire} from 'node:module';
const require=createRequire('/tmp/partyprint-browser/package.json'),{chromium}=require('playwright');
const base='https://partyprint.co.il',browser=await chromium.launch({headless:true});
const release=await fetch(base+'/api/release',{cache:'no-store'}).then(r=>r.json());const report={at:new Date().toISOString(),release,screens:[],writesForwarded:0};
try{for(const width of [320,375,414,768,1366]){const context=await browser.newContext({viewport:{width,height:900},locale:'he-IL',timezoneId:'Asia/Jerusalem',reducedMotion:'reduce'});await context.addInitScript(()=>localStorage.setItem('partyprint-consent-v1',JSON.stringify({analytics:'denied',at:Date.now()})));
let releaseCoupon;const gate=new Promise(resolve=>releaseCoupon=resolve);let writesBlocked=0;
await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(r.method()==='POST'&&u.pathname==='/api/pricing'){await gate;return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'בדיקת ממשק בלבד'})});}if(r.method()!=='GET'){writesBlocked++;return route.abort();}return u.origin===base?route.continue():route.abort();});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});const form=page.locator('#order-form');await form.evaluate(e=>e.scrollIntoView({block:'start'}));await page.waitForTimeout(200);
const before={height:await form.evaluate(e=>Math.round(e.getBoundingClientRect().height)),title:await page.title(),visibleButtons:await form.getByRole('button').count(),textLength:await form.innerText().then(x=>x.length),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
if(width===375)console.log('UX_BEFORE_PACKAGE '+(await page.locator('.request-form-card').screenshot({type:'jpeg',quality:65})).toString('base64'));
const q=form.locator('#order-shirt-quantity');await q.fill('7');await q.blur();await form.getByRole('combobox',{name:'בחירת חבילה',exact:true}).selectOption('0');const countAfterOccasion=await q.inputValue();
await form.locator('.coupon-entry summary').click();await form.locator('#request-coupon').fill('QA-HOLD');await form.getByRole('button',{name:'החלת קוד',exact:true}).click();const blockedByCoupon=await form.getByRole('button',{name:'המשך לפרטי קשר',exact:true}).isDisabled();releaseCoupon();await page.waitForTimeout(250);await form.getByRole('button',{name:'המשך לפרטי קשר',exact:true}).click();
if(width===375)console.log('UX_BEFORE_CONTACT '+(await page.locator('.request-form-card').screenshot({type:'jpeg',quality:65})).toString('base64'));
report.screens.push({width,before,countAfterOccasion,blockedByCoupon,contactHeight:await form.evaluate(e=>Math.round(e.getBoundingClientRect().height)),writesBlocked,errors});await context.close();}}finally{await browser.close();}
console.log('UX_BASELINE '+JSON.stringify(report));
