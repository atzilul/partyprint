import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||process.cwd())+'/package.json');
const {chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected browser audit target');
const report={base,at:new Date().toISOString(),scope:'Client interaction only; no order, quote or tracking writes sent',screens:[],errors:[]};
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:390,height:844},{width:1366,height:900}]){
  const context=await browser.newContext({viewport,locale:'he-IL',timezoneId:'Asia/Jerusalem',reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   window.__partyprintSearchPerf={lcpMilliseconds:null,clsSessionMax:0,layoutShiftSum:0,layoutShifts:[],longTaskMilliseconds:0,supported:[]};
   let sessionStart=0,lastShift=0,sessionValue=0;
   for(const type of ['largest-contentful-paint','layout-shift','longtask']){
    try{
     new PerformanceObserver(list=>{for(const entry of list.getEntries()){
      const p=window.__partyprintSearchPerf;
      if(type==='largest-contentful-paint')p.lcpMilliseconds=entry.startTime;
      if(type==='layout-shift'&&!entry.hadRecentInput){
       if(!sessionStart||entry.startTime-lastShift>=1000||entry.startTime-sessionStart>=5000){sessionStart=entry.startTime;sessionValue=0;}
       lastShift=entry.startTime;sessionValue+=entry.value;p.layoutShiftSum+=entry.value;p.clsSessionMax=Math.max(p.clsSessionMax,sessionValue);
       if(p.layoutShifts.length<20)p.layoutShifts.push({at:entry.startTime,value:entry.value,sources:(entry.sources||[]).map(s=>({node:s.node?s.node.tagName.toLowerCase()+(s.node.id?'#'+s.node.id:'')+(typeof s.node.className==='string'?'.'+s.node.className.trim().split(/\s+/).slice(0,4).join('.'):''):'unknown',before:{x:s.previousRect.x,y:s.previousRect.y,width:s.previousRect.width,height:s.previousRect.height},after:{x:s.currentRect.x,y:s.currentRect.y,width:s.currentRect.width,height:s.currentRect.height}}))});
      }
      if(type==='longtask')p.longTaskMilliseconds+=entry.duration;
     }}).observe({type,buffered:true});
     window.__partyprintSearchPerf.supported.push(type);
    }catch{}
   }
  });
  const page=await context.newPage();
  const pageErrors=[],blocked=[];
  let orderAttempts=0;
  page.on('pageerror',error=>pageErrors.push(error.message.slice(0,300)));
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(!['GET','HEAD','OPTIONS'].includes(request.method())){
    blocked.push({path:url.pathname,method:request.method()});
    if(url.pathname==='/api/orders')orderAttempts++;
    return route.abort();
   }
   if(url.origin!==new URL(base).origin&&!['data:','blob:'].includes(url.protocol))return route.abort();
   return route.continue();
  });
  const checks=[];
  let labPerformance=null;
  const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForLoadState('networkidle',{timeout:15000});
   labPerformance=await page.evaluate(()=>{
    const n=performance.getEntriesByType('navigation')[0];
    return {...window.__partyprintSearchPerf,ttfbMilliseconds:n?n.responseStart-n.requestStart:null,
     fcpMilliseconds:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null,
     note:'CI homepage load before scrolling or form interaction; reduced motion, write/tracker blocking; no mobile CPU/network throttling; not field Core Web Vitals'};
   });
   await page.locator('#order-form').scrollIntoViewIfNeeded();
   const deny=page.getByRole('button',{name:'לא, תודה',exact:true});
   if(await deny.isVisible().catch(()=>false))await deny.click();
   const form=page.locator('#order-form');
   await form.getByRole('button',{name:'הבא: חולצות',exact:true}).click();
   const shirts=page.locator('#shirt-selection');
   await shirts.waitFor({state:'visible'});
   await form.getByRole('button',{name:/המשך לפרטים/}).click();
   check('Cannot bypass missing shirt choices',await shirts.isVisible());
   const editor=page.locator('#shirt-editor-0');
   check('Adult is the default',await editor.getByRole('button',{name:'מבוגר',exact:true}).getAttribute('aria-pressed')==='true');
   await editor.getByRole('button',{name:'ילד',exact:true}).click();
   const child=editor.locator('select');
   check('All nine child sizes exist',(await child.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean))).join(',')==='2,4,6,8,10,12,14,16,18');
   await child.selectOption('18');
   await editor.getByRole('button',{name:'מבוגר',exact:true}).click();
   check('Changing size type clears the previous size',await editor.locator('.size-pills [aria-checked="true"]').count()===0);
   await editor.locator('.size-pills label').filter({hasText:/^M$/}).click();
   await editor.locator('.color-pills label').filter({hasText:/לבן/}).click();
   await shirts.getByRole('button',{name:/החלת הבחירה מחולצה 1 על כולן/}).click();
   const progress=shirts.locator('progress').first();
   check('Bulk selection completes every shirt',await progress.getAttribute('value')===await progress.getAttribute('max'));
   await form.getByRole('button',{name:/המשך לפרטים/}).click();
   const name=form.locator('input[name="name"]'),phone=form.locator('input[name="phone"]'),email=form.locator('input[name="email"]');
   await name.waitFor({state:'visible'});
   await form.getByRole('button',{name:'שליחת הזמנה',exact:true}).click();
   check('Empty contact fields are rejected',await name.getAttribute('aria-invalid')==='true'&&await phone.getAttribute('aria-invalid')==='true'&&await email.getAttribute('aria-invalid')==='true');
   check('Validation does not attempt to create an order',orderAttempts===0);
   await form.locator('#optional-order-details > summary').click();
   const file=form.locator('input[type="file"]');
   await file.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('test')});
   await form.locator('.reference-upload .error').waitFor({state:'visible'});
   check('Invalid upload type shows an error',true);
   await file.setInputFiles({name:'search-audit.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1QAAAAASUVORK5CYII=','base64')});
   await form.locator('.reference-tile').waitFor({state:'visible'});
   check('Selecting a valid image adds a local preview',await form.locator('.reference-tile').count()===1);
   await form.getByRole('button',{name:'הסרת search-audit.png',exact:true}).click();
   check('Selected image can be removed',await form.locator('.reference-tile').count()===0);
   await form.getByRole('button',{name:'חזרה',exact:true}).click();
   check('Going back preserves shirt selections',await progress.getAttribute('value')===await progress.getAttribute('max'));
   const box=await form.boundingBox();
   check('Form fits the viewport',!!box&&box.x>=-2&&box.x+box.width<=viewport.width+2);
   check('No unhandled client exception',pageErrors.length===0);
   check('No order request was sent',orderAttempts===0);
   report.screens.push({viewport,checks,blockedWriteCount:blocked.length,orderAttempts,pageErrors,labPerformance});
  }catch(error){
   report.errors.push({viewport,message:error.message.slice(0,500),pageErrors});
   report.screens.push({viewport,checks,blockedWriteCount:blocked.length,orderAttempts,labPerformance});
  }finally{await context.close();}
 }
}finally{await browser.close();}
await mkdir('artifacts',{recursive:true});
const suffix=base.includes('127.0.0.1')?'local':'production';
await writeFile('artifacts/order-browser-'+suffix+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
