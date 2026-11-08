import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||'/tmp/partyprint-browser')+'/package.json');
const {chromium}=require('playwright');
const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['http://127.0.0.1:3333','https://partyprint.co.il'].includes(base))throw Error('Unexpected target');
const local=base.startsWith('http:'),expected=createBuildIdentity();
const report={kind:'immutable-media-browser',base,at:new Date().toISOString(),scope:'Public assets and client visuals only; all writes and external requests blocked',status:'pending',screens:[],headers:[],errors:[]};
function save(){mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/immutable-media-'+(local?'local':'production')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
const releaseResponse=await fetch(base+'/api/release');const release=await releaseResponse.json();report.release={expectedFingerprint:expected.sourceFingerprint,publicCommit:release.sourceCommit,publicFingerprint:release.sourceFingerprint,publicState:release.sourceState};
if(!local&&(release.sourceState!=='clean'||release.sourceFingerprint!==expected.sourceFingerprint)){report.status='waiting_for_matching_deployment';save();process.exit(0)}
const browser=await chromium.launch({headless:true});
const requiredAssets=new Set();
try{
 for(const viewport of [{width:390,height:844},{width:1366,height:900}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:viewport.width<500?2:1,reducedMotion:'reduce',locale:'he-IL',timezoneId:'Asia/Jerusalem'});
  await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());return r.method()==='GET'&&u.origin===base?route.continue():route.abort()});
  const page=await context.newPage(),exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
  const screen={viewport,checks:[],imageSources:[],fontSources:[],errors:[]};report.screens.push(screen);
  const check=(value,label)=>{if(!value)throw Error(label);screen.checks.push(label)};
  try{
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.locator('.hero-art img').waitFor();
   await page.waitForFunction(()=>{const i=document.querySelector('.hero-art img');return i?.complete&&i.naturalWidth>0});
   const preloads=await page.locator('link[rel=preload][as=image]').evaluateAll(nodes=>nodes.map(x=>({href:x.href,type:x.type,srcset:x.imageSrcset,priority:x.fetchPriority})));
   check(preloads.length===1&&preloads[0].type==='image/avif'&&preloads[0].priority==='high','Only the initial responsive hero has an image preload');
   check((await page.locator('img[loading=eager]').count())===1,'Only the visible hero is eager');
   const reject=page.locator('.consent-reject');if(await reject.isVisible())await reject.click();
   for(const selector of ['.photo-reference img','.photo-art img','.photo-shirt img']){
    const image=page.locator(selector);await image.scrollIntoViewIfNeeded();
    await image.evaluate(img=>new Promise((resolve,reject)=>{if(img.complete)return img.naturalWidth?resolve():reject(Error('Undecoded panel'));img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(Error('Panel failed')),{once:true})}));
    const data=await image.evaluate(img=>({src:img.currentSrc,alt:img.alt,width:img.naturalWidth,rendered:img.getBoundingClientRect().width,fit:getComputedStyle(img).objectFit,left:getComputedStyle(img).left}));
    check(data.src.includes('/_next/static/')&&data.src.includes('/wow-'),'Wow panel is a native content-hashed asset');
    check(data.fit==='cover'&&data.left==='0px','Extracted panel retains its crop');
    screen.imageSources.push(data);requiredAssets.add(data.src);
   }
   check(new Set(screen.imageSources.map(x=>x.src)).size===3,'Three independent panel files replace the shared triptych');
   if(viewport.width>1000){const jpeg=await page.locator('.magic-machine').screenshot({type:'jpeg',quality:65});console.log('WOW_SCREENSHOT '+jpeg.toString('base64'))}
   for(const selector of ['.inspo-photo img','.review-product img','.statement-image img']){
    const image=page.locator(selector).first();await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(selector=>{const image=document.querySelector(selector);return image?.complete&&image.naturalWidth>0},selector);
    const src=await image.evaluate(img=>img.currentSrc);check(src.includes('/_next/static/'),'Offscreen artwork decodes from a hashed responsive source');requiredAssets.add(src);
   }
   const fontRules=await page.evaluate(()=>{const out=[];function walk(rules){for(const rule of rules){if(rule.type===CSSRule.FONT_FACE_RULE&&/Assistant|Rubik/.test(rule.style.fontFamily))out.push({family:rule.style.fontFamily,weight:rule.style.fontWeight,src:rule.style.src,range:rule.style.unicodeRange});else if(rule.cssRules)walk(rule.cssRules)}}for(const sheet of document.styleSheets){try{walk(sheet.cssRules)}catch{}}return out});
   screen.fontSources=fontRules;
   check(fontRules.length===27,'All disjoint Hebrew, Latin and other-language font faces are declared, with the six Arabic and three Cyrillic faces of the translated pages');
   const fontPreloads=await page.locator('link[rel=preload][as=font]').evaluateAll(nodes=>nodes.map(x=>x.href));
   for(const url of fontPreloads){check(fontRules.some(face=>{const match=face.src.match(/url\(["']?([^"')]+)["']?\)/);return match&&new URL(match[1],base).href===url}),'Critical font preload matches a CSS font URL');requiredAssets.add(url)}
   const foreign=await page.evaluate(async()=>{const span=document.createElement('span');span.textContent='שלום שָׁלוֹם PARTYPRINT 110 ₪ Café Привет';span.style.cssText="font:900 24px Rubik;position:fixed;left:0;top:0";document.body.append(span);await document.fonts.ready;const ready=document.fonts.check('900 24px Rubik',span.textContent);span.remove();return ready});
   check(foreign,'Hebrew with marks, Latin and other-script fallback fonts load');
   const logos=await page.locator('.nav .logo,footer .logo').evaluateAll(nodes=>nodes.map(x=>getComputedStyle(x).backgroundImage));
   for(const value of logos){const match=value.match(/url\(["']?([^"')]+)["']?\)/);check(match&&match[1].includes('/_next/static/'),'Original brand logo uses a content-hashed asset');requiredAssets.add(match[1])}
   check(await page.locator('img[src="/transformation.webp"]').count()===0,'Full triptych is no longer used by the landing page');
   check(exceptions.length===0,'No client exceptions while scrolling through artwork');
  }catch(e){screen.errors.push(e.message);report.errors.push({viewport,message:e.message,exceptions})}
  await context.close();
 }
 for(const url of requiredAssets){
  const parsed=new URL(url);if(parsed.origin!==base)throw Error('Unexpected asset origin');
  const r=await fetch(url,{method:'HEAD'}),cache=r.headers.get('cache-control')||'';
  report.headers.push({path:parsed.pathname,status:r.status,cacheControl:cache,type:r.headers.get('content-type')});
  if(r.status!==200||!/(?:^|,)\s*immutable(?:,|$)/i.test(cache)||!/(?:^|,)\s*max-age=31536000(?:,|$)/i.test(cache))report.errors.push({path:parsed.pathname,message:'Hashed asset is missing year-long immutable caching'});
 }
 const missing=await fetch(base+'/_next/static/media/nonexistent.0000000000000000.avif',{method:'HEAD'});
 if(missing.status!==404)report.errors.push({message:'Missing static asset must return 404'});
 const api=await fetch(base+'/api/release',{method:'HEAD'});if((api.headers.get('cache-control')||'')!=='no-store')report.errors.push({message:'Release API must remain no-store'});
}finally{await browser.close()}
report.status=report.errors.length?'failed':'passed';save();if(report.errors.length)process.exitCode=1;
