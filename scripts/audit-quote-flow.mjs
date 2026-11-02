import {createRequire} from 'node:module';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const require=createRequire('/tmp/partyprint-browser/package.json');const {chromium}=require('playwright');
const base='https://partyprint.co.il',report={at:new Date().toISOString(),release:null,screens:[],sourceFindings:[]};
try{report.release=await(await fetch(base+'/api/release')).json()}catch{}
const browser=await chromium.launch({headless:true});
try{for(const viewport of [{width:320,height:800},{width:390,height:844},{width:430,height:900}]){
 const context=await browser.newContext({viewport,reducedMotion:'reduce',locale:'he-IL',timezoneId:'Asia/Jerusalem'});
 let writes=0;await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(r.method()!=='GET'){writes++;return route.abort()}return u.origin===base?route.continue():route.abort()});
 const page=await context.newPage(),result={viewport};try{
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.package-grid .package').first().scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
 result.price=await page.locator('.package-grid .package .price-includes').first().evaluate(el=>({text:el.textContent,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,lineHeight:getComputedStyle(el).lineHeight}));
 if(viewport.width===390){const shot=await page.locator('.package-grid .package').first().screenshot({type:'jpeg',quality:60});console.log('BEFORE_PRICE '+shot.toString('base64'))}
 await page.getByRole('button',{name:'זאת החבילה שלי'}).first().click();await page.getByRole('button',{name:'הבא: חולצות'}).click();
 const row=page.locator('.shirt-row.editing');
 await row.locator('.size-pills label').filter({hasText:/^M$/}).click();await row.locator('.color-pills label').filter({hasText:'שחור'}).click();
 await page.waitForTimeout(200);
 const bulk=page.getByRole('button',{name:/החלת הבחירה מחולצה 1 על כולן/});
 result.bulkEnabled=await bulk.isEnabled();if(result.bulkEnabled){await bulk.click();result.progress=await page.locator('.shirt-progress').innerText()}
 result.forwardedWrites=0;result.blockedWrites=writes;
 }catch(e){result.error=e.message}report.screens.push(result);await context.close();
}}finally{await browser.close()}
function scan(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory()){if(!['assets','performance'].includes(item.name))scan(path)}else if(/\.(tsx?|md|csv)$/.test(item.name)){const lines=readFileSync(path,'utf8').split('\n');for(let i=0;i<lines.length;i++){const match=lines[i].match(/יחידה בודדת|חולצה אחת|מינימום.{0,10}4|מידות.{0,15}פרטים/);if(match)report.sourceFindings.push({path,line:i+1,text:lines[i].slice(Math.max(0,match.index-90),match.index+220)})}}}}
for(const dir of ['app','lib','components','docs'])scan(dir);
console.log('FLOW_BASELINE '+JSON.stringify(report));
