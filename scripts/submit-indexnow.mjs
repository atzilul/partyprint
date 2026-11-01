import {PUBLIC_ORIGIN,sitemapUrls,publicPageUrl,indexNowKey} from './search-utils.mjs';
const baseUrl=(process.env.PARTYPRINT_PUBLIC_URL||PUBLIC_ORIGIN).replace(/\/$/,'');
if(baseUrl!==PUBLIC_ORIGIN)throw new Error('IndexNow submissions are restricted to verified production: '+PUBLIC_ORIGIN);
const keyFile=process.env.PARTYPRINT_INDEXNOW_KEY_FILE||'/partyprint-indexnow-20260921-7e9a4c2f.txt';
const keyLocation=new URL(keyFile,baseUrl);
if(keyLocation.origin!==baseUrl||keyLocation.search||keyLocation.hash)throw new Error('Key location must be on production.');
async function readText(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!response.ok)throw new Error(url+' returned HTTP '+response.status);
 return response.text();
}
const key=indexNowKey(await readText(keyLocation));
const raw=sitemapUrls(await readText(baseUrl+'/sitemap.xml'));
const urls=[...new Set(raw.map(value=>publicPageUrl(value)))];
if(!urls.length||urls.length>10000)throw new Error('Expected 1–10,000 canonical HTML URLs.');
if(!process.argv.includes('--submit')){
 console.log(JSON.stringify({mode:'dry-run',host:new URL(baseUrl).host,keyLocation:keyLocation.href,urlList:urls},null,2));
 console.log('Nothing submitted. After verifying the Hostinger deployment, run npm run seo:indexnow -- --submit.');
}else{
 const response=await fetch('https://api.indexnow.org/indexnow',{
  method:'POST',signal:AbortSignal.timeout(15000),
  headers:{'content-type':'application/json; charset=utf-8'},
  body:JSON.stringify({host:new URL(baseUrl).host,key,keyLocation:keyLocation.href,urlList:urls}),
 });
 console.log('IndexNow received '+urls.length+' URLs: HTTP '+response.status+'. This is not proof of indexing.');
 if(response.status!==200&&response.status!==202)throw new Error('IndexNow rejected the request (HTTP '+response.status+').');
}
