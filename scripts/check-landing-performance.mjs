// Read-only, cold-context laboratory probe; no order or analytics writes.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createBuildIdentity} from './build-identity.mjs';
const require=createRequire((process.env.PARTYPRINT_PLAYWRIGHT_ROOT||'/tmp/partyprint-browser')+'/package.json');
const {chromium}=require('playwright');
const origins=(process.env.PERF_ORIGINS||'https://partyprint.co.il').split(',');
const allowed=new Set(['https://partyprint.co.il','https://partyprint-ai.atzilul.chatgpt.site','http://127.0.0.1:3333']);
if(origins.some(x=>!allowed.has(x)))throw new Error('Unexpected origin');
const samples=Number(process.env.PERF_SAMPLES||3);
if(!Number.isInteger(samples)||samples<1||samples>5)throw new Error('Invalid sample count');
const profiles=[
 {name:'mobile',viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2,cpu:4,latency:150,download:1600000/8,upload:750000/8},
 {name:'desktop',viewport:{width:1366,height:900},isMobile:false,deviceScaleFactor:1,cpu:1,latency:40,download:10000000/8,upload:5000000/8},
];
const safe=u=>{try{const x=new URL(u);return x.origin+x.pathname}catch{return ''}};
const expectedIdentity=createBuildIdentity();
const browser=await chromium.launch({headless:true});
const report={kind:'landing-performance-lab',checkedAt:new Date().toISOString(),browser:browser.version(),samplesPerProfile:samples,observationMs:12000,cache:'fresh browser context, HTTP cache disabled; upstream cache not purged',transport:process.env.PERF_SERVER_PROFILE||'public origin',runner:process.env.RUNNER_OS||'unknown',thirdParty:'Vendor scripts allowed; all non-GET and measurement collection requests blocked',fieldData:null,expectedSourceFingerprint:expectedIdentity.sourceFingerprint,clsDefinition:'largest session window (gap <1s, duration <5s); initial 12-second observation only',results:[]};
try{
 for(const origin of origins){
  async function readRelease(){try{const r=await fetch(origin+'/api/release',{signal:AbortSignal.timeout(5000)});return r.ok?await r.json():null}catch{return null}}
  let release=await readRelease();
  if(process.env.PERF_REQUIRE_MATCH==='1'){
   const matches=()=>release?.sourceState==='clean'&&release.sourceCommit===expectedIdentity.sourceCommit&&release.sourceFingerprint===expectedIdentity.sourceFingerprint;
   for(let attempt=0;attempt<24&&!matches();attempt++){await new Promise(resolve=>setTimeout(resolve,5000));release=await readRelease()}
   if(!matches()){report.results.push({origin,error:'waiting_for_matching_deployment',featureValidation:'waiting_for_matching_deployment',release,clientErrors:[],status:null});continue}
  }
  const optimized=process.env.PERF_EXPECT_OPTIMIZED==='1'||(process.env.PERF_EXPECT_OPTIMIZED==='auto'&&release?.sourceState==='clean'&&release.sourceFingerprint===expectedIdentity.sourceFingerprint);
  for(const profile of profiles){
   for(let sample=1;sample<=samples;sample++){
    const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,isMobile:profile.isMobile,locale:'he-IL',timezoneId:'Asia/Jerusalem',reducedMotion:'no-preference',serviceWorkers:'block'});
    const page=await context.newPage();
    let blocked=0;const errors=[];const failed=[];const headers=[];
    page.on('pageerror',e=>errors.push(e.message.slice(0,250)));
    page.on('requestfailed',r=>{if(!/ERR_FAILED|ERR_BLOCKED_BY_CLIENT/.test(r.failure()?.errorText||''))failed.push({url:safe(r.url()),error:r.failure()?.errorText})});
    await context.route('**/*',route=>{
     const r=route.request(),u=new URL(r.url());
     const collection=(/google-analytics\.com$|analytics\.google\.com$/.test(u.hostname)&&/\/(g\/)?collect(?:\/|$)/.test(u.pathname))||(u.hostname.endsWith('facebook.com')&&/^\/tr(?:\/|$)/.test(u.pathname))||u.pathname==='/api/events';
     if(r.method()!=='GET'||collection){blocked++;return route.abort()}
     return route.continue();
    });
    page.on('response',async r=>{
     const u=new URL(r.url());
     if(u.origin===origin&&(u.pathname==='/'||u.pathname.startsWith('/fonts/')||u.pathname.includes('.woff2')||u.pathname.includes('party-crew')||u.pathname.includes('rubik'))){
      let h;try{h=await r.allHeaders();}catch{return}headers.push({url:safe(r.url()),status:r.status(),cacheControl:h['cache-control']||null,encoding:h['content-encoding']||null,contentType:h['content-type']||null,contentLength:h['content-length']||null});
     }
    });
    await page.addInitScript(()=>{
     window.__landingPerf={lcp:[],cls:0,shifts:[],longTasks:0,longTaskMs:0,heroSources:[]};
     const state=window.__landingPerf;
     let sessionFirst=0,sessionLast=0,sessionValue=0;
     new PerformanceObserver(list=>{for(const e of list.getEntries())state.lcp.push({time:e.startTime,renderTime:e.renderTime,loadTime:e.loadTime,size:e.size,url:e.url,element:e.element?e.element.tagName.toLowerCase()+'.'+String(e.element.className||'').slice(0,100):null})}).observe({type:'largest-contentful-paint',buffered:true});
     new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){if(sessionValue&&e.startTime-sessionLast<1000&&e.startTime-sessionFirst<5000){sessionValue+=e.value}else{sessionFirst=e.startTime;sessionValue=e.value}sessionLast=e.startTime;state.cls=Math.max(state.cls,sessionValue);state.shifts.push({time:e.startTime,value:e.value,sources:(e.sources||[]).map(x=>({element:x.node?x.node.nodeName+'.'+String(x.node.className||'').slice(0,100):null,previous:x.previousRect,current:x.currentRect}))})}}).observe({type:'layout-shift',buffered:true});
     new PerformanceObserver(list=>{for(const e of list.getEntries()){state.longTasks++;state.longTaskMs+=e.duration}}).observe({type:'longtask',buffered:true});
     document.addEventListener('DOMContentLoaded',()=>{
      const add=()=>{const hero=document.querySelector('.hero-art img');if(hero)state.heroSources.push({time:performance.now(),src:hero.currentSrc||hero.src})};add();
      new MutationObserver(add).observe(document.querySelector('.hero-art')||document.body,{childList:true,attributes:true,subtree:true,attributeFilter:['src','srcset']});
     });
    });
    const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.upload,connectionType:profile.isMobile?'cellular4g':'wifi'});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
    let result={origin,profile:profile.name,sample,release,network:{latencyMs:profile.latency,downloadKbps:profile.download*8/1000,cpuSlowdown:profile.cpu}};
    try{
     const response=await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:60000});
     const html=await response.text();
     await page.waitForTimeout(Math.max(0,12000-await page.evaluate(()=>performance.now())));
     const measurements=await page.evaluate(()=>{
      const nav=performance.getEntriesByType('navigation')[0];
      const resources=performance.getEntriesByType('resource').map(r=>({name:r.name,type:r.initiatorType,start:r.startTime,end:r.responseEnd,duration:r.duration,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize}));
      const image=document.querySelector('.hero-art img');
      const rect=image?.getBoundingClientRect();
      return {title:document.title,path:location.pathname,nav:{ttfbMs:nav.responseStart,htmlEndMs:nav.responseEnd,domContentLoadedMs:nav.domContentLoadedEventEnd,loadMs:nav.loadEventEnd,transfer:nav.transferSize,encoded:nav.encodedBodySize,decoded:nav.decodedBodySize},...window.__landingPerf,resources,hero:image?{src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,rect:{width:rect.width,height:rect.height,top:rect.top},opacity:getComputedStyle(image).opacity,animation:getComputedStyle(image).animationName}:null,fonts:document.fonts.status,preloadLinks:[...document.querySelectorAll('link[rel="preload"]')].map(x=>({as:x.as,type:x.type,href:x.getAttribute('href'),srcset:x.getAttribute('imagesrcset'),priority:x.fetchPriority}))};
     });
     const lcp=measurements.lcp.at(-1);
     const resource=measurements.resources.find(x=>x.name===lcp?.url);
     result={...result,status:response.status(),html:{bytes:Buffer.byteLength(html),hasInitialHero:html.includes('/party-crew.webp')||html.includes('party-crew-'),preloads:[...html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)].map(x=>x[0].slice(0,500))},...measurements,lcpMs:lcp?.time||null,lcpPhases:resource?{ttfbMs:measurements.nav.ttfbMs,resourceDelayMs:resource.start-measurements.nav.ttfbMs,resourceDurationMs:resource.duration,renderDelayMs:lcp.time-resource.end}:null};
     result.resources=result.resources.map(x=>({...x,name:safe(x.name)}));
     result.lcp=result.lcp.map(x=>({...x,url:safe(x.url)}));
     result.heroSources=result.heroSources.map(x=>({...x,src:safe(x.src)}));
     if(result.hero)result.hero.src=safe(result.hero.src);
    }catch(e){result.error=e.message.slice(0,500)}
    result.featureValidation=optimized?'pending':'waiting_for_matching_deployment';
    if(optimized&&!result.error){
     result.optimizedChecks=[];
     const check=(condition,message)=>{if(!condition)throw new Error(message);result.optimizedChecks.push(message)};
     try{
      check(/\/_next\/static\/.*family-shared-v2-(640|960|1254).*\.(avif|webp)$/.test(result.hero?.src||''),'Family is the default responsive hero');
      check(result.hero?.complete&&result.hero.naturalWidth>0,'Hero decoded successfully');
      check(new Set(result.heroSources.map(x=>x.src)).size===1,'Opening audience stays stable for 12 seconds');
      check(!result.resources.some(x=>/statement-family-fixed/.test(x.name)),'Distant statement artwork deferred');
      check(!result.resources.some(x=>/\/fonts\/.*\.ttf$/.test(x.name)),'WOFF2 fonts used');
      if(sample===1){const jpeg=await page.screenshot({type:'jpeg',quality:55});console.log('LANDING_SCREENSHOT_'+profile.name.toUpperCase()+' '+jpeg.toString('base64'))}
      check(result.cls<=0.1,'Lab CLS within 0.1');
      check(!result.resources.some(x=>/bride-shared-v2|groom-shared-v2|tech-team|party-crew/.test(x.name)),'Other event artwork is deferred');
      if(sample===1){
       for(let i=0;i<5;i++){
        await page.locator('.hero .audience-options label').nth(i).click();
        await page.waitForFunction(()=>{const image=document.querySelector('.hero-art img');return image?.complete&&image.naturalWidth>0});
        check((await page.locator('.hero').getAttribute('class')).includes(['audience-family','audience-bride','audience-groom','audience-team','audience-custom'][i]),'Manual audience '+i+' responds');
       }
       await cdp.send('Emulation.setDisabledImageTypes',{imageTypes:['avif']});
       await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
       await page.waitForFunction(()=>{const image=document.querySelector('.hero-art img');return image?.complete&&image.naturalWidth>0&&image.currentSrc.endsWith('.webp')});
       check((await page.locator('.hero-art img').getAttribute('src')).includes('/_next/static/'),'WebP fallback decodes when AVIF is disabled');
        const brideResponse=await context.request.get(origin+'/?v=bride');
        const brideHtml=await brideResponse.text();
        const selectedBridePack=(brideHtml.match(/<option[^>]*>/g)||[]).some(tag=>tag.includes('value="1"')&&tag.includes('selected'));
        check(brideResponse.ok()&&brideHtml.includes('מסיבת רווקות | PARTYPRINT')&&brideHtml.includes('הכלה והחברות')&&brideHtml.includes('og-bride.jpg')&&selectedBridePack,'Bride variant is server-rendered in title, hero, share image and form pack');
        await page.goto(origin+'/?v=bride',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>document.querySelector('.hero')?.classList.contains('audience-bride')&&document.querySelector('.hero-art img')?.complete&&document.querySelector('.hero-art img')?.naturalWidth>0);
        const brideClientState=await page.evaluate(()=>{const select=document.querySelector('select[aria-label="בחירת חבילה"]');return {heading:document.querySelector('.hero h1')?.textContent||'',pack:select?.value,image:document.querySelector('.hero-art img')?.currentSrc||''}});
        check(brideClientState.heading.includes('הכלה והחברות')&&brideClientState.pack==='1'&&brideClientState.image.includes('bride-shared-v2'),'Hydrated bride variant keeps the matching hero and form pack');
      }
      check(errors.length===0,'No client exceptions during hero selection and fallback');result.featureValidation='passed';
     }catch(e){result.error=e.message.slice(0,300);result.featureValidation='failed'}
    }
    result.blockedRequests=blocked;result.clientErrors=errors;result.failedRequests=failed;result.responseHeaders=headers;
    report.results.push(result);
    console.log('SAMPLE '+JSON.stringify({origin,profile:profile.name,sample,lcpMs:result.lcpMs,lcp:result.lcp?.at(-1),phases:result.lcpPhases,nav:result.nav,hero:result.hero,longTasks:result.longTaskMs,error:result.error}));
    await context.close();
   }
  }
 }
}finally{await browser.close()}
report.summary=origins.flatMap(origin=>profiles.map(p=>{
 const runs=report.results.filter(x=>x.origin===origin&&x.profile===p.name);
 const times=runs.map(x=>x.lcpMs).filter(Number.isFinite).sort((a,b)=>a-b);
 return {origin,profile:p.name,samples:times.length,medianLcpMs:times.length?times[Math.floor(times.length/2)]:null,minLcpMs:times[0],maxLcpMs:times.at(-1),errors:runs.filter(x=>x.error).length};
}));
mkdirSync('artifacts',{recursive:true});writeFileSync(process.env.PERF_OUTPUT||'artifacts/landing-performance.json',JSON.stringify(report,null,2));
console.log('LANDING_REPORT '+JSON.stringify(report));
if(report.results.some(x=>x.error||x.status!==200||!x.lcpMs||x.clientErrors.length>0))process.exitCode=1;
