import test from 'node:test';
import assert from 'node:assert/strict';
import {sitemapUrls,publicPageUrl,indexNowKey,attributes} from './search-utils.mjs';
test('sitemap page loc excludes namespaced images and decodes XML',()=>{
 const xml='<urlset xmlns:image="x"><url><loc>https://partyprint.co.il/about</loc><image:image><image:loc>https://partyprint.co.il/a.webp</image:loc></image:image></url><url><loc>https://partyprint.co.il/?a=1&amp;b=2</loc></url></urlset>';
 assert.deepEqual(sitemapUrls(xml),['https://partyprint.co.il/about','https://partyprint.co.il/?a=1&b=2']);
});
test('HTML/invalid sitemap cannot produce submissions',()=>{
 assert.throws(()=>sitemapUrls('<html><loc>https://partyprint.co.il/</loc></html>'));
 assert.throws(()=>sitemapUrls('<urlset><url><image:loc>x</image:loc></url></urlset>'));
});
test('submission rejects preview hosts, private data, fragments and files',()=>{
 for(const url of ['https://partyprint-ai.atzilul.chatgpt.site/','http://partyprint.co.il/','https://partyprint.co.il.evil.example/','https://partyprint.co.il/track/secret','https://partyprint.co.il/%61pi/orders','https://partyprint.co.il/about?x=1','https://partyprint.co.il/#order','https://partyprint.co.il/blog/feed.xml','https://partyprint.co.il/shirt.webp']){
  assert.throws(()=>publicPageUrl(url),url);
 }
 assert.equal(publicPageUrl('https://partyprint.co.il/about'),'https://partyprint.co.il/about');
 assert.equal(publicPageUrl('https://partyprint.co.il/guides/הדפסה-על-חולצות'),new URL('https://partyprint.co.il/guides/הדפסה-על-חולצות').href);
});
test('invalid ownership keys are not posted',()=>{
 assert.equal(indexNowKey('  partyprint-12345678\n'),'partyprint-12345678');
 for(const value of ['', '123', '<html>error</html>','key with spaces'])assert.throws(()=>indexNowKey(value));
});
test('HTML attributes handle reordered metadata and XML entities',()=>{
 assert.deepEqual(attributes('<link href="https://partyprint.co.il/a?x=1&amp;y=2" rel="canonical">'),{href:'https://partyprint.co.il/a?x=1&y=2',rel:'canonical'});
});
