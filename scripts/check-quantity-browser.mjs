import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||process.cwd())+'/package.json');
const {chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected quantity audit origin');
const local=base.includes('127.0.0.1');
const report={base,at:new Date().toISOString(),scope:'Quantity/pricing client QA; synthetic contacts, mocked coupon/order replies; all external writes blocked',status:'pending',pricingSource:local?'isolated fixture':'live public pricing GET',screens:[],errors:[]};
const round=n=>Math.round(n*100)/100;
const fixture={version:0,shirtPrice:110,tiers:[{quantity:4,price:110},{quantity:6,price:105},{quantity:8,price:100},{quantity:10,price:95},{quantity:15,price:93},{quantity:20,price:90}],basePrices:[440,630,630,950],extraShirtPrice:110,customPrices:{5:550,10:950,15:1395,20:1800}};
async function audit(){
 if(!local){
  const identity=createBuildIdentity();
  let live=null;
  try{const response=await fetch(base+'/api/release',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(response.ok)live=await response.json()}catch{}
  report.release={expectedFingerprint:identity.sourceFingerprint,publicState:live?.sourceState??null,publicCommit:live?.sourceCommit??null,publicFingerprint:live?.sourceFingerprint??null};
  if(identity.sourceState!=='clean'||live?.sourceState!=='clean'||live.sourceFingerprint!==identity.sourceFingerprint){report.status='waiting_for_matching_deployment';return;}
 }
 const pricing=local?fixture:await fetch(base+'/api/pricing',{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async r=>{assert.equal(r.status,200,'Public pricing is available');return r.json()});
 assert.ok(Array.isArray(pricing.tiers)&&pricing.tiers.length>0,'Pricing exposes quantity tiers');
 const tiers=[...pricing.tiers].sort((a,b)=>a.quantity-b.quantity);
 const unit=n=>{let price=tiers[0].price;for(const tier of tiers)if(n>=tier.quantity)price=tier.price;return round(price)};
 const format=n=>new Intl.NumberFormat('he-IL').format(n);
 report.tiers=tiers;
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1366,height:900}]){
   const context=await browser.newContext({viewport,locale:'he-IL',timezoneId:'Asia/Jerusalem',reducedMotion:'reduce'});
   await context.addInitScript(()=>{localStorage.setItem('partyprint-consent-v1',JSON.stringify({analytics:'denied',at:Date.now()}))});
   const page=await context.newPage(),checks=[],pageErrors=[],payloads=[];
   let quoteMocks=0,orderMocks=0,blockedWrites=0,forwardedWrites=0;
   page.on('pageerror',e=>pageErrors.push(e.message.slice(0,250)));
   await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    if(local&&url.origin===base&&url.pathname==='/api/pricing'&&method==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(pricing)});
    if(!['GET','HEAD','OPTIONS'].includes(method)){
     if(url.origin===base&&url.pathname==='/api/pricing'){
      quoteMocks++;const body=request.postDataJSON(),subtotal=round(unit(body.quantity)*body.quantity),discount=round(subtotal*0.1);
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({code:'QA10',subtotal,discount,total:round(subtotal-discount)})});
     }
     if(url.origin===base&&url.pathname==='/api/orders'){
      orderMocks++;
      const data=await new Request(request.url(),{method:'POST',headers:{'content-type':request.headers()['content-type']},body:request.postDataBuffer()}).formData();
      const shirts=JSON.parse(String(data.get('shirts')));
      payloads.push({package:Number(data.get('package')),quantity:Number(data.get('quantity')),shirtCount:shirts.length,expectedPrice:Number(data.get('expectedPrice')),coupon:String(data.get('coupon'))});
      return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({id:'qa-quantity-only',summary:'בדיקת ממשק בלבד; לא נוצרה הזמנה',emailSent:false})});
     }
     blockedWrites++;return route.abort();
    }
    if(url.origin!==base&&!['data:','blob:'].includes(url.protocol))return route.abort();
    if(!['GET','HEAD','OPTIONS'].includes(method))forwardedWrites++;
    return route.continue();
   });
   const check=(name,ok)=>{assert.ok(ok,name);checks.push(name)};
   const form=page.locator('#order-form'),panel=form.locator('.order-quantity-panel'),quantity=page.locator('#order-shirt-quantity');
   async function verifyPrice(n){
    await page.waitForFunction(({unit,subtotal})=>document.querySelector('.order-quantity-unit')?.textContent===unit&&document.querySelector('.order-quantity-subtotal')?.textContent===subtotal,{unit:format(unit(n))+' ₪ לחולצה',subtotal:n+' חולצות · '+format(round(unit(n)*n))+' ₪ לפני קוד מבצע'});
    assert.equal(await quantity.inputValue(),String(n));
   }
   async function setQuantity(n){await quantity.fill(String(n));await quantity.blur();await verifyPrice(n)}
   async function shirt(index,sizeType,size,color){
    await page.locator('#shirt-row-'+index+' .shirt-row-summary').click();
    const editor=page.locator('#shirt-editor-'+index);
    await editor.getByRole('button',{name:sizeType==='child'?'ילד':'מבוגר',exact:true}).click();
    if(sizeType==='child')await editor.locator('select').selectOption(size);
    else await editor.locator('.size-pills label').filter({hasText:new RegExp('^'+size+'$')}).click();
    await editor.locator('.color-pills label').filter({hasText:new RegExp(color)}).click();
   }
   try{
    await page.goto(base+'/',{waitUntil:'networkidle',timeout:45000});
    await form.scrollIntoViewIfNeeded();await quantity.waitFor({state:'visible'});
    for(let pack=0;pack<5;pack++){
     await form.locator('.form-package-options label').nth(pack).click();
     await setQuantity(4);check('Package '+pack+' permits the shared minimum of four',await panel.getByRole('button',{name:'הפחתת חולצה',exact:true}).isDisabled());
     await setQuantity(7);check('Package '+pack+' permits intermediate quantities at the reached price tier',true);
    }
    for(const n of [4,5,6,7,8,9,10,14,15,19,20,21,100])await setQuantity(n);
    check('Tier thresholds and the quantities immediately below them use the configured prices',true);
    check('One hundred disables further increment',await panel.getByRole('button',{name:'הוספת חולצה',exact:true}).isDisabled());
    await quantity.fill('101');await quantity.blur();await verifyPrice(100);
    await quantity.fill('3');await quantity.blur();await verifyPrice(4);
    check('Typed quantities are clamped to the supported bounds',true);
    await quantity.fill('7');await quantity.press('Enter');await verifyPrice(7);
    check('Enter commits a quantity without advancing or submitting the form',await form.getByRole('button',{name:'הבא: חולצות',exact:true}).isVisible()&&orderMocks===0);
    await panel.getByRole('button',{name:'הוספת חולצה',exact:true}).click();await verifyPrice(8);
    await panel.getByRole('button',{name:'הפחתת חולצה',exact:true}).click();await verifyPrice(7);
    check('Increment and decrement update price immediately',true);
    await setQuantity(5);await form.getByRole('button',{name:'הבא: חולצות',exact:true}).click();
    await shirt(0,'adult','M','לבן');
    await page.locator('#shirt-selection').getByRole('button',{name:/החלת הבחירה מחולצה 1 על כולן/}).click();
    await shirt(1,'child','8','שחור');
    const progress=page.locator('#shirt-selection progress').first();
    await panel.getByRole('button',{name:'הוספת חולצה',exact:true}).click();await verifyPrice(6);
    check('Adding a shirt preserves existing choices and creates an unfilled shirt',await progress.getAttribute('value')==='5'&&await progress.getAttribute('max')==='6');
    await form.getByRole('button',{name:/המשך לפרטים/}).click();
    check('A newly added shirt must have a size and color before continuing',await page.locator('#shirt-selection').isVisible());
    await shirt(5,'adult','L','אפור');
    await setQuantity(4);await setQuantity(6);
    check('Reducing and increasing restores all previously selected shirts',await progress.getAttribute('value')==='6'&&await progress.getAttribute('max')==='6');
    await page.locator('#shirt-row-1 .shirt-row-summary').click();
    check('A child size and color survive quantity changes',await page.locator('#shirt-editor-1 select').inputValue()==='8'&&(await page.locator('#shirt-row-1').innerText()).includes('שחור'));
    await page.locator('#shirt-row-5 .shirt-row-summary').click();
    check('The removed last shirt is restored with its size and color',(await page.locator('#shirt-row-5').innerText()).includes('מבוגר L')&&(await page.locator('#shirt-row-5').innerText()).includes('אפור'));
    await form.getByRole('button',{name:/המשך לפרטים/}).click();
    await form.locator('input[name="name"]').fill('בדיקת כמות סינתטית');
    await form.locator('input[name="phone"]').fill('0500000000');
    await form.locator('input[name="email"]').fill('qa-quantity@example.invalid');
    await panel.getByRole('button',{name:'הוספת חולצה',exact:true}).click();await verifyPrice(7);
    await page.locator('#shirt-selection').waitFor({state:'visible'});
    check('Adding from the contact step returns to the shirt choices and preserves contact fields',await form.locator('input[name="name"]').inputValue()==='בדיקת כמות סינתטית');
    await shirt(6,'adult','M','לבן');await form.getByRole('button',{name:/המשך לפרטים/}).click();
    check('Contact fields remain after completing the added shirt',await form.locator('input[name="email"]').inputValue()==='qa-quantity@example.invalid');
    await form.getByRole('button',{name:'עריכת החבילה',exact:true}).click();
    await form.locator('.coupon-box > summary').click();
    await form.locator('.coupon-fields input').fill('QA10');
    await form.getByRole('button',{name:'הפעלת הקוד',exact:true}).click();
    await form.locator('.coupon-fields p[role="status"]').waitFor({state:'visible'});
    await setQuantity(8);
    check('Changing quantity invalidates the old coupon quote',await form.locator('.coupon-fields p[role="status"]').count()===0);
    await form.locator('.form-package-options label').nth(0).click();await verifyPrice(7);
    await form.locator('.form-package-options label').nth(4).click();await verifyPrice(8);
    check('Each package retains its own selected quantity',true);
    await form.getByRole('button',{name:'הבא: חולצות',exact:true}).click();
    await shirt(7,'adult','S','אפור');await setQuantity(7);
    await page.waitForFunction(()=>{try{const d=JSON.parse(localStorage.getItem('partyprint-draft-v1'));return d?.quantities?.[4]===7&&d?.shirtSets?.[4]?.length>=8}catch{return false}});
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#order-shirt-quantity')?.value==='7');
    await verifyPrice(7);
    check('An intermediate custom quantity and its cached choices restore after reload',(await form.locator('.form-package-options label.selected').innerText()).includes('הרעיון שלכם'));
    check('Draft restoration still excludes personal contact fields',await form.locator('input[name="name"]').inputValue()===''&&await form.locator('input[name="email"]').inputValue()==='');
    await form.getByRole('button',{name:'הבא: חולצות',exact:true}).click();
    check('Only active shirts count as selected after draft restoration',await progress.getAttribute('value')==='7'&&await progress.getAttribute('max')==='7');
    await form.getByRole('button',{name:/המשך לפרטים/}).click();
    await form.locator('input[name="name"]').fill('בדיקת כמות סינתטית');
    await form.locator('input[name="phone"]').fill('0500000000');
    await form.locator('input[name="email"]').fill('qa-quantity@example.invalid');
    await form.getByRole('button',{name:'שליחת הזמנה',exact:true}).click();
    await form.locator('.whatsapp-handoff').waitFor({state:'visible'});
    check('The mocked submission includes the chosen quantity and only active shirts',payloads.length===1&&payloads[0].package===4&&payloads[0].quantity===7&&payloads[0].shirtCount===7);
    check('The mocked submission uses the current reached-tier price and no stale coupon',payloads[0].expectedPrice===round(unit(7)*7)&&payloads[0].coupon==='');
    check('No live writes or unhandled client errors',forwardedWrites===0&&pageErrors.length===0);
    const box=await form.boundingBox();check('The form fits the viewport',!!box&&box.x>=-2&&box.x+box.width<=viewport.width+2);
   }catch(e){report.errors.push({viewport,message:e.message.slice(0,800),pageErrors})}
   finally{report.screens.push({viewport,checks,quoteMocks,orderMocks,blockedWrites,forwardedWrites,payloads,pageErrors});await context.close()}
  }
 }finally{await browser.close()}
 report.status=report.errors.length?'failed':'passed';
}
try{await audit()}catch(e){report.status='failed';report.errors.push({message:e.message.slice(0,800)})}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/quantity-browser-'+(local?'local':'production')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
