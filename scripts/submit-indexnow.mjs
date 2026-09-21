const baseUrl = (process.env.PARTYPRINT_PUBLIC_URL || 'https://partyprint.co.il').replace(/\/$/, '');
const keyFile = process.env.PARTYPRINT_INDEXNOW_KEY_FILE || '/partyprint-indexnow-20260921-7e9a4c2f.txt';
const keyLocation = `${baseUrl}${keyFile}`;

async function readText(url) {
  const response = await fetch(url, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

const key = (await readText(keyLocation)).trim();
const sitemap = await readText(`${baseUrl}/sitemap.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim()).filter(Boolean);
if (!key || urls.length === 0) throw new Error('IndexNow key or sitemap URLs are missing.');

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {'content-type': 'application/json; charset=utf-8'},
  body: JSON.stringify({host: new URL(baseUrl).host, key, keyLocation, urlList: urls}),
});

console.log(`IndexNow submitted ${urls.length} URLs: HTTP ${response.status}`);
if (!response.ok && response.status !== 202) {
  console.error(await response.text());
  process.exitCode = 1;
}
