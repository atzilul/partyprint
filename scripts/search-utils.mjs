export const PUBLIC_ORIGIN='https://partyprint.co.il';
export const PRIVATE_PREFIXES=['/admin','/api','/design','/track','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth'];
export function decodeXml(value){return value.replace(/&(?:amp|quot|apos|lt|gt);/g,token=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[token]));}
export function sitemapUrls(xml){
 if(!/<urlset(?:\s|>)/i.test(xml))throw new Error('Expected a sitemap urlset, not an HTML page or sitemap index.');
 const blocks=[...xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/gi)];
 return blocks.map(([,block])=>{
  const loc=block.match(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/i);
  if(!loc)throw new Error('A sitemap entry has no page loc.');
  return decodeXml(loc[1].trim());
 });
}
export function publicPageUrl(value,origin=PUBLIC_ORIGIN){
 const url=new URL(value);
 const path=decodeURIComponent(url.pathname);
 if(url.origin!==origin||url.username||url.password||url.search||url.hash)throw new Error('URL is outside the canonical public site: '+value);
 if(PRIVATE_PREFIXES.some(prefix=>path===prefix||path.startsWith(prefix+'/')))throw new Error('Private URL cannot be submitted: '+value);
 if(/\.(?:xml|txt|webp|png|jpe?g|gif|svg|pdf|js|css)$/i.test(path))throw new Error('Expected an HTML page URL: '+value);
 return url.href;
}
export function indexNowKey(value){
 const key=value.trim();
 if(!/^[a-zA-Z0-9-]{8,128}$/.test(key))throw new Error('Invalid IndexNow key format.');
 return key;
}
export function attributes(tag){
 return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(([,name,value])=>[name.toLowerCase(),decodeXml(value)]));
}
