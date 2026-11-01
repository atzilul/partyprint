import {mkdir,writeFile} from 'node:fs/promises';
import {SEO_PAGE_ALIASES,SEO_PAGE_URL} from '../lib/seo-pages.ts';
import {attributes} from './search-utils.mjs';
const base='https://partyprint.co.il';
const articles=['הדפסת-לוגו-על-חולצות-לעסק','חולצות-משפחתיות-בעיצוב-אישי','חולצות-לטיול-משפחתי','חולצה-לערב-צוות','מתנות-לעובדים-לחג','איך-לבחור-תמונה-לחולצה-בעיצוב-אישי','הדפסה-בעיצוב-אישי-מתמונה','מהי-הדפסה-על-חולצות','איך-להזמין-חולצות-לאירועים'];
const paths=['/','/ordering-guide',...articles.map(x=>'/blog/'+x),'/blog/מתנה-לבת-מצווה:cj9vy2','/guides/מתנה-לאמא:9qfnii'];
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const report={at:new Date().toISOString(),scope:'Public GET/HEAD only; no order, analytics, authentication or account writes',pages:[],aliases:[],syntheticCrawlerProbes:[],privateRouteProbes:[]};
async function get(path,{method='GET',agent='PARTYPRINT-DiscoveryAudit/1.0'}={}){
 const url=new URL(path,base);
 if(url.origin!==base)throw Error('Off-site URL refused');
 const r=await fetch(url,{method,redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'user-agent':agent,'cache-control':'no-cache'}});
 return r;
}
for(const path of paths){
 try{
  const r=await get(path),body=await r.text(),canonical=[...body.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0])).find(a=>a.rel==='canonical')?.href||null;
  report.pages.push({path,status:r.status,canonical,location:r.headers.get('location'),noindex:r.headers.get('x-robots-tag'),h1:strip(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''),headings:[...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>strip(m[1])).slice(0,10),paragraphs:[...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].slice(0,5).map(m=>strip(m[1]).slice(0,250))});
 }catch(e){report.pages.push({path,error:e.message});}
}
for(const [alias,target]of Object.entries(SEO_PAGE_ALIASES)){
 const path=SEO_PAGE_URL(alias);
 try{const r=await get(path,{method:'HEAD'});report.aliases.push({path,expected:SEO_PAGE_URL(target),status:r.status,location:r.headers.get('location')});}catch(e){report.aliases.push({path,error:e.message});}
}
for(const agent of ['Googlebot','OAI-SearchBot','Claude-SearchBot','PerplexityBot']){
 try{const r=await get('/',{method:'HEAD',agent});report.syntheticCrawlerProbes.push({agent,status:r.status,noindex:r.headers.get('x-robots-tag'),note:'User-Agent probe only; does not verify real crawler IP access or indexing'});}catch(e){report.syntheticCrawlerProbes.push({agent,error:e.message});}
}
for(const path of ['/admin','/api/admin/analytics','/api/analytics-config']){
 try{const r=await get(path);await r.body?.cancel();report.privateRouteProbes.push({path,status:r.status,location:r.headers.get('location')?.split('?')[0]||null,noindex:r.headers.get('x-robots-tag'),note:'Unauthenticated request; response body not retained'});}catch(e){report.privateRouteProbes.push({path,error:e.message});}
}
report.aliasErrors=report.aliases.filter(item=>![301,308].includes(item.status)||decodeURI(item.location||'').replace(/^https:\/\/partyprint\.co\.il/,'')!==item.expected);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/discovery-details.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.aliasErrors.length)process.exitCode=1;
