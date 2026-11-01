import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const revision='d4f640ea0094b3c81cb867152fb78ed2efcf6a5b';
const origin='https://partyprint.co.il';
const paths=['/','/ordering-guide','/guides/חולצה-למסיבת-רווקים','/guides/__search-audit-missing__','/work/__search-audit-missing__','/sitemap.xml'];
const observations=[];
async function inspect(url,fresh){
 const target=new URL(url);
 if(!['partyprint.co.il','www.partyprint.co.il'].includes(target.hostname))throw Error('Unexpected host');
 if(fresh)target.searchParams.set('__partyprint_deploy_check',revision);
 try{
  const res=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:fresh?{'cache-control':'no-cache','pragma':'no-cache','user-agent':'PARTYPRINT-DeploymentCheck/1.0'}:{'user-agent':'PARTYPRINT-DeploymentCheck/1.0'}});
  const body=await res.text();
  const keys=['age','cache-control','x-cache','x-hcdn-cache-status','cf-cache-status','server','last-modified','etag','location','x-robots-tag','x-litespeed-cache','x-hcdn-upstream-rt','via','vary'];
  observations.push({url:target.href,fresh,status:res.status,headers:Object.fromEntries(keys.filter(k=>res.headers.has(k)).map(k=>[k,res.headers.get(k)])),bodySha256:createHash('sha256').update(body).digest('hex'),inheritedHomepageSchema:/"@type"\s*:\s*"WebPage"\s*,\s*"@id"\s*:\s*"https:\/\/partyprint\.co\.il\/#webpage"/.test(body),hasOrderingGuideLink:body.includes('/ordering-guide'),hasUpdatedGuideCopy:body.includes('מדריך הזמנה')&&body.includes('עודכן'),h1:(body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'').replace(/<[^>]+>/g,' ').slice(0,200)});
 }catch(error){observations.push({url:target.href,fresh,error:error.message});}
}
for(const path of paths)for(const fresh of [false,true])await inspect(origin+path,fresh);
for(const fresh of [false,true])await inspect('https://www.partyprint.co.il/ordering-guide?utm_source=deployment-audit',fresh);
const report={at:new Date().toISOString(),expectedSourceRevision:revision,note:'Public read-only observations; cache-busting is diagnostic and is not a Hostinger deployment receipt.',observations};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/live-release-diagnostics.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
