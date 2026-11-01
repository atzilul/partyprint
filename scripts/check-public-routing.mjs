import {mkdir,writeFile} from 'node:fs/promises';
const allowed=new Set(['partyprint.co.il','www.partyprint.co.il','partyprint-ai.atzilul.chatgpt.site']);
const inputs=['http://partyprint.co.il/','https://www.partyprint.co.il/','http://www.partyprint.co.il/','https://partyprint.co.il/','https://partyprint-ai.atzilul.chatgpt.site/'];
const results=[];
for(const input of inputs){
 const hops=[];let current=input;
 try{
  for(let i=0;i<7;i++){
   const url=new URL(current);if(!allowed.has(url.hostname))throw Error('Redirect leaves known site hosts');
   const response=await fetch(url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(12000)});
   const raw=response.headers.get('location');
   const next=raw?new URL(raw,url):null;
   hops.push({url:url.origin+url.pathname,status:response.status,noindex:/\bnoindex\b/i.test(response.headers.get('x-robots-tag')||''),location:next?next.origin+next.pathname:null});
   if(response.status>=300&&response.status<400&&next){
    if(hops.some(h=>h.url===next.origin+next.pathname))throw Error('Redirect loop');
    if(!allowed.has(next.hostname)){results.push({input,hops,status:'off-site redirect observed; not followed'});break;}
    current=next.href;continue;
   }
   results.push({input,hops,status:input.includes('chatgpt.site')?'preview observation; indexing/access needs separate verification':response.status===200&&url.origin==='https://partyprint.co.il'?'canonical destination reached':'needs review'});
   break;
  }
  if(!results.some(r=>r.input===input))results.push({input,hops,status:'redirect limit exceeded'});
 }catch(error){results.push({input,hops,status:'unverified',error:error.message});}
}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/public-routing.json',JSON.stringify({at:new Date().toISOString(),results},null,2));
console.log(JSON.stringify(results,null,2));
