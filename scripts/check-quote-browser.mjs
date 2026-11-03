import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||'/tmp/partyprint-browser')+'/package.json'),{chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected QA origin');
const local=base.startsWith('http:'),round=n=>Math.round(n*100)/100,trackingToken='a'.repeat(64);
const FIRST='מגניב, ממשיכים לפרטים!',CONTACT='שומרים פרטים וממשיכים לרעיון',FINAL='יאללה, הופכים את הרעיון לחולצה!';
const image={name:'qa.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1QAAAAASUVORK5CYII=','base64')};
export async function checkQuoteBrowser(kind){
 const report={kind,base,at:new Date().toISOString(),scope:'Synthetic client QA: contacts, orders, quotes, tracking and vendors intercepted; no real records or mail',status:'pending',screens:[],errors:[]};
 const save=async()=>{await mkdir('artifacts',{recursive:true});await writeFile('artifacts/'+kind+'-'+(local?'local':'production')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));};
 const expected=createBuildIdentity();
 if(!local){const live=await fetch(base+'/api/release',{cache:'no-store'}).then(r=>r.json());report.release={expectedFingerprint:expected.sourceFingerprint,publicFingerprint:live.sourceFingerprint,publicCommit:live.sourceCommit,publicState:live.sourceState};if(expected.sourceState!=='clean'||live.sourceState!=='clean'||expected.sourceFingerprint!==live.sourceFingerprint){report.status='waiting_for_matching_deployment';await save();return;}}
 const pricing=local?{singleShirtPrice:180,version:0,shirtPrice:110,tiers:[{quantity:4,price:110},{quantity:6,price:105},{quantity:8,price:100},{quantity:10,price:95},{quantity:15,price:93},{quantity:20,price:90}],basePrices:[440,630,630,950],extraShirtPrice:110,customPrices:{5:550,10:950,15:1395,20:1800}}:await fetch(base+'/api/pricing').then(r=>r.json());
 const actualPromotion=local?null:await fetch(base+'/api/promo').then(r=>r.json());
 const browser=await chromium.launch({headless:true});
 try{for(const viewport of kind==='quantity-browser'?[{width:375,height:844},{width:1366,height:900}]:[{width:320,height:800},{width:375,height:844},{width:414,height:896},{width:768,height:1024},{width:1366,height:900}]){
  const context=await browser.newContext({viewport,locale:'he-IL',timezoneId:'Asia/Jerusalem',reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('partyprint-consent-v1',JSON.stringify({analytics:'denied',at:Date.now()})));
  const page=await context.newPage(),checks=[],clientErrors=[],payloads=[],contacts=new Map(),orders=new Map();
  let contactWrites=0,orderMocks=0,patchMocks=0,quoteMocks=0,blockedWrites=0,forwardedWrites=0,failContact=false,failSave=false,priceConflict=false,sizeConflict=false,locked=false,quoteDelay=0,orderDelay=0,serverQuantity=0,forcedPricing=null,promoMode='fixture',currentOrder=null;
  const unit=n=>n===1?(forcedPricing||pricing).singleShirtPrice??180:[...(forcedPricing||pricing).tiers].sort((a,b)=>b.quantity-a.quantity).find(t=>n>=t.quantity)?.price??(forcedPricing||pricing).tiers[0].price;
  page.on('pageerror',e=>clientErrors.push(e.message));
  const respond=(route,v,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(v)});
  await context.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url()),method=req.method();
   if((local||forcedPricing)&&u.origin===base&&u.pathname==='/api/pricing'&&method==='GET')return respond(route,forcedPricing||pricing);
   if(u.origin===base&&u.pathname==='/api/promo')return respond(route,promoMode==='empty'?{text:'',code:''}:promoMode==='actual'?actualPromotion:{code:'QA10',text:'בדיקת השקה'});
   if(u.origin===base&&u.pathname==='/api/pricing'&&method==='POST'){quoteMocks++;const v=req.postDataJSON(),subtotal=round(unit(v.quantity)*v.quantity);await new Promise(r=>setTimeout(r,quoteDelay||15));return respond(route,{code:v.code,subtotal,discount:round(subtotal*.1),total:round(subtotal*.9)});}
   if(u.origin===base&&u.pathname==='/api/contacts'&&method==='POST'){
    const v=req.postDataJSON(),row=contacts.get(v.id);
    if(v.action==='read')return row&&row.token===v.token?respond(route,{saved:true,id:v.id,version:row.version,details:row.details,completed:orders.has(v.id),mailStatus:'accepted'}):respond(route,{error:'not found'},404);
    contactWrites++;if(failContact)return respond(route,{error:'שמירת פרטים נכשלה — בדיקה מדומה'},503);
    const details={name:v.name,phone:v.phone,email:v.email,package:v.package,quantity:v.quantity,mode:v.mode,eventDate:v.eventDate,source:v.source,shirts:v.shirts};
    if(!row)contacts.set(v.id,{token:v.token,version:1,details});else if(JSON.stringify(row.details)!==JSON.stringify(details)){row.details=details;row.version++;}
    return respond(route,{saved:true,id:v.id,version:contacts.get(v.id).version,details,mailStatus:'accepted'},row?200:201);
   }
   if(u.origin===base&&u.pathname==='/api/orders'&&method==='POST'){
    orderMocks++;const f=await new Request(req.url(),{method:'POST',headers:{'content-type':req.headers()['content-type']},body:req.postDataBuffer()}).formData();
    const v={contactId:String(f.get('contactId')),package:Number(f.get('package')),quantity:Number(f.get('quantity')),name:String(f.get('name')),email:String(f.get('email')),brief:String(f.get('brief')),eventDate:f.get('eventDate'),shirts:JSON.parse(f.get('shirts')),shirtDetailsStatus:f.get('shirtDetailsStatus'),expectedPrice:Number(f.get('expectedPrice')),coupon:String(f.get('coupon')),imagesCount:f.getAll('images').length};payloads.push(v);
    const contact=contacts.get(v.contactId);assert(contact&&contact.token===f.get('contactToken'),'Completion uses the saved contact capability');
    if(orderDelay)await new Promise(r=>setTimeout(r,orderDelay));
    if(priceConflict){priceConflict=false;forcedPricing={...pricing,tiers:pricing.tiers.map(t=>({...t,price:t.price+1}))};return respond(route,{error:'המחיר עודכן. בדקו את הסכום החדש ושלחו שוב.'},409);}
    if(failSave)return respond(route,{error:'כשל מדומה. הפרטים נשארו שמורים.'},503);
    if(!orders.has(v.contactId))orders.set(v.contactId,{...v,id:v.contactId,version:2,price:v.expectedPrice});
    currentOrder=orders.get(v.contactId);
    return respond(route,{id:currentOrder.id,summary:'Synthetic saved request',quantity:currentOrder.quantity,price:currentOrder.price,imagesCount:currentOrder.imagesCount,shirtDetailsStatus:currentOrder.shirtDetailsStatus,trackingUrl:base+'/track/'+currentOrder.id+'#'+trackingToken,customerEmailSent:false,emailSent:false},201);
   }
   if(u.origin===base&&u.pathname.startsWith('/api/track/')){
    assert(currentOrder&&u.pathname==='/api/track/'+currentOrder.id&&u.searchParams.get('token')===trackingToken);
    if(method==='GET')return respond(route,{quantity:serverQuantity||currentOrder.quantity,price:currentOrder.price,version:currentOrder.version,shirts:currentOrder.shirts,shirtDetailsStatus:currentOrder.shirtDetailsStatus,canEditShirts:!locked});
    if(method==='PATCH'){patchMocks++;const v=req.postDataJSON();assert.equal(v.version,currentOrder.version);if(sizeConflict){sizeConflict=false;currentOrder.version++;return respond(route,{error:'הפנייה עודכנה. רעננו בלי לאבד בחירות.'},409);}currentOrder.shirts=v.shirts;currentOrder.shirtDetailsStatus='complete';currentOrder.version++;return respond(route,{version:currentOrder.version,shirts:v.shirts,shirtDetailsStatus:'complete'});}
   }
   if(!['GET','HEAD','OPTIONS'].includes(method)){blockedWrites++;return route.abort();}
   if(u.origin!==base&&!['blob:','data:'].includes(u.protocol))return route.abort();
   return route.continue();
  });
  const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
  const form=page.locator('#order-form'),q=form.locator('#order-shirt-quantity');
  const stage=async n=>page.waitForFunction(n=>document.querySelector('.pp-request')?.dataset.step===String(n),n);
  const setQ=async n=>{await q.fill(String(n));await q.blur();await page.waitForFunction(n=>document.querySelector('#order-shirt-quantity')?.value===String(n),n);};
  const verifyPrice=async(n,discount=0)=>page.waitForFunction(v=>document.querySelector('.request-price .pp-price-amount strong')?.textContent.replace(/[^0-9.]/g,'')===String(v),round(unit(n)*n*(1-discount)));
  const toShirts=async()=>{await form.getByRole('button',{name:'שלב 1: החולצות',exact:true}).click();await stage(1);};
  const toContacts=async()=>{if(await form.getByRole('button',{name:FIRST,exact:true}).isVisible()){await form.getByRole('button',{name:FIRST,exact:true}).click();}else if(await form.getByRole('button',{name:'עריכת פרטי הקשר',exact:true}).isVisible()){await form.getByRole('button',{name:'עריכת פרטי הקשר',exact:true}).click();}await stage(2);};
  const fillContact=async()=>{await toContacts();await form.locator('#request-name').fill('Synthetic QA');await form.locator('#request-phone').fill('0500000000');await form.locator('#request-email').fill('qa-contact@example.invalid');};
  const toIdea=async()=>{await form.getByRole('button',{name:CONTACT,exact:true}).click();await stage(3);};
  const sendFinal=async()=>form.getByRole('button',{name:FINAL,exact:true}).click();
  let initialHeight=null,contactHeight=null;
  try{
   await page.goto(base+'/',{waitUntil:'networkidle',timeout:45000});await form.scrollIntoViewIfNeeded();
   check('Request starts at four without a separate single-shirt selector',await q.inputValue()==='4'&&await form.locator('.pp-product-choice').count()===0);
   check('Progress starts at shirt selection',await form.getByRole('progressbar',{name:'ההתקדמות שלכם',exact:true}).getAttribute('aria-valuenow')==='1');
   const sizeEntry=await form.locator('.pp-size-entry').evaluate(el=>{const s=getComputedStyle(el),b=getComputedStyle(el.querySelector('b'));return {height:el.getBoundingClientRect().height,border:parseFloat(s.borderTopWidth),shadow:s.boxShadow,bold:b.fontWeight};});
   check('Sizing entry has a distinct filled surface, strong border and touch target',sizeEntry.height>=88&&sizeEntry.border===2&&sizeEntry.shadow!=='none'&&Number(sizeEntry.bold)>=700);
   check('Reduced motion disables stage entrance',await form.locator('.pp-stage-heading').evaluate(el=>getComputedStyle(el).animationName==='none'));
   if(kind==='ux-browser'&&viewport.width===375){
    await page.emulateMedia({reducedMotion:'no-preference'});await toContacts();
    check('Stage change uses a brief entrance when motion is allowed',await form.locator('.pp-stage-heading').evaluate(el=>getComputedStyle(el).animationName==='pp-stage-reveal'));
    await toShirts();await page.emulateMedia({reducedMotion:'reduce'});
   }
   if(kind==='quantity-browser'){
    for(let p=0;p<5;p++){await form.getByRole('combobox',{name:'בחירת חבילה',exact:true}).selectOption(String(p));for(const n of [1,2,3,4,5,6,7,8,9,10,14,15,19,20,21,100]){await setQ(n);await verifyPrice(n);}check('Occasion '+p+' respects all reached quantity tiers',true);}
    check('Maximum disables increase',await form.getByRole('button',{name:'הוספת חולצה',exact:true}).isDisabled());
    await q.fill('101');await q.blur();await verifyPrice(100);await q.fill('0');await q.blur();await verifyPrice(1);check('Input clamps to one through one hundred',await q.inputValue()==='1');
    await setQ(4);for(const n of [3,2,1]){await form.getByRole('button',{name:'הפחתת חולצה',exact:true}).click();await verifyPrice(n);}check('Same control reduces to one at configured single price',await form.getByRole('button',{name:'הפחתת חולצה',exact:true}).isDisabled());
    const bands=pricing.tiers.filter(t=>t.quantity>=4&&t.quantity<=100),gap=bands.findIndex((t,i)=>(bands[i+1]?.quantity??101)-t.quantity>1);
    if(gap>=0){const a=bands[gap].quantity,b=(bands[gap+1]?.quantity??101)-1,n=a+1;await setQ(n);await verifyPrice(n);const active=form.locator('.pp-price-ladder button[aria-pressed=true]');check('Intermediate quantity highlights the full price range instead of a different exact count',(await active.innerText()).includes(a+'–'+b)&&await q.inputValue()===String(n));await active.click();check('Clicking the active price band preserves the exact chosen quantity',await q.inputValue()===String(n));check('Range labels fit inside cards',await form.locator('.pp-price-ladder button').evaluateAll(nodes=>nodes.every(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('span').getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1;})));}
    await form.getByRole('combobox',{name:'בחירת חבילה',exact:true}).selectOption('4');await setQ(7);await form.locator('.coupon-entry summary').click();await form.locator('#request-coupon').fill('QA10');await form.getByRole('button',{name:'החלת קוד',exact:true}).click();await form.locator('.applied-offer').waitFor();await verifyPrice(7,.1);await setQ(8);await verifyPrice(8,.1);check('Changing quantity replaces stale coupon quote',true);
    await fillContact();await toIdea();await form.locator('textarea').fill('Synthetic brief retained across quantity edits');check('Contact is saved before idea or order completion',contacts.size===1&&orders.size===0);
    await toShirts();await setQ(9);await toContacts();await toIdea();check('Quantity changes preserve and update the same contact',contacts.size===1&&Array.from(contacts.values())[0].details.quantity===9);
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('partyprint-draft-v2')||'null')?.quantities?.[4]===9);await page.reload({waitUntil:'networkidle'});await verifyPrice(9);
    await toContacts();await page.waitForFunction(()=>document.querySelector('#request-email')?.value==='qa-contact@example.invalid');
    check('Saved contact resumes from the server in the same tab',await form.locator('#request-name').inputValue()==='Synthetic QA'&&await form.locator('textarea').inputValue()==='Synthetic brief retained across quantity edits');
    check('Contact PII is absent from local draft storage',await page.evaluate(()=>{const s=localStorage.getItem('partyprint-draft-v2')||'';return !/Synthetic QA|0500000000|qa-contact/.test(s);}));
    await toIdea();await sendFinal();await page.waitForURL('**/thanks');check('Completion links to the same saved contact without stale coupon',orders.size===1&&payloads.at(-1).quantity===9&&payloads.at(-1).coupon===''&&payloads.at(-1).expectedPrice===round(unit(9)*9)&&payloads.at(-1).email==='qa-contact@example.invalid');
    await page.goto(base+'/?utm_source=meta&utm_medium=paid_social&utm_campaign=launch',{waitUntil:'networkidle'});await form.locator('.applied-offer').waitFor();check('Paid UTM gets a server-verified automatic offer',(await form.locator('.applied-offer').innerText()).includes('10%'));check('Admin promotion text and code remain visible',(await page.locator('.launch-offer').innerText()).includes('QA10'));
    if(actualPromotion?.text){promoMode='actual';await page.goto(base+'/',{waitUntil:'networkidle'});check('Public banner renders current configured promotion without hard-coded copy',await page.locator('.launch-offer').innerText().then(t=>t.includes(actualPromotion.text)&&t.includes(actualPromotion.code)));}
    promoMode='empty';await page.goto(base+'/',{waitUntil:'networkidle'});check('No active promotion retains the existing fallback',await page.locator('.launch-offer').count()===0&&await page.locator('.promo-fallback').isVisible());
   }else if(kind==='ux-browser'){
    initialHeight=await form.evaluate(el=>Math.round(el.getBoundingClientRect().height));
    const contrast=await page.evaluate(()=>{const ctx=document.createElement('canvas').getContext('2d'),style=getComputedStyle(document.documentElement);const lum=name=>{ctx.fillStyle=style.getPropertyValue('--color-pp-'+name).trim();ctx.fillRect(0,0,1,1);const c=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};return [['ink','paper',4.5],['ink','acid',4.5],['focus','acid',3],['muted','paper',4.5],['ink','accent',4.5],['focus','paper',3],['success','success-soft',4.5],['error','error-soft',4.5]].every(([a,b,min])=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)>=min);});check('Brand text and focus pairs retain WCAG contrast',contrast);
    await form.getByRole('button',{name:/מידות וצבעים.*אפשר לבחור עכשיו/}).click();await page.getByRole('dialog',{name:'מידות וצבעים לחולצות',exact:true}).waitFor();await page.keyboard.press('Escape');await page.locator('#order-size-dialog').waitFor({state:'hidden'});check('Optional size dialog closes without saving contacts or orders',contacts.size===0&&orders.size===0);
    await setQ(7);await form.getByRole('combobox',{name:'בחירת חבילה',exact:true}).selectOption('0');await setQ(1);await setQ(7);check('Occasion survives quantity reduction and increase',await form.getByRole('combobox',{name:'בחירת חבילה',exact:true}).inputValue()==='0');
    await fillContact();contactHeight=await form.evaluate(el=>Math.round(el.getBoundingClientRect().height));
    await form.locator('#request-email').fill('bad-email');await form.locator('#request-email').blur();check('Required email error is associated with the field',await form.locator('#request-email').getAttribute('aria-describedby')==='request-email-error');
    await form.locator('#request-email').fill('qa-contact@example.invalid');failContact=true;await form.getByRole('button',{name:CONTACT,exact:true}).click();await form.locator('#request-save-error').waitFor();check('Failed contact save preserves fields and does not advance',contacts.size===0&&await form.locator('#request-email').inputValue()==='qa-contact@example.invalid'&&await form.getByRole('button',{name:CONTACT,exact:true}).isVisible());failContact=false;await toIdea();
    check('Abandoning the idea step would leave contact details saved',contacts.size===1&&orders.size===0&&Array.from(contacts.values())[0].details.email==='qa-contact@example.invalid');
    await form.locator('textarea').fill('Synthetic UX brief');await form.locator('input[type=file]').setInputFiles(image);await form.locator('.reference-tile').waitFor();
    await toShirts();await setQ(9);await form.locator('.coupon-entry summary').click();await form.locator('#request-coupon').fill('QA10');quoteDelay=1200;await form.getByRole('button',{name:'החלת קוד',exact:true}).click();await form.locator('.pp-price-status').waitFor();check('Pending quote never blocks contact capture',await form.getByRole('button',{name:FIRST,exact:true}).isEnabled());await toContacts();await toIdea();await form.locator('.applied-offer').waitFor();quoteDelay=0;
    check('Back, quantity and coupon edits retain files and brief',await form.locator('textarea').inputValue()==='Synthetic UX brief'&&await form.locator('.reference-tile').count()===1&&contacts.size===1);await form.getByRole('button',{name:'הסרה',exact:true}).click();
    if(viewport.width===375){await toShirts();await form.locator('.coupon-entry summary').click();await form.locator('#request-coupon').fill('SLOW');quoteDelay=10000;await form.getByRole('button',{name:'החלת קוד',exact:true}).click();await toContacts();await toIdea();await form.locator('.pp-coupon-error').waitFor({timeout:12000});await form.getByRole('button',{name:'המשך בלי קוד',exact:true}).click();check('Slow coupon can be removed without losing saved contact',await form.getByRole('button',{name:FINAL,exact:true}).isEnabled()&&contacts.size===1);quoteDelay=0;await page.waitForTimeout(2200);check('Abandoned coupon response never re-applies',await form.locator('.applied-offer').count()===0);}
    priceConflict=true;await sendFinal();await form.locator('#request-save-error').waitFor();check('Price conflict retains contact, brief and photo',contacts.size===1&&await form.locator('.reference-tile').count()===1&&await form.locator('textarea').inputValue()==='Synthetic UX brief');await page.waitForFunction(()=>document.querySelector('#order-form')?.getAttribute('aria-busy')==='false');
    orderDelay=800;const before=orderMocks;await page.evaluate(()=>{const b=document.querySelector('#order-form button[type=submit]');b.click();b.click();});await page.waitForURL('**/thanks');check('Double-click creates one complete request linked to one contact',orderMocks===before+1&&orders.size===1&&contacts.size===1);serverQuantity=10;
    await page.getByRole('button',{name:'בחירת מידות עכשיו',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.shirt-options')?.disabled);check('Optional editor uses current server quantity',(await page.locator('.shirt-progress').innerText()).includes('10/10'));
    const editor=page.locator('#shirt-editor-0');await editor.getByRole('button',{name:'ילד',exact:true}).click();await editor.locator('select').selectOption('8');await editor.getByRole('button',{name:'אפור',exact:true}).click();await page.getByRole('button',{name:/החלת הבחירה מחולצה 1 על כולן/}).click();await page.getByRole('combobox',{name:'איזו חולצה עורכים?',exact:true}).selectOption('1');check('Bulk apply copies child age and color',await page.locator('#shirt-editor-1 select').inputValue()==='8');await page.getByRole('button',{name:'ביטול ההחלה',exact:true}).click();check('Undo restores per-shirt exceptions',await page.locator('#shirt-editor-1').getByRole('button',{name:'מבוגר',exact:true}).getAttribute('aria-pressed')==='true');
    await page.getByRole('combobox',{name:'איזו חולצה עורכים?',exact:true}).selectOption('0');sizeConflict=true;await page.getByRole('button',{name:'שמירת המידות',exact:true}).click();await page.getByRole('button',{name:'רענון בלי לאבד בחירות',exact:true}).waitFor();await page.getByRole('button',{name:'רענון בלי לאבד בחירות',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.shirt-options')?.disabled);check('409 refresh preserves unsaved child choices',await page.locator('#shirt-editor-0 select').inputValue()==='8');await page.getByRole('button',{name:'שמירת המידות',exact:true}).click();await page.getByRole('heading',{name:'המידות נשמרו עם הפנייה',exact:true}).waitFor();check('Recovered sizing saves current quantity without another order',currentOrder.shirts.length===10&&orders.size===1);
    locked=true;await page.getByRole('button',{name:'עדכון המידות',exact:true}).click();await page.getByText('הפנייה כבר בשלב מתקדם. לתיאום שינוי במידות פנו אלינו ב־WhatsApp.',{exact:true}).waitFor();check('Production lock blocks further size writes',patchMocks===2);
   }else{
    const inclusion=await page.locator('.package .price-includes').first().evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,line:parseFloat(getComputedStyle(el).lineHeight)};});check('Package inclusion text stays readable',inclusion.width>=115&&inclusion.height<=inclusion.line*3.1);
    await form.locator('#request-event-date').fill('2030-11-20');await form.locator('.event-planning summary').click();check('Event estimate is conditional',(await form.locator('.event-planning').innerText()).includes('אינו אישור אספקה'));
    await toContacts();contactHeight=await form.evaluate(el=>Math.round(el.getBoundingClientRect().height));await page.waitForFunction(()=>{const p=document.querySelector('#order-form .pp-progress')?.getBoundingClientRect(),n=document.querySelector('.nav')?.getBoundingClientRect();return p&&p.top>=Math.max(0,n?.bottom??0)-1&&p.bottom<=innerHeight-16;},{},{timeout:4000});
    check('Progress is visible below navigation after shirts',true);check('Contact fields precede idea and image fields',await form.locator('#request-email').isVisible()&&!await form.locator('textarea').isVisible()&&!await form.locator('input[type=file]').isVisible());
    await form.getByRole('button',{name:CONTACT,exact:true}).click();check('Name, phone and email are required before capture',await form.locator('#request-name').getAttribute('aria-invalid')==='true'&&await form.locator('#request-phone').getAttribute('aria-invalid')==='true'&&await form.locator('#request-email').getAttribute('aria-invalid')==='true'&&contactWrites===0);
    await form.locator('#request-name').fill('Synthetic QA');await form.locator('#request-phone').fill('0500000000');await form.locator('#request-email').fill('qa-contact@example.invalid');
    check('Notice explains saving even without idea completion',(await form.locator('.pp-contact-notice').innerText()).includes('גם אם לא תשלימו'));
    if(viewport.width===375)console.log('CONTACT_FIRST_SCREEN '+(await page.locator('.request-form-card').screenshot({type:'jpeg',quality:70})).toString('base64'));
    await toIdea();check('Contact is durable before complete request',contacts.size===1&&orders.size===0);
    check('Idea progress does not claim the full request is already saved',!(await form.getByRole('progressbar',{name:'ההתקדמות שלכם',exact:true}).getAttribute('aria-valuetext')).includes('הפנייה נשמרה'));
    if(viewport.width===375)console.log('IDEA_AFTER_CONTACT_SCREEN '+(await page.locator('.request-form-card').screenshot({type:'jpeg',quality:70})).toString('base64'));
    const input=form.locator('input[type=file]');await input.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});await form.locator('.reference-upload .error').waitFor();check('Unsafe upload is rejected',true);await input.setInputFiles(image);await form.locator('.reference-tile').waitFor();await form.getByRole('button',{name:'הסרת qa.png',exact:true}).click();check('Valid preview can be added and removed',await form.locator('.reference-tile').count()===0);
    if(viewport.width===375){await form.getByRole('button',{name:/מידות וצבעים.*אפשר לבחור עכשיו/}).click();const editor=page.locator('#order-size-dialog #shirt-editor-0');await editor.getByRole('button',{name:'ילד',exact:true}).click();await editor.locator('select').selectOption('18');await editor.getByRole('button',{name:'אפור',exact:true}).click();await page.locator('#order-size-dialog').getByRole('button',{name:'אישור המידות לבקשה',exact:true}).click();}
    failSave=true;await sendFinal();await form.locator('#request-save-error').waitFor();check('Failed completion preserves the already-saved contact',contacts.size===1&&orders.size===0&&await form.locator('#request-email').inputValue()==='qa-contact@example.invalid');failSave=false;await sendFinal();await page.waitForURL('**/thanks');
    check('One complete request reuses the saved contact identity',orders.size===1&&contacts.has(currentOrder.id)&&payloads.at(-1).email==='qa-contact@example.invalid');
    check('Explicit child choices survive final submission',viewport.width!==375||currentOrder.shirts.length===4&&currentOrder.shirts[0].size==='18'&&currentOrder.shirts[0].color==='gray');
    check('Only saved confirmation marks progress complete',await page.locator('.pp-progress').getAttribute('data-complete')==='true');
    check('Confirmation includes public reference and WhatsApp handoff',(await page.locator('.wa-reference').innerText()).includes(currentOrder.id.slice(0,8).toUpperCase())&&(await page.locator('a.pp-primary[href*="wa.me"]').getAttribute('href')).includes(currentOrder.id.slice(0,8).toUpperCase()));
    await page.getByRole('button',{name:viewport.width===375?'עדכון המידות':'בחירת מידות עכשיו',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.shirt-options')?.disabled);
    const editor=page.locator('#shirt-editor-0');await editor.getByRole('button',{name:'ילד',exact:true}).click();check('All child age choices remain available',(await editor.locator('select option').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean))).join(',')==='2,4,6,8,10,12,14,16,18');
    await editor.locator('select').selectOption('8');await editor.getByRole('button',{name:'לבן',exact:true}).click();await page.getByRole('button',{name:/החלת הבחירה מחולצה 1 על כולן/}).click();await page.getByRole('combobox',{name:'איזו חולצה עורכים?',exact:true}).selectOption('1');check('Bulk copy retains child age and color',await page.locator('#shirt-editor-1 select').inputValue()==='8');await page.getByRole('button',{name:'שמירת המידות',exact:true}).click();await page.getByRole('heading',{name:'המידות נשמרו עם הפנייה',exact:true}).waitFor();check('Optional size update adds no contact or order',patchMocks===1&&contacts.size===1&&orders.size===1);
    await page.reload({waitUntil:'networkidle'});check('Confirmation survives reload without creating another request',await page.getByRole('heading',{name:'הרעיון שלכם בפנים.',exact:true}).isVisible()&&orders.size===1);
    const empty=await context.newPage();await empty.goto(base+'/thanks',{waitUntil:'networkidle'});await empty.evaluate(()=>sessionStorage.clear());await empty.reload({waitUntil:'networkidle'});check('Direct thanks without receipt never claims success',await empty.getByRole('heading',{name:'מחפשים את הפנייה שלכם?',exact:true}).isVisible());await empty.close();
   }
   check('No page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));check('No client exception',clientErrors.length===0);check('No network write forwarded',forwardedWrites===0);
  }catch(e){report.errors.push({viewport,message:e.message,clientErrors});}
  finally{report.screens.push({viewport,initialHeight,contactHeight,checks,contactWrites,uniqueContacts:contacts.size,orderMocks,uniqueOrders:orders.size,patchMocks,quoteMocks,blockedWrites,forwardedWrites,clientErrors});await context.close();}
 }}finally{await browser.close();}
 report.status=report.errors.length?'failed':'passed';await save();if(report.errors.length)process.exitCode=1;
}
