import {request as httpRequest} from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {PUBLIC_ORIGIN,sitemapUrls,publicPageUrl,attributes} from './search-utils.mjs';
const base=(process.env.PARTYPRINT_PUBLIC_URL||PUBLIC_ORIGIN).replace(/\/$/,'');
const local=process.env.PARTYPRINT_AUDIT_LOCAL==='1';
const report={checkedAt:new Date().toISOString(),base,mode:local?'local-build':'live-production',checks:[],errors:[]};
const required=['/','/about','/work','/guides','/faq','/ordering-guide','/policies/shipping','/policies/returns','/privacy-policy'];
function check(name,ok,detail=''){
 report.checks.push({name,ok,detail});
 if(!ok)report.errors.push({name,detail});
 console.log((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));
}
async function read(path){
 const url=new URL(path,base);
 if(url.origin!==new URL(base).origin)throw new Error('Refusing off-site request: '+url.href);
 const res=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'manual',headers:{'user-agent':'PARTYPRINT-SearchAudit/1.0'}});
 return {status:res.status,body:await res.text(),headers:res.headers};
}
async function html(path){
 try{
  const r=await read(path);
  check(path+' HTTP',r.status===200,'HTTP '+r.status);
  if(r.status!==200)return;
  check(path+' HTML',(r.headers.get('content-type')||'').includes('text/html'));
  const links=[...r.body.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0]));
  const canonical=links.filter(a=>a.rel==='canonical');
  const expected=new URL(path,PUBLIC_ORIGIN).href.replace(/\/$/,'');
  let actual='';
  try{actual=new URL(canonical[0]?.href||'',PUBLIC_ORIGIN).href.replace(/\/$/,'');}catch{}
  check(path+' canonical',canonical.length===1&&decodeURI(actual)===decodeURI(expected),actual);
  const meta=[...r.body.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));
  check(path+' description',meta.some(a=>a.name==='description'&&a.content?.trim()));
  check(path+' title',/<title\b[^>]*>\s*[^<]+<\/title>/i.test(r.body));
  check(path+' H1',(r.body.match(/<h1(?:\s|>)/gi)||[]).length===1);
  check(path+' indexable',!meta.some(a=>a.name?.toLowerCase()==='robots'&&/\bnoindex\b/i.test(a.content||''))&&!/\bnoindex\b/i.test(r.headers.get('x-robots-tag')||''));
  let valid=true;
  for(const match of r.body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(attributes(match[1]).type!=='application/ld+json')continue;
   try{JSON.parse(match[2]);}catch{valid=false;}
  }
  check(path+' valid JSON-LD',valid);
  if(path!=='/')check(path+' no inherited homepage WebPage',!/"@type"\s*:\s*"WebPage"\s*,\s*"@id"\s*:\s*"https:\/\/partyprint\.co\.il\/#webpage"/.test(r.body));
 }catch(error){check(path+' fetch',false,String(error.message));}
}
try{
 const robots=await read('/robots.txt');
 check('robots.txt HTTP',robots.status===200,'HTTP '+robots.status);
 for(const bot of ['OAI-SearchBot','Claude-SearchBot','PerplexityBot'])check('robots '+bot,robots.body.includes(bot));
 check('robots sitemap',robots.body.includes(PUBLIC_ORIGIN+'/sitemap.xml'));
 const sitemap=await read('/sitemap.xml');
 check('sitemap.xml HTTP',sitemap.status===200,'HTTP '+sitemap.status);
 const urls=sitemapUrls(sitemap.body);
 check('sitemap unique',new Set(urls).size===urls.length);
 check('sitemap discovery',urls.length>=20,urls.length+' page URLs');
 const validUrls=[];
 for(const value of urls){try{publicPageUrl(value);validUrls.push(value);}catch(error){check('sitemap canonical HTML',false,error.message);}}
 const paths=validUrls.map(value=>new URL(value).pathname);
 if(local)for(const path of required)check('sitemap '+path,paths.some(x=>decodeURI(x).replace(/\/$/,'')===path.replace(/\/$/,'')));
 const targets=[...new Set(local?[...required,...paths.filter(path=>path.startsWith('/guides/')||path.startsWith('/work/'))]:[...required,...paths])];
 if(targets.length>500)throw new Error('Audit limited to 500 pages; split the audit explicitly.');
 for(let i=0;i<targets.length;i+=4)await Promise.all(targets.slice(i,i+4).map(html));
 for(const group of ['guides','work',...(local?[]:['blog'])]){
  const missing=await read('/'+group+'/__search-audit-missing__');
  check(group+' missing page returns 404',missing.status===404,'HTTP '+missing.status);
 }
 if(local){
  for(const path of ['/','/ordering-guide?utm_source=redirect-audit']){
   const res=await new Promise((resolve,reject)=>{
    const request=httpRequest(base+path,{method:'HEAD',headers:{host:'www.partyprint.co.il'}},response=>{response.resume();resolve({status:response.statusCode,location:response.headers.location});});
    request.setTimeout(15000,()=>request.destroy(new Error('Redirect check timed out')));request.on('error',reject);request.end();
   });
   check('www canonical redirect '+path,res.status===308&&res.location===PUBLIC_ORIGIN+path,'HTTP '+res.status+' '+res.location);
  }
 }
 if(local){
  const preview=await new Promise((resolve,reject)=>{
   const req=httpRequest(base+'/',{method:'HEAD',headers:{host:'partyprint-ai.atzilul.chatgpt.site'}},res=>{res.resume();resolve({status:res.statusCode,noindex:res.headers['x-robots-tag']});});
   req.setTimeout(15000,()=>req.destroy(new Error('Preview header check timed out')));req.on('error',reject);req.end();
  });
  check('managed preview host noindex',preview.status===200&&/\bnoindex\b/.test(preview.noindex||''),'HTTP '+preview.status+' '+preview.noindex);
  const admin=await read('/admin');
  check('unauthenticated admin remains protected',[301,302,303,307,308,401,403].includes(admin.status),'HTTP '+admin.status);
  check('admin response noindex',/\bnoindex\b/.test(admin.headers.get('x-robots-tag')||''));
 }
 if(local){const api=await read('/api/analytics-config');check('private API noindex',/\bnoindex\b/.test(api.headers.get('x-robots-tag')||''));}
}catch(error){check('audit completed',false,error.message);}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/search-audit.json',JSON.stringify(report,null,2));
console.log('Search audit: '+report.checks.length+' checks; '+report.errors.length+' errors. Report: artifacts/search-audit.json');
if(report.errors.length)process.exitCode=1;
